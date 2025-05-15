// src/components/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '../context/UserContext'; // Import the custom hook
import { useNavigate, Navigate } from 'react-router-dom'; // Import Navigate for redirection if already logged in

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useUser(); // Get the user state and login function from context
  const navigate = useNavigate(); // Hook for navigation


  // If the user is already logged in, redirect them based on their user_type
  // Note: This simple check runs on render. A more robust solution might use
  // a dedicated redirect component or check within routes.
  if (user) {
    switch (user.user_type) {
      case 'patient': return <Navigate to="/patient" replace />;
      case 'doctor': return <Navigate to="/doctor" replace />;
      case 'pharmacist': return <Navigate to="/pharmacist" replace />;
      case 'nurse': return <Navigate to="/nurse" replace />;
      case 'lab_technician': return <Navigate to="/labtech" replace />; // Assuming lab_technician type
      case 'administrator': return <Navigate to="/admin" replace />; // Assuming administrator type
      // Add cases for other user types
      default: return <Navigate to="/" replace />; // Default redirect if type is unknown
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setError(''); // Clear previous errors

    try {
      // Call the Identity Service Login API
      const response = await axios.post('http://localhost:8000/api/identity/login/', {
        username,
        password,
      });

      // Assuming successful login returns 200 and user data
      if (response.status === 200) {
        const userData = response.data; // Assuming API returns user data including id and user_type
        console.log('Login successful:', userData);

        // Store user data in context
        login(userData);

        // Redirect user based on their user_type
        switch (userData.user_type) {
          case 'patient': navigate('/patient'); break;
          case 'doctor': navigate('/doctor'); break;
          case 'pharmacist': navigate('/pharmacist'); break;
          case 'nurse': navigate('/nurse'); break;
          case 'lab_technician': navigate('/labtech'); break; // Assuming lab_technician type
          case 'administrator': navigate('/admin'); break; // Assuming administrator type
          // Add cases for other user types
          default: navigate('/'); // Default redirect
        }

      } else {
        // Handle unexpected successful status codes if any
         setError('Unexpected login response.');
      }

    } catch (error) {
      console.error('Login failed:', error);
      if (error.response) {
        // The API returned a response with an error status code (e.g., 401)
        if (error.response.status === 401) {
          setError('Invalid username or password.');
        } else {
          setError(`Login failed: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.request) {
        // The request was made but no response was received (e.g., service is down)
        setError('Login failed: Could not connect to the authentication service.');
      } else {
        // Something else happened while setting up the request
        setError('An unexpected error occurred.');
      }
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
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
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;