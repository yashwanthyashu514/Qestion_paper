import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [teachers, setTeachers] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', subject: '' });
    const [templateFile, setTemplateFile] = useState(null);

    const fetchTeachers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/admin/teachers');
            setTeachers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchTeachers();
    }, []);

    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/admin/teachers', formData);
            setShowCreate(false);
            setFormData({ name: '', email: '', password: '', subject: '' });
            fetchTeachers();
        } catch (err) {
            alert(err.response?.data?.msg || 'Error creating teacher');
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure?')) {
            try {
                await axios.delete(`http://localhost:5000/api/admin/teachers/${id}`);
                fetchTeachers();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleTemplateUpload = async (e) => {
        e.preventDefault();
        if(!templateFile) return;
        const data = new FormData();
        data.append('template', templateFile);
        try {
            await axios.post('http://localhost:5000/api/templates', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Template uploaded successfully');
            setTemplateFile(null);
        } catch(err) {
            alert('Upload failed');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <div className="space-x-4">
                    <button onClick={() => setShowCreate(!showCreate)} className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition">
                        {showCreate ? 'Close' : '+ Create Teacher'}
                    </button>
                    <button onClick={() => { logout(); navigate('/'); }} className="bg-red-500 px-4 py-2 rounded font-semibold hover:bg-red-600 transition">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="p-8 max-w-6xl mx-auto">
                {showCreate && (
                    <div className="bg-white p-6 rounded shadow-md mb-8">
                        <h2 className="text-xl font-bold mb-4">Create New Teacher</h2>
                        <form onSubmit={handleCreateSubmit} className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="Name" required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="border p-2 rounded" />
                            <input type="email" placeholder="Email (ID)" required value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="border p-2 rounded" />
                            <input type="password" placeholder="Password" required value={formData.password} onChange={e=>setFormData({...formData, password: e.target.value})} className="border p-2 rounded" />
                            <select required value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} className="border p-2 rounded">
                                <option value="">Select Subject</option>
                                <option value="Physics">Physics</option>
                                <option value="Chemistry">Chemistry</option>
                                <option value="Biology">Biology</option>
                                <option value="Maths">Maths</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Kannada">Kannada</option>
                                <option value="English">English</option>
                                <option value="Hindi">Hindi</option>
                            </select>
                            <button type="submit" className="col-span-2 bg-green-500 text-white p-2 rounded hover:bg-green-600">Save Teacher</button>
                        </form>
                    </div>
                )}

                <div className="bg-white p-6 rounded shadow-md mb-8">
                    <h2 className="text-xl font-bold mb-4">Upload Question Paper Template (DOCX/PDF)</h2>
                    <form onSubmit={handleTemplateUpload} className="flex gap-4">
                        <input type="file" onChange={(e) => setTemplateFile(e.target.files[0])} className="border p-2 rounded flex-1" />
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Upload</button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded shadow-md">
                    <h2 className="text-xl font-bold mb-4">Teachers List</h2>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border p-2 text-left">Sl.No</th>
                                <th className="border p-2 text-left">Name</th>
                                <th className="border p-2 text-left">Subject</th>
                                <th className="border p-2 text-left">Email ID</th>
                                <th className="border p-2 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teachers.map((t, index) => (
                                <tr key={t._id} className="border-b hover:bg-gray-50">
                                    <td className="border p-2">{index + 1}</td>
                                    <td className="border p-2">{t.name}</td>
                                    <td className="border p-2">{t.subject}</td>
                                    <td className="border p-2">{t.email}</td>
                                    <td className="border p-2 text-center space-x-2">
                                        <button className="text-blue-500 hover:text-blue-700">Edit</button>
                                        <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:text-red-700">Delete</button>
                                    </td>
                                </tr>
                            ))}
                            {teachers.length === 0 && <tr><td colSpan="5" className="text-center p-4">No teachers found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
