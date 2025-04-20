/* src/js/my_orders.js */
document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');
    const loadingMessage = document.getElementById('loading-message');
    const noOrdersMessage = document.getElementById('no-orders-message');
    const errorMessage = document.getElementById('error-message');

    const API_BASE_URL = 'http://localhost:5000/api'; // Your backend URL

    function formatPrice(amount) {
        return `$${amount.toFixed(2)}`;
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(dateString).toLocaleDateString(undefined, options);
        } catch (e) {
            return 'Invalid Date';
        }
    }

    function displayOrders(orders) {
        loadingMessage.classList.add('hidden');

        if (!orders || orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
            return;
        }

        ordersContainer.innerHTML = ''; // Clear loading/empty messages

        orders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'bg-white p-4 md:p-6 rounded-lg shadow-md border border-gray-200';

            const itemsHtml = order.items.map(item => `
                <div class="flex items-center py-2 border-b last:border-b-0">
                    <img src="${item.image || 'https://placehold.co/50x50/e2e8f0/94a3b8?text=N/A'}" alt="${item.name}" class="w-12 h-12 object-cover rounded mr-4">
                    <div class="flex-grow">
                        <p class="font-medium text-gray-800">${item.name}</p>
                        <p class="text-sm text-gray-500">Qty: ${item.quantity} | Price: ${formatPrice(item.price)}</p>
                    </div>
                    <p class="font-medium text-gray-800">${formatPrice(item.price * item.quantity)}</p>
                </div>
            `).join('');

            orderCard.innerHTML = `
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 pb-3 border-b">
                    <div>
                        <h2 class="text-lg font-semibold text-gray-800">Order ID: ${order._id}</h2>
                        <p class="text-sm text-gray-500">Placed on: ${formatDate(order.orderDate)}</p>
                    </div>
                    <div class="mt-2 md:mt-0 text-left md:text-right">
                         <span class="inline-block bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">${order.orderStatus}</span>
                        <p class="text-lg font-bold text-gray-900 mt-1">${formatPrice(order.totalAmount)}</p>
                    </div>
                </div>

                <div class="mb-4">
                     <h3 class="text-md font-semibold text-gray-700 mb-2">Items</h3>
                     <div class="space-y-2">
                         ${itemsHtml}
                     </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-1">Shipping Address</h4>
                        <address class="not-italic text-gray-600">
                            ${order.shippingAddress.name}<br>
                            ${order.shippingAddress.street}<br>
                            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
                            ${order.shippingAddress.country}<br>
                            Phone: ${order.shippingAddress.phone}
                        </address>
                    </div>
                     <div>
                         <h4 class="font-semibold text-gray-700 mb-1">Payment</h4>
                         <p class="text-gray-600">Method: ${order.paymentMethod}</p>
                         <p class="text-gray-600">Status: <span class="${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-600'} font-medium">${order.paymentStatus}</span></p>
                         ${order.estimatedDelivery ? `<p class="text-gray-600 mt-2">Estimated Delivery: ${formatDate(order.estimatedDelivery)}</p>` : ''}
                     </div>
                 </div>
            `;
            ordersContainer.appendChild(orderCard);
        });
    }

    async function fetchOrders() {
        // --- Get User ID (Needs proper auth implementation) ---
        const userString = localStorage.getItem('user');
        const user = userString ? JSON.parse(userString) : null;
        if (!user || !user.id) {
            loadingMessage.classList.add('hidden');
            errorMessage.textContent = 'You need to be logged in to view orders. Redirecting...';
            errorMessage.classList.remove('hidden');
            setTimeout(() => { window.location.href = 'login.html'; }, 2500);
            return;
        }
        const userId = user.id;

        try {
            // ** TEMPORARY: Using query param. Replace with auth header **
            const response = await fetch(`${API_BASE_URL}/orders/my?userId=${userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${your_auth_token}` // Add auth header later
                },
            });

            if (response.ok) {
                const orders = await response.json();
                displayOrders(orders);
            } else {
                const errorData = await response.json();
                loadingMessage.classList.add('hidden');
                errorMessage.textContent = `Error: ${errorData.message || response.statusText}`;
                errorMessage.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Fetch Orders Error:', error);
            loadingMessage.classList.add('hidden');
            errorMessage.textContent = 'Failed to load orders due to a network error.';
            errorMessage.classList.remove('hidden');
        }
    }

    // --- Initial Load ---
    fetchOrders();
});