import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import UnifiedLogin from './pages/auth/UnifiedLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreatePaper from './pages/teacher/CreatePaper';

const ProtectedRoute = ({ children, role }) => {
    const { user, loading } = React.useContext(AuthContext);
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) return <Navigate to="/" />;
    
    if (role && user.role !== role) {
        return <Navigate to="/" />;
    }

    return children;
};

function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}

export default App;
