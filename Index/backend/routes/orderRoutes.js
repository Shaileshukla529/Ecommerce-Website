/* routes/orderRoutes.js */
const express = require('express');
const { createOrder, getMyOrders, verifyPayment, getProfile } = require('../controllers/orderController');
// const { protect } = require('../middleware/authMiddleware'); // Import auth middleware

const router = express.Router();

// --- Order Routes ---
// router.post('/orders', protect, createOrder); // Use protect later
router.post('/orders', createOrder);

// router.get('/orders/my', protect, getMyOrders);
router.get('/orders/my', getMyOrders); // Temp GET with userId query

// router.post('/orders/verify-payment', protect, verifyPayment); // Needs user context for security check
router.post('/orders/verify-payment', verifyPayment); // Endpoint called by frontend

// --- Profile Route ---
// router.get('/profile', protect, getProfile);
router.get('/profile', getProfile); // Temp GET with userId query

module.exports = router;