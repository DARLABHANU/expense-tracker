require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:5500',
  'http://localhost:5500'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/expenseDB";

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Models
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model("User", userSchema);
const Expense = mongoose.model("Expense", expenseSchema);

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ 
    success: false,
    error: "Access denied. No token provided." 
  });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ 
      success: false,
      error: "Invalid or expired token." 
    });
    req.user = user;
    next();
  });
}

// Auth Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword });
    
    res.status(201).json({ 
      success: true,
      message: "User registered successfully", 
      userId: newUser._id 
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during registration"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required"
      });
    }

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({
      success: false,
      error: "User not found"
    });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({
      success: false,
      error: "Invalid credentials"
    });

    const token = jwt.sign(
      { userId: user._id, username: user.username }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      success: false,
      error: "Server error during login"
    });
  }
});

// Expense Routes
app.get("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user.userId }).sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch expenses"
    });
  }
});

app.post("/api/expenses", authenticateToken, async (req, res) => {
  try {
    const { description, amount } = req.body;
    
    if (!description || !amount) {
      return res.status(400).json({
        success: false,
        error: "Description and amount are required"
      });
    }

    const newExpense = new Expense({
      user: req.user.userId,
      description,
      amount
    });

    const savedExpense = await newExpense.save();
    res.status(201).json({
      success: true,
      data: savedExpense
    });
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add expense"
    });
  }
});

app.delete("/api/expenses/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid expense ID"
      });
    }

    const deletedExpense = await Expense.findOneAndDelete({
      _id: id,
      user: req.user.userId
    });

    if (!deletedExpense) {
      return res.status(404).json({
        success: false,
        error: "Expense not found"
      });
    }

    res.json({
      success: true,
      message: "Expense deleted successfully",
      data: deletedExpense
    });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete expense"
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK' 
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});