// src/components/MedicalHistoryDetail.js (with improved lab result display)
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/index.css'; // Import CSS

const SERVICE_URLS = {
  medicalRecords: 'http://localhost:8007/api',
};

// Helper function to format lab results in a readable way
const formatLabResults = (resultData) => {
  if (!resultData || typeof resultData !== 'object') {
    return <p>No data available</p>;
  }

  return (
    <div className="formatted-lab-results">
      <table className="result-table">
        <thead>
          <tr>
            <th>Test Parameter</th>
            <th>Result</th>
            <th>Unit</th>
            <th>Reference Range</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(resultData).map(([paramName, paramData]) => (
            <tr key={paramName} className="result-row">
              <td className="param-name">{paramName}</td>
              <td className="param-value">
                {paramData.value !== undefined ? 
                  (typeof paramData.value === 'number' ? paramData.value.toLocaleString() : paramData.value) 
                  : 'N/A'}
              </td>
              <td className="param-unit">{paramData.unit || ''}</td>
              <td className="param-range">{paramData.reference_range || 'Not specified'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const MedicalHistoryDetail = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async (targetPatientId) => {
      setLoading(true);
      setError(null);

      try {
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

    const targetPatientId = patientId || (user && user.user_type === 'patient' ? user.id : null);

     if (targetPatientId) {
         console.log(`Fetching history for patient ID from URL (${patientId || 'N/A'}) or context (${user?.id || 'N/A'}): ${targetPatientId}`);
         fetchHistory(targetPatientId);
     } else if (!user) {
         navigate('/login');
         setLoading(false);
     } else {
         setError("Invalid access: Patient ID not specified.");
         setLoading(false);
     }

  }, [user, navigate, patientId]);

   if (loading) {
     return <div className="loading">Loading Medical History...</div>;
   }

   if (error) {
     return (
       <div className="container">
         <h2>Error</h2>
         <p className="error-message">{error}</p>
         <button 
           onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}
           className="back-button"
         >
           Back to Dashboard
         </button>
       </div>
     );
   }

   const {
       patient_identity, patient_profile, vitals_history,
       lab_orders, lab_results, doctor_reports,
       _patient_identity_error, _patient_profile_error,
       _vitals_history_error, _lab_orders_error, _lab_results_error,
       _doctor_reports_error
    } = historyData || {};

   if (!historyData || Object.keys(historyData).length === 0) {
        return (
            <div className="container">
                <h2>Medical History</h2>
                <p>No medical history found for this patient.</p>
                <button 
                  onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}
                  className="back-button"
                >
                  Back to Dashboard
                </button>
            </div>
        );
   }

  return (
    <div className="container medical-history">
      <div className="medical-history-header">
        <h2>Medical History for {patient_identity ? `${patient_identity.first_name} ${patient_identity.last_name}` : `Patient ID: ${patientId || user?.id || 'N/A'}`}</h2>
        
        {/* Button to go back */}
        <button 
          onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}
          className="back-button"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Display Patient Identity & Profile */}
      <div className="history-section patient-details">
        <h3>Patient Details</h3>
        {patient_identity ? (
            <div>
              <p><strong>Name:</strong> {patient_identity.first_name} {patient_identity.last_name}</p>
              <p><strong>Username:</strong> {patient_identity.username}</p>
              <p><strong>Email:</strong> {patient_identity.email}</p>
            </div>
        ) : (_patient_identity_error ? <p className="error-indicator">Error loading patient identity: {_patient_identity_error}</p> : <p>Patient identity not available.</p>)}

        {patient_profile ? (
            <div>
              <p><strong>Date of Birth:</strong> {patient_profile.date_of_birth || 'N/A'}</p>
              <p><strong>Address:</strong> {patient_profile.address || 'N/A'}</p>
              <p><strong>Phone:</strong> {patient_profile.phone_number || 'N/A'}</p>
            </div>
        ) : (_patient_profile_error ? <p className="error-indicator">Error loading patient profile: {_patient_profile_error}</p> : <p>Patient profile not available.</p>)}
      </div>

      <hr />

      {/* Display Vitals History */}
      <div className="history-section">
        <h3>Vitals History</h3>
        {vitals_history && vitals_history.length > 0 ? (
          <ul className="vitals-list">
            {vitals_history.map(v => (
              <li key={v.id} className="vitals-item">
                <div className="vitals-date">
                  {new Date(v.timestamp).toLocaleString()} by Nurse {v.nurse ? `${v.nurse.first_name} ${v.nurse.last_name}` : (v._nurse_identity_error || 'N/A')}
                </div>
                <ul>
                  {v.temperature_celsius !== null && <li>Temp: {v.temperature_celsius}°C</li>}
                  {(v.blood_pressure_systolic !== null || v.blood_pressure_diastolic !== null) && <li>BP: {v.blood_pressure_systolic || '?'} / {v.blood_pressure_diastolic || '?'} mmHg</li>}
                  {v.heart_rate_bpm !== null && <li>HR: {v.heart_rate_bpm} bpm</li>}
                  {v.respiratory_rate_bpm !== null && <li>RR: {v.respiratory_rate_bpm} bpm</li>}
                  {v.oxygen_saturation_percentage !== null && <li>O₂ Sat: {v.oxygen_saturation_percentage}%</li>}
                  {v.notes && <li>Notes: {v.notes}</li>}
                </ul>
                {v._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing: {v._patient_identity_error}</p>}
                {v._nurse_identity_error && <p className="warning-indicator">Warning: Nurse identity missing: {v._nurse_identity_error}</p>}
              </li>
            ))}
          </ul>
        ) : (_vitals_history_error ? <p className="error-indicator">Error loading vitals history: {_vitals_history_error}</p> : <p>No vitals history available.</p>)}
      </div>

      <hr />

      {/* Display Lab Orders */}
      <div className="history-section">
        <h3>Lab Orders</h3>
        {lab_orders && lab_orders.length > 0 ? (
           <ul className="lab-orders-list">
               {lab_orders.map(order => (
                   <li key={order.id} className="lab-order-item">
                       <div className="lab-order-date">
                         <strong>{order.test_type}</strong> ({order.status}) on {new Date(order.order_date).toLocaleDateString()}
                       </div>
                       <p>Ordered by Dr. {order.doctor ? `${order.doctor.first_name} ${order.doctor.last_name}` : (order._doctor_identity_error || 'N/A')}</p>
                       {order.notes && <p>Doctor's Notes: {order.notes}</p>}
                       {order._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing for this order: {order._patient_identity_error}</p>}
                       {order._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing for this order: {order._doctor_identity_error}</p>}
                       {order._order_error && <p className="error-indicator">Error loading order details: {order._order_error}</p>}
                   </li>
               ))}
           </ul>
       ) : (_lab_orders_error ? <p className="error-indicator">Error loading lab orders: {_lab_orders_error}</p> : <p>No lab orders found.</p>)}
      </div>

      <hr/>

      {/* Display Lab Results - IMPROVED SECTION */}
      <div className="history-section">
        <h3>Lab Results</h3>
        {lab_results && lab_results.length > 0 ? (
            <ul className="lab-results-list">
                {lab_results.map(result => (
                    <li key={result.id} className="lab-result-item">
                        <div className="lab-result-date">
                          <strong>{result.order ? result.order.test_type : 'Unknown Test'}</strong> ({result.status}) on {new Date(result.result_date).toLocaleDateString()}
                        </div>
                        <p>Recorded by Lab Tech {result.lab_technician ? `${result.lab_technician.first_name} ${result.lab_technician.last_name}` : (result._lab_technician_identity_error || 'N/A')}</p>
                        
                        {/* Replace JSON.stringify with the formatted display */}
                        <div className="result-data">
                          {formatLabResults(result.result_data)}
                        </div>

                        {result.notes && <p>Technician's Notes: {result.notes}</p>}

                        {result.order && (
                            <div>
                                <p>Order Date: {new Date(result.order.order_date).toLocaleDateString()}</p>
                                <p>Ordered by Dr. {result.order.doctor ? `${result.order.doctor.first_name} ${result.order.doctor.last_name}` : (result.order._doctor_identity_error || 'N/A')}</p>
                            </div>
                        )}
                        {result._order_error && <p className="error-indicator">Error loading associated order: {result._order_error}</p>}
                        {result.order && result.order._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing for this order: {result.order._patient_identity_error}</p>}
                        {result.order && result.order._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing for this order: {result.order._doctor_identity_error}</p>}
                        {result._lab_technician_identity_error && <p className="warning-indicator">Warning: Lab Tech identity missing: {result._lab_technician_identity_error}</p>}
                    </li>
                ))}
            </ul>
       ) : (_lab_results_error ? <p className="error-indicator">Error loading lab results: {_lab_results_error}</p> : <p>No lab results found.</p>)}
      </div>

      <hr/>

      {/* Display Doctor Reports */}
      <div className="history-section">
        <h3>Doctor Reports</h3>
        {doctor_reports && doctor_reports.length > 0 ? (
           <ul className="doctor-reports-list">
               {doctor_reports.map(report => (
                   <li key={report.id} className="doctor-report-item">
                       <div className="report-date">
                         <strong>{report.title}</strong> on {new Date(report.report_date).toLocaleDateString()}
                       </div>
                       <p>By Dr. {report.doctor ? `${report.doctor.first_name} ${report.doctor.last_name}` : (report._doctor_identity_error || 'N/A')}</p>
                       <p>Report: {report.content}</p>
                       {report._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing for this report: {report._patient_identity_error}</p>}
                       {report._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing for this report: {report._doctor_identity_error}</p>}
                   </li>
               ))}
           </ul>
       ) : (_doctor_reports_error ? <p className="error-indicator">Error loading doctor reports: {_doctor_reports_error}</p> : <p>No doctor reports found.</p>)}
      </div>

      <hr />

      {/* Add section for Prescriptions when implemented
      <div className="history-section">
        <h3>Prescriptions (To Be Implemented)</h3>
        <p>Prescription history will appear here.</p>
      </div> */}

      <hr />

      {/* Navigation buttons */}
      <div className="navigation-buttons">
        <button 
          onClick={() => navigate(user && user.user_type === 'patient' ? '/patient' : (user && user.user_type === 'doctor' ? '/doctor' : '/'))}
          className="back-button"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default MedicalHistoryDetail;