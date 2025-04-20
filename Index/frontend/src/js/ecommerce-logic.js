/**
 * ecommerce-logic.js
 * Handles core e-commerce functionalities: Wishlist & Cart management,
 * rendering wishlist page, product grid interactions, and badge updates.
 * Replaces wish.js, product.js, cart.js (partially), wishlist-logic.js and inline scripts.
 */

// --- Constants ---
const WISHLIST_STORAGE_KEY = 'shoppingWishlist';
const CART_STORAGE_KEY = 'shoppingCart';



// Product Data

const allProductData = [
    // Men 001 to 004 and 0017 to 0024
    { id: "men001", name: "Classic Oxford Shirt", price: 69.99, description: "A timeless button-down Oxford shirt.", longDescription: "Made from durable Oxford cloth, perfect for smart-casual looks.", images: ["Men/men_shirt1.avif"], options: { Size: ["S", "M", "L", "XL", "XXL"], Color: ["White", "Light Blue", "Pink Stripe"] } },
    { id: "men002", name: "Casual Plaid Shirt", price: 59.50, description: "Comfortable long-sleeve plaid shirt.", longDescription: "Soft brushed cotton flannel in a classic plaid pattern.", images: ["Men/men_shirt2.avif"], options: { Size: ["M", "L", "XL"], Color: ["Red/Black", "Blue/Green"] } },
    { id: "men003", name: "Linen Blend Shirt", price: 75.00, description: "Lightweight linen blend shirt for summer.", longDescription: "Breathable and comfortable, ideal for warm weather.", images: ["Men/men_shirt3.avif"], options: { Size: ["S", "M", "L", "XL"], Color: ["Natural", "Navy", "White"] } },
    { id: "men004", name: "Denim Work Shirt", price: 85.00, description: "Rugged denim shirt for a casual look.", longDescription: "Durable denim fabric with chest pockets.", images: ["Men/men_shirt4.avif"], options: { Size: ["M", "L", "XL", "XXL"], Color: ["Indigo Blue", "Washed Black"] } },
    { id: "men005", name: "Short-Sleeve Polo Shirt", price: 49.95, description: "Classic cotton pique polo shirt.", longDescription: "A wardrobe staple featuring a ribbed collar and cuffs.", images: ["Men/men_shirt5.avif"], options: { Size: ["S", "M", "L", "XL"], Color: ["Navy", "White", "Grey", "Red"] } },
    { id: "men006", name: "Printed Camp Collar Shirt", price: 62.00, originalPrice: 78.00, description: "Short-sleeve shirt with a relaxed camp collar.", longDescription: "Features a vibrant print, perfect for vacations or casual outings.", images: ["Men/men_shirt6.avif"], options: { Size: ["S", "M", "L"], Color: ["Tropical Print", "Abstract Pattern"] } },
    { id: "men007", name: "Performance Dress Shirt", price: 95.00, description: "Wrinkle-resistant performance dress shirt.", longDescription: "Made with stretch fabric for comfort and easy care, ideal for travel or work.", images: ["Men/men_shirt7.avif"], options: { Size: ["15.5/33", "16/34", "16.5/34", "17/35"], Color: ["White", "Blue", "Grey Check"] } },
    { id: "men008", name: "Corduroy Overshirt", price: 105.00, description: "Warm corduroy shirt jacket.", longDescription: "Can be worn as a shirt or light jacket, perfect for layering.", images: ["Men/men_shirt8.avif"], options: { Size: ["M", "L", "XL"], Color: ["Brown", "Olive Green"] } },
    { id: "men009", name: "Band Collar Shirt", price: 70.00, description: "Modern shirt with a band collar.", longDescription: "A contemporary alternative to the traditional collared shirt.", images: ["Men/men_shirt9.avif"], options: { Size: ["S", "M", "L", "XL"], Color: ["White", "Black", "Navy Stripe"] } },
    // --- Women's Clothing (Generated from image) ---
    { id: "women001", name: "Elegant Maxi Dress", price: 135.00, description: "Flowy maxi dress for special occasions.", longDescription: "Crafted from lightweight chiffon with intricate detailing.", images: ["Women/women1.avif"], options: { Size: ["S", "M", "L"], Color: ["Floral Print", "Navy"] } },
    { id: "women002", name: "Casual Knit Top", price: 45.50, description: "Comfortable and versatile knit top.", longDescription: "Soft knit fabric perfect for layering or wearing on its own.", images: ["Women/women2.avif"], options: { Size: ["XS", "S", "M", "L", "XL"], Color: ["Grey", "Cream", "Olive"] } },
    { id: "women003", name: "Summer Sundress", price: 79.99, description: "Light and airy sundress for warm weather.", longDescription: "Features adjustable straps and a flattering A-line silhouette.", images: ["Women/women3.avif"], options: { Size: ["S", "M", "L"], Color: ["Yellow Print", "White", "Blue Stripe"] } },
    { id: "women004", name: "Business Casual Blouse", price: 65.00, originalPrice: 80.00, description: "Professional blouse suitable for work.", longDescription: "Elegant design with a comfortable fit for all-day wear.", images: ["Women/women4.avif"], options: { Size: ["S", "M", "L", "XL"], Color: ["White", "Light Blue", "Pink"] } },
    { id: "women005", name: "High-Waisted Jeans", price: 89.00, description: "Stylish high-waisted denim jeans.", longDescription: "Made with stretch denim for comfort and a flattering fit.", images: ["Women/women5.avif"], options: { Size: ["26", "27", "28", "29", "30", "31"], Color: ["Classic Blue", "Black", "Light Wash"] } },
    { id: "women006", name: "Cozy Cardigan Sweater", price: 72.00, description: "Soft and warm open-front cardigan.", longDescription: "Perfect for layering during cooler months, made from a soft wool blend.", images: ["Women/women6.avif"], options: { Size: ["S", "M", "L"], Color: ["Beige", "Charcoal", "Burgundy"] } },
    { id: "women007", name: "Workout Leggings", price: 55.00, description: "High-performance leggings for workouts.", longDescription: "Moisture-wicking fabric with four-way stretch for optimal comfort and movement.", images: ["Women/women7.jpg"], options: { Size: ["XS", "S", "M", "L"], Color: ["Black", "Navy", "Teal"] } },
    { id: "women008", name: "Formal Evening Gown", price: 250.00, description: "Stunning floor-length gown for formal events.", longDescription: "Elegant silhouette with delicate embellishments, designed to impress.", images: ["Women/women8.jpg"], options: { Size: ["4", "6", "8", "10", "12"], Color: ["Black", "Red", "Emerald Green"] } },
    { id: "women009", name: "Boho Chic Tunic", price: 68.50, description: "Relaxed fit tunic with bohemian details.", longDescription: "Features embroidery and tassel ties, perfect with jeans or leggings.", images: ["Women/women9.webp"], options: { Size: ["S", "M", "L"], Color: ["White", "Terracotta"] } }, // Note: using .webp
    { id: "women010", name: "Tailored Blazer", price: 115.00, description: "Sharp, tailored blazer for a polished look.", longDescription: "Single-breasted blazer that can dress up any outfit.", images: ["Women/women10.jpg"], options: { Size: ["S", "M", "L", "XL"], Color: ["Navy", "Black", "Camel"] } },
    { id: "women011", name: "Pleated Midi Skirt", price: 75.00, description: "Flowy pleated midi skirt.", longDescription: "Elegant and versatile skirt suitable for various occasions.", images: ["Women/women11.jpg"], options: { Size: ["S", "M", "L"], Color: ["Dusty Rose", "Forest Green", "Black"] } },
    { id: "women012", name: "Graphic Print T-Shirt", price: 32.00, description: "Casual t-shirt with a unique graphic print.", longDescription: "Soft cotton t-shirt with a comfortable fit and eye-catching design.", images: ["Women/women12.jpg"], options: { Size: ["XS", "S", "M", "L", "XL"], Color: ["White", "Grey Heather"] } },

    // Make sure window.allProducts = allProductData; is present after the array definition.
    // Jewellery 013 to 016 and 0032 to 0039
    { id: "jewel001", name: "Diamond Solitaire Necklace", price: 1299.99, description: "Classic diamond solitaire pendant.", longDescription: "A timeless piece featuring a sparkling brilliant-cut diamond on a fine chain.", images: ["Jewellery/jewelry1.jpg"], options: { Metal: ["White Gold", "Yellow Gold", "Platinum"] } },
    { id: "jewel002", name: "Pearl Stud Earrings", price: 149.50, description: "Elegant freshwater pearl stud earrings.", longDescription: "Lustrous pearls set in sterling silver, perfect for everyday elegance.", images: ["Jewellery/jewelry2.jpg"], options: { PearlColor: ["White", "Pink", "Black"] } },
    { id: "jewel003", name: "Sapphire Ring", price: 899.00, description: "Stunning ring featuring a deep blue sapphire.", longDescription: "A vibrant sapphire gemstone surrounded by smaller diamonds, set in white gold.", images: ["Jewellery/jewelry3.jpg"], options: { Metal: ["White Gold", "Yellow Gold"], Size: ["5", "6", "7", "8"] } },
    { id: "jewel004", name: "Gold Hoop Earrings", price: 299.00, originalPrice: 350.00, description: "Classic polished gold hoop earrings.", longDescription: "Versatile and stylish hoops crafted from 14k yellow gold.", images: ["Jewellery/jewelry4.jpg"], options: { Metal: ["Yellow Gold", "White Gold", "Rose Gold"] } },
    { id: "jewel005", name: "Silver Charm Bracelet", price: 180.00, description: "Sterling silver bracelet ready for charms.", longDescription: "A beautiful base bracelet to personalize with your favorite charms.", images: ["Jewellery/jewelry5.jpg"] }, // Maybe no options needed
    { id: "jewel006", name: "Emerald Pendant", price: 750.00, description: "Vivid green emerald pendant necklace.", longDescription: "A captivating emerald gemstone cut to maximize brilliance, on a delicate chain.", images: ["Jewellery/jewelry6.jpg"], options: { Metal: ["Yellow Gold", "White Gold"] } },
    { id: "jewel007", name: "Tennis Bracelet", price: 2499.00, description: "Elegant diamond tennis bracelet.", longDescription: "A flexible bracelet lined with individually set diamonds for continuous sparkle.", images: ["Jewellery/jewelry7.jpg"], options: { Metal: ["White Gold", "Platinum"] } },
    { id: "jewel008", name: "Rose Gold Locket", price: 325.00, description: "Heart-shaped locket in rose gold.", longDescription: "A sentimental piece to hold cherished photos, crafted in warm rose gold.", images: ["Jewellery/jewelry8.jpg"] },
    { id: "jewel009", name: "Amethyst Drop Earrings", price: 210.00, description: "Graceful earrings featuring amethyst stones.", longDescription: "Rich purple amethyst gemstones dangling elegantly.", images: ["Jewellery/jewelry9.jpg"], options: { Metal: ["Sterling Silver", "Yellow Gold Plated"] } },
    { id: "jewel010", name: "Men's Signet Ring", price: 450.00, description: "Classic men's signet ring.", longDescription: "A traditional sterling silver signet ring, suitable for engraving.", images: ["Jewellery/jewelry10.jpg"], options: { Metal: ["Sterling Silver", "Yellow Gold"], Size: ["9", "10", "11", "12"] } },
    { id: "jewel011", name: "Layered Necklace Set", price: 195.00, description: "Set of delicate layered necklaces.", longDescription: "A trendy set of multiple fine chains in silver or gold tone for a layered look.", images: ["Jewellery/jewelry11.jpg"], options: { Color: ["Gold Tone", "Silver Tone"] } },

    // --- Watches (Generated from image) ---
    { id: "watch001", name: "Classic Analog Watch", price: 199.99, description: "A timeless timepiece for everyday wear.", longDescription: "Features a reliable quartz movement and a durable stainless steel case. Water-resistant.", images: ["Watches/watch1.avif"], options: { StrapColor: ["Black", "Brown", "Silver"] } },
    { id: "watch002", name: "Sport Chronograph Watch", price: 249.50, description: "Sporty watch with chronograph functions.", longDescription: "Built for active lifestyles with a rugged design and stopwatch capabilities.", images: ["Watches/watch2.avif"], options: { StrapColor: ["Black", "Blue", "Red"] } },
    { id: "watch003", name: "Minimalist Modern Watch", price: 175.00, description: "Sleek and modern minimalist design.", longDescription: "Clean dial with simple markers, perfect for a sophisticated look.", images: ["Watches/watch3.avif"], options: { StrapColor: ["Silver Mesh", "Black Leather"] } },
    { id: "watch004", name: "Luxury Gold-Tone Watch", price: 399.00, originalPrice: 450.00, description: "Elegant gold-tone watch for special occasions.", longDescription: "A statement piece featuring premium materials and craftsmanship.", images: ["Watches/watch4.avif"], options: { Metal: ["Gold"] } },
    { id: "watch005", name: "Digital Smart Watch", price: 299.00, description: "Feature-rich digital smart watch.", longDescription: "Includes fitness tracking, notifications, and customizable watch faces.", images: ["Watches/watch5.avif"], options: { Color: ["Black", "Grey", "Rose Gold"] } },
    { id: "watch006", name: "Pilot Style Watch", price: 215.00, description: "Aviation-inspired pilot watch.", longDescription: "Classic pilot design with large numerals and high legibility.", images: ["Watches/watch6.avif"], options: { StrapColor: ["Brown Leather", "Black Canvas"] } },
    { id: "watch007", name: "Diver's Watch", price: 320.00, description: "Robust diver's watch with high water resistance.", longDescription: "Designed for underwater use, featuring a rotating bezel and luminous hands.", images: ["Watches/watch7.avif"], options: { StrapColor: ["Stainless Steel", "Rubber Black"] } },
    { id: "watch008", name: "Field Watch", price: 185.00, description: "Durable and practical field watch.", longDescription: "Military-inspired design, built for reliability in various conditions.", images: ["Watches/watch8.avif"], options: { StrapColor: ["Green Canvas", "Tan Leather"] } },
    { id: "watch009", name: "Elegant Dress Watch", price: 280.00, description: "Thin and elegant watch for formal wear.", longDescription: "A refined timepiece that complements suits and formal attire.", images: ["Watches/watch9.avif"], options: { StrapColor: ["Black Leather", "Silver Mesh"] } },
    { id: "watch010", name: "Vintage Inspired Watch", price: 205.00, description: "Watch with a classic vintage aesthetic.", longDescription: "Captures the charm of older timepieces with modern reliability.", images: ["Watches/watch10.avif"], options: { StrapColor: ["Distressed Brown", "Black"] } },
    { id: "watch011", name: "Skeleton Automatic Watch", price: 450.00, description: "Watch showcasing its internal automatic movement.", longDescription: "Features a skeleton dial allowing you to see the intricate mechanics.", images: ["Watches/watch11.avif"] }, // May not have options
    { id: "watch012", name: "Casual Everyday Watch", price: 150.00, description: "A simple and reliable watch for daily use.", longDescription: "Comfortable and versatile design suitable for any casual outfit.", images: ["Watches/watch12.avif"], options: { StrapColor: ["Blue Nylon", "Grey Leather"] } },

];


