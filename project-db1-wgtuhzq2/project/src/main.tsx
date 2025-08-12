import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSecurity } from './utils/security';

// Initialiser les protections de sécurité
initSecurity();

// Masquer React en production
if (import.meta.env.PROD) {
  // Supprimer les propriétés React qui pourraient révéler des informations
  Object.defineProperty(window, 'React', { get: () => undefined });
  Object.defineProperty(window, 'ReactDOM', { get: () => undefined });
  
  // Supprimer les propriétés qui pourraient révéler des informations sur le framework
  const propsToHide = ['__REACT_DEVTOOLS_GLOBAL_HOOK__', '__REDUX_DEVTOOLS_EXTENSION__'];
  propsToHide.forEach(prop => {
    if ((window as any)[prop]) {
      Object.defineProperty(window, prop, { get: () => undefined });
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
