const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// @route   POST /api/papers
// @desc    Save a paper
// @access  Teacher
router.post('/', [auth, checkRole(['teacher'])], async (req, res) => {
    try {
        const paperData = {
            ...req.body,
            subject: req.user.subject,
            teacherId: req.user.id
        };
        const paper = new Paper(paperData);
        await paper.save();
        res.json(paper);
    } catch (err) {
        console.error(err.message);
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

// @route   GET /api/papers
// @desc    Get all papers of a teacher (or all papers if admin)
// @access  Teacher, Admin
router.get('/', [auth, checkRole(['teacher', 'admin'])], async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'teacher') {
            query.teacherId = req.user.id;
        }
        const papers = await Paper.find(query).populate('questions');
        res.json(papers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/papers/:id
// @desc    Get a single paper
// @access  Teacher
router.get('/:id', [auth, checkRole(['teacher'])], async (req, res) => {
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
// @access  Teacher
router.delete('/:id', [auth, checkRole(['teacher'])], async (req, res) => {
    try {
        const paper = await Paper.findById(req.params.id);
        if (!paper) return res.status(404).json({ msg: 'Paper not found' });
        
        if (paper.teacherId.toString() !== req.user.id) {
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
