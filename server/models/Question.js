const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    questionId: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    classes: [{ type: String, required: true }], // allow flexible class strings
    chapter: { type: String, required: true },
    concept: { type: String, required: true },
    subConcept: { type: String, default: '' },
    level: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    type: { type: String, required: true }, // flexible string
    questionText: { type: String, required: true },
    options: [{ type: String }], // For MCQ
    answer: { type: String },
    imageUrl: { type: String },
    solutionText: { type: String },
    solutionImageUrl: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', QuestionSchema);