window.allProducts = allProductData;










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

// **** CORRECTION: Added 'export' keyword ****
export function getCart() {
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


// **** CORRECTION: Added check for badgeElement existence ****
function updateCartBadge() {
    // Find badge element dynamically using the correct href for MPA
    const badgeElement = document.querySelector('.navbar-actions a[href="Cart.html"] .badge'); // Corrected selector

    if (!badgeElement) { // <--- ADDED THIS CHECK
        // If not found, log a message and exit the function gracefully
        console.log("Cart badge element not found on this page.");
        return;
    }

    const cart = getCart(); // getCart function from ecommerce-logic.js
    let totalQuantity = 0;
    cart.forEach(item => { totalQuantity += parseInt(item.quantity, 10) || 0; });

    badgeElement.textContent = totalQuantity;
    badgeElement.style.display = totalQuantity > 0 ? 'flex' : 'none'; // Use 'flex' or 'inline-block' based on CSS
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
                    <div class="item-actions"> <div class="item-action-buttons"> <button class="btn-add-to-cart" data-product-id="${item.id}" data-name="${item.name}" data-price="${price}" data-image="${imageSrc}">
            <span>Add to Cart</span>
        </button>
        <button class="btn-remove-item" aria-label="Remove ${item.name} from Wishlist" data-product-id="${item.id}" data-name="${item.name}">
            <i class="fas fa-trash-alt"></i> </button>
    </div>
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
        if (target.closest('.btn-add-to-cart')) { // Use closest for icon clicks
            const button = target.closest('.btn-add-to-cart');
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
        if (target.closest('.btn-remove-item')) { // Use closest for icon clicks
            const button = target.closest('.btn-remove-item');
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
            // Implement quick view logic here
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