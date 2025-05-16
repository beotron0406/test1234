// src/components/LabTechDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible, e.g., a config file
// For simplicity now, hardcode them. In a real app, use environment variables.
const SERVICE_URLS = {
  lab: 'http://localhost:8006/api', // Lab Service API base URL
  patient: 'http://localhost:8001/api', // Patient Service API base URL (needed to list patients)
  // Identity service URL is called by the Lab Service endpoints for aggregation
};

// --- Helper function to format lab result data for display ---
const formatLabResultData = (resultData, testType = 'Unknown Test Type') => {
    if (!resultData || typeof resultData !== 'object') {
        // Fallback for non-object data or null/undefined
        return (
            <div>
                <p><strong>Result Data (Raw):</strong></p>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                     {JSON.stringify(resultData, null, 2)}
                </pre>
            </div>
        );
    }

    // Hardcoded formatting for specific test types based on structure or testType string
    // You would expand this logic for other tests
    if (testType.toLowerCase().includes('blood count') || (resultData.Hemoglobin && resultData.Platelets && resultData['White Blood Cells'])) {
        return (
            <div>
                <p><strong>CBC Results:</strong></p>
                <ul>
                    {Object.entries(resultData).map(([key, value]) => (
                        <li key={key}>
                            {key}: {value.value !== undefined ? value.value : 'N/A'} {value.unit || ''} {value.reference_range ? `(Ref: ${value.reference_range})` : ''}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

     // Add more specific formatting logic for other common test types here
     // e.g., if (testType.toLowerCase().includes('urinalysis') && resultData.Color && resultData.Turbidity) { return <UrinalysisFormat data={resultData} />; }
     // e.g., if (testType.toLowerCase().includes('chemistry') && resultData.Glucose) { return <BloodChemistryFormat data={resultData} />; }


    // Fallback: Display as formatted JSON if no specific type is matched
    return (
        <div>
            <p><strong>Result Data (Generic):</strong></p>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(resultData, null, 2)} {/* Pretty print JSON */}
            </pre>
        </div>
    );
};


const LabTechDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [labTechProfile, setLabTechProfile] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]); // Lab Orders needing results
  const [recordedResults, setRecordedResults] = useState([]); // Results recorded by this lab tech
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error

  // State for recording result functionality
  const [isRecordingResult, setIsRecordingResult] = useState(false); // Controls form visibility
  const [selectedOrderId, setSelectedOrderId] = useState(''); // Selected Lab Order ID
  const [resultDate, setResultDate] = useState(''); // Result date input (ISO 8601 string)
  const [resultData, setResultData] = useState(''); // Result data input (JSON string)
  const [resultStatus, setResultStatus] = useState('final'); // Status for the result (default 'final')
  const [resultNotes, setResultNotes] = useState('');
  const [recordingLoading, setRecordingLoading] = useState(false); // Loading state for recording action
  const [recordingError, setRecordingError] = useState(null); // Error state for recording action
  const [recordingSuccess, setRecordingSuccess] = useState(null); // Success message for recording


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchLabTechData = async () => {
      setLoading(true);
      setError(null);

      const labTechUserId = user.id; // Get the logged-in lab tech's UUID

      try {
        // 1. Fetch Lab Technician Profile (Identity + Lab Tech specific)
        const profileResponse = await axios.get(`${SERVICE_URLS.lab}/labtechs/${labTechUserId}/`);
        setLabTechProfile(profileResponse.data);
        console.log('Fetched Lab Technician Profile:', profileResponse.data);


        // 2. Fetch Pending Lab Orders (e.g., status 'ordered' or 'sample_collected')
        const ordersResponse = await axios.get(`${SERVICE_URLS.lab}/orders/`, {
          params: { status: 'ordered' } // Fetch orders with 'ordered' status
          // You might also fetch 'sample_collected' or filter by date etc.
        });
        // Order orders by date
        const sortedOrders = ordersResponse.data.sort((a, b) =>
             new Date(a.order_date) - new Date(b.order_date) // Oldest first
         );
        setPendingOrders(sortedOrders);
        console.log('Fetched Pending Lab Orders:', sortedOrders);


        // 3. Fetch Lab Results Recorded by This Lab Technician
        const resultsResponse = await axios.get(`${SERVICE_URLS.lab}/results/`, {
          params: { lab_technician_user_id: labTechUserId } // Send lab_technician_user_id as a query parameter
        });
        // Results are already ordered by date descending in the backend
        setRecordedResults(resultsResponse.data);
        console.log('Fetched Lab Results recorded by tech:', resultsResponse.data);


      } catch (err) {
        console.error('Error fetching lab technician data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch lab technician data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch lab technician data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if the user object (with ID) is available AND the user type is lab_technician
    if (user && user.id && user.user_type === 'lab_technician') {
       console.log('Fetching data for lab technician:', user.id);
       fetchLabTechData();
    } else {
       console.log('User not available or not lab technician. Skipping data fetch.');
       setLoading(false);
    }

  }, [user, navigate]); // Include navigate in dependency array


  // --- Fetch Patients for Recording Vitals Form ---
  // NOTE: This effect is present in the Nurse Dashboard. It is not needed here
  // because the Lab Technician dashboard doesn't record Vitals, it records Results.
  // The Patient list is indirectly available through the pending orders which
  // include patient identity data aggregated by the Lab Service.
  /*
  useEffect(() => {
      // Only fetch patients when the recording form is activated and we haven't fetched them yet
      if (isRecordingResult && patients.length === 0) { // Corrected state check
          const fetchPatients = async () => {
              // ... fetch patients logic ... (Calls Patient Service)
          };
          fetchPatients();
      }
  }, [isRecordingResult, patients.length]); // Corrected dependency array
  */


  // --- Handle Starting Record Result ---
  const handleStartRecordResult = (orderId = '') => { // Optional orderId to pre-select
      setSelectedOrderId(orderId); // Pre-select the order
      setResultDate(new Date().toISOString().slice(0, 16)); // Default to current time for datetime-local
      setResultData(''); // Clear JSON string input
      setResultStatus('final'); // Default status
      setResultNotes(''); // Clear notes
      setRecordingError(null);
      setRecordingSuccess(null);
      setIsRecordingResult(true); // Show the form

      // If an orderId was provided, find the order details to potentially display patient name
      // This requires having the pendingOrders list loaded
       if (orderId) {
            const order = pendingOrders.find(o => o.id === orderId);
             if (order) {
                 console.log('Recording result for order:', order);
                 // You could potentially display the patient's name or test type here if needed
             }
       }
  };

  // --- Handle Submit Result ---
   const handleSubmitResult = async (e) => {
       e.preventDefault();

       setRecordingLoading(true);
       setRecordingError(null);
       setRecordingSuccess(null);

       const labTechUserId = user.id; // The logged-in lab tech's ID

       // Basic validation
       if (!selectedOrderId || !resultDate || !resultData) { // resultData must be provided
           setRecordingError('Please select an order, specify a result date, and enter result data.');
           setRecordingLoading(false);
           return;
       }

        // Attempt to parse resultData as JSON
       let parsedResultData = null;
       try {
            parsedResultData = JSON.parse(resultData);
       } catch (err) {
            setRecordingError('Invalid JSON format for result data.');
            setRecordingLoading(false);
            return;
       }

       // Prepare result date for backend (ISO 8601 expected)
       let resultDateToSend = resultDate;
        if (resultDateToSend.length === 16) { // If HH:MM format
             resultDateToSend += ':00Z'; // Add seconds and assume UTC
        }


       const resultPayload = {
           lab_order_id: selectedOrderId,
           lab_technician_user_id: labTechUserId,
           result_date: resultDateToSend,
           result_data: parsedResultData, // Send parsed JSON object/array
           status: resultStatus,
           notes: resultNotes || null,
       };

       try {
           // Call the Lab Service POST /api/results/ endpoint
           const response = await axios.post(`${SERVICE_URLS.lab}/results/`, resultPayload);

           if (response.status === 201) {
               setRecordingSuccess('Lab result recorded successfully!');
               console.log('Result created:', response.data);

               // Optional: Refetch pending orders (the completed one should disappear)
                const ordersResponse = await axios.get(`${SERVICE_URLS.lab}/orders/`, {
                  params: { status: 'ordered' } // Refetch *only* ordered status
                });
                 const sortedOrders = ordersResponse.data.sort((a, b) =>
                     new Date(a.order_date) - new Date(b.order_date)
                 );
               setPendingOrders(sortedOrders); // Update pending orders list
               console.log('Refetched Pending Orders:', sortedOrders);

               // Optional: Refetch recorded results (the new one should appear)
                const resultsResponse = await axios.get(`${SERVICE_URLS.lab}/results/`, {
                  params: { lab_technician_user_id: labTechUserId }
                });
                setRecordedResults(resultsResponse.data); // Update recorded results list
                console.log('Refetched Lab Results recorded by tech:', resultsResponse.data);


               // Reset form state and close form
               setSelectedOrderId('');
               setResultDate(''); setResultData(''); setResultStatus('final'); setResultNotes('');
               setIsRecordingResult(false);

           } else {
              setRecordingError('Failed to record result: Unexpected response.');
           }

       } catch (err) {
            console.error('Recording result failed:', err);
            if (err.response) {
                 if (err.response.data && err.response.data.error) {
                     setRecordingError(`Failed to record result: ${err.response.data.error}`);
                 } else {
                     setRecordingError(`Failed to record result: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setRecordingError('Failed to record result: Could not connect to the lab service.');
            } else {
                 setRecordingError('An unexpected error occurred while recording the result.');
            }
       } finally {
           setRecordingLoading(false);
       }
   };


  // --- Early Return for Redirection (Same) ---
  if (!user || user.user_type !== 'lab_technician') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Same) ---
  if (loading) {
    return <div>Loading Lab Technician Dashboard...</div>;
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
      <h2>Lab Technician Dashboard</h2>

      {/* Display Lab Technician Profile */}
      {labTechProfile ? (
        <div>
          <h3>Your Profile</h3>
          <p>Name: {labTechProfile.first_name} {labTechProfile.last_name}</p>
          <p>Username: {labTechProfile.username}</p>
          <p>Employee ID: {labTechProfile.employee_id || 'N/A'}</p>
          {/* Show _identity_error if Identity call failed during aggregation */}
          {labTechProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {labTechProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

       {/* Record Lab Result Section */}
        <h3>Record Lab Result</h3>
        {!isRecordingResult ? (
             <button onClick={() => handleStartRecordResult()}>Record New Result</button>
        ) : (
            <div>
                <h4>Enter Lab Result Details {selectedOrderId && ` for Order ${selectedOrderId.slice(0, 8)}...`}</h4> {/* Display selected order ID */}
                <form onSubmit={handleSubmitResult}>
                    <div>
                        <label htmlFor="order">Select Order:</label>
                        {/* Provide a way to *select* the order, even if pre-selected */}
                        <select id="order" value={selectedOrderId} onChange={(e) => setSelectedOrderId(e.target.value)} required disabled={pendingOrders.length === 0 && selectedOrderId === ''}>
                            <option value="">-- Select a Pending Order --</option>
                            {pendingOrders.map(order => (
                                <option key={order.id} value={order.id}>
                                    Order {order.id.slice(0, 8)}...: {order.test_type} for Patient {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : (order._patient_identity_error || 'N/A')} (Ordered by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')})
                                </option>
                            ))}
                        </select>
                        {/* Display loading/error state for orders fetch near the select */}
                        { !loading && pendingOrders.length === 0 && selectedOrderId === '' && !recordingError?.includes('orders list') && <p>No pending orders found.</p>}
                         {recordingError && recordingError.includes('orders list') && <p style={{color:'red'}}>{recordingError}</p>}
                    </div>
                     {selectedOrderId && ( // Only show result inputs if an order is selected
                         <>
                             <div>
                                 <label htmlFor="resultDate">Result Date/Time:</label>
                                 <input
                                     type="datetime-local"
                                     id="resultDate"
                                     value={resultDate}
                                     onChange={(e) => setResultDate(e.target.value)}
                                     required
                                 />
                             </div>
                             <div>
                                 <label htmlFor="resultData">Result Data (JSON):</label>
                                 <textarea
                                     id="resultData"
                                     value={resultData}
                                     onChange={(e) => setResultData(e.target.value)}
                                     required
                                     rows={10}
                                     style={{ width: '80%' }}
                                     placeholder='Enter result data as JSON, e.g., {"param1": "value", "param2": 123.45}'
                                 ></textarea>
                             </div>
                             <div>
                                 <label htmlFor="resultStatus">Status:</label>
                                  <select id="resultStatus" value={resultStatus} onChange={(e) => setResultStatus(e.target.value)}>
                                       <option value="final">Final</option>
                                       <option value="preliminary">Preliminary</option>
                                       <option value="corrected">Corrected</option>
                                  </select>
                             </div>
                              <div>
                                 <label htmlFor="resultNotes">Notes (Optional):</label>
                                 <textarea id="resultNotes" value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} rows={3} style={{ width: '80%' }}></textarea>
                             </div>

                             {recordingError && <div style={{ color: 'red' }}>{recordingError}</div>}
                             {recordingSuccess && <div style={{ color: 'green' }}>{recordingSuccess}</div>}

                             <button type="submit" disabled={recordingLoading}>
                                 {recordingLoading ? 'Saving...' : 'Save Result'}
                             </button>
                             <button type="button" onClick={() => setIsRecordingResult(false)} disabled={recordingLoading}>
                                 Cancel
                             </button>
                         </>
                     )}
                </form>
            </div>
        )}


      <hr />

      {/* Display Pending Lab Orders */}
      <h3>Pending Lab Orders</h3>
      {pendingOrders.length > 0 ? (
        <ul>
          {pendingOrders.map(order => (
            <li key={order.id}>
              <strong>{order.test_type}</strong> for Patient {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : (order._patient_identity_error || 'N/A')} ({order.status})<br />
              Ordered on: {new Date(order.order_date).toLocaleDateString()} by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')}
              {order.notes && <p>Doctor's Notes: {order.notes}</p>}
              {/* Button to record result for this order - pre-selects the order in the form */}
               <button onClick={() => handleStartRecordResult(order.id)} style={{ marginLeft: '10px' }}>Record Result</button>

              {/* Display individual S2S errors if present */}
              {order._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {order._patient_identity_error}</p>}
              {order._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing: {order._doctor_identity_error}</p>}
              {order._order_error && <p style={{color:'red', margin:0}}>Error loading order details: {order._order_error}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No pending lab orders found.</p>
      )}

      <hr />

      {/* Display Results You Recorded (MODIFIED DISPLAY) */}
      <h3>Results You Recorded</h3>
      {recordedResults.length > 0 ? (
        <ul>
          {recordedResults.map(result => (
            <li key={result.id}>
               {/* Display aggregated data */}
              Result for Order: <strong>{result.order ? result.order.test_type : 'Unknown Test Type'}</strong> ({result.status}) on {new Date(result.result_date).toLocaleString()}<br/> {/* Used toLocaleString for time as well */}
               Recorded by Lab Tech {result.lab_technician ? `${result.lab_technician.first_name} ${result.lab_technician.last_name}` : (result._lab_technician_identity_error || 'N/A')}<br/>

               {/* Use the helper function to format result_data */}
               {formatLabResultData(result.result_data, result.order?.test_type)} {/* Pass test type for specific formatting */}

               {result.notes && <p>Notes: {result.notes}</p>}

               {/* Nested Order details (Optional, can remove if formatLabResultData is comprehensive) */}
               {/* Leaving for now for completeness, but might be redundant */}
               {/*
               {result.order && (
                   <div>
                       Order Date: {new Date(result.order.order_date).toLocaleDateString()}<br/>
                       Ordered by Dr. {result.order.doctor ? `${result.order.doctor.first_name} ${result.order.doctor.last_name}` : (result.order._doctor_identity_error || 'N/A')}
                   </div>
               )}
               */}
               {/* Display individual S2S or Order fetch errors */}
                {result._order_error && <p style={{color:'red', margin:0}}>Error loading associated order: {result._order_error}</p>}
                {result.order && result.order._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing for this order: {result.order._patient_identity_error}</p>}
                {result.order && result.order._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing for this order: {result.order._doctor_identity_error}</p>}
                {result._lab_technician_identity_error && <p style={{color:'orange', margin:0}}>Warning: Lab Tech identity missing: {result._lab_technician_identity_error}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No results recorded yet.</p>
      )}


      <hr />

      {/* Add other lab tech functionalities */}
       <h3>Other Lab Technician Functions (To Be Implemented)</h3>
       {/* Example: */}
       {/* <button>Manage Test Catalog</button> */}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default LabTechDashboard;