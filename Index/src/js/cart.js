/**
 * cart.js - Rewritten for dynamic rendering and robust calculations.
 */
document.addEventListener('DOMContentLoaded', function() {

    // --- DOM Element References ---
    const cartContainer = document.querySelector('.cart-container');
    const cartItemsBody = document.getElementById('cart-items-body'); // Container for dynamic rows
    const emptyCartMessage = document.querySelector('.empty-cart');

    // Summary Elements
    const summarySubtotalEl = document.getElementById('summary-subtotal');
    const summaryShippingEl = document.getElementById('summary-shipping');
    const summaryTaxEl = document.getElementById('summary-tax');
    const summaryTotalEl = document.getElementById('summary-total');
    const discountPlaceholder = document.getElementById('discount-row-placeholder'); // Where discount row goes

    // Buttons & Inputs
    const clearCartBtn = document.querySelector('.clear-cart');
    const couponInput = document.querySelector('.coupon-input');
    const couponBtn = document.querySelector('.coupon-btn');
    const couponMessageEl = document.getElementById('coupon-message');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // --- Configuration ---
    const TAX_RATE = 0.08; // Example Tax Rate (8%)
    const VALID_COUPONS = { // Example Coupons
        'SAVE10': { type: 'percentage', value: 0.10 }, // 10% off
        'FREESHIP': { type: 'shipping', value: 0 }      // Free shipping
    };
    let appliedCoupon = null; // Store the currently applied coupon code

    // --- localStorage Functions ---
    function getCart() {
        const cart = localStorage.getItem('shoppingCart');
        // Basic validation of stored data
        try {
            const parsedCart = cart ? JSON.parse(cart) : [];
            if (Array.isArray(parsedCart)) {
                // Further validation: ensure items have basic structure
                return parsedCart.filter(item => item && item.id && item.name && !isNaN(parseFloat(item.price)) && !isNaN(parseInt(item.quantity, 10)));
            }
        } catch (e) {
            console.error("Error parsing cart from localStorage:", e);
        }
        return []; // Return empty array on error or invalid data
    }

    function saveCart(cart) {
        if (!Array.isArray(cart)) {
            console.error("Attempted to save invalid cart data:", cart);
            return;
        }
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
        // Dispatch event for other parts of the site (like header count)
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        console.log("Cart saved to localStorage:", cart);
    }

    // --- Core Cart Functions ---
    function renderCartItems() {
        console.log("Rendering cart items..."); // Good: Logs when it starts
    
        const cart = getCart(); // Get potentially filtered/validated cart data
    
        // Ensure cartItemsBody exists before manipulating
        if (!cartItemsBody) {
            console.error("Critical Error: cartItemsBody element not found!");
            return; // Stop if the container isn't there
        }
    
        cartItemsBody.innerHTML = ''; // Clear previous items - Standard practice
    
        if (cart.length === 0) {
            // Handle empty cart scenario
            checkEmptyCart(); // Updates visibility of container/message
            updateCartSummary(); // Ensure summary resets (e.g., to $0.00)
            console.log("Cart is empty, rendering finished.");
            return; // Stop processing
        }
    
        // If cart has items, loop through them
        cart.forEach(item => {
            // Validate item structure again (optional, belt-and-suspenders)
            if (!item || typeof item.id === 'undefined' || typeof item.name === 'undefined' || isNaN(parseFloat(item.price)) || isNaN(parseInt(item.quantity, 10))) {
                console.warn("Skipping rendering invalid item:", item);
                return; // Skip this item using 'return' inside forEach
            }
    
            const price = parseFloat(item.price);
            const quantity = parseInt(item.quantity, 10);
    
            // Added check for invalid quantity/price after parsing, although getCart should filter
            if (isNaN(price) || isNaN(quantity) || quantity <= 0) {
                 console.warn(`Skipping item ${item.id} due to invalid price/quantity after parsing:`, { price, quantity });
                 return; // Skip this item
            }
    
            const itemSubtotal = (price * quantity).toFixed(2);
    
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            itemElement.dataset.productId = item.id; // Use data attribute for ID
    
            // Use template literal for cleaner HTML generation
            // Ensure all classes match your CSS and event listener selectors
            itemElement.innerHTML = `
                <div class="product-info">
                    <img src="${item.image || 'https://placehold.co/80x80/eee/ccc?text=No+Img'}" alt="${item.name}" class="product-image" onerror="this.onerror=null; this.src='https://placehold.co/80x80/eee/ccc?text=Error'; this.style.display='none';">  
                    <div class="product-details">
                        <h3 class="product-title">${item.name}</h3>
                        </div>
                </div>
                <div class="product-price">$${price.toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn minus" aria-label="Decrease quantity"><i class="fas fa-minus"></i></button>
                    <input type="number" class="quantity-input" value="${quantity}" min="1" max="99" aria-label="Item quantity">
                    <button class="quantity-btn plus" aria-label="Increase quantity"><i class="fas fa-plus"></i></button>
                </div>
                <div class="item-subtotal">$${itemSubtotal}</div>
                <button class="remove-item" aria-label="Remove item"><i class="fas fa-times"></i></button>
            `;
            // Added basic error handling for image loading in onerror
    
            cartItemsBody.appendChild(itemElement); // Add the new row to the body
        });
    
        // After rendering all items, update summary and check empty state
        updateCartSummary();
        checkEmptyCart(); // Ensures main container is visible if items were added
        console.log(`Finished rendering ${cart.length} cart items.`);
    } // Removed the '--' which might have been accidentally added
    function updateItemQuantity(productId, newQuantity) {
        console.log(`Updating quantity for ${productId} to ${newQuantity}`);
        let cart = getCart();
        const itemIndex = cart.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            if (newQuantity >= 1) {
                cart[itemIndex].quantity = newQuantity;
                saveCart(cart);
                // Update the specific input field value (visual consistency)
                const inputField = cartItemsBody.querySelector(`.cart-item[data-product-id="${productId}"] .quantity-input`);
                if (inputField) inputField.value = newQuantity;
                // Update summary which recalculates all line item subtotals implicitly
                updateCartSummary();
            } else {
                // Treat quantity < 1 as removal
                removeItem(productId);
            }
        } else {
            console.warn(`Item with ID ${productId} not found in cart for quantity update.`);
        }
    }

    function removeItem(productId) {
        console.log(`Removing item ${productId}`);
        let cart = getCart();
        const initialLength = cart.length;
        cart = cart.filter(item => item.id !== productId);

        if (cart.length < initialLength) {
            saveCart(cart);
            renderCartItems(); // Re-render the entire cart list for simplicity
            console.log(`Item ${productId} removed successfully.`);
        } else {
            console.warn(`Item with ID ${productId} not found for removal.`);
        }
    }

    function updateCartSummary() {
        console.log("Updating cart summary...");
        const cart = getCart();
        let subtotal = 0;
        let shipping = 0;
        let discount = 0;

        cart.forEach(item => {
            subtotal += parseFloat(item.price) * parseInt(item.quantity, 10);
        });

        // --- Shipping Calculation ---
        // Read base shipping from HTML (or apply rules)
        const baseShippingText = summaryShippingEl ? summaryShippingEl.textContent : '$0';
        let baseShipping = parseFloat(baseShippingText.replace('$', '')) || 0; // Default to 0 if parsing fails

        // Apply shipping rules (e.g., free shipping if coupon applied)
        if (appliedCoupon && VALID_COUPONS[appliedCoupon]?.type === 'shipping') {
            shipping = 0; // Free shipping coupon
        } else if (cart.length > 0) {
            shipping = baseShipping; // Apply base shipping if cart not empty
        } else {
            shipping = 0; // No shipping if cart is empty
        }


        // --- Discount Calculation ---
        let discountText = '';
        if (appliedCoupon && VALID_COUPONS[appliedCoupon]) {
            const coupon = VALID_COUPONS[appliedCoupon];
            if (coupon.type === 'percentage') {
                discount = subtotal * coupon.value;
                discountText = `Discount (${(coupon.value * 100).toFixed(0)}%)`;
            }
            // Add other coupon types here (e.g., fixed amount)
        }

        // Remove previous discount row
        const existingDiscountRow = document.getElementById('summary-discount-row');
        if (existingDiscountRow) existingDiscountRow.remove();

        // Add new discount row if applicable
        if (discount > 0) {
            const discountRow = document.createElement('div');
            discountRow.className = 'summary-row discount'; // Add class for styling
            discountRow.id = 'summary-discount-row'; // Add ID for removal
            discountRow.innerHTML = `
                <span>${discountText}</span>
                <span>-$${discount.toFixed(2)}</span>
            `;
            // Insert before the total row placeholder (or total row itself)
            discountPlaceholder.appendChild(discountRow);
        }

        // --- Tax Calculation ---
        const taxableAmount = subtotal - (VALID_COUPONS[appliedCoupon]?.type === 'percentage' ? discount : 0); // Apply tax after percentage discount
        const tax = taxableAmount * TAX_RATE;

        // --- Total Calculation ---
        const total = subtotal + shipping + tax - discount;

        // --- Update DOM Elements ---
        if (summarySubtotalEl) summarySubtotalEl.textContent = '$' + subtotal.toFixed(2);
        if (summaryShippingEl) summaryShippingEl.textContent = '$' + shipping.toFixed(2);
        if (summaryTaxEl) summaryTaxEl.textContent = '$' + tax.toFixed(2);
        if (summaryTotalEl) summaryTotalEl.textContent = '$' + Math.max(0, total).toFixed(2); // Ensure total isn't negative

        console.log("Summary updated:", { subtotal, shipping, tax, discount, total });
    }

    function checkEmptyCart() {
        const cart = getCart();
        const isEmpty = cart.length === 0;
        console.log("Checking empty cart:", isEmpty);
        if (cartContainer) cartContainer.style.display = isEmpty ? 'none' : 'grid'; // Or 'flex'
        if (emptyCartMessage) emptyCartMessage.style.display = isEmpty ? 'block' : 'none';
    }

    function applyCoupon() {
        const code = couponInput.value.trim().toUpperCase();
        appliedCoupon = null; // Reset applied coupon first
         // Remove previous discount row immediately
        const existingDiscountRow = document.getElementById('summary-discount-row');
        if (existingDiscountRow) existingDiscountRow.remove();

        if (!code) {
            showCouponMessage("Please enter a coupon code.", false);
            updateCartSummary(); // Recalculate summary without coupon
            return;
        }

        if (VALID_COUPONS[code]) {
            appliedCoupon = code; // Set the valid applied coupon
            showCouponMessage(`Coupon "${code}" applied successfully!`, true);
            couponInput.value = ''; // Clear input on success
            updateCartSummary(); // Recalculate with the coupon
        } else {
            showCouponMessage("Invalid coupon code.", false);
            updateCartSummary(); // Recalculate summary without coupon
        }
    }

    function showCouponMessage(message, isSuccess) {
        if (couponMessageEl) {
            couponMessageEl.textContent = message;
            couponMessageEl.style.color = isSuccess ? 'green' : 'red';
            couponMessageEl.style.display = 'block';
            // Optional: Hide message after a few seconds
            setTimeout(() => { couponMessageEl.style.display = 'none'; }, 4000);
        }
    }

    // --- Event Listeners Setup ---

    // Event delegation for items within the cart body
    if (cartItemsBody) {
        cartItemsBody.addEventListener('click', function(event) {
            const target = event.target;
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;

            const productId = cartItem.dataset.productId;
            const quantityInput = cartItem.querySelector('.quantity-input');
            let currentQuantity = parseInt(quantityInput.value, 10);

            if (target.closest('.minus')) {
                updateItemQuantity(productId, currentQuantity - 1);
            } else if (target.closest('.plus')) {
                updateItemQuantity(productId, currentQuantity + 1);
            } else if (target.closest('.remove-item')) {
                if (confirm(`Remove "${cartItem.querySelector('.product-title').textContent}" from cart?`)) {
                     removeItem(productId);
                }
            }
        });

        cartItemsBody.addEventListener('change', function(event) {
            const target = event.target;
            if (target.classList.contains('quantity-input')) {
                const cartItem = target.closest('.cart-item');
                const productId = cartItem.dataset.productId;
                let newQuantity = parseInt(target.value, 10);

                if (isNaN(newQuantity) || newQuantity < 1) {
                    newQuantity = 1; // Correct invalid input
                    target.value = newQuantity; // Update input visually
                } else if (newQuantity > 99) { // Enforce max limit
                    newQuantity = 99;
                    target.value = newQuantity;
                }
                updateItemQuantity(productId, newQuantity);
            }
        });
    } else {
         console.error("Cart items body container (#cart-items-body) not found!");
    }


    // Clear Cart Button
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear the entire cart?')) {
                saveCart([]);
                appliedCoupon = null; // Clear coupon on clear cart
                renderCartItems(); // This will handle empty state and summary update
            }
        });
    }

    // Apply Coupon Button
    if (couponBtn) {
        couponBtn.addEventListener('click', applyCoupon);
    }
     // Optional: Apply coupon on Enter key press in input
     if (couponInput) {
         couponInput.addEventListener('keypress', function(event) {
             if (event.key === 'Enter') {
                 event.preventDefault(); // Prevent form submission if it's in a form
                 applyCoupon();
             }
         });
     }

    // Checkout Button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            const cart = getCart();
            if (cart.length === 0) {
                alert('Your cart is empty.');
                return;
            }
            // Proceed to checkout logic (e.g., redirect, send data to server)
            alert('Proceeding to checkout... (Implementation needed)');
            console.log("Checkout data:", { cart, appliedCoupon });
        });
    }

    // --- Initial Load ---
    renderCartItems();

}); // End DOMContentLoaded