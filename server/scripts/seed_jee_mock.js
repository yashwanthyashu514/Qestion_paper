const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Question = require('../models/Question');
const OnlineExam = require('../models/OnlineExam');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qpg-app';
const CHAPTER = 'JEE Mock Chapter';

const questionsData = [
    // ── Physics ──────────────────────────────────────────────────────────────
    {
        subject: 'Physics',
        chapter: CHAPTER,
        concept: 'Current Electricity',
        level: 'medium',
        type: 'MCQ',
        questionText: 'A wire of resistance R is stretched to twice its original length. Its new resistance will be:',
        options: ['2 R', '4 R', 'R/2', 'R/4'],
        answer: '4 R'
    },
    {
        subject: 'Physics',
        chapter: CHAPTER,
        concept: 'Units & Dimensions',
        level: 'easy',
        type: 'MCQ',
        questionText: 'The dimensional formula for gravitational constant G is:',
        options: ['M^-1 L^3 T^-2', 'M^1 L^3 T^-2', 'M^-1 L^2 T^-2', 'M^-1 L^3 T^-1'],
        answer: 'M^-1 L^3 T^-2'
    },
    {
        subject: 'Physics',
        chapter: CHAPTER,
        concept: 'Work Power Energy',
        level: 'hard',
        type: 'MCQ',
        questionText: 'A body of mass 2 kg moving with a velocity of 3 m/s collides head-on with a body of mass 1 kg at rest. If the collision is perfectly inelastic, the loss of kinetic energy is:',
        options: ['3 J', '1.5 J', '4.5 J', '2 J'],
        answer: '3 J'
    },
    {
        subject: 'Physics',
        chapter: CHAPTER,
        concept: 'Kinematics',
        level: 'medium',
        type: 'numerical',
        questionText: 'A ball is thrown vertically upwards with a velocity of 20 m/s. What is the maximum height attained by the ball in meters? (Take g = 10 m/s^2)',
        options: [],
        answer: '20'
    },
    {
        subject: 'Physics',
        chapter: CHAPTER,
        concept: 'Work Power Energy',
        level: 'hard',
        type: 'numerical',
        questionText: 'An engine pumps water continuously through a hose. Water leaves the hose with velocity v and mass per unit length of water jet is m. What is the rate at which kinetic energy is imparted to water? (If v = 10 m/s and m = 2 kg/m, enter value in Watts)',
        options: [],
        answer: '1000'
    },
    // ── Chemistry ────────────────────────────────────────────────────────────
    {
        subject: 'Chemistry',
        chapter: CHAPTER,
        concept: 'Organic Chemistry',
        level: 'easy',
        type: 'MCQ',
        questionText: 'Which of the following compounds has the highest boiling point?',
        options: ['Ethanol', 'Dimethyl ether', 'Diethyl ether', 'Propane'],
        answer: 'Ethanol'
    },
    {
        subject: 'Chemistry',
        chapter: CHAPTER,
        concept: 'Chemical Bonding',
        level: 'medium',
        type: 'MCQ',
        questionText: 'The hybridization of Xe in XeF4 is:',
        options: ['sp3d', 'sp3d2', 'sp3', 'dsp2'],
        answer: 'sp3d2'
    },
    {
        subject: 'Chemistry',
        chapter: CHAPTER,
        concept: 'Structure of Atom',
        level: 'easy',
        type: 'MCQ',
        questionText: 'The number of radial nodes in a 3p orbital is:',
        options: ['1', '2', '0', '3'],
        answer: '1'
    },
    {
        subject: 'Chemistry',
        chapter: CHAPTER,
        concept: 'Isomerism',
        level: 'medium',
        type: 'numerical',
        questionText: 'Find the number of chiral carbon atoms in 2-bromobutane.',
        options: [],
        answer: '1'
    },
    {
        subject: 'Chemistry',
        chapter: CHAPTER,
        concept: 'Redox Reactions',
        level: 'easy',
        type: 'numerical',
        questionText: 'What is the oxidation state of Mn in KMnO4?',
        options: [],
        answer: '7'
    },
    // ── Mathematics ──────────────────────────────────────────────────────────
    {
        subject: 'Mathematics',
        chapter: CHAPTER,
        concept: 'Integration',
        level: 'medium',
        type: 'MCQ',
        questionText: 'The value of integral from 0 to pi/2 of sin(x) / (sin(x) + cos(x)) dx is:',
        options: ['pi/4', 'pi/2', 'pi', '0'],
        answer: 'pi/4'
    },
    {
        subject: 'Mathematics',
        chapter: CHAPTER,
        concept: 'Matrices',
        level: 'easy',
        type: 'MCQ',
        questionText: 'If A and B are symmetric matrices of same order, then AB - BA is a:',
        options: ['Skew-symmetric matrix', 'Symmetric matrix', 'Zero matrix', 'Identity matrix'],
        answer: 'Skew-symmetric matrix'
    },
    {
        subject: 'Mathematics',
        chapter: CHAPTER,
        concept: 'Binomial Theorem',
        level: 'medium',
        type: 'MCQ',
        questionText: 'The number of terms in the expansion of (x + y + z)^10 is:',
        options: ['66', '55', '11', '22'],
        answer: '66'
    },
    {
        subject: 'Mathematics',
        chapter: CHAPTER,
        concept: 'Limits',
        level: 'medium',
        type: 'numerical',
        questionText: 'Find the value of limit x -> 0 of sin(5x)/x.',
        options: [],
        answer: '5'
    },
    {
        subject: 'Mathematics',
        chapter: CHAPTER,
        concept: 'Matrices',
        level: 'hard',
        type: 'numerical',
        questionText: 'If a matrix A has dimensions 3x3 and det(A) = 2, find the value of det(3A).',
        options: [],
        answer: '54'
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB.');

        // Clean existing mock data
        await Question.deleteMany({ chapter: CHAPTER });
        await OnlineExam.deleteMany({ title: 'JEE Mains Practice Mock Test' });
        console.log('Cleaned old mock JEE questions and exams.');

        // Insert new Questions
        const questionsToInsert = questionsData.map((q, index) => ({
            ...q,
            questionId: `Q-JEE-MOCK-${index + 1}-${Date.now()}`,
            classes: ['12', 'JEE'],
            level: q.level
        }));

        const insertedQuestions = await Question.insertMany(questionsToInsert);
        console.log(`Inserted ${insertedQuestions.length} questions.`);

        // Map to OnlineExam questions
        const examQuestions = insertedQuestions.map(q => ({
            questionId: q._id,
            subject: q.subject,
            chapter: q.chapter,
            concept: q.concept,
            questionText: q.questionText,
            options: q.options,
            answer: q.answer,
            imageUrl: q.imageUrl || '',
            marks: 4,
            type: q.type
        }));

        const mockExam = new OnlineExam({
            title: 'JEE Mains Practice Mock Test',
            examType: 'JEE',
            questions: examQuestions,
            instructions: `General Instructions for JEE Mains Practice Mock Test:\n1. The exam contains 15 questions covering Physics, Chemistry, and Mathematics.\n2. There are 10 Multiple Choice Questions (MCQ) and 5 Numerical Value Questions.\n3. For numerical value questions, enter your answer using the keyboard or virtual keypad.\n4. Marking Scheme: +4 for Correct answer, -1 for Incorrect answer, 0 for Unattempted.\n5. Click 'SAVE & NEXT' to save your response.`,
            duration_minutes: 60,
            status: 'live',
            start_time: new Date(),
            end_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Live for 30 days
        });

        await mockExam.save();
        console.log('Successfully created live "JEE Mains Practice Mock Test" exam!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
}

seed();
