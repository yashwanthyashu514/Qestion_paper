import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { exportToWord } from '../../utils/exportWord';

// Simple Toast Notification Component
const Toast = ({ msg, type, onClose }) => {
    useEffect(() => {
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [onClose]);

    const colors = type === 'success'
        ? 'bg-green-50 border-green-300 text-green-800'
        : type === 'error'
            ? 'bg-red-50 border-red-300 text-red-800'
            : 'bg-blue-50 border-blue-300 text-blue-800';

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-lg text-sm font-semibold animate-fade-in-up ${colors}`}>
            {type === 'success' && <span>✓</span>}
            {type === 'error' && <span>✕</span>}
            {type === 'info' && <span>ℹ</span>}
            {msg}
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 text-lg leading-none">×</button>
        </div>
    );
};

export default function QuestionPaperGenerator() {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'info') => setToast({ msg, type });

    // Data lists
    const [allQuestions, setAllQuestions] = useState([]);
    const [standardPapers, setStandardPapers] = useState([]);
    const [grandTests, setGrandTests] = useState([]);
    const [pyqPapers, setPyqPapers] = useState([]);
    const [patterns, setPatterns] = useState([]);
    const [templates, setTemplates] = useState([]);

    // Selection sources for generator
    const [selectedSources, setSelectedSources] = useState({
        repository: true,
        grandTests: false,
        pyqs: false
    });

    // Loading states
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [loadingPapers, setLoadingPapers] = useState(false);

    // Fetch initial data
    const fetchData = async () => {
        setLoadingQuestions(true);
        setLoadingPapers(true);
        try {
            const [qRes, papersRes, patternsRes, templatesRes] = await Promise.all([
                api.get('/api/questions'),
                api.get('/api/papers'),
                api.get('/api/patterns'),
                api.get('/api/templates')
            ]);
            setAllQuestions(qRes.data);
            
            // Categorize papers
            const allPapers = papersRes.data;
            setStandardPapers(allPapers.filter(p => p.paperType === 'Standard' || !p.paperType));
            setGrandTests(allPapers.filter(p => p.paperType === 'GrandTest'));
            setPyqPapers(allPapers.filter(p => p.paperType === 'PYQ'));
            
            setPatterns(patternsRes.data);
            setTemplates(templatesRes.data);
        } catch (err) {
            console.error('Error fetching data:', err);
            showToast('Failed to fetch generator data.', 'error');
        } finally {
            setLoadingQuestions(false);
            setLoadingPapers(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Dashboard
    // ─────────────────────────────────────────────────────────────────────────
    const renderDashboard = () => {
        const stats = [
            { label: 'Repository Questions', value: allQuestions.length, icon: '📚', color: 'border-blue-500 text-blue-600' },
            { label: 'Saved Papers', value: standardPapers.length, icon: '📄', color: 'border-green-500 text-green-600' },
            { label: 'Grand Tests (GT)', value: grandTests.length, icon: '🏆', color: 'border-gold text-gold' },
            { label: 'Previous Year Papers', value: pyqPapers.length, icon: '🕰️', color: 'border-purple-500 text-purple-600' }
        ];

        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-surface p-8 rounded-3xl shadow-sm border-l-8 border-navy relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full -mr-16 -mt-16"></div>
                    <h3 className="font-black text-2xl text-navy mb-2">Question Paper Generation Control Center</h3>
                    <p className="text-slate/70 font-medium text-sm max-w-2xl leading-relaxed">
                        Generate institute-level mock exams, manage Grand Tests with version revisions, parse and index Previous Year Papers using Gemini AI, and build reusable exam templates.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {stats.map(s => (
                        <div key={s.label} className={`bg-surface p-6 rounded-3xl border-t-4 ${s.color} shadow-sm flex flex-col justify-between h-40`}>
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-black tracking-wider text-slate/50 uppercase">{s.label}</span>
                                <span className="text-3xl">{s.icon}</span>
                            </div>
                            <span className="text-4xl font-black text-navy">{s.value}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                    <h4 className="font-black text-navy text-lg">Quick Actions</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <button onClick={() => setActiveTab('generate')} className="bg-navy hover:bg-navy/90 text-gold font-black p-6 rounded-2xl transition text-left flex flex-col justify-between h-32 shadow-md hover:-translate-y-1 transform">
                            <span className="text-xl">⚡</span>
                            <span>Generate Question Paper</span>
                        </button>
                        <button onClick={() => setActiveTab('pyq')} className="bg-gold hover:bg-gold/90 text-navy font-black p-6 rounded-2xl transition text-left flex flex-col justify-between h-32 shadow-md hover:-translate-y-1 transform">
                            <span className="text-xl">🤖</span>
                            <span>Upload & Parse PYQ</span>
                        </button>
                        <button onClick={() => setActiveTab('patterns')} className="bg-white hover:border-navy text-navy border border-gray-200 font-black p-6 rounded-2xl transition text-left flex flex-col justify-between h-32 shadow-md hover:-translate-y-1 transform">
                            <span className="text-xl">📋</span>
                            <span>Create Exam Patterns</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Generate Paper
    // ─────────────────────────────────────────────────────────────────────────
    const [genMode, setGenMode] = useState('auto'); // 'auto' or 'manual'
    const [paperTitle, setPaperTitle] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedClasses, setSelectedClasses] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedExamType, setSelectedExamType] = useState('Custom');
    const [isSavingPaper, setIsSavingPaper] = useState(false);

    // Filters for Question Search (Manual Mode)
    const [genFilters, setGenFilters] = useState({
        subject: '',
        class: '',
        chapter: '',
        concept: '',
        level: '',
        type: ''
    });

    // Auto Mode template selection
    const [selectedPatternId, setSelectedPatternId] = useState('');

    // Selected questions in current builder
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [previewQuestion, setPreviewQuestion] = useState(null);

    // List of questions available based on active sources & filters
    const getQuestionsPool = () => {
        let pool = [];
        
        if (selectedSources.repository) {
            pool = [...allQuestions];
        }
        if (selectedSources.grandTests) {
            grandTests.forEach(gt => {
                gt.questions.forEach(q => {
                    if (!pool.some(pq => pq._id === q._id)) pool.push(q);
                });
            });
        }
        if (selectedSources.pyqs) {
            pyqPapers.forEach(pyq => {
                pyq.questions.forEach(q => {
                    if (!pool.some(pq => pq._id === q._id)) pool.push(q);
                });
            });
        }

        // Apply filters
        return pool.filter(q => {
            if (genFilters.subject && q.subject !== genFilters.subject) return false;
            if (genFilters.class && !q.classes?.includes(genFilters.class)) return false;
            if (genFilters.chapter && q.chapter !== genFilters.chapter) return false;
            if (genFilters.concept && q.concept !== genFilters.concept) return false;
            if (genFilters.level && q.level !== genFilters.level) return false;
            if (genFilters.type && q.type !== genFilters.type) return false;
            return true;
        });
    };

    const questionsPool = getQuestionsPool();

    // Unique filter dropdown option selectors
    const uniqueSubjects = [...new Set(allQuestions.map(q => q.subject))].filter(Boolean);
    const uniqueChapters = [...new Set(allQuestions.filter(q => !genFilters.subject || q.subject === genFilters.subject).map(q => q.chapter))].filter(Boolean);
    const uniqueConcepts = [...new Set(allQuestions.filter(q => !genFilters.chapter || q.chapter === genFilters.chapter).map(q => q.concept))].filter(Boolean);
    const uniqueTypes = ['MCQ', 'Assertion & Reason', 'Statement Based', 'True / False', 'Match the Following', 'Numerical', 'Diagram Based', '1m', '2m', '3m', '4m', '5m'];

    // Move question up/down in selected list
    const moveQuestion = (index, direction) => {
        const updated = [...selectedQuestions];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= updated.length) return;
        
        // Swap
        const temp = updated[index];
        updated[index] = updated[targetIndex];
        updated[targetIndex] = temp;
        setSelectedQuestions(updated);
    };

    // Auto generation runner
    const handleAutoGenerate = () => {
        const pattern = patterns.find(p => p._id === selectedPatternId);
        if (!pattern) {
            alert('Please select an exam pattern blueprint.');
            return;
        }

        let newSelected = [];
        const pool = [...allQuestions];

        pattern.sections.forEach(sec => {
            // Find questions matching section type & subject
            let matches = pool.filter(q => {
                const typeMatches = q.type === sec.type;
                const subjectMatches = !sec.subject || q.subject.toLowerCase() === sec.subject.toLowerCase();
                const notAlreadySelected = !newSelected.some(sq => sq._id === q._id);
                return typeMatches && subjectMatches && notAlreadySelected;
            });

            // Randomize
            matches.sort(() => Math.random() - 0.5);

            // Add required count
            const picked = matches.slice(0, sec.numQuestions);
            newSelected = [...newSelected, ...picked];

            if (picked.length < sec.numQuestions) {
                showToast(`Could only find ${picked.length}/${sec.numQuestions} questions for section: ${sec.sectionName}`, 'info');
            }
        });

        setSelectedQuestions(newSelected);
        showToast(`Auto generated paper template with ${newSelected.length} questions.`, 'success');
    };

    const handleSaveGeneratedPaper = async (paperTypeOverride = 'Standard') => {
        if (!paperTitle) {
            alert('Please provide a paper title.');
            return;
        }
        if (selectedQuestions.length === 0) {
            alert('Please select or generate at least one question.');
            return;
        }

        setIsSavingPaper(true);
        try {
            const paperData = {
                title: paperTitle,
                subject: selectedSubject || 'General',
                classes: selectedClasses ? selectedClasses.split(',').map(s => s.trim()) : ['General'],
                questions: selectedQuestions.map(q => q._id),
                paperType: paperTypeOverride,
                examType: selectedExamType,
                year: selectedYear,
                status: 'Approved'
            };

            await api.post('/api/papers', paperData);
            showToast(`${paperTypeOverride === 'GrandTest' ? 'Grand Test' : 'Question Paper'} saved successfully!`, 'success');
            
            // reset builder
            setPaperTitle('');
            setSelectedQuestions([]);
            fetchData();
            setActiveTab(paperTypeOverride === 'GrandTest' ? 'grandtests' : 'savedpapers');
        } catch (err) {
            console.error(err);
            showToast('Failed to save paper.', 'error');
        } finally {
            setIsSavingPaper(false);
        }
    };

    const renderGeneratePaper = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-center bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="font-black text-2xl text-navy">Question Paper Generation Engine</h3>
                        <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">Assemble papers automatically via patterns or pick manually</p>
                    </div>
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setGenMode('auto')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${genMode === 'auto' ? 'bg-navy text-gold shadow-md' : 'text-slate/60 hover:text-navy'}`}
                        >
                            Auto Blueprint
                        </button>
                        <button
                            onClick={() => setGenMode('manual')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition ${genMode === 'manual' ? 'bg-navy text-gold shadow-md' : 'text-slate/60 hover:text-navy'}`}
                        >
                            Manual Build
                        </button>
                    </div>
                </div>

                {/* Configuration Panel */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left 2 cols: Main Builder workspace */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Meta inputs */}
                        <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Paper Title</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. NEET GT-1 / JEE Practice Paper"
                                        value={paperTitle}
                                        onChange={e => setPaperTitle(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold text-navy outline-none focus:border-navy transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Subject</label>
                                    <select
                                        value={selectedSubject}
                                        onChange={e => setSelectedSubject(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold text-navy outline-none focus:border-navy transition"
                                    >
                                        <option value="">Select Subject</option>
                                        {uniqueSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Classes (Comma Separated)</label>
                                    <input 
                                        type="text" 
                                        placeholder="e.g. NEET, JEE, 12"
                                        value={selectedClasses}
                                        onChange={e => setSelectedClasses(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold text-navy outline-none focus:border-navy transition"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Exam Type Preset</label>
                                    <select
                                        value={selectedExamType}
                                        onChange={e => setSelectedExamType(e.target.value)}
                                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold text-navy outline-none focus:border-navy transition"
                                    >
                                        <option value="Custom">Custom</option>
                                        <option value="NEET">NEET</option>
                                        <option value="JEE">JEE</option>
                                        <option value="KCET">KCET</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Academic Year</label>
                                    <input 
                                        type="number" 
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                                        className="w-full border-2 border-gray-100 p-4 rounded-2xl text-sm font-bold text-navy outline-none focus:border-navy transition"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Question Selector Area */}
                        {genMode === 'auto' ? (
                            <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-black text-navy text-sm uppercase tracking-widest">Select Exam Pattern Blueprint</h4>
                                    <button onClick={() => setActiveTab('patterns')} className="text-xs text-navy border-b border-navy font-bold">Manage Blueprints</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {patterns.map(p => (
                                        <div 
                                            key={p._id}
                                            onClick={() => setSelectedPatternId(p._id)}
                                            className={`border-2 p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between h-36 hover:border-navy ${selectedPatternId === p._id ? 'border-navy bg-navy/5 shadow-md' : 'border-gray-100 bg-white'}`}
                                        >
                                            <div>
                                                <h5 className="font-bold text-navy text-base">{p.name}</h5>
                                                <p className="text-slate/60 text-xs mt-1">{p.description}</p>
                                            </div>
                                            <span className="bg-gold/10 text-gold border border-gold/20 px-3 py-1 rounded-full text-xs font-black self-start">
                                                {p.sections.reduce((s, sec) => s + sec.numQuestions, 0)} Questions
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={handleAutoGenerate}
                                    disabled={!selectedPatternId}
                                    className="w-full bg-gold text-navy font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-xs transition hover:scale-105 active:scale-95 disabled:opacity-40 disabled:grayscale"
                                >
                                    Assemble Questions by Template Blueprint
                                </button>
                            </div>
                        ) : (
                            <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                                    <h4 className="font-black text-navy text-sm uppercase tracking-widest">Pick Questions from Repository</h4>
                                    
                                    {/* Question Source selector panel */}
                                    <div className="flex items-center gap-4 text-xs font-bold text-navy">
                                        <span className="opacity-50">Sources:</span>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedSources.repository} 
                                                onChange={e => setSelectedSources({ ...selectedSources, repository: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer"
                                            />
                                            Repo
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedSources.grandTests} 
                                                onChange={e => setSelectedSources({ ...selectedSources, grandTests: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer"
                                            />
                                            Grand Tests
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedSources.pyqs} 
                                                onChange={e => setSelectedSources({ ...selectedSources, pyqs: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer"
                                            />
                                            PYQs
                                        </label>
                                    </div>
                                </div>

                                {/* Filters */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate/50 uppercase tracking-widest block">Subject</label>
                                        <select
                                            value={genFilters.subject}
                                            onChange={e => setGenFilters({ ...genFilters, subject: e.target.value, chapter: '', concept: '' })}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-navy bg-white outline-none focus:border-navy"
                                        >
                                            <option value="">All Subjects</option>
                                            {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate/50 uppercase tracking-widest block">Class</label>
                                        <select
                                            value={genFilters.class}
                                            onChange={e => setGenFilters({ ...genFilters, class: e.target.value })}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-navy bg-white outline-none focus:border-navy"
                                        >
                                            <option value="">All Classes</option>
                                            <option value="11">Class 11</option>
                                            <option value="12">Class 12</option>
                                            <option value="JEE">JEE</option>
                                            <option value="KCET">KCET</option>
                                            <option value="NEET">NEET</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate/50 uppercase tracking-widest block">Chapter</label>
                                        <select
                                            value={genFilters.chapter}
                                            onChange={e => setGenFilters({ ...genFilters, chapter: e.target.value, concept: '' })}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-navy bg-white outline-none focus:border-navy"
                                        >
                                            <option value="">All Chapters</option>
                                            {uniqueChapters.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate/50 uppercase tracking-widest block">Question Type</label>
                                        <select
                                            value={genFilters.type}
                                            onChange={e => setGenFilters({ ...genFilters, type: e.target.value })}
                                            className="w-full border border-gray-200 p-2.5 rounded-xl text-xs font-bold text-navy bg-white outline-none focus:border-navy"
                                        >
                                            <option value="">All Types</option>
                                            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Question Availability Panel */}
                                <div className="bg-[#1e3280]/5 border border-[#1e3280]/15 rounded-2xl p-4 flex justify-between items-center text-xs font-bold text-[#1e3280]">
                                    <span>Real-Time Availability Indicator:</span>
                                    <span className="bg-[#1e3280] text-white px-3 py-1 rounded-full">{questionsPool.length} Match(es) found</span>
                                </div>

                                {/* Questions List */}
                                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2">
                                    {questionsPool.map(q => {
                                        const isSelected = selectedQuestions.some(sq => sq._id === q._id);
                                        return (
                                            <div 
                                                key={q._id} 
                                                onClick={() => setPreviewQuestion(q)}
                                                className={`border p-4 rounded-xl cursor-pointer transition flex items-start gap-4 ${isSelected ? 'border-navy bg-navy/5' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                                            >
                                                <input 
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={e => {
                                                        e.stopPropagation();
                                                        if (e.target.checked) {
                                                            setSelectedQuestions([...selectedQuestions, q]);
                                                        } else {
                                                            setSelectedQuestions(selectedQuestions.filter(sq => sq._id !== q._id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer mt-0.5"
                                                />
                                                <div className="flex-1">
                                                    <div className="flex gap-2 mb-2 flex-wrap">
                                                        <span className="bg-navy/5 text-navy font-bold text-[9px] px-2 py-0.5 rounded border border-navy/10">{q.questionId}</span>
                                                        <span className="bg-green-50 text-green-700 font-bold text-[9px] px-2 py-0.5 rounded border border-green-200">{q.type}</span>
                                                        <span className="bg-purple-50 text-purple-700 font-bold text-[9px] px-2 py-0.5 rounded border border-purple-200">{q.subject}</span>
                                                    </div>
                                                    <p className="text-xs text-slate font-medium line-clamp-2" dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {questionsPool.length === 0 && (
                                        <p className="text-center text-slate/40 text-xs py-8 font-medium">No matching questions found in selected sources.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right column: Selected list / Preview pane */}
                    <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[600px]">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                            <h4 className="font-black text-navy text-sm uppercase tracking-widest">Selected Questions ({selectedQuestions.length})</h4>
                            {selectedQuestions.length > 0 && (
                                <button onClick={() => setSelectedQuestions([])} className="text-xs text-red-500 font-black uppercase tracking-wider">Clear</button>
                            )}
                        </div>

                        {/* List of selected questions with up/down handles */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-6">
                            {selectedQuestions.map((q, idx) => (
                                <div key={q._id} className="bg-gray-50 border border-gray-100 p-3 rounded-xl flex justify-between items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[9px] font-black text-navy uppercase tracking-wider block mb-1">{q.questionId}</span>
                                        <p className="text-[11px] text-slate font-semibold truncate" dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        <button onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs hover:border-navy disabled:opacity-30">▲</button>
                                        <button onClick={() => moveQuestion(idx, 1)} disabled={idx === selectedQuestions.length - 1} className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-xs hover:border-navy disabled:opacity-30">▼</button>
                                        <button onClick={() => setSelectedQuestions(selectedQuestions.filter(sq => sq._id !== q._id))} className="w-6 h-6 rounded bg-white border border-red-200 text-red-500 flex items-center justify-center text-xs hover:bg-red-50">×</button>
                                    </div>
                                </div>
                            ))}
                            {selectedQuestions.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-16">
                                    <span className="text-3xl mb-2">📋</span>
                                    <p className="text-xs font-bold text-slate">No questions selected yet.</p>
                                </div>
                            )}
                        </div>

                        {/* Save Actions */}
                        <div className="space-y-3">
                            <button 
                                onClick={() => handleSaveGeneratedPaper('Standard')}
                                disabled={selectedQuestions.length === 0 || isSavingPaper}
                                className="w-full bg-navy text-gold font-black py-4 rounded-xl text-xs uppercase tracking-widest transition hover:scale-102 disabled:opacity-40"
                            >
                                {isSavingPaper ? 'Saving...' : 'Save as Standard Paper'}
                            </button>
                            <button 
                                onClick={() => handleSaveGeneratedPaper('GrandTest')}
                                disabled={selectedQuestions.length === 0 || isSavingPaper}
                                className="w-full bg-gold text-navy font-black py-4 rounded-xl text-xs uppercase tracking-widest transition hover:scale-102 disabled:opacity-40"
                            >
                                {isSavingPaper ? 'Saving...' : 'Save as Grand Test (GT)'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preview Modal for Question details */}
                {previewQuestion && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                        <div className="bg-surface rounded-3xl w-full max-w-2xl p-8 border-b-8 border-gold animate-fade-in-up flex flex-col max-h-[85vh]">
                            <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4 flex-shrink-0">
                                <div>
                                    <h4 className="text-navy font-black text-lg">{previewQuestion.questionId} Details</h4>
                                    <div className="flex gap-2 mt-2">
                                        <span className="bg-navy/5 text-navy font-bold text-[9px] px-2 py-0.5 rounded border border-navy/10">{previewQuestion.subject}</span>
                                        <span className="bg-green-50 text-green-700 font-bold text-[9px] px-2 py-0.5 rounded border border-green-200">{previewQuestion.type}</span>
                                        <span className="bg-blue-50 text-blue-700 font-bold text-[9px] px-2 py-0.5 rounded border border-blue-200">Level: {previewQuestion.level}</span>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewQuestion(null)} className="text-slate/40 hover:text-red-500 text-xl font-bold">×</button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm text-slate">
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate/50">Question</span>
                                    <div className="font-semibold text-navy leading-relaxed" dangerouslySetInnerHTML={{ __html: previewQuestion.questionText }}></div>
                                </div>
                                {previewQuestion.options && previewQuestion.options.length > 0 && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate/50">Options</span>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {previewQuestion.options.map((opt, i) => (
                                                <div key={i} className="border border-gray-100 p-3 rounded-xl bg-gray-50/50 font-medium">
                                                    <span className="font-black text-navy mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate/50">Correct Answer</span>
                                    <div className="font-black text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-2 self-start inline-block">{previewQuestion.answer}</div>
                                </div>
                                {previewQuestion.solutionText && (
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate/50">Step-by-step Solution</span>
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl text-xs font-semibold leading-relaxed" dangerouslySetInnerHTML={{ __html: previewQuestion.solutionText }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Grand Test Papers
    // ─────────────────────────────────────────────────────────────────────────
    const handleDuplicatePaper = async (paperId, isRevision = false) => {
        try {
            const res = await api.post(`/api/papers/${paperId}/duplicate`, { isRevision });
            showToast(`Paper duplicated successfully! ${isRevision ? '(New Revision Created)' : ''}`, 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to duplicate paper.', 'error');
        }
    };

    const handleDeletePaper = async (paperId) => {
        if (!window.confirm('Are you sure you want to delete this paper?')) return;
        try {
            await api.delete(`/api/papers/${paperId}`);
            showToast('Paper deleted successfully!', 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete paper.', 'error');
        }
    };

    const renderGrandTests = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-center bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div>
                        <h3 className="font-black text-2xl text-navy">Grand Test Papers (GT)</h3>
                        <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">Coaching exam blueprints with revision histories</p>
                    </div>
                    <button 
                        onClick={() => {
                            setGenMode('auto');
                            setPaperTitle('Grand Test 1');
                            setSelectedExamType('NEET');
                            setActiveTab('generate');
                        }}
                        className="bg-navy text-gold px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition shadow-lg"
                    >
                        + Create Grand Test
                    </button>
                </div>

                <div className="bg-surface rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-slate/40 uppercase tracking-widest">
                                <th className="p-5 pl-8">GT Title</th>
                                <th className="p-5">Exam Type</th>
                                <th className="p-5">Subject</th>
                                <th className="p-5">Version / Revision</th>
                                <th className="p-5">Questions</th>
                                <th className="p-5 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-slate">
                            {grandTests.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-5 pl-8">
                                        <span className="font-black text-navy block text-sm">{p.title}</span>
                                        <span className="text-[10px] font-medium text-slate/40">{new Date(p.createdAt).toLocaleDateString()}</span>
                                    </td>
                                    <td className="p-5">
                                        <span className="bg-gold/10 text-gold border border-gold/25 font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                                            {p.examType || 'Custom'}
                                        </span>
                                    </td>
                                    <td className="p-5 font-bold text-sm text-slate">{p.subject}</td>
                                    <td className="p-5 text-sm font-bold text-navy">
                                        V{p.version || 1} R{p.revision || 0}
                                    </td>
                                    <td className="p-5 text-sm font-bold text-slate">{p.questions?.length || 0} Items</td>
                                    <td className="p-5 text-right pr-8 space-x-2">
                                        <button 
                                            onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)}
                                            className="bg-navy/5 text-navy font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-navy hover:text-white transition"
                                        >
                                            Preview
                                        </button>
                                        <button 
                                            onClick={() => handleDuplicatePaper(p._id, true)}
                                            className="bg-green-50 text-green-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 hover:text-white transition"
                                            title="Save a new revision branch"
                                        >
                                            + Rev
                                        </button>
                                        <button 
                                            onClick={() => handleDuplicatePaper(p._id, false)}
                                            className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition"
                                        >
                                            Copy
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePaper(p._id)}
                                            className="bg-red-50 text-red-500 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition"
                                        >
                                            Del
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {grandTests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center p-8 opacity-40 text-xs font-bold">No Grand Tests saved yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Previous Year Papers (PYQs) & Gemini OCR Parser
    // ─────────────────────────────────────────────────────────────────────────
    const [pyqTitle, setPyqTitle] = useState('');
    const [pyqSubject, setPyqSubject] = useState('');
    const [pyqClasses, setPyqClasses] = useState('');
    const [pyqYear, setPyqYear] = useState(new Date().getFullYear());
    const [pyqExamType, setPyqExamType] = useState('NEET');

    const [pasteText, setPasteText] = useState('');
    const [uploadFile, setUploadFile] = useState(null);
    const [isParsing, setIsParsing] = useState(false);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [isSavingPYQ, setIsSavingPYQ] = useState(false);

    const handleParsePaper = async () => {
        if (!pasteText && !uploadFile) {
            alert('Please paste text or select a file to parse.');
            return;
        }

        setIsParsing(true);
        setParsedQuestions([]);
        try {
            const formData = new FormData();
            if (uploadFile) {
                formData.append('file', uploadFile);
            }
            if (pasteText) {
                formData.append('text', pasteText);
            }

            const res = await api.post('/api/papers/parse-file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setParsedQuestions(res.data.questions || []);
            showToast(`Parsed ${res.data.questions?.length || 0} questions from file!`, 'success');
        } catch (err) {
            console.error(err);
            showToast('Failed to parse paper document.', 'error');
        } finally {
            setIsParsing(false);
        }
    };

    const handleSavePYQ = async () => {
        if (!pyqTitle || !pyqSubject) {
            alert('Please provide Title and Subject.');
            return;
        }
        if (parsedQuestions.length === 0) {
            alert('No questions loaded. Please parse first.');
            return;
        }

        setIsSavingPYQ(true);
        try {
            const pyqData = {
                title: pyqTitle,
                subject: pyqSubject,
                classes: pyqClasses ? pyqClasses.split(',').map(s => s.trim()) : ['General'],
                year: pyqYear,
                examType: pyqExamType,
                questions: parsedQuestions
            };

            await api.post('/api/papers/save-pyq', pyqData);
            showToast('Previous Year Paper and Questions loaded successfully!', 'success');
            
            // Reset fields
            setPyqTitle('');
            setPasteText('');
            setUploadFile(null);
            setParsedQuestions([]);
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to save PYQ paper.', 'error');
        } finally {
            setIsSavingPYQ(false);
        }
    };

    const renderPYQ = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-2xl text-navy">Previous Year Paper (PYQ) Module</h3>
                    <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">Upload PDF/TXT or paste text to extract questions via Gemini AI</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Input column */}
                    <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h4 className="font-black text-navy text-sm uppercase tracking-widest pb-3 border-b border-gray-100">Upload & Parse Panel</h4>
                        
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Paper Title</label>
                                <input type="text" placeholder="e.g. NEET 2024 Biology" value={pyqTitle} onChange={e => setPyqTitle(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Subject</label>
                                    <input type="text" placeholder="Biology" value={pyqSubject} onChange={e => setPyqSubject(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Year</label>
                                    <input type="number" value={pyqYear} onChange={e => setPyqYear(parseInt(e.target.value))} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Classes</label>
                                    <input type="text" placeholder="NEET, 12" value={pyqClasses} onChange={e => setPyqClasses(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Exam Type</label>
                                    <select value={pyqExamType} onChange={e => setPyqExamType(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy bg-white">
                                        <option value="NEET">NEET</option>
                                        <option value="JEE">JEE</option>
                                        <option value="KCET">KCET</option>
                                        <option value="Custom">Custom</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Option A: Copy Paste Paper Text</label>
                                <textarea rows={6} placeholder="Paste questions list directly here..." value={pasteText} onChange={e => setPasteText(e.target.value)} className="w-full border-2 border-gray-100 p-4 rounded-2xl text-xs font-semibold text-navy outline-none focus:border-navy" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Option B: Upload PDF/TXT/Image</label>
                                <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="w-full text-xs text-navy font-bold file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-navy/5 file:text-navy hover:file:bg-navy/10" />
                            </div>
                        </div>

                        <button 
                            onClick={handleParsePaper}
                            disabled={isParsing || (!pasteText && !uploadFile)}
                            className="w-full bg-gold text-navy font-black py-4 rounded-xl text-xs uppercase tracking-widest transition hover:scale-102 shadow-lg disabled:opacity-40"
                        >
                            {isParsing ? 'Extracting with Gemini AI...' : 'Parse & Extract Questions'}
                        </button>
                    </div>

                    {/* Results / Review column */}
                    <div className="md:col-span-2 bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[650px]">
                        <h4 className="font-black text-navy text-sm uppercase tracking-widest pb-3 border-b border-gray-100 mb-4 flex-shrink-0">Parsed Questions Review Panel</h4>
                        
                        <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-6">
                            {parsedQuestions.map((q, idx) => (
                                <div key={idx} className="border border-gray-100 bg-gray-50/50 p-4 rounded-2xl space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black text-navy uppercase tracking-widest">
                                        <span>Question {idx+1} ({q.type})</span>
                                        <span className="text-green-600">Answer: {q.answer}</span>
                                    </div>
                                    <p className="text-xs text-slate font-semibold" dangerouslySetInnerHTML={{ __html: q.questionText }}></p>
                                    
                                    {q.options && q.options.length > 0 && (
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate/75 font-semibold">
                                            {q.options.map((o, oi) => (
                                                <div key={oi} className="bg-white border border-gray-100 px-3 py-1.5 rounded-lg">
                                                    {String.fromCharCode(65+oi)}. {o}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {parsedQuestions.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 py-16">
                                    <span className="text-4xl mb-2">🤖</span>
                                    <p className="text-xs font-bold text-slate">No questions parsed yet. Run the extractor.</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleSavePYQ}
                            disabled={parsedQuestions.length === 0 || isSavingPYQ}
                            className="w-full bg-navy text-gold font-black py-4 rounded-xl text-xs uppercase tracking-widest transition hover:scale-102 disabled:opacity-40 flex-shrink-0 shadow-lg"
                        >
                            {isSavingPYQ ? 'Saving to Database...' : 'Approve & Seed questions into Repository'}
                        </button>
                    </div>
                </div>

                {/* Directory of Saved PYQs */}
                <div className="bg-surface rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 space-y-4">
                    <h4 className="font-black text-navy text-sm uppercase tracking-widest pb-3 border-b border-gray-100">Saved PYQ Directories</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {pyqPapers.map(p => (
                            <div key={p._id} className="border border-gray-100 p-5 rounded-2xl flex flex-col justify-between h-36 bg-white hover:shadow-md transition">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h5 className="font-bold text-navy text-sm">{p.title}</h5>
                                        <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">{p.examType}</span>
                                    </div>
                                    <p className="text-slate/40 text-[10px] font-bold mt-1">Year: {p.year || '2024'} | {p.questions?.length || 0} Questions</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)} className="flex-1 bg-navy/5 text-navy font-bold text-xs py-2 rounded-xl hover:bg-navy hover:text-white transition">Preview</button>
                                    <button onClick={() => handleDeletePaper(p._id)} className="bg-red-50 text-red-500 font-bold text-xs p-2 rounded-xl hover:bg-red-500 hover:text-white transition">Del</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Saved Papers
    // ─────────────────────────────────────────────────────────────────────────
    const renderSavedPapers = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <h3 className="font-black text-2xl text-navy">Saved Standard Papers</h3>
                    <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">All generated mock exam papers</p>
                </div>

                <div className="bg-surface rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-black text-slate/40 uppercase tracking-widest">
                                <th className="p-5 pl-8">Paper Title</th>
                                <th className="p-5">Subject</th>
                                <th className="p-5">Classes</th>
                                <th className="p-5">Questions</th>
                                <th className="p-5 text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-slate">
                            {standardPapers.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-5 pl-8">
                                        <span className="font-black text-navy block text-sm">{p.title}</span>
                                        <span className="text-[10px] font-medium text-slate/40">{new Date(p.createdAt).toLocaleDateString()}</span>
                                    </td>
                                    <td className="p-5 font-bold text-sm text-slate">{p.subject}</td>
                                    <td className="p-5 font-bold text-sm text-slate">{p.classes?.join(', ')}</td>
                                    <td className="p-5 text-sm font-bold text-slate">{p.questions?.length || 0} Questions</td>
                                    <td className="p-5 text-right pr-8 space-x-2">
                                        <button 
                                            onClick={() => navigate(`/admin/dashboard/preview/${p._id}`)}
                                            className="bg-navy/5 text-navy font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-navy hover:text-white transition"
                                        >
                                            Preview
                                        </button>
                                        <button 
                                            onClick={() => handleDuplicatePaper(p._id, false)}
                                            className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600 hover:text-white transition"
                                        >
                                            Copy
                                        </button>
                                        <button 
                                            onClick={() => handleDeletePaper(p._id)}
                                            className="bg-red-50 text-red-500 font-bold text-xs px-3 py-1.5 rounded-lg hover:bg-red-500 hover:text-white transition"
                                        >
                                            Del
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {standardPapers.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center p-8 opacity-40 text-xs font-bold">No standard papers saved yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Patterns
    // ─────────────────────────────────────────────────────────────────────────
    const [patternName, setPatternName] = useState('');
    const [patternExamType, setPatternExamType] = useState('Custom');
    const [patternDesc, setPatternDesc] = useState('');
    const [patternSections, setPatternSections] = useState([
        { sectionName: 'Section A', subject: 'Physics', numQuestions: 25, type: 'MCQ', marks: 100 }
    ]);

    const addPatternSection = () => {
        setPatternSections([...patternSections, {
            sectionName: `Section ${String.fromCharCode(65 + patternSections.length)}`,
            subject: 'Physics',
            numQuestions: 20,
            type: 'MCQ',
            marks: 80
        }]);
    };

    const removePatternSection = (idx) => {
        setPatternSections(patternSections.filter((_, i) => i !== idx));
    };

    const handleSectionChange = (idx, field, val) => {
        const updated = [...patternSections];
        updated[idx][field] = val;
        setPatternSections(updated);
    };

    const handleSavePattern = async () => {
        if (!patternName) {
            alert('Please provide a pattern name.');
            return;
        }

        try {
            await api.post('/api/patterns', {
                name: patternName,
                examType: patternExamType,
                description: patternDesc,
                sections: patternSections
            });

            showToast('Exam pattern blueprint saved successfully!', 'success');
            setPatternName('');
            setPatternDesc('');
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to save pattern template.', 'error');
        }
    };

    // Presets loaders
    const loadPreset = (presetName) => {
        if (presetName === 'NEET') {
            setPatternName('NEET Standard Pattern');
            setPatternExamType('NEET');
            setPatternDesc('NEET syllabus template blueprint (180 questions total)');
            setPatternSections([
                { sectionName: 'Physics Section A', subject: 'Physics', numQuestions: 35, type: 'MCQ', marks: 140 },
                { sectionName: 'Physics Section B', subject: 'Physics', numQuestions: 10, type: 'MCQ', marks: 40 },
                { sectionName: 'Chemistry Section A', subject: 'Chemistry', numQuestions: 35, type: 'MCQ', marks: 140 },
                { sectionName: 'Chemistry Section B', subject: 'Chemistry', numQuestions: 10, type: 'MCQ', marks: 40 },
                { sectionName: 'Botany Section A', subject: 'Biology', numQuestions: 35, type: 'MCQ', marks: 140 },
                { sectionName: 'Botany Section B', subject: 'Biology', numQuestions: 10, type: 'MCQ', marks: 40 },
                { sectionName: 'Zoology Section A', subject: 'Biology', numQuestions: 35, type: 'MCQ', marks: 140 },
                { sectionName: 'Zoology Section B', subject: 'Biology', numQuestions: 10, type: 'MCQ', marks: 40 }
            ]);
        } else if (presetName === 'JEE') {
            setPatternName('JEE Main Pattern');
            setPatternExamType('JEE');
            setPatternDesc('JEE standard test pattern (75 questions total)');
            setPatternSections([
                { sectionName: 'Physics Section A', subject: 'Physics', numQuestions: 20, type: 'MCQ', marks: 80 },
                { sectionName: 'Physics Section B', subject: 'Physics', numQuestions: 5, type: 'Numerical', marks: 20 },
                { sectionName: 'Chemistry Section A', subject: 'Chemistry', numQuestions: 20, type: 'MCQ', marks: 80 },
                { sectionName: 'Chemistry Section B', subject: 'Chemistry', numQuestions: 5, type: 'Numerical', marks: 20 },
                { sectionName: 'Maths Section A', subject: 'Maths', numQuestions: 20, type: 'MCQ', marks: 80 },
                { sectionName: 'Maths Section B', subject: 'Maths', numQuestions: 5, type: 'Numerical', marks: 20 }
            ]);
        } else if (presetName === 'KCET') {
            setPatternName('KCET Physics & Chemistry');
            setPatternExamType('KCET');
            setPatternDesc('KCET standard MCQ blueprint');
            setPatternSections([
                { sectionName: 'Physics Section', subject: 'Physics', numQuestions: 60, type: 'MCQ', marks: 60 },
                { sectionName: 'Chemistry Section', subject: 'Chemistry', numQuestions: 60, type: 'MCQ', marks: 60 }
            ]);
        }
        showToast(`Loaded ${presetName} blueprint preset!`, 'success');
    };

    const handleDeletePattern = async (id) => {
        if (!window.confirm('Are you sure you want to delete this blueprint?')) return;
        try {
            await api.delete(`/api/patterns/${id}`);
            showToast('Pattern deleted successfully!', 'success');
            fetchData();
        } catch (err) {
            console.error(err);
            showToast('Failed to delete pattern.', 'error');
        }
    };

    const renderPatterns = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                        <h3 className="font-black text-2xl text-navy">Exam Pattern Blueprint Generator</h3>
                        <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">Configure and reuse layout blueprints for different exam criteria</p>
                    </div>
                    {/* Presets loader */}
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => loadPreset('NEET')} className="bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/25 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#16a34a] hover:text-white transition">NEET Preset</button>
                        <button onClick={() => loadPreset('JEE')} className="bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/25 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#3b82f6] hover:text-white transition">JEE Preset</button>
                        <button onClick={() => loadPreset('KCET')} className="bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/25 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#a855f7] hover:text-white transition">KCET Preset</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Pattern Builder input pane */}
                    <div className="bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                        <h4 className="font-black text-navy text-sm uppercase tracking-widest pb-2 border-b border-gray-100">Create Blueprint</h4>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Blueprint Name</label>
                                <input type="text" placeholder="NEET Zoology Standard" value={patternName} onChange={e => setPatternName(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Exam Target Type</label>
                                <select value={patternExamType} onChange={e => setPatternExamType(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-bold text-navy outline-none focus:border-navy bg-white">
                                    <option value="Custom">Custom</option>
                                    <option value="NEET">NEET</option>
                                    <option value="JEE">JEE</option>
                                    <option value="KCET">KCET</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest block">Description</label>
                                <textarea rows={2} placeholder="Syllabus structure..." value={patternDesc} onChange={e => setPatternDesc(e.target.value)} className="w-full border-2 border-gray-100 p-3.5 rounded-2xl text-xs font-semibold text-navy outline-none focus:border-navy" />
                            </div>
                        </div>

                        {/* Sections editor */}
                        <div className="space-y-4 pt-4 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-navy uppercase tracking-widest">Blueprint Sections</label>
                                <button onClick={addPatternSection} className="text-xs text-navy border-b border-navy font-bold">+ Add Section</button>
                            </div>
                            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                                {patternSections.map((sec, idx) => (
                                    <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3 relative group">
                                        {patternSections.length > 1 && (
                                            <button onClick={() => removePatternSection(idx)} className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700 opacity-0 group-hover:opacity-100 transition">×</button>
                                        )}
                                        <input 
                                            type="text" 
                                            placeholder="Section Name" 
                                            value={sec.sectionName}
                                            onChange={e => handleSectionChange(idx, 'sectionName', e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-navy outline-none" 
                                        />
                                        <div className="grid grid-cols-3 gap-2">
                                            <input 
                                                type="number" 
                                                placeholder="Count"
                                                title="Number of questions"
                                                value={sec.numQuestions}
                                                onChange={e => handleSectionChange(idx, 'numQuestions', parseInt(e.target.value))}
                                                className="bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-navy text-center" 
                                            />
                                            <select 
                                                value={sec.type}
                                                onChange={e => handleSectionChange(idx, 'type', e.target.value)}
                                                className="bg-white border border-gray-200 p-2 rounded-xl text-[10px] font-bold text-navy"
                                            >
                                                {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                            </select>
                                            <input 
                                                type="number" 
                                                placeholder="Marks"
                                                title="Total section marks"
                                                value={sec.marks}
                                                onChange={e => handleSectionChange(idx, 'marks', parseInt(e.target.value))}
                                                className="bg-white border border-gray-200 p-2 rounded-xl text-xs font-bold text-navy text-center" 
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={handleSavePattern}
                            className="w-full bg-navy text-gold font-black py-4 rounded-xl text-xs uppercase tracking-widest transition hover:scale-102 shadow-lg"
                        >
                            Save Pattern Template
                        </button>
                    </div>

                    {/* Saved patterns grid */}
                    <div className="md:col-span-2 bg-surface p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                        <h4 className="font-black text-navy text-sm uppercase tracking-widest pb-2 border-b border-gray-100 mb-6">Saved Blueprints Directory</h4>
                        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 pr-2 h-[450px]">
                            {patterns.map(p => (
                                <div key={p._id} className="border border-gray-100 p-5 rounded-2xl flex flex-col justify-between h-40 bg-white hover:shadow-md transition">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h5 className="font-bold text-navy text-sm">{p.name}</h5>
                                            <span className="bg-navy/5 text-navy text-[9px] font-black px-2 py-0.5 rounded border border-navy/10 uppercase tracking-widest">{p.examType}</span>
                                        </div>
                                        <p className="text-slate/60 text-xs mt-2 line-clamp-2">{p.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-50">
                                        <span className="text-[10px] font-bold text-[#1e3280]">{p.sections?.length || 0} Sections</span>
                                        <button onClick={() => handleDeletePattern(p._id)} className="text-xs text-red-500 font-bold hover:text-red-700">Delete</button>
                                    </div>
                                </div>
                            ))}
                            {patterns.length === 0 && (
                                <p className="col-span-2 text-center text-slate/40 text-xs py-16 font-bold">No custom blueprints saved yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Tab: Templates
    // ─────────────────────────────────────────────────────────────────────────
    const renderTemplates = () => {
        return (
            <div className="space-y-8 animate-fade-in-up">
                <div className="bg-surface p-6 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                        <h3 className="font-black text-2xl text-navy">Institutional Header Templates</h3>
                        <p className="text-slate/50 text-xs mt-1 uppercase tracking-widest font-black">Manage background templates, watermarks and institutional letterheads</p>
                    </div>
                    <button 
                        onClick={() => navigate('/admin/dashboard/upload-template')}
                        className="bg-navy text-gold px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition shadow-lg"
                    >
                        Upload Template Header
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates.map(t => (
                        <div key={t._id} className="bg-surface rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition">
                            <div className="h-40 bg-gray-50 flex items-center justify-center overflow-hidden border-b border-gray-100">
                                <img src={t.fileUrl} alt={t.originalName} className="w-full h-full object-cover" />
                            </div>
                            <div className="p-5 space-y-3">
                                <h5 className="font-bold text-navy text-sm truncate">{t.originalName}</h5>
                                <p className="text-[10px] font-medium text-slate/40">Uploaded on {new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && (
                        <p className="col-span-3 text-center text-slate/40 text-xs py-16 font-bold bg-white rounded-3xl border border-gray-100">No layout templates uploaded yet.</p>
                    )}
                </div>
            </div>
        );
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Core Layout
    // ─────────────────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'generate', label: 'Generate Paper', icon: '⚡' },
        { id: 'grandtests', label: 'Grand Tests', icon: '🏆' },
        { id: 'pyq', label: 'PYQ Module', icon: '🕰️' },
        { id: 'savedpapers', label: 'Saved Papers', icon: '📄' },
        { id: 'templates', label: 'Templates', icon: '🖼️' },
        { id: 'patterns', label: 'Exam Patterns', icon: '📋' }
    ];

    return (
        <div className="min-h-[80vh] flex flex-col md:flex-row gap-8 bg-background font-sans">
            {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-surface rounded-3xl border border-gray-100 p-6 flex flex-col gap-2 shadow-sm self-start">
                <h4 className="text-[10px] font-black text-navy/40 uppercase tracking-[0.2em] mb-4 ml-3">Paper Generator</h4>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-left transition-all ${activeTab === t.id ? 'bg-navy text-gold shadow-md' : 'text-slate hover:bg-gray-50'}`}
                    >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Content pane */}
            <div className="flex-1 min-w-0">
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'generate' && renderGeneratePaper()}
                {activeTab === 'grandtests' && renderGrandTests()}
                {activeTab === 'pyq' && renderPYQ()}
                {activeTab === 'savedpapers' && renderSavedPapers()}
                {activeTab === 'templates' && renderTemplates()}
                {activeTab === 'patterns' && renderPatterns()}
            </div>
        </div>
    );
}
