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
        <div className="animate-fade-in-up max-w-4xl mx-auto space-y-10 px-4 py-8">
            <div className="bg-surface p-10 rounded-[2.5rem] shadow-sm border border-gray-100 border-l-8 border-navy flex justify-between items-center">
                <div>
                    <h3 className="font-black text-2xl text-navy mb-2 uppercase tracking-tight">Institutional Branding</h3>
                    <p className="text-[10px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Official Header Asset Management</p>
                </div>
                <button onClick={() => navigate('/admin/dashboard')} className="bg-white border-2 border-gray-100 text-slate/40 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-navy hover:text-navy transition shadow-sm">← Back</button>
            </div>
            
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
                <h3 className="text-sm font-black mb-10 text-navy uppercase tracking-[0.2em] flex items-center gap-4">
                    <span className="bg-gold text-navy w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg rotate-3">↑</span>
                    Primary Header Asset (PNG/JPG)
                </h3>
                <form onSubmit={handleTemplateUpload} className="flex flex-col gap-6">
                    <div className="w-full">
                        <input type="file" accept="image/*" required onChange={(e) => setTemplateFile(e.target.files[0])} className="w-full border-2 border-gray-100 p-5 rounded-2xl bg-gray-50/50 hover:bg-white focus:border-navy outline-none transition-all shadow-inner font-bold text-navy cursor-pointer file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-navy file:text-gold hover:file:scale-105" />
                    </div>
                    <button type="submit" className="w-full bg-gold text-navy py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:shadow-2xl hover:scale-[1.02] transition-all shadow-xl active:scale-95">
                        Establish Brand Template
                    </button>
                </form>
                <div className="mt-12 bg-navy/5 p-8 rounded-[2rem] border border-navy/10 flex gap-6 items-start">
                    <div className="bg-navy text-gold p-3 rounded-xl shadow-lg">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <strong className="text-navy block mb-2 text-[10px] font-black uppercase tracking-widest">Global Protocol</strong> 
                        <p className="text-sm text-navy/70 leading-relaxed font-medium">
                            The uploaded asset will serve as the mandatory header for all academic output. This maintains Manchester College's visual integrity across all department-level assessments.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadTemplate;
