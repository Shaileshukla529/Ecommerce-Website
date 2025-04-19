/**
 * product-view.js
 * Handles JavaScript functionality specifically for the product detail page (product-view.html).
 * Depends on ecommerce-logic.js being loaded first for product data
 * and functions like addItemToCart, addItemToWishlist.
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // --- Page Identification ---
    // Ensure we are actually on the product detail page
    const productDetailContainer = document.getElementById('product-detail-container');
    if (!productDetailContainer) {
        // If this container isn't found, don't run any of this script's logic
        return;
    }
    console.log("Initializing Product Detail Page (product-view.js)...");

    // --- DOM Element References ---
    const mainProductImage = document.getElementById('main-product-image');
    const thumbnailGallery = document.getElementById('thumbnail-gallery');
    const productNameEl = document.getElementById('product-name');
    const productPriceEl = document.getElementById('product-price');
    const productDescriptionEl = document.getElementById('product-description');
    const productLongDescriptionEl = document.getElementById('product-long-description');
    const breadcrumbProductNameEl = document.getElementById('breadcrumb-product-name');
    const quantityInput = document.getElementById('quantity-input');
    const decreaseQtyBtn = document.getElementById('decrease-quantity');
    const increaseQtyBtn = document.getElementById('increase-quantity');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const addToWishlistBtn = document.getElementById('add-to-wishlist-btn');
    const sizeOptionGroup = document.getElementById('size-option-group');
    const sizeButtonsContainer = document.getElementById('size-buttons');
    const colorOptionGroup = document.getElementById('color-option-group');
    const colorSwatchesContainer = document.getElementById('color-swatches');

    // --- State Variables ---
    let currentProduct = null; // To store the loaded product data
    let selectedOptions = {}; // To store selected size, color etc.

    // --- REMOVED sampleProducts array ---
    // The product data should now be accessed globally, e.g., from window.allProducts
    // defined in ecommerce-logic.js

    // --- Functions ---

    function loadProductDetails() {
        console.log("loadProductDetails called from product-view.js");
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');

        if (!productId) {
            console.error("Product ID not found in URL.");
            productDetailContainer.innerHTML = '<p class="text-red-600">Product ID missing.</p>';
            return;
        }

        // --- MODIFIED: Access global product list ---
        // Access the global product list from ecommerce-logic.js
        // *** Assumption: ecommerce-logic.js makes the product list available as 'window.allProducts' ***
        if (typeof window.allProducts === 'undefined' || !Array.isArray(window.allProducts)) {
            console.error("Product data (window.allProducts) not found or not an array. Ensure ecommerce-logic.js is loaded first and defines it correctly.");
            productDetailContainer.innerHTML = '<p class="text-red-600">Error: Product data unavailable.</p>';
            // You might want to attempt fetching data here if it's not preloaded
            return;
        }
        currentProduct = window.allProducts.find(p => p.id === productId);
        // --- END MODIFICATION ---


        if (!currentProduct) {
            console.error(`Product with ID ${productId} not found.`);
            productDetailContainer.innerHTML = `<p class="text-red-600">Product ${productId} not found.</p>`;
            // Attempt to load default or show error
            return;
        }

        // Populate elements (ensure elements exist before setting properties)
        if (productNameEl) productNameEl.textContent = currentProduct.name;
        if (breadcrumbProductNameEl) breadcrumbProductNameEl.textContent = currentProduct.name;
        if (productDescriptionEl) productDescriptionEl.textContent = currentProduct.description;
        if (productLongDescriptionEl) productLongDescriptionEl.textContent = currentProduct.longDescription || currentProduct.description; // Fallback

        if (productPriceEl) {
            let priceHTML = `<span class="text-2xl font-bold text-blue-600">$${currentProduct.price.toFixed(2)}</span>`;
            // Check for originalPrice property before adding strikethrough
            if (currentProduct.originalPrice && currentProduct.originalPrice > currentProduct.price) {
                 priceHTML += ` <span class="text-lg text-gray-500 line-through ml-2">$${currentProduct.originalPrice.toFixed(2)}</span>`;
            }
            productPriceEl.innerHTML = priceHTML;
        }

        // Main image update
        if (mainProductImage && currentProduct.images?.length > 0) {
            mainProductImage.src = currentProduct.images[0];
            mainProductImage.alt = currentProduct.name;
        } else if (mainProductImage) {
             // Set a default placeholder if no images exist
             mainProductImage.src = 'https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image';
             mainProductImage.alt = 'No image available';
        }

        // Thumbnail gallery update
        if (thumbnailGallery) {
            thumbnailGallery.innerHTML = ''; // Clear existing thumbnails
             if (currentProduct.images?.length > 1) {
                 currentProduct.images.forEach((imgSrc, index) => {
                     const img = document.createElement('img');
                     img.src = imgSrc;
                     img.alt = `${currentProduct.name} - Thumbnail ${index + 1}`;
                     img.className = 'thumbnail w-full h-auto cursor-pointer rounded border p-1 hover:border-blue-500 transition-all';
                     if (index === 0) {
                         img.classList.add('active-thumbnail'); // Mark first as active
                     }
                     img.addEventListener('click', () => {
                         if (mainProductImage) mainProductImage.src = imgSrc;
                         // Update active state in thumbnails
                         thumbnailGallery.querySelectorAll('.thumbnail').forEach(th => th.classList.remove('active-thumbnail'));
                         img.classList.add('active-thumbnail');
                     });
                     thumbnailGallery.appendChild(img);
                 });
             }
         } else if (thumbnailGallery) {
             thumbnailGallery.innerHTML = ''; // Ensure it's cleared if no images
         }


        populateOptions(currentProduct.options);
        if(quantityInput) quantityInput.value = 1; // Reset quantity
        setupProductDetailPageListeners(); // Setup listeners after loading
        console.log("Product details loaded:", currentProduct.name);
    }

    function populateOptions(options) {
        // Clear previous options and hide containers
        if (sizeButtonsContainer) sizeButtonsContainer.innerHTML = '';
        if (colorSwatchesContainer) colorSwatchesContainer.innerHTML = '';
        if (sizeOptionGroup) sizeOptionGroup.classList.add('hidden');
        if (colorOptionGroup) colorOptionGroup.classList.add('hidden');

        if (!options) {
            selectedOptions = {}; // Reset selection if no options
            return;
        }

        selectedOptions = {}; // Reset selection

        // Populate Sizes
        if (options.Size?.length > 0 && sizeOptionGroup && sizeButtonsContainer) {
            sizeOptionGroup.classList.remove('hidden');
            options.Size.forEach((size, index) => {
                const button = document.createElement('button');
                button.textContent = size;
                button.dataset.value = size; // Store value in data attribute
                button.className = 'size-button border border-gray-300 rounded px-3 py-1 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
                button.addEventListener('click', () => handleOptionSelection('Size', size, sizeButtonsContainer, 'size-button'));
                sizeButtonsContainer.appendChild(button);
                 // Automatically select the first size option by default
                 if (index === 0) {
                    handleOptionSelection('Size', size, sizeButtonsContainer, 'size-button');
                 }
            });
        } else {
             delete selectedOptions.Size; // Remove size if not available
        }

        // Populate Colors
         if (options.Color?.length > 0 && colorOptionGroup && colorSwatchesContainer) {
             colorOptionGroup.classList.remove('hidden');
             options.Color.forEach((color, index) => {
                 const button = document.createElement('button');
                 button.dataset.value = color; // Store value
                 // Basic color mapping (improve as needed)
                 const bgColor = color.toLowerCase() === 'white' ? '#FFFFFF' : color.toLowerCase();
                 const borderClass = color.toLowerCase() === 'white' ? 'border-gray-400' : 'border-transparent'; // Add border for white
                 button.className = `color-swatch border-2 ${borderClass} rounded-full w-8 h-8 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 mr-1 transition-all`;
                 button.style.backgroundColor = bgColor;
                 button.setAttribute('aria-label', `Select color ${color}`);
                 button.addEventListener('click', () => handleOptionSelection('Color', color, colorSwatchesContainer, 'color-swatch'));
                 colorSwatchesContainer.appendChild(button);
                 // Automatically select the first color option by default
                 if (index === 0) {
                     handleOptionSelection('Color', color, colorSwatchesContainer, 'color-swatch');
                 }
             });
         } else {
             delete selectedOptions.Color; // Remove color if not available
         }
    }


    function handleOptionSelection(optionType, value, container, buttonClass) {
         selectedOptions[optionType] = value;
         console.log(`Selected ${optionType}: ${value}`);

         // Update visual state for all buttons of this type
         container.querySelectorAll(`.${buttonClass}`).forEach(btn => {
             const isActive = btn.dataset.value === value;
             // Use Tailwind classes for active state indication
             btn.classList.toggle('ring-2', isActive); // Ring for active
             btn.classList.toggle('ring-blue-500', isActive);
             btn.classList.toggle('ring-offset-1', isActive);
             // Specific style for size buttons for clarity
             if (optionType === 'Size') {
                 btn.classList.toggle('bg-blue-100', isActive); // Light blue background
                 btn.classList.toggle('border-blue-400', isActive); // Blue border
             }
         });
         // Potentially update price or availability based on selection here
    }

    function setupProductDetailPageListeners() {
         // Ensure elements exist before adding listeners
         if (decreaseQtyBtn && quantityInput) {
             decreaseQtyBtn.onclick = () => {
                 let v = parseInt(quantityInput.value);
                 if (v > 1) quantityInput.value = v - 1;
             };
         }
        if (increaseQtyBtn && quantityInput) {
            increaseQtyBtn.onclick = () => {
                 let v = parseInt(quantityInput.value);
                 let max = parseInt(quantityInput.max) || 10; // Use max attribute or default
                 if (v < max) quantityInput.value = v + 1;
            };
         }

        // Add to Cart Button - Ensure ecommerce-logic.js is loaded and provides addItemToCart
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                if (!currentProduct) {
                    console.error("Add to Cart failed: No product data loaded.");
                    alert("Could not add item. Product data missing.");
                    return;
                }
                // Check if the global addItemToCart function exists
                if (typeof addItemToCart === 'function') {
                    const q = parseInt(quantityInput.value) || 1;
                    console.log("Add to Cart clicked:", currentProduct.id, q, selectedOptions);
                    // Pass selected options if needed by addItemToCart
                    addItemToCart(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.images?.[0] || '', q /*, selectedOptions */);
                } else {
                    console.error("addItemToCart function is not available. Ensure ecommerce-logic.js is loaded first.");
                    alert("Error: Cannot add item to cart.");
                }
            };
        }

        // Add to Wishlist Button - Ensure ecommerce-logic.js is loaded and provides addItemToWishlist
        if (addToWishlistBtn) {
            addToWishlistBtn.onclick = () => {
                 if (!currentProduct) {
                     console.error("Add to Wishlist failed: No product data loaded.");
                     alert("Could not add item. Product data missing.");
                     return;
                 }
                 // Check if the global addItemToWishlist function exists
                 if (typeof addItemToWishlist === 'function') {
                    console.log("Add to Wishlist clicked:", currentProduct.id, selectedOptions);
                    // Pass selected options if needed by addItemToWishlist
                    addItemToWishlist(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.images?.[0] || '' /*, selectedOptions */);
                 } else {
                    console.error("addItemToWishlist function is not available. Ensure ecommerce-logic.js is loaded first.");
                    alert("Error: Cannot add item to wishlist.");
                 }
            };
        }
    }


    // --- Initial Load ---
    // Load details when the page is ready
    loadProductDetails();

}); // End DOMContentLoaded