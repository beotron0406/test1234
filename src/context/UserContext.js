// src/context/UserContext.js
import React, { createContext, useState, useContext, useMemo } from 'react';

// Create the Context
const UserContext = createContext(null); // Default value is null

// Create a Provider component
export const UserProvider = ({ children }) => {
  // State to hold the logged-in user data
  // Initially null, or maybe check localStorage for persistence
  const [user, setUser] = useState(null);

  // You could add login/logout logic here, but for now, setUser directly
  // is enough.
  const login = (userData) => {
    // Store user data in state
    setUser(userData);
    // Optional: Persist user data (e.g., in localStorage)
    // localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    // Clear user data from state
    setUser(null);
    // Optional: Remove persisted data
    // localStorage.removeItem('currentUser');
  };


  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    login, // Provide the login function
    logout, // Provide the logout function
    // You can also provide the user data directly if you prefer
    // user: user,
    // setUser: setUser, // Or expose setUser directly
  }), [user]); // Re-create context value only when user state changes

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to easily access the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Export the Context itself if needed elsewhere (less common)
// export default UserContext;