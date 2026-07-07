import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AdminAuth } from './AdminAuth';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <AdminAuth>
    <App />
  </AdminAuth>
);
