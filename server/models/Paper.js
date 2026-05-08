const mongoose = require('mongoose');

const PaperSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    classes: [{ type: String, required: true }],
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    pattern: [{
        sectionName: String,
        numQuestions: Number,
        type: { type: String },
        description: String,
        marks: Number
    }],
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending Approval', 'Approved', 'Rejected'], default: 'Pending Approval' }
});

module.exports = mongoose.model('Paper', PaperSchema);
