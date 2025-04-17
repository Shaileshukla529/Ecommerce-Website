const mongoose = require('mongoose');
require('dotenv').config(); // Load .env variables

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            // Remove deprecated options if using Mongoose v6+
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
            // useCreateIndex: true, // Not needed in Mongoose 6+
            // useFindAndModify: false // Not needed in Mongoose 6+
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        // Exit process with failure
        process.exit(1);
    }
};

module.exports = connectDB;