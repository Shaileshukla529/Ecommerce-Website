/* models/Order.js */
const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
    productId: { type: String, required: true }, // Assuming product IDs are strings from frontend
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }, // Price *at the time of order*
    image: { type: String } // Optional image URL
}, { _id: false });

const ShippingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Receiver's name
    phone: { type: String, required: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true }
}, { _id: false });


const OrderSchema = new mongoose.Schema({
    user: { // Link to the User model
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User' // Reference to the User model
    },
    items: [OrderItemSchema], // Array of items in the order
    totalAmount: { // Total amount paid (or to be paid for COD)
        type: Number,
        required: true
    },
    shippingAddress: {
        type: ShippingAddressSchema,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'Online'] // Allowed payment methods
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    paymentDetails: { // Store gateway transaction ID, etc.
        gatewayOrderId: { type: String },
        gatewayPaymentId: { type: String },
        gatewaySignature: { type: String } // e.g., for Razorpay verification
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
    estimatedDelivery: { // You might calculate this based on order date/shipping
        type: Date
    },
    orderDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', OrderSchema);