const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');

dotenv.config({ path: '../.env' });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qpg-app';

const studentsData = [
    { name: 'BHUVANA G N', rollNumber: '2620101', section: 'II-PUC A' },
    { name: 'KUMAR KEERTHAN M', rollNumber: '2620102', section: 'II-PUC A' },
    { name: 'M NACHIKETH', rollNumber: '2620103', section: 'II-PUC A' },
    { name: 'MANVITH S GOWDA', rollNumber: '2620104', section: 'II-PUC A' },
    { name: 'NANDAN E', rollNumber: '2620105', section: 'II-PUC A' },
    { name: 'RISHIKA C R', rollNumber: '2620107', section: 'II-PUC A' },
    { name: 'SANTHOSH KUMAR K M', rollNumber: '2620108', section: 'II-PUC A' },
    { name: 'SHASHANK S SHETTY', rollNumber: '2620109', section: 'II-PUC A' },
    { name: 'ABHIRAM G AITHAL', rollNumber: '2620110', section: 'II-PUC A' },
    { name: 'AISHWARYA R REVANKAR', rollNumber: '2620111', section: 'II-PUC A' },
    { name: 'AMBRUNI D KULKARNI', rollNumber: '2620112', section: 'II-PUC A' },
    { name: 'ANUSHKA M VERNEKAR', rollNumber: '2620113', section: 'II-PUC A' },
    { name: 'BHUVAN A R', rollNumber: '2620114', section: 'II-PUC A' },
    { name: 'BHUVANA VARDHI G', rollNumber: '2620115', section: 'II-PUC A' },
    { name: 'D KISHORA', rollNumber: '2620116', section: 'II-PUC A' },
    { name: 'DARSHAN R', rollNumber: '2620117', section: 'II-PUC A' },
    { name: 'DEERAJ J M', rollNumber: '2620118', section: 'II-PUC A' },
    { name: 'DHEERAJ S', rollNumber: '2620119', section: 'II-PUC A' },
    { name: 'ESHANVI S', rollNumber: '2620120', section: 'II-PUC A' },
    { name: 'GAGAN M C', rollNumber: '2620121', section: 'II-PUC A' },
    { name: 'HARSHITHA U MESTA', rollNumber: '2620122', section: 'II-PUC A' },
    { name: 'J BHAGYASHREE', rollNumber: '2620123', section: 'II-PUC A' },
    { name: 'K R PRAJWAL', rollNumber: '2620124', section: 'II-PUC A' },
    { name: 'MANASA SURESH MESTA', rollNumber: '2620125', section: 'II-PUC A' },
    { name: 'MANOJ KUMAR M H', rollNumber: '2620126', section: 'II-PUC A' },
    { name: 'MANYA C', rollNumber: '2620127', section: 'II-PUC A' },
    { name: 'NANDITHA K S', rollNumber: '2620128', section: 'II-PUC A' },
    { name: 'NEHA M A', rollNumber: '2620129', section: 'II-PUC A' },
    { name: 'P CHAITANYA', rollNumber: '2620130', section: 'II-PUC A' },
    { name: 'PAVAN SHANBHAG', rollNumber: '2620131', section: 'II-PUC A' },
    { name: 'PRATHEEK D BELLI', rollNumber: '2620132', section: 'II-PUC A' },
    { name: 'PREKSHA S KHADGAD', rollNumber: '2620133', section: 'II-PUC A' },
    { name: 'S SUJITH', rollNumber: '2620134', section: 'II-PUC A' },
    { name: 'SOHAN V', rollNumber: '2620135', section: 'II-PUC A' },
    { name: 'SUMANTH C S', rollNumber: '2620136', section: 'II-PUC A' },
    { name: 'TEKUMALLA SATHWIKA', rollNumber: '2620137', section: 'II-PUC A' },
    { name: 'YASH SHARMA', rollNumber: '2620138', section: 'II-PUC A' }
];

async function seedStudents() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // Delete existing students to avoid duplicates
        await Student.deleteMany({});
        console.log('Cleared old student records.');

        // Insert new students
        await Student.insertMany(studentsData);
        console.log(`Inserted ${studentsData.length} students successfully!`);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding students:', err);
        process.exit(1);
    }
}

seedStudents();
