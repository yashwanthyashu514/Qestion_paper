import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function LabExamList() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const studentInfo = JSON.parse(localStorage.getItem('student_info') || '{}');

    useEffect(() => {
        if (!studentInfo.studentName) {
            navigate('/lab-login');
            return;
        }
        api.get('/api/lab/exams').then(r => { setExams(r.data); setLoading(false); })
            .catch(e => { setError(e.response?.data?.msg || 'Failed to load exams'); setLoading(false); });
    }, [navigate, studentInfo.studentName]);

    if (loading) return <div style={styles.center}>Loading available exams...</div>;
    if (error) return <div style={styles.center} ><div style={styles.error}>{error}</div></div>;

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>📋 Available Exams</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={styles.studentBadge}>👤 {studentInfo.studentName || 'Student'} | {studentInfo.rollNumber || ''}</div>
                        <button style={styles.logoutBtn} onClick={() => {
                            localStorage.removeItem('student_info');
                            navigate('/lab-login');
                        }}>
                            Logout
                        </button>
                    </div>
                </div>
                {exams.length === 0 ? (
                    <div style={styles.empty}>No live exams available at this time.</div>
                ) : (
                    <div style={styles.grid}>
                        {exams.map(exam => (
                            <div key={exam._id} style={styles.card}>
                                <div style={styles.examType}>{exam.examType}</div>
                                <h2 style={styles.examTitle}>{exam.title}</h2>
                                <div style={styles.meta}>
                                    <span>⏱ {exam.duration_minutes} minutes</span>
                                    {exam.start_time && <span>🕐 {new Date(exam.start_time).toLocaleString()}</span>}
                                </div>
                                <button style={styles.startBtn} onClick={() => navigate(`/exam/${exam._id}/instructions`)}>
                                    ▶ Start Exam
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, sans-serif' },
    container: { maxWidth: 900, margin: '0 auto', padding: '40px 24px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    title: { fontSize: 26, fontWeight: 800, color: '#1e293b', margin: 0 },
    studentBadge: { background: '#ede9fe', color: '#5b21b6', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600 },
    logoutBtn: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' },
    grid: { display: 'grid', gap: 20 },
    card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
    examType: { display: 'inline-block', background: '#ede9fe', color: '#5b21b6', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 700, marginBottom: 12 },
    examTitle: { fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 12px' },
    meta: { display: 'flex', gap: 24, color: '#6b7280', fontSize: 14, marginBottom: 20 },
    startBtn: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280' },
    error: { background: '#fef2f2', color: '#b91c1c', padding: '16px 24px', borderRadius: 10, border: '1px solid #fca5a5' },
    empty: { textAlign: 'center', color: '#9ca3af', padding: 60, fontSize: 16 }
};
