const mongoose = require('mongoose');
const path = require('path');
const OnlineExam = require('../models/OnlineExam');
const Question = require('../models/Question');

const answerKey = {
    "1": "2",  "2": "4",  "3": "4",  "4": "2",  "5": "3",  "6": "3",  "7": "3",  "8": "2",  "9": "1",  "10": "1",
    "11": "2", "12": "3", "13": "2", "14": "2", "15": "2", "16": "4", "17": "1", "18": "1", "19": "3", "20": "3",
    "21": "5.0", "22": "0.0", "23": "998.0", "24": "30.0", "25": "28.0", "26": "4", "27": "4", "28": "4", "29": "1", "30": "1",
    "31": "3", "32": "3", "33": "1", "34": "2", "35": "2", "36": "3", "37": "3", "38": "2", "39": "4", "40": "3",
    "41": "3", "42": "1", "43": "3", "44": "2", "45": "2", "46": "20.0", "47": "741.0", "48": "40.0", "49": "13.86", "50": "6.0",
    "51": "3", "52": "3", "53": "3", "54": "4", "55": "3", "56": "4", "57": "2", "58": "2", "59": "2", "60": "2",
    "61": "3", "62": "1", "63": "1", "64": "3", "65": "4", "66": "1", "67": "3", "68": "2", "69": "2", "70": "4",
    "71": "3.0", "72": "1.0", "73": "4.0", "74": "4.0", "75": "28.0"
};

async function updateAnswers() {
    try {
        await mongoose.connect('mongodb+srv://yy6996843_db_user:N2oKnSiCAtk2Qgcy@cluster0.cii53av.mongodb.net/question_paper_system?retryWrites=true&w=majority&appName=Cluster0');
        console.log('Connected to PROD MongoDB.');

        const examId = '6a137290de883bd0e9cdc85d'; // Production Exam ID
        const exam = await OnlineExam.findById(examId);

        if (!exam) {
            console.error('Exam not found. Trying another exam?');
            process.exit(1);
        }

        if (exam.questions.length !== 75) {
            console.error('Expected 75 questions, found', exam.questions.length);
            process.exit(1);
        }

        let updatedCount = 0;

        for (let i = 0; i < exam.questions.length; i++) {
            const qNum = i + 1;
            const q = exam.questions[i];
            const rawAnswer = answerKey[qNum.toString()];

            let finalAnswer = rawAnswer;

            if (q.type === 'MCQ') {
                const optionIndex = parseInt(rawAnswer, 10) - 1;
                if (!isNaN(optionIndex) && q.options && q.options.length > optionIndex) {
                    finalAnswer = q.options[optionIndex];
                } else {
                    console.warn(`Warning: Option index ${optionIndex} out of bounds for question ${qNum}`);
                }
            } else {
                finalAnswer = rawAnswer;
            }

            q.answer = finalAnswer;
            await Question.findByIdAndUpdate(q.questionId, { answer: finalAnswer });
            updatedCount++;
        }

        exam.markModified('questions');
        await exam.save();
        
        console.log(`Successfully updated answers for ${updatedCount} questions in PROD.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

updateAnswers();
