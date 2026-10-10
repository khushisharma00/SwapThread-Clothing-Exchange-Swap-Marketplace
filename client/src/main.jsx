import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { MetaProvider } from './context/MetaContext';
import { ToastProvider } from './context/ToastContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <MetaProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </MetaProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
