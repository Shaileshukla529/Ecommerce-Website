/* src/js/checkout.js */
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
        // Ensure amount is a number before formatting
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return '$?.??'; // Or some other indicator for invalid price
        }
        return `$${numericAmount.toFixed(2)}`;
    }

    // --- Load Cart and Display Summary ---
    function loadCartSummary() {
        // Ensure getCart is available (assuming it's global from ecommerce-logic.js)
        if (typeof getCart !== 'function') {
            console.error("getCart function not found. Ensure ecommerce-logic.js is loaded first.");
            displayError("Critical error: Cannot load cart data.");
            return;
        }
        cartItems = getCart();

        if (!cartItems || cartItems.length === 0) {
            displayError("Your cart is empty. Redirecting to cart page.");
            // Disable button immediately if cart is empty on load
            if (placeOrderBtn) placeOrderBtn.disabled = true;
            setTimeout(() => { window.location.href = 'Cart.html'; }, 2500);
            return;
        }

        if (!orderSummaryContainer || !summarySubtotalEl || !summaryShippingEl || !summaryTaxEl || !summaryTotalEl) {
             console.error("One or more summary DOM elements not found!");
             displayError("Checkout page structure seems broken. Cannot display summary.");
             return;
        }

        orderSummaryContainer.innerHTML = ''; // Clear previous summary items
        orderTotals.subtotal = 0;

        cartItems.forEach(item => {
            const itemPrice = parseFloat(item.price);
            const itemQuantity = parseInt(item.quantity, 10);

            // Basic validation for each item
            if (isNaN(itemPrice) || isNaN(itemQuantity) || itemQuantity <= 0) {
                console.warn(`Skipping invalid item in summary:`, item);
                return; // Skip this item
            }

            orderTotals.subtotal += itemPrice * itemQuantity;

            // Create item element for summary
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center';

            // *** THIS IS THE CORRECTED innerHTML part ***
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
            // *** End of Correction ***

            orderSummaryContainer.appendChild(itemElement);
        });

        // Calculate totals
        const tax = orderTotals.subtotal * orderTotals.taxRate;
        orderTotals.total = orderTotals.subtotal + orderTotals.shipping + tax;

        // Update summary display in DOM
        summarySubtotalEl.textContent = formatPrice(orderTotals.subtotal);
        summaryShippingEl.textContent = formatPrice(orderTotals.shipping);
        summaryTaxEl.textContent = formatPrice(tax);
        summaryTotalEl.textContent = formatPrice(orderTotals.total);
    }

    // --- Handle Payment Method Change ---
    paymentMethodRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            if (event.target.value === 'Online' && onlinePaymentDetailsDiv) { // Ensure check against 'Online' (uppercase)
                onlinePaymentDetailsDiv.classList.remove('hidden');
            } else if (onlinePaymentDetailsDiv) {
                onlinePaymentDetailsDiv.classList.add('hidden');
            }
        });
    });

     // --- Handle Verification Call ---
     async function verifyPaymentOnServer(paymentData) {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/verify-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Auth header if needed: 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(paymentData)
            });
            return await response.json(); // { success: boolean, message: string, orderId?: string }

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
                 // Consider redirecting to login
                 // window.location.href = 'login.html';
                 return;
            }

            if (!user || !user.id) {
                displayError("You must be logged in to place an order.");
                 placeOrderBtn.textContent = 'Place Order'; // Reset button text
                 placeOrderBtn.disabled = false; // Re-enable button
                // Optionally redirect to login
                // window.location.href = 'login.html';
                return;
            }
            const userId = user.id;

            // --- Get Form Data ---
            const formData = new FormData(checkoutForm);
            const shippingAddress = {
                name: formData.get('name'),
                email: formData.get('email'), // Include email
                phone: formData.get('phone'),
                street: formData.get('address'),
                city: formData.get('city'),
                state: formData.get('state'),
                zip: formData.get('zip'),
                country: formData.get('country')
            };
            // Use the corrected uppercase value 'COD' or 'Online'
            const paymentMethod = formData.get('payment_method');

            // --- Basic Frontend Validation (Example) ---
            if (!shippingAddress.name || !shippingAddress.email || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zip || !shippingAddress.country || !paymentMethod) {
                 displayError("Please fill in all required fields.");
                 return; // Stop submission
            }


            // --- Prepare Order Payload ---
             // Ensure cartItems is up-to-date before creating payload
             cartItems = getCart();
             if (!cartItems || cartItems.length === 0) {
                displayError("Cannot place order, your cart is empty.");
                return;
             }
            // Recalculate total just before sending, in case something changed
            let finalSubtotal = 0;
            cartItems.forEach(item => {
                finalSubtotal += (parseFloat(item.price) * parseInt(item.quantity));
            });
            const finalTax = finalSubtotal * orderTotals.taxRate;
            const finalTotal = finalSubtotal + orderTotals.shipping + finalTax;


            const orderPayload = {
                userId: userId,
                // Filter items just in case validation wasn't perfect earlier
                items: cartItems.filter(item => item && item.id && item.name && !isNaN(parseFloat(item.price)) && !isNaN(parseInt(item.quantity)) && item.quantity > 0)
                                .map(item => ({
                                    productId: item.id,
                                    name: item.name,
                                    quantity: parseInt(item.quantity),
                                    price: parseFloat(item.price),
                                    image: item.image
                                })),
                totalAmount: finalTotal, // Use recalculated total
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod // Should be 'COD' or 'Online'
            };

            // --- Call Backend API to Create Order ---
            try {
                console.log("Sending order payload:", JSON.stringify(orderPayload));
                const response = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${your_auth_token}` // Add once auth is implemented
                    },
                    body: JSON.stringify(orderPayload),
                });

                // Check if response is ok before trying to parse JSON
                if (!response.ok) {
                     // Attempt to get error message from backend JSON response
                     let errorMsg = `Order placement failed (Status: ${response.status})`;
                     try {
                         const errorResult = await response.json();
                         errorMsg = errorResult.message || errorMsg;
                     } catch (jsonError) {
                         // If response wasn't JSON, use status text
                         errorMsg = `Order placement failed: ${response.statusText} (Status: ${response.status})`;
                     }
                     throw new Error(errorMsg); // Throw error to be caught below
                }

                const result = await response.json(); // Contains orderId, razorpayOrderId, amount, keyId etc. if online
                console.log("Backend create order response:", result);

                const internalOrderId = result.orderId; // Your DB order ID

                if (paymentMethod === 'Online') {
                    // --- Online Payment: Initiate Razorpay Checkout ---
                    if (!result.razorpayOrderId || !result.amount || !result.keyId) {
                         // Backend should have sent these if paymentMethod was Online and order creation succeeded
                         displayError("Failed to get payment details from server. Please try again or select COD.");
                         return; // Stop if necessary details missing
                    }

                    const options = {
                        key: result.keyId,
                        amount: result.amount, // Amount in paise
                        currency: result.currency || "INR",
                        name: "ShopWave", // Your Store Name
                        description: `Order ID: ${internalOrderId}`, // Your internal order ID
                        order_id: result.razorpayOrderId, // Razorpay's generated Order ID
                        handler: async function (rzpResponse) {
                            // This function executes after payment is successful on Razorpay's side
                            console.log("Razorpay Success Response:", rzpResponse);
                            placeOrderBtn.textContent = 'Verifying Payment...'; // Update button text

                            // Send payment details to YOUR backend for verification
                            const verificationResult = await verifyPaymentOnServer({
                                 razorpay_order_id: rzpResponse.razorpay_order_id,
                                 razorpay_payment_id: rzpResponse.razorpay_payment_id,
                                 razorpay_signature: rzpResponse.razorpay_signature
                            });

                            console.log("Backend Verification Result:", verificationResult);

                            if (verificationResult && verificationResult.success) {
                                // --- Verification SUCCESS ---
                                alert('Payment Successful! Order Confirmed.');
                                // Clear cart *only* after successful server verification
                                if (typeof getCart === 'function') { // Check again before removing
                                    localStorage.removeItem('shoppingCart');
                                    window.dispatchEvent(new CustomEvent('cartUpdated'));
                                    console.log("Cart Cleared after verification.");
                                }
                                // Redirect to confirmation page
                                window.location.href = `order_confirmation.html?orderId=${verificationResult.orderId || internalOrderId}`;
                            } else {
                                // --- Verification FAILED ---
                                displayError(`Payment verification failed: ${verificationResult.message || 'Unknown error'}. Your order might be incomplete. Please contact support with Order ID: ${internalOrderId}`);
                                // DO NOT clear cart. User might need to retry or contact support.
                                 placeOrderBtn.textContent = 'Verification Failed - Retry or Contact Support'; // Update button state
                                 // Optionally keep button disabled or change its behavior
                            }
                        },
                        prefill: {
                            name: shippingAddress.name,
                            email: shippingAddress.email,
                            contact: shippingAddress.phone
                        },
                        notes: {
                            internal_order_id: internalOrderId, // Good practice to include your ID
                            address: `${shippingAddress.street}, ${shippingAddress.city}`
                        },
                        theme: {
                            color: "#2563EB" // Example: Tailwind blue-600
                        },
                         modal: {
                            ondismiss: function(){
                                console.log('Razorpay Checkout form closed by user');
                                displayError('Payment was cancelled or interrupted.', true); // Don't lock button
                                placeOrderBtn.textContent = 'Place Order'; // Reset button
                                placeOrderBtn.disabled = false;
                                // Consider backend logic: should the 'Pending' order be cancelled?
                            }
                        }
                    };

                    const rzp = new Razorpay(options);

                    rzp.on('payment.failed', function (response){
                        console.error("Razorpay Payment Failed Event:", response.error);
                        // Extract more specific details if available
                        let reason = response.error.reason || 'Unknown Reason';
                        let description = response.error.description || 'Payment could not be processed.';
                        let code = response.error.code || 'N/A';
                        // Metadata might contain useful info like order_id, payment_id
                        console.error("Failure Metadata:", response.error.metadata);

                        displayError(`Payment Failed: ${description} (Reason: ${reason}, Code: ${code})`);
                         // Optionally update your internal order status to Failed via another API call
                         placeOrderBtn.textContent = 'Payment Failed - Try Again'; // Reset button
                         placeOrderBtn.disabled = false;
                    });

                    console.log("Opening Razorpay Checkout...");
                    rzp.open();
                    // Let the handlers manage the button state from here

                } else { // COD
                    console.log("COD Order placed successfully (ID:", internalOrderId, ")");
                    // Clear cart
                     if (typeof getCart === 'function') {
                         localStorage.removeItem('shoppingCart');
                         window.dispatchEvent(new CustomEvent('cartUpdated'));
                         console.log("Cart Cleared for COD.");
                     }
                    // Redirect to confirmation page
                    window.location.href = `order_confirmation.html?orderId=${internalOrderId}`;
                }

            } catch (error) { // Catch errors from fetch or !response.ok throw
                console.error('Checkout Submission Error:', error);
                displayError(error.message || 'An unexpected error occurred. Please try again.');
                // Button state reset is handled within displayError
            }
        });
    } else {
        console.error("Checkout form or place order button not found!");
         displayError("Checkout page is broken. Cannot place order.");
    }

    // --- Initial Load ---
    loadCartSummary(); // Load summary on page load

}); // End DOMContentLoaded
