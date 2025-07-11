require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure helmet for reverse proxy
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "qctracker.a-naviq.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "qctracker.a-naviq.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "qctracker.a-naviq.com"],
      imgSrc: ["'self'", "data:", "qctracker.a-naviq.com"],
      connectSrc: ["'self'", "qctracker.a-naviq.com"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Configure CORS for reverse proxy
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://192.168.1.182:3000',
    'https://qctracker.a-naviq.com',
    'http://qctracker.a-naviq.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Forwarded-For', 'X-Real-IP', 'X-Forwarded-Proto']
}));

// Trust proxy headers
app.set('trust proxy', true);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow 1000 requests per 15 minutes for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
  },
  // Custom key generator that uses X-Forwarded-For when behind a proxy
  keyGenerator: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    return ip;
  },
  // Skip rate limiting if we can't determine the real IP
  skip: (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip;
    return !ip || ip === '::1' || ip === '127.0.0.1';
  }
});
app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'QC Tracker API is running' });
});

// Serve static files for reports
app.use('/reports', express.static('reports'));

// Routes
const machinesRouter = require('./routes/machines');
const qcTestsRouter = require('./routes/qcTests');
const qcReportsRouter = require('./routes/qcReports');
const worksheetsRouter = require('./routes/worksheets');
app.use('/api/machines', machinesRouter);
app.use('/api/qc', qcTestsRouter);
app.use('/api/qc', qcReportsRouter);
app.use('/api/worksheets', worksheetsRouter);

// MongoDB connection (commented out for development without MongoDB)
// Uncomment when MongoDB is available
/*
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qc-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
*/

console.log('Running without MongoDB - Mock data will be used');

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});