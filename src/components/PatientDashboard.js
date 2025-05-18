// src/components/PatientDashboard.js (with class names added)
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import '../css/index.css'; // Import CSS

// Service URLs
const SERVICE_URLS = {
  patient: 'http://localhost:8001/api',
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api',
};

const PatientDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State variables (unchanged)
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Data fetching (unchanged)
  useEffect(() => {
    const fetchPatientData = async () => {
      setLoading(true);
      setError(null);

      const patientUserId = user.id;

      try {
        // 1. Fetch Patient Profile
        const profileResponse = await axios.get(`${SERVICE_URLS.patient}/patients/${patientUserId}/`);
        setPatientProfile(profileResponse.data);
        console.log('Fetched Patient Profile:', profileResponse.data);

        // 2. Fetch Patient Appointments
        const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
          params: { patient_user_id: patientUserId }
        });
        setAppointments(appointmentsResponse.data);
        console.log('Fetched Appointments:', appointmentsResponse.data);

      } catch (err) {
        console.error('Error fetching patient data:', err);
         if (err.response && err.response.data && err.response.data.error) {
             setError(`Failed to fetch patient data: ${err.response.data.error}`);
         } else if (err.request) {
             setError('Failed to fetch patient data: Network error or service is down.');
         } else {
             setError('An unexpected error occurred while fetching data.');
         }
      } finally {
        setLoading(false);
      }
    };

    if (user && user.id && user.user_type === 'patient') {
       console.log('Fetching initial data for patient:', user.id);
       fetchPatientData();
    } else {
       console.log('User not available or not patient. Skipping initial data fetch.');
       setLoading(false);
    }

  }, [user, navigate]);

  // Doctor fetching (unchanged)
  useEffect(() => {
    if (isBooking && doctors.length === 0) {
        const fetchDoctors = async () => {
            try {
                const doctorsResponse = await axios.get(`${SERVICE_URLS.doctor}/doctors/`);
                setDoctors(doctorsResponse.data);
                console.log('Fetched Doctors for booking:', doctorsResponse.data);
            } catch (err) {
                 console.error('Error fetching doctors:', err);
                 setBookingError('Failed to load doctors list.');
            }
        };
        fetchDoctors();
    }
  }, [isBooking, doctors.length]);

  // Booking handler (unchanged)
  const handleBookAppointment = async (e) => {
      e.preventDefault();

      setBookingLoading(true);
      setBookingError(null);
      setBookingSuccess(null);

      const patientUserId = user.id;

      if (!selectedDoctorId || !appointmentDate || !appointmentTime) {
          setBookingError('Please select a doctor, date, and time.');
          setBookingLoading(false);
          return;
      }

      const [hours, minutes] = appointmentTime.split(':').map(Number);
      const startDateTime = new Date(`${appointmentDate}T${appointmentTime}:00Z`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
           setBookingError('Invalid date or time format.');
           setBookingLoading(false);
           return;
      }

      const bookingPayload = {
          patient_user_id: patientUserId,
          doctor_user_id: selectedDoctorId,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
      };

      try {
        const response = await axios.post(`${SERVICE_URLS.appointments}/appointments/`, bookingPayload);

        if (response.status === 201) {
          setBookingSuccess('Appointment booked successfully!');
          console.log('Appointment booked:', response.data);

           // Refetch appointments list
           const appointmentsResponse = await axios.get(`${SERVICE_URLS.appointments}/appointments/`, {
             params: { patient_user_id: patientUserId }
           });
           setAppointments(appointmentsResponse.data);
           console.log('Refetched Appointments:', appointmentsResponse.data);

          setSelectedDoctorId('');
          setAppointmentDate('');
          setAppointmentTime('');
          setIsBooking(false);

        } else {
           setBookingError('Failed to book appointment: Unexpected response.');
        }

      } catch (err) {
         console.error('Booking failed:', err);
         if (err.response) {
              if (err.response.status === 409) {
                  setBookingError(`Booking failed: ${err.response.data.error || 'Doctor not available.'}`);
              } else if (err.response.data && err.response.data.error) {
                  setBookingError(`Booking failed: ${err.response.data.error}`);
              } else {
                  setBookingError(`Booking failed: ${err.response.status} ${err.response.statusText}`);
              }
         } else if (err.request) {
              setBookingError('Booking failed: Network error or service is down.');
         } else {
              setBookingError('An unexpected error occurred during booking.');
         }
      } finally {
        setBookingLoading(false);
      }
  };

  // Cancel appointment handler (unchanged)
  // const handleCancelAppointment = (appointmentId) => {
  //     alert(`Cancel functionality not implemented yet for appointment ID: ${appointmentId}`);
  //     console.log(`Attempted to cancel appointment ID: ${appointmentId}`);
  // };

  // Early Return for Redirection (unchanged)
  if (!user || user.user_type !== 'patient') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }

  // Loading and error states
  if (loading) {
    return <div className="loading">Loading Patient Dashboard...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <h2>Error</h2>
        <p className="error-message">{error}</p>
        <button onClick={logout}>Logout</button>
      </div>
    );
  }

  // Render Dashboard with added class names
  return (
    <div className="container patient-dashboard">
      <h2>Patient Dashboard</h2>

      {/* Profile Section */}
      {patientProfile ? (
        <div className="profile-section">
          <h3>Your Profile</h3>
          <p><strong>Name:</strong> {patientProfile.first_name} {patientProfile.last_name}</p>
          <p><strong>Username:</strong> {patientProfile.username}</p>
          <p><strong>Email:</strong> {patientProfile.email}</p>
          <p><strong>Date of Birth:</strong> {patientProfile.date_of_birth || 'N/A'}</p>
          <p><strong>Address:</strong> {patientProfile.address || 'N/A'}</p>
          <p><strong>Phone:</strong> {patientProfile.phone_number || 'N/A'}</p>
          {patientProfile._identity_error && <p className="warning-message">Warning: Could not load all identity data: {patientProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Appointments Section */}
      <div className="appointments-section">
        <h3>Your Appointments</h3>
        {appointments.length > 0 ? (
          <ul className="appointment-list">
            {appointments.map(appointment => (
              <li key={appointment.id} className={`appointment-item status-${appointment.status}`}>
                <div className="appointment-date">
                  {new Date(appointment.start_time).toLocaleString()} - {new Date(appointment.end_time).toLocaleString()} ({appointment.status})
                </div>
                <div className="appointment-doctor">
                  <strong>Doctor:</strong> {appointment.doctor ? `${appointment.doctor.first_name} ${appointment.doctor.last_name} (${appointment.doctor.specialization || appointment.doctor.user_type})` : (appointment._doctor_identity_error || 'N/A')}
                </div>
                
                {appointment._patient_identity_error && <p className="warning-indicator">Warning: Patient identity missing for this appt: {appointment._patient_identity_error}</p>}
                {appointment._doctor_identity_error && <p className="warning-indicator">Warning: Doctor identity missing for this appt: {appointment._doctor_identity_error}</p>}
                
                {/* Cancel button */}
                {/* <div className="appointment-actions">
                  {appointment.status === 'booked' && (
                    <button onClick={() => handleCancelAppointment(appointment.id)} className="danger">Cancel</button>
                  )}
                </div> */}
              </li>
            ))}
          </ul>
        ) : (
          !loading && <p>No appointments found.</p>
        )}
      </div>

      <hr />

      {/* Medical History Link */}
      <div className="history-section">
        <h3>Medical History</h3>
        <button onClick={() => navigate(`/patient/medical-history`)} className="history-link">View Detailed Medical History</button>
      </div>

      <hr />

      {/* Book Appointment Section */}
      <div className="booking-section">
        <h3>Book New Appointment</h3>
        {!isBooking ? (
          <button onClick={() => setIsBooking(true)}>Book Appointment</button>
        ) : (
          <div className="booking-form">
            <form onSubmit={handleBookAppointment}>
              <div>
                <label htmlFor="doctor">Select Doctor:</label>
                {doctors.length > 0 ? (
                   <select id="doctor" value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} required>
                     <option value="">-- Select a Doctor --</option>
                     {doctors.map(doctor => (
                       <option key={doctor.user_id} value={doctor.user_id}>
                         {doctor.first_name} {doctor.last_name} ({doctor.specialization || 'N/A'})
                       </option>
                     ))}
                   </select>
                ) : (
                   bookingError && bookingError.includes('doctors list') ?
                      <p className="error-message">{bookingError}</p> :
                      <p>Loading doctors...</p>
                )}
              </div>
              <div>
                 <label htmlFor="appointmentDate">Date:</label>
                 <input
                   type="date"
                   id="appointmentDate"
                   value={appointmentDate}
                   onChange={(e) => setAppointmentDate(e.target.value)}
                   required
                 />
              </div>
              <div>
                 <label htmlFor="appointmentTime">Time:</label>
                 <input
                   type="time"
                   id="appointmentTime"
                   value={appointmentTime}
                   onChange={(e) => setAppointmentTime(e.target.value)}
                   required
                 />
              </div>
              {bookingError && <div className="booking-error">{bookingError}</div>}
              {bookingSuccess && <div className="booking-success">{bookingSuccess}</div>}

              <div className="booking-form-actions">
                <button type="submit" disabled={bookingLoading || doctors.length === 0}>
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
                <button type="button" onClick={() => setIsBooking(false)} disabled={bookingLoading} className="danger">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <hr />

      <button onClick={logout} className="danger">Logout</button>
      <button 
        className="ai-chat-button"
        onClick={() => window.location.href = "http://127.0.0.1:5000"}
      >
        <span role="img" aria-label="chat">💬</span>
        AI Chat Assistant
      </button>
    </div>
  );
};

export default PatientDashboard;