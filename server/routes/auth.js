const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const email = req.body.email?.trim();
    const password = req.body.password?.trim();

    // Hardcoded Admin account — validates both email and password
    if (email === 'college@gmail.com') {
        const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '123456';
        if (password !== ADMIN_PASSWORD) {
            return res.status(400).json({ msg: 'Incorrect password for admin account.' });
        }
        const adminId = '000000000000000000000000';
        const token = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '10h' });
        return res.json({ token, user: { id: adminId, name: 'College Admin', email, role: 'admin' } });
    }

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: `User ${email} not found in database.` });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: `Incorrect password for ${email}.` });
        }

        const payload = {
            id: user.id,
            role: user.role,
            subject: user.subject
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '10h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, subject: user.subject } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
