// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  admin: 'http://localhost:8009/api', // Administrator Service API base URL
  // Identity service URL is called by the Admin Service for user management
};

const AdminDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [adminProfile, setAdminProfile] = useState(null);
  const [allUsers, setAllUsers] = useState([]); // List of all users from Identity (via Admin Service)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error

  // State for creating user functionality
  const [isCreatingUser, setIsCreatingUser] = useState(false); // Controls form visibility
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newUserType, setNewUserType] = useState('patient'); // Default new user type
  const [createUserLoading, setCreateUserLoading] = useState(false); // Loading state for creation
  const [createUserError, setCreateUserError] = useState(null); // Error state for creation
  const [createUserSuccess, setCreateUserSuccess] = useState(null); // Success message for creation

   // Available user types (should match Identity Service)
   const USER_TYPES = [
       'patient',
       'doctor',
       'pharmacist',
       'nurse',
       'lab_technician',
       'administrator',
       'insurance_provider', // Assuming this type will be added later
   ];


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);

      const adminUserId = user.id; // Get the logged-in admin's UUID

      try {
        // 1. Fetch Administrator Profile (Identity + Admin specific)
        // Call the Administrator Service detail endpoint, which aggregates Identity data
        const profileResponse = await axios.get(`${SERVICE_URLS.admin}/admins/${adminUserId}/`);
        setAdminProfile(profileResponse.data);
        console.log('Fetched Administrator Profile:', profileResponse.data);


        // 2. Fetch List of All Users (Calls Admin Service which calls Identity)
        // Call the Administrator Service endpoint for listing users
        // Admin Service aggregates Identity data
        const usersResponse = await axios.get(`${SERVICE_URLS.admin}/users/`);
        // The Admin Service's /users/ endpoint should return a list of users
        setAllUsers(usersResponse.data);
        console.log('Fetched All Users:', usersResponse.data);


      } catch (err) {
        console.error('Error fetching admin data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch admin data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch admin data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if the user object (with ID) is available AND the user type is administrator
    if (user && user.id && user.user_type === 'administrator') {
       console.log('Fetching data for administrator:', user.id);
       fetchAdminData();
    } else {
       console.log('User not available or not administrator. Skipping data fetch.');
       setLoading(false);
    }

  }, [user, navigate]); // Include navigate in dependency array


   // --- Handle Starting Create User ---
   const handleStartCreateUser = () => {
       setNewUsername(''); setNewPassword(''); setNewEmail('');
       setNewFirstName(''); setNewLastName(''); setNewUserType('patient'); // Reset form
       setCreateUserError(null);
       setCreateUserSuccess(null);
       setIsCreatingUser(true); // Show the form
   };

  // --- Handle Submit Create User ---
   const handleSubmitCreateUser = async (e) => {
       e.preventDefault();

       setCreateUserLoading(true);
       setCreateUserError(null);
       setCreateUserSuccess(null);

       // Basic validation
       if (!newUsername || !newPassword) {
           setCreateUserError('Username and password are required.');
           setCreateUserLoading(false);
           return;
       }

       const newUserPayload = {
           username: newUsername,
           password: newPassword,
           email: newEmail || null, // Send null if empty string
           first_name: newFirstName || null,
           last_name: newLastName || null,
           user_type: newUserType,
       };

       try {
           // Call the Administrator Service endpoint to create a user
           // Admin Service orchestrates the call to Identity Service /register/
           const response = await axios.post(`${SERVICE_URLS.admin}/users/create/`, newUserPayload);

           if (response.status === 201) { // Admin Service returns 201 on success
               setCreateUserSuccess(`User "${newUsername}" created successfully!`);
               console.log('User created via Admin Service:', response.data);

               // Optional: Refetch the list of all users to show the new one
                const usersResponse = await axios.get(`${SERVICE_URLS.admin}/users/`);
                setAllUsers(usersResponse.data); // Update the list
                console.log('Refetched All Users:', usersResponse.data);


               // Reset form state
               setNewUsername(''); setNewPassword(''); setNewEmail('');
               setNewFirstName(''); setNewLastName(''); setNewUserType('patient');
               // setIsCreatingUser(false); // Optionally close form after success

           } else {
              setCreateUserError('Failed to create user: Unexpected response.');
           }

       } catch (err) {
            console.error('User creation failed:', err);
            if (err.response) {
                 if (err.response.status === 409) { // Handle username conflict specifically
                     setCreateUserError('User creation failed: Username already exists.');
                 } else if (err.response.data && err.response.data.error) {
                     setCreateUserError(`Failed to create user: ${err.response.data.error}`);
                 } else {
                     setCreateUserError(`Failed to create user: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setCreateUserError('Failed to create user: Could not connect to the administrator service.');
            } else {
                 setCreateUserError('An unexpected error occurred during user creation.');
            }
       } finally {
           setCreateUserLoading(false);
       }
   };

   // --- Handle Edit/Delete User (Placeholders) ---
   const handleEditUser = (userId) => {
       alert(`Edit user functionality not implemented yet for user ID: ${userId}`);
       console.log('Attempted to edit user:', userId);
       // In a real app, this would navigate to a user detail/edit page or show an edit modal.
   };

   const handleDeleteUser = async (userId) => {
       // Confirmation prompt (simple alert for demo)
       if (window.confirm(`Are you sure you want to delete user ID: ${userId}?`)) {
           try {
               // Call the Administrator Service endpoint to delete a user
               // Admin Service orchestrates the call to Identity Service DELETE /users/<id>/
               const response = await axios.delete(`${SERVICE_URLS.admin}/users/${userId}/`);

               if (response.status === 200 || response.status === 204) { // Admin Service returns 200, Identity returns 204
                   alert(`User ${userId} deleted successfully!`); // Use alert for success confirmation
                   console.log('User deleted via Admin Service:', response.data || 'No content');

                   // Refetch the list of all users to remove the deleted one
                   const usersResponse = await axios.get(`${SERVICE_URLS.admin}/users/`);
                   setAllUsers(usersResponse.data);
                   console.log('Refetched All Users after deletion.');

               } else {
                   alert(`Failed to delete user: Unexpected response status ${response.status}.`);
                   console.error('Deletion failed: Unexpected response status', response.status);
               }

           } catch (err) {
               console.error('User deletion failed:', err);
               let errorMessage = 'Failed to delete user.';
               if (err.response && err.response.data && err.response.data.error) {
                  errorMessage = `Failed to delete user: ${err.response.data.error}`;
                  console.error('Backend error details:', err.response.data.details);
               } else if (err.request) {
                   errorMessage = 'Failed to delete user: Network error or service is down.';
               } else {
                   errorMessage = 'An unexpected error occurred during deletion.';
               }
               alert(errorMessage); // Show error in alert
           }
       }
   };


  // --- Early Return for Redirection (Must come AFTER Hook calls) ---
  // If the user is not logged in or is not an administrator, redirect to login.
  if (!user || user.user_type !== 'administrator') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Must come AFTER Early Returns) ---
  if (loading) {
    return <div>Loading Administrator Dashboard...</div>;
  }

  if (error) {
    return (
      <div>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  // --- Render Data and Forms ---
  return (
    <div>
      <h2>Administrator Dashboard</h2>

      {/* Display Administrator Profile */}
      {adminProfile ? (
        <div>
          <h3>Your Profile</h3>
          <p>Name: {adminProfile.first_name} {adminProfile.last_name}</p>
          <p>Username: {adminProfile.username}</p>
          <p>Email: {adminProfile.email}</p>
          <p>Internal Admin ID: {adminProfile.internal_admin_id || 'N/A'}</p>
          {adminProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {adminProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

       {/* Create New User Section */}
       <h3>Create New User</h3>
       {!isCreatingUser ? (
            <button onClick={handleStartCreateUser}>Create New User</button>
       ) : (
           <div>
               <h4>Enter User Details</h4>
               <form onSubmit={handleSubmitCreateUser}>
                   <div>
                       <label htmlFor="newUsername">Username:</label>
                       <input type="text" id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                   <div>
                       <label htmlFor="newPassword">Password:</label>
                       <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                    <div>
                       <label htmlFor="newEmail">Email (Optional):</label>
                       <input type="email" id="newEmail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} style={{ width: '80%' }} />
                   </div>
                    <div>
                       <label htmlFor="newFirstName">First Name (Optional):</label>
                       <input type="text" id="newFirstName" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} style={{ width: '80%' }} />
                   </div>
                    <div>
                       <label htmlFor="newLastName">Last Name (Optional):</label>
                       <input type="text" id="newLastName" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} style={{ width: '80%' }} />
                   </div>
                   <div>
                       <label htmlFor="newUserType">User Type:</label>
                       <select id="newUserType" value={newUserType} onChange={(e) => setNewUserType(e.target.value)} required>
                           {USER_TYPES.map(type => (
                               <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}</option>
                           ))}
                       </select>
                   </div>

                   {createUserError && <div style={{ color: 'red' }}>{createUserError}</div>}
                   {createUserSuccess && <div style={{ color: 'green' }}>{createUserSuccess}</div>}

                   <button type="submit" disabled={createUserLoading}>
                       {createUserLoading ? 'Creating...' : 'Create User'}
                   </button>
                   <button type="button" onClick={() => setIsCreatingUser(false)} disabled={createUserLoading}>
                       Cancel
                   </button>
               </form>
           </div>
       )}

      <hr />

      {/* Display List of All Users */}
      <h3>All Users</h3>
      {allUsers.length > 0 ? (
        <ul>
          {allUsers.map(userItem => ( // Renamed user variable to userItem to avoid conflict with context 'user'
            <li key={userItem.id}>
              <strong>{userItem.username}</strong> ({userItem.user_type}) - {userItem.first_name} {userItem.last_name} ({userItem.email})<br />
               User ID: {userItem.id}
               {/* Add Edit and Delete buttons */}
                <button onClick={() => handleEditUser(userItem.id)} style={{ marginLeft: '10px' }}>Edit</button>
                <button onClick={() => handleDeleteUser(userItem.id)} style={{ marginLeft: '10px', color: 'red' }}>Delete</button>

               {/* Display individual S2S errors if present (should not happen for this list if Admin Service GET users works) */}
               {userItem._identity_error && <p style={{color:'orange', margin:0}}>Warning: Could not load identity data: {userItem._identity_error}</p>} {/* Should not happen if Admin service calls Identity GET /users/ correctly */}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No users found.</p>
      )}


      <hr />

      {/* Add other admin functionalities (e.g., System Logs, Reports) */}
       <h3>Other Administrator Functions (To Be Implemented)</h3>
       {/* Example: */}
       {/* <button>View System Logs</button> */}
       {/* <button>Generate Reports</button> */}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminDashboard;