require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Allow 1000 requests per 15 minutes for development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(15 * 60 / 60) + ' minutes'
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
app.use('/api/machines', machinesRouter);
app.use('/api/qc', qcTestsRouter);
app.use('/api/qc', qcReportsRouter);

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