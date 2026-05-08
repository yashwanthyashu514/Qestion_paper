import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddQuestion = () => {
    const [questions, setQuestions] = useState([]);
    const [formData, setFormData] = useState({
        chapter: '',
        concept: '',
        level: 'easy',
        classes: '11',
        type: 'MCQ',
        questionText: '',
        options: ['', '', '', ''],
        answer: ''
    });
    const [imageFile, setImageFile] = useState(null);

    const fetchQuestions = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/questions');
            setQuestions(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            submitData.append('chapter', formData.chapter);
            submitData.append('concept', formData.concept);
            submitData.append('level', formData.level);
            submitData.append('classes', formData.classes);
            submitData.append('type', formData.type);
            submitData.append('questionText', formData.questionText);
            submitData.append('answer', formData.answer);
            
            if (formData.type === 'MCQ') {
                submitData.append('options', JSON.stringify(formData.options));
            }
            if (imageFile) {
                submitData.append('image', imageFile);
            }

            await axios.post('http://localhost:5000/api/questions', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setFormData({ ...formData, questionText: '', answer: '', options: ['', '', '', ''] });
            setImageFile(null);
            fetchQuestions();
            setShowForm(false); // Return to list view
            alert('Question added successfully!');
        } catch (err) {
            alert('Failed to add question');
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Are you sure you want to delete this question?')) {
            try {
                await axios.delete(`http://localhost:5000/api/questions/${id}`);
                fetchQuestions();
            } catch (err) {
                alert('Failed to delete question');
            }
        }
    };

    const [showForm, setShowForm] = useState(false);

    return (
        <div className="bg-white p-8 rounded-lg shadow-md border-t-4 border-green-500 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Question Bank</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage and organize your subject questions</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className={`px-5 py-2 rounded-lg font-bold shadow transition ${showForm ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                >
                    {showForm ? '← Back to Questions' : '+ Add Question'}
                </button>
            </div>

            {showForm ? (
                <div className="max-w-2xl mx-auto bg-gray-50 p-8 rounded-xl shadow-inner border border-gray-200">
                    <h3 className="text-xl font-bold mb-6 text-green-800 border-l-4 border-green-500 pl-3">Add New Question</h3>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Target Class</label>
                                <select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 bg-white" value={formData.classes} onChange={e => {
                                    const val = e.target.value;
                                    const newFormData = { ...formData, classes: val };
                                    if (['JEE', 'KCET', 'NEET'].includes(val)) {
                                        newFormData.type = 'MCQ';
                                    }
                                    setFormData(newFormData);
                                }}>
                                    <option value="11">Class 11</option>
                                    <option value="12">Class 12</option>
                                    <option value="JEE">JEE</option>
                                    <option value="KCET">KCET</option>
                                    <option value="NEET">NEET</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Question Type</label>
                                <select 
                                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 bg-white" 
                                    value={formData.type} 
                                    onChange={e=>setFormData({...formData, type: e.target.value})}
                                    disabled={['JEE', 'KCET', 'NEET'].includes(formData.classes)}
                                >
                                    <option value="MCQ">MCQ</option>
                                    <option value="1m">1 Mark</option>
                                    <option value="2m">2 Marks</option>
                                    <option value="3m">3 Marks</option>
                                    <option value="4m">4 Marks</option>
                                    <option value="5m">5 Marks</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty Level</label>
                                <select className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500 bg-white" value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Chapter Name</label>
                            <input type="text" list="chapters" placeholder="e.g. Thermodynamics" required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500" value={formData.chapter} onChange={e=>setFormData({...formData, chapter: e.target.value})} />
                            <datalist id="chapters">
                                {[...new Set(questions.map(q => q.chapter))].filter(Boolean).map(ch => <option key={ch} value={ch} />)}
                            </datalist>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Concept / Topic</label>
                            <input type="text" list="concepts" placeholder="e.g. First Law of Thermodynamics" required className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500" value={formData.concept} onChange={e=>setFormData({...formData, concept: e.target.value})} />
                            <datalist id="concepts">
                                {[...new Set(questions.filter(q => !formData.chapter || q.chapter === formData.chapter).map(q => q.concept))].filter(Boolean).map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Question Content</label>
                            <textarea placeholder="Enter the exact question text here..." required className="w-full border border-gray-300 p-3 rounded-lg h-32 focus:ring-2 focus:ring-green-500 mb-3" value={formData.questionText} onChange={e=>setFormData({...formData, questionText: e.target.value})}></textarea>
                            
                            {/* Image Upload Area */}
                            <label className="block text-sm font-bold text-gray-700 mb-1 mt-2">Diagram / Reference Image (Optional)</label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 hover:bg-green-50 hover:border-green-400 transition cursor-pointer relative"
                                 onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-green-50', 'border-green-400'); }}
                                 onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-green-50', 'border-green-400'); }}
                                 onDrop={(e) => {
                                     e.preventDefault();
                                     e.currentTarget.classList.remove('bg-green-50', 'border-green-400');
                                     if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                         setImageFile(e.dataTransfer.files[0]);
                                     }
                                 }}
                            >
                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                                }} />
                                {imageFile ? (
                                    <div className="flex flex-col items-center">
                                        <div className="text-green-600 mb-2">
                                            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                        <span className="font-medium text-gray-800">{imageFile.name}</span>
                                        <span className="text-xs text-gray-500 mt-1">Click or drag to replace</span>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-gray-400 mb-2 text-3xl">🖼️</div>
                                        <span className="font-medium text-gray-600 block">Drag and drop an image here</span>
                                        <span className="text-xs text-gray-500">or click to browse from your computer</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {formData.type === 'MCQ' && (
                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-3">
                                <p className="font-bold text-sm text-gray-800">Multiple Choice Options:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.options.map((opt, i) => (
                                        <div key={i} className="flex items-center">
                                            <span className="font-bold bg-gray-100 text-gray-600 w-8 h-8 flex items-center justify-center rounded-l-md border border-r-0 border-gray-300">{String.fromCharCode(65+i)}</span>
                                            <input type="text" placeholder={`Option content`} required className="flex-1 border border-gray-300 p-2 rounded-r-md text-sm focus:ring-2 focus:ring-green-500"
                                                value={opt} onChange={e => {
                                                    const newOpts = [...formData.options];
                                                    newOpts[i] = e.target.value;
                                                    setFormData({...formData, options: newOpts});
                                                }} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Correct Answer / Marking Scheme (Optional)</label>
                            <input type="text" placeholder="Enter answer or hints..." className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-green-500" value={formData.answer} onChange={e=>setFormData({...formData, answer: e.target.value})} />
                        </div>
                        
                        <button type="submit" className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 shadow-md transition transform hover:-translate-y-0.5 mt-4">Save Question to Bank</button>
                    </form>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-700 text-lg">Total Questions: <span className="text-green-600">{questions.length}</span></span>
                    </div>
                    {questions.map(q => (
                        <div key={q._id} className="border border-gray-200 p-5 rounded-lg shadow-sm bg-white relative group hover:shadow-md transition">
                            <div className="absolute top-4 right-4 hidden group-hover:flex space-x-3">
                                <button className="text-blue-600 hover:text-blue-800 text-sm font-bold bg-blue-50 px-3 py-1 rounded">Edit</button>
                                <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:text-red-800 text-sm font-bold bg-red-50 px-3 py-1 rounded">Delete</button>
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-bold">{q.questionId}</span>
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Class: {q.classes.join(', ')}</span>
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Type: {q.type}</span>
                                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">Level: {q.level}</span>
                            </div>
                            <p className="mt-2 text-base text-gray-900 font-medium whitespace-pre-wrap">{q.questionText}</p>
                            {q.imageUrl && (
                                <div className="mt-3">
                                    <img src={`http://localhost:5000${q.imageUrl}`} alt="Question Reference" className="max-h-48 rounded border border-gray-200" />
                                </div>
                            )}
                            
                            {q.type === 'MCQ' && q.options && (
                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100">
                                    {q.options.map((opt, idx) => (
                                        <div key={idx}><strong className="mr-1">{String.fromCharCode(65+idx)})</strong> {opt}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {questions.length === 0 && (
                        <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                            <div className="text-gray-400 text-5xl mb-4">📚</div>
                            <h3 className="text-xl font-bold text-gray-700 mb-2">Your Question Bank is Empty</h3>
                            <p className="text-gray-500 mb-6">Start building your database by adding your first question.</p>
                            <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 shadow transition">
                                + Add First Question
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddQuestion;
