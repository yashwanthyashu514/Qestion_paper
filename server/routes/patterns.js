const express = require('express');
const router = express.Router();
const ExamPattern = require('../models/ExamPattern');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// @route   GET /api/patterns
// @desc    Get all exam pattern templates
// @access  Admin & Teacher
router.get('/', auth, async (req, res) => {
    try {
        const patterns = await ExamPattern.find().sort({ createdAt: -1 });
        res.json(patterns);
    } catch (err) {
        console.error('Get patterns error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/patterns
// @desc    Create or update an exam pattern template
// @access  Admin
router.post('/', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { name, examType, description, sections } = req.body;
        
        if (!name || !examType || !sections || !Array.isArray(sections) || sections.length === 0) {
            return res.status(400).json({ msg: 'Please provide all required fields and sections.' });
        }

        const newPattern = new ExamPattern({
            name,
            examType,
            description,
            sections,
            createdBy: req.user.id
        });

        await newPattern.save();
        res.json(newPattern);
    } catch (err) {
        console.error('Create pattern error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/patterns/:id
// @desc    Delete an exam pattern template
// @access  Admin
router.delete('/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const pattern = await ExamPattern.findById(req.params.id);
        if (!pattern) return res.status(404).json({ msg: 'Exam pattern not found' });

        await ExamPattern.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Exam pattern removed' });
    } catch (err) {
        console.error('Delete pattern error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
