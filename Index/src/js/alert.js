function customAlert(msg, title) {

    // Create the main dialog container (div)
    const dialog = document.createElement('div');
    dialog.classList.add('custom-alert'); // Add CSS class for styling

    // Create the title element (h3)
    const titleElement = document.createElement('h3');
    titleElement.textContent = title || 'Alert'; // Use provided title or default
    dialog.appendChild(titleElement); // Add title to dialog

    // Create the message element (p)
    const messageElement = document.createElement('p');
    messageElement.textContent = msg; // Set the message text
    dialog.appendChild(messageElement); // Add message to dialog

    // Create the OK button (button)
    const button = document.createElement('button');
    button.textContent = 'OK'; // Set button text

    // --- Add Button Functionality ---

    // Add event listener to the button
    button.addEventListener('click', () => {
        // When the button is clicked, remove the dialog from the page
        // Use try-catch for robustness in case the element is already removed
        try {
            document.body.removeChild(dialog);
        } catch (e) {
            function customAlert(msg, title) {
                // --- Create Dialog Elements ---
    
                // Create the main dialog container (div)
                const dialog = document.createElement('div');
                dialog.classList.add('custom-alert'); // Add CSS class for styling
    
                // Create the title element (h3)
                const titleElement = document.createElement('h3');
                titleElement.textContent = title || 'Alert'; // Use provided title or default
                dialog.appendChild(titleElement); // Add title to dialog
    
                // Create the message element (p)
                const messageElement = document.createElement('p');
                messageElement.textContent = msg; // Set the message text
                dialog.appendChild(messageElement); // Add message to dialog
    
                // Create the OK button (button)
                const button = document.createElement('button');
                button.textContent = 'OK'; // Set button text
    
                button.addEventListener('click', () => {
                    try {
                        document.body.removeChild(dialog);
                    } catch (e) {
                        // Optional: Log error if needed, but generally safe to ignore
                        // console.error("Dialog already removed or not found:", e);
                    }
                });
                dialog.appendChild(button); // Add button to dialog
    
                // --- Display Dialog ---
    
                // Append the complete dialog box to the document's body
                document.body.appendChild(dialog);
            }
    
            // --- Example Usage ---
    
            // Function called by the button's onclick event
            function showAlert(message) {
                customAlert(
                     message
                );
            }
        }
    });
    dialog.appendChild(button); 

    document.body.appendChild(dialog);
}

function showAlert() {
    customAlert(
        "This is a custom message! It looks much better than the default alert.", 
        "Important Notice" 
    );
}