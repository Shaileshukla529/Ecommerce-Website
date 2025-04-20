// vite.config.js
// No need for 'resolve' from 'path' when using relative paths directly
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        // Define entry points using relative paths
        // Vite resolves these relative to the config file's location
        main: './index.html',
        login: './login.html',
        cart: './Cart.html',
        checkout: './checkout.html',
        my_orders: './my_orders.html',
        order_confirmation: './order_confirmation.html',
        product_view: './product-view.html',
        profile: './profile.html',
        wish: './wish.html',
      },
    },
  },
  // Assuming vite.config.js is in the 'frontend' directory,
  // the root is implicitly '.' (the directory containing the config file).
  // root: './', // Usually not needed if config is at the root of the source files
});