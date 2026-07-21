const dns = require('dns'); // trigger render redeploy 3
// Set DNS servers to resolve MongoDB SRV records reliably
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
    console.warn('⚠️ Warning: Failed to set custom DNS servers for MongoDB connection:', err.message);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/auth.js');
const adminRoutes = require('./routes/admin.js');
const questionRoutes = require('./routes/questions.js');
const paperRoutes = require('./routes/papers.js');
const templateRoutes = require('./routes/templates.js');
const examRoutes = require('./routes/exams.js');
const labRoutes = require('./routes/lab.js');
const grandTestRoutes = require('./routes/grandTests.js');
const previousYearPaperRoutes = require('./routes/previousYearPapers.js');
const examBlueprintRoutes = require('./routes/examBlueprints.js');

dotenv.config();

const app = express();

// ── CORS: allow all origins in production (Vercel, Render, any device)
app.use(cors({
    origin: ['https://qestion-paper.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Ensure uploads directory always exists (critical for cloud deployments)
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory at:', uploadsDir);
}

// ── Serve uploaded files (images/templates) as static
app.use('/uploads', express.static(uploadsDir));

// ── Root health check
app.get('/', (req, res) => {
    res.json({
        message: 'QPG System API is running',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// ── API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/grand-tests', grandTestRoutes);
app.use('/api/previous-year-papers', previousYearPaperRoutes);
app.use('/api/exam-blueprints', examBlueprintRoutes);

// ── Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB Connected');
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server running on port ${PORT}`);
            console.log(`   Uploads directory: ${uploadsDir}`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
