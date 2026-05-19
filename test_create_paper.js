const mongoose = require('mongoose');
require('dotenv').config({ path: 'server/.env' });
const Paper = require('./server/models/Paper');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qpg-app', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const paperData = {
                title: 'test paper',
                classes: [''],
                questions: [],
                subject: 'Physics',
                teacherId: new mongoose.Types.ObjectId()
            };
            const paper = new Paper(paperData);
            await paper.save();
            console.log('Saved successfully');
        } catch (err) {
            console.error('Validation Error:', err);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
