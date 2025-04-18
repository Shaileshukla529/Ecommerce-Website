/**
 * product-view.js
 * Handles JavaScript functionality specifically for the product detail page (product-view.html).
 * Depends on ecommerce-logic.js being loaded first for sampleProducts data
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

    // --- Sample Product Data (Duplicate for standalone use, or ensure global access) ---
    // Ideally, this would be fetched or available globally from ecommerce-logic.js
    // If ecommerce-logic.js defines sampleProducts globally, you might not need this duplicate.
    // For simplicity in this example, we duplicate it here.
    const sampleProducts = [
        { id: "prod001", name: "Stylish Casual Shirt", price: 49.99, description: "A comfortable and stylish casual shirt.", longDescription: "Crafted from 100% breathable cotton...", images: ["https://placehold.co/600x600/EBF4FF/4a90e2?text=Shirt+1", "https://placehold.co/600x600/EBF4FF/4a90e2?text=Shirt+2"], options: { Size: ["S", "M", "L", "XL"], Color: ["Blue", "White"] } },
        { id: "prod002", name: "Running Sneakers", price: 89.50, originalPrice: 110.00, description: "Lightweight running sneakers.", longDescription: "Featuring a cushioned midsole...", images: ["https://placehold.co/600x600/FFF0EB/d9534f?text=Sneaker+1", "https://placehold.co/600x600/FFF0EB/d9534f?text=Sneaker+2"], options: { Size: ["9", "10", "11"], Color: ["Red", "Black"] } },
        { id: "prod003", name: "Elegant Evening Dress", price: 120.00, description: "A stunning floor-length dress.", longDescription: "Made from luxurious satin fabric...", images: ["https://placehold.co/600x600/F0FFF0/5cb85c?text=Dress+1", "https://placehold.co/600x600/F0FFF0/5cb85c?text=Dress+2"], options: { Size: ["S", "M", "L"] } },
        { id: "prod004", name: "Classic Leather Watch", price: 199.99, description: "A timeless analog watch.", longDescription: "Reliable quartz movement...", images: ["https://placehold.co/600x600/FFF8DC/f0ad4e?text=Watch+1", "https://placehold.co/600x600/FFF8DC/f0ad4e?text=Watch+2"], options: { Color: ["Brown", "Black"] } }
    ];


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

        // Use the sampleProducts defined within this script
        currentProduct = sampleProducts.find(p => p.id === productId);

        if (!currentProduct) {
            console.error(`Product with ID ${productId} not found.`);
            productDetailContainer.innerHTML = `<p class="text-red-600">Product ${productId} not found.</p>`;
            return;
        }

        // Populate elements (ensure elements exist before setting properties)
        if (productNameEl) productNameEl.textContent = currentProduct.name;
        if (breadcrumbProductNameEl) breadcrumbProductNameEl.textContent = currentProduct.name;
        if (productDescriptionEl) productDescriptionEl.textContent = currentProduct.description;
        if (productLongDescriptionEl) productLongDescriptionEl.textContent = currentProduct.longDescription || currentProduct.description;

        if (productPriceEl) {
            let priceHTML = `<span class="text-2xl font-bold text-blue-600">$${currentProduct.price.toFixed(2)}</span>`;
            if (currentProduct.originalPrice) priceHTML += ` <span class="text-lg text-gray-500 line-through ml-2">$${currentProduct.originalPrice.toFixed(2)}</span>`;
            productPriceEl.innerHTML = priceHTML;
        }

        if (mainProductImage && currentProduct.images?.length > 0) {
            mainProductImage.src = currentProduct.images[0]; mainProductImage.alt = currentProduct.name;
        } else if (mainProductImage) { mainProductImage.src = 'https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image'; mainProductImage.alt = 'No image'; }

        if (thumbnailGallery && currentProduct.images?.length > 1) {
            thumbnailGallery.innerHTML = '';
            currentProduct.images.forEach((imgSrc, index) => {
                const img = document.createElement('img'); img.src = imgSrc; img.alt = `Thumbnail ${index + 1}`;
                img.className = 'thumbnail w-full h-auto cursor-pointer rounded border p-1 hover:border-blue-500 transition-all';
                if (index === 0) img.classList.add('active-thumbnail');
                img.addEventListener('click', () => {
                    if (mainProductImage) mainProductImage.src = imgSrc;
                    thumbnailGallery.querySelectorAll('.thumbnail').forEach(th => th.classList.remove('active-thumbnail'));
                    img.classList.add('active-thumbnail');
                });
                thumbnailGallery.appendChild(img);
            });
        } else if (thumbnailGallery) { thumbnailGallery.innerHTML = ''; }

        populateOptions(currentProduct.options);
        if(quantityInput) quantityInput.value = 1;
        setupProductDetailPageListeners();
        console.log("Product details loaded:", currentProduct.name);
    }

    function populateOptions(options) {
        if (sizeButtonsContainer) sizeButtonsContainer.innerHTML = ''; if (colorSwatchesContainer) colorSwatchesContainer.innerHTML = '';
        if (sizeOptionGroup) sizeOptionGroup.classList.add('hidden'); if (colorOptionGroup) colorOptionGroup.classList.add('hidden');
        if (!options) return; selectedOptions = {}; // Reset selection

        if (options.Size?.length > 0 && sizeOptionGroup && sizeButtonsContainer) {
            sizeOptionGroup.classList.remove('hidden');
            options.Size.forEach((size, index) => {
                const button = document.createElement('button'); button.textContent = size; button.dataset.value = size;
                button.className = 'size-button border border-gray-300 rounded px-3 py-1 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors';
                button.addEventListener('click', () => handleOptionSelection('Size', size, sizeButtonsContainer, 'size-button'));
                sizeButtonsContainer.appendChild(button);
                if (index === 0) handleOptionSelection('Size', size, sizeButtonsContainer, 'size-button'); // Select first by default
            });
        }
        if (options.Color?.length > 0 && colorOptionGroup && colorSwatchesContainer) {
            colorOptionGroup.classList.remove('hidden');
            options.Color.forEach((color, index) => {
                const button = document.createElement('button'); button.dataset.value = color; const bgColor = color.toLowerCase() === 'white' ? '#FFFFFF' : color.toLowerCase(); const borderClass = color.toLowerCase() === 'white' ? 'border-gray-400' : 'border-transparent';
                button.className = `color-swatch border-2 ${borderClass} rounded-full w-8 h-8 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 mr-1`; button.style.backgroundColor = bgColor; button.setAttribute('aria-label', `Select color ${color}`);
                button.addEventListener('click', () => handleOptionSelection('Color', color, colorSwatchesContainer, 'color-swatch'));
                colorSwatchesContainer.appendChild(button);
                 if (index === 0) handleOptionSelection('Color', color, colorSwatchesContainer, 'color-swatch'); // Select first by default
            });
        }
    }

    function handleOptionSelection(optionType, value, container, buttonClass) {
         selectedOptions[optionType] = value; console.log(`Selected ${optionType}: ${value}`);
         container.querySelectorAll(`.${buttonClass}`).forEach(btn => {
             const isActive = btn.dataset.value === value;
             btn.classList.toggle('ring-2', isActive); btn.classList.toggle('ring-blue-500', isActive); btn.classList.toggle('ring-offset-1', isActive);
             if (optionType === 'Size') { btn.classList.toggle('bg-blue-100', isActive); btn.classList.toggle('border-blue-400', isActive); }
         });
    }

    function setupProductDetailPageListeners() {
        if (decreaseQtyBtn && quantityInput) decreaseQtyBtn.onclick = () => { let v = parseInt(quantityInput.value); if (v > 1) quantityInput.value = v - 1; };
        if (increaseQtyBtn && quantityInput) increaseQtyBtn.onclick = () => { let v = parseInt(quantityInput.value); let max = parseInt(quantityInput.max) || 10; if (v < max) quantityInput.value = v + 1; };

        // Add to Cart Button - Calls function assumed to be loaded from ecommerce-logic.js
        if (addToCartBtn) {
            addToCartBtn.onclick = () => {
                if (!currentProduct) return;
                // Check if the global function exists before calling
                if (typeof addItemToCart === 'function') {
                    const q = parseInt(quantityInput.value) || 1;
                    console.log("Add to Cart clicked:", currentProduct.id, q, selectedOptions);
                    addItemToCart(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.images[0], q);
                } else {
                    console.error("addItemToCart function is not available. Ensure ecommerce-logic.js is loaded first.");
                    alert("Error: Cannot add item to cart.");
                }
            };
        }

        // Add to Wishlist Button - Calls function assumed to be loaded from ecommerce-logic.js
        if (addToWishlistBtn) {
            addToWishlistBtn.onclick = () => {
                 if (!currentProduct) return;
                 // Check if the global function exists before calling
                 if (typeof addItemToWishlist === 'function') {
                    console.log("Add to Wishlist clicked:", currentProduct.id, selectedOptions);
                    addItemToWishlist(currentProduct.id, currentProduct.name, currentProduct.price, currentProduct.images[0]);
                 } else {
                    console.error("addItemToWishlist function is not available. Ensure ecommerce-logic.js is loaded first.");
                    alert("Error: Cannot add item to wishlist.");
                 }
            };
        }
    }

    // --- Initial Load ---
    loadProductDetails();

}); // End DOMContentLoaded
