const mongoose = require('mongoose');

const ExamPatternSchema = new mongoose.Schema({
    name: { type: String, required: true },
    examType: { type: String, enum: ['JEE', 'NEET', 'KCET', 'Custom'], required: true },
    description: { type: String },
    sections: [{
        sectionName: { type: String, required: true },
        subject: { type: String },
        numQuestions: { type: Number, required: true },
        type: { type: String, required: true },
        marks: { type: Number, required: true }
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamPattern', ExamPatternSchema);
