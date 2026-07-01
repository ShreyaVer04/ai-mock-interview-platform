require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const interviewRoutes = require('./routes/interview');
const feedbackRoutes = require('./routes/feedback');

const app = express();
const PORT = process.env.PORT || 5000;

// ================= CORS =================
const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-mock-interview-platform-bay.vercel.app",
  "https://ai-mock-interview-platform-51gnb7qdy-shreya-s-projects7.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Raw body for Vapi webhook signature verification
app.use('/api/interview/vapi-webhook', express.raw({ type: 'application/json' }));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Something went wrong.',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});