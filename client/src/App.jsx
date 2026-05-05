import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherLogin from './pages/teacher/TeacherLogin';
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
                {/* Public / Landing Route */}
                <Route path="/" element={<div className="min-h-screen flex items-center justify-center bg-gray-100">
                    <div className="bg-white p-8 rounded shadow-md text-center">
                        <h1 className="text-3xl font-bold mb-6 text-primary">Question Paper Generator</h1>
                        <div className="space-x-4">
                            <a href="/admin/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Admin Login</a>
                            <a href="/teacher/login" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Teacher Login</a>
                        </div>
                    </div>
                </div>} />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute role="admin">
                        <AdminDashboard />
                    </ProtectedRoute>
                } />

                {/* Teacher Routes */}
                <Route path="/teacher/login" element={<TeacherLogin />} />
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
