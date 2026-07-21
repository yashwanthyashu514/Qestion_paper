import React, { useState, useEffect } from 'react';
import api from '../../api';

const AdminQuestionBank = () => {
    const [questions, setQuestions] = useState([]);
    const [filters, setFilters] = useState({
        examType: '',
        subject: '',
        classes: '',
        academicYearLevel: '',
        chapter: '',
        concept: '',
        subConcept: '',
        level: '',
        type: '',
        sourceType: ''
    });

    const [uniqueChapters, setUniqueChapters] = useState([]);
    const [uniqueConcepts, setUniqueConcepts] = useState([]);
    const [uniqueSubConcepts, setUniqueSubConcepts] = useState([]);

    const fetchQuestions = async () => {
        try {
            const queryParams = new URLSearchParams();
            Object.keys(filters).forEach(key => {
                if (filters[key]) queryParams.append(key, filters[key]);
            });
            const res = await api.get(`/api/questions?${queryParams.toString()}`);
            setQuestions(res.data);

            // Populate cascade metadata
            const chs = [...new Set(res.data.map(q => q.chapter))].filter(Boolean);
            setUniqueChapters(chs);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, [filters]);

    // Handle cascade filters
    const handleChapterChange = (chapterVal) => {
        setFilters(prev => ({
            ...prev,
            chapter: chapterVal,
            concept: '',
            subConcept: ''
        }));
        const matchingQs = questions.filter(q => q.chapter === chapterVal);
        setUniqueConcepts([...new Set(matchingQs.map(q => q.concept))].filter(Boolean));
    };

    const handleConceptChange = (conceptVal) => {
        setFilters(prev => ({
            ...prev,
            concept: conceptVal,
            subConcept: ''
        }));
        const matchingQs = questions.filter(q => q.chapter === filters.chapter && q.concept === conceptVal);
        setUniqueSubConcepts([...new Set(matchingQs.map(q => q.subConcept))].filter(Boolean));
    };

    const handleClearFilters = () => {
        setFilters({
            examType: '',
            subject: '',
            classes: '',
            academicYearLevel: '',
            chapter: '',
            concept: '',
            subConcept: '',
            level: '',
            type: '',
            sourceType: ''
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            try {
                await api.delete(`/api/questions/${id}`);
                fetchQuestions();
            } catch (err) {
                alert('Failed to delete question');
            }
        }
    };

    return (
        <div className="bg-surface p-10 rounded-[2.5rem] shadow-sm border border-gray-100 animate-fade-in-up space-y-8">
            <div>
                <h2 className="text-3xl font-black text-navy uppercase tracking-tight mb-2">Unified Question Bank</h2>
                <p className="text-[10px] font-black text-slate/40 uppercase tracking-[0.2em] ml-1">Central Repository Control & Taxonomy Mapping</p>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.examType} onChange={e => setFilters({...filters, examType: e.target.value})}>
                    <option value="">All Exams</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="CET">CET</option>
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.subject} onChange={e => setFilters({...filters, subject: e.target.value})}>
                    <option value="">All Subjects</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Maths">Maths</option>
                    <option value="Biology">Biology</option>
                    <option value="Botany">Botany</option>
                    <option value="Zoology">Zoology</option>
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.level} onChange={e => setFilters({...filters, level: e.target.value})}>
                    <option value="">All Levels</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})}>
                    <option value="">All Types</option>
                    <option value="MCQ">MCQ</option>
                    <option value="ASSERTION_REASON">Assertion & Reason</option>
                    <option value="STATEMENT_BASED">Statement-Based</option>
                    <option value="TRUE_FALSE">True or False</option>
                    <option value="MATCH_FOLLOWING">Match the Following</option>
                    <option value="DIAGRAM_BASED">Diagram-Oriented</option>
                    <option value="NUMERICAL">Numerical</option>
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.sourceType} onChange={e => setFilters({...filters, sourceType: e.target.value})}>
                    <option value="">All Sources</option>
                    <option value="REGULAR">Regular (Manual)</option>
                    <option value="GT">Grand Test (GT)</option>
                    <option value="PYQ">Previous Year (PYQ)</option>
                </select>

                {/* Cascade Taxonomy */}
                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.chapter} onChange={e => handleChapterChange(e.target.value)}>
                    <option value="">All Chapters</option>
                    {uniqueChapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.concept} onChange={e => handleConceptChange(e.target.value)} disabled={!filters.chapter}>
                    <option value="">All Concepts</option>
                    {uniqueConcepts.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <select className="border border-gray-200 p-3 rounded-xl text-xs bg-white font-bold" value={filters.subConcept} onChange={e => setFilters({...filters, subConcept: e.target.value})} disabled={!filters.concept}>
                    <option value="">All Sub-concepts</option>
                    {uniqueSubConcepts.map(sc => <option key={sc} value={sc}>{sc}</option>)}
                </select>

                <button onClick={handleClearFilters} className="col-span-2 bg-navy text-gold py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md">
                    Clear Filters
                </button>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 gap-6">
                <p className="text-sm font-bold text-navy">Matches Found: <span className="text-gold font-black">{questions.length}</span></p>
                {questions.map(q => (
                    <div key={q._id} className="border border-gray-200 p-6 rounded-3xl shadow-sm bg-white relative group hover:shadow-md transition">
                        <button onClick={() => handleDelete(q._id)} className="absolute top-4 right-4 text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest hidden group-hover:block transition">
                            Delete
                        </button>
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="bg-navy/5 text-navy text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">{q.questionId}</span>
                            <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">Subject: {q.subject}</span>
                            <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">Class: {q.classes.join(', ')}</span>
                            <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">Type: {q.type}</span>
                            <span className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-3 py-1 rounded-full">Level: {q.level}</span>
                            <span className="text-[10px] font-semibold text-gold bg-navy px-3 py-1 rounded-full uppercase tracking-wider">{q.sourceType} {q.sourceDisplayCode ? `(${q.sourceDisplayCode})` : ''}</span>
                        </div>

                        {/* Rendering formats based on questionType */}
                        {q.type === 'ASSERTION_REASON' ? (
                            <div className="space-y-2 mt-2 text-base text-gray-900 font-medium">
                                <p><strong>Assertion (A):</strong> {q.assertion}</p>
                                <p><strong>Reason (R):</strong> {q.reason}</p>
                            </div>
                        ) : q.type === 'STATEMENT_BASED' ? (
                            <div className="space-y-2 mt-2 text-base text-gray-900 font-medium">
                                <p dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                                {q.statements?.map((stmt, idx) => (
                                    <p key={idx}><strong>Statement {idx+1}:</strong> {stmt}</p>
                                ))}
                            </div>
                        ) : q.type === 'MATCH_FOLLOWING' ? (
                            <div className="space-y-2 mt-2 text-base text-gray-900 font-medium">
                                <p dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50 max-w-md">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr>
                                                <th className="text-left font-bold pb-2">Column A</th>
                                                <th className="text-left font-bold pb-2">Column B</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {q.matchPairs?.map((pair, idx) => (
                                                <tr key={idx}>
                                                    <td className="py-1">{String.fromCharCode(65+idx)}. {pair.left}</td>
                                                    <td className="py-1">{idx+1}. {pair.right}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-2 text-base text-gray-900 font-medium whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                        )}

                        {q.imageUrl && (
                            <div className="mt-3">
                                <img src={q.imageUrl} alt="Reference" className="max-h-48 rounded border border-gray-200" />
                            </div>
                        )}
                        
                        {(q.type === 'MCQ' || q.type === 'DIAGRAM_BASED' || q.type === 'ASSERTION_REASON' || q.type === 'STATEMENT_BASED' || q.type === 'MATCH_FOLLOWING') && q.options && q.options.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                                {q.options.map((opt, idx) => (
                                    <div key={idx} className="flex"><strong className="mr-1">{String.fromCharCode(65+idx)})</strong> <span dangerouslySetInnerHTML={{ __html: opt }}></span></div>
                                ))}
                            </div>
                        )}

                        <div className="mt-3 text-sm font-bold text-gray-700">
                            Correct Answer: <span className="text-navy">{q.answer}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminQuestionBank;
