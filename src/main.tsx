import React from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import 'react-data-grid/lib/styles.css';
import './styles/global.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
