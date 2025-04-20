// src/js/index_page.js
// Wrap all JS in a DOMContentLoaded listener to ensure HTML is ready
document.addEventListener('DOMContentLoaded', function () {

    // ============================================= //
    // JS Section Start: Variable Declarations     //
    // ============================================= //
    const navbarContainer = document.querySelector('.navbar-container');
    const body = document.body;
    const menuToggle = document.getElementById('menuToggle');
    // Updated: Target the main navigation menu UL directly
    const mobileMenu = document.getElementById('mainNavMenu'); // Target the UL
    const menuIcon = menuToggle ? menuToggle.querySelector('i') : null;
    // Modal related variables (kept as is)
    const authModal = document.getElementById('authModal');
    const loginSignupBtn = document.getElementById('loginSignupBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const loginContainer = document.getElementById('loginContainer');
    const registerContainer = document.getElementById('registerContainer');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');
    const loginNotification = document.getElementById('loginNotification');
    const registerNotification = document.getElementById('registerNotification');
    // Hero slider variables (kept as is)
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.arrow-prev');
    const nextBtn = document.querySelector('.arrow-next');
    let currentSlide = 0;
    let slideInterval;
    const autoPlayDelay = 5000; // ms
    const currentYearSpan = document.getElementById('currentYear');
    // ============================================= //
    // JS Section End: Variable Declarations       //
    // ============================================= //


    // ============================================= //
    // JS Section Start: General Utility           //
    // ============================================= //
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }
    // ============================================= //
    // JS Section End: General Utility             //
    // ============================================= //


    // ============================================= //
    // JS Section Start: Navbar Functionality      //
    // ============================================= //
    const handleScroll = () => {
        if (!navbarContainer) return;
        const announcementBarHeight = document.querySelector('.announcement-bar')?.offsetHeight || 0;

        // Apply scrolled class based on scroll position and screen width
         if (window.scrollY > announcementBarHeight / 2) {
            navbarContainer.classList.add('navbar-scrolled');
            body.classList.add('navbar-scrolled');
        } else {
            navbarContainer.classList.remove('navbar-scrolled');
            body.classList.remove('navbar-scrolled');
        }

        // // ORIGINAL LOGIC (Kept for reference, modified above)
        // if (window.innerWidth > 768) { // Apply only on wider screens
        //     if (window.scrollY > announcementBarHeight / 2) {
        //         navbarContainer.classList.add('navbar-scrolled');
        //         body.classList.add('navbar-scrolled');
        //     } else {
        //         navbarContainer.classList.remove('navbar-scrolled');
        //         body.classList.remove('navbar-scrolled');
        //     }
        // } else { // Remove effect on smaller screens if desired
        //     navbarContainer.classList.remove('navbar-scrolled');
        //     body.classList.remove('navbar-scrolled');
        // }
    };

    const closeAllMobileDropdowns = () => {
        // Target dropdowns within the mainNavMenu
        mobileMenu.querySelectorAll('.dropdown.show-dropdown, .mega-dropdown.show-dropdown').forEach(openDropdown => {
            openDropdown.classList.remove('show-dropdown');
        });
        mobileMenu.querySelectorAll('.menu-link.dropdown-toggle.open').forEach(toggle => {
            toggle.classList.remove('open');
        });
    }

    const toggleMobileMenu = () => {
        // Check if mobileMenu (the ul#mainNavMenu) exists
        if (!mobileMenu || !menuIcon) {
             console.error("Mobile menu container or toggle icon not found.");
             return;
        }
        // Toggle the class directly on the ul element
        mobileMenu.classList.toggle('show-mobile-menu');
        const isMenuOpen = mobileMenu.classList.contains('show-mobile-menu');
        menuIcon.classList.toggle('fa-bars', !isMenuOpen);
        menuIcon.classList.toggle('fa-times', isMenuOpen);
        // Close dropdowns if the main mobile menu is closing
        if (!isMenuOpen) {
            closeAllMobileDropdowns();
        }
    };

    const handleMobileDropdownToggle = (e) => {
        // Check if we are in mobile view (e.g., hamburger is visible)
        const isMobileView = menuToggle && window.getComputedStyle(menuToggle).display !== 'none';

        if (isMobileView) {
            const link = e.currentTarget;
            // Check if the clicked element is actually inside the mobile menu container
            if (!mobileMenu.contains(link)) return;

            e.preventDefault(); // Prevent default link behavior only in mobile view
            const parentMenuItem = link.closest('.menu-item'); // Find the parent li
            if (!parentMenuItem) return;

            const dropdown = parentMenuItem.querySelector('.dropdown') || parentMenuItem.querySelector('.mega-dropdown');
            if (!dropdown) return; // Exit if no dropdown found

            const isOpening = !dropdown.classList.contains('show-dropdown');

            // Close other open dropdowns *within the mobile menu* before opening a new one
            if (isOpening) {
                closeAllMobileDropdowns();
            }

            // Toggle the current dropdown's visibility and the link's 'open' state
            dropdown.classList.toggle('show-dropdown', isOpening);
            link.classList.toggle('open', isOpening);
        }
        // If not in mobile view, the default link behavior and CSS hover effects will apply
    };


    // Initial check in case page loads scrolled
    handleScroll();
    // Add event listeners for Navbar
    window.addEventListener('scroll', handleScroll);
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleMobileMenu);
    } else {
        console.error("Menu toggle button (#menuToggle) not found.");
    }

    // Add dropdown toggle listener to all dropdown toggles (works for mobile and desktop hover via CSS)
    document.querySelectorAll('.navbar-menu .dropdown-toggle').forEach(item => {
         // Add click listener primarily for mobile dropdown toggling
         item.addEventListener('click', handleMobileDropdownToggle);
    });
    // ============================================= //
    // JS Section End: Navbar Functionality        //
    // ============================================= //



    // ============================================= //
    // JS Section Start: Authentication Check      //
    // ============================================= //
      // Inside the DOMContentLoaded listener in index.html

    const checkLoginStatus = () => {
        console.log("Running checkLoginStatus...");
        const userString = localStorage.getItem('user');
        console.log("User data from localStorage:", userString);
        let user = null;
        try {
            user = userString ? JSON.parse(userString) : null;
        } catch (e) {
            console.error("Error parsing user data from localStorage", e);
            localStorage.removeItem('user');
        }
        console.log("Parsed user object:", user);

        const loginSignupBtn = document.getElementById('loginSignupBtn');
        if (!loginSignupBtn) {
            console.error("#loginSignupBtn not found!");
            return;
        }

        // --- START: MODIFIED CLICK HANDLING ---
        // Remove any previous onclick handler to avoid conflicts
        loginSignupBtn.onclick = null;

        // Define the click handler function separately
        const profileIconClickHandler = (event) => {
            event.preventDefault(); // Prevent any default browser action for the button
            console.log("Profile icon clicked!"); // Add log to confirm handler runs

            if (user && user.id) {
                 console.log("Navigating to profile.html");
                 window.location.href = 'profile.html';
            } else {
                 console.log("Navigating to login.html");
                 window.location.href = 'login.html';
            }
        };

         // Remove previous listener before adding a new one (important!)
         // We need a way to reference the *exact same function* to remove it.
         // A simple way is to store it temporarily if needed, or structure differently.
         // For simplicity here, we'll assume this setup runs once cleanly on load.
         // If checkLoginStatus could run multiple times, a more robust listener removal is needed.

         // Add the new event listener
        loginSignupBtn.removeEventListener('click', profileIconClickHandler); // Try removing first (might not exist yet)
        loginSignupBtn.addEventListener('click', profileIconClickHandler);

        // --- END: MODIFIED CLICK HANDLING ---

        // Update aria-label based on status
        if (user && user.id) {
            loginSignupBtn.setAttribute('aria-label', 'View Profile');
             console.log("Set aria-label to 'View Profile'");
        } else {
            loginSignupBtn.setAttribute('aria-label', 'Login or Sign up');
             console.log("Set aria-label to 'Login or Sign up'");
        }
    };

    // Initial check when the page loads
    checkLoginStatus();

    // Optional listener for changes from other tabs/logout
    window.addEventListener('loginStatusChanged', checkLoginStatus);

    // Listen for storage events to update login status across tabs
    window.addEventListener('storage', (event) => {
        if (event.key === 'user') {
             console.log('User data changed in another tab. Updating login status.');
             checkLoginStatus();
        }
    });

    // ============================================= //
    // JS Section End: Authentication Check        //
    // ============================================= //


    // ============================================= //
    // JS Section Start: Hero Slider Functionality //
    // ============================================= //
    const initSlider = () => {
        if (slides.length === 0) return; // Exit if no slides
        showSlide(currentSlide); // Show initial slide
        startAutoplay();

        // Event listeners for controls
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const slideId = dot.getAttribute('data-slide');
                const slideIndex = Array.from(slides).findIndex(slide => slide.id === slideId);
                if (slideIndex !== -1 && slideIndex !== currentSlide) { // Only act if different slide
                    showSlide(slideIndex);
                    resetAutoplay(); // Reset timer on manual interaction
                }
            });
        });

        if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetAutoplay(); });
        if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetAutoplay(); });

        // Pause autoplay on hover
        const sliderElement = document.querySelector('.hero-slider');
        if (sliderElement) {
            sliderElement.addEventListener('mouseenter', pauseAutoplay);
            sliderElement.addEventListener('mouseleave', startAutoplay);
        }
    }

    const showSlide = (index) => {
        // Normalize index
        currentSlide = index;
        if (currentSlide >= slides.length) currentSlide = 0;
        if (currentSlide < 0) currentSlide = slides.length - 1;

        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });

        // Update dots
        dots.forEach((dot, i) => {
            // Ensure dot corresponds to the slide index, handle mismatch if necessary
            // This assumes dots are in the same order as slides
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    const prevSlide = () => showSlide(currentSlide - 1);
    const nextSlide = () => showSlide(currentSlide + 1);
    const startAutoplay = () => {
        pauseAutoplay(); // Clear existing interval first
        if (slides.length > 1) { // Only autoplay if more than one slide
            slideInterval = setInterval(nextSlide, autoPlayDelay);
        }
    }
    const pauseAutoplay = () => clearInterval(slideInterval);
    const resetAutoplay = () => { pauseAutoplay(); startAutoplay(); }

    // Initialize the slider only if slides exist
    if (slides.length > 0) {
        initSlider();
    } else {
        console.warn("Hero slider elements not found. Slider not initialized.");
    }
    // ============================================= //
    // JS Section End: Hero Slider Functionality   //
    // ============================================= //


    // ============================================= //
    // JS Section Start: Resize Handler            //
    // ============================================= //
    const handleResize = () => {
        // Close mobile menu if window becomes wider and menu is open
        const isMobileMenuOpen = mobileMenu && mobileMenu.classList.contains('show-mobile-menu');
        if (window.innerWidth > 992 && isMobileMenuOpen) { // Use the breakpoint where menu hides
            toggleMobileMenu(); // Use the toggle function to close it
        }
        // Re-check scroll position on resize as element heights might change
        handleScroll();
    };
    window.addEventListener('resize', handleResize);
    // ============================================= //
    // JS Section End: Resize Handler              //
    // ============================================= //
}); // End DOMContentLoaded