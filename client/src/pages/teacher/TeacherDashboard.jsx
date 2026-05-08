import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import AddQuestion from './AddQuestion';
import SavedPapers from './SavedPapers';

const TeacherDashboardHome = () => {
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#1e3280]">
                <h3 className="font-bold text-xl text-[#1e3280] mb-2">Welcome to your Workspace</h3>
                <p className="text-gray-600 font-sans text-sm">
                    Use the modules below to manage your subject's question bank or generate standardized college question papers.
                </p>
            </div>

            <h2 className="text-xl font-bold mb-6 text-[#1e3280] border-b-4 border-green-500 pb-2 inline-block tracking-wide">TEACHER PORTAL</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Question Bank */}
                <Link
                    to="/teacher/dashboard/add-question"
                    className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition border-t-4 border-green-500 block transform hover:-translate-y-1"
                >
                    <div className="bg-green-50 text-green-600 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                        Q
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        Question Bank
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 font-sans">
                        Manage and add questions to your subject bank
                    </p>
                </Link>

                {/* Create Paper */}
                <Link
                    to="/teacher/create-paper"
                    className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition border-t-4 border-blue-500 block transform hover:-translate-y-1"
                >
                    <div className="bg-blue-50 text-blue-600 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                        +
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        Create Question Paper
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 font-sans">
                        Filter and assemble a new paper
                    </p>
                </Link>

                {/* Saved Papers */}
                <Link
                    to="/teacher/dashboard/saved-papers"
                    className="bg-white p-8 rounded-xl shadow-sm text-center hover:shadow-md transition border-t-4 border-purple-500 block transform hover:-translate-y-1"
                >
                    <div className="bg-purple-50 text-purple-600 w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-2xl font-bold">
                        P
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">
                        Saved Question Papers
                    </h2>
                    <p className="text-xs text-gray-500 mt-2 font-sans">
                        View, export to PDF, and print papers
                    </p>
                </Link>
            </div>
        </div>
    );
};

const TeacherDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            {/* Top Navigation Bar - Dark Blue */}
            <nav className="bg-[#1e3280] p-4 text-white flex justify-between items-center z-10 rounded-t-lg mx-4 mt-4 shadow-md">
                <div
                    className="flex items-center cursor-pointer hover:opacity-80 transition gap-4"
                    onClick={() => navigate('/teacher/dashboard')}
                >
                    <div className="bg-white text-[#1e3280] font-black rounded-lg w-10 h-10 flex items-center justify-center text-xl shadow-sm">T</div>
                    <h1 className="text-xl font-bold tracking-wide">
                        {user?.subject || 'Physics'} Department
                    </h1>
                </div>

                <div className="space-x-3 flex items-center">
                    {location.pathname !== '/teacher/dashboard' && (
                        <button
                            onClick={() => navigate('/teacher/dashboard')}
                            className="bg-transparent border border-blue-400 text-blue-100 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition flex items-center gap-1"
                        >
                            <span>←</span> Back
                        </button>
                    )}
                    <button
                        onClick={() => { logout(); navigate('/'); }}
                        className="bg-transparent border border-blue-400 text-blue-100 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="flex-1 mx-4 mb-4 border-x border-b border-gray-200 bg-[#f8fafc] rounded-b-lg p-8">
                <Routes>
                    <Route path="/" element={<TeacherDashboardHome />} />
                    <Route path="add-question" element={<AddQuestion />} />
                    <Route path="saved-papers" element={<SavedPapers />} />
                </Routes>
            </div>
        </div>
    );
};

export default TeacherDashboard;