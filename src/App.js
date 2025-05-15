// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';

// Import components
import Login from './components/Login';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import NurseDashboard from './components/NurseDashboard';
import LabTechDashboard from './components/LabTechDashboard';
import AdminDashboard from './components/AdminDashboard';
import MedicalHistoryDetail from './components/MedicalHistoryDetail'; // Import MedicalHistoryDetail


// Helper component for simple route protection (same as before)
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Another helper component for redirecting from / if logged in (same as before)
const RedirectIfLoggedIn = ({ children }) => {
  const { user } = useUser();
  if (user) {
      switch (user.user_type) {
        case 'patient': return <Navigate to="/patient" replace />;
        case 'doctor': return <Navigate to="/doctor" replace />;
        case 'pharmacist': return <Navigate to="/pharmacist" replace />;
        case 'nurse': return <Navigate to="/nurse" replace />;
        case 'lab_technician': return <Navigate to="/labtech" replace />;
        case 'administrator': return <Navigate to="/admin" replace />;
        default: return <Navigate to="/login" replace />;
      }
  }
  return children;
};


function App() {
  return (
    <Router>
      <UserProvider>
        <div className="App">
          <Routes>
            {/* Login Page */}
            <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />

            {/* Protected Routes for Dashboards */}
            <Route path="/patient" element={<ProtectedRoute><PatientDashboard /></ProtectedRoute>} />
            <Route path="/doctor" element={<ProtectedRoute><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/pharmacist" element={<ProtectedRoute><PharmacistDashboard /></ProtectedRoute>} />
            <Route path="/nurse" element={<ProtectedRoute><NurseDashboard /></ProtectedRoute>} />
            <Route path="/labtech" element={<ProtectedRoute><LabTechDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

            {/* Modified Protected Route for Medical History Detail */}
            {/* Now accepts a patientId URL parameter */}
             <Route path="/patients/:patientId/medical-history" element={<ProtectedRoute><MedicalHistoryDetail /></ProtectedRoute>} />

            {/* Default route */}
            <Route path="/" element={<RedirectIfLoggedIn><Navigate to="/login" replace /></RedirectIfLoggedIn>} />

             {/* Optional: Add a 404/Not Found page */}
             <Route path="*" element={<div>404 Not Found</div>} />

          </Routes>
        </div>
      </UserProvider>
    </Router>
  );
}

export default App;