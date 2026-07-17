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
    paperType: { type: String, enum: ['Standard', 'GrandTest', 'PYQ'], default: 'Standard' },
    examType: { type: String, enum: ['JEE', 'NEET', 'KCET', 'Custom', 'Other'], default: 'Custom' },
    version: { type: Number, default: 1 },
    revision: { type: Number, default: 0 },
    parentPaperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Paper' },
    year: { type: Number },
    fileUrl: { type: String },
    createdAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending Approval', 'Approved', 'Rejected'], default: 'Pending Approval' }
});

module.exports = mongoose.model('Paper', PaperSchema, 'papers');
