// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

const connectDB = require('./config/db');
const expenseRoutes = require('./routes/expenseRoutes');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: '*', // Or specify your frontend URL
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  }));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

// Routes
app.use('/api/expenses', expenseRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});