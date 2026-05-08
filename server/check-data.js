const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Question = require('./models/Question');

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Question collection name:', Question.collection.name);
        
        const questions = await Question.find();
        console.log('Total Questions found via Mongoose:', questions.length);
        
        const rawQuestions = await mongoose.connection.db.collection('questions').find().toArray();
        console.log('Total Questions found via Raw Query (questions):', rawQuestions.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
