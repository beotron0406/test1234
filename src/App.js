// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { ConfigProvider, App as AntApp } from 'antd';

// Import components
import Login from './components/Login';
import PatientDashboard from './components/PatientDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import NurseDashboard from './components/NurseDashboard';
import LabTechDashboard from './components/LabTechDashboard';
import AdminDashboard from './components/AdminDashboard';
import MedicalHistoryDetail from './components/MedicalHistoryDetail';

// Helper component for simple route protection
const ProtectedRoute = ({ children }) => {
  const { user } = useUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Another helper component for redirecting from / if logged in
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

// 404 Component
const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-8">Page Not Found</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Go Home
      </button>
    </div>
  </div>
);

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          // Primary colors
          colorPrimary: '#3498db',
          colorSuccess: '#2ecc71',
          colorWarning: '#e67e22',
          colorError: '#e74c3c',
          colorInfo: '#3498db',
          
          // Border and radius
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,
          
          // Font
          fontFamily: '"Inter", "Roboto", "Segoe UI", Arial, sans-serif',
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeSM: 12,
          
          // Layout
          padding: 16,
          paddingLG: 24,
          paddingSM: 12,
          margin: 16,
          marginLG: 24,
          marginSM: 12,
          
          // Colors for backgrounds
          colorBgContainer: '#ffffff',
          colorBgElevated: '#ffffff',
          colorBgLayout: '#f5f5f5',
          
          // Text colors
          colorText: '#333333',
          colorTextSecondary: '#7f8c8d',
          colorTextTertiary: '#95a5a6',
          
          // Box shadow
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          boxShadowSecondary: '0 2px 4px rgba(0, 0, 0, 0.05)',
        },
        components: {
          // Layout component customization
          Layout: {
            headerBg: '#3498db',
            headerHeight: 64,
            headerPadding: '0 24px',
            siderBg: '#ffffff',
            bodyBg: '#f5f5f5',
          },
          
          // Button component customization
          Button: {
            borderRadius: 6,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
          },
          
          // Card component customization
          Card: {
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
          
          // Input component customization
          Input: {
            borderRadius: 6,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
          },
          
          // Select component customization
          Select: {
            borderRadius: 6,
            controlHeight: 40,
            controlHeightLG: 48,
            controlHeightSM: 32,
          },
          
          // Table component customization
          Table: {
            borderRadius: 8,
            headerBg: '#fafafa',
          },
          
          // Tag component customization
          Tag: {
            borderRadius: 4,
          },
          
          // Alert component customization
          Alert: {
            borderRadius: 6,
          },
          
          // Modal component customization
          Modal: {
            borderRadius: 8,
          },
        },
      }}
    >
      <AntApp>
        <Router>
          <UserProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Login Page */}
                <Route 
                  path="/login" 
                  element={
                    <RedirectIfLoggedIn>
                      <Login />
                    </RedirectIfLoggedIn>
                  } 
                />

                {/* Protected Routes for Dashboards */}
                <Route 
                  path="/patient" 
                  element={
                    <ProtectedRoute>
                      <PatientDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/doctor" 
                  element={
                    <ProtectedRoute>
                      <DoctorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/pharmacist" 
                  element={
                    <ProtectedRoute>
                      <PharmacistDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/nurse" 
                  element={
                    <ProtectedRoute>
                      <NurseDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/labtech" 
                  element={
                    <ProtectedRoute>
                      <LabTechDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Medical History Detail Routes */}
                <Route 
                  path="/patient/medical-history" 
                  element={
                    <ProtectedRoute>
                      <MedicalHistoryDetail />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/patients/:patientId/medical-history" 
                  element={
                    <ProtectedRoute>
                      <MedicalHistoryDetail />
                    </ProtectedRoute>
                  } 
                />
                
                {/* Default route - redirect based on login status */}
                <Route 
                  path="/" 
                  element={
                    <RedirectIfLoggedIn>
                      <Navigate to="/login" replace />
                    </RedirectIfLoggedIn>
                  } 
                />

                {/* 404 Not Found page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </UserProvider>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;