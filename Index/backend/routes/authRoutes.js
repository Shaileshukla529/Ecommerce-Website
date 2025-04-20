const express = require('express');
const { register, login } = require('../controllers/authController'); // Import controller functions

const router = express.Router();

// Define routes and link them to controller functions
router.post('/register', register);
router.post('/login', login);

module.exports = router;