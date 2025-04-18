/* wish.js */
document.addEventListener('DOMContentLoaded', function () {
    // Use a more specific selector if multiple navbars exist, otherwise this is fine
    const navbarWishlistBadge = document.querySelector('.navbar-actions a[href="/wishlist"] .badge, .navbar-actions a[href="wish.html"] .badge'); // Try to find badge on index/wish page
    const productGrids = document.querySelectorAll('.product-grid'); // Used on index.html or similar pages

    const WISHLIST_STORAGE_KEY = 'shoppingWishlist'; // Define key consistently

    /**
     * Retrieves the wishlist from localStorage with validation.
     * @returns {Array} The parsed wishlist array or an empty array.
     */
    function getWishlist() {
        const wishlistString = localStorage.getItem(WISHLIST_STORAGE_KEY);
        try {
            const parsedWishlist = wishlistString ? JSON.parse(wishlistString) : [];
            if (Array.isArray(parsedWishlist)) {
                // Basic validation for each item
                return parsedWishlist.filter(item =>
                    item && typeof item === 'object' && // Ensure it's an object
                    item.id && // Must have an ID
                    item.name && // Must have a name
                    !isNaN(parseFloat(item.price)) && // Price should be a number
                    !isNaN(parseInt(item.quantity, 10)) // Quantity should be an integer
                );
            }
        } catch (e) {
            console.error("Error parsing wishlist from localStorage:", e);
        }
        return []; // Return empty array on error or invalid data
    }

    /**
     * Saves the wishlist to localStorage and dispatches an update event.
     * @param {Array} wishlist - The wishlist array to save.
     */
    function saveWishlist(wishlist) {
        if (!Array.isArray(wishlist)) {
            console.error("Attempted to save invalid wishlist data:", wishlist);
            return;
        }
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
        // Dispatch event for other parts of the site (like header count)
        window.dispatchEvent(new CustomEvent('wishlistUpdated')); // Event for badge update
        console.log("Wishlist saved to localStorage:", wishlist);
    }

    /**
     * Adds an item to the shopping wishlist or updates its quantity if it already exists.
     * @param {string | number} productId - The unique ID of the product.
     * @param {string} productName - The name of the product.
     * @param {number} productPrice - The price of the product.
     * @param {string} productImage - The URL of the product image.
     * @param {number} quantityToAdd - The quantity to add (usually 1).
     */
    function addItemToWishlist(productId, productName, productPrice, productImage, quantityToAdd = 1) {
        console.log(`Adding item to wishlist: ${productId}, Name: ${productName}, Qty: ${quantityToAdd}`);
        if (!productId || !productName || isNaN(parseFloat(productPrice)) || isNaN(parseInt(quantityToAdd))) {
            console.error("Invalid product data provided to addItemToWishlist");
            alert("Could not add item to wishlist due to invalid data.");
            return;
        }

        const wishlist = getWishlist();
        const existingItemIndex = wishlist.findIndex(item => item.id === String(productId)); // Ensure ID comparison is consistent

        if (existingItemIndex > -1) {
            // Item already exists - typically wishlists don't increase quantity, just note it's there.
            // If you want quantity, uncomment below:
            // wishlist[existingItemIndex].quantity += quantityToAdd;
            console.log(`Item ${productId} is already in the wishlist.`);
            alert(`${productName} is already in your wishlist!`); // Feedback
        } else {
            // Item does not exist, add as new item
            const newItem = {
                id: String(productId), // Store ID as string for consistency
                name: productName,
                price: parseFloat(productPrice), // Store as number
                image: productImage || '', // Handle potential missing image
                quantity: quantityToAdd // Usually 1 for wishlists
            };
            wishlist.push(newItem);
            console.log(`Item ${productId} added to wishlist.`);
            saveWishlist(wishlist); // Save and trigger update event
            alert(`${productName} added to wishlist!`); // Feedback
        }
    }

    // ============================================= //
    // JS Section Start: Wishlist Badge Update       //
    // ============================================= //

    /**
     * Updates the wishlist badge count in the navbar.
     */
    function updateWishlistBadge() {
        // Try finding the badge again in case navigation happened
         const badgeElement = document.querySelector('.navbar-actions a[href="/wishlist"] .badge, .navbar-actions a[href="wish.html"] .badge');
        if (!badgeElement) {
            // console.warn("Wishlist badge element not found on this page.");
            return; // Silently fail if badge isn't on the current page
        }

        const wishlist = getWishlist();
        const totalItems = wishlist.length; // Badge usually shows item count, not quantity sum

        console.log("Updating wishlist badge count:", totalItems);
        badgeElement.textContent = totalItems;

        // Show/hide badge based on count
        if (totalItems > 0) {
            badgeElement.style.display = 'flex'; // Or 'inline-block', 'block' depending on your CSS
        } else {
            badgeElement.style.display = 'none';
        }
    }

    // Listen for the custom event triggered by saveWishlist
    window.addEventListener('wishlistUpdated', updateWishlistBadge);

    // Initial wishlist Badge Update on Load
    updateWishlistBadge();

    // ============================================= //
    // JS Section End: Wishlist Badge Update         //
    // ============================================= //


    // ============================================= //
    // JS Section Start: Product Card Actions        //
    // (For index.html or shop pages)               //
    // ============================================= //
    if (productGrids.length > 0) {
        productGrids.forEach(grid => {
            grid.addEventListener('click', function (event) {
                // Find the closest button with the 'Add to Wishlist' action
                // Updated selector to target the heart icon specifically
                const addTowishlistButton = event.target.closest('.btn-icon[aria-label="Add to Wishlist"]');

                if (addTowishlistButton) {
                    event.preventDefault(); // Prevent any default button action

                    const productCard = addTowishlistButton.closest('.product-card');
                    if (!productCard) return;

                    const productId = productCard.dataset.productId;
                    const productName = productCard.querySelector('.product-name a')?.textContent || 'Unknown Product';
                    const priceElement = productCard.querySelector('.product-price');
                    const productImageElement = productCard.querySelector('.product-image'); // Changed selector

                    // --- Price Extraction Logic ---
                    let productPriceText = '0';
                    if (priceElement) {
                        // Get text, remove currency symbols and commas, handle potential extra spaces
                        productPriceText = (priceElement.textContent || '0').replace(/[$,]/g, '').trim();
                        // Take the first number if there are multiple (like original price)
                        const priceMatch = productPriceText.match(/[\d.]+/);
                        productPriceText = priceMatch ? priceMatch[0] : '0';
                    }
                    const productPrice = parseFloat(productPriceText);

                    // --- Image Extraction Logic ---
                    const productImage = productImageElement ? productImageElement.src : ''; // Get src directly

                    // Validate extracted data before adding
                    if (productId && productName && !isNaN(productPrice)) {
                        addItemToWishlist(productId, productName, productPrice, productImage, 1);
                    } else {
                        console.error("Failed to extract product details for wishlist:", { productId, productName, productPriceText, productPrice, productImage });
                        alert("Error: Could not get product details to add to wishlist.");
                    }
                }

                // --- Add to Cart Button on Product Card ---
                 const addToCartButton = event.target.closest('.btn-icon[aria-label="Add to Cart"]');
                 if (addToCartButton && typeof addItemToCart === 'function') { // Check if cart function exists
                     event.preventDefault();
                     const productCard = addToCartButton.closest('.product-card');
                     if (!productCard) return;

                     const productId = productCard.dataset.productId;
                     const productName = productCard.querySelector('.product-name a')?.textContent || 'Unknown Product';
                     const priceElement = productCard.querySelector('.product-price');
                      const productImageElement = productCard.querySelector('.product-image'); // Changed selector


                     let productPriceText = '0';
                     if (priceElement) {
                         productPriceText = (priceElement.textContent || '0').replace(/[$,]/g, '').trim();
                          const priceMatch = productPriceText.match(/[\d.]+/);
                         productPriceText = priceMatch ? priceMatch[0] : '0';
                     }
                     const productPrice = parseFloat(productPriceText);
                      const productImage = productImageElement ? productImageElement.src : '';

                     if (productId && productName && !isNaN(productPrice)) {
                         addItemToCart(productId, productName, productPrice, productImage, 1); // Assumes addItemToCart is globally available
                     } else {
                         console.error("Failed to extract product details for cart:", { productId, productName, productPriceText, productPrice, productImage });
                         alert("Error: Could not get product details to add to cart.");
                     }
                 } else if (addToCartButton) {
                      console.warn("addItemToCart function not found. Ensure cart.js is loaded or integrated.");
                      alert("Add to cart functionality not available yet.");
                 }


                // Quick View (if needed)
                const quickViewButton = event.target.closest('.btn-icon[aria-label="Quick View"]');
                if (quickViewButton) {
                    event.preventDefault();
                    alert('Quick View clicked! (Functionality not implemented yet)');
                }
            }); // End of addEventListener for this grid
        }); // End of forEach loop
    } else {
        // console.warn("No product grid containers (.product-grid) found on this page!"); // Normal if not on a product listing page
    }
    // ============================================= //
    // JS Section End: Product Card Actions          //
    // ============================================= //

}); // End DOMContentLoaded

// Note: If you need `addItemToCart` function here, it should be defined globally
// or imported if using modules. Example structure (assuming it's in cart.js):
/*
function addItemToCart(productId, productName, productPrice, productImage, quantityToAdd = 1) {
    // ... logic to add item to cart localStorage ...
    console.log(`Item ${productId} added to cart (Placeholder)`);
    window.dispatchEvent(new CustomEvent('cartUpdated')); // Notify cart badge
    alert(`${productName} added to cart!`);
}
*/