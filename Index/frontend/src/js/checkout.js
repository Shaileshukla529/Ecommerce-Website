/* src/js/checkout.js */

// Import getCart if using modules (ensure ecommerce-logic.js exports it)
import { getCart } from './ecommerce-logic.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const checkoutForm = document.getElementById('checkout-form');
    const orderSummaryContainer = document.querySelector('.lg\\:col-span-1 .space-y-4.mb-6'); // Container for summary items
    const summarySubtotalEl = document.querySelector('.lg\\:col-span-1 .space-y-2 > div:nth-child(1) span:last-child');
    const summaryShippingEl = document.querySelector('.lg\\:col-span-1 .space-y-2 > div:nth-child(2) span:last-child');
    const summaryTaxEl = document.querySelector('.lg\\:col-span-1 .space-y-2 > div:nth-child(3) span:last-child');
    const summaryTotalEl = document.querySelector('.lg\\:col-span-1 .font-semibold span:last-child');
    const placeOrderBtn = document.querySelector('button[form="checkout-form"]');
    const paymentMethodRadios = document.querySelectorAll('input[name="payment_method"]');
    const onlinePaymentDetailsDiv = document.getElementById('online-payment-details');

    // --- **URL CORRECTION**: Base URL should point to your backend server ---
    const API_BASE_URL = 'https://ecommerce-website-883p.onrender.com'; // Your backend URL

    let cartItems = [];
    let orderTotals = { subtotal: 0, shipping: 5.00, taxRate: 0.08, total: 0 }; // Example defaults

    // --- Helper Functions ---
    function displayError(message, keepButtonEnabled = false) {
        alert(`Error: ${message}`); // Replace with a better notification system
        if(placeOrderBtn && !keepButtonEnabled) {
            placeOrderBtn.textContent = 'Place Order';
            placeOrderBtn.disabled = false;
        }
    }

    function formatPrice(amount) {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return '$?.??';
        }
        return `$${numericAmount.toFixed(2)}`;
    }

    // --- Load Cart and Display Summary ---
    function loadCartSummary() {
        // Check if getCart was imported correctly
        if (typeof getCart !== 'function') {
            console.error("getCart function not imported or available. Ensure ecommerce-logic.js exports it and checkout.js imports it.");
            displayError("Critical error: Cannot load cart data.");
            if (placeOrderBtn) placeOrderBtn.disabled = true; // Disable checkout if cart can't load
            return;
        }
        cartItems = getCart();

        if (!cartItems || cartItems.length === 0) {
            displayError("Your cart is empty. Redirecting to cart page.");
            if (placeOrderBtn) placeOrderBtn.disabled = true;
            setTimeout(() => { window.location.href = 'Cart.html'; }, 2500);
            return;
        }

        if (!orderSummaryContainer || !summarySubtotalEl || !summaryShippingEl || !summaryTaxEl || !summaryTotalEl) {
             console.error("One or more summary DOM elements not found!");
             displayError("Checkout page structure seems broken. Cannot display summary.");
             if (placeOrderBtn) placeOrderBtn.disabled = true; // Disable checkout if page structure broken
             return;
        }

        orderSummaryContainer.innerHTML = ''; // Clear previous summary items
        orderTotals.subtotal = 0;

        cartItems.forEach(item => {
            const itemPrice = parseFloat(item.price);
            const itemQuantity = parseInt(item.quantity, 10);

            if (isNaN(itemPrice) || isNaN(itemQuantity) || itemQuantity <= 0) {
                console.warn(`Skipping invalid item in summary:`, item);
                return;
            }

            orderTotals.subtotal += itemPrice * itemQuantity;

            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center';
            itemElement.innerHTML = `
                <div class="flex items-center">
                    <img src="${item.image || 'https://placehold.co/60x60/e2e8f0/94a3b8?text=No+Img'}" alt="${item.name || 'Product'}" class="w-12 h-12 object-cover rounded mr-3">
                    <div>
                        <p class="font-medium text-gray-800">${item.name || 'Unknown Item'}</p>
                        <p class="text-sm text-gray-500">Qty: ${itemQuantity}</p>
                    </div>
                </div>
                <p class="font-medium text-gray-800">${formatPrice(itemPrice * itemQuantity)}</p>
            `;
            orderSummaryContainer.appendChild(itemElement);
        });

        const tax = orderTotals.subtotal * orderTotals.taxRate;
        orderTotals.total = orderTotals.subtotal + orderTotals.shipping + tax;

        summarySubtotalEl.textContent = formatPrice(orderTotals.subtotal);
        summaryShippingEl.textContent = formatPrice(orderTotals.shipping);
        summaryTaxEl.textContent = formatPrice(tax);
        summaryTotalEl.textContent = formatPrice(orderTotals.total);
    }

    // --- Handle Payment Method Change ---
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (event.target.value === 'Online' && onlinePaymentDetailsDiv) {
                onlinePaymentDetailsDiv.classList.remove('hidden');
            } else if (onlinePaymentDetailsDiv) {
                onlinePaymentDetailsDiv.classList.add('hidden');
            }
        });
    });

     // --- Handle Verification Call ---
     async function verifyPaymentOnServer(paymentData) {
        try {
            // --- **URL CORRECTION**: Added /api ---
            const response = await fetch(`${API_BASE_URL}/api/orders/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Auth header if needed: 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });
            // Check if response is ok before parsing JSON
            if (!response.ok) {
                // Try to parse error message from backend
                let errorMsg = `Payment verification failed (Status: ${response.status})`;
                try {
                    const errorResult = await response.json();
                    errorMsg = errorResult.message || errorMsg;
                } catch (jsonError) {
                    errorMsg = `Payment verification failed: ${response.statusText} (Status: ${response.status})`;
                }
                 // Return a failure object
                 return { success: false, message: errorMsg };
            }
            // If response is ok, parse the JSON
            return await response.json(); // Expect { success: boolean, message: string, orderId?: string }

        } catch (error) {
            console.error("Payment Verification Fetch Error:", error);
            return { success: false, message: 'Network error during payment verification.' };
        }
    }


    // --- Handle Form Submission ---
    if (checkoutForm && placeOrderBtn) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            placeOrderBtn.disabled = true;
            placeOrderBtn.textContent = 'Processing...';

            // --- Get User ID (Needs proper auth implementation) ---
            const userString = localStorage.getItem('user');
            let user = null;
            try {
                 user = userString ? JSON.parse(userString) : null;
            } catch(parseError){
                 console.error("Error parsing user from localStorage:", parseError);
                 displayError("Session error. Please log in again.");
                 return;
            }

            if (!user || !user.id) {
                displayError("You must be logged in to place an order.");
                 placeOrderBtn.textContent = 'Place Order';
                 placeOrderBtn.disabled = false;
                return;
            }
            const userId = user.id;

            // --- Get Form Data ---
            const formData = new FormData(checkoutForm);
            const shippingAddress = {
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip: formData.get('zip'),
                country: formData.get('country')
            };
            const paymentMethod = formData.get('payment_method'); // 'COD' or 'Online'

            // --- Basic Frontend Validation ---
            if (!shippingAddress.name || !shippingAddress.email || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country || !paymentMethod) {
                 displayError("Please fill in all required fields.");
                 // Re-enable button if validation fails
                 placeOrderBtn.textContent = 'Place Order';
                 placeOrderBtn.disabled = false;
                 return;
            }

            // --- Prepare Order Payload ---
             cartItems = getCart(); // Ensure cartItems is up-to-date
             if (!cartItems || cartItems.length === 0) {
                displayError("Cannot place order, your cart is empty.");
                placeOrderBtn.textContent = 'Place Order';
                placeOrderBtn.disabled = false;
                return;
             }
            // Recalculate total just before sending
            let finalSubtotal = 0;
            cartItems.forEach(item => {
                const price = parseFloat(item.price);
                const quantity = parseInt(item.quantity);
                if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
                    finalSubtotal += price * quantity;
                }
            });
            const finalTax = finalSubtotal * orderTotals.taxRate;
            const finalTotal = finalSubtotal + orderTotals.shipping + finalTax;


            const orderPayload = {
                userId: userId, // Still insecure, needs proper auth later
                items: cartItems.filter(item => item && item.id && item.name && !isNaN(parseFloat(item.price)) && !isNaN(parseInt(item.quantity)) && item.quantity > 0)
                                .map(item => ({
                                    productId: item.id,
                                    name: item.name,
                                    quantity: parseInt(item.quantity),
                                    price: parseFloat(item.price),
                                    image: item.image
                                })),
                totalAmount: finalTotal,
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod
            };

            // --- Call Backend API to Create Order ---
            try {
                console.log("Sending order payload:", JSON.stringify(orderPayload));

                // --- **URL CORRECTION**: Added /api ---
                const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${your_auth_token}` // Add once auth is implemented
                    },
                    body: JSON.stringify(orderPayload),
                });

                if (!response.ok) {
                     let errorMsg = `Order placement failed (Status: ${response.status})`;
                     try {
                         const errorResult = await response.json();
                         errorMsg = errorResult.message || errorMsg;
                     } catch (jsonError) {
                         errorMsg = `Order placement failed: ${response.statusText} (Status: ${response.status})`;
                     }
                     throw new Error(errorMsg);
                }

                const result = await response.json();
                console.log("Backend create order response:", result);

                const internalOrderId = result.orderId; // Your DB order ID

                if (paymentMethod === 'Online') {
                    // --- Online Payment: Initiate Razorpay Checkout ---
                    if (!result.razorpayOrderId || !result.amount || !result.keyId) {
                         displayError("Failed to get payment details from server. Please try again or select COD.");
                         placeOrderBtn.textContent = 'Place Order'; // Reset button
                         placeOrderBtn.disabled = false;
                         return;
                    }

                    const options = {
                        key: result.keyId,
                        amount: result.amount,
                        currency: result.currency || "INR",
                        name: "ShopWave", // Your Store Name
                        description: `Order ID: ${internalOrderId}`,
                        order_id: result.razorpayOrderId,
                        handler: async function (rzpResponse) {
                            console.log("Razorpay Success Response:", rzpResponse);
                            placeOrderBtn.textContent = 'Verifying Payment...';

                            const verificationResult = await verifyPaymentOnServer({
                                 razorpay_order_id: rzpResponse.razorpay_order_id,
                                 razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                 razorpay_signature: rzpResponse.razorpay_signature
                            });

                            console.log("Backend Verification Result:", verificationResult);

                            if (verificationResult && verificationResult.success) {
                                alert('Payment Successful! Order Confirmed.');
                                if (typeof getCart === 'function') {
                                    localStorage.removeItem('shoppingCart');
                                    window.dispatchEvent(new CustomEvent('cartUpdated'));
                                    console.log("Cart Cleared after verification.");
                                }
                                window.location.href = `order_confirmation.html?orderId=${verificationResult.orderId || internalOrderId}`;
                            } else {
                                displayError(`Payment verification failed: ${verificationResult.message || 'Unknown error'}. Your order might be incomplete. Please contact support with Order ID: ${internalOrderId}`);
                                 placeOrderBtn.textContent = 'Verification Failed - Retry or Contact Support';
                                 // Keep button disabled or enable based on desired retry flow
                                 // placeOrderBtn.disabled = false;
                            }
                        },
                        prefill: {
                            name: shippingAddress.name,
                            email: shippingAddress.email,
                            contact: shippingAddress.phone
                        },
                        notes: {
                            internal_order_id: internalOrderId,
                            address: `${shippingAddress.street}, ${shippingAddress.city}`
                        },
                        theme: {
                            color: "#2563EB"
                        },
                         modal: {
                            ondismiss: function(){
                                console.log('Razorpay Checkout form closed by user');
                                displayError('Payment was cancelled or interrupted.', true);
                                placeOrderBtn.textContent = 'Place Order';
                                placeOrderBtn.disabled = false;
                            }
                        }
                    };

                    const rzp = new Razorpay(options);

                    rzp.on('payment.failed', function (response){
                        console.error("Razorpay Payment Failed Event:", response.error);
                        let reason = response.error.reason || 'Unknown Reason';
                        let description = response.error.description || 'Payment could not be processed.';
                        let code = response.error.code || 'N/A';
                        console.error("Failure Metadata:", response.error.metadata);
                        displayError(`Payment Failed: ${description} (Reason: ${reason}, Code: ${code})`);
                         placeOrderBtn.textContent = 'Payment Failed - Try Again';
                         placeOrderBtn.disabled = false;
                    });

                    console.log("Opening Razorpay Checkout...");
                    rzp.open();

                } else { // COD
                    console.log("COD Order placed successfully (ID:", internalOrderId, ")");
                     if (typeof getCart === 'function') {
                         localStorage.removeItem('shoppingCart');
                         window.dispatchEvent(new CustomEvent('cartUpdated'));
                         console.log("Cart Cleared for COD.");
                     }
                    window.location.href = `order_confirmation.html?orderId=${internalOrderId}`;
                }

            } catch (error) {
                console.error('Checkout Submission Error:', error);
                displayError(error.message || 'An unexpected error occurred. Please try again.');
                // Reset button in displayError
            }
        });
    } else {
        console.error("Checkout form or place order button not found!");
         displayError("Checkout page is broken. Cannot place order.");
    }

    // --- Initial Load ---
    loadCartSummary(); // Load summary on page load

}); // End DOMContentLoaded
