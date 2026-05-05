import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Routes, Route, Link } from 'react-router-dom';
import AddQuestion from './AddQuestion';
import SavedPapers from './SavedPapers';

const TeacherDashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-green-600 p-4 text-white flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold">
                    Teacher Workspace - {user?.subject}
                </h1>
                <button
                    onClick={() => { logout(); navigate('/'); }}
                    className="bg-red-500 px-4 py-2 rounded font-semibold hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </nav>

            <div className="p-8 max-w-6xl mx-auto">
                <div className="grid grid-cols-3 gap-6 mb-8">

                    {/* ✅ UPDATED CARD */}
                    <Link
                        to="/teacher/dashboard/add-question"
                        className="bg-white p-6 rounded shadow-md text-center hover:shadow-lg transition border-t-4 border-green-500 cursor-pointer block"
                    >
                        <h2 className="text-xl font-bold text-gray-800">
                            Question Bank
                        </h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Manage and add questions to your subject bank
                        </p>
                    </Link>

                    {/* Create Paper */}
                    <Link
                        to="/teacher/create-paper"
                        className="bg-white p-6 rounded shadow-md text-center hover:shadow-lg transition border-t-4 border-blue-500 cursor-pointer block"
                    >
                        <h2 className="text-xl font-bold text-gray-800">
                            Create Question Paper
                        </h2>
                        <p className="text-sm text-gray-500 mt-2">
                            Filter and assemble a new paper
                        </p>
                    </Link>

                    {/* Saved Papers */}
                    <Link
                        to="/teacher/dashboard/saved-papers"
                        className="bg-white p-6 rounded shadow-md text-center hover:shadow-lg transition border-t-4 border-purple-500 cursor-pointer block"
                    >
                        <h2 className="text-xl font-bold text-gray-800">
                            Saved Question Papers
                        </h2>
                        <p className="text-sm text-gray-500 mt-2">
                            View, export to PDF, and print papers
                        </p>
                    </Link>

                </div>

                <div className="bg-white p-6 rounded shadow-md min-h-[400px]">
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <p className="text-center text-gray-500 mt-10">
                                    Select an option from above to begin.
                                </p>
                            }
                        />
                        <Route path="add-question" element={<AddQuestion />} />
                        <Route path="saved-papers" element={<SavedPapers />} />
                    </Routes>
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;