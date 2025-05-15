// src/components/PatientDashboard.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

// Assume service ports are defined somewhere accessible
const SERVICE_URLS = {
  patient: 'http://localhost:8001/api',
  doctor: 'http://localhost:8002/api',
  appointments: 'http://localhost:8004/api',
  medicalRecords: 'http://localhost:8007/api',
};


const PatientDashboard = () => {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // State for fetched data
  const [patientProfile, setPatientProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  // Removed medicalHistorySummary state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // General fetch error

  // State for booking functionality
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // --- Data Fetching using useEffect ---
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

        // Removed medical history summary fetch from here

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

  }, [user, navigate]); // Include navigate in dependency array


  // --- Fetch Doctors for Booking Form ---
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


  // --- Handle Booking Action ---
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

  // --- Handle Cancel Appointment (Placeholder) ---
  const handleCancelAppointment = (appointmentId) => {
      // In a real app, this would call the Appointment Service PUT/PATCH endpoint
      // to update the appointment status to 'cancelled'.
      alert(`Cancel functionality not implemented yet for appointment ID: ${appointmentId}`);
      console.log(`Attempted to cancel appointment ID: ${appointmentId}`);
      // Optional: You might want to visually disable the button or change its text after click
      // even if it's just an alert, to show the user interaction.
  };


  // --- Early Return for Redirection (Must come AFTER Hook calls) ---
  if (!user || user.user_type !== 'patient') {
    navigate('/login');
    return <div>Redirecting...</div>;
  }


  // --- Render Loading/Error States (Must come AFTER Early Returns) ---
  if (loading) {
    return <div>Loading Patient Dashboard...</div>;
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
      <h2>Patient Dashboard</h2>

      {/* Display Patient Profile */}
      {patientProfile ? (
        <div>
          <h3>Your Profile</h3>
          <p>Name: {patientProfile.first_name} {patientProfile.last_name}</p>
          <p>Username: {patientProfile.username}</p>
          <p>Email: {patientProfile.email}</p>
          <p>Date of Birth: {patientProfile.date_of_birth || 'N/A'}</p>
          <p>Address: {patientProfile.address || 'N/A'}</p>
          <p>Phone: {patientProfile.phone_number || 'N/A'}</p>
          {patientProfile._identity_error && <p style={{color:'orange'}}>Warning: Could not load all identity data: {patientProfile._identity_error}</p>}
        </div>
      ) : (
        !loading && <p>Could not load profile data.</p>
      )}

      <hr />

      {/* Display Appointments */}
      <h3>Your Appointments</h3>
      {appointments.length > 0 ? (
        <ul>
          {appointments.map(appointment => (
            <li key={appointment.id}>
              <strong>{new Date(appointment.start_time).toLocaleString()}</strong> - {new Date(appointment.end_time).toLocaleString()} ({appointment.status})<br />
              Doctor: {appointment.doctor ? `${appointment.doctor.first_name} ${appointment.doctor.last_name} (${appointment.doctor.specialization || appointment.doctor.user_type})` : (appointment._doctor_identity_error || 'N/A')}
               {appointment._patient_identity_error && <p style={{color:'orange', margin:0}}>Warning: Patient identity missing for this appt: {appointment._patient_identity_error}</p>}
              {appointment._doctor_identity_error && <p style={{color:'orange', margin:0}}>Warning: Doctor identity missing for this appt: {appointment._doctor_identity_error}</p>}
               {/* Add Cancel button */}
              {appointment.status === 'booked' && ( // Only show cancel button if status is 'booked'
                 <button onClick={() => handleCancelAppointment(appointment.id)} style={{ marginLeft: '10px' }}>Cancel</button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !loading && <p>No appointments found.</p>
      )}

      <hr />

      {/* Medical History Link/Summary */}
       <h3>Medical History</h3>
       {/* Removed summary display, add link to detail page */}
       <button onClick={() => navigate(`/patient/medical-history`)}>View Detailed Medical History</button>


      <hr />

      {/* Book Appointment Section */}
      <h3>Book New Appointment</h3>
      {!isBooking ? (
        <button onClick={() => setIsBooking(true)}>Book Appointment</button>
      ) : (
        <div>
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
                 // Display loading or error state for doctors fetch
                 bookingError && bookingError.includes('doctors list') ?
                    <p style={{color:'red'}}>{bookingError}</p> :
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
            {bookingError && <div style={{ color: 'red' }}>{bookingError}</div>}
            {bookingSuccess && <div style={{ color: 'green' }}>{bookingSuccess}</div>}

            <button type="submit" disabled={bookingLoading || doctors.length === 0}> {/* Disable if booking or no doctors loaded */}
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
            <button type="button" onClick={() => setIsBooking(false)} disabled={bookingLoading}>
              Cancel
            </button>
          </form>
        </div>
      )}

      <hr />

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default PatientDashboard;