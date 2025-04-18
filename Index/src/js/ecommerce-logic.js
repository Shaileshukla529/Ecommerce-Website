/**
 * ecommerce-logic.js
 * Handles core e-commerce functionalities: Wishlist & Cart management,
 * rendering wishlist page, product grid interactions, and badge updates.
 * Replaces wish.js, product.js, cart.js (partially), wishlist-logic.js and inline scripts.
 */

// --- Constants ---
const WISHLIST_STORAGE_KEY = 'shoppingWishlist';
const CART_STORAGE_KEY = 'shoppingCart';

// --- Utility Functions for localStorage ---

/**
 * Safely parses JSON from localStorage with basic validation.
 * @param {string} key - The localStorage key.
 * @param {function} [validator=null] - Optional function to validate each item.
 * @returns {Array} - The parsed and validated array or an empty array.
 */
function getFromStorage(key, validator = null) {
    const dataString = localStorage.getItem(key);
    if (!dataString) return [];
    try {
        const parsedData = JSON.parse(dataString);
        if (Array.isArray(parsedData)) {
            // Apply validator if provided
            return validator ? parsedData.filter(validator) : parsedData;
        }
        console.warn(`Data retrieved from localStorage key "${key}" is not an array.`);
        return [];
    } catch (e) {
        console.error(`Error parsing JSON from localStorage key "${key}":`, e);
        return [];
    }
}

/**
 * Safely saves data to localStorage and dispatches an update event.
 * @param {string} key - The localStorage key.
 * @param {Array} data - The array data to save.
 * @param {string} eventName - The name of the custom event to dispatch.
 */
function saveToStorage(key, data, eventName) {
    if (!Array.isArray(data)) {
        console.error(`Attempted to save invalid data (not an array) to localStorage key "${key}":`, data);
        return;
    }
    try {
        localStorage.setItem(key, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent(eventName)); // Notify other parts of the app/tabs
        console.log(`Data saved to localStorage key "${key}" and event "${eventName}" dispatched.`);
    } catch (e) {
        console.error(`Error saving data to localStorage key "${key}":`, e);
    }
}

// --- Item Validators ---
const isValidWishlistItem = item => item && item.id && item.name && typeof item.price !== 'undefined';
const isValidCartItem = item => item && item.id && item.name && typeof item.price !== 'undefined' && typeof item.quantity !== 'undefined' && !isNaN(parseInt(item.quantity, 10));

// --- Wishlist Functions ---

function getWishlist() {
    return getFromStorage(WISHLIST_STORAGE_KEY, isValidWishlistItem);
}

function saveWishlist(wishlist) {
    saveToStorage(WISHLIST_STORAGE_KEY, wishlist, 'wishlistUpdated');
}

/**
 * Adds an item to the wishlist. Prevents duplicates.
 */
function addItemToWishlist(productId, productName, productPrice, productImage) {
    console.log(`Attempting to add to wishlist: ${productId}, Name: ${productName}`);
    if (!productId || !productName || isNaN(parseFloat(productPrice))) {
        console.error("Invalid product data provided to addItemToWishlist");
        alert("Could not add item to wishlist due to invalid data.");
        return;
    }

    const wishlist = getWishlist();
    const productIdStr = String(productId);
    const existingItemIndex = wishlist.findIndex(item => String(item.id) === productIdStr);

    if (existingItemIndex > -1) {
        console.log(`Item ${productIdStr} is already in the wishlist.`);
        alert(`${productName} is already in your wishlist!`);
    } else {
        const newItem = {
            id: productIdStr,
            name: productName,
            price: parseFloat(productPrice),
            image: productImage || '',
            // Wishlist items usually don't need quantity, but add if needed
            // quantity: 1
        };
        wishlist.push(newItem);
        saveWishlist(wishlist); // Save and trigger update event
        alert(`${productName} added to wishlist!`);
        console.log(`Item ${productIdStr} added to wishlist.`);
    }
}

function removeItemFromWishlist(productIdToRemove) {
    let wishlist = getWishlist();
    const productIdStr = String(productIdToRemove);
    const initialLength = wishlist.length;
    wishlist = wishlist.filter(item => String(item.id) !== productIdStr);

    if (wishlist.length < initialLength) {
        saveWishlist(wishlist); // This triggers wishlistUpdated event
        console.log(`Item ${productIdStr} removed from wishlist.`);
    } else {
        console.warn(`Item ${productIdStr} not found in wishlist for removal.`);
    }
}

function clearWishlist() {
    if (confirm("Are you sure you want to clear your entire wishlist?")) {
        saveWishlist([]);
    }
}

// --- Cart Functions ---

function getCart() {
    return getFromStorage(CART_STORAGE_KEY, isValidCartItem);
}

function saveCart(cart) {
    saveToStorage(CART_STORAGE_KEY, cart, 'cartUpdated');
}

/**
 * Adds an item to the shopping cart or updates its quantity.
 */
function addItemToCart(productId, productName, productPrice, productImage, quantityToAdd = 1) {
    console.log(`Attempting to add to cart: ${productId}, Name: ${productName}, Qty: ${quantityToAdd}`);
    const quantity = parseInt(quantityToAdd, 10);
    const price = parseFloat(productPrice);

    if (!productId || !productName || isNaN(price) || isNaN(quantity) || quantity < 1) {
        console.error("Invalid product data provided to addItemToCart:", { productId, productName, productPrice, quantityToAdd });
        alert("Could not add item to cart due to invalid data.");
        return false; // Indicate failure
    }

    const cart = getCart();
    const productIdStr = String(productId);
    const existingItemIndex = cart.findIndex(item => String(item.id) === productIdStr);

    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += quantity;
        console.log(`Item ${productIdStr} exists in cart, updated quantity to: ${cart[existingItemIndex].quantity}`);
    } else {
        const newItem = {
            id: productIdStr,
            name: productName,
            price: price,
            image: productImage || '',
            quantity: quantity
        };
        cart.push(newItem);
        console.log(`Item ${productIdStr} added to cart.`);
    }
    saveCart(cart); // Save updated cart (triggers cartUpdated event)
    alert(`${productName} added to cart!`); // Provide feedback
    return true; // Indicate success
}

// --- Badge Update Functions ---

function updateWishlistBadge() {
    // Find badge element dynamically in case of SPA navigation or late loading
    const badgeElement = document.querySelector('.navbar-actions a[href="/wish"] .badge, .navbar-actions a[href="wish.html"] .badge');
    if (!badgeElement) return; // Silently exit if badge element not found
    const count = getWishlist().length;
    badgeElement.textContent = count;
    badgeElement.style.display = count > 0 ? 'flex' : 'none'; // Use 'flex' or 'inline-block' based on CSS
    console.log("Wishlist badge updated:", count);
}

function updateCartBadge() {
    const badgeElement = document.querySelector('.navbar-actions a[href="/cart"] .badge');
    if (!badgeElement) return;
    const cart = getCart();
    let totalQuantity = 0;
    cart.forEach(item => { totalQuantity += parseInt(item.quantity, 10) || 0; });
    badgeElement.textContent = totalQuantity;
    badgeElement.style.display = totalQuantity > 0 ? 'flex' : 'none';
    console.log("Cart badge updated:", totalQuantity);
}


// --- DOMContentLoaded Listener ---
// Setup event listeners and run page-specific logic
document.addEventListener('DOMContentLoaded', function () {

    // --- DOM Element References (Page Specific) ---
    const wishlistContainer = document.getElementById('wishlist-container');
    const itemsBody = document.getElementById('wishlist-items-body');
    const emptyMessage = document.getElementById('empty-wishlist-message');
    const clearButton = document.getElementById('clear-wishlist-btn');
    const productGrids = document.querySelectorAll('.product-grid');
    const currentYearSpan = document.getElementById('currentYear');

    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Wishlist Page Rendering Function ---
    function renderWishlistPage() {
        // Only run if we are on the wishlist page (check for itemsBody)
        if (!itemsBody) return;

        console.log("Rendering wishlist page content...");
        const wishlist = getWishlist();

        itemsBody.innerHTML = ''; // Clear previous items

        if (wishlist.length === 0) {
            if (wishlistContainer) wishlistContainer.style.display = 'none';
            if (emptyMessage) emptyMessage.style.display = 'block';
        } else {
            if (wishlistContainer) wishlistContainer.style.display = 'block';
            if (emptyMessage) emptyMessage.style.display = 'none';

            wishlist.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.classList.add('cart-item'); // Reuse cart styling
                itemElement.dataset.wishlistItemId = item.id;

                const price = parseFloat(item.price);
                const formattedPrice = !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A';
                const defaultImage = 'https://placehold.co/80x90/cccccc/ffffff?text=No+Image';
                const imageSrc = item.image || defaultImage;
                const itemName = item.name || 'Unnamed Product';

                // Ensure buttons have correct classes for event delegation
                itemElement.innerHTML = `
                    <div class="item-details">
                        <img src="${imageSrc}" alt="${itemName}" onerror="this.onerror=null;this.src='${defaultImage}';">
                        <div class="item-info">
                            <div class="item-name"><a href="/product/${item.id}">${itemName}</a></div>
                        </div>
                    </div>
                    <div class="item-price-col">${formattedPrice}</div>
                    <div class="item-actions">
                        <button class="btn-add-to-cart" data-product-id="${item.id}" data-name="${itemName}" data-price="${price}" data-image="${imageSrc}">Add to Cart</button>
                        <button class="remove-item" data-product-id="${item.id}" data-name="${itemName}" aria-label="Remove ${itemName} from Wishlist">&times; Remove</button>
                    </div>
                `;
                itemsBody.appendChild(itemElement);
            });
        }
        // Update badge after rendering this specific page
        updateWishlistBadge();
    }

    // --- Event Handlers ---

    // Handler for actions within the wishlist items container (wish.html)
    function handleWishlistPageActions(event) {
        const target = event.target;

        // Handle "Add to Cart" click on wishlist page
        if (target.classList.contains('btn-add-to-cart')) {
            const button = target;
            const productId = button.dataset.productId;
            const productName = button.dataset.name;
            const productPrice = parseFloat(button.dataset.price);
            const productImage = button.dataset.image;

            if (isNaN(productPrice)) {
                console.error("Invalid price data for item:", productId);
                alert("Cannot add item: price is invalid.");
                return;
            }
            // Add to cart and, if successful, remove from wishlist
            if (addItemToCart(productId, productName, productPrice, productImage, 1)) {
                console.log(`Item ${productId} added to cart, now removing from wishlist.`);
                removeItemFromWishlist(productId); // This triggers save & event
            }
        }

        // Handle "Remove" click on wishlist page
        if (target.classList.contains('remove-item')) {
            const button = target;
            const productId = button.dataset.productId;
            const productName = button.dataset.name || 'this item';
            if (confirm(`Remove "${productName}" from your wishlist?`)) {
                removeItemFromWishlist(productId); // This triggers save & event
            }
        }
    }

    // Handler for actions within product grids (other pages)
    function handleProductGridActions(event) {
        const target = event.target;
        const productCard = target.closest('.product-card');
        if (!productCard) return; // Exit if click wasn't inside a product card

        const productId = productCard.dataset.productId;
        const productName = productCard.querySelector('.product-name a')?.textContent || 'Unknown Product';
        const priceElement = productCard.querySelector('.product-price');
        const productImageElement = productCard.querySelector('.product-image');
        const productImage = productImageElement ? productImageElement.src : '';

        // --- Price Extraction Logic ---
        let productPrice = NaN;
        if (priceElement) {
            let productPriceText = (priceElement.textContent || '0').replace(/[$,]/g, '').trim();
            const priceMatch = productPriceText.match(/[\d.]+/); // Get first number
            productPrice = priceMatch ? parseFloat(priceMatch[0]) : NaN;
        }

        // Handle "Add to Wishlist" click on product grids
        if (target.closest('.btn-icon[aria-label="Add to Wishlist"]')) {
            event.preventDefault();
            if (productId && productName && !isNaN(productPrice)) {
                addItemToWishlist(productId, productName, productPrice, productImage);
            } else {
                console.error("Failed to extract product details for wishlist:", { productId, productName, productPrice, productImage });
                alert("Error: Could not get product details to add to wishlist.");
            }
        }

        // Handle "Add to Cart" click on product grids
        if (target.closest('.btn-icon[aria-label="Add to Cart"]')) {
            event.preventDefault();
             if (productId && productName && !isNaN(productPrice)) {
                 addItemToCart(productId, productName, productPrice, productImage, 1);
             } else {
                 console.error("Failed to extract product details for cart:", { productId, productName, productPrice, productImage });
                 alert("Error: Could not get product details to add to cart.");
             }
        }

         // Handle "Quick View" click (Placeholder)
         if (target.closest('.btn-icon[aria-label="Quick View"]')) {
           
         }
    }

    // --- Initialization and Global Event Listeners ---

    // Initial badge updates on any page load
    updateWishlistBadge();
    updateCartBadge();

    // Initial render ONLY if on the wishlist page
    renderWishlistPage();

    // Setup page-specific event listeners
    if (itemsBody) { // If on wishlist page
        itemsBody.addEventListener('click', handleWishlistPageActions);
        if (clearButton) {
            clearButton.addEventListener('click', clearWishlist);
        }
    }

    if (productGrids.length > 0) { // If on a page with product grids
        productGrids.forEach(grid => {
            grid.addEventListener('click', handleProductGridActions);
        });
    }

    // Listen for custom events triggered by storage saves (for badge updates)
    window.addEventListener('wishlistUpdated', () => {
        console.log("wishlistUpdated event received.");
        // Re-render wishlist page content IF we are on that page
        if (itemsBody) {
             renderWishlistPage();
        }
        updateWishlistBadge(); // Always update badge
    });

    window.addEventListener('cartUpdated', () => {
        console.log("cartUpdated event received.");
        updateCartBadge(); // Always update badge
    });

    // Listen for storage events (changes in other tabs)
    window.addEventListener('storage', (event) => {
        if (event.key === WISHLIST_STORAGE_KEY) {
            console.log("Storage event detected for wishlist.");
            window.dispatchEvent(new CustomEvent('wishlistUpdated')); // Trigger updates
        }
        if (event.key === CART_STORAGE_KEY) {
            console.log("Storage event detected for cart.");
            window.dispatchEvent(new CustomEvent('cartUpdated')); // Trigger updates
        }
    });

}); // End DOMContentLoaded
