require('dotenv').config(); // Load .env variables first
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db'); // Import DB connection function
const authRoutes = require('./routes/authRoutes'); // Import auth routes

// --- Initialize Express App ---
const app = express();

// --- Connect to Database ---
connectDB();

// --- Middleware ---
// Enable CORS - Adjust origin for production
app.use(cors({
    origin: '*' // Allow all origins for development - BE CAREFUL in production!
    // origin: 'http://localhost:5173' // Or specify your frontend's origin if using Vite default
}));

// Body Parser Middleware (for parsing JSON and URL-encoded data)
app.use(express.json()); // Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses incoming requests with URL-encoded payloads

// --- API Routes ---
// Mount the authentication routes under the /api prefix
app.use('/api', authRoutes);

// --- Basic Root Route (for testing if server is up) ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- Define Port ---
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

// --- Start Server ---
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));