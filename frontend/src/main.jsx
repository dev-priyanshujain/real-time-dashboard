import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log("main.jsx: Attempting to mount...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("main.jsx: Root element not found!");
} else {
  console.log("main.jsx: Root element found, rendering...");
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("main.jsx: Render called.");
}

