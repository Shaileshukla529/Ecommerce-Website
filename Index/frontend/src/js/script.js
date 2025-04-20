// --- DOM Elements ---
const loginContainer = document.getElementById('loginContainer');
const registerContainer = document.getElementById('registerContainer');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('showRegister');
const showLoginLink = document.getElementById('showLogin');
const loginNotification = document.getElementById('loginNotification');
const registerNotification = document.getElementById('registerNotification');

// --- API Base URL (Adjust if your backend runs on a different port) ---
const API_BASE_URL = 'https://ecommerce-website-883p.onrender.com'; // Assuming backend runs on port 3000

// --- Helper Functions ---

/**
 * Displays a notification message.
 * @param {HTMLElement} element - The notification element.
 * @param {string} message - The message to display.
 * @param {boolean} isSuccess - True for success style, false for failure.
 */
function showNotification(element, message, isSuccess) {
    element.textContent = message;
    element.className = 'notification'; // Reset classes
    element.classList.add(isSuccess ? 'success' : 'failure');
    element.style.display = 'block';
    // Hide after 5 seconds
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

/**
 * Shows or hides an inline error message for a form field.
 * @param {string} fieldId - The base ID of the input field (e.g., 'login-email').
 * @param {string|null} message - The error message or null to hide.
 */
function showFieldError(fieldId, message) {
    const errorSpan = document.getElementById(`${fieldId}-error`);
    const input = document.getElementById(fieldId);
    if (message) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
        input?.classList.add('input-error'); // Optional: add class to input for styling
    } else {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
        input?.classList.remove('input-error');
    }
}

/** Clears all field errors for a given form */
function clearFormErrors(form) {
    form.querySelectorAll('.error-message').forEach(span => {
        span.textContent = '';
        span.style.display = 'none';
    });
    form.querySelectorAll('input').forEach(input => {
        input.classList.remove('input-error');
    });
}

/** Toggles between login and register views */
function toggleForms(showLogin) {
    if (showLogin) {
        loginContainer.style.display = 'block';
        registerContainer.style.display = 'none';
        loginNotification.style.display = 'none'; // Hide notifications on switch
    } else {
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
        registerNotification.style.display = 'none'; // Hide notifications on switch
    }
}

// --- Event Listeners ---

// Switch to Register Form
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(false); // Show register
});

// Switch to Login Form
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    toggleForms(true); // Show login
});

// --- Login Form Submission ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(loginForm);
    loginNotification.style.display = 'none';

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    let isValid = true;

    // Basic Client-Side Validation
    if (!email) {
        showFieldError('login-email', 'Email is required.');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) { // Simple email regex
        showFieldError('login-email', 'Please enter a valid email address.');
        isValid = false;
    }
    if (!password) {
        showFieldError('login-password', 'Password is required.');
        isValid = false;
    }

    if (!isValid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json(); // Always parse JSON

        if (response.ok) { // Status 200-299
            showNotification(loginNotification, data.message || 'Login successful!', true);
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify(data.user));
            // Redirect to Home.html after successful login
            window.location.href = 'index.html';
            loginForm.reset(); // Clear form on success
        } else {
            showNotification(loginNotification, data.message || `Login failed (Status: ${response.status})`, false);
        }
    } catch (error) {
        console.error('Login Error:', error);
        showNotification(loginNotification, 'An error occurred. Please try again later.', false);
    }
});

// --- Registration Form Submission ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(registerForm);
    registerNotification.style.display = 'none';

    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value.trim();
    let isValid = true;

    // Basic Client-Side Validation
    if (!username) {
        showFieldError('register-username', 'Username is required.');
        isValid = false;
    }
    if (!email) {
        showFieldError('register-email', 'Email is required.');
        isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
        showFieldError('register-email', 'Please enter a valid email address.');
        isValid = false;
    }
    if (!password) {
        showFieldError('register-password', 'Password is required.');
        isValid = false;
    } else if (password.length < 6) { // Example: Minimum password length
        showFieldError('register-password', 'Password must be at least 6 characters long.');
        isValid = false;
    }


    if (!isValid) return;

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json(); // Always parse JSON

        if (response.ok) { // Status 200-299 (specifically 201 for created)
             showNotification(registerNotification, data.message || 'Registration successful! Please log in.', true);
             registerForm.reset(); // Clear form on success
             // Optionally switch to login form after successful registration
             setTimeout(() => toggleForms(true), 2000);
        } else {
             // Handle specific errors from backend if available
            if (response.status === 400 && data.errors) {
                // Example: Display multiple field-specific errors
                let errorMessage = data.message || 'Registration failed:';
                data.errors.forEach(err => {
                    // Assuming backend sends errors like { field: 'email', message: 'Already exists' }
                    if(err.field) {
                         showFieldError(`register-${err.field}`, err.message);
                    }
                    errorMessage += `\n- ${err.message}`; // Fallback general message
                });
                 showNotification(registerNotification, data.message || 'Please correct the errors above.', false);

            } else {
                 showNotification(registerNotification, data.message || `Registration failed (Status: ${response.status})`, false);
            }
        }
    } catch (error) {
        console.error('Registration Error:', error);
        showNotification(registerNotification, 'An error occurred. Please try again later.', false);
    }
});

// --- Initial Setup ---
// Ensure the login form is shown by default if JS runs
toggleForms(true);
