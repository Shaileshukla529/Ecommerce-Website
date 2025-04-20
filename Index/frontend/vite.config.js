// vite.config.js
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Define entry points for all your HTML pages
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        cart: resolve(__dirname, 'Cart.html'),
        checkout: resolve(__dirname, 'checkout.html'),
        my_orders: resolve(__dirname, 'my_orders.html'),
        order_confirmation: resolve(__dirname, 'order_confirmation.html'),
        product_view: resolve(__dirname, 'product-view.html'),
        profile: resolve(__dirname, 'profile.html'),
        wish: resolve(__dirname, 'wish.html'),
        // Add any other HTML pages you have here, giving each a unique key (like 'main', 'login', etc.)
      },
    },
  },
  // Ensure the root points to your frontend source directory if needed,
  // but if vite.config.js is inside 'frontend', this might not be necessary.
  // root: './', 
});