import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { exportToWord } from '../../utils/exportWord';
import api from '../../api';

const AdminPaperPreview = () => {
    const { paperId } = useParams();
    const navigate = useNavigate();
    const { logout } = useContext(AuthContext);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [papersRes, templatesRes] = await Promise.all([
                    api.get('/api/papers/admin/all'),
                    api.get('/api/templates')
                ]);
                
                const paper = papersRes.data.find(p => p._id === paperId);
                setSelectedPaper(paper);
                
                if (templatesRes.data.length > 0) {
                    setActiveTemplate(templatesRes.data[0]);
                }
                
                setLoading(false);
            } catch (err) {
                console.error(err);
                if (err.response && [400, 401, 403].includes(err.response.status)) {
                    logout();
                    navigate('/');
                }
            }
        };
        fetchData();
    }, [paperId]);

    const handlePrint = () => {
        window.print();
    };

    const formatMarks = (type) => {
        if (type === 'MCQ' || type === '1m') return '1 Mark';
        if (type === '2m') return '2 Marks';
        if (type === '3m') return '3 Marks';
        if (type === '4m') return '4 Marks';
        if (type === '5m') return '5 Marks';
        return type;
    };

    if (loading) return <div className="p-8 text-center text-xl font-bold">Loading Paper Format...</div>;
    if (!selectedPaper) return <div className="p-8 text-center text-red-500 font-bold text-xl">Paper not found.</div>;

    let totalMarks = 0;
    if (selectedPaper.pattern && selectedPaper.pattern.length > 0) {
        totalMarks = selectedPaper.pattern.reduce((sum, sec) => sum + (sec.marks || 0), 0);
    } else {
        totalMarks = selectedPaper.questions.reduce((sum, q) => {
            if (q.type === 'MCQ' || q.type === '1m') return sum + 1;
            if (q.type === '2m') return sum + 2;
            if (q.type === '3m') return sum + 3;
            if (q.type === '4m') return sum + 4;
            if (q.type === '5m') return sum + 5;
            return sum;
        }, 0);
    }

    return (
        <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 no-print p-4 bg-white border border-gray-200 shadow-sm rounded-lg">
                <button onClick={() => navigate(-1)} className="bg-gray-500 text-white px-5 py-2 rounded-lg font-bold hover:bg-gray-600 shadow transition">← Back</button>
                <div className="space-x-4">
                    <button onClick={handlePrint} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 shadow transition">Print Paper</button>
                    <button onClick={() => exportToWord('.print-area', `${selectedPaper.title.replace(/\s+/g, '_')}.doc`)} className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-purple-700 shadow transition">Export Word</button>
                </div>
            </div>

            <div className="bg-white p-10 shadow-xl max-w-4xl mx-auto print-area border border-gray-300 font-serif text-sm mb-10 min-h-[1000px]">
                {activeTemplate && activeTemplate.fileUrl && activeTemplate.fileUrl.match(/\.(jpeg|jpg|gif|png)$/i) && (
                    <div className="mb-6 border-b-2 border-black pb-4 text-center flex justify-center w-full">
                        <img src={activeTemplate.fileUrl} alt="College Template Header" className="max-w-full h-auto mx-auto max-h-40 object-contain block" style={{ margin: '0 auto' }} />
                    </div>
                )}
                
                <div className="mb-8 relative">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold uppercase tracking-wide">{selectedPaper.title}</h1>
                        <p className="text-gray-800 mt-2 font-medium text-lg">Subject: {selectedPaper.subject} | Class: {selectedPaper.classes.join(', ')}</p>
                    </div>
                    <div className="flex justify-between items-end mt-8 font-bold border-b-2 border-black pb-3 text-base">
                        <span>Time: 3 Hours</span>
                        <span>Max. Marks: {totalMarks}</span>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {selectedPaper.pattern && selectedPaper.pattern.length > 0 ? (
                        (() => {
                            let availableQuestions = [...selectedPaper.questions];
                            return selectedPaper.pattern.map((sec, secIdx) => {
                                const numQuestions = sec.numQuestions || 0;
                                const sectionType = sec.type;
                                
                                let sectionQuestions = [];
                                if (sectionType) {
                                    const matchedQuestions = availableQuestions.filter(q => q.type === sectionType);
                                    sectionQuestions = matchedQuestions.slice(0, numQuestions);
                                    const usedIds = new Set(sectionQuestions.map(q => q._id));
                                    availableQuestions = availableQuestions.filter(q => !usedIds.has(q._id));
                                } else {
                                    sectionQuestions = availableQuestions.slice(0, numQuestions);
                                    availableQuestions = availableQuestions.slice(numQuestions);
                                }
                                
                                if (sectionQuestions.length === 0) return null;

                                return (
                                    <div key={secIdx} className="mb-8">
                                        <div className="text-center mt-10 mb-6">
                                            <div className="font-bold text-xl underline uppercase">{sec.sectionName}</div>
                                            {sec.description && <div className="text-sm text-gray-700 italic mt-2">{sec.description}</div>}
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {sectionQuestions.map((q, idx) => (
                                                <div key={q._id} className="text-gray-900 mb-4">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-start flex-1 pr-4">
                                                            <span className="font-bold mr-3 whitespace-nowrap text-base">{idx + 1}.</span>
                                                            <div className="flex-1">
                                                                <p className="whitespace-pre-wrap text-justify text-base leading-relaxed">{q.questionText}</p>
                                                                {q.imageUrl && (
                                                                    <div className="mt-4 mb-3">
                                                                        <img src={q.imageUrl} alt="Diagram" className="max-w-full max-h-64 object-contain" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <span className="font-bold whitespace-nowrap text-base">[{formatMarks(q.type)}]</span>
                                                    </div>
                                                    {q.type === 'MCQ' && q.options && (
                                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-5 ml-8 text-base">
                                                            {q.options.map((opt, i) => (
                                                                <div key={i} className="flex">
                                                                    <span className="mr-3 font-semibold">{String.fromCharCode(65+i)})</span>
                                                                    <span>{opt}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            });
                        })()
                    ) : (
                        selectedPaper.questions.map((q, idx) => (
                            <div key={q._id} className="text-gray-900 mb-8">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start flex-1 pr-4">
                                    <span className="font-bold mr-3 whitespace-nowrap text-base">{idx + 1}.</span>
                                    <div className="flex-1">
                                        <p className="whitespace-pre-wrap text-justify text-base leading-relaxed">{q.questionText}</p>
                                        {q.imageUrl && (
                                            <div className="mt-4 mb-3">
                                                <img src={q.imageUrl} alt="Diagram" className="max-w-full max-h-64 object-contain" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="font-bold whitespace-nowrap text-base">[{formatMarks(q.type)}]</span>
                                </div>
                                {q.type === 'MCQ' && q.options && (
                                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-5 ml-8 text-base">
                                        {q.options.map((opt, i) => (
                                            <div key={i} className="flex">
                                                <span className="mr-3 font-semibold">{String.fromCharCode(65+i)})</span>
                                                <span>{opt}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
                
                <div className="text-center font-bold border-t-2 border-black pt-6 mt-16 text-base tracking-widest">
                    *** END OF PAPER ***
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    .print-area, .print-area * { visibility: visible; }
                    .print-area { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print { display: none !important; }
                    @page { margin: 20mm; }
                }
            `}</style>
        </div>
    );
};

export default AdminPaperPreview;
