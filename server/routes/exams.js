const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const OnlineExam = require('../models/OnlineExam');
const ExamSession = require('../models/ExamSession');
const BridgeKey = require('../models/BridgeKey');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { detectLabIp } = require('../middleware/labIp');

// ─────────────────────────────────────────────────────────────────
// ADMIN: Merge 3 papers into one OnlineExam
// POST /api/exams/merge
// ─────────────────────────────────────────────────────────────────
router.post('/merge', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { title, examType, paperIds, instructions, start_time, end_time, duration_minutes } = req.body;

        if (!['JEE', 'NEET', 'CET'].includes(examType)) {
            return res.status(400).json({ msg: 'Invalid exam type. Must be JEE, NEET, or CET.' });
        }
        
        const reqCount = examType === 'JEE' ? 3 : 4;

        if (!paperIds || paperIds.length === 0) {
            return res.status(400).json({ msg: `At least 1 paper must be selected.` });
        }

        // Fetch all selected papers with questions populated
        console.log("Merge Request - paperIds:", paperIds);
        const { Types: { ObjectId } } = require('mongoose');
        const objectIds = paperIds.map(id => typeof id === 'string' ? new ObjectId(id) : id);
        const papers = await Paper.find({ _id: { $in: objectIds } }).populate('questions');
        console.log("Merge Request - Found papers:", papers.length);

        if (papers.length !== paperIds.length) {
            return res.status(404).json({ msg: `One or more papers not found. Expected ${paperIds.length}, found ${papers.length}.` });
        }

        // Validate subjects (DISABLED FOR TESTING)
        /*
        const subjectsFound = papers.map(p => p.subject.toLowerCase().trim());
        let requiredSubjects = [];
        if (examType === 'JEE') requiredSubjects = ['physics', 'chemistry', 'mathematics'];
        if (examType === 'NEET') requiredSubjects = ['physics', 'chemistry', 'botany', 'zoology'];
        if (examType === 'CET') requiredSubjects = ['physics', 'chemistry', 'mathematics', 'biology'];

        const missingSubjects = requiredSubjects.filter(sub => !subjectsFound.some(found => found.includes(sub)));
        if (missingSubjects.length > 0) {
            return res.status(400).json({ msg: `Missing required subjects for ${examType}: ${missingSubjects.join(', ')}` });
        }

        // Validate question counts per subject
        const expectedQCount = examType === 'JEE' ? 30 : examType === 'NEET' ? 50 : 60; // CET = 60
        for (const p of papers) {
            if (p.questions.length !== expectedQCount) {
                return res.status(400).json({ msg: `Paper '${p.title}' (${p.subject}) has ${p.questions.length} questions. ${examType} requires exactly ${expectedQCount} questions per subject.` });
            }
        }
        */

        // Merge questions from all 3 papers, deduplicate by _id
        const seen = new Set();
        const mergedQuestions = [];
        for (const paper of papers) {
            for (const q of paper.questions) {
                if (!seen.has(q._id.toString())) {
                    seen.add(q._id.toString());
                    mergedQuestions.push({
                        questionId: q._id,
                        subject: q.subject,
                        chapter: q.chapter,
                        concept: q.concept,
                        questionText: q.questionText,
                        options: q.options || [],
                        answer: q.answer,
                        imageUrl: q.imageUrl,
                        marks: 4
                    });
                }
            }
        }

        const exam = new OnlineExam({
            title: title || `Merged ${examType} Exam`,
            examType,
            sourcePapers: paperIds,
            questions: mergedQuestions,
            instructions: instructions || getDefaultInstructions(examType),
            start_time: start_time || null,
            end_time: end_time || null,
            duration_minutes: duration_minutes || 180,
            status: start_time ? 'scheduled' : 'draft',
            createdBy: req.user.id
        });

        await exam.save();
        if (['live', 'scheduled'].includes(exam.status)) {
            await OnlineExam.updateMany(
                { _id: { $ne: exam._id }, status: { $in: ['live', 'scheduled'] } },
                { $set: { status: 'ended' } }
            );
        }
        res.status(201).json({ msg: 'Exam created successfully', exam });
    } catch (err) {
        console.error('Merge error:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: List all online exams
// GET /api/exams
// ─────────────────────────────────────────────────────────────────
router.get('/', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const now = new Date();
        
        // 1. Transition scheduled -> live
        await OnlineExam.updateMany(
            { status: 'scheduled', start_time: { $lte: now } },
            { $set: { status: 'live' } }
        );
        
        // 2. Transition live -> ended
        await OnlineExam.updateMany(
            { status: 'live', end_time: { $lte: now } },
            { $set: { status: 'ended' } }
        );

        const exams = await OnlineExam.find()
            .select('-questions.answer') // Don't leak answers in list view
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email');
        res.json(exams);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Get single exam (full, with answers for admin)
// GET /api/exams/admin/:id
// ─────────────────────────────────────────────────────────────────
router.get('/admin/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        res.json(exam);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Update exam config (timing, instructions, status)
// PUT /api/exams/:id/config
// ─────────────────────────────────────────────────────────────────
router.put('/:id/config', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { start_time, end_time, duration_minutes, instructions, status } = req.body;
        const update = {};
        if (start_time !== undefined) update.start_time = start_time;
        if (end_time !== undefined) update.end_time = end_time;
        if (duration_minutes !== undefined) update.duration_minutes = duration_minutes;
        if (instructions !== undefined) update.instructions = instructions;
        if (status !== undefined) update.status = status;
        update.updatedAt = new Date();

        const exam = await OnlineExam.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (['live', 'scheduled'].includes(exam.status)) {
            await OnlineExam.updateMany(
                { _id: { $ne: exam._id }, status: { $in: ['live', 'scheduled'] } },
                { $set: { status: 'ended' } }
            );
        }
        res.json({ msg: 'Exam updated', exam });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Delete exam
// DELETE /api/exams/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        
        await OnlineExam.findByIdAndDelete(req.params.id);
        await ExamSession.deleteMany({ examId: req.params.id });
        
        res.json({ msg: 'Exam deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// STUDENT: Get exam for taking (NO answers)
// GET /api/exams/:id/take
// ─────────────────────────────────────────────────────────────────
router.get('/:id/take', detectLabIp, async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });
        if (!['live', 'scheduled'].includes(exam.status)) {
            return res.status(403).json({ msg: 'Exam is not currently available.' });
        }

        // Strip answers before sending to student
        const safeExam = {
            _id: exam._id,
            title: exam.title,
            examType: exam.examType,
            instructions: exam.instructions,
            duration_minutes: exam.duration_minutes,
            start_time: exam.start_time,
            end_time: exam.end_time,
            questions: exam.questions.map(q => ({
                _id: q._id,
                questionId: q.questionId,
                subject: q.subject,
                chapter: q.chapter,
                concept: q.concept,
                questionText: q.questionText,
                options: q.options,
                imageUrl: q.imageUrl,
                marks: q.marks
            }))
        };
        res.json(safeExam);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// STUDENT: Start session
// POST /api/exams/:id/start
// ─────────────────────────────────────────────────────────────────
router.post('/:id/start', detectLabIp, async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        const { studentName, studentEmail, rollNumber } = req.body;

        // Check for existing active session
        const existing = await ExamSession.findOne({
            examId: req.params.id,
            studentEmail,
            submitted: false
        });
        if (existing) return res.json({ msg: 'Session resumed', session: existing });

        const session = new ExamSession({
            examId: req.params.id,
            studentId: rollNumber || studentEmail || 'anonymous',
            studentName: studentName || 'Student',
            studentEmail: studentEmail || '',
            rollNumber: rollNumber || '',
            fromLabIp: req.isLabIp,
            clientIp: req.clientIp,
            startTime: new Date(),
            answers: exam.questions.map(q => ({
                questionId: q._id,
                selectedOption: null,
                markedForReview: false,
                visited: false
            })),
            totalQuestions: exam.questions.length
        });

        await session.save();
        res.status(201).json({ msg: 'Session started', session });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// STUDENT: Submit exam
// POST /api/exams/:id/submit
// ─────────────────────────────────────────────────────────────────
router.post('/:id/submit', detectLabIp, async (req, res) => {
    try {
        const { sessionId, answers } = req.body;

        const session = await ExamSession.findById(sessionId);
        if (!session) return res.status(404).json({ msg: 'Session not found' });
        if (session.submitted) return res.json({ msg: 'Already submitted', session });

        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        // Build answer map from submission
        const answerMap = {};
        if (answers && Array.isArray(answers)) {
            answers.forEach(a => { answerMap[a.questionId] = a; });
        }

        // Compute analytics
        let score = 0, correct = 0, incorrect = 0, unattempted = 0;
        const weakMap = {};

        const processedAnswers = exam.questions.map(q => {
            const sid = q._id.toString();
            const submitted = answerMap[sid];
            const selected = submitted?.selectedOption || null;
            const markedForReview = submitted?.markedForReview || false;

            let result = 'unattempted';
            if (selected !== null && selected !== '') {
                if (selected === q.answer) {
                    score += 4;
                    correct++;
                    result = 'correct';
                } else {
                    score -= 1;
                    incorrect++;
                    result = 'incorrect';
                    // Track weak areas
                    const key = `${q.subject}::${q.chapter}`;
                    if (!weakMap[key]) weakMap[key] = { subject: q.subject, chapter: q.chapter, incorrect: 0 };
                    weakMap[key].incorrect++;
                }
            } else {
                unattempted++;
            }

            return { questionId: q._id, selectedOption: selected, markedForReview, visited: true };
        });

        const weakAreas = Object.values(weakMap).sort((a, b) => b.incorrect - a.incorrect);

        session.answers = processedAnswers;
        session.endTime = new Date();
        session.submitted = true;
        session.score = score;
        session.correct = correct;
        session.incorrect = incorrect;
        session.unattempted = unattempted;
        session.attempted = correct + incorrect;
        session.weakAreas = weakAreas;
        session.fromLabIp = req.isLabIp;
        session.clientIp = req.clientIp;

        await session.save();
        res.json({ msg: 'Exam submitted successfully', sessionId: session._id });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// STUDENT: Get scorecard (IP-conditional answer key)
// GET /api/exams/:id/scorecard/:sessionId
// ─────────────────────────────────────────────────────────────────
router.get('/:id/scorecard/:sessionId', detectLabIp, async (req, res) => {
    try {
        const session = await ExamSession.findById(req.params.sessionId);
        if (!session) return res.status(404).json({ msg: 'Session not found' });

        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        const isLab = session.fromLabIp || req.isLabIp;

        // Build question-level breakdown
        const originalQuestionIds = exam.questions.map(q => q.questionId).filter(Boolean);
        const originalQuestions = await Question.find({ _id: { $in: originalQuestionIds } });
        const originalQuestionsMap = {};
        originalQuestions.forEach(oq => {
            originalQuestionsMap[oq._id.toString()] = oq;
        });

        const breakdown = exam.questions.map(q => {
            const ans = session.answers.find(a => a.questionId?.toString() === q._id?.toString());
            const origQ = q.questionId ? originalQuestionsMap[q.questionId.toString()] : null;
            const entry = {
                _id: q._id,
                questionId: q.questionId,
                questionText: q.questionText,
                subject: q.subject,
                chapter: q.chapter,
                options: q.options,
                selectedOption: ans?.selectedOption || null,
                markedForReview: ans?.markedForReview || false,
                solutionText: origQ?.solutionText || '',
                solutionImageUrl: origQ?.solutionImageUrl || ''
            };

            // Conditionally expose correct answer
            if (!isLab) {
                entry.correctAnswer = q.answer;
            }

            return entry;
        });

        res.json({
            sessionId: session._id,
            studentName: session.studentName,
            studentEmail: session.studentEmail,
            rollNumber: session.rollNumber,
            examTitle: exam.title,
            examType: exam.examType,
            score: session.score,
            totalQuestions: session.totalQuestions,
            attempted: session.attempted,
            correct: session.correct,
            incorrect: session.incorrect,
            unattempted: session.unattempted,
            weakAreas: session.weakAreas,
            isLabSession: isLab,
            answerKeyHidden: isLab,
            breakdown
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Get all results for an exam
// GET /api/exams/:id/results
// ─────────────────────────────────────────────────────────────────
router.get('/:id/results', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const sessions = await ExamSession.find({ examId: req.params.id, submitted: true })
            .sort({ score: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Generate Bridge Key
// POST /api/exams/:id/bridge-key
// ─────────────────────────────────────────────────────────────────
router.post('/:id/bridge-key', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const exam = await OnlineExam.findById(req.params.id);
        if (!exam) return res.status(404).json({ msg: 'Exam not found' });

        // Generate only once: check if a bridge key already exists for this exam
        let bridgeKey = await BridgeKey.findOne({ examId: exam._id });
        if (bridgeKey) {
            return res.json({ msg: 'Bridge key retrieved', key: bridgeKey.key, expiresAt: bridgeKey.expiresAt });
        }

        const key = crypto.randomBytes(24).toString('hex');
        bridgeKey = new BridgeKey({
            key,
            examId: exam._id,
            examTitle: exam.title,
            generatedBy: req.user.id,
            expiresAt: new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000) // 10 years (static)
        });
        await bridgeKey.save();
        res.json({ msg: 'Bridge key generated', key, expiresAt: bridgeKey.expiresAt });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// BRIDGE APP: Fetch results by key
// GET /api/exams/bridge/:key
// ─────────────────────────────────────────────────────────────────
router.get('/bridge/:key', async (req, res) => {
    try {
        const bridgeKey = await BridgeKey.findOne({ key: req.params.key });
        if (!bridgeKey) return res.status(404).json({ msg: 'Invalid bridge key.' });

        const sessions = await ExamSession.find({ examId: bridgeKey.examId, submitted: true })
            .sort({ score: -1 });

        // Retrieve full exam data including questions and answers
        const exam = await OnlineExam.findById(bridgeKey.examId);

        res.json({
            examTitle: bridgeKey.examTitle,
            exam,
            results: sessions.map(s => ({
                studentId: s.studentId,
                studentName: s.studentName,
                rollNumber: s.rollNumber,
                studentEmail: s.studentEmail,
                score: s.score,
                totalQuestions: s.totalQuestions,
                attempted: s.attempted,
                correct: s.correct,
                incorrect: s.incorrect,
                unattempted: s.unattempted,
                weakAreas: s.weakAreas,
                fromLabIp: s.fromLabIp,
                clientIp: s.clientIp,
                submittedAt: s.endTime,
                malpracticeFlag: s.malpracticeFlag || false,
                malpracticeReason: s.malpracticeReason || '',
                answers: s.answers
            }))
        });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// STUDENT: Report malpractice
// POST /api/exams/:id/malpractice
// ─────────────────────────────────────────────────────────────────
router.post('/:id/malpractice', detectLabIp, async (req, res) => {
    try {
        const { sessionId, reason } = req.body;
        const session = await ExamSession.findById(sessionId);
        if (!session) return res.status(404).json({ msg: 'Session not found' });

        session.submitted = true;
        session.endTime = new Date();
        session.malpracticeFlag = true;
        session.malpracticeReason = reason || 'Window blurred or switched tab';

        await session.save();
        res.json({ msg: 'Malpractice reported and session locked', session });
    } catch (err) {
        console.error('Error reporting malpractice:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// ADMIN: Delete online exam
// DELETE /api/exams/:id
// ─────────────────────────────────────────────────────────────────
router.delete('/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const examId = req.params.id;
        
        // 1. Delete the exam
        const exam = await OnlineExam.findByIdAndDelete(examId);
        if (!exam) {
            return res.status(404).json({ msg: 'Exam not found' });
        }

        // 2. Delete all exam sessions associated with it
        await ExamSession.deleteMany({ examId });

        // 3. Delete any bridge keys associated with it
        await BridgeKey.deleteMany({ examId });

        res.json({ msg: 'Exam deleted successfully' });
    } catch (err) {
        console.error('Error deleting exam:', err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function getDefaultInstructions(examType) {
    return `General Instructions for ${examType} Exam:
1. The clock will be set at the server. The countdown timer at the top right corner of the screen will display the remaining time for you to complete the examination.
2. When the timer reaches zero, the examination will end by itself. You need not terminate the examination.
3. To answer a question, click on one of the option buttons.
4. To deselect a chosen answer, click on the chosen option again or click the CLEAR RESPONSE button.
5. To save your answer, you MUST click the SAVE & NEXT button.
6. To mark a question for review, click the MARK FOR REVIEW & NEXT button.
7. Marking Scheme: +4 for Correct, -1 for Incorrect, 0 for Unattempted.
8. The Question Palette on the right shows the status of each question.`;
}

module.exports = router;
