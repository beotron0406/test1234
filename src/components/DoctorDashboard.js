// src/components/DoctorDashboard.js (with class names added)
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import '../css/index.css'; // Import CSS

// Service URLs
const SERVICE_URLS = {
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api',
  prescription: 'http://localhost:8008/api',
  lab: 'http://localhost:8006/api', // <-- Add Lab Service URL
};

const DoctorDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State variables (unchanged)
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWritingReport, setIsWritingReport] = useState(false);
  const [reportPatientId, setReportPatientId] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [reportSuccess, setReportSuccess] = useState(null);
  const [isPrescribing, setIsPrescribing] = useState(false);
  const [prescribePatientId, setPrescribePatientId] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [prescriptionNotes, setPrescriptionNotes] = useState('');
  const [prescribingLoading, setPrescribingLoading] = useState(false);
  const [prescribingError, setPrescribingError] = useState(null);
  const [prescribingSuccess, setPrescribingSuccess] = useState(null);

  // Data fetching (unchanged)
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
  }, [user, navigate]);

  // View patient history handler (unchanged)
  const handleViewPatientHistory = (patientUserId) => {
     console.log('Navigating to patient history for:', patientUserId);
     navigate(`/patients/${patientUserId}/medical-history`);
  };

  // Write report handlers (unchanged)
  const handleStartWriteReport = (patientUserId) => {
     setReportPatientId(patientUserId);
     setReportTitle('');
     setReportContent('');
     setReportError(null);
     setReportSuccess(null);
     setIsWritingReport(true);
     setIsPrescribing(false);
  };

  const handleSubmitReport = async (e) => {
     e.preventDefault();

     setReportLoading(true);
     setReportError(null);
     setReportSuccess(null);

     const doctorUserId = user.id;

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
         report_date: new Date().toISOString(),
     };

     try {
         const response = await axios.post(`${SERVICE_URLS.medicalRecords}/reports/`, reportPayload);

         if (response.status === 201) {
             setReportSuccess('Medical report saved successfully!');
             console.log('Report created:', response.data);
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

  // Prescribe medication handlers (unchanged)
  const handleStartPrescribing = (patientUserId) => {
     setPrescribePatientId(patientUserId);
     setMedicationName('');
     setDosage('');
     setFrequency('');
     setDuration('');
     setPrescriptionNotes('');
     setPrescribingError(null);
     setPrescribingSuccess(null);
     setIsPrescribing(true);
     setIsWritingReport(false);
  };

  const handleSubmitPrescription = async (e) => {
     e.preventDefault();

     setPrescribingLoading(true);
     setPrescribingError(null);
     setPrescribingSuccess(null);

     const doctorUserId = user.id;

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
         notes: prescriptionNotes,
         prescription_date: new Date().toISOString(),
     };

     try {
         const response = await axios.post(`${SERVICE_URLS.prescription}/prescriptions/`, prescriptionPayload);

         if (response.status === 201) {
             setPrescribingSuccess('Prescription saved successfully!');
             console.log('Prescription created:', response.data);
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

  // Early Return for Redirection (unchanged)
  if (!user || user.user_type !== 'doctor') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }

  // Loading and error states
  if (loading) {
    return <div className="loading">Loading Doctor Dashboard...</div>;
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

  // Render Dashboard with added class names
  return (
    <div className="container doctor-dashboard">
      <h2>Doctor Dashboard</h2>

      {/* Doctor Profile */}
      {doctorProfile ? (
        <div className="profile-section">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {doctorProfile.first_name} {doctorProfile.last_name}</p>
          <p><strong>Username:</strong> {doctorProfile.username}</p>
          <p><strong>Email:</strong> {doctorProfile.email}</p>
          <p><strong>Specialization:</strong> {doctorProfile.specialization || 'N/A'}</p>
          <p><strong>License Number:</strong> {doctorProfile.license_number || 'N/A'}</p>
          {doctorProfile._identity_error && <p className="warning-message">Warning: Could not load all identity data: {doctorProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Doctor's Appointments */}
      <div className="appointments-section">
        <h3>Your Appointments</h3>
        {appointments.length > 0 ? (
          <ul className="appointment-list">
            {appointments.map(appointment => (
              <li key={appointment.id} className={`appointment-item status-${appointment.status}`}>
                <div className="appointment-date">
                  {new Date(appointment.start_time).toLocaleString()} - {new Date(appointment.end_time).toLocaleString()} ({appointment.status})
                </div>
                <div className="appointment-patient">
                  <strong>Patient:</strong> {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name} (${appointment.patient.user_type})` : (appointment._patient_identity_error || 'N/A')}
                </div>
                
                {/* Action buttons */}
                <div className="appointment-actions">
                  {appointment.patient_user_id && (
                    <>
                      <button onClick={() => handleViewPatientHistory(appointment.patient_user_id)}>
                        View Patient History
                      </button>
                      <button onClick={() => handleStartWriteReport(appointment.patient_user_id)} className="secondary">
                        Write Report
                      </button>
                      <button onClick={() => handleStartPrescribing(appointment.patient_user_id)} className="secondary">
                        Prescribe Medication
                      </button>
                    </>
                  )}
                </div>
                
                {/* Display errors if present */}
                {appointment._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing: {appointment._patient_identity_error}</p>}
                {appointment._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing: {appointment._doctor_identity_error}</p>}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No appointments found.</p>
        )}
      </div>

      <hr />

      {/* Write Medical Report Section */}
      <div className="report-section">
        <h3>Write Medical Report</h3>
        {!isWritingReport ? (
          <p>Select a patient from your appointments list to write a report.</p>
        ) : (
          <div className="report-form">
            <h4>Report for Patient: {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === reportPatientId)?.patient?.last_name || ''}</h4>
            <form onSubmit={handleSubmitReport}>
              <input type="hidden" value={reportPatientId} />
              <div>
                <label htmlFor="reportTitle">Title:</label>
                <input
                  type="text"
                  id="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  required
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
                ></textarea>
              </div>
              {reportError && <div className="form-error">{reportError}</div>}
              {reportSuccess && <div className="form-success">{reportSuccess}</div>}
              
              <div className="report-form-actions">
                <button type="submit" disabled={reportLoading}>
                  {reportLoading ? 'Saving...' : 'Save Report'}
                </button>
                <button type="button" onClick={() => setIsWritingReport(false)} disabled={reportLoading} className="danger">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <hr />

      {/* Prescribe Medication Section */}
      <div className="prescription-section">
        <h3>Prescribe Medication</h3>
        {!isPrescribing ? (
          <p>Select a patient from your appointments list to prescribe medication.</p>
        ) : (
          <div className="prescription-form">
            <h4>Prescription for Patient: {appointments.find(appt => appt.patient_user_id === prescribePatientId)?.patient?.first_name || 'Loading...'} {appointments.find(appt => appt.patient_user_id === prescribePatientId)?.patient?.last_name || ''}</h4>
            <form onSubmit={handleSubmitPrescription}>
              <input type="hidden" value={prescribePatientId} />
              
              <div>
                <label htmlFor="medicationName">Medication Name:</label>
                <input
                  type="text"
                  id="medicationName"
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="dosage">Dosage:</label>
                <input
                  type="text"
                  id="dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="frequency">Frequency:</label>
                <input
                  type="text"
                  id="frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="duration">Duration:</label>
                <input
                  type="text"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="prescriptionNotes">Notes (Optional):</label>
                <textarea
                  id="prescriptionNotes"
                  value={prescriptionNotes}
                  onChange={(e) => setPrescriptionNotes(e.target.value)}
                  rows={3}
                ></textarea>
              </div>
              
              {prescribingError && <div className="form-error">{prescribingError}</div>}
              {prescribingSuccess && <div className="form-success">{prescribingSuccess}</div>}
              
              <div className="prescription-form-actions">
                <button type="submit" disabled={prescribingLoading}>
                  {prescribingLoading ? 'Prescribing...' : 'Save Prescription'}
                </button>
                <button type="button" onClick={() => setIsPrescribing(false)} disabled={prescribingLoading} className="danger">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <hr />

      {/* Other Doctor Functions */}
      <div>
        <h3>Other Doctor Functions (To Be Implemented)</h3>
      </div>

      <hr />

      <button onClick={logout} className="danger">Logout</button>
    </div>
  );
};

export default DoctorDashboard;