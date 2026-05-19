const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { labIpOnly } = require('../middleware/labIp');
const OnlineExam = require('../models/OnlineExam');

// ─────────────────────────────────────────────────────────────────
// LAB LOGIN — IP restricted
// POST /api/lab/login
// ─────────────────────────────────────────────────────────────────
router.post('/login', labIpOnly, async (req, res) => {
    try {
        const { labId, password } = req.body;

        const envLabId = process.env.LAB_ID || 'lab001';
        const envLabPassword = process.env.LAB_PASSWORD || 'lab@123';

        if (labId !== envLabId) {
            return res.status(401).json({ msg: 'Invalid Lab ID or Password' });
        }

        const isMatch = password === envLabPassword;
        if (!isMatch) {
            return res.status(401).json({ msg: 'Invalid Lab ID or Password' });
        }

        // Issue a lab-scoped JWT
        const token = jwt.sign(
            { role: 'lab', labId, ip: req.clientIp },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            token,
            user: { role: 'lab', labId, name: 'Lab Student', ip: req.clientIp }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ─────────────────────────────────────────────────────────────────
// LAB: Get available live exam for lab
// GET /api/lab/exams
// ─────────────────────────────────────────────────────────────────
router.get('/exams', labIpOnly, async (req, res) => {
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

        const exams = await OnlineExam.find({
            status: { $in: ['live', 'scheduled'] },
            $or: [
                { end_time: null },
                { end_time: { $gt: now } }
            ]
        })
            .select('title examType duration_minutes start_time end_time instructions status')
            .sort({ start_time: 1 });
        res.json(exams);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
