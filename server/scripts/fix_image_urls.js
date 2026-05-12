const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI;

async function fixImageUrls() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully to MongoDB.');

        const mappings = [
            { file: 'physics_newton.json', folder: 'newton' },
            { file: 'physics_newton_2.json', folder: 'newton' },
            { file: 'physics_work_power.json', folder: 'work_power' },
            { file: 'physics_motion_in_a_plane.json', folder: 'motion_plane' },
            { file: 'physics_emi.json', folder: 'emi' },
            { file: 'physics_em_waves.json', folder: 'em_waves' },
            { file: 'physics_ac.json', folder: 'ac' }
        ];

        for (const mapping of mappings) {
            const jsonPath = path.join(__dirname, mapping.file);
            if (!fs.existsSync(jsonPath)) continue;

            const questionsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            console.log(`Processing ${mapping.file}...`);

            for (const item of questionsData) {
                if (item.diagramSourceImage) {
                    const imageUrl = `/images/physics/${mapping.folder}/${item.questionId}.png`;
                    console.log(`Updating ${item.questionId} with imageUrl: ${imageUrl}`);
                    
                    await Question.findOneAndUpdate(
                        { questionId: item.questionId },
                        { imageUrl: imageUrl },
                        { upsert: false }
                    );
                }
            }
        }

        console.log('Finished updating image URLs.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

fixImageUrls();
