/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import { HealthuChat } from './components/HealthuChat';

// Pages (will create these next)
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import PatientDashboard from './pages/PatientDashboard';
import PatientUpload from './pages/PatientUpload';
import PatientTimeline from './pages/PatientTimeline';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorPatientView from './pages/DoctorPatientView';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: 'patient' | 'doctor' }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  // Check onboarding
  if (!profile?.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Check role
  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 container mx-auto px-4 py-8">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />

              {/* Patient Routes */}
              <Route path="/patient/dashboard" element={
                <ProtectedRoute role="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              } />
              <Route path="/patient/upload" element={
                <ProtectedRoute role="patient">
                  <PatientUpload />
                </ProtectedRoute>
              } />
              <Route path="/patient/timeline" element={
                <ProtectedRoute role="patient">
                  <PatientTimeline />
                </ProtectedRoute>
              } />

              {/* Doctor Routes */}
              <Route path="/doctor/dashboard" element={
                <ProtectedRoute role="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              } />
              <Route path="/doctor/patient/:id" element={
                <ProtectedRoute role="doctor">
                  <DoctorPatientView />
                </ProtectedRoute>
              } />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <HealthuChat />
        </div>
      </AuthProvider>
    </Router>
  );
}
