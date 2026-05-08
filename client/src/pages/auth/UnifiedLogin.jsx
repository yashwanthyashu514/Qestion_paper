import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';

const UnifiedLogin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');

    // If already logged in, redirect them
    if (user) {
        if (user.role === 'admin') return <Navigate to="/admin/dashboard" />;
        if (user.role === 'teacher') return <Navigate to="/teacher/dashboard" />;
    }

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const loggedInUser = await login(formData.email, formData.password);
            // Unified single-sign routing
            if (loggedInUser.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (loggedInUser.role === 'teacher') {
                navigate('/teacher/dashboard');
            }
        } catch (err) {
            setError(err.msg || 'Login failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="bg-surface p-10 rounded-2xl shadow-xl w-full max-w-md border-t-8 border-primary animate-fade-in-up">
                <div className="text-center mb-8">
                    <div className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-2xl font-bold">
                        C P
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800">College Portal</h1>
                    <p className="text-gray-500 mt-2 text-sm">Secure Authentication Gateway</p>
                </div>
                
                {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-6 text-sm font-semibold border border-red-200 text-center">{error}</div>}
                
                <form onSubmit={onSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Email Address / ID</label>
                        <input 
                            type="email" 
                            required 
                            placeholder="user@college.edu"
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Password</label>
                        <input 
                            type="password" 
                            required 
                            placeholder="••••••••"
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            className="w-full border border-gray-300 p-3 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition" 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="w-full bg-primary text-white p-4 rounded-lg font-bold text-lg hover:bg-primary-hover shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        Secure Login
                    </button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>Protected by College Administration</p>
                </div>
            </div>
        </div>
    );
};

export default UnifiedLogin;
