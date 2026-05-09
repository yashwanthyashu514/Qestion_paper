const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// ── Absolute upload directory (works on any OS / cloud server)
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// ── Multer disk storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const safeName = 'question-' + Date.now() + path.extname(file.originalname).toLowerCase();
        cb(null, safeName);
    }
});

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
// @access  Teacher
router.post('/', [auth, checkRole(['teacher']), upload.single('image')], async (req, res) => {
    try {
        // Teacher can only add question for their assigned subject
        const questionData = { ...req.body, subject: req.user.subject, createdBy: req.user.id };
        
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
        questionData.questionId = `Q-${req.user.subject.substring(0,3).toUpperCase()}-${Date.now()}-${count+1}`;

        if (req.file) {
            // Store full URL so images display on any device
            const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
            questionData.imageUrl = `${backendUrl}/uploads/${req.file.filename}`;
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
// @access  Teacher
router.delete('/:id', [auth, checkRole(['teacher'])], async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ msg: 'Question not found' });
        
        if (question.subject !== req.user.subject) {
             return res.status(401).json({ msg: 'Not authorized to delete this subject question' });
        }
        
        await Question.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Question removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
