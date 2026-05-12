import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../api';

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
        <div className="space-y-8 animate-fade-in-up px-4 py-8">
            <div className="bg-surface p-10 rounded-[2.5rem] shadow-sm border border-gray-100 border-l-8 border-navy flex justify-between items-center">
                <div>
                    <h3 className="font-black text-3xl text-navy mb-2 uppercase tracking-tight">{subject} Division</h3>
                    <p className="text-[10px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Departmental Asset & Faculty Control</p>
                </div>
                <button onClick={() => navigate('/admin/dashboard')} className="bg-white border-2 border-gray-100 text-slate/40 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-navy hover:text-navy transition shadow-sm">← Back</button>
            </div>
            
            {/* Tabs for switching views */}
            <div className="flex gap-4 p-2 bg-gray-100 rounded-3xl w-fit">
                <button 
                    onClick={() => setActiveTab('teachers')}
                    className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'teachers' ? 'bg-navy text-gold shadow-lg' : 'text-slate/40 hover:text-navy'}`}
                >
                    Faculty Roster
                </button>
                <button 
                    onClick={() => setActiveTab('papers')}
                    className={`px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'papers' ? 'bg-navy text-gold shadow-lg' : 'text-slate/40 hover:text-navy'}`}
                >
                    Academic Archives
                </button>
            </div>

            {/* Teachers List */}
            {activeTab === 'teachers' && (
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 animate-fade-in-up">
                    <h3 className="text-sm font-black mb-8 text-navy flex items-center gap-4 uppercase tracking-widest">
                        <span className="bg-gold text-navy w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg rotate-3">{teachers.length}</span>
                        Authorized Staff
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-navy/40 text-[10px] uppercase tracking-widest border-b-2 border-gray-100">
                                    <th className="p-5 text-left w-16">ID</th>
                                    <th className="p-5 text-left">Faculty Name</th>
                                    <th className="p-5 text-left">Digital Identity</th>
                                    <th className="p-5 text-center w-32">Administrative</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.map((t, index) => (
                                    <tr key={t._id} className="border-b border-gray-50 hover:bg-navy/[0.02] transition">
                                        <td className="p-5 text-navy font-black opacity-30">{String(index + 1).padStart(2, '0')}</td>
                                        <td className="p-5 font-black text-navy">{t.name}</td>
                                        <td className="p-5 text-navy/60 font-medium">{t.email}</td>
                                        <td className="p-5 text-center">
                                            <button onClick={() => handleDeleteTeacher(t._id)} className="bg-red-50 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl transition shadow-sm">Revoke</button>
                                        </td>
                                    </tr>
                                ))}
                                {teachers.length === 0 && <tr><td colSpan="4" className="text-center p-12 text-slate/30 font-bold uppercase tracking-widest text-xs italic">No faculty currently assigned to this division.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Generated Papers */}
            {activeTab === 'papers' && (
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 animate-fade-in-up">
                    <h3 className="text-sm font-black mb-10 text-navy flex items-center gap-4 uppercase tracking-widest">
                        <span className="bg-gold text-navy w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg rotate-3">{papers.length}</span>
                        Departmental Archives
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {papers.map(p => {
                            const creator = teachers.find(t => t._id === p.teacherId);
                            const creatorName = creator ? creator.name : 'Institutional Engine';

                            return (
                                <div key={p._id} className="border-2 border-gray-100 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-navy/10 transition-all bg-white flex flex-col justify-between h-full relative group overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-navy/5 -mr-12 -mt-12 rounded-full group-hover:scale-150 transition-all duration-500"></div>
                                    <div className="mb-6 relative">
                                        <h4 className="font-black text-navy text-xl mb-4 leading-tight tracking-tight uppercase">{p.title}</h4>
                                        <div className="space-y-3 text-[10px] font-black text-slate/50 uppercase tracking-widest">
                                            <p className="flex justify-between border-b border-gray-50 pb-2"><span>Archivist</span> <span className="text-navy">{creatorName}</span></p>
                                            <p className="flex justify-between border-b border-gray-50 pb-2"><span>Target Class</span> <span className="text-navy">{p.classes.join(', ')}</span></p>
                                            <p className="flex justify-between border-b border-gray-50 pb-2"><span>Volume</span> <span className="text-navy">{p.questions.length} Qs</span></p>
                                            <p className="flex justify-between border-b border-gray-50 pb-2"><span>Timestamp</span> <span className="text-navy">{new Date(p.createdAt).toLocaleDateString()}</span></p>
                                            <div className="pt-4">
                                                <p className="flex items-center gap-3">
                                                    <span>Protocol Status:</span>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${p.status === 'Approved' ? 'bg-navy text-gold' : p.status === 'Rejected' ? 'bg-red-500 text-white' : 'bg-gray-100 text-slate/40'}`}>
                                                        {p.status || 'Pending'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-auto relative">
                                        <button onClick={() => handleStatusUpdate(p._id, 'Rejected')} className="bg-gray-50 text-red-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition shadow-sm">Reject</button>
                                        <button onClick={() => handleStatusUpdate(p._id, 'Approved')} className="bg-navy text-gold py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition shadow-lg">Approve</button>
                                        <button onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)} className="col-span-2 bg-white border-2 border-gray-100 text-navy py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-navy transition shadow-sm">Preview Full Document</button>
                                    </div>
                                </div>
                            );
                        })}
                        {papers.length === 0 && <div className="col-span-full p-16 text-center text-slate/30 font-black uppercase tracking-widest text-sm border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/50">Zero assessment records found for this department.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectDetails;
