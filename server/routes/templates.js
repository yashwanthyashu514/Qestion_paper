const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Template = require('../models/Template');
const auth = require('../middleware/auth');
const checkRole = require('../middleware/role');

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'template-' + Date.now() + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

// @route   POST /api/templates
// @desc    Upload a template
// @access  Admin
router.post('/', [auth, checkRole(['admin']), upload.single('template')], async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        const template = new Template({
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedBy: req.user.id,
            fileUrl: `/uploads/${req.file.filename}`
        });

        await template.save();
        res.json(template);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/templates
// @desc    Get all templates
// @access  Admin & Teacher
router.get('/', auth, async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
