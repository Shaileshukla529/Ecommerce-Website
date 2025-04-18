document.addEventListener('DOMContentLoaded',function() {
    const navbarCartBadge = document.querySelector('.navbar-actions a[href="/cart"] .badge'); // Selector for the badge
const productGrids = document.querySelectorAll('.product-grid'); // Select the grid containing products



function getCart() {
    const cart = localStorage.getItem('shoppingCart');
    // Basic validation of stored data
    try {
        const parsedCart = cart ? JSON.parse(cart) : [];
        if (Array.isArray(parsedCart)) {
            // Further validation: ensure items have basic structure
            return parsedCart.filter(item =>
                item &&
                item.id &&
                item.name &&
                !isNaN(parseFloat(item.price)) &&
                !isNaN(parseInt(item.quantity, 10))
            );
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
    window.dispatchEvent(new CustomEvent('cartUpdated')); // <<< IMPORTANT FOR BADGE
    console.log("Cart saved to localStorage:", cart);
}

/**
 * Adds an item to the shopping cart or updates its quantity if it already exists.
 * @param {string | number} productId - The unique ID of the product.
 * @param {string} productName - The name of the product.
 * @param {number} productPrice - The price of the product.
 * @param {string} productImage - The URL of the product image.
 * @param {number} quantityToAdd - The quantity to add (usually 1).
 */
function addItemToCart(productId, productName, productPrice, productImage, quantityToAdd = 1) {
    console.log(`Adding item: ${productId}, Name: ${productName}, Qty: ${quantityToAdd}`);
    if (!productId || !productName || isNaN(parseFloat(productPrice)) || isNaN(parseInt(quantityToAdd))) {
        console.error("Invalid product data provided to addItemToCart");
        alert("Could not add item due to invalid data.");
        return;
    }

    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === productId);

    if (existingItemIndex > -1) {
        // Item already exists, update quantity
        cart[existingItemIndex].quantity += quantityToAdd;
        console.log(`Item ${productId} exists, new quantity: ${cart[existingItemIndex].quantity}`);
    } else {
        // Item does not exist, add as new item
        const newItem = {
            id: productId,
            name: productName,
            price: parseFloat(productPrice), // Store as number
            image: productImage || '', // Handle potential missing image
            quantity: quantityToAdd
        };
        cart.push(newItem);
        console.log(`Item ${productId} added to cart.`);
    }

    saveCart(cart); // This will trigger the 'cartUpdated' event

    // Optional: Provide user feedback
    alert(`${productName} added to cart!`); // Simple feedback for now
}

// ============================================= //
// JS Section Start: Cart Badge Update          //
// ============================================= //

function updateCartBadge() {
    if (!navbarCartBadge) {
         console.warn("Cart badge element not found.");
         return;
    }

    const cart = getCart();
    let totalQuantity = 0;
    cart.forEach(item => {
        totalQuantity += item.quantity;
    });

    console.log("Updating cart badge count:", totalQuantity);
    navbarCartBadge.textContent = totalQuantity;

    // Show/hide badge based on quantity
    if (totalQuantity > 0) {
        navbarCartBadge.style.display = 'flex'; // Or 'inline-block', 'block' depending on your CSS
    } else {
        navbarCartBadge.style.display = 'none';
    }
}

// Listen for the custom event triggered by saveCart
window.addEventListener('cartUpdated', updateCartBadge);


// ============================================= //
// JS Section Start: Product Card Actions        //
// ============================================= //
if (productGrids.length > 0) { // <-- Check if ANY grids were found
    productGrids.forEach(grid => { // <-- Loop through each grid
        grid.addEventListener('click', function(event) {
            // Find the closest button with the 'Add to Cart' action
            const addToCartButton = event.target.closest('.btn-icon[aria-label="Add to Cart"]');

            if (addToCartButton) {
                event.preventDefault(); // Prevent any default button action if needed

                const productCard = addToCartButton.closest('.product-card');
                if (!productCard) return;

                const productId = productCard.dataset.productId;
                const productName = productCard.querySelector('.product-name a')?.textContent || 'Unknown Product';
                const priceElement = productCard.querySelector('.product-price');
                const productImageElement = productCard.querySelector('.product-image');

                // --- Price Extraction Logic ---
                let productPriceText = '0';
                if (priceElement) {
                    productPriceText = (priceElement.firstChild?.textContent || priceElement.textContent || '0').trim();
                    productPriceText = productPriceText.replace(/[$,]/g, '');
                }
                const productPrice = parseFloat(productPriceText);

                // --- Image Extraction Logic ---
                const productImage = productImageElement ? productImageElement.src : '';

                // Validate extracted data before adding
                if (productId && productName && !isNaN(productPrice)) {
                     addItemToCart(productId, productName, productPrice, productImage, 1);
                } else {
                    console.error("Failed to extract product details:", { productId, productName, productPriceText, productPrice, productImage });
                    alert("Error: Could not get product details to add to cart.");
                }
            }

            // Add logic for Wishlist or Quick View buttons here if needed
             const addToWishlistButton = event.target.closest('.btn-icon[aria-label="Add to Wishlist"]');
             if(addToWishlistButton) {
                 event.preventDefault();
                 alert('Add to Wishlist clicked! (Functionality not implemented yet)');
             }

             const quickViewButton = event.target.closest('.btn-icon[aria-label="Quick View"]');
             if(quickViewButton) {
                 event.preventDefault();
                  alert('Quick View clicked! (Functionality not implemented yet)');
             }
        }); // End of addEventListener for this grid
    }); // End of forEach loop
} else {
     console.warn("No product grid containers (.product-grid) found!"); // Updated warning
}
// ============================================= //
// JS Section End: Product Card Actions          //
// ============================================= //

// --- Initial Cart Badge Update on Load ---
updateCartBadge();
});