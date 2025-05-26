// src/components/AdminDashboard.js (with CSS applied)
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import '../css/index.css'; // Import CSS

// Define service ports for all microservices
const SERVICE_URLS = {
  admin: 'http://localhost:8009/api', // Administrator Service API base URL
  identity: 'http://localhost:8000/api/identity', // Identity service URL
  patient: 'http://localhost:8001/api', // Patient service
  doctor: 'http://localhost:8002/api', // Doctor service
  pharmacist: 'http://localhost:8003/api', // Pharmacist service 
  nurse: 'http://localhost:8005/api', // Nurse service
  labtech: 'http://localhost:8006/api', // Lab Technician service
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

  // Service-specific fields states
  // Patient fields
  const [newPatientDOB, setNewPatientDOB] = useState('');
  const [newPatientPhone, setNewPatientPhone] = useState('');
  const [newPatientAddress, setNewPatientAddress] = useState('');

  // Doctor fields
  const [newDoctorSpecialization, setNewDoctorSpecialization] = useState('');
  const [newDoctorLicenseNumber, setNewDoctorLicenseNumber] = useState('');
  const [newDoctorPhone, setNewDoctorPhone] = useState('');

  // Pharmacist fields
  const [newPharmacyName, setNewPharmacyName] = useState('');
  const [newPharmacyLicenseNumber, setNewPharmacyLicenseNumber] = useState('');
  const [newPharmacistPhone, setNewPharmacistPhone] = useState('');
  const [newPharmacistAddress, setNewPharmacistAddress] = useState('');

  // Nurse fields
  const [newNurseEmployeeId, setNewNurseEmployeeId] = useState('');

  // Lab Tech fields
  const [newLabTechEmployeeId, setNewLabTechEmployeeId] = useState('');

  // Admin fields
  const [newAdminInternalId, setNewAdminInternalId] = useState('');

  // Form state
  const [createUserLoading, setCreateUserLoading] = useState(false); // Loading state for creation
  const [createUserError, setCreateUserError] = useState(null); // Error state for creation
  const [createUserSuccess, setCreateUserSuccess] = useState(null); // Success message for creation
  const [serviceProfileError, setServiceProfileError] = useState(null); // Error state for service profile creation

  // Available user types (should match Identity Service)
  const USER_TYPES = [
    'patient',
    'doctor',
    'pharmacist',
    'nurse',
    'lab_technician',
    'administrator',
  ];

  // --- Data Fetching using useEffect (unchanged) ---
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      setError(null);

      const adminUserId = user.id; // Get the logged-in admin's UUID

      try {
        // 1. Fetch Administrator Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.admin}/admins/${adminUserId}/`);
        setAdminProfile(profileResponse.data);
        console.log('Fetched Administrator Profile:', profileResponse.data);

        // 2. Fetch List of All Users
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


  // --- Handle Starting Create User (modified to reset all fields) ---
  const handleStartCreateUser = () => {
    // Reset basic user fields
    setNewUsername('');
    setNewPassword('');
    setNewEmail('');
    setNewFirstName('');
    setNewLastName('');
    setNewUserType('patient');

    // Reset service-specific fields
    // Patient
    setNewPatientDOB('');
    setNewPatientPhone('');
    setNewPatientAddress('');

    // Doctor
    setNewDoctorSpecialization('');
    setNewDoctorLicenseNumber('');
    setNewDoctorPhone('');

    // Pharmacist
    setNewPharmacyName('');
    setNewPharmacyLicenseNumber('');
    setNewPharmacistPhone('');
    setNewPharmacistAddress('');

    // Nurse
    setNewNurseEmployeeId('');

    // Lab Tech
    setNewLabTechEmployeeId('');

    // Admin
    setNewAdminInternalId('');

    // Reset error and success messages
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setServiceProfileError(null);
    setIsCreatingUser(true); // Show the form
  };

  // --- Create user service profile based on user type ---
  const createUserServiceProfile = async (userId, userType) => {
    try {
      let serviceResponse = null;

      switch (userType) {
        case 'patient':
          serviceResponse = await axios.post(`${SERVICE_URLS.patient}/patients/`, {
            user_id: userId,
            date_of_birth: newPatientDOB || null,
            phone_number: newPatientPhone || null,
            address: newPatientAddress || null
          });
          break;

        case 'doctor':
          serviceResponse = await axios.post(`${SERVICE_URLS.doctor}/doctors/`, {
            user_id: userId,
            specialization: newDoctorSpecialization || null,
            license_number: newDoctorLicenseNumber || null,
            phone_number: newDoctorPhone || null
          });
          break;

        case 'pharmacist':
          serviceResponse = await axios.post(`${SERVICE_URLS.pharmacist}/pharmacists/`, {
            user_id: userId,
            pharmacy_name: newPharmacyName || null,
            pharmacy_license_number: newPharmacyLicenseNumber || null,
            phone_number: newPharmacistPhone || null,
            address: newPharmacistAddress || null
          });
          break;

        case 'nurse':
          serviceResponse = await axios.post(`${SERVICE_URLS.nurse}/nurses/`, {
            user_id: userId,
            employee_id: newNurseEmployeeId || null
          });
          break;

        case 'lab_technician':
          serviceResponse = await axios.post(`${SERVICE_URLS.labtech}/labtechs/`, {
            user_id: userId,
            employee_id: newLabTechEmployeeId || null
          });
          break;

        case 'administrator':
          serviceResponse = await axios.post(`${SERVICE_URLS.admin}/admins/`, {
            user_id: userId,
            internal_admin_id: newAdminInternalId || null
          });
          break;

        default:
          // No service profile needed for other user types
          return { success: true, message: "No service profile needed for this user type" };
      }

      console.log(`Created ${userType} profile:`, serviceResponse.data);
      return { success: true, data: serviceResponse.data };

    } catch (err) {
      console.error(`Error creating ${userType} profile:`, err);
      let errorMsg = `Failed to create ${userType} profile.`;

      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = `Failed to create ${userType} profile: ${err.response.data.error}`;
      } else if (err.request) {
        errorMsg = `Failed to create ${userType} profile: Network error or service is down.`;
      }

      return { success: false, error: errorMsg };
    }
  };

  // --- Handle Submit Create User (modified to create service profile) ---
  const handleSubmitCreateUser = async (e) => {
    e.preventDefault();

    setCreateUserLoading(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);
    setServiceProfileError(null);

    // Basic validation
    if (!newUsername || !newPassword) {
      setCreateUserError('Username and password are required.');
      setCreateUserLoading(false);
      return;
    }

    // Validate required fields based on user type
    let missingFields = [];

    switch (newUserType) {
      case 'patient':
        // No required fields for patients
        break;
      case 'doctor':
        if (!newDoctorLicenseNumber) missingFields.push('License Number');
        break;
      case 'pharmacist':
        if (!newPharmacyLicenseNumber) missingFields.push('Pharmacy License Number');
        break;
      case 'nurse':
        if (!newNurseEmployeeId) missingFields.push('Employee ID');
        break;
      case 'lab_technician':
        if (!newLabTechEmployeeId) missingFields.push('Employee ID');
        break;
      case 'administrator':
        if (!newAdminInternalId) missingFields.push('Internal Admin ID');
        break;
    }

    if (missingFields.length > 0) {
      setCreateUserError(`The following fields are required for ${newUserType}: ${missingFields.join(', ')}`);
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
      // Step 1: Create the user identity
      const response = await axios.post(`${SERVICE_URLS.admin}/users/create/`, newUserPayload);

      if (response.status === 201) { // Admin Service returns 201 on success
        console.log('User created via Admin Service:', response.data);

        // Step 2: Create service-specific profile
        const userId = response.data.id; // Get the new user's UUID
        const serviceResult = await createUserServiceProfile(userId, newUserType);

        if (serviceResult.success) {
          setCreateUserSuccess(`User "${newUsername}" created successfully with ${newUserType} profile!`);

          // Optional: Refetch the list of all users to show the new one
          const usersResponse = await axios.get(`${SERVICE_URLS.admin}/users/`);
          setAllUsers(usersResponse.data); // Update the list
          console.log('Refetched All Users:', usersResponse.data);

          // Reset form state
          handleStartCreateUser();
          setIsCreatingUser(false); // Close form after success
        } else {
          // User created but service profile failed
          setCreateUserSuccess(`User "${newUsername}" created, but ${serviceResult.error}`);
          setServiceProfileError(serviceResult.error);
        }
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

  // --- Render dynamic form fields based on user type ---
  const renderUserTypeFields = () => {
    switch (newUserType) {
      case 'patient':
        return (
          <>
            <div className="form-group">
              <label htmlFor="newPatientDOB">Date of Birth:</label>
              <input
                type="date"
                id="newPatientDOB"
                value={newPatientDOB}
                onChange={(e) => setNewPatientDOB(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPatientPhone">Phone Number:</label>
              <input
                type="text"
                id="newPatientPhone"
                value={newPatientPhone}
                onChange={(e) => setNewPatientPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPatientAddress">Address:</label>
              <input
                type="text"
                id="newPatientAddress"
                value={newPatientAddress}
                onChange={(e) => setNewPatientAddress(e.target.value)}
              />
            </div>
          </>
        );

      case 'doctor':
        return (
          <>
            <div className="form-group">
              <label htmlFor="newDoctorSpecialization">Specialization:</label>
              <input
                type="text"
                id="newDoctorSpecialization"
                value={newDoctorSpecialization}
                onChange={(e) => setNewDoctorSpecialization(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newDoctorLicenseNumber">License Number:</label>
              <input
                type="text"
                id="newDoctorLicenseNumber"
                value={newDoctorLicenseNumber}
                onChange={(e) => setNewDoctorLicenseNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newDoctorPhone">Phone Number:</label>
              <input
                type="text"
                id="newDoctorPhone"
                value={newDoctorPhone}
                onChange={(e) => setNewDoctorPhone(e.target.value)}
              />
            </div>
          </>
        );

      case 'pharmacist':
        return (
          <>
            <div className="form-group">
              <label htmlFor="newPharmacyName">Pharmacy Name:</label>
              <input
                type="text"
                id="newPharmacyName"
                value={newPharmacyName}
                onChange={(e) => setNewPharmacyName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPharmacyLicenseNumber">Pharmacy License Number:</label>
              <input
                type="text"
                id="newPharmacyLicenseNumber"
                value={newPharmacyLicenseNumber}
                onChange={(e) => setNewPharmacyLicenseNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPharmacistPhone">Phone Number:</label>
              <input
                type="text"
                id="newPharmacistPhone"
                value={newPharmacistPhone}
                onChange={(e) => setNewPharmacistPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPharmacistAddress">Address:</label>
              <input
                type="text"
                id="newPharmacistAddress"
                value={newPharmacistAddress}
                onChange={(e) => setNewPharmacistAddress(e.target.value)}
              />
            </div>
          </>
        );

      case 'nurse':
        return (
          <div className="form-group">
            <label htmlFor="newNurseEmployeeId">Employee ID:</label>
            <input
              type="text"
              id="newNurseEmployeeId"
              value={newNurseEmployeeId}
              onChange={(e) => setNewNurseEmployeeId(e.target.value)}
              required
            />
          </div>
        );

      case 'lab_technician':
        return (
          <div className="form-group">
            <label htmlFor="newLabTechEmployeeId">Employee ID:</label>
            <input
              type="text"
              id="newLabTechEmployeeId"
              value={newLabTechEmployeeId}
              onChange={(e) => setNewLabTechEmployeeId(e.target.value)}
              required
            />
          </div>
        );

      case 'administrator':
        return (
          <div className="form-group">
            <label htmlFor="newAdminInternalId">Internal Admin ID:</label>
            <input
              type="text"
              id="newAdminInternalId"
              value={newAdminInternalId}
              onChange={(e) => setNewAdminInternalId(e.target.value)}
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  // --- Handle Edit/Delete User (unchanged) ---
  const handleEditUser = (userId) => {
    alert(`Edit user functionality not implemented yet for user ID: ${userId}`);
    console.log('Attempted to edit user:', userId);
  };

  const handleDeleteUser = async (userId) => {
    // Confirmation prompt
    if (window.confirm(`Are you sure you want to delete user ID: ${userId}?`)) {
      try {
        const response = await axios.delete(`${SERVICE_URLS.admin}/users/${userId}/`);

        if (response.status === 200 || response.status === 204) {
          alert(`User ${userId} deleted successfully!`);
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


  // --- Early Return for Redirection (Same) ---
  if (!user || user.user_type !== 'administrator') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States ---
  if (loading) {
    return <div className="loading">Loading Administrator Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <h2>Error</h2>
        <p className="error-message">{error}</p>
        <button onClick={logout} className="danger">Logout</button>
      </div>
    );
  }

  // --- Render Data and Forms ---
  return (
    <div className="container admin-dashboard">
      <h2>Administrator Dashboard</h2>

      {/* Display Administrator Profile */}
      {adminProfile ? (
        <div className="profile-section">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {adminProfile.first_name} {adminProfile.last_name}</p>
          <p><strong>Username:</strong> {adminProfile.username}</p>
          <p><strong>Email:</strong> {adminProfile.email}</p>
          <p><strong>Internal Admin ID:</strong> {adminProfile.internal_admin_id || 'N/A'}</p>
          {adminProfile._identity_error && <p className="warning-message">Warning: Could not load all identity data: {adminProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Create New User Section */}
      <div className="create-user-section">
        <h3>Create New User</h3>
        {!isCreatingUser ? (
          <button onClick={handleStartCreateUser}>Create New User</button>
        ) : (
          <div className="create-user-form">
            <h4>Enter User Details</h4>
            <form onSubmit={handleSubmitCreateUser}>
              <div className="form-grid">
                {/* Basic user information fields */}
                <div className="form-group">
                  <label htmlFor="newUsername">Username:</label>
                  <input type="text" id="newUsername" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="newPassword">Password:</label>
                  <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="newEmail">Email (Optional):</label>
                  <input type="email" id="newEmail" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="newFirstName">First Name (Optional):</label>
                  <input type="text" id="newFirstName" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="newLastName">Last Name (Optional):</label>
                  <input type="text" id="newLastName" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label htmlFor="newUserType">User Type:</label>
                  <select id="newUserType" value={newUserType} onChange={(e) => setNewUserType(e.target.value)} required>
                    {USER_TYPES.map(type => (
                      <option key={type} value={type}>{type.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}</option>
                    ))}
                  </select>
                </div>

                {/* Render user type specific fields */}
                {renderUserTypeFields()}
              </div>

              {createUserError && <div className="form-error">{createUserError}</div>}
              {createUserSuccess && <div className="form-success">{createUserSuccess}</div>}
              {serviceProfileError && <div className="form-warning">{serviceProfileError}</div>}

              <div className="form-actions">
                <button type="submit" disabled={createUserLoading}>
                  {createUserLoading ? 'Creating...' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  disabled={createUserLoading}
                  className="danger"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <hr />

      {/* Display List of All Users */}
      <div className="users-section">
        <h3>All Users</h3>
        {allUsers.length > 0 ? (
          <ul className="users-list">
            {allUsers.map(userItem => (
              <li key={userItem.id} className="user-item">
                <div className="user-info">
                  <span className="user-name">{userItem.username}</span>
                  <span className="user-type">{userItem.user_type}</span>
                  <div className="user-details">
                    {userItem.first_name} {userItem.last_name} ({userItem.email})
                    <br />User ID: {userItem.id}
                  </div>
                </div>

                <div className="user-actions">
                  <button onClick={() => handleEditUser(userItem.id)} className="secondary">Edit</button>
                  <button onClick={() => handleDeleteUser(userItem.id)} className="delete-button">Delete</button>
                </div>

                {/* Display individual S2S errors if present */}
                {userItem._identity_error && <p className="warning-indicator">Warning: Could not load identity data: {userItem._identity_error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No users found.</p>
        )}
      </div>

      <hr />

      {/* Add other admin functionalities */}
      <div>
        <h3>Other Administrator Functions (To Be Implemented)</h3>
      </div>

      <hr />

      <button onClick={logout} className="danger">Logout</button>
    </div>
  );
};

export default AdminDashboard;