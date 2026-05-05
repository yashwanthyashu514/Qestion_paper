import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreatePaper = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [filters, setFilters] = useState({ class: '', level: '', type: '', chapter: '', concept: '' });
    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [previewQuestion, setPreviewQuestion] = useState(null);
    const [paperTitle, setPaperTitle] = useState('');

    const fetchFilteredQuestions = async () => {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await axios.get(`http://localhost:5000/api/questions?${queryParams}`);
            setQuestions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchFilteredQuestions();
    }, [filters]);

    const handleSelect = (q) => {
        if (!selectedQuestions.find(sq => sq._id === q._id)) {
            setSelectedQuestions([...selectedQuestions, q]);
        }
    };

    const handleDeselect = (id) => {
        setSelectedQuestions(selectedQuestions.filter(q => q._id !== id));
    };

    const handleSavePaper = async () => {
        if (!paperTitle || selectedQuestions.length === 0) {
            alert('Please provide a title and select at least one question.');
            return;
        }
        try {
            await axios.post('http://localhost:5000/api/papers', {
                title: paperTitle,
                classes: filters.class ? [filters.class] : [], // simplified
                questions: selectedQuestions.map(q => q._id)
            });
            alert('Paper saved successfully!');
            navigate('/teacher/dashboard/saved-papers');
        } catch (err) {
            alert('Failed to save paper');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <nav className="bg-blue-600 p-4 text-white flex justify-between items-center shadow-md">
                <h1 className="text-xl font-bold">Paper Builder - {user?.subject}</h1>
                <div className="space-x-4">
                    <button onClick={() => navigate(-1)} className="bg-gray-500 px-4 py-2 rounded hover:bg-gray-600">Back</button>
                    <button onClick={handleSavePaper} className="bg-green-500 px-4 py-2 rounded font-bold hover:bg-green-600">Save Paper</button>
                </div>
            </nav>

            <div className="p-4 bg-white shadow flex gap-4 items-center">
                <input type="text" placeholder="Paper Title" value={paperTitle} onChange={e=>setPaperTitle(e.target.value)} className="border p-2 rounded font-bold w-64" />
                <select onChange={e=>setFilters({...filters, class: e.target.value})} className="border p-2 rounded">
                    <option value="">All Classes</option>
                    <option value="11">Class 11</option><option value="12">Class 12</option>
                    <option value="JEE">JEE</option><option value="KCET">KCET</option><option value="NEET">NEET</option>
                </select>
                <select onChange={e=>setFilters({...filters, level: e.target.value})} className="border p-2 rounded">
                    <option value="">All Levels</option>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
                <select onChange={e=>setFilters({...filters, type: e.target.value})} className="border p-2 rounded">
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option><option value="1m">1 Mark</option>
                    <option value="2m">2 Marks</option><option value="3m">3 Marks</option>
                    <option value="4m">4 Marks</option><option value="5m">5 Marks</option>
                </select>
                <input type="text" placeholder="Chapter" onChange={e=>setFilters({...filters, chapter: e.target.value})} className="border p-2 rounded w-32" />
                <input type="text" placeholder="Concept" onChange={e=>setFilters({...filters, concept: e.target.value})} className="border p-2 rounded w-32" />
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel: Filtered Questions */}
                <div className="w-1/3 bg-white border-r overflow-y-auto p-4">
                    <h3 className="font-bold mb-4 text-gray-700">Available Questions ({questions.length})</h3>
                    <div className="space-y-3">
                        {questions.map(q => (
                            <div key={q._id} className="border p-3 rounded cursor-pointer hover:bg-blue-50 flex items-start gap-2"
                                 onClick={() => setPreviewQuestion(q)}>
                                <input type="checkbox" className="mt-1" 
                                    checked={selectedQuestions.some(sq => sq._id === q._id)}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        if (e.target.checked) handleSelect(q);
                                        else handleDeselect(q._id);
                                    }} 
                                />
                                <div className="text-sm text-gray-800 line-clamp-3">
                                    <span className="font-bold text-xs text-blue-600 mr-2">[{q.questionId}]</span>
                                    {q.questionText}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Panel: Preview */}
                <div className="w-1/3 bg-gray-50 border-r overflow-y-auto p-6">
                    <h3 className="font-bold mb-4 text-gray-700">Preview</h3>
                    {previewQuestion ? (
                        <div className="bg-white p-6 rounded shadow border">
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-bold">{previewQuestion.questionId}</span>
                                <div className="text-xs space-x-2 text-gray-500">
                                    <span className="bg-gray-200 px-2 py-1 rounded">{previewQuestion.level}</span>
                                    <span className="bg-gray-200 px-2 py-1 rounded">{previewQuestion.type}</span>
                                </div>
                            </div>
                            <p className="text-gray-800 font-medium whitespace-pre-wrap mb-4">{previewQuestion.questionText}</p>
                            {previewQuestion.type === 'MCQ' && previewQuestion.options && (
                                <ul className="space-y-2 text-sm text-gray-600">
                                    {previewQuestion.options.map((opt, i) => (
                                        <li key={i} className="bg-gray-50 p-2 rounded border">{String.fromCharCode(65+i)}. {opt}</li>
                                    ))}
                                </ul>
                            )}
                            {previewQuestion.answer && (
                                <div className="mt-4 pt-4 border-t text-sm">
                                    <span className="font-bold text-green-600">Answer:</span> {previewQuestion.answer}
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center mt-10">Click a question to preview</p>
                    )}
                </div>

                {/* Right Panel: Selected */}
                <div className="w-1/3 bg-white overflow-y-auto p-4">
                    <h3 className="font-bold mb-4 text-gray-700">Selected Questions ({selectedQuestions.length})</h3>
                    <div className="space-y-3">
                        {selectedQuestions.map((q, idx) => (
                            <div key={q._id} className="border p-3 rounded bg-blue-50 relative group">
                                <span className="absolute top-2 right-2 text-red-500 cursor-pointer hidden group-hover:block text-xs font-bold"
                                      onClick={() => handleDeselect(q._id)}>✕ Remove</span>
                                <p className="text-sm text-gray-800 pr-6"><span className="font-bold mr-2">{idx+1}.</span>{q.questionText}</p>
                            </div>
                        ))}
                        {selectedQuestions.length === 0 && <p className="text-gray-400 text-center text-sm">No questions selected.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePaper;
