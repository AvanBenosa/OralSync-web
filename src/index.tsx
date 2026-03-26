import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // 👈 add this
import App from './App';
import './index.css';
import { ThemeContextProvider } from './common/lib/themes/themeContext';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <ThemeContextProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </ThemeContextProvider>
  </React.StrictMode>
);
