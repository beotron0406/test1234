// src/components/LabTechDashboard.js (with CSS applied)
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import '../css/index.css'; // Import CSS

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  lab: 'http://localhost:8006/api', // Lab Service API base URL
  patient: 'http://localhost:8001/api', // Patient Service API base URL (needed to list patients)
  // Identity service URL is called by the Lab Service endpoints for aggregation
};

// Common lab test parameters for different test types
const TEST_TEMPLATES = {
  'Complete Blood Count': [
    { name: 'Hemoglobin', defaultUnit: 'g/dL', defaultRange: '13.5-17.5' },
    { name: 'White Blood Cells', defaultUnit: 'x10^3/uL', defaultRange: '4.0-11.0' },
    { name: 'Platelets', defaultUnit: 'x10^3/uL', defaultRange: '150-400' },
    { name: 'Red Blood Cells', defaultUnit: 'x10^6/uL', defaultRange: '4.5-5.9' },
    { name: 'Hematocrit', defaultUnit: '%', defaultRange: '41-50' }
  ],
  'Lipid Panel': [
    { name: 'Total Cholesterol', defaultUnit: 'mg/dL', defaultRange: '<200' },
    { name: 'LDL Cholesterol', defaultUnit: 'mg/dL', defaultRange: '<100' },
    { name: 'HDL Cholesterol', defaultUnit: 'mg/dL', defaultRange: '>40' },
    { name: 'Triglycerides', defaultUnit: 'mg/dL', defaultRange: '<150' }
  ],
  'Basic Metabolic Panel': [
    { name: 'Glucose', defaultUnit: 'mg/dL', defaultRange: '70-99' },
    { name: 'Calcium', defaultUnit: 'mg/dL', defaultRange: '8.5-10.5' },
    { name: 'Sodium', defaultUnit: 'mmol/L', defaultRange: '135-145' },
    { name: 'Potassium', defaultUnit: 'mmol/L', defaultRange: '3.5-5.0' },
    { name: 'CO2', defaultUnit: 'mmol/L', defaultRange: '23-29' },
    { name: 'Chloride', defaultUnit: 'mmol/L', defaultRange: '96-106' },
    { name: 'BUN', defaultUnit: 'mg/dL', defaultRange: '7-20' },
    { name: 'Creatinine', defaultUnit: 'mg/dL', defaultRange: '0.6-1.2' }
  ],
  'Liver Function Tests': [
    { name: 'ALT', defaultUnit: 'U/L', defaultRange: '7-56' },
    { name: 'AST', defaultUnit: 'U/L', defaultRange: '5-40' },
    { name: 'ALP', defaultUnit: 'U/L', defaultRange: '44-147' },
    { name: 'Total Bilirubin', defaultUnit: 'mg/dL', defaultRange: '0.1-1.2' },
    { name: 'Albumin', defaultUnit: 'g/dL', defaultRange: '3.4-5.4' }
  ]
};

