const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI;
const SUBJECT = 'Physics';
const CHAPTER = "Alternating Current";
const EXAM = 'NEET';
const CLASS = '11';

async function seedPhysics() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully to MongoDB.');

        const jsonPath = path.join(__dirname, 'physics_ac.json');
        const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        console.log(`Found ${questionsData.length} questions to import.`);
        let imported = 0;

        for (const item of questionsData) {
            try {
                // Check if exists
                const existing = await Question.findOne({ questionId: item.questionId });
                if (existing) {
                    console.log(`Question ${item.questionId} already exists. Skipping.`);
                    continue;
                }

                const newQuestion = new Question({
                    questionId: item.questionId,
                    subject: SUBJECT,
                    chapter: CHAPTER,
                    concept: "Mechanics",
                    level: item.level,
                    classes: [CLASS, EXAM],
                    type: item.type,
                    questionText: item.questionText,
                    options: item.options,
                    answer: item.answer,
                    imageUrl: item.imageUrl || null
                });

                await newQuestion.save();
                imported++;
            } catch (err) {
                console.error(`Error importing ${item.questionId}:`, err);
            }
        }

        console.log(`\nImport Summary:`);
        console.log(`Successfully imported ${imported} new questions.`);

    } catch (error) {
        console.error('Error during database operation:', error);
    } finally {
        mongoose.connection.close();
        console.log('MongoDB connection closed.');
    }
}

seedPhysics();
