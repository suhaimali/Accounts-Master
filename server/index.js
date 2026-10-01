const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000', 'https://accounts-master.vercel.app'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 500 });
app.use('/api/', limiter);

// Global Mock User Middleware (Since Auth was removed)
app.use((req, res, next) => {
  req.user = { _id: '000000000000000000000000', name: 'Admin', role: 'admin' };
  next();
});

// Routes
app.use('/api/daily-accounts', require('./routes/dailyAccounts'));
app.use('/api/credit', require('./routes/credit'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/gpay', require('./routes/gpay'));
app.use('/api/opening-balance', require('./routes/openingBalance'));
app.use('/api/pc', require('./routes/pc'));
app.use('/api/cash-counter', require('./routes/cashCounter'));
app.use('/api/carry-forward', require('./routes/carryForward'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/dashboard', require('./routes/dashboard'));


// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const server = app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is in use. Retrying in 1 second...`);
        setTimeout(() => {
          server.close();
          server.listen(PORT);
        }, 1000);
      } else {
        console.error('❌ Server error:', err);
      }
    });
  })
  .catch(err => { console.error('❌ MongoDB connection error:', err); process.exit(1); });

module.exports = app;
