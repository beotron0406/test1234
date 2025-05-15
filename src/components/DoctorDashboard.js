// src/components/DoctorDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api', // <-- Medical Records Service URL
};

const DoctorDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]); // Doctor's appointments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for writing report functionality
  const [isWritingReport, setIsWritingReport] = useState(false); // Controls visibility of report form
  const [reportPatientId, setReportPatientId] = useState(''); // Selected Patient's User ID
  const [reportTitle, setReportTitle] = useState(''); // Report title input
  const [reportContent, setReportContent] = useState(''); // Report content input
  const [reportLoading, setReportLoading] = useState(false); // Loading state for report creation
  const [reportError, setReportError] = useState(null); // Error state for report creation
  const [reportSuccess, setReportSuccess] = useState(null); // Success message for report


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      setError(null);

      const doctorUserId = user.id;

      try {
        // 1. Fetch Doctor Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.doctor}/doctors/${doctorUserId}/`);
        setDoctorProfile(profileResponse.data);
        console.log('Fetched Doctor Profile:', profileResponse.data);


        // 2. Fetch Doctor's Appointments
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { doctor_user_id: doctorUserId }
        });
        // Sort appointments by start time
        const sortedAppointments = appointmentsResponse.data.sort((a, b) =>
            new Date(a.start_time) - new Date(b.start_time)
        );
        setAppointments(sortedAppointments);
        console.log('Fetched Doctor Appointments:', sortedAppointments);


      } catch (err) {
        console.error('Error fetching doctor data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch doctor data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch doctor data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && user.user_type === 'doctor') {
       console.log('Fetching data for doctor:', user.id);
       fetchDoctorData();
    } else {
       console.log('User not available or not doctor. Skipping data fetch.');
       setLoading(false);
    }

  }, [user, navigate]); // Include navigate in dependency array


  // --- Handle View Patient History ---
   const handleViewPatientHistory = (patientUserId) => {
       // Doctors need to view a specific patient's history
       // Navigate to a route that includes the patient ID
       // This requires a new route like /patient/:patientId/medical-history
       // and updating MedicalHistoryDetail to read the ID from URL params.
       // For now, navigate to the general history page and alert the ID needed
       alert(`Viewing patient history for user ID: ${patientUserId} (Actual navigation to patient-specific history not implemented yet)`);
       console.log('Attempted to view patient history for:', patientUserId);
       // navigate(`/patient/medical-history`); // Navigates to current user's history
   };

   // --- Handle Starting Write Report ---
   const handleStartWriteReport = (patientUserId) => {
       setReportPatientId(patientUserId); // Pre-select patient based on appointment
       setReportTitle(''); // Clear form
       setReportContent(''); // Clear form
       setReportError(null); // Clear previous errors
       setReportSuccess(null); // Clear previous success
       setIsWritingReport(true); // Show the form
   };

   // --- Handle Submit Report ---
   const handleSubmitReport = async (e) => {
       e.preventDefault();

       setReportLoading(true);
       setReportError(null);
       setReportSuccess(null);

       const doctorUserId = user.id; // The logged-in doctor's ID

       // Basic validation
       if (!reportPatientId || !reportTitle || !reportContent) {
           setReportError('Please select a patient and fill in the title and content.');
           setReportLoading(false);
           return;
       }

       const reportPayload = {
           patient_user_id: reportPatientId,
           doctor_user_id: doctorUserId,
           title: reportTitle,
           content: reportContent,
           report_date: new Date().toISOString(), // Set report date to now
       };

       try {
           // Call the Medical Records Service POST /api/reports/ endpoint
           const response = await axios.post(`${SERVICE_URLS.medicalRecords}/reports/`, reportPayload);

           if (response.status === 201) {
               setReportSuccess('Medical report saved successfully!');
               console.log('Report created:', response.data);

               // Optional: Clear form or close it
               // setReportPatientId('');
               // setReportTitle('');
               // setReportContent('');
               // setIsWritingReport(false); // Close the form after success
           } else {
              setReportError('Failed to save report: Unexpected response.');
           }

       } catch (err) {
            console.error('Saving report failed:', err);
            if (err.response) {
                if (err.response.data && err.response.data.error) {
                     setReportError(`Failed to save report: ${err.response.data.error}`);
                } else {
                     setReportError(`Failed to save report: ${err.response.status} ${err.response.statusText}`);
                }
            } else if (err.request) {
                 setReportError('Failed to save report: Could not connect to medical records service.');
            } else {
                 setReportError('An unexpected error occurred while saving the report.');
            }
       } finally {
           setReportLoading(false);
       }
   };


  // --- Early Return for Redirection (Must come AFTER Hook calls) ---
  if (!user || user.user_type !== 'doctor') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Must come AFTER Early Returns) ---
  if (loading) {
    return <div>Loading Doctor Dashboard...</div>;
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
      <h2>Doctor Dashboard</h2>

      {/* Display Doctor Profile */}
      {doctorProfile ? (
        <div>
          <h3>Your Profile</h3>
          <p>Name: {doctorProfile.first_name} {doctorProfile.last_name}</p>
          <p>Username: {doctorProfile.username}</p>
          <p>Email: {doctorProfile.email}</p>
          <p>Specialization: {doctorProfile.specialization || 'N/A'}</p>
          <p>License Number: {doctorProfile.license_number || 'N/A'}</p>
          {doctorProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {doctorProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Display Doctor's Appointments */}
      <h3>Your Appointments</h3>
      {appointments.length > 0 ? (
        <ul>
          {appointments.map(appointment => (
            <li key={appointment.id}>
              <strong>{new Date(appointment.start_time).toLocaleString()}</strong> - {new Date(appointment.end_time).toLocaleString()} ({appointment.status})<br />
              Patient: {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name} (${appointment.patient.user_type})` : (appointment._patient_identity_error || 'N/A')}
               {/* Add button to view this patient's history */}
               <button onClick={() => handleViewPatientHistory(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>View Patient History</button>
               {/* Add button to start writing a report for this patient */}
               <button onClick={() => handleStartWriteReport(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>Write Report</button>

               {/* Display individual S2S errors if present */}
               {appointment._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {appointment._patient_identity_error}</p>}
              {appointment._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing: {appointment._doctor_identity_error}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No appointments found.</p>
      )}

      <hr />

      {/* Write Medical Report Section */}
       <h3>Write Medical Report</h3>
       {!isWritingReport ? (
           <p>Select a patient from your appointments list to write a report.</p> // Instruction
       ) : (
           <div>
               <h4>Report for Patient: {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.last_name || ''}</h4>
               <form onSubmit={handleSubmitReport}>
                   {/* Patient selection is handled by the button click, display the selected patient */}
                   <input type="hidden" value={reportPatientId} /> {/* Keep patient ID hidden */}

                   <div>
                       <label htmlFor="reportTitle">Title:</label>
                       <input
                           type="text"
                           id="reportTitle"
                           value={reportTitle}
                           onChange={(e) => setReportTitle(e.target.value)}
                           required
                           style={{ width: '80%' }}
                       />
                   </div>
                   <div>
                       <label htmlFor="reportContent">Content:</label>
                       <textarea
                           id="reportContent"
                           value={reportContent}
                           onChange={(e) => setReportContent(e.target.value)}
                           required
                           rows={10}
                           style={{ width: '80%' }}
                       ></textarea>
                   </div>

                   {reportError && <div style={{ color: 'red' }}>{reportError}</div>}
                   {reportSuccess && <div style={{ color: 'green' }}>{reportSuccess}</div>}

                   <button type="submit" disabled={reportLoading}>
                       {reportLoading ? 'Saving...' : 'Save Report'}
                   </button>
                   <button type="button" onClick={() => setIsWritingReport(false)} disabled={reportLoading}>
                       Cancel
                   </button>
               </form>
           </div>
       )}

      <hr />

      {/* Other Doctor Functions (To Be Implemented) */}
       <h3>Other Doctor Functions (To Be Implemented)</h3>
       {/* Example: */}
       {/* <button>Order Lab Test</button> */}
       {/* <button>Prescribe Medication</button> */}
       {/* <button>View My Patients</button> */}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default DoctorDashboard;