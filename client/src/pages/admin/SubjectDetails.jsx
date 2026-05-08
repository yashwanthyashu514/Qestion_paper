import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api, { API_URL } from '../../api';

const SubjectDetails = () => {
    const { subject } = useParams();
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [teachers, setTeachers] = useState([]);
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('teachers');

    const fetchData = async () => {
        try {
            const [teachersRes, papersRes] = await Promise.all([
                api.get('/api/admin/teachers'),
                api.get('/api/papers/admin/all')
            ]);
            setTeachers(teachersRes.data.filter(t => t.subject === subject));
            setPapers(papersRes.data.filter(p => p.subject === subject));
            setLoading(false);
        } catch (err) {
            console.error(err);
            if (err.response && [400, 401, 403].includes(err.response.status)) {
                logout();
                navigate('/');
            }
        }
    };

    useEffect(() => {
        fetchData();
    }, [subject]);

    const handleDeleteTeacher = async (id) => {
        if(window.confirm('Are you sure you want to delete this teacher?')) {
            try {
                await api.delete(`/api/admin/teachers/${id}`);
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
        await api.put(`/api/papers/admin/${id}/status`, { status });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="text-center p-10 text-lg">Loading Directory Data...</div>;

    return (
        <div className="space-y-6 animate-fade-in-up font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#1e3280] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-[#1e3280] mb-2">{subject} Department</h3>
                        <p className="text-gray-600 font-sans text-sm">
                            Manage teachers and question papers for {subject}
                        </p>
                    </div>
                    <button onClick={() => navigate('/admin/dashboard')} className="bg-white border border-[#1e3280] text-[#1e3280] px-5 py-2 rounded-lg font-bold hover:bg-[#1e3280] hover:text-white shadow-sm transition whitespace-nowrap">← Back</button>
                </div>
            </div>
            
            {/* Tabs for switching views */}
            <div className="flex gap-4 border-b border-gray-200 pb-0">
                <button 
                    onClick={() => setActiveTab('teachers')}
                    className={`px-6 py-3 rounded-t-xl font-bold text-lg transition ${activeTab === 'teachers' ? 'bg-[#1e3280] text-white shadow-md transform -translate-y-1' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    {subject} Teachers List
                </button>
                <button 
                    onClick={() => setActiveTab('papers')}
                    className={`px-6 py-3 rounded-t-xl font-bold text-lg transition ${activeTab === 'papers' ? 'bg-[#1e3280] text-white shadow-md transform -translate-y-1' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    Generated Question Papers
                </button>
            </div>

            {/* Teachers List */}
            {activeTab === 'teachers' && (
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-green-500 animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm mr-3">{teachers.length}</span>
                        Registered Teachers
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-700 border-b-2 border-gray-200">
                                    <th className="p-3 text-left w-16">#</th>
                                    <th className="p-3 text-left">Teacher Name</th>
                                    <th className="p-3 text-left">Email Address</th>
                                    <th className="p-3 text-center w-32">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.map((t, index) => (
                                    <tr key={t._id} className="border-b border-gray-100 hover:bg-green-50 transition">
                                        <td className="p-3 text-gray-500 font-bold">{index + 1}</td>
                                        <td className="p-3 font-semibold text-gray-800">{t.name}</td>
                                        <td className="p-3 text-gray-600">{t.email}</td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => handleDeleteTeacher(t._id)} className="text-red-500 font-bold hover:text-white hover:bg-red-500 px-3 py-1 rounded transition">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && <tr><td colSpan="4" className="text-center p-8 text-gray-500 italic">No teachers currently assigned to {subject}.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Generated Papers */}
            {activeTab === 'papers' && (
                <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-purple-500 animate-fade-in-up">
                    <h3 className="text-xl font-bold mb-6 text-gray-800 flex items-center">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm mr-3">{papers.length}</span>
                        Generated Question Papers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {papers.map(p => {
                            const creator = teachers.find(t => t._id === p.teacherId);
                            const creatorName = creator ? creator.name : 'Unknown Teacher';

                            return (
                                <div key={p._id} className="border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition bg-white flex flex-col justify-between h-full">
                                    <div className="mb-4">
                                        <h4 className="font-bold text-gray-900 text-lg mb-2">{p.title}</h4>
                                        <div className="space-y-1 text-sm text-gray-600">
                                            <p><span className="font-semibold text-gray-500">Created By:</span> {creatorName}</p>
                                            <p><span className="font-semibold text-gray-500">Target Classes:</span> {p.classes.join(', ')}</p>
                                            <p><span className="font-semibold text-gray-500">Total Questions:</span> {p.questions.length}</p>
                                            <p><span className="font-semibold text-gray-500">Date Created:</span> {new Date(p.createdAt).toLocaleDateString()}</p>
                                            <div className="pt-3 mt-3 border-t border-gray-100">
                                                <p className="flex items-center">
                                                    <span className="font-semibold text-gray-500 mr-2">Status:</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${p.status === 'Approved' ? 'bg-green-100 text-green-700' : p.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {p.status || 'Pending Approval'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-auto">
                                        <button onClick={() => handleStatusUpdate(p._id, 'Rejected')} className="bg-red-50 text-red-700 border border-red-200 px-3 py-2 rounded text-sm font-bold hover:bg-red-600 hover:text-white transition text-center">Reject</button>
                                        <button onClick={() => handleStatusUpdate(p._id, 'Approved')} className="bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded text-sm font-bold hover:bg-green-600 hover:text-white transition text-center">Approve</button>
                                        <button onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)} className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded text-sm font-bold hover:bg-blue-600 hover:text-white transition text-center">Preview/Print</button>
                                        <button onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)} className="bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded text-sm font-bold hover:bg-purple-600 hover:text-white transition text-center">Export Word</button>
                                    </div>
                                </div>
                            );
                        })}
                        {papers.length === 0 && <div className="col-span-full p-8 text-center text-gray-500 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">No question papers have been generated for {subject} yet.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectDetails;
