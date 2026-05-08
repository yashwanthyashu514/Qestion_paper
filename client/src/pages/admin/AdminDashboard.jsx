import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import UploadTemplate from './UploadTemplate';
import CreateTeacher from './CreateTeacher';
import SubjectDetails from './SubjectDetails';
import AdminPaperPreview from './AdminPaperPreview';

const DashboardHome = () => {
    const subjects = ['Physics', 'Chemistry', 'Biology', 'Maths', 'Computer Science', 'Kannada', 'English', 'Hindi'];
    return (
        <div className="animate-fade-in-up">
            <div className="mb-8 bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#1e3280]">
                <h3 className="font-bold text-xl text-[#1e3280] mb-2">Welcome to the Admin Dashboard</h3>
                <p className="text-gray-600 font-sans text-sm">
                    Use the navigation at the top to upload the official college question paper template or create new teacher accounts.
                    Click on any subject below to view the teachers assigned to that subject and all question papers they have generated.
                </p>
            </div>

            <h2 className="text-xl font-bold mb-6 text-[#1e3280] border-b-4 border-blue-500 pb-2 inline-block tracking-wide">SUBJECT DIRECTORY</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {subjects.map(sub => (
                    <Link 
                        to={`/admin/dashboard/subject/${sub}`}
                        key={sub}
                        className="bg-white p-6 rounded-xl shadow-sm text-center font-bold text-lg transition border border-gray-100 text-gray-700 hover:shadow-md hover:border-blue-400 hover:text-blue-700 transform hover:-translate-y-1 flex flex-col items-center justify-center gap-3"
                    >
                        <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold shadow-inner">
                            {sub.charAt(0)}
                        </div>
                        {sub}
                    </Link>
                ))}
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
            {/* Top Navigation Bar - Dark Blue */}
            <nav className="bg-[#1e3280] p-4 text-white flex justify-between items-center z-10 rounded-t-lg mx-4 mt-4 shadow-md">
                <div 
                    className="flex items-center cursor-pointer hover:opacity-80 transition gap-4"
                    onClick={() => navigate('/admin/dashboard')}
                >
                    <div className="bg-white text-[#1e3280] font-black rounded-lg w-10 h-10 flex items-center justify-center text-xl shadow-sm">A</div>
                    <h1 className="text-xl font-bold tracking-wide">
                        Admin Portal
                    </h1>
                </div>
                
                <div className="space-x-3 flex items-center">
                    <Link 
                        to="/admin/dashboard/upload-template" 
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${location.pathname.includes('upload-template') ? 'bg-white/20 text-white border border-white/50' : 'bg-transparent border border-blue-400 text-blue-100 hover:bg-white/10'}`}
                    >
                        Upload Template
                    </Link>
                    <Link 
                        to="/admin/dashboard/create-teacher" 
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-1 ${location.pathname.includes('create-teacher') ? 'bg-white/20 text-white border border-white/50' : 'bg-transparent border border-blue-400 text-blue-100 hover:bg-white/10'}`}
                    >
                        + Create Teacher
                    </Link>
                    <div className="w-px h-6 bg-blue-500/50 mx-2"></div>
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
                    <Route path="/" element={<DashboardHome />} />
                    <Route path="/upload-template" element={<UploadTemplate />} />
                    <Route path="/create-teacher" element={<CreateTeacher />} />
                    <Route path="/subject/:subject" element={<SubjectDetails />} />
                    <Route path="/preview/:paperId" element={<AdminPaperPreview />} />
                </Routes>
            </div>
        </div>
    );
};

export default AdminDashboard;
