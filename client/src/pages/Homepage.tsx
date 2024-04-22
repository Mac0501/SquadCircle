import React from 'react';
import { Link } from 'react-router-dom';

const Homepage = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: 100 }}>
      <h1>Welcome to Our Website!</h1>
      <p>Please log in to access the dashboard.</p>
      <Link to="/login">
        <button style={{ padding: '10px 20px', fontSize: 16, marginTop: 20 }}>
          Login
        </button>
      </Link>
    </div>
  );
};

export default Homepage;
