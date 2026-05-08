import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const UploadTemplate = () => {
    const [templateFile, setTemplateFile] = useState(null);
    const navigate = useNavigate();

    const handleTemplateUpload = async (e) => {
        e.preventDefault();
        if(!templateFile) return;
        const data = new FormData();
        data.append('template', templateFile);
        try {
            await api.post('/api/templates', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Template uploaded successfully');
            setTemplateFile(null);
            navigate('/admin/dashboard');
        } catch(err) {
            alert('Upload failed');
        }
    };

    return (
        <div className="animate-fade-in-up max-w-3xl mx-auto space-y-6">
            <div className="mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-[#1e3280] flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-xl text-[#1e3280] mb-2">Template Management</h3>
                        <p className="text-gray-600 font-sans text-sm">
                            Upload the official college header for all question papers.
                        </p>
                    </div>
                    <button onClick={() => navigate('/admin/dashboard')} className="bg-white border border-[#1e3280] text-[#1e3280] px-5 py-2 rounded-lg font-bold hover:bg-[#1e3280] hover:text-white shadow-sm transition whitespace-nowrap">← Back</button>
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#1e3280]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    Upload College Header Template (JPG/PNG)
                </h3>
                <form onSubmit={handleTemplateUpload} className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="w-full relative">
                        <input type="file" accept="image/*" required onChange={(e) => setTemplateFile(e.target.files[0])} className="w-full border border-gray-200 p-3.5 rounded-xl bg-gray-50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1e3280] transition shadow-sm font-medium text-gray-700 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-[#1e3280] hover:file:bg-blue-100" />
                    </div>
                    <button type="submit" className="w-full sm:w-auto bg-gradient-to-r from-[#1e3280] to-blue-700 text-white px-8 py-4 rounded-xl font-bold hover:from-blue-900 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all text-sm tracking-wide whitespace-nowrap">
                        Upload Template
                    </button>
                </form>
                <div className="mt-8 bg-blue-50/50 p-5 rounded-xl border border-blue-100 flex gap-4 items-start">
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <strong className="text-[#1e3280] block mb-1 text-sm tracking-wide uppercase">Important Note</strong> 
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                            All teachers will use this template. Final generated papers will automatically follow this exact format and routing structure to maintain college standards.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadTemplate;
