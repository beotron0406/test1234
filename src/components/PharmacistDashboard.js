// src/components/PharmacistDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  // Corrected the port for the pharmacist service to 8003
  pharmacist: 'http://localhost:8003/api', // <-- Corrected Pharmacist Service API base URL
  prescription: 'http://localhost:8008/api',
  // Add other services as needed for pharmacist views
};

const PharmacistDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [pharmacistProfile, setPharmacistProfile] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]); // List of prescriptions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error

  // State for fulfillment action
  const [fulfillingId, setFulfillingId] = useState(null); // Tracks which prescription is being fulfilled
  const [fulfillmentError, setFulfillmentError] = useState(null); // Error for fulfillment action
  const [fulfillmentSuccess, setFulfillmentSuccess] = useState(null); // Success message for fulfillment


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchPharmacistData = async () => {
      setLoading(true);
      setError(null);

      const pharmacistUserId = user.id;

      try {
        // 1. Fetch Pharmacist Profile (Identity + Pharmacist specific)
        // Call the Pharmacist Service detail endpoint, which aggregates Identity data
        // CORRECTED the endpoint URL string to /pharmacists/
        const profileResponse = await axios.get(`${SERVICE_URLS.pharmacist}/pharmacists/${pharmacistUserId}/`); // <-- CORRECTED CALL
        setPharmacistProfile(profileResponse.data);
        console.log('Fetched Pharmacist Profile:', profileResponse.data);


        // 2. Fetch Prescriptions
        // Call the Prescription Service list endpoint, filtered for active
        const prescriptionsResponse = await axios.get(`${SERVICE_URLS.prescription}/prescriptions/`, {
             params: { status: 'active' } // Filter for active prescriptions
        });
        // Sort prescriptions by date
        const sortedPrescriptions = prescriptionsResponse.data.sort((a, b) =>
            new Date(b.prescription_date) - new Date(a.prescription_date) // Newest first
        );
        setPrescriptions(sortedPrescriptions); // Update the state with fetched prescriptions
        console.log('Fetched Active Prescriptions:', sortedPrescriptions);


      } catch (err) {
        console.error('Error fetching pharmacist data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch pharmacist data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch pharmacist data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if the user object (with ID) is available AND the user type is pharmacist
    if (user && user.id && user.user_type === 'pharmacist') {
       console.log('Fetching data for pharmacist:', user.id);
       fetchPharmacistData();
    } else {
       console.log('User not available or not pharmacist. Skipping data fetch.');
       setLoading(false);
    }

  }, [user, navigate]);


   // --- Handle Fulfill Prescription Action (same) ---
   const handleFulfillPrescription = async (prescriptionId) => { /* ... */
       setFulfillingId(prescriptionId);
       setFulfillmentError(null);
       setFulfillmentSuccess(null);

       const pharmacistUserId = user.id;

       const fulfillmentPayload = {
           prescription_id: prescriptionId,
           pharmacist_user_id: pharmacistUserId,
       };

       try {
           // Call the Pharmacist Service endpoint to initiate fulfillment
           const response = await axios.post(`${SERVICE_URLS.pharmacist}/pharmacists/fulfill/`, fulfillmentPayload);

           if (response.status === 200) { // Pharmacist Service returns 200 on success
               setFulfillmentSuccess(`Prescription ${prescriptionId} fulfilled successfully!`);
               console.log('Prescription fulfilled:', response.data);

                // Refetch active prescriptions
                const prescriptionsResponse = await axios.get(`${SERVICE_URLS.prescription}/prescriptions/`, {
                    params: { status: 'active' }
                });
                const sortedPrescriptions = prescriptionsResponse.data.sort((a, b) =>
                    new Date(b.prescription_date) - new Date(a.prescription_date)
                );
               setPrescriptions(sortedPrescriptions);
               console.log('Refetched Active Prescriptions:', sortedPrescriptions);

           } else {
              setFulfillmentError('Failed to fulfill prescription: Unexpected response.');
           }

       } catch (err) {
            console.error('Fulfillment failed:', err);
            if (err.response) {
                 if (err.response.data && err.response.data.error) {
                     setFulfillmentError(`Fulfillment failed: ${err.response.data.error}`);
                 } else {
                     setFulfillmentError(`Fulfillment failed: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setFulfillmentError('Fulfillment failed: Could not connect to the pharmacist service.');
            } else {
                 setFulfillmentError('An unexpected error occurred during fulfillment.');
            }
       } finally {
           setFulfillingId(null);
       }
   };


  // --- Early Return for Redirection (Same) ---
  if (!user || user.user_type !== 'pharmacist') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Same) ---
  if (loading) {
    return <div>Loading Pharmacist Dashboard...</div>;
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

  // --- Render Data ---
  return (
    <div>
      <h2>Pharmacist Dashboard</h2>

      {/* Display Pharmacist Profile (Same) */}
      {pharmacistProfile ? ( /* ... profile display ... */
        <div>
          <h3>Your Profile</h3>
          <p>Name: {pharmacistProfile.first_name} {pharmacistProfile.last_name}</p>
          <p>Username: {pharmacistProfile.username}</p>
          <p>Email: {pharmacistProfile.email}</p>
          <p>Pharmacy Name: {pharmacistProfile.pharmacy_name || 'N/A'}</p>
          <p>Pharmacy License: {pharmacistProfile.pharmacy_license_number || 'N/A'}</p>
          {pharmacistProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {pharmacistProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Display Prescriptions (Filtered for Active by default in fetch) (Same) */}
      <h3>Active Prescriptions</h3>
       {fulfillmentError && <div style={{ color: 'red' }}>{fulfillmentError}</div>}
       {fulfillmentSuccess && <div style={{ color: 'green' }}>{fulfillmentSuccess}</div>}

      {prescriptions.length > 0 ? ( /* ... prescriptions list display ... */
        <ul>
          {prescriptions.map(prescription => (
            <li key={prescription.id}>
              <strong>{prescription.medication_name}</strong> {prescription.dosage} - {prescription.frequency} for {prescription.duration}<br />
              Prescribed on: {new Date(prescription.prescription_date).toLocaleDateString()} by Dr. {prescription.doctor ? `${prescription.doctor.first_name} ${prescription.doctor.last_name}` : (prescription._doctor_identity_error || 'N/A')}<br/>
              For Patient: {prescription.patient ? `${prescription.patient.first_name} ${prescription.patient.last_name}` : (prescription._patient_identity_error || 'N/A')}
              {prescription.notes && <p>Notes: {prescription.notes}</p>}
               {prescription.status !== 'active' && <p>Status: {prescription.status}</p>}
               {prescription.fulfilled_by_pharmacist && <p>Filled by: {prescription.fulfilled_by_pharmacist.first_name} {prescription.fulfilled_by_pharmacist.last_name} on {new Date(prescription.fulfilled_date).toLocaleDateString()}</p>}

               {/* Fulfill Button (Same) */}
               {prescription.status === 'active' && (
                   <button
                       onClick={() => handleFulfillPrescription(prescription.id)}
                       disabled={fulfillingId === prescription.id} // Disable button while fulfilling
                       style={{ marginLeft: '10px' }}
                   >
                       {fulfillingId === prescription.id ? 'Fulfilling...' : 'Fulfill'}
                   </button>
               )}

               {/* Display individual S2S errors if present (Same) */}
               {prescription._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {prescription._patient_identity_error}</p>}
               {prescription._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing: {prescription._doctor_identity_error}</p>}
               {prescription._pharmacist_identity_error && <p style={{color:'orange', margin:0}}>Warning: Pharmacist identity missing: {prescription._pharmacist_identity_error}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No active prescriptions found.</p>
      )}

      <hr />

      {/* Other Pharmacist Functions (Same) */}
       <h3>Other Pharmacist Functions (To Be Implemented)</h3>
       {/* ... */}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default PharmacistDashboard;