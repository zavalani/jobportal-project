import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, RequireRole } from './auth';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Candidate from './pages/Candidate';
import Recruiter from './pages/Recruiter';
import Audit from './pages/Audit';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register/candidate" element={<Register role="candidate" />} />
            <Route path="/register/recruiter" element={<Register role="recruiter" />} />
            <Route path="/candidate" element={<RequireRole role="CANDIDATE"><Candidate /></RequireRole>} />
            <Route path="/recruiter" element={<RequireRole role="RECRUITER"><Recruiter /></RequireRole>} />
            <Route path="/audit" element={<RequireRole role="AUDIT"><Audit /></RequireRole>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
