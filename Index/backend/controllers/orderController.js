/* controllers/orderController.js */
const Order = require('../models/Order');
const User = require('../models/User');
const Razorpay = require('razorpay'); // Import Razorpay
const crypto = require('crypto'); // Import crypto for verification

// --- Initialize Razorpay ---
// Ensure your .env file is loaded correctly (usually done in server.js)
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// @desc    Create a new order (or initiate online payment)
// @route   POST /api/orders
// @access  Private (Needs Authentication)
exports.createOrder = async (req, res) => {
    const {
        userId, // **FIX THIS WITH AUTH LATER**
        items,
        totalAmount,
        shippingAddress,
        paymentMethod
    } = req.body;

    if (!userId || !items || items.length === 0 || !totalAmount || !shippingAddress || !paymentMethod) {
        return res.status(400).json({ message: 'Missing required order information.' });
    }

    const actualUserId = userId; // ** REPLACE with authenticated user ID **

    try {
        // --- Update User Profile (Optional step, as before) ---
        await User.findByIdAndUpdate(actualUserId, {
             $set: { phone: shippingAddress.phone, address: { street: shippingAddress.street, city: shippingAddress.city, state: shippingAddress.state, zip: shippingAddress.zip, country: shippingAddress.country } }
        }, { new: true, runValidators: true });


        // --- Prepare Base Order Data ---
        const orderData = {
            user: actualUserId,
            items: items,
            totalAmount: totalAmount,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            paymentStatus: 'Pending',
            orderStatus: 'Pending'
        };

        // --- Create the Order Document First (for COD or as initial step for Online) ---
        const newOrder = new Order(orderData);
        const savedOrder = await newOrder.save(); // Save order with pending status

        // --- Handle Payment ---
        if (paymentMethod === 'Online') {
            // --- Create Razorpay Order ---
            const options = {
                amount: Math.round(totalAmount * 100), // Amount in the smallest currency unit (paise for INR)
                currency: "INR",
                receipt: savedOrder._id.toString(), // Use your internal order ID as receipt
                notes: {
                    mongoOrderId: savedOrder._id.toString() // Add custom note if needed
                }
            };

            try {
                const razorpayOrder = await razorpayInstance.orders.create(options);

                if (!razorpayOrder || !razorpayOrder.id) {
                    console.error("Razorpay order creation failed:", razorpayOrder);
                     // Optionally update your savedOrder status to 'Failed' here
                    return res.status(500).json({ message: 'Failed to create payment gateway order.' });
                }

                // --- Update *your* order with the Razorpay order ID ---
                savedOrder.paymentDetails = { gatewayOrderId: razorpayOrder.id };
                await savedOrder.save();

                console.log(`Order created (ID: ${savedOrder._id}), Razorpay Order ID: ${razorpayOrder.id}`);

                // --- Send necessary details to frontend ---
                res.status(200).json({
                    message: 'Order initiated, proceed to payment.',
                    orderId: savedOrder._id, // Your internal order ID
                    razorpayOrderId: razorpayOrder.id, // Razorpay's order ID
                    amount: razorpayOrder.amount, // Amount in paise
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID // Send Key ID to frontend
                });

            } catch (gatewayError) {
                console.error("Razorpay order creation API error:", gatewayError);
                 // Optionally update your savedOrder status to 'Failed' here
                return res.status(500).json({ message: 'Error communicating with payment gateway.' });
            }

        } else if (paymentMethod === 'COD') {
            // --- COD Order is Placed ---
            savedOrder.orderStatus = 'Processing'; // Move COD to processing
            await savedOrder.save();

            console.log(`COD Order placed successfully (ID: ${savedOrder._id})`);
            res.status(201).json({
                message: 'Order placed successfully!',
                orderId: savedOrder._id,
                orderDetails: savedOrder
            });
        } else {
             // Should not happen if frontend validation is correct
             await Order.findByIdAndDelete(savedOrder._id); // Clean up the created order
             return res.status(400).json({ message: 'Invalid payment method.' });
        }

    } catch (error) {
        console.error("Order Creation/Processing Error:", error);
        // Attempt to clean up if an order document was created but something else failed
        if (savedOrder && savedOrder._id && paymentMethod !== 'COD') {
             // Maybe mark as failed instead of deleting? Depends on logic.
             // await Order.findByIdAndUpdate(savedOrder._id, { orderStatus: 'Failed', paymentStatus: 'Failed' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Order validation failed', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error during order creation.' });
    }
};


// @desc    Verify online payment (Called by frontend after Razorpay success)
// @route   POST /api/orders/verify-payment
// @access  Private (Needs Auth)
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // ** IMPORTANT: Get user ID from authenticated session/token, not body/params **
    // const userId = req.user.id;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment verification details.' });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    try {
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        const isAuthentic = crypto.timingSafeEqual(
             Buffer.from(expectedSignature, 'hex'),
             Buffer.from(razorpay_signature, 'hex')
        );
       // const isAuthentic = expectedSignature === razorpay_signature; // Less secure comparison

        if (isAuthentic) {
            // --- Payment is authentic, update the order in DB ---
            const order = await Order.findOne({ 'paymentDetails.gatewayOrderId': razorpay_order_id });

            if (!order) {
                console.error(`Verification Error: Order not found for Razorpay Order ID ${razorpay_order_id}`);
                return res.status(404).json({ success: false, message: 'Order not found.' });
            }

            // Check if order belongs to the authenticated user (using userId from auth middleware)
            // if (order.user.toString() !== userId) {
            //     return res.status(403).json({ success: false, message: 'Forbidden: Order does not belong to user.' });
            // }


            order.paymentStatus = 'Paid';
            order.orderStatus = 'Processing';
            order.paymentDetails.gatewayPaymentId = razorpay_payment_id;
            order.paymentDetails.gatewaySignature = razorpay_signature;

            await order.save();

            console.log(`Payment verified successfully for Order ID: ${order._id}, Razorpay Payment ID: ${razorpay_payment_id}`);

            res.status(200).json({
                success: true,
                message: 'Payment verified successfully.',
                orderId: order._id // Send back your internal order ID
            });

        } else {
            console.warn(`Payment verification failed for Razorpay Order ID ${razorpay_order_id}. Signature mismatch.`);
             // Optionally update order status to 'Failed'
             // const order = await Order.findOne({ 'paymentDetails.gatewayOrderId': razorpay_order_id });
             // if (order) {
             //     order.paymentStatus = 'Failed';
             //     await order.save();
             // }
            res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ success: false, message: 'Server error during payment verification.' });
    }
};

// --- getMyOrders and getProfile functions remain the same as before ---
// Make sure they use authenticated user ID in production

// @desc    Get orders for the logged-in user
// @route   GET /api/orders/my
// @access  Private (Needs Authentication)
exports.getMyOrders = async (req, res) => {
     // ** TEMPORARY: Get userId from query param - FIX THIS WITH AUTH **
     const userId = req.query.userId;
     if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    try {
        const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });
        if (!orders) return res.status(404).json({ message: 'No orders found.' });
        res.status(200).json(orders);
    } catch (error) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
};

// @desc    Get user profile details
// @route   GET /api/profile
// @access  Private (Needs Auth)
exports.getProfile = async (req, res) => {
    // ** TEMPORARY - FIX WITH AUTH **
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ message: 'User ID is required.' });
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        res.status(200).json({ id: user._id, username: user.username, email: user.email, phone: user.phone, address: user.address });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};