const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');
const multer = require('multer');

// Setup memory storage for parsing files
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// @route   POST /api/papers
// @desc    Save a paper (supports both Teacher and Admin)
// @access  Teacher / Admin
router.post('/', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        const subject = req.user.role === 'admin' ? (req.body.subject || 'General') : req.user.subject;
        const paperData = {
            ...req.body,
            subject,
            teacherId: req.user.id,
            status: req.user.role === 'admin' ? 'Approved' : 'Pending Approval'
        };
        const paper = new Paper(paperData);
        await paper.save();
        res.json(paper);
    } catch (err) {
        console.error('Save paper error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/papers/admin/all
// @desc    Get all papers (Admin)
// @access  Admin
router.get('/admin/all', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const papers = await Paper.find().populate('questions');
        res.json(papers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/papers/admin/:id/status
// @desc    Update paper status (Admin)
// @access  Admin
router.put('/admin/:id/status', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { status } = req.body;
        if (!['Pending Approval', 'Approved', 'Rejected'].includes(status)) {
            return res.status(400).json({ msg: 'Invalid status' });
        }
        
        const paper = await Paper.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { new: true }
        );
        
        if (!paper) return res.status(404).json({ msg: 'Paper not found' });
        
        res.json(paper);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/papers/by-type/:type
// @desc    Get papers by paperType (Standard, GrandTest, PYQ)
// @access  Teacher, Admin
router.get('/by-type/:type', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        let query = { paperType: req.params.type };
        if (req.user.role === 'teacher') {
            query.teacherId = req.user.id;
        }
        const papers = await Paper.find(query).populate('questions').sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/papers/:id/duplicate
// @desc    Duplicate a paper (supports GT versioning and copy)
// @access  Teacher, Admin
router.post('/:id/duplicate', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        const originalPaper = await Paper.findById(req.params.id);
        if (!originalPaper) return res.status(404).json({ msg: 'Paper not found' });

        const { isRevision, newTitle } = req.body;
        
        let version = originalPaper.version || 1;
        let revision = originalPaper.revision || 0;
        let parentPaperId = originalPaper.parentPaperId || originalPaper._id;

        if (isRevision) {
            revision += 1;
        } else {
            version += 1;
            revision = 0;
            parentPaperId = undefined;
        }

        const title = newTitle || (isRevision 
            ? `${originalPaper.title.split(' Revision')[0]} Revision ${revision}`
            : `${originalPaper.title} (Copy)`);

        const newPaper = new Paper({
            title,
            subject: originalPaper.subject,
            classes: originalPaper.classes,
            teacherId: req.user.id,
            questions: originalPaper.questions,
            templateId: originalPaper.templateId,
            pattern: originalPaper.pattern,
            paperType: originalPaper.paperType,
            examType: originalPaper.examType,
            year: originalPaper.year,
            version,
            revision,
            parentPaperId,
            status: req.user.role === 'admin' ? 'Approved' : 'Pending Approval'
        });

        await newPaper.save();
        res.json(newPaper);
    } catch (err) {
        console.error('Duplicate paper error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST /api/papers/parse-file
// @desc    Parse uploaded PDF/TXT/Image or pasted text with Gemini
// @access  Admin
router.post('/parse-file', [auth, checkRole(['admin']), upload.single('file')], async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'Gemini API Key is not configured on the server.' });
        }

        let parts = [];
        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            parts.push({
                inlineData: {
                    mimeType: req.file.mimetype,
                    data: base64Data
                }
            });
        }

        const textInput = req.body.text || '';
        if (textInput) {
            parts.push({ text: `Text content of the paper:\n\n${textInput}` });
        }

        parts.push({
            text: `You are an expert exam paper parser. Parse the provided document or text into a structured JSON array of questions.
Each question in the JSON array must strictly follow this JSON schema structure:
{
  "questionId": "A unique temporary slug or index like 'Q-1', 'Q-2'",
  "chapter": "Determine the chapter or domain of the question (e.g., 'Electrostatics', 'Organic Chemistry')",
  "concept": "Determine the concept of the question (e.g., 'Coulombs Law', 'Aldehydes')",
  "subConcept": "Determine the subconcept of the question if any",
  "level": "One of: 'easy', 'medium', 'hard'",
  "type": "One of: 'MCQ', 'Assertion & Reason', 'Statement Based', 'True / False', 'Match the Following', 'Numerical', 'Diagram Based'",
  "questionText": "The actual question text. For matching types, list the columns. Preserve formatting.",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "answer": "The correct answer (e.g. 'A', 'B', 'True', or the numeric value like '5')",
  "solutionText": "A detailed step-by-step solution or explanation for the question"
}

Provide ONLY a raw JSON array. Do not include markdown code block formatting (like \`\`\`json). Just the raw JSON array.
If options are present, separate them cleanly. For numerical questions, identify the correct numerical answer.`
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: {
                    responseMimeType: "application/json"
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('Gemini error:', errData);
            return res.status(502).json({ msg: 'Gemini parsing failed', error: errData });
        }

        const data = await response.json();
        const parsedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        let questions = [];
        try {
            questions = JSON.parse(parsedText);
        } catch (e) {
            console.error('Error parsing JSON from Gemini:', parsedText);
            return res.status(500).json({ msg: 'Failed to parse Gemini output as JSON', raw: parsedText });
        }

        res.json({ questions });
    } catch (err) {
        console.error('Parse file error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST /api/papers/save-pyq
// @desc    Save PYQ and seed questions to Question repository
// @access  Admin
router.post('/save-pyq', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { title, subject, classes, year, examType, questions } = req.body;
        
        if (!questions || !Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ msg: 'No questions provided for the PYQ' });
        }

        const savedQuestionIds = [];
        let count = await Question.countDocuments();

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const ts = Date.now();
            const qId = `Q-PYQ-${subject.substring(0,3).toUpperCase()}-${ts}-${count + i + 1}`;

            const newQuestion = new Question({
                questionId: qId,
                subject,
                classes: Array.isArray(classes) ? classes : [classes],
                chapter: q.chapter || 'General',
                concept: q.concept || 'General',
                subConcept: q.subConcept || '',
                level: q.level || 'medium',
                type: q.type || 'MCQ',
                questionText: q.questionText,
                options: q.options || [],
                answer: q.answer || '',
                solutionText: q.solutionText || '',
                createdBy: req.user.id
            });

            const savedQ = await newQuestion.save();
            savedQuestionIds.push(savedQ._id);
        }

        const paper = new Paper({
            title,
            subject,
            classes: Array.isArray(classes) ? classes : [classes],
            teacherId: req.user.id,
            questions: savedQuestionIds,
            paperType: 'PYQ',
            examType: examType || 'Custom',
            year: year || new Date().getFullYear(),
            status: 'Approved'
        });

        await paper.save();
        res.json({ paper, questionCount: savedQuestionIds.length });
    } catch (err) {
        console.error('Save PYQ error:', err);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET /api/papers
// @desc    Get all papers of a teacher (or all papers if admin)
// @access  Teacher, Admin
router.get('/', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher') {
            query.teacherId = req.user.id;
        }
        const papers = await Paper.find(query).populate('questions').sort({ createdAt: -1 });
        res.json(papers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/papers/:id
// @desc    Get a single paper
// @access  Teacher, Admin
router.get('/:id', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id).populate('questions');
        if (!paper) return res.status(404).json({ msg: 'Paper not found' });
        res.json(paper);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/papers/:id
// @desc    Delete a paper
// @access  Teacher, Admin
router.delete('/:id', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ msg: 'Paper not found' });
        
        if (req.user.role !== 'admin' && paper.teacherId.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        await Paper.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Paper removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
