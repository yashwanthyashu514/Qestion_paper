const axios = require('axios');
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('⚠️ Warning: Failed to set custom DNS servers for MongoDB connection:', err.message);
}
const mongoose = require('mongoose');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://yy6996843_db_user:N2oKnSiCAtk2Qgcy@cluster0.cii53av.mongodb.net/question_paper_system?retryWrites=true&w=majority&appName=Cluster0');
        
        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const admin = await User.findOne({ role: 'admin' });
        
        const Paper = mongoose.model('Paper', new mongoose.Schema({}, { strict: false }));
        const papers = await Paper.find().limit(4);
        
        if (papers.length < 3) {
            console.log("Not enough papers in DB to test");
            process.exit(0);
        }
        
        const paperIds = papers.map(p => p._id.toString());
        
        // Let's generate a token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ user: { id: admin._id, role: admin.role } }, 'supersecretqpg', { expiresIn: '1h' });
        
        const reqCount = 3;
        
        console.log("Sending POST with paperIds:", paperIds.slice(0, 3));
        const res = await axios.post('http://localhost:5000/api/exams/merge', {
            title: "Test Exam",
            examType: "JEE",
            paperIds: paperIds.slice(0, 3),
            duration_minutes: 180
        }, {
            headers: { 'x-auth-token': token }
        });
        
        console.log("Success:", res.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
    process.exit(0);
}

test();
