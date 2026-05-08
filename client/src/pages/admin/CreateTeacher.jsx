import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const CreateTeacher = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', subject: '' });
    const navigate = useNavigate();
    const subjects = ['Physics', 'Chemistry', 'Biology', 'Maths', 'Computer Science', 'Kannada', 'English', 'Hindi'];

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/teachers', formData);
            alert('Teacher created successfully');
            setFormData({ name: '', email: '', password: '', subject: '' });
            navigate('/admin/dashboard');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error creating teacher');
        }
    };

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto space-y-6">
            <div className="mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#1e3280] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-[#1e3280] mb-2">Teacher Management</h3>
                        <p className="text-gray-600 font-sans text-sm">
                            Create new teacher accounts and assign them to subjects.
                        </p>
                    </div>
                    <button onClick={() => navigate('/admin/dashboard')} className="bg-white border border-[#1e3280] text-[#1e3280] px-5 py-2 rounded-lg font-bold hover:bg-[#1e3280] hover:text-white shadow-sm transition whitespace-nowrap">← Back</button>
                </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1e3280]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                    Create New Teacher Account
                </h3>
                <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                        <input type="text" placeholder="John Doe" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e3280] transition shadow-sm font-medium text-gray-700" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
                        <input type="email" placeholder="john@example.com" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e3280] transition shadow-sm font-medium text-gray-700" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Password</label>
                        <input type="password" placeholder="••••••••" required value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e3280] transition shadow-sm font-medium text-gray-700" />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Assigned Subject</label>
                        <select required value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e3280] transition shadow-sm font-medium text-gray-700 cursor-pointer">
                            <option value="">-- Select Subject --</option>
                            {subjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2 mt-4">
                        <button type="submit" className="w-full bg-gradient-to-r from-[#1e3280] to-blue-700 text-white p-4 rounded-xl font-bold hover:from-blue-900 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-sm tracking-wide">
                            Save & Create Teacher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateTeacher;
