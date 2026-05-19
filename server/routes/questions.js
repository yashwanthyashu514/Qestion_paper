const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

const { storage } = require('../config/cloudinary');

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// @route   POST /api/questions
// @desc    Add a question
// @access  Teacher / Admin
router.post('/', [auth, checkRole(['admin', 'teacher']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'solutionImage', maxCount: 1 }])], async (req, res) => {
    try {
        // Teacher can only add question for their assigned subject. Admin sets subject from request or defaults.
        const subject = req.user.role === 'admin' ? (req.body.subject || 'Chemistry') : req.user.subject;
        const questionData = { ...req.body, subject, createdBy: req.user.id };
        
        // Handle options array parsing since it comes as a stringified JSON in FormData
        if (req.body.options && typeof req.body.options === 'string') {
            try {
                questionData.options = JSON.parse(req.body.options);
            } catch(e) {
                console.error('Error parsing options:', e);
            }
        }
        
        // Auto-generate Question ID
        const count = await Question.countDocuments();
        questionData.questionId = `Q-${subject.substring(0,3).toUpperCase()}-${Date.now()}-${count+1}`;

        // Ensure classes is an array (frontend sends a string for single select)
        if (req.body.classes && typeof req.body.classes === 'string') {
            questionData.classes = [req.body.classes];
        }

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                questionData.imageUrl = req.files.image[0].path;
            }
            if (req.files.solutionImage && req.files.solutionImage[0]) {
                questionData.solutionImageUrl = req.files.solutionImage[0].path;
            }
        }

        const question = new Question(questionData);
        await question.save();
        res.json(question);
    } catch (err) {
        console.error('Add question error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   GET /api/questions
// @desc    Get questions filtered by subject
// @access  Teacher
router.get('/', [auth, checkRole(['admin', 'teacher'])], async (req, res) => {
    try {
        const { classes, chapter, concept, level, type } = req.query;
        let query = {};
        
        // Only filter by subject if the user is a teacher
        if (req.user.role === 'teacher') {
            query.subject = req.user.subject;
        } else if (req.query.subject) {
            // Admin can filter by subject explicitly if provided
            query.subject = req.query.subject;
        }
        
        if (classes) query.classes = { $in: classes.split(',') };
        if (chapter) query.chapter = chapter;
        if (concept) query.concept = concept;
        if (level) query.level = level;
        if (type) query.type = type;

        const questions = await Question.find(query).sort({ createdAt: -1 });
        res.json(questions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/questions/:id
// @desc    Delete a question
// @access  Teacher / Admin
router.delete('/:id', [auth, checkRole(['admin', 'teacher'])], async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });
        
        if (req.user.role !== 'admin' && question.subject !== req.user.subject) {
             return res.status(401).json({ msg: 'Not authorized to delete this subject question' });
        }
        
        await Question.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Question removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/questions/update/:id
// @desc    Update a question
// @access  Teacher / Admin
router.post('/update/:id', [auth, checkRole(['admin', 'teacher']), upload.fields([{ name: 'image', maxCount: 1 }, { name: 'solutionImage', maxCount: 1 }])], async (req, res) => {
    try {
        let question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });
        
        if (req.user.role !== 'admin' && question.subject !== req.user.subject) {
             return res.status(401).json({ msg: 'Not authorized to edit this subject question' });
        }
        
        const questionData = { ...req.body };
        
        if (req.body.options && typeof req.body.options === 'string') {
            try {
                questionData.options = JSON.parse(req.body.options);
            } catch(e) {
                console.error('Error parsing options:', e);
            }
        }

        if (req.body.classes && typeof req.body.classes === 'string') {
            questionData.classes = [req.body.classes];
        }

        if (req.files) {
            if (req.files.image && req.files.image[0]) {
                questionData.imageUrl = req.files.image[0].path;
            }
            if (req.files.solutionImage && req.files.solutionImage[0]) {
                questionData.solutionImageUrl = req.files.solutionImage[0].path;
            }
        }

        question = await Question.findByIdAndUpdate(
            req.params.id,
            { $set: questionData },
            { new: true }
        );
        
        res.json(question);
    } catch (err) {
        console.error('Update question error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

// @route   POST /api/questions/:id/solve
// @desc    Solve a question using Gemini AI if no solution is saved, otherwise return saved solution
// @access  Public
router.post('/:id/solve', async (req, res) => {
    try {
        const Question = require('../models/Question');
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });

        if (question.solutionText) {
            return res.json({
                solutionText: question.solutionText,
                solutionImageUrl: question.solutionImageUrl,
                source: 'database'
            });
        }

        // Call Gemini API
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ msg: 'Gemini API Key is not configured on the server.' });
        }

        const prompt = `Solve the following question step-by-step. Provide a clear, detailed explanation/hint for the correct answer.
        
Question: ${question.questionText}
Options:
${question.options && question.options.length > 0 ? question.options.map((opt, i) => `${String.fromCharCode(65+i)}. ${opt}`).join('\n') : 'No options provided'}
Correct Answer: ${question.answer || 'Not specified'}

Format the solution beautifully using markdown. Keep the tone helpful and academic. Provide step-by-step calculation or reasoning.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            console.error('Gemini API Error:', errData);
            return res.status(502).json({ msg: 'Failed to generate solution from Gemini AI', error: errData });
        }

        const data = await response.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!generatedText) {
            return res.status(502).json({ msg: 'Empty response from Gemini AI' });
        }

        // Save solution to database for future requests
        question.solutionText = generatedText;
        await question.save();

        res.json({
            solutionText: generatedText,
            solutionImageUrl: question.solutionImageUrl,
            source: 'gemini'
        });
    } catch (err) {
        console.error('Solve question error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
});

module.exports = router;
