const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// @route   POST /api/questions
// @desc    Add a question
// @access  Teacher
router.post('/', [auth, checkRole(['teacher'])], async (req, res) => {
    try {
        // Teacher can only add question for their assigned subject
        const questionData = { ...req.body, subject: req.user.subject, createdBy: req.user.id };
        
        // Auto-generate Question ID
        const count = await Question.countDocuments();
        questionData.questionId = `Q-${req.user.subject.substring(0,3).toUpperCase()}-${Date.now()}-${count+1}`;

        const question = new Question(questionData);
        await question.save();
        res.json(question);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/questions
// @desc    Get questions filtered by subject
// @access  Teacher
router.get('/', [auth, checkRole(['teacher'])], async (req, res) => {
    try {
        const { classes, chapter, concept, level, type } = req.query;
        let query = { subject: req.user.subject };
        
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
