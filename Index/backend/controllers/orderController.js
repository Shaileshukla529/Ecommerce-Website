/* controllers/orderController.js */
const Order = require('../models/Order');
const User = require('../models/User');
const Razorpay = require('razorpay'); // Import Razorpay
const crypto = require('crypto'); // Import crypto for verification
const mongoose = require('mongoose'); // Import mongoose to check ObjectId validity

// --- Initialize Razorpay ---
// Ensure your .env file is loaded correctly (usually done in server.js)
const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


// @desc    Create a new order (or initiate online payment)
// @route   POST /api/orders
// @access  Private (Needs Authentication - currently insecure)
exports.createOrder = async (req, res) => {
    const {
        userId, // **FIX THIS WITH AUTH LATER** - Currently received from frontend localStorage
        items,
        totalAmount,
        shippingAddress,
        paymentMethod
    } = req.body;

    // --- Basic Input Validation ---
    if (!userId || !items || items.length === 0 || totalAmount == null || !shippingAddress || !paymentMethod) {
        return res.status(400).json({ message: 'Missing required order information.' });
    }

    // --- **ADDED**: Validate userId format and existence ---
    console.log("Received userId from frontend:", userId); // Keep for debugging

    // Check if the provided userId is a valid MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error(`Order Creation Error: Invalid userId format received: ${userId}`);
        return res.status(400).json({ message: 'Invalid User ID format.' });
    }

    const actualUserId = userId; // ** REPLACE with authenticated user ID from req.user.id later **

    let savedOrder; // Define savedOrder outside the try block to access in catch

    try {
        // Check if the user actually exists in the database
        const userExists = await User.findById(actualUserId);
        if (!userExists) {
            console.error(`Order Creation Error: User not found for ID: ${actualUserId}`);
            // Return 404 Not Found if the user doesn't exist
            return res.status(404).json({ message: 'User not found.' });
        }
        // --- End of Added Validation ---


        // --- Update User Profile (Optional step) ---
        // This will now only run if the user exists
        await User.findByIdAndUpdate(actualUserId, {
             $set: {
                 phone: shippingAddress.phone,
                 address: {
                     street: shippingAddress.street,
                     city: shippingAddress.city,
                     state: shippingAddress.state,
                     zip: shippingAddress.zip,
                     country: shippingAddress.country
                 }
             }
        }, { new: true, runValidators: true }); // new: true returns the updated doc, runValidators ensures schema rules apply


        // --- Prepare Base Order Data ---
        const orderData = {
            user: actualUserId, // Use the validated user ID
            items: items,
            totalAmount: totalAmount,
            shippingAddress: shippingAddress,
            paymentMethod: paymentMethod,
            paymentStatus: 'Pending', // Initial status
            orderStatus: 'Pending'    // Initial status
        };

        // --- Create the Order Document First ---
        const newOrder = new Order(orderData);
        savedOrder = await newOrder.save(); // Save order with pending status

        // --- Handle Payment ---
        if (paymentMethod === 'Online') {
            // --- Create Razorpay Order ---
            const options = {
                amount: Math.round(totalAmount * 100), // Amount in paise
                currency: "INR",
                receipt: savedOrder._id.toString(), // Use your internal MongoDB order ID
                notes: {
                    mongoOrderId: savedOrder._id.toString() // Optional: Pass your ID in notes
                }
            };

            try {
                const razorpayOrder = await razorpayInstance.orders.create(options);

                if (!razorpayOrder || !razorpayOrder.id) {
                    console.error("Razorpay order creation failed (no ID returned):", razorpayOrder);
                     // Optionally update your savedOrder status to 'Failed' here
                     savedOrder.orderStatus = 'Failed';
                     savedOrder.paymentStatus = 'Failed';
                     await savedOrder.save();
                    return res.status(500).json({ message: 'Failed to create payment gateway order.' });
                }

                // --- Update *your* order with the Razorpay order ID ---
                savedOrder.paymentDetails = { gatewayOrderId: razorpayOrder.id };
                await savedOrder.save();

                console.log(`Order initiated (ID: ${savedOrder._id}), Razorpay Order ID: ${razorpayOrder.id}`);

                // --- Send necessary details to frontend ---
                // Frontend needs keyId, amount, currency, razorpayOrderId, and your orderId
                res.status(200).json({
                    message: 'Order initiated, proceed to payment.',
                    orderId: savedOrder._id,           // Your internal order ID
                    razorpayOrderId: razorpayOrder.id, // Razorpay's order ID
                    amount: razorpayOrder.amount,      // Amount in paise
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID // Your Razorpay Key ID
                });

            } catch (gatewayError) {
                console.error("Razorpay order creation API error:", gatewayError);
                 // Update your order status to 'Failed' as payment initiation failed
                 savedOrder.orderStatus = 'Failed';
                 savedOrder.paymentStatus = 'Failed';
                 await savedOrder.save();
                return res.status(500).json({ message: 'Error communicating with payment gateway.' });
            }

        } else if (paymentMethod === 'COD') {
            // --- COD Order is Placed ---
            // Update status directly as no further payment step is needed now
            savedOrder.orderStatus = 'Processing'; // Move COD to processing
            // Payment status remains 'Pending' until delivery
            await savedOrder.save();

            console.log(`COD Order placed successfully (ID: ${savedOrder._id})`);
            res.status(201).json({ // 201 Created for successful resource creation
                message: 'Order placed successfully!',
                orderId: savedOrder._id,
                orderDetails: savedOrder // Send back the full order details
            });
        } else {
             // Should not happen if frontend validation is correct, but handle defensively
             console.warn(`Invalid payment method received: ${paymentMethod} for Order ID attempt.`);
             // Clean up the created order document if it exists
             if (savedOrder && savedOrder._id) {
                await Order.findByIdAndDelete(savedOrder._id);
             }
             return res.status(400).json({ message: 'Invalid payment method specified.' });
        }

    } catch (error) {
        console.error("Order Creation/Processing Error:", error);
        // Attempt to mark the order as failed if it exists and wasn't COD
        if (savedOrder && savedOrder._id && paymentMethod !== 'COD') {
             try {
                 await Order.findByIdAndUpdate(savedOrder._id, { orderStatus: 'Failed', paymentStatus: 'Failed' });
             } catch (updateError) {
                 console.error("Error marking order as failed:", updateError);
             }
        }
        // Handle Mongoose validation errors specifically
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Order validation failed', errors: error.errors });
        }
        // Generic server error for other issues
        res.status(500).json({ message: 'Server error during order creation.' });
    }
};


