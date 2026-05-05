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
            const dataToSubmit = { ...formData, classes: [formData.classes] };
            if (formData.type !== 'MCQ') {
                delete dataToSubmit.options;
            }
            await axios.post('http://localhost:5000/api/questions', dataToSubmit);
            setFormData({ ...formData, questionText: '', answer: '', options: ['', '', '', ''] });
            fetchQuestions();
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

    return (
        <div className="grid grid-cols-2 gap-8">
            <div>
                <h3 className="text-xl font-bold mb-4 text-green-700">Add New Question</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <select className="border p-2 rounded" value={formData.classes} onChange={e=>setFormData({...formData, classes: e.target.value})}>
                            <option value="11">Class 11</option>
                            <option value="12">Class 12</option>
                            <option value="JEE">JEE</option>
                            <option value="KCET">KCET</option>
                            <option value="NEET">NEET</option>
                        </select>
                        <select className="border p-2 rounded" value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})}>
                            <option value="MCQ">MCQ</option>
                            <option value="1m">1 Mark</option>
                            <option value="2m">2 Marks</option>
                            <option value="3m">3 Marks</option>
                            <option value="4m">4 Marks</option>
                            <option value="5m">5 Marks</option>
                        </select>
                        <select className="border p-2 rounded" value={formData.level} onChange={e=>setFormData({...formData, level: e.target.value})}>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>
                    <input type="text" placeholder="Chapter Name" required className="w-full border p-2 rounded" value={formData.chapter} onChange={e=>setFormData({...formData, chapter: e.target.value})} />
                    <input type="text" placeholder="Concept / Topic Name" required className="w-full border p-2 rounded" value={formData.concept} onChange={e=>setFormData({...formData, concept: e.target.value})} />
                    <textarea placeholder="Question Text" required className="w-full border p-2 rounded h-32" value={formData.questionText} onChange={e=>setFormData({...formData, questionText: e.target.value})}></textarea>
                    
                    {formData.type === 'MCQ' && (
                        <div className="space-y-2">
                            <p className="font-bold text-sm">Options:</p>
                            {formData.options.map((opt, i) => (
                                <input key={i} type="text" placeholder={`Option ${String.fromCharCode(65+i)}`} required className="w-full border p-2 rounded text-sm"
                                    value={opt} onChange={e => {
                                        const newOpts = [...formData.options];
                                        newOpts[i] = e.target.value;
                                        setFormData({...formData, options: newOpts});
                                    }} />
                            ))}
                        </div>
                    )}
                    
                    <input type="text" placeholder="Answer (optional)" className="w-full border p-2 rounded" value={formData.answer} onChange={e=>setFormData({...formData, answer: e.target.value})} />
                    
                    <button type="submit" className="w-full bg-green-500 text-white font-bold py-2 rounded hover:bg-green-600">Save Question</button>
                </form>
            </div>
            
            <div className="border-l pl-8 overflow-y-auto max-h-[600px]">
                <h3 className="text-xl font-bold mb-4 text-gray-700">Question Bank</h3>
                <div className="space-y-4">
                    {questions.map(q => (
                        <div key={q._id} className="border p-4 rounded shadow-sm bg-gray-50 relative group">
                            <div className="absolute top-2 right-2 hidden group-hover:flex space-x-2">
                                <button className="text-blue-500 hover:text-blue-700 text-sm">Edit</button>
                                <button onClick={() => handleDelete(q._id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                            </div>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded font-bold mr-2">{q.questionId}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded mr-2">{q.classes.join(',')}</span>
                            <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{q.type}</span>
                            <p className="mt-2 text-sm text-gray-800">{q.questionText}</p>
                        </div>
                    ))}
                    {questions.length === 0 && <p className="text-gray-500">No questions found.</p>}
                </div>
            </div>
        </div>
    );
};

export default AddQuestion;
