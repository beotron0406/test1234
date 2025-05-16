// src/components/Login.js (with class names added)
import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext'; 
import { useNavigate, Navigate } from 'react-router-dom'; 
import '../css/index.css'; // Import CSS

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useUser(); 
  const navigate = useNavigate();

  // Redirect if already logged in
  if (user) {
    switch (user.user_type) {
      case 'patient': return <Navigate to="/patient" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'pharmacist': return <Navigate to="/pharmacist" replace />;
      case 'nurse': return <Navigate to="/nurse" replace />;
      case 'lab_technician': return <Navigate to="/labtech" replace />; 
      case 'administrator': return <Navigate to="/admin" replace />; 
      default: return <Navigate to="/" replace />; 
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/identity/login/', {
        username,
        password,
      });

      if (response.status === 200) {
        const userData = response.data;
        console.log('Login successful:', userData);
        login(userData);

        switch (userData.user_type) {
          case 'patient': navigate('/patient'); break;
          case 'doctor': navigate('/doctor'); break;
          case 'pharmacist': navigate('/pharmacist'); break;
          case 'nurse': navigate('/nurse'); break;
          case 'lab_technician': navigate('/labtech'); break;
          case 'administrator': navigate('/admin'); break;
          default: navigate('/');
        }
      } else {
        setError('Unexpected login response.');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('Invalid username or password.');
        } else {
          setError(`Login failed: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        setError('Login failed: Could not connect to the authentication service.');
      } else {
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form className="login-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;