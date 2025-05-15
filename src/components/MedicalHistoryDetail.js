// src/components/MedicalHistoryDetail.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext'; // Import useUser
import { useNavigate, useParams } from 'react-router-dom'; // Import useParams
import axios from 'axios';

const SERVICE_URLS = {
  medicalRecords: 'http://localhost:8007/api',
};

const MedicalHistoryDetail = () => {
  const { user } = useUser(); // Get logged-in user from context
  const navigate = useNavigate();
  const { patientId } = useParams(); // <-- Get patientId from URL parameters

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchHistory = async (targetPatientId) => { // Accept the patient ID to fetch
      setLoading(true);
      setError(null);

      try {
        // Call the Medical Records Service history endpoint using the TARGET patient ID
        const response = await axios.get(`${SERVICE_URLS.medicalRecords}/patients/${targetPatientId}/medical_history/`);
        setHistoryData(response.data);
        console.log('Fetched Medical History Details:', response.data);

      } catch (err) {
        console.error('Error fetching medical history:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch medical history: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch medical history: Network error or service is down.');
         } else {
             setError('An unexpected error occurred.');
         }
      } finally {
        setLoading(false);
      }
    };

    // Determine the patient ID to fetch history for
    // If a patientId is in the URL params, use that.
    // Otherwise, if a user is logged in AND is a patient, use their ID from context.
    // This logic assumes *only* patients can view their own history via /patient/medical-history
    // and others (like doctors) use the parameterized route /patients/:patientId/medical-history
    // A more robust authorization check would be needed here.

    const targetPatientId = patientId || (user && user.user_type === 'patient' ? user.id : null);


     // Only fetch if we have a valid target patient ID
     if (targetPatientId) {
         console.log(`Fetching history for patient ID from URL (${patientId || 'N/A'}) or context (${user?.id || 'N/A'}): ${targetPatientId}`);
         fetchHistory(targetPatientId);
     } else if (!user) {
         // If no user is logged in and no patientId in URL, redirect to login
         navigate('/login');
         setLoading(false);
     } else {
         // If logged in but no patientId and not a patient user (e.g., doctor directly hitting /patient/medical-history)
         // Decide on behavior: redirect to their dashboard? show error?
         // For now, show an error.
         setError("Invalid access: Patient ID not specified.");
         setLoading(false);
     }


  }, [user, navigate, patientId]); // Dependency array includes user, navigate, and patientId


   // --- Render Loading/Error States ---
   // (Rendering logic is similar, adjust messages slightly)
   if (loading) {
     return <div>Loading Medical History...</div>;
   }

   if (error) {
     return (
       <div>
         <h2>Error</h2>
         <p>{error}</p>
         {/* Button to go back - back depends on where they came from */}
         {/* Simple back to dashboard for now */}
         <button onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}>Back to Dashboard</button>
       </div>
     );
   }

   // --- Render Data ---
   const {
       patient_identity, patient_profile, vitals_history,
       lab_orders, lab_results, doctor_reports,
       _patient_identity_error, _patient_profile_error,
       _vitals_history_error, _lab_orders_error, _lab_results_error,
       _doctor_reports_error
    } = historyData || {};

   if (!historyData || Object.keys(historyData).length === 0) {
        return (
            <div>
                <h2>Medical History</h2>
                <p>No medical history found for this patient.</p>
                 {/* Button to go back */}
                 <button onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}>Back to Dashboard</button>
            </div>
        );
   }


  return (
    <div>
      <h2>Medical History for {patient_identity ? `${patient_identity.first_name} ${patient_identity.last_name}` : `Patient ID: ${patientId || user?.id || 'N/A'}`}</h2> {/* Show ID if name not available */}

      {/* Button to go back */}
      <button onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}>Back to Dashboard</button>

      {/* Display Patient Identity & Profile (Same as before) */}
      <h3>Patient Details</h3>
      {patient_identity ? (
          <div>
            <p><strong>Name:</strong> {patient_identity.first_name} {patient_identity.last_name}</p>
            <p><strong>Username:</strong> {patient_identity.username}</p>
            <p><strong>Email:</strong> {patient_identity.email}</p>
          </div>
      ) : (_patient_identity_error ? <p style={{color:'red'}}>Error loading patient identity: {_patient_identity_error}</p> : <p>Patient identity not available.</p>)}

      {patient_profile ? (
          <div>
            <p><strong>Date of Birth:</strong> {patient_profile.date_of_birth || 'N/A'}</p>
            <p><strong>Address:</strong> {patient_profile.address || 'N/A'}</p>
            <p><strong>Phone:</strong> {patient_profile.phone_number || 'N/A'}</p>
          </div>
      ) : (_patient_profile_error ? <p style={{color:'red'}}>Error loading patient profile: {_patient_profile_error}</p> : <p>Patient profile not available.</p>)}

      <hr />

      {/* Display Vitals History (Same as before) */}
      <h3>Vitals History</h3>
      {vitals_history && vitals_history.length > 0 ? (
        <ul>
          {vitals_history.map(v => (
            <li key={v.id}>
              <strong>{new Date(v.timestamp).toLocaleString()}</strong> by Nurse {v.nurse ? `${v.nurse.first_name} ${v.nurse.last_name}` : (v._nurse_identity_error || 'N/A')}
              <ul>
                {v.temperature_celsius !== null && <li>Temp: {v.temperature_celsius}°C</li>}
                {(v.blood_pressure_systolic !== null || v.blood_pressure_diastolic !== null) && <li>BP: {v.blood_pressure_systolic || '?'} / {v.blood_pressure_diastolic || '?'} mmHg</li>}
                {v.heart_rate_bpm !== null && <li>HR: {v.heart_rate_bpm} bpm</li>}
                {v.respiratory_rate_bpm !== null && <li>RR: {v.respiratory_rate_bpm} bpm</li>}
                {v.oxygen_saturation_percentage !== null && <li>O₂ Sat: {v.oxygen_saturation_percentage}%</li>}
                {v.notes && <li>Notes: {v.notes}</li>}
                 {v._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {v._patient_identity_error}</p>}
                 {v._nurse_identity_error && <p style={{color:'orange', margin:0}}>Warning: Nurse identity missing: {v._nurse_identity_error}</p>}
              </ul>
            </li>
          ))}
        </ul>
      ) : (_vitals_history_error ? <p style={{color:'red'}}>Error loading vitals history: {_vitals_history_error}</p> : <p>No vitals history available.</p>)}

      <hr />

      {/* Display Lab Orders (Same as before) */}
      <h3>Lab Orders</h3>
       {lab_orders && lab_orders.length > 0 ? (
           <ul>
               {lab_orders.map(order => (
                   <li key={order.id}>
                       <strong>{order.test_type}</strong> ({order.status}) on {new Date(order.order_date).toLocaleDateString()}<br/>
                       Ordered by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')}
                       {order.notes && <p>Doctor's Notes: {order.notes}</p>}
                       {order._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing for this order: {order._patient_identity_error}</p>}
                       {order._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing for this order: {order._doctor_identity_error}</p>}
                       {order._order_error && <p style={{color:'red', margin:0}}>Error loading order details: {order._order_error}</p>}
                   </li>
               ))}
           </ul>
       ) : (_lab_orders_error ? <p style={{color:'red'}}>Error loading lab orders: {_lab_orders_error}</p> : <p>No lab orders found.</p>)}


      <hr/>

      {/* Display Lab Results (Same as before) */}
      <h3>Lab Results</h3>
       {lab_results && lab_results.length > 0 ? (
            <ul>
                {lab_results.map(result => (
                    <li key={result.id}>
                         <strong>{result.order ? result.order.test_type : 'Unknown Test'}</strong> ({result.status}) on {new Date(result.result_date).toLocaleDateString()}<br/>
                         Recorded by Lab Tech {result.lab_technician ? `${result.lab_technician.first_name} ${result.lab_technician.last_name}` : (result._lab_technician_identity_error || 'N/A')}<br/>
                        Result Data: {result.result_data ? JSON.stringify(result.result_data) : 'N/A'}
                         {result.notes && <p>Technician's Notes: {result.notes}</p>}

                         {result.order && (
                             <div>
                                 Order Date: {new Date(result.order.order_date).toLocaleDateString()}<br/>
                                 Ordered by Dr. {result.order.doctor ? `${result.order.doctor.first_name} ${result.order.doctor.last_name}` : (result.order._doctor_identity_error || 'N/A')}
                             </div>
                         )}
                         {result._order_error && <p style={{color:'red', margin:0}}>Error loading associated order: {result._order_error}</p>}
                         {result.order && result.order._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing for this order: {result.order._patient_identity_error}</p>}
                         {result.order && result.order._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing for this order: {result.order._doctor_identity_error}</p>}
                         {result._lab_technician_identity_error && <p style={{color:'orange', margin:0}}>Warning: Lab Tech identity missing: {result._lab_technician_identity_error}</p>}
                    </li>
                ))}
            </ul>
       ) : (_lab_results_error ? <p style={{color:'red'}}>Error loading lab results: {_lab_results_error}</p> : <p>No lab results found.</p>)}


      <hr/>

      {/* Display Doctor Reports (Same as before) */}
      <h3>Doctor Reports</h3>
       {doctor_reports && doctor_reports.length > 0 ? (
           <ul>
               {doctor_reports.map(report => (
                   <li key={report.id}>
                       <strong>{report.title}</strong> on {new Date(report.report_date).toLocaleDateString()}<br/>
                       By Dr. {report.doctor ? `${report.doctor.first_name} ${report.doctor.last_name}` : (report._doctor_identity_error || 'N/A')}
                       <p>Report: {report.content}</p>
                       {report._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing for this report: {report._patient_identity_error}</p>}
                       {report._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing for this report: {report._doctor_identity_error}</p>}
                   </li>
               ))}
           </ul>
       ) : (_doctor_reports_error ? <p style={{color:'red'}}>Error loading doctor reports: {_doctor_reports_error}</p> : <p>No doctor reports found.</p>)}

      <hr />

      {/* Add section for Prescriptions when implemented */}
       <h3>Prescriptions (To Be Implemented)</h3>
       <p>Prescription history will appear here.</p>


      <hr />

      {/* Button to go back */}
      <button onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}>Back to Dashboard</button>


    </div>
  );
};

export default MedicalHistoryDetail;