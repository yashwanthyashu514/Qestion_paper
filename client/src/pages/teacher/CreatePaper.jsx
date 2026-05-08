import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { API_URL } from '../../api';

const CreatePaper = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [filters, setFilters] = useState({ class: '', level: '', type: '', chapter: '', concept: '' });
    const [questions, setQuestions] = useState([]);
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [previewQuestion, setPreviewQuestion] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [paperTitle, setPaperTitle] = useState('');
    const [allQuestions, setAllQuestions] = useState([]);
    const [showPatternModal, setShowPatternModal] = useState(false);
    const [pattern, setPattern] = useState([{ sectionName: 'Section A', numQuestions: '', type: '', description: '', marks: 0 }]);

    useEffect(() => {
        api.get('/api/questions').then(res => setAllQuestions(res.data)).catch(console.error);
    }, []);

    const uniqueChapters = [...new Set(allQuestions.map(q => q.chapter))].filter(Boolean);
    const uniqueConcepts = [...new Set(allQuestions.filter(q => !filters.chapter || q.chapter === filters.chapter).map(q => q.concept))].filter(Boolean);

    const fetchFilteredQuestions = async () => {
        try {
            const queryData = { ...filters };
            if (queryData.class) {
                queryData.classes = queryData.class;
                delete queryData.class;
            }
            const queryParams = new URLSearchParams(queryData).toString();
            const res = await api.get(`/api/questions?${queryParams}`);
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

    const handleAddSection = () => {
        const nextSectionName = `Section ${String.fromCharCode(65 + pattern.length)}`; // A, B, C...
        setPattern([...pattern, { sectionName: nextSectionName, numQuestions: '', type: '', description: '', marks: 0 }]);
    };

    const handleRemoveSection = (index) => {
        const newPattern = pattern.filter((_, i) => i !== index);
        const renamedPattern = newPattern.map((sec, i) => ({
            ...sec,
            sectionName: `Section ${String.fromCharCode(65 + i)}`
        }));
        setPattern(renamedPattern);
    };

    const handlePatternChange = (index, field, value) => {
        const newPattern = [...pattern];
        newPattern[index][field] = value;
        
        if (field === 'numQuestions' || field === 'type') {
            const num = field === 'numQuestions' ? parseInt(value) || 0 : parseInt(newPattern[index].numQuestions) || 0;
            const typeStr = field === 'type' ? value : newPattern[index].type;
            let multiplier = 0;
            if (typeStr === 'MCQ' || typeStr === '1m') multiplier = 1;
            else if (typeStr === '2m') multiplier = 2;
            else if (typeStr === '3m') multiplier = 3;
            else if (typeStr === '4m') multiplier = 4;
            else if (typeStr === '5m') multiplier = 5;
            
            newPattern[index].marks = num * multiplier;
        }
        setPattern(newPattern);
    };

    const handleSavePaper = async () => {
        if (!paperTitle || selectedQuestions.length === 0) {
            alert('Please provide a title and select at least one question.');
            return;
        }
        try {
            await api.post('/api/papers', {
                title: paperTitle,
                classes: filters.class ? [filters.class] : [], // simplified
                questions: selectedQuestions.map(q => q._id),
                pattern: (filters.class === '11' || filters.class === '12') ? pattern : []
            });
            alert('Paper saved successfully!');
            navigate('/teacher/dashboard/saved-papers');
        } catch (err) {
            alert('Failed to save paper');
        }
    };

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans animate-fade-in-up">
            {/* Top Navigation Bar - Dark Blue */}
            <nav className="bg-[#1e3280] p-4 text-white flex justify-between items-center z-10 rounded-t-lg mx-4 mt-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold tracking-wide">Paper Builder</h1>
                    <div className="border border-blue-400 bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {user?.subject || 'PHYSICS'}
                    </div>
                </div>
                <div className="space-x-3 flex items-center">
                    {(filters.class === '11' || filters.class === '12') && (
                        <button onClick={() => setShowPatternModal(true)} className="bg-transparent border border-blue-400 text-blue-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition">Pattern</button>
                    )}
                    <button onClick={() => navigate(-1)} className="bg-transparent border border-blue-400 text-blue-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition flex items-center gap-1">
                        <span>←</span> Back
                    </button>
                    <button onClick={handleSavePaper} className="bg-transparent border border-blue-400 text-blue-100 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/10 transition">
                        Save Paper
                    </button>
                </div>
            </nav>

            {/* Filter Bar */}
            <div className="px-6 py-4 bg-white border-b border-gray-200 flex flex-wrap gap-4 items-center z-0 mx-4 border-x">
                <input type="text" placeholder="Paper Title" value={paperTitle} onChange={e=>setPaperTitle(e.target.value)} className="border border-gray-300 p-2 rounded-lg font-medium w-48 text-sm focus:border-blue-500 outline-none" />
                
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mx-2">Filter</div>
                
                <select 
                    value={filters.class}
                    onChange={e => {
                        const val = e.target.value;
                        const newFilters = { ...filters, class: val };
                        if (['JEE', 'KCET', 'NEET'].includes(val)) {
                            newFilters.type = 'MCQ';
                        }
                        setFilters(newFilters);
                    }} 
                    className="border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                >
                    <option value="">All Classes</option>
                    <option value="11">Class 11</option><option value="12">Class 12</option>
                    <option value="JEE">JEE</option><option value="KCET">KCET</option><option value="NEET">NEET</option>
                </select>
                <select 
                    value={filters.level}
                    onChange={e=>setFilters({...filters, level: e.target.value})} 
                    className="border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                >
                    <option value="">All Levels</option>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
                <select 
                    value={filters.type}
                    onChange={e=>setFilters({...filters, type: e.target.value})} 
                    className="border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 outline-none shadow-sm cursor-pointer"
                    disabled={['JEE', 'KCET', 'NEET'].includes(filters.class)}
                >
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option><option value="1m">1 Mark</option>
                    <option value="2m">2 Marks</option><option value="3m">3 Marks</option>
                    <option value="4m">4 Marks</option><option value="5m">5 Marks</option>
                </select>
                <select value={filters.chapter} onChange={e=>setFilters({...filters, chapter: e.target.value, concept: ''})} className="border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 outline-none shadow-sm cursor-pointer w-40">
                    <option value="">All Chapters</option>
                    {uniqueChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>
                <select value={filters.concept} onChange={e=>setFilters({...filters, concept: e.target.value})} className="border border-gray-300 p-2 rounded-lg text-sm text-gray-700 bg-white focus:border-blue-500 outline-none shadow-sm cursor-pointer w-40">
                    <option value="">All Concepts</option>
                    {uniqueConcepts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            {/* Three Columns Workspace */}
            <div className="flex-1 flex gap-6 overflow-hidden p-6 mx-4 mb-4 border-x border-b border-gray-200 bg-[#f8fafc] rounded-b-lg">
                
                {/* Left Panel: Available Questions */}
                <div className="w-1/3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase">Available Questions</h3>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                            {questions.filter(q => q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || (q.questionId && q.questionId.toLowerCase().includes(searchQuery.toLowerCase()))).length}
                        </span>
                    </div>
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full border border-gray-200 pl-9 pr-3 py-2 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {questions.filter(q => q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || (q.questionId && q.questionId.toLowerCase().includes(searchQuery.toLowerCase()))).map(q => (
                            <div key={q._id} className={`border p-4 rounded-xl cursor-pointer transition flex items-start gap-3 ${selectedQuestions.some(sq => sq._id === q._id) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                 onClick={() => setPreviewQuestion(q)}>
                                <div className="mt-0.5">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        checked={selectedQuestions.some(sq => sq._id === q._id)}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            if (e.target.checked) handleSelect(q);
                                            else handleDeselect(q._id);
                                        }} 
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className="font-semibold text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{q.questionId}</span>
                                        <span className="font-semibold text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">{q.type}</span>
                                        <span className={`font-semibold text-[10px] px-2 py-1 rounded-md border ${q.level === 'hard' ? 'bg-orange-50 text-orange-700 border-orange-100' : q.level === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{q.level}</span>
                                    </div>
                                    <div className="text-sm text-gray-700 line-clamp-3 font-medium">
                                        {q.questionText}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {questions.filter(q => q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) || (q.questionId && q.questionId.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 && (
                            <div className="text-center p-8">
                                <p className="text-gray-400 text-sm">No matching questions found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Panel: Preview */}
                <div className="w-1/3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase">Preview</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                        {previewQuestion ? (
                            <div className="animate-fade-in-up">
                                <div className="flex gap-2 mb-4">
                                    <span className="font-semibold text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md border border-blue-100">{previewQuestion.questionId}</span>
                                    <span className="font-semibold text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-md border border-gray-200">Class: {previewQuestion.classes.join(',')}</span>
                                    <span className="font-semibold text-xs bg-green-50 text-green-700 px-2 py-1 rounded-md border border-green-100">{previewQuestion.type}</span>
                                </div>
                                <p className="text-gray-800 font-medium whitespace-pre-wrap mb-6 text-sm leading-relaxed">{previewQuestion.questionText}</p>
                                {previewQuestion.imageUrl && (
                                    <div className="mb-6">
                                        <img src={`${API_URL}${previewQuestion.imageUrl}`} alt="Question Reference" className="max-w-full rounded border border-gray-200" />
                                    </div>
                                )}
                                {previewQuestion.type === 'MCQ' && previewQuestion.options && (
                                    <ul className="space-y-3 text-sm text-gray-600 mb-6">
                                        {previewQuestion.options.map((opt, i) => (
                                            <li key={i} className="flex items-center gap-3 font-medium">
                                                <span className="bg-gray-100 w-6 h-6 flex items-center justify-center rounded-full text-gray-500 font-bold text-xs">{String.fromCharCode(65+i)}</span> 
                                                {opt}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {previewQuestion.answer && (
                                    <div className="mt-auto pt-4 border-t border-gray-100 text-sm bg-gray-50 p-4 rounded-xl">
                                        <span className="font-bold text-gray-700 block mb-1">Answer / Marking Scheme:</span> 
                                        <span className="text-gray-600">{previewQuestion.answer}</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                                <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4 bg-gray-50">
                                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 font-medium text-sm">Select a question to preview</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Selected */}
                <div className="w-1/3 bg-white border border-gray-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
                    <div className="flex justify-between items-center p-5 border-b border-gray-100">
                        <h3 className="font-bold text-gray-400 text-xs tracking-widest uppercase">Selected</h3>
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold">{selectedQuestions.length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {selectedQuestions.map((q, idx) => (
                            <div key={q._id} className="border border-gray-100 p-4 rounded-xl bg-gray-50 relative group flex gap-3">
                                <div className="font-bold text-gray-400 text-xs mt-0.5">{idx+1}.</div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-700 font-medium leading-relaxed pr-6">{q.questionText}</p>
                                    {q.imageUrl && (
                                        <div className="mt-2">
                                            <img src={`${API_URL}${q.imageUrl}`} alt="Question Reference" className="max-w-full rounded border border-gray-200 max-h-32 object-contain" />
                                        </div>
                                    )}
                                </div>
                                <button className="absolute top-3 right-3 text-red-400 hover:text-red-600 cursor-pointer hidden group-hover:block transition"
                                      onClick={() => handleDeselect(q._id)}>
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                        {selectedQuestions.length === 0 && (
                            <div className="flex-1 h-full flex flex-col items-center justify-center text-gray-300 min-h-[300px]">
                                <div className="mb-4 text-4xl text-gray-200">
                                    <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                </div>
                                <p className="text-gray-400 font-medium text-sm">No questions selected</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showPatternModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md animate-fade-in-up">
                    <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col transform transition-all border border-gray-100">
                        <div className="flex justify-between items-start mb-6 pb-5 border-b border-gray-100">
                            <div>
                                <h2 className="text-2xl font-black text-[#1e3280] tracking-tight mb-1">Configure Paper Pattern</h2>
                                <p className="text-sm text-gray-500 font-medium">Define sections, question counts, and instructions for this assessment.</p>
                            </div>
                            <button onClick={() => setShowPatternModal(false)} className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-full w-9 h-9 flex items-center justify-center text-xl transition-colors font-bold shadow-sm border border-gray-100 hover:border-red-200">×</button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-5 mb-6 pr-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
                            {pattern.map((sec, idx) => (
                                <div key={idx} className="flex flex-col md:flex-row gap-5 items-start md:items-center border border-gray-100 p-5 rounded-2xl bg-[#f8fafc] shadow-sm relative group hover:shadow-md transition-shadow border-l-4 border-l-[#1e3280]">
                                    
                                    <div className="flex items-center gap-3 w-full md:w-auto">
                                        <div className="font-black text-sm text-[#1e3280] bg-white px-5 py-3 rounded-xl border border-blue-100 text-center tracking-widest uppercase shadow-sm whitespace-nowrap min-w-[120px]">
                                            {sec.sectionName}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap md:flex-nowrap gap-4 w-full items-center">
                                        <div className="relative group/input">
                                            <label className="absolute -top-2 left-3 bg-[#f8fafc] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider group-focus-within/input:text-[#1e3280] transition-colors">Questions</label>
                                            <input type="number" placeholder="Qty" value={sec.numQuestions} onChange={(e) => handlePatternChange(idx, 'numQuestions', e.target.value)} className="border border-gray-200 p-3 rounded-xl w-24 text-sm font-bold text-gray-700 outline-none text-center focus:border-[#1e3280] focus:ring-2 focus:ring-blue-100 transition bg-white shadow-sm placeholder-gray-300" min="1" />
                                        </div>
                                        
                                        <div className="relative group/input">
                                            <label className="absolute -top-2 left-3 bg-[#f8fafc] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider group-focus-within/input:text-[#1e3280] transition-colors">Type</label>
                                            <select value={sec.type} onChange={(e) => handlePatternChange(idx, 'type', e.target.value)} className="border border-gray-200 p-3 rounded-xl w-36 text-sm font-bold text-gray-700 outline-none focus:border-[#1e3280] focus:ring-2 focus:ring-blue-100 transition bg-white shadow-sm appearance-none cursor-pointer">
                                                <option value="" disabled>Select Type</option>
                                                <option value="MCQ">MCQ</option>
                                                <option value="1m">1 Mark</option>
                                                <option value="2m">2 Marks</option>
                                                <option value="3m">3 Marks</option>
                                                <option value="4m">4 Marks</option>
                                                <option value="5m">5 Marks</option>
                                            </select>
                                        </div>

                                        <div className="relative flex-1 group/input">
                                            <label className="absolute -top-2 left-3 bg-[#f8fafc] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider group-focus-within/input:text-[#1e3280] transition-colors">Instructions</label>
                                            <input type="text" placeholder="e.g. Answer any 5 of the following..." value={sec.description} onChange={(e) => handlePatternChange(idx, 'description', e.target.value)} className="border border-gray-200 p-3 rounded-xl w-full text-sm font-medium text-gray-700 outline-none focus:border-[#1e3280] focus:ring-2 focus:ring-blue-100 transition bg-white shadow-sm placeholder-gray-300" />
                                        </div>

                                        <div className="flex items-center justify-center bg-green-50 border border-green-200 px-5 py-2.5 rounded-xl shadow-inner min-w-[110px]">
                                            <span className="font-bold text-[11px] text-green-700 uppercase tracking-widest flex flex-col items-center leading-tight">
                                                Total Marks
                                                <span className="text-xl mt-0.5">{sec.marks}</span>
                                            </span>
                                        </div>
                                    </div>

                                    {pattern.length > 1 && (
                                        <button onClick={() => handleRemoveSection(idx)} className="absolute -top-3 -right-3 bg-white border border-gray-200 text-red-500 hover:text-white w-8 h-8 rounded-full font-bold shadow-md hover:bg-red-500 hover:border-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-sm z-10" title="Remove Section">✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="flex justify-between items-center mt-2 pt-6 border-t border-gray-100 bg-white">
                            <button onClick={handleAddSection} className="flex items-center gap-2 text-[#1e3280] bg-blue-50 hover:bg-[#1e3280] hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm">
                                <span className="text-lg leading-none">+</span> Add New Section
                            </button>
                            <button onClick={() => setShowPatternModal(false)} className="bg-gradient-to-r from-[#1e3280] to-blue-700 text-white px-8 py-3.5 rounded-xl font-bold hover:shadow-lg hover:from-blue-900 hover:to-blue-800 transition-all text-sm tracking-wide flex items-center gap-2">
                                Confirm & Save Pattern
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePaper;
