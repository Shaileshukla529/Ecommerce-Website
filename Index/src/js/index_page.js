// Wrap all JS in a DOMContentLoaded listener to ensure HTML is ready
document.addEventListener('DOMContentLoaded', function () {

    // ============================================= //
    // JS Section Start: Variable Declarations     //
    // ============================================= //
    const navbarContainer = document.querySelector('.navbar-container');
    const body = document.body;
    const menuToggle = document.getElementById('menuToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = menuToggle ? menuToggle.querySelector('i') : null;
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
        if (window.innerWidth > 768) {
            if (window.scrollY > announcementBarHeight / 2) {
                navbarContainer.classList.add('navbar-scrolled');
                body.classList.add('navbar-scrolled');
            } else {
                navbarContainer.classList.remove('navbar-scrolled');
                body.classList.remove('navbar-scrolled');
            }
        } else {
            navbarContainer.classList.remove('navbar-scrolled');
            body.classList.remove('navbar-scrolled');
        }
    };

    const closeAllMobileDropdowns = () => {
        document.querySelectorAll('.navbar-menu .dropdown.show-dropdown, .navbar-menu .mega-dropdown.show-dropdown').forEach(openDropdown => openDropdown.classList.remove('show-dropdown'));
        document.querySelectorAll('.navbar-menu .menu-link.dropdown-toggle.open').forEach(toggle => toggle.classList.remove('open'));
    }

    const toggleMobileMenu = () => {
        if (!mobileMenu || !menuIcon) return;
        mobileMenu.classList.toggle('show-mobile-menu');
        const isMenuOpen = mobileMenu.classList.contains('show-mobile-menu');
        menuIcon.classList.toggle('fa-bars', !isMenuOpen);
        menuIcon.classList.toggle('fa-times', isMenuOpen);
        if (!isMenuOpen) closeAllMobileDropdowns();
    };

    const handleMobileDropdownToggle = (e) => {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            const parentMenuItem = e.currentTarget.parentElement;
            const dropdown = parentMenuItem.querySelector('.dropdown') || parentMenuItem.querySelector('.mega-dropdown');
            if (!dropdown) return;
            const isOpening = !dropdown.classList.contains('show-dropdown');
            if (isOpening) closeAllMobileDropdowns(); // Close others if opening a new one
            dropdown.classList.toggle('show-dropdown');
            e.currentTarget.classList.toggle('open', isOpening);
        }
    };

    // Initial check in case page loads scrolled
    handleScroll();
    // Add event listeners for Navbar
    window.addEventListener('scroll', handleScroll);
    if (menuToggle) menuToggle.addEventListener('click', toggleMobileMenu);
    document.querySelectorAll('.navbar-menu .dropdown-toggle').forEach(item => item.addEventListener('click', handleMobileDropdownToggle));
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
    }
    // ============================================= //
    // JS Section End: Hero Slider Functionality   //
    // ============================================= //


    // ============================================= //
    // JS Section Start: Resize Handler            //
    // ============================================= //
    const handleResize = () => {
        // Close mobile menu if window becomes wider
        if (window.innerWidth > 768 && mobileMenu && mobileMenu.classList.contains('show-mobile-menu')) {
            toggleMobileMenu(); // Use the toggle function
        }
        // Re-check scroll position on resize
        handleScroll();
    };
    window.addEventListener('resize', handleResize);
    // ============================================= //
    // JS Section End: Resize Handler              //
    // ============================================= //
}); // End DOMContentLoaded