const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    questionId: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    classes: [{ type: String, enum: ['11', '12', 'JEE', 'KCET', 'NEET'], required: true }],
    chapter: { type: String, required: true },
    concept: { type: String, required: true },
    level: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    type: { type: String, enum: ['MCQ', '1m', '2m', '3m', '4m', '5m'], required: true },
    questionText: { type: String, required: true },
    options: [{ type: String }], // For MCQ
    answer: { type: String },
    imageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
