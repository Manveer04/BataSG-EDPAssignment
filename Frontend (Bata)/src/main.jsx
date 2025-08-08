import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import UserContext from './contexts/UserContext.js';
import App from './App.jsx';
import './index.css';

const Root = () => {
  const [user, setUser] = useState(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <App />
    </UserContext.Provider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