// --- Helper function to format lab result data for display ---
const formatLabResultData = (resultData, testType = 'Unknown Test Type') => {
    if (!resultData || typeof resultData !== 'object') {
        // Fallback for non-object data or null/undefined
        return (
            <div className="result-data">
                <p><strong>Result Data (Raw):</strong></p>
                <pre>
                     {JSON.stringify(resultData, null, 2)}
                </pre>
            </div>
        );
    }

    // Hardcoded formatting for specific test types based on structure or testType string
    if (testType.toLowerCase().includes('blood count') || (resultData.Hemoglobin && resultData.Platelets && resultData['White Blood Cells'])) {
        return (
            <div className="result-data">
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

    // Fallback: Display as formatted JSON if no specific type is matched
    return (
        <div className="result-data">
            <p><strong>Result Data (Generic):</strong></p>
            <ul>
                {Object.entries(resultData).map(([key, value]) => (
                    <li key={key}>
                        <strong>{key}:</strong> {value.value !== undefined ? `${value.value} ${value.unit || ''}` : JSON.stringify(value)} {value.reference_range ? `(Ref: ${value.reference_range})` : ''}
                    </li>
                ))}
            </ul>
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
  const [resultStatus, setResultStatus] = useState('final'); // Status for the result (default 'final')
  const [resultNotes, setResultNotes] = useState('');
  const [recordingLoading, setRecordingLoading] = useState(false); // Loading state for recording action
  const [recordingError, setRecordingError] = useState(null); // Error state for recording action
  const [recordingSuccess, setRecordingSuccess] = useState(null); // Success message for recording
  
  // New state for structured test parameters (replacing the resultData JSON string)
  const [testParameters, setTestParameters] = useState([]); 
  const [customParamName, setCustomParamName] = useState('');
  const [selectedTestType, setSelectedTestType] = useState('');

  // --- Data Fetching using useEffect (unchanged) ---
  useEffect(() => {
    const fetchLabTechData = async () => {
      setLoading(true);
      setError(null);

      const labTechUserId = user.id; // Get the logged-in lab tech's UUID

      try {
        // 1. Fetch Lab Technician Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.lab}/labtechs/${labTechUserId}/`);
        setLabTechProfile(profileResponse.data);
        console.log('Fetched Lab Technician Profile:', profileResponse.data);

        // 2. Fetch Pending Lab Orders
        const ordersResponse = await axios.get(`${SERVICE_URLS.lab}/orders/`, {
          params: { status: 'ordered' } // Fetch orders with 'ordered' status
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

  // Handle applying a test template
  const applyTestTemplate = (templateName) => {
    if (TEST_TEMPLATES[templateName]) {
      // Map template parameters to state format with empty values
      const newParams = TEST_TEMPLATES[templateName].map(param => ({
        name: param.name,
        value: '',
        unit: param.defaultUnit,
        reference_range: param.defaultRange
      }));
      setTestParameters(newParams);
      setSelectedTestType(templateName);
    }
  };

  // Get test type from selected order
  const getTestTypeFromOrder = (orderId) => {
    const order = pendingOrders.find(o => o.id === orderId);
    return order ? order.test_type : '';
  };

  // Handle parameter value changes
  const handleParameterChange = (index, field, value) => {
    const updatedParams = [...testParameters];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setTestParameters(updatedParams);
  };

  // Add a custom parameter
  const handleAddCustomParameter = () => {
    if (customParamName.trim()) {
      setTestParameters([
        ...testParameters,
        { name: customParamName.trim(), value: '', unit: '', reference_range: '' }
      ]);
      setCustomParamName('');
    }
  };

  // Remove a parameter
  const handleRemoveParameter = (index) => {
    const updatedParams = [...testParameters];
    updatedParams.splice(index, 1);
    setTestParameters(updatedParams);
  };

  // --- Handle Starting Record Result (modified) ---
  const handleStartRecordResult = (orderId = '') => { // Optional orderId to pre-select
      setSelectedOrderId(orderId); // Pre-select the order
      setResultDate(new Date().toISOString().slice(0, 16)); // Default to current time for datetime-local
      setResultStatus('final'); // Default status
      setResultNotes(''); // Clear notes
      setTestParameters([]); // Clear parameters
      setCustomParamName('');
      setRecordingError(null);
      setRecordingSuccess(null);
      setIsRecordingResult(true); // Show the form

      // If an orderId was provided, find the order details to potentially display patient name
      // This requires having the pendingOrders list loaded
      if (orderId) {
        const order = pendingOrders.find(o => o.id === orderId);
        if (order) {
          console.log('Recording result for order:', order);
          // Set the test type from the order and apply template if available
          const testType = order.test_type;
          setSelectedTestType(testType);
          
          // If we have a template for this test type, apply it
          if (TEST_TEMPLATES[testType]) {
            applyTestTemplate(testType);
          }
        }
      }
  };

  // --- Handle Submit Result (modified) ---
  const handleSubmitResult = async (e) => {
    e.preventDefault();

    setRecordingLoading(true);
    setRecordingError(null);
    setRecordingSuccess(null);

    const labTechUserId = user.id; // The logged-in lab tech's ID

    // Basic validation
    if (!selectedOrderId || !resultDate || testParameters.length === 0) {
      setRecordingError('Please select an order, specify a result date, and add at least one test parameter.');
      setRecordingLoading(false);
      return;
    }

    // Check if all parameters have values
    const missingValues = testParameters.some(param => !param.value);
    if (missingValues) {
      setRecordingError('Please enter values for all test parameters.');
      setRecordingLoading(false);
      return;
    }

    // Convert the structured test parameters to the required result_data JSON format
    const resultData = {};
    testParameters.forEach(param => {
      resultData[param.name] = {
        value: isNaN(parseFloat(param.value)) ? param.value : parseFloat(param.value),
        unit: param.unit,
        reference_range: param.reference_range
      };
    });

    // Prepare result date for backend (ISO 8601 expected)
    let resultDateToSend = resultDate;
    if (resultDateToSend.length === 16) { // If HH:MM format
      resultDateToSend += ':00Z'; // Add seconds and assume UTC
    }

    const resultPayload = {
      lab_order_id: selectedOrderId,
      lab_technician_user_id: labTechUserId,
      result_date: resultDateToSend,
      result_data: resultData, // Send structured data object
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
        setResultDate(''); 
        setTestParameters([]);
        setResultStatus('final'); 
        setResultNotes('');
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
    return <div className="loading">Loading Lab Technician Dashboard...</div>;
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
    <div className="container lab-tech-dashboard">
      <h2>Lab Technician Dashboard</h2>

      {/* Display Lab Technician Profile */}
      {labTechProfile ? (
        <div className="profile-section">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {labTechProfile.first_name} {labTechProfile.last_name}</p>
          <p><strong>Username:</strong> {labTechProfile.username}</p>
          <p><strong>Employee ID:</strong> {labTechProfile.employee_id || 'N/A'}</p>
          {/* Show _identity_error if Identity call failed during aggregation */}
          {labTechProfile._identity_error && <p className="warning-message">Warning: Could not load all identity data: {labTechProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

       {/* Record Lab Result Section */}
        <div className="record-result-section">
          <h3>Record Lab Result</h3>
          {!isRecordingResult ? (
              <button onClick={() => handleStartRecordResult()}>Record New Result</button>
          ) : (
              <div className="record-form">
                  <h4>Enter Lab Result Details {selectedOrderId && ` for Order ${selectedOrderId.slice(0, 8)}...`}</h4>
                  <form onSubmit={handleSubmitResult}>
                      <div className="form-group">
                          <label htmlFor="order">Select Order:</label>
                          {/* Provide a way to *select* the order, even if pre-selected */}
                          <select 
                            id="order" 
                            value={selectedOrderId} 
                            onChange={(e) => {
                              const orderId = e.target.value;
                              setSelectedOrderId(orderId);
                              
                              // If we changed orders, get the test type from the new order
                              if (orderId) {
                                const testType = getTestTypeFromOrder(orderId);
                                setSelectedTestType(testType);
                                
                                // If we have a template for this test type, apply it
                                if (TEST_TEMPLATES[testType]) {
                                  applyTestTemplate(testType);
                                } else {
                                  // Clear parameters if we don't have a template
                                  setTestParameters([]);
                                }
                              }
                            }} 
                            required 
                            disabled={pendingOrders.length === 0 && selectedOrderId === ''}
                          >
                              <option value="">-- Select a Pending Order --</option>
                              {pendingOrders.map(order => (
                                  <option key={order.id} value={order.id}>
                                      Order {order.id.slice(0, 8)}...: {order.test_type} for Patient {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : (order._patient_identity_error || 'N/A')} (Ordered by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')})
                                  </option>
                              ))}
                          </select>
                          {/* Display loading/error state for orders fetch near the select */}
                          { !loading && pendingOrders.length === 0 && selectedOrderId === '' && !recordingError?.includes('orders list') && <p>No pending orders found.</p>}
                           {recordingError && recordingError.includes('orders list') && <p className="form-error">{recordingError}</p>}
                      </div>
                       {selectedOrderId && ( // Only show result inputs if an order is selected
                           <>
                               <div className="form-group">
                                   <label htmlFor="resultDate">Result Date/Time:</label>
                                   <input
                                       type="datetime-local"
                                       id="resultDate"
                                       value={resultDate}
                                       onChange={(e) => setResultDate(e.target.value)}
                                       required
                                   />
                               </div>

                               {/* New Test Template Selection */}
                               <div className="form-group">
                                   <label>Test Template:</label>
                                   <div className="template-buttons">
                                     {Object.keys(TEST_TEMPLATES).map(template => (
                                       <button 
                                         key={template}
                                         type="button" 
                                         className={`template-button ${selectedTestType === template ? 'active' : ''}`}
                                         onClick={() => applyTestTemplate(template)}
                                       >
                                         {template}
                                       </button>
                                     ))}
                                   </div>
                               </div>

                               {/* Test Parameters Section */}
                               <div className="test-parameters">
                                   <h5>Test Parameters</h5>
                                   
                                   {testParameters.length === 0 ? (
                                     <p>No parameters added yet. Select a test template or add custom parameters below.</p>
                                   ) : (
                                     <div className="parameters-table">
                                       <table>
                                         <thead>
                                           <tr>
                                             <th>Parameter</th>
                                             <th>Value</th>
                                             <th>Unit</th>
                                             <th>Reference Range</th>
                                             <th>Actions</th>
                                           </tr>
                                         </thead>
                                         <tbody>
                                           {testParameters.map((param, index) => (
                                             <tr key={index}>
                                               <td>{param.name}</td>
                                               <td>
                                                 <input
                                                   type="text"
                                                   value={param.value}
                                                   onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                                                   required
                                                 />
                                               </td>
                                               <td>
                                                 <input
                                                   type="text"
                                                   value={param.unit}
                                                   onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                                                 />
                                               </td>
                                               <td>
                                                 <input
                                                   type="text"
                                                   value={param.reference_range}
                                                   onChange={(e) => handleParameterChange(index, 'reference_range', e.target.value)}
                                                 />
                                               </td>
                                               <td>
                                                 <button 
                                                   type="button" 
                                                   className="remove-button"
                                                   onClick={() => handleRemoveParameter(index)}
                                                 >
                                                   Remove
                                                 </button>
                                               </td>
                                             </tr>
                                           ))}
                                         </tbody>
                                       </table>
                                     </div>
                                   )}

                                   {/* Add Custom Parameter Section */}
                                   <div className="add-custom-parameter">
                                     <h6>Add Custom Parameter</h6>
                                     <div className="custom-parameter-form">
                                       <input
                                         type="text"
                                         placeholder="Parameter Name"
                                         value={customParamName}
                                         onChange={(e) => setCustomParamName(e.target.value)}
                                       />
                                       <button 
                                         type="button"
                                         onClick={handleAddCustomParameter}
                                         disabled={!customParamName.trim()}
                                       >
                                         Add Parameter
                                       </button>
                                     </div>
                                   </div>
                               </div>

                               <div className="form-group">
                                   <label htmlFor="resultStatus">Status:</label>
                                    <select id="resultStatus" value={resultStatus} onChange={(e) => setResultStatus(e.target.value)}>
                                         <option value="final">Final</option>
                                         <option value="preliminary">Preliminary</option>
                                         <option value="corrected">Corrected</option>
                                    </select>
                               </div>
                                <div className="form-group">
                                   <label htmlFor="resultNotes">Notes (Optional):</label>
                                   <textarea id="resultNotes" value={resultNotes} onChange={(e) => setResultNotes(e.target.value)} rows={3}></textarea>
                               </div>

                               {recordingError && <div className="form-error">{recordingError}</div>}
                               {recordingSuccess && <div className="form-success">{recordingSuccess}</div>}

                               <div className="form-actions">
                                 <button type="submit" disabled={recordingLoading || testParameters.length === 0}>
                                     {recordingLoading ? 'Saving...' : 'Save Result'}
                                 </button>
                                 <button 
                                   type="button" 
                                   onClick={() => setIsRecordingResult(false)} 
                                   disabled={recordingLoading}
                                   className="danger"
                                 >
                                     Cancel
                                 </button>
                               </div>
                           </>
                       )}
                  </form>
              </div>
          )}
        </div>

      <hr />

      {/* Display Pending Lab Orders */}
      <div className="pending-orders-section">
        <h3>Pending Lab Orders</h3>
        {pendingOrders.length > 0 ? (
          <ul className="orders-list">
            {pendingOrders.map(order => (
              <li key={order.id} className="order-item">
                <div className="order-header">
                  <strong>{order.test_type}</strong> for Patient {order.patient ? `${order.patient.first_name} ${order.patient.last_name}` : (order._patient_identity_error || 'N/A')} ({order.status})
                </div>
                <p>Ordered on: {new Date(order.order_date).toLocaleDateString()} by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')}</p>
                {order.notes && <p className="order-notes">Doctor's Notes: {order.notes}</p>}
                
                {/* Button to record result for this order */}
                <div className="order-actions">
                  <button 
                    onClick={() => handleStartRecordResult(order.id)} 
                    className="secondary"
                  >
                    Record Result
                  </button>
                </div>

                {/* Display individual S2S errors if present */}
                {order._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing: {order._patient_identity_error}</p>}
                {order._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing: {order._doctor_identity_error}</p>}
                {order._order_error && <p className="error-indicator">Error loading order details: {order._order_error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No pending lab orders found.</p>
        )}
      </div>

      <hr />

      {/* Display Results You Recorded */}
      <div className="recorded-results-section">
        <h3>Results You Recorded</h3>
        {recordedResults.length > 0 ? (
          <ul className="results-list">
            {recordedResults.map(result => (
              <li key={result.id} className="result-item">
                <div className="result-header">
                  Result for Order: <strong>{result.order ? result.order.test_type : 'Unknown Test Type'}</strong> ({result.status}) on {new Date(result.result_date).toLocaleString()}
                </div>
                <p>Recorded by Lab Tech {result.lab_technician ? `${result.lab_technician.first_name} ${result.lab_technician.last_name}` : (result._lab_technician_identity_error || 'N/A')}</p>

                {/* Use the helper function to format result_data */}
                {formatLabResultData(result.result_data, result.order?.test_type)}

                {result.notes && <p className="result-notes">Notes: {result.notes}</p>}

                {/* Display individual S2S or Order fetch errors */}
                {result._order_error && <p className="error-indicator">Error loading associated order: {result._order_error}</p>}
                {result.order && result.order._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing for this order: {result.order._patient_identity_error}</p>}
                {result.order && result.order._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing for this order: {result.order._doctor_identity_error}</p>}
                {result._lab_technician_identity_error && <p className="warning-indicator">Warning: Lab Tech identity missing: {result._lab_technician_identity_error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No results recorded yet.</p>
        )}
      </div>

      <hr />

      {/* Add other lab tech functionalities */}
      {/* <div>
        <h3>Other Lab Technician Functions (To Be Implemented)</h3>
      </div> */}

      <hr />

      <button onClick={logout} className="danger">Logout</button>
    </div>
  );
};

export default LabTechDashboard;