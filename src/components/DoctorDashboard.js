// src/components/DoctorDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  doctor: 'http://localhost:8002/api', // Doctor Service API base URL
  appointments: 'http://localhost:8004/api', // Appointment Service API base URL
  medicalRecords: 'http://localhost:8007/api', // Medical Records Service API base URL (for reports & history)
  prescription: 'http://localhost:8008/api', // Prescription Service API base URL
  lab: 'http://localhost:8006/api', // Lab Service API base URL (for orders)
  // Identity service URL is called by the other services for aggregation
};


const DoctorDashboard = () => {
  const { user, logout } = useUser(); // Get logged-in user from context
  const navigate = useNavigate(); // Hook for navigation

  // State for fetched data
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]); // Doctor's appointments
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error for initial load

  // State for writing report functionality
  const [isWritingReport, setIsWritingReport] = useState(false); // Controls visibility of report form
  const [reportPatientId, setReportPatientId] = useState(''); // Selected Patient's User ID for report
  const [reportTitle, setReportTitle] = useState(''); // Report title input
  const [reportContent, setReportContent] = useState(''); // Report content input
  const [reportLoading, setReportLoading] = useState(false); // Loading state for report creation
  const [reportError, setReportError] = useState(null); // Error state for report creation
  const [reportSuccess, setReportSuccess] = useState(null); // Success message for report

  // State for prescribing functionality
  const [isPrescribing, setIsPrescribing] = useState(false); // Controls visibility of prescribing form
  const [prescribePatientId, setPrescribePatientId] = useState(''); // Selected Patient's User ID for prescription
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState(''); // Notes for prescription
  const [prescribingLoading, setPrescribingLoading] = useState(false); // Loading state for prescribing action
  const [prescribingError, setPrescribingError] = useState(null); // Error state for prescribing action
  const [prescribingSuccess, setPrescribingSuccess] = useState(null); // Success message for prescribing

  // State for ordering lab test functionality
  const [isOrderingLabTest, setIsOrderingLabTest] = useState(false); // Form visibility
  const [orderPatientId, setOrderPatientId] = useState(''); // Selected Patient's User ID for order
  const [testType, setTestType] = useState(''); // Test type input
  const [orderNotes, setOrderNotes] = useState(''); // Notes for the order
  const [orderingLoading, setOrderingLoading] = useState(false); // Loading state for ordering action
  const [orderingError, setOrderingError] = useState(null); // Error state for ordering action
  const [orderingSuccess, setOrderingSuccess] = useState(null); // Success message for ordering


  // --- Data Fetching using useEffect ---
  useEffect(() => {
    const fetchDoctorData = async () => {
      setLoading(true);
      setError(null); // Clear initial fetch error

      const doctorUserId = user.id; // Get the logged-in doctor's UUID

      try {
        // 1. Fetch Doctor Profile (Identity + Doctor specific)
        // Call the Doctor Service detail endpoint, which aggregates Identity data
        const profileResponse = await axios.get(`${SERVICE_URLS.doctor}/doctors/${doctorUserId}/`);
        setDoctorProfile(profileResponse.data);
        console.log('Fetched Doctor Profile:', profileResponse.data);


        // 2. Fetch Doctor's Appointments
        // Call the Appointment Service list endpoint, filtered by doctor_user_id
        // Appointment Service aggregates Patient Identity data
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { doctor_user_id: doctorUserId } // Send doctor_user_id as a query parameter
        });
        // Sort appointments by start time
        const sortedAppointments = appointmentsResponse.data.sort((a, b) =>
            new Date(a.start_time) - new Date(b.start_time)
        );
        setAppointments(sortedAppointments);
        console.log('Fetched Doctor Appointments:', sortedAppointments);


        // 3. Optional: Fetch a list of patients (e.g., recent patients via appointments)
        // This requires processing appointments or a dedicated backend endpoint.
        // Skipping direct "list patients" fetch for now to keep it simple.

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
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    // Only fetch data if the user object (with ID) is available AND the user type is doctor
    // This check is inside the effect, but the hook call itself is unconditional.
    if (user && user.id && user.user_type === 'doctor') {
       console.log('Fetching data for doctor:', user.id);
       fetchDoctorData();
    } else {
       console.log('User not available or not doctor. Skipping data fetch.');
       setLoading(false); // Ensure loading state is false if fetch is skipped
    }

  }, [user, navigate]); // Include navigate in dependency array (lint rule)


  // --- Handle View Patient History ---
   const handleViewPatientHistory = (patientUserId) => {
       // Navigate to the Medical History page with the specific patient ID in the URL
       console.log('Navigating to patient history for:', patientUserId);
       navigate(`/patients/${patientUserId}/medical-history`);
   };

   // --- Handle Starting Write Report ---
   const handleStartWriteReport = (patientUserId) => {
       setReportPatientId(patientUserId); // Pre-select patient based on appointment
       setReportTitle(''); // Clear form
       setReportContent(''); // Clear form
       setReportError(null); // Clear previous errors
       setReportSuccess(null); // Clear previous success
       setIsWritingReport(true); // Show the form
       setIsPrescribing(false); // Close other forms if open
       setIsOrderingLabTest(false); // Close other forms if open
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
           report_date: new Date().toISOString(), // Set report date to now (ISO 8601)
       };

       try {
           // Call the Medical Records Service POST /api/reports/ endpoint
           const response = await axios.post(`${SERVICE_URLS.medicalRecords}/reports/`, reportPayload);

           if (response.status === 201) {
               setReportSuccess('Medical report saved successfully!');
               console.log('Report created:', response.data);

               // Optional: Clear form or close it after success
               // setReportPatientId(''); setReportTitle(''); setReportContent(''); setIsWritingReport(false);
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


   // --- Handle Starting Prescribe Medication ---
   const handleStartPrescribing = (patientUserId) => {
       setPrescribePatientId(patientUserId); // Pre-select patient
       setMedicationName(''); // Clear form
       setDosage('');
       setFrequency('');
       setDuration('');
       setPrescriptionNotes('');
       setPrescribingError(null); // Clear errors
       setPrescribingSuccess(null); // Clear success
       setIsPrescribing(true); // Show the form
       setIsWritingReport(false); // Close other forms if open
       setIsOrderingLabTest(false); // Close other forms if open
   };

   // --- Handle Submit Prescription ---
   const handleSubmitPrescription = async (e) => {
       e.preventDefault();

       setPrescribingLoading(true);
       setPrescribingError(null);
       setPrescribingSuccess(null);

       const doctorUserId = user.id; // The logged-in doctor's ID

       // Basic validation
       if (!prescribePatientId || !medicationName || !dosage || !frequency || !duration) {
           setPrescribingError('Please select a patient and fill in medication name, dosage, frequency, and duration.');
           setPrescribingLoading(false);
           return;
       }

       const prescriptionPayload = {
           patient_user_id: prescribePatientId,
           doctor_user_id: doctorUserId,
           medication_name: medicationName,
           dosage: dosage,
           frequency: frequency,
           duration: duration,
           notes: prescriptionNotes || null, // Include optional notes, send null if empty
           prescription_date: new Date().toISOString(), // Set prescription date to now (ISO 8601)
           // status defaults to "active" in backend
       };

       try {
           // Call the Prescription Service POST /api/prescriptions/ endpoint
           const response = await axios.post(`${SERVICE_URLS.prescription}/prescriptions/`, prescriptionPayload);

           if (response.status === 201) {
               setPrescribingSuccess('Prescription saved successfully!');
               console.log('Prescription created:', response.data);

               // Optional: Clear form or close it
               // setPrescribePatientId(''); setMedicationName(''); setDosage(''); setFrequency(''); setDuration(''); setPrescriptionNotes('');
               // setIsPrescribing(false); // Close the form after success
           } else {
              setPrescribingError('Failed to save prescription: Unexpected response.');
           }

       } catch (err) {
            console.error('Saving prescription failed:', err);
            if (err.response) {
                 if (err.response.data && err.response.data.error) {
                      setPrescribingError(`Failed to save prescription: ${err.response.data.error}`);
                 } else {
                      setPrescribingError(`Failed to save prescription: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setPrescribingError('Failed to save prescription: Could not connect to prescription service.');
            } else {
                 setPrescribingError('An unexpected error occurred while saving the prescription.');
            }
       } finally {
           setPrescribingLoading(false);
       }
   };


   // --- Handle Starting Order Lab Test ---
   const handleStartOrderLabTest = (patientUserId) => {
       setOrderPatientId(patientUserId); // Pre-select patient
       setTestType(''); // Clear form
       setOrderNotes('');
       setOrderingError(null); // Clear errors
       setOrderingSuccess(null); // Clear success
       setIsOrderingLabTest(true); // Show the form
       setIsWritingReport(false); // Close other forms if open
       setIsPrescribing(false); // Close other forms if open
   };

   // --- Handle Submit Order Lab Test ---
   const handleSubmitOrderLabTest = async (e) => {
       e.preventDefault();

       setOrderingLoading(true);
       setOrderingError(null);
       setOrderingSuccess(null);

       const doctorUserId = user.id; // The logged-in doctor's ID

       // Basic validation
       if (!orderPatientId || !testType) {
           setOrderingError('Please select a patient and specify the test type.');
           setOrderingLoading(false);
           return;
       }

       const orderPayload = {
           patient_user_id: orderPatientId,
           doctor_user_id: doctorUserId,
           test_type: testType,
           notes: orderNotes || null, // Include optional notes, send null if empty
           order_date: new Date().toISOString(), // Set order date to now (ISO 8601)
           // status defaults to "ordered" in backend
       };

       try {
           // Call the Lab Service POST /api/orders/ endpoint
           const response = await axios.post(`${SERVICE_URLS.lab}/orders/`, orderPayload);

           if (response.status === 201) {
               setOrderingSuccess('Lab order created successfully!');
               console.log('Lab order created:', response.data);

               // Optional: Clear form or close it
               // setOrderPatientId(''); setTestType(''); setOrderNotes('');
               // setIsOrderingLabTest(false); // Close the form after success
           } else {
              setOrderingError('Failed to create lab order: Unexpected response.');
           }

       } catch (err) {
            console.error('Ordering lab test failed:', err);
            if (err.response) {
                 if (err.response.data && err.response.data.error) {
                     setOrderingError(`Failed to create lab order: ${err.response.data.error}`);
                 } else {
                     setOrderingError(`Failed to create lab order: ${err.response.status} ${err.response.statusText}`);
                 }
            } else if (err.request) {
                 setOrderingError('Failed to create lab order: Could not connect to the lab service.');
            } else {
                 setOrderingError('An unexpected error occurred while ordering the lab test.');
            }
       } finally {
           setOrderingLoading(false);
       }
   };


  // --- Early Return for Redirection (Must come AFTER Hook calls) ---
  // If the user is not logged in or is not a doctor, redirect to login.
  // This check must be after the useEffect hook calls.
  if (!user || user.user_type !== 'doctor') {
    navigate('/login'); // This call to navigate is fine after the hook calls
    return <div>Redirecting...</div>; // Or return null, or a loading spinner
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

  // --- Determine which form to show ---
  const isAnyFormOpen = isWritingReport || isPrescribing || isOrderingLabTest;

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
        !loading && <p>Could not load profile data.</p> // Only show this if not loading
      )}

      <hr />

      {/* Display Doctor's Appointments */}
      <h3>Your Appointments</h3>
      {appointments.length > 0 ? (
        <ul>
          {appointments.map(appointment => (
            <li key={appointment.id}>
              {/* Use a more robust date/time formatting library like date-fns or moment.js */}
              <strong>{new Date(appointment.start_time).toLocaleString()}</strong> - {new Date(appointment.end_time).toLocaleString()} ({appointment.status})<br />
              Patient: {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name} (${appointment.patient.user_type})` : (appointment._patient_identity_error || 'N/A')}
               {/* Add buttons for actions related to this patient/appointment */}
               {appointment.patient_user_id && (
                   <button onClick={() => handleViewPatientHistory(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>View Patient History</button>
               )}
               {appointment.patient_user_id && (
                   <button onClick={() => handleStartWriteReport(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>Write Report</button>
               )}
               {appointment.patient_user_id && (
                   <button onClick={() => handleStartPrescribing(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>Prescribe Medication</button>
               )}
                {appointment.patient_user_id && (
                   <button onClick={() => handleStartOrderLabTest(appointment.patient_user_id)} style={{ marginLeft: '10px' }}>Order Lab Test</button>
               )}


               {/* Display individual S2S errors if present */}
               {appointment._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing: {appointment._patient_identity_error}</p>}
              {appointment._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing: {appointment._doctor_identity_error}</p>}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No appointments found.</p> // Only show if not loading
      )}

      <hr />

      {/* Conditional rendering of forms */}
      {isWritingReport && (
          <section>
              <h3>Write Medical Report</h3>
               {/* Pass the patient name to the form display */}
              <h4>Report for Patient: {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.last_name || ''}</h4>
              <form onSubmit={handleSubmitReport}>
                  <input type="hidden" value={reportPatientId} /> {/* Patient ID */}
                  <div>
                      <label htmlFor="reportTitle">Title:</label>
                      <input type="text" id="reportTitle" value={reportTitle} onChange={(e) => setReportTitle(e.target.value)} required style={{ width: '80%' }} />
                  </div>
                  <div>
                      <label htmlFor="reportContent">Content:</label>
                      <textarea id="reportContent" value={reportContent} onChange={(e) => setReportContent(e.target.value)} required rows={10} style={{ width: '80%' }}></textarea>
                  </div>
                  {reportError && <div style={{ color: 'red' }}>{reportError}</div>}
                  {reportSuccess && <div style={{ color: 'green' }}>{reportSuccess}</div>}
                  <button type="submit" disabled={reportLoading}>{reportLoading ? 'Saving...' : 'Save Report'}</button>
                  <button type="button" onClick={() => setIsWritingReport(false)} disabled={reportLoading}>Cancel</button>
              </form>
          </section>
      )}

       {isPrescribing && (
           <section>
               <h3>Prescribe Medication</h3>
               {/* Pass the patient name to the form display */}
               <h4>Prescription for Patient: {appointments.find(appt => appt.patient_user_id === prescribePatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === prescribePatientId)?.patient?.last_name || ''}</h4>
               <form onSubmit={handleSubmitPrescription}>
                   <input type="hidden" value={prescribePatientId} /> {/* Patient ID */}
                   <div>
                       <label htmlFor="medicationName">Medication Name:</label>
                       <input type="text" id="medicationName" value={medicationName} onChange={(e) => setMedicationName(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                   <div>
                       <label htmlFor="dosage">Dosage:</label>
                       <input type="text" id="dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                    <div>
                       <label htmlFor="frequency">Frequency:</label>
                       <input type="text" id="frequency" value={frequency} onChange={(e) => setFrequency(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                   <div>
                       <label htmlFor="duration">Duration:</label>
                       <input type="text" id="duration" value={duration} onChange={(e) => setDuration(e.target.value)} required style={{ width: '80%' }} />
                   </div>
                    <div>
                       <label htmlFor="prescriptionNotes">Notes (Optional):</label>
                       <textarea id="prescriptionNotes" value={prescriptionNotes} onChange={(e) => setPrescriptionNotes(e.target.value)} rows={3} style={{ width: '80%' }}></textarea>
                   </div>
                   {prescribingError && <div style={{ color: 'red' }}>{prescribingError}</div>}
                   {prescribingSuccess && <div style={{ color: 'green' }}>{prescribingSuccess}</div>}
                   <button type="submit" disabled={prescribingLoading}>{prescribingLoading ? 'Prescribing...' : 'Save Prescription'}</button>
                   <button type="button" onClick={() => setIsPrescribing(false)} disabled={prescribingLoading}>Cancel</button>
               </form>
           </section>
       )}

       {isOrderingLabTest && (
           <section>
               <h3>Order Lab Test</h3>
               {/* Pass the patient name to the form display */}
               <h4>Order Lab Test for Patient: {appointments.find(appt => appt.patient_user_id === orderPatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === orderPatientId)?.patient?.last_name || ''}</h4>
               <form onSubmit={handleSubmitOrderLabTest}>
                   <input type="hidden" value={orderPatientId} /> {/* Patient ID */}
                   <div>
                       <label htmlFor="testType">Test Type:</label>
                       <input type="text" id="testType" value={testType} onChange={(e) => setTestType(e.target.value)} required style={{ width: '80%' }} placeholder='e.g., Complete Blood Count, Urinalysis' />
                   </div>
                    <div>
                       <label htmlFor="orderNotes">Notes (Optional):</label>
                       <textarea id="orderNotes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} rows={3} style={{ width: '80%' }} placeholder='Doctor notes for the lab'></textarea>
                   </div>
                   {orderingError && <div style={{ color: 'red' }}>{orderingError}</div>}
                   {orderingSuccess && <div style={{ color: 'green' }}>{orderingSuccess}</div>}
                   <button type="submit" disabled={orderingLoading}>{orderingLoading ? 'Ordering...' : 'Create Order'}</button>
                   <button type="button" onClick={() => setIsOrderingLabTest(false)} disabled={orderingLoading}>Cancel</button>
               </form>
           </section>
       )}


       {/* Show "Other Functions" only if no form is open */}
       {!isAnyFormOpen && (
           <>
               <hr />
               <h3>Other Doctor Functions (To Be Implemented)</h3>
               {/* Example: */}
               {/* <button>View My Patients</button> */}
           </>
       )}


      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default DoctorDashboard;