import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SavedPapers = () => {
    const [papers, setPapers] = useState([]);
    const [selectedPaper, setSelectedPaper] = useState(null);

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/papers');
                setPapers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPapers();
    }, []);

    const handlePrint = () => {
        window.print();
    };

    if (selectedPaper) {
        return (
            <div>
                <div className="flex justify-between items-center mb-6 no-print">
                    <button onClick={() => setSelectedPaper(null)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back</button>
                    <div className="space-x-4">
                        <button onClick={handlePrint} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Print Paper</button>
                        <button onClick={() => alert('PDF Export requires server-side Puppeteer and Template rendering logic.')} className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">Export as PDF</button>
                    </div>
                </div>

                <div className="bg-white p-12 shadow-lg max-w-4xl mx-auto print-area border">
                    {/* Placeholder for admin template header */}
                    <div className="text-center border-b pb-4 mb-8">
                        <h1 className="text-2xl font-bold uppercase">{selectedPaper.title}</h1>
                        <p className="text-gray-600">Subject: {selectedPaper.subject} | Class: {selectedPaper.classes.join(', ')}</p>
                    </div>
                    
                    <div className="space-y-6">
                        {selectedPaper.questions.map((q, idx) => (
                            <div key={q._id} className="text-gray-800">
                                <div className="flex items-start">
                                    <span className="font-bold mr-2">{idx + 1}.</span>
                                    <p className="flex-1 whitespace-pre-wrap">{q.questionText}</p>
                                    <span className="font-bold ml-4">[{q.type}]</span>
                                </div>
                                {q.type === 'MCQ' && q.options && (
                                    <div className="grid grid-cols-2 gap-2 mt-2 ml-6">
                                        {q.options.map((opt, i) => (
                                            <div key={i}>{String.fromCharCode(65+i)}) {opt}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    {/* Placeholder for footer */}
                    <div className="text-center border-t pt-4 mt-8 text-sm text-gray-500">
                        *** End of Paper ***
                    </div>
                </div>

                <style jsx>{`
                    @media print {
                        body * { visibility: hidden; }
                        .print-area, .print-area * { visibility: visible; }
                        .print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
                        .no-print { display: none; }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div>
            <h3 className="text-xl font-bold mb-4 text-purple-700">Saved Question Papers</h3>
            <div className="grid grid-cols-2 gap-4">
                {papers.map(p => (
                    <div key={p._id} className="border p-4 rounded shadow-sm hover:shadow-md transition bg-white flex justify-between items-center cursor-pointer" onClick={() => setSelectedPaper(p)}>
                        <div>
                            <h4 className="font-bold text-gray-800">{p.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">Class: {p.classes.join(', ')} | Questions: {p.questions.length}</p>
                            <p className="text-xs text-gray-400 mt-1">Created: {new Date(p.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button className="bg-blue-100 text-blue-600 px-3 py-1 rounded text-sm font-bold">View</button>
                    </div>
                ))}
                {papers.length === 0 && <p className="text-gray-500 col-span-2">No saved papers found.</p>}
            </div>
        </div>
    );
};

export default SavedPapers;
