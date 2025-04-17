const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        // Optional: Add uniqueness if needed, but email is usually the unique identifier for login
        // unique: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // Ensure emails are unique
        lowercase: true, // Store emails in lowercase
        trim: true,
        match: [/\S+@\S+\.\S+/, 'Please use a valid email address'] // Basic email format validation
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// --- Password Hashing Middleware ---
// Use a pre-save hook to hash the password *before* saving it to the database
UserSchema.pre('save', async function(next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate a salt
        const salt = await bcrypt.genSalt(10); // 10 rounds is generally recommended
        // Hash the password using the salt
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware/handler
    }
});

// --- Password Comparison Method ---
// Add a method to the user schema to compare entered password with the stored hash
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error; // Re-throw error to be caught by the calling function
    }
};


module.exports = mongoose.model('User', UserSchema); // 'User' will be the name of the collection (pluralized to 'users')