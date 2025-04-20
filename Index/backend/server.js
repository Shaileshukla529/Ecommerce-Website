/* server.js - Modified for Vercel */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Assuming db.js is in ./config/
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Connect to DB - Call this early
connectDB();

// Middleware
// Consider restricting CORS origin in production via Vercel env vars
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- API Routes ---
// Vercel will typically route requests like '/api/login' directly here
app.use('/api', authRoutes);
app.use('/api', orderRoutes);

// Optional: A root route for the API itself for testing
app.get('/api', (req, res) => {
    res.send('API Root is running...');
});

// --- REMOVED THIS SECTION ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// --- END REMOVED SECTION ---

// --- Export the Express app for Vercel ---
module.exports = app;