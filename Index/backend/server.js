/* server.js - Modified for Render Web Service */
require('dotenv').config(); // Ensure environment variables are loaded
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Assuming db.js is in ./config/
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Connect to DB - Call this early
connectDB(); // Make sure this completes before listening if possible, or handles errors gracefully

const app = express();

// Middleware
// TODO: Restrict CORS origin in production for better security.
// Replace '*' with your frontend's deployed URL from Render
// Example: const frontendURL = process.env.FRONTEND_URL || 'http://localhost:xxxx'; // Get from env var
// app.use(cors({ origin: frontendURL }));
app.use(cors({ origin: '*' })); // Allows all origins for now (easier debugging)

app.use(express.json()); // To parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // To parse URL-encoded request bodies

// --- API Routes ---
// Requests like '/api/login' will be handled by these routers
app.use('/api', authRoutes);
app.use('/api', orderRoutes);

// Optional: A root route for the API itself for testing
app.get('/api', (req, res) => {
    res.send('Shopwave API is running...');
});

// --- ** IMPORTANT: Server Listening Logic ** ---
// Render provides the PORT environment variable
const PORT = process.env.PORT || 5000; // Use Render's port, fallback to 5000 for local dev

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
// --- ** End Server Listening Logic ** ---

// --- REMOVE serverless export ---
// module.exports = app; // Remove this line if it exists
