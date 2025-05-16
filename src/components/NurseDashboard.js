// src/components/NurseDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  nurse: 'http://localhost:8005/api', // Nurse Service API base URL
  patient: 'http://localhost:8001/api', // Patient Service API base URL (needed to list patients)
  // Add other services if needed for nurse views (e.g., Medical Records to view history)
};

const NurseDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [nurseProfile, setNurseProfile] = useState(null);
  const [recordedVitals, setRecordedVitals] = useState([]); // Vitals recorded by this nurse
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error

  // State for recording vitals functionality
  const [isRecordingVitals, setIsRecordingVitals] = useState(false); // Controls form visibility
  const [patients, setPatients] = useState([]); // List of patients fetched for selection
  const [selectedPatientId, setSelectedPatientId] = useState(''); // Selected Patient's User ID
  const [vitalsTimestamp, setVitalsTimestamp] = useState(''); // Timestamp input (ISO 8601 string)
  const [temperature, setTemperature] = useState('');
  const [systolicBP, setSystolicBP] = useState('');
  const [diastolicBP, setDiastolicBP] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [vitalsNotes, setVitalsNotes] = useState('');
  const [recordingLoading, setRecordingLoading] = useState(false); // Loading state for recording action
  const [recordingError, setRecordingError] = useState(null); // Error state for recording action
  const [recordingSuccess, setRecordingSuccess] = useState(null); // Success message for recording


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchNurseData = async () => {
      setLoading(true);
      setError(null);

      const nurseUserId = user.id; // Get the logged-in nurse's UUID

      try {
        // 1. Fetch Nurse Profile (Identity + Nurse specific)
        // Call the Nurse Service detail endpoint, which aggregates Identity data
        const profileResponse = await axios.get(`${SERVICE_URLS.nurse}/nurses/${nurseUserId}/`);
        setNurseProfile(profileResponse.data);
        console.log('Fetched Nurse Profile:', profileResponse.data);


        // 2. Fetch Vitals Recorded by This Nurse
        // Call the Nurse Service list endpoint for vitals, filtered by nurse_user_id
        // Nurse Service aggregates Patient and Nurse Identity data for vitals
        const vitalsResponse = await axios.get(`${SERVICE_URLS.nurse}/vitals/`, {
          params: { nurse_user_id: nurseUserId } // Send nurse_user_id as a query parameter
        });
        // Vitals are already ordered by timestamp descending in the backend
        setRecordedVitals(vitalsResponse.data);
        console.log('Fetched Vitals recorded by nurse:', vitalsResponse.data);


      } catch (err) {
        console.error('Error fetching nurse data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch nurse data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch nurse data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch data if the user object (with ID) is available AND the user type is nurse
    if (user && user.id && user.user_type === 'nurse') {
       console.log('Fetching data for nurse:', user.id);
       fetchNurseData();
    } else {
       console.log('User not available or not nurse. Skipping data fetch.');
       setLoading(false);
    }

  }, [user, navigate]); // Include navigate in dependency array


  // --- Fetch Patients for Recording Vitals Form ---
  useEffect(() => {
      // Only fetch patients when the recording form is activated and we haven't fetched them yet
      if (isRecordingVitals && patients.length === 0) {
          const fetchPatients = async () => {
              try {
                  // Call the Patient Service list endpoint, which aggregates Identity data
                  const patientsResponse = await axios.get(`${SERVICE_URLS.patient}/patients/`);
                  // Patient Service GET list endpoint should return only users with Patient profiles,
                  // already aggregated with basic identity (name, etc.)
                  setPatients(patientsResponse.data);
                  console.log('Fetched Patients for vitals recording:', patientsResponse.data);
              } catch (err) {
                   console.error('Error fetching patients:', err);
                   setRecordingError('Failed to load patients list for recording.'); // Use recording-specific error state
              }
          };
          fetchPatients();
      }
  }, [isRecordingVitals, patients.length]); // Re-run when isRecordingVitals state changes or if patients list is empty


  // --- Handle Starting Record Vitals ---
  const handleStartRecordVitals = () => {
      // Initialize form state
      setSelectedPatientId('');
      setVitalsTimestamp(new Date().toISOString().slice(0, 16)); // Default to current time, format for datetime-local input
      setTemperature(''); setSystolicBP(''); setDiastolicBP('');
      setHeartRate(''); setRespiratoryRate(''); setOxygenSaturation('');
      setVitalsNotes('');
      setRecordingError(null);
      setRecordingSuccess(null);
      setIsRecordingVitals(true); // Show the form
  };

  // --- Handle Submit Vitals ---
   const handleSubmitVitals = async (e) => {
       e.preventDefault();

       setRecordingLoading(true);
       setRecordingError(null);
       setRecordingSuccess(null);

       const nurseUserId = user.id; // The logged-in nurse's ID

       // Basic validation
       if (!selectedPatientId || !vitalsTimestamp) {
           setRecordingError('Please select a patient and specify a timestamp.');
           setRecordingLoading(false);
           return;
       }

       // Prepare timestamp for backend (ISO 8601 expected by backend)
       // The datetime-local input gives "YYYY-MM-DDTHH:MM" format. We need to add seconds and 'Z' or timezone info.
       let timestampToSend = vitalsTimestamp;
       if (timestampToSend.length === 16) { // If HH:MM format
            timestampToSend += ':00Z'; // Add seconds and assume UTC for simplicity
       }


       const vitalsPayload = {
           patient_user_id: selectedPatientId,
           nurse_user_id: nurseUserId,
           timestamp: timestampToSend,
           temperature_celsius: temperature !== '' ? parseFloat(temperature) : null, // Convert to float, handle empty
           blood_pressure_systolic: systolicBP !== '' ? parseInt(systolicBP, 10) : null, // Convert to int, handle empty
           blood_pressure_diastolic: diastolicBP !== '' ? parseInt(diastolicBP, 10) : null, // Convert to int, handle empty
           heart_rate_bpm: heartRate !== '' ? parseInt(heartRate, 10) : null,
           respiratory_rate_bpm: respiratoryRate !== '' ? parseInt(respiratoryRate, 10) : null,
           oxygen_saturation_percentage: oxygenSaturation !== '' ? parseFloat(oxygenSaturation) : null,
           notes: vitalsNotes || null, // Handle empty string for notes
       };

       // Basic validation for numbers
       if (vitalsPayload.temperature_celsius !== null && isNaN(vitalsPayload.temperature_celsius)) { setRecordingError('Invalid temperature.'); setRecordingLoading(false); return; }
       if (vitalsPayload.blood_pressure_systolic !== null && isNaN(vitalsPayload.blood_pressure_systolic)) { setRecordingError('Invalid systolic BP.'); setRecordingLoading(false); return; }
       if (vitalsPayload.blood_pressure_diastolic !== null && isNaN(vitalsPayload.blood_pressure_diastolic)) { setRecordingError('Invalid diastolic BP.'); setRecordingLoading(false); return; }
       if (vitalsPayload.heart_rate_bpm !== null && isNaN(vitalsPayload.heart_rate_bpm)) { setRecordingError('Invalid heart rate.'); setRecordingLoading(false); return; }
       if (vitalsPayload.respiratory_rate_bpm !== null && isNaN(vitalsPayload.respiratory_rate_bpm)) { setRecordingError('Invalid respiratory rate.'); setRecordingLoading(false); return; }
       if (vitalsPayload.oxygen_saturation_percentage !== null && isNaN(vitalsPayload.oxygen_saturation_percentage)) { setRecordingError('Invalid oxygen saturation.'); setRecordingLoading(false); return; }


       try {
           // Call the Nurse Service POST /api/vitals/ endpoint
           const response = await axios.post(`${SERVICE_URLS.nurse}/vitals/`, vitalsPayload);

           if (response.status === 201) {
               setRecordingSuccess('Vitals recorded successfully!');
               console.log('Vitals created:', response.data);

               // Optional: Refetch recorded vitals list to show the new one
               // Call the Nurse Service list endpoint for vitals, filtered by nurse_user_id
                const vitalsResponse = await axios.get(`${SERVICE_URLS.nurse}/vitals/`, {
                  params: { nurse_user_id: nurseUserId }
                });
                setRecordedVitals(vitalsResponse.data); // Update the list
                console.log('Refetched Vitals recorded by nurse:', vitalsResponse.data);

               // Reset form state and close form
               setSelectedPatientId('');
               setVitalsTimestamp('');
               setTemperature(''); setSystolicBP(''); setDiastolicBP('');
               setHeartRate(''); setRespiratoryRate(''); setOxygenSaturation('');
               setVitalsNotes('');
               setIsRecordingVitals(false);

           } else {
              setRecordingError('Failed to record vitals: Unexpected response.');
           }

       } catch (err) {
            console.error('Recording vitals failed:', err);
            if (err.response) {
                 if (err.response.data && err.response.data.error) {
                     setRecordingError(`Failed to record vitals: ${err.response.data.error}`);
                 } else {
                     setRecordingError(`Failed to record vitals: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setRecordingError('Failed to record vitals: Could not connect to the nurse service.');
            } else {
                 setRecordingError('An unexpected error occurred while recording vitals.');
            }
       } finally {
           setRecordingLoading(false);
       }
   };


  // --- Early Return for Redirection (Must come AFTER Hook calls) ---
  if (!user || user.user_type !== 'nurse') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Must come AFTER Early Returns) ---
  if (loading) {
    return <div>Loading Nurse Dashboard...</div>;
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
      <h2>Nurse Dashboard</h2>

      {/* Display Nurse Profile */}
      {nurseProfile ? (
        <div>
          <h3>Your Profile</h3>
          <p>Name: {nurseProfile.first_name} {nurseProfile.last_name}</p>
          <p>Username: {nurseProfile.username}</p>
          <p>Employee ID: {nurseProfile.employee_id || 'N/A'}</p>
          {/* Show _identity_error if Identity call failed during aggregation */}
          {nurseProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {nurseProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Record Patient Vitals Section */}
       <h3>Record Patient Vitals</h3>
       {!isRecordingVitals ? (
           <button onClick={handleStartRecordVitals}>Record New Vitals</button>
       ) : (
           <div>
               <h4>Enter Vitals</h4>
               <form onSubmit={handleSubmitVitals}>
                   <div>
                       <label htmlFor="patient">Select Patient:</label>
                       {patients.length > 0 ? (
                           <select id="patient" value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} required>
                               <option value="">-- Select a Patient --</option>
                               {patients.map(patient => (
                                   // Patient Service list endpoint returns aggregated data (includes name)
                                   <option key={patient.user_id} value={patient.user_id}>
                                       {patient.first_name} {patient.last_name} ({patient.username})
                                   </option>
                               ))}
                           </select>
                       ) : (
                           // Display loading or error state for patients fetch
                           recordingError && recordingError.includes('patients list') ?
                              <p style={{color:'red'}}>{recordingError}</p> :
                              <p>Loading patients...</p>
                       )}
                   </div>
                   <div>
                       <label htmlFor="vitalsTimestamp">Timestamp:</label>
                       {/* Use type="datetime-local" for date and time input */}
                       <input
                           type="datetime-local"
                           id="vitalsTimestamp"
                           value={vitalsTimestamp}
                           onChange={(e) => setVitalsTimestamp(e.target.value)}
                           required
                       />
                   </div>
                   {/* Vitals Inputs (add more as needed based on model) */}
                    <div>
                       <label htmlFor="temperature">Temperature (°C):</label>
                       <input type="number" id="temperature" value={temperature} onChange={(e) => setTemperature(e.target.value)} step="0.01" />
                   </div>
                    <div>
                       <label htmlFor="systolicBP">Systolic BP (mmHg):</label>
                       <input type="number" id="systolicBP" value={systolicBP} onChange={(e) => setSystolicBP(e.target.value)} />
                   </div>
                    <div>
                       <label htmlFor="diastolicBP">Diastolic BP (mmHg):</label>
                       <input type="number" id="diastolicBP" value={diastolicBP} onChange={(e) => setDiastolicBP(e.target.value)} />
                   </div>
                    <div>
                       <label htmlFor="heartRate">Heart Rate (bpm):</label>
                       <input type="number" id="heartRate" value={heartRate} onChange={(e) => setHeartRate(e.target.value)} />
                   </div>
                    <div>
                       <label htmlFor="respiratoryRate">Respiratory Rate (bpm):</label>
                       <input type="number" id="respiratoryRate" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value)} />
                   </div>
                    <div>
                       <label htmlFor="oxygenSaturation">Oxygen Saturation (%):</label>
                       <input type="number" id="oxygenSaturation" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value)} step="0.01" />
                   </div>
                    <div>
                       <label htmlFor="vitalsNotes">Notes:</label>
                       <textarea id="vitalsNotes" value={vitalsNotes} onChange={(e) => setVitalsNotes(e.target.value)} rows={3} style={{ width: '80%' }}></textarea>
                   </div>


                   {recordingError && <div style={{ color: 'red' }}>{recordingError}</div>}
                   {recordingSuccess && <div style={{ color: 'green' }}>{recordingSuccess}</div>}

                   <button type="submit" disabled={recordingLoading || patients.length === 0}> {/* Disable if loading or no patients loaded */}
                       {recordingLoading ? 'Saving...' : 'Save Vitals'}
                   </button>
                   <button type="button" onClick={() => setIsRecordingVitals(false)} disabled={recordingLoading}>
                       Cancel
                   </button>
               </form>
           </div>
       )}


      <hr />

      {/* Display Vitals Recorded by this Nurse */}
      <h3>Vitals You Recorded</h3>
      {recordedVitals.length > 0 ? (
        <ul>
          {recordedVitals.map(v => (
            <li key={v.id}>
              For Patient: {v.patient ? `${v.patient.first_name} ${v.patient.last_name}` : (v._patient_identity_error || 'N/A')}<br/>
              On: <strong>{new Date(v.timestamp).toLocaleString()}</strong>
              <ul> {/* Nested list for vitals details */}
                {v.temperature_celsius !== null && <li>Temp: {v.temperature_celsius}°C</li>}
                {(v.blood_pressure_systolic !== null || v.blood_pressure_diastolic !== null) && <li>BP: {v.blood_pressure_systolic || '?'} / {v.blood_pressure_diastolic || '?'} mmHg</li>}
                {v.heart_rate_bpm !== null && <li>HR: {v.heart_rate_bpm} bpm</li>}
                {v.respiratory_rate_bpm !== null && <li>RR: {v.respiratory_rate_bpm} bpm</li>}
                {v.oxygen_saturation_percentage !== null && <li>O₂ Sat: {v.oxygen_saturation_percentage}%</li>}
                {v.notes && <li>Notes: {v.notes}</li>}
                 {v._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {v._patient_identity_error}</p>}
                 {v._nurse_identity_error && <p style={{color:'orange', margin:0}}>Warning: Nurse identity missing: {v._nurse_identity_error}</p>} {/* Should not happen for vitals recorded by this nurse */}
              </ul>
              {/* Add button to view this patient's history? */}
              {/* v.patient_user_id && <button onClick={() => navigate(`/patients/${v.patient_user_id}/medical-history`)} style={{ marginLeft: '10px' }}>View Patient History</button> */}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No vitals recorded yet.</p>
      )}

      <hr />

      {/* Add other nurse functionalities */}
       <h3>Other Nurse Functions (To Be Implemented)</h3>
       {/* Example: */}
       {/* <button>View All Patients</button> */}
       {/* <button>View My Schedule</button> */} {/* Requires Appointment Service */}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default NurseDashboard;