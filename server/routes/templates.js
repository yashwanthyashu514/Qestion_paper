const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Template = require('../models/Template');
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
        const safeName = 'template-' + Date.now() + path.extname(file.originalname).toLowerCase();
        cb(null, safeName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only image files are allowed'), false);
    }
});

// @route   POST /api/templates
// @desc    Upload a template
// @access  Admin
router.post('/', [auth, checkRole(['admin']), upload.single('template')], async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });

        // Build the full public URL so any device can access it
        const backendUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
        const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;

        const template = new Template({
            filename: req.file.filename,
            originalName: req.file.originalname,
            uploadedBy: req.user.id,
            fileUrl
        });

        await template.save();
        res.json(template);
    } catch (err) {
        console.error('Template upload error:', err.message);
        res.status(500).json({ msg: 'Server Error', error: err.message });
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
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/templates/:id
// @desc    Delete a template
// @access  Admin
router.delete('/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) return res.status(404).json({ msg: 'Template not found' });

        // Delete file from disk
        const filePath = path.join(uploadsDir, template.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Template.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Template deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;
