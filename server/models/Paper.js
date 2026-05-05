const mongoose = require('mongoose');

const PaperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classes: [{ type: String, required: true }],
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Paper', PaperSchema);
