import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Register service worker only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful:', registration.scope);
      })
      .catch(error => {
        console.error('ServiceWorker registration failed:', error);
      });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // Unregister any existing service workers in development
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(const registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
