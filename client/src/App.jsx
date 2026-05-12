import React, { useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LoadingProvider, useLoading } from './context/LoadingContext';
import { setLoadingCallback } from './api';
import UnifiedLogin from './pages/auth/UnifiedLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreatePaper from './pages/teacher/CreatePaper';

// ── App Loader Linker ────────────────────────────────────────────────────────
// This small component connects the LoadingContext with the Axios instance
const ApiLoaderLinker = ({ children }) => {
    const { showLoader, hideLoader } = useLoading();

    useEffect(() => {
        setLoadingCallback((isLoading) => {
            if (isLoading) showLoader();
            else hideLoader();
        });
        
        // Cleanup: remove callback when app unmounts
        return () => setLoadingCallback(() => {});
    }, [showLoader, hideLoader]);

    return children;
};

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = useContext(AuthContext);
    
    if (loading) return null; // Let global loader handle initial auth
    
    if (!user) return <Navigate to="/" />;
    
    if (role && user.role !== role) {
        return <Navigate to="/" />;
    }

    return children;
};

function App() {
  return (
    <LoadingProvider>
        <AuthProvider>
            <ApiLoaderLinker>
                <Router>
                    <Routes>
                        {/* Unified Public Login Route */}
                        <Route path="/" element={<UnifiedLogin />} />

                        {/* Admin Routes */}
                        <Route path="/admin/dashboard/*" element={
                            <ProtectedRoute role="admin">
                                <AdminDashboard />
                            </ProtectedRoute>
                        } />

                        {/* Teacher Routes */}
                        <Route path="/teacher/dashboard/*" element={
                            <ProtectedRoute role="teacher">
                                <TeacherDashboard />
                            </ProtectedRoute>
                        } />
                        <Route path="/teacher/create-paper" element={
                            <ProtectedRoute role="teacher">
                                <CreatePaper />
                            </ProtectedRoute>
                        } />
                    </Routes>
                </Router>
            </ApiLoaderLinker>
        </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