// @desc    Verify online payment (Called by frontend after Razorpay success)
// @route   POST /api/orders/verify-payment
// @access  Private (Needs Auth - currently insecure)
exports.verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    // ** IMPORTANT: Get user ID from authenticated session/token (req.user.id) later **
    // const userId = req.user.id; // Example placeholder

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, message: 'Missing payment verification details.' });
    }

    // Construct the string for HMAC generation as per Razorpay docs
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    try {
        // Generate the expected signature using your secret key
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Compare the generated signature with the one received from Razorpay
        // Use crypto.timingSafeEqual for security against timing attacks
        const isAuthentic = crypto.timingSafeEqual(
             Buffer.from(expectedSignature, 'hex'),
             Buffer.from(razorpay_signature, 'hex')
        );
       // const isAuthentic = expectedSignature === razorpay_signature; // Less secure comparison

        if (isAuthentic) {
            // --- Payment is authentic, update the order in DB ---
            // Find the order using Razorpay's order ID stored earlier
            const order = await Order.findOne({ 'paymentDetails.gatewayOrderId': razorpay_order_id });

            if (!order) {
                // This case might happen if the order wasn't found or the gatewayOrderId wasn't saved correctly
                console.error(`Verification Error: Order not found for Razorpay Order ID ${razorpay_order_id}`);
                // Return 404 Not Found
                return res.status(404).json({ success: false, message: 'Order associated with this payment not found.' });
            }

            // ** SECURITY CHECK (Add when auth is implemented) **
            // Check if order belongs to the authenticated user
            // if (order.user.toString() !== userId) {
            //     console.warn(`Verification Forbidden: User ${userId} attempted to verify order ${order._id} belonging to ${order.user}`);
            //     return res.status(403).json({ success: false, message: 'Forbidden: Order does not belong to user.' });
            // }

            // Update order status and payment details
            order.paymentStatus = 'Paid';
            order.orderStatus = 'Processing'; // Move order to processing stage
            order.paymentDetails.gatewayPaymentId = razorpay_payment_id;
            order.paymentDetails.gatewaySignature = razorpay_signature; // Store signature for reference

            await order.save(); // Save the updated order

            console.log(`Payment verified successfully for Order ID: ${order._id}, Razorpay Payment ID: ${razorpay_payment_id}`);

            // Respond to frontend indicating success
            res.status(200).json({
                success: true,
                message: 'Payment verified successfully.',
                orderId: order._id // Send back your internal MongoDB order ID
            });

        } else {
            // --- Signature Mismatch ---
            console.warn(`Payment verification failed for Razorpay Order ID ${razorpay_order_id}. Signature mismatch.`);
             // Optionally update order status to 'Failed'
             const order = await Order.findOne({ 'paymentDetails.gatewayOrderId': razorpay_order_id });
             if (order) {
                 order.paymentStatus = 'Failed';
                 // Decide if orderStatus should also be 'Failed' or 'Cancelled'
                 await order.save();
             }
            // Respond to frontend indicating failure
            res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        // Generic server error
        res.status(500).json({ success: false, message: 'Server error during payment verification.' });
    }
};

// @desc    Get orders for the logged-in user
// @route   GET /api/orders/my
// @access  Private (Needs Authentication - currently insecure)
exports.getMyOrders = async (req, res) => {
     // ** TEMPORARY: Get userId from query param - FIX THIS WITH AUTH (req.user.id) **
     const userId = req.query.userId;
     if (!userId) {
         return res.status(400).json({ message: 'User ID is required for fetching orders.' });
     }
     // Validate format if needed
     if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
     }

    try {
        // Find orders associated with the user, sort by most recent first
        const orders = await Order.find({ user: userId }).sort({ orderDate: -1 });

        // It's okay if no orders are found, just return an empty array
        res.status(200).json(orders); // Send empty array if no orders

    } catch (error) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ message: 'Server error fetching orders.' });
    }
};

// @desc    Get user profile details
// @route   GET /api/profile
// @access  Private (Needs Auth - currently insecure)
exports.getProfile = async (req, res) => {
    // ** TEMPORARY - FIX WITH AUTH (req.user.id) **
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ message: 'User ID is required for fetching profile.' });
    }
     // Validate format if needed
     if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid User ID format.' });
     }

    try {
        // Find user by ID and exclude the password field from the result
        const user = await User.findById(userId).select('-password');

        if (!user) {
            // User associated with the ID was not found
            return res.status(404).json({ message: 'User not found.' });
        }

        // Send relevant profile details
        res.status(200).json({
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            address: user.address
        });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Server error fetching profile.' });
    }
};
