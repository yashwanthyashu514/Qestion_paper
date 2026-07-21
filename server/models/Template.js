const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    title: { type: String },
    description: { type: String },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Template', TemplateSchema);

