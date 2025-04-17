const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/register
// @access  Public
exports.register = async (req, res) => {
    const { username, email, password } = req.body;

    // Basic Server-Side Validation (Mongoose validation handles more)
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Please provide username, email, and password' });
    }

    try {
        // Check if user already exists (by email)
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                 message: 'Registration failed',
                 errors: [{ field: 'email', message: 'Email already exists' }]
                 });
        }

        // Create new user (password hashing happens via pre-save hook in User model)
        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password, // Pass the plain password, model will hash it
        });

        await newUser.save(); // Mongoose validation runs here

        // Don't send the password back, even the hash
        res.status(201).json({
            message: 'User registered successfully!',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        });

    } catch (error) {
        console.error("Registration Error:", error);
        // Handle Mongoose validation errors more specifically
        if (error.name === 'ValidationError') {
             const errors = Object.values(error.errors).map(el => ({
                field: el.path,
                message: el.message
             }));
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// @desc    Authenticate user & get token (token part not implemented here yet)
// @route   POST /api/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        // Check if user exists and if password is correct
        if (!user || !(await user.comparePassword(password))) {
             // Generic message for security (don't reveal if email exists or not)
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // --- Login Successful ---
        // TODO: Implement session or JWT token generation here for actual login state
        // For now, just send success message

        res.status(200).json({
            message: 'Login successful!',
            user: { // Send back some user info (excluding password)
                id: user._id,
                username: user.username,
                email: user.email
            }
            // token: generateToken(user._id) // Example if using JWT
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Server error during login' });
    }
};