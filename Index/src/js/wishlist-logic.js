/**
 * wishlist-logic.js
 * Handles all JavaScript functionality for the wishlist page (wish.html).
 * Manages rendering, adding to cart, removing from wishlist, and badge updates.
 */
document.addEventListener('DOMContentLoaded', function () {

    // --- Constants ---
    const WISHLIST_STORAGE_KEY = 'shoppingWishlist';
    const CART_STORAGE_KEY = 'shoppingCart';

    // --- DOM Element References ---
    const wishlistContainer = document.getElementById('wishlist-container');
    const itemsBody = document.getElementById('wishlist-items-body');
    const emptyMessage = document.getElementById('empty-wishlist-message');
    const clearButton = document.getElementById('clear-wishlist-btn');
    const navbarWishlistBadge = document.querySelector('.navbar-actions a[href="/wishlist"] .badge, .navbar-actions a[href="wish.html"] .badge');
    const navbarCartBadge = document.querySelector('.navbar-actions a[href="/cart"] .badge'); // Assumes cart link is /cart

    // --- Utility Functions for localStorage ---

    /**
     * Safely parses JSON from localStorage.
     * @param {string} key - The localStorage key.
     * @returns {Array|null} - The parsed array or null if error/empty.
     */
    function getFromStorage(key) {
        const dataString = localStorage.getItem(key);
        if (!dataString) {
            return []; // Return empty array if nothing is stored
        }
        try {
            const parsedData = JSON.parse(dataString);
            // Basic validation: ensure it's an array and items have minimum required fields
            if (Array.isArray(parsedData)) {
                 if (key === WISHLIST_STORAGE_KEY) {
                    return parsedData.filter(item => item && item.id && item.name && typeof item.price !== 'undefined');
                 } else if (key === CART_STORAGE_KEY) {
                    return parsedData.filter(item => item && item.id && item.name && typeof item.price !== 'undefined' && typeof item.quantity !== 'undefined');
                 }
                 return parsedData; // Return as is if key is unknown
            }
             console.warn(`Data retrieved from localStorage key "${key}" is not an array.`);
             return []; // Return empty array if not an array
        } catch (e) {
            console.error(`Error parsing JSON from localStorage key "${key}":`, e);
            return []; // Return empty array on parsing error
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
            window.dispatchEvent(new CustomEvent(eventName)); // Notify other parts of the app
            console.log(`Data saved to localStorage key "${key}" and event "${eventName}" dispatched.`);
        } catch (e) {
             console.error(`Error saving data to localStorage key "${key}":`, e);
        }
    }

    // --- Wishlist Specific Functions ---

    function getWishlist() {
        return getFromStorage(WISHLIST_STORAGE_KEY);
    }

    function saveWishlist(wishlist) {
        saveToStorage(WISHLIST_STORAGE_KEY, wishlist, 'wishlistUpdated');
    }

    function removeItemFromWishlist(productIdToRemove) {
        let wishlist = getWishlist();
        const productIdStr = String(productIdToRemove); // Ensure consistent type for comparison
        const initialLength = wishlist.length;
        wishlist = wishlist.filter(item => String(item.id) !== productIdStr);

        if (wishlist.length < initialLength) {
             saveWishlist(wishlist); // Save the updated list (will trigger re-render via event)
             console.log(`Item ${productIdStr} removed from wishlist.`);
        } else {
             console.warn(`Item ${productIdStr} not found in wishlist for removal.`);
        }
    }

    function clearWishlist() {
        if (confirm("Are you sure you want to clear your entire wishlist?")) {
            saveWishlist([]); // Save an empty array (will trigger re-render via event)
        }
    }

    // --- Cart Specific Functions (needed for 'Add to Cart' from wishlist) ---

    function getCart() {
        return getFromStorage(CART_STORAGE_KEY);
    }

    function saveCart(cart) {
        saveToStorage(CART_STORAGE_KEY, cart, 'cartUpdated');
    }

    /**
     * Adds an item to the shopping cart or updates its quantity.
     */
    function addItemToCart(productId, productName, productPrice, productImage, quantityToAdd = 1) {
        console.log(`Adding to cart: ${productId}, Name: ${productName}, Qty: ${quantityToAdd}`);
        if (!productId || !productName || isNaN(parseFloat(productPrice)) || isNaN(parseInt(quantityToAdd))) {
            console.error("Invalid product data provided to addItemToCart");
            alert("Could not add item to cart due to invalid data.");
            return false; // Indicate failure
        }

        const cart = getCart();
        // Ensure consistent ID type (string) for comparison
        const productIdStr = String(productId);
        const existingItemIndex = cart.findIndex(item => String(item.id) === productIdStr);
        const price = parseFloat(productPrice);
        const quantity = parseInt(quantityToAdd, 10);


        if (existingItemIndex > -1) {
            // Item already exists, update quantity
             const newQuantity = cart[existingItemIndex].quantity + quantity;
             // Optional: Add check for max quantity if needed
             cart[existingItemIndex].quantity = newQuantity;
             console.log(`Item ${productIdStr} exists in cart, updated quantity to: ${newQuantity}`);
        } else {
            // Item does not exist, add as new item
            const newItem = {
                id: productIdStr, // Store ID as string
                name: productName,
                price: price,
                image: productImage || '', // Handle potential missing image
                quantity: quantity
            };
            cart.push(newItem);
            console.log(`Item ${productIdStr} added to cart.`);
        }

        saveCart(cart); // Save the updated cart (will trigger cart badge update via event)
        return true; // Indicate success
    }


    // --- Rendering ---

    function renderWishlist() {
        console.log("Rendering wishlist...");
        const wishlist = getWishlist();

        if (!itemsBody) {
            console.error("Wishlist items container (#wishlist-items-body) not found. Cannot render.");
            return;
        }
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
                itemElement.dataset.wishlistItemId = item.id; // Use data attribute

                const price = parseFloat(item.price);
                const formattedPrice = !isNaN(price) ? `$${price.toFixed(2)}` : 'N/A';
                const defaultImage = 'https://placehold.co/80x90/cccccc/ffffff?text=No+Image';
                const imageSrc = item.image || defaultImage;
                const itemName = item.name || 'Unnamed Product';

                itemElement.innerHTML = `
                    <div class="item-details">
                        <img src="${imageSrc}" alt="${itemName}" onerror="this.onerror=null;this.src='${defaultImage}';">
                        <div class="item-info">
                            <div class="item-name"><a href="/product/${item.id}">${itemName}</a></div>
                        </div>
                    </div>
                    <div class="item-price-col">${formattedPrice}</div>
                    <div class="item-actions">
                        <button class="btn-add-to-cart"
                                data-product-id="${item.id}"
                                data-name="${itemName}"
                                data-price="${price}"
                                data-image="${imageSrc}">Add to Cart</button>
                        <button class="remove-item"
                                data-product-id="${item.id}"
                                data-name="${itemName}"
                                aria-label="Remove ${itemName} from Wishlist">&times; Remove</button>
                    </div>
                `;
                itemsBody.appendChild(itemElement);
            });
        }
         // Update badge after rendering
         updateWishlistBadge();
    }

    // --- Badge Update Functions ---

    function updateWishlistBadge() {
        if (!navbarWishlistBadge) return; // Silently exit if badge element not found
        const wishlist = getWishlist();
        const count = wishlist.length;
        navbarWishlistBadge.textContent = count;
        navbarWishlistBadge.style.display = count > 0 ? 'flex' : 'none'; // Or 'inline-block' etc.
        console.log("Wishlist badge updated:", count);
    }

    function updateCartBadge() {
        if (!navbarCartBadge) return; // Silently exit if badge element not found
        const cart = getCart();
        let totalQuantity = 0;
        cart.forEach(item => {
            totalQuantity += parseInt(item.quantity, 10) || 0; // Ensure quantity is treated as number
        });
        navbarCartBadge.textContent = totalQuantity;
        navbarCartBadge.style.display = totalQuantity > 0 ? 'flex' : 'none';
        console.log("Cart badge updated:", totalQuantity);
    }

    // --- Event Handlers ---

    function handleWishlistActions(event) {
        const target = event.target;

        // Handle "Add to Cart" click
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

            // Attempt to add to cart
            const addedSuccessfully = addItemToCart(productId, productName, productPrice, productImage, 1);

            // If added successfully, remove from wishlist
            if (addedSuccessfully) {
                console.log(`Item ${productId} added to cart, now removing from wishlist.`);
                removeItemFromWishlist(productId); // This will trigger wishlist save & update event
            } else {
                 console.error(`Failed to add item ${productId} to cart.`);
                 // Optionally provide feedback to the user about the failure
                 // alert(`Could not add ${productName} to cart.`);
            }
        }

        // Handle "Remove" click
        if (target.classList.contains('remove-item')) {
            const button = target;
            const productId = button.dataset.productId;
            const productName = button.dataset.name || 'this item';
            if (confirm(`Remove "${productName}" from your wishlist?`)) {
                removeItemFromWishlist(productId); // This will trigger wishlist save & update event
            }
        }
    }

    // --- Initialization and Event Listeners ---

    // Initial render and badge updates
    renderWishlist();
    updateCartBadge(); // Update cart badge on initial load as well

    // Add event listeners
    if (itemsBody) {
        itemsBody.addEventListener('click', handleWishlistActions);
    } else {
         console.error("Cannot attach listener: Wishlist items container (#wishlist-items-body) not found.");
    }

    if (clearButton) {
        clearButton.addEventListener('click', clearWishlist);
    }

    // Listen for custom events triggered by storage saves
    window.addEventListener('wishlistUpdated', () => {
        console.log("wishlistUpdated event received.");
        renderWishlist(); // Re-render the list
        updateWishlistBadge(); // Update the badge count
    });

    window.addEventListener('cartUpdated', () => {
        console.log("cartUpdated event received.");
        updateCartBadge(); // Update the cart badge count
    });

    // Listen for storage events (changes in other tabs)
    window.addEventListener('storage', (event) => {
        if (event.key === WISHLIST_STORAGE_KEY) {
            console.log("Storage event detected for wishlist.");
            window.dispatchEvent(new CustomEvent('wishlistUpdated')); // Trigger update
        }
        if (event.key === CART_STORAGE_KEY) {
            console.log("Storage event detected for cart.");
            window.dispatchEvent(new CustomEvent('cartUpdated')); // Trigger update
        }
    });

}); // End DOMContentLoaded
