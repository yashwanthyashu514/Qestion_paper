import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function LabLogin() {
    const [form, setForm] = useState({ labId: '', password: '', studentName: '', rollNumber: '', studentEmail: '' });
    const [step, setStep] = useState(localStorage.getItem('lab_token') ? 'student' : 'lab'); // 'lab' | 'student'
    const [labToken, setLabToken] = useState(localStorage.getItem('lab_token') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLabLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/lab/login', { labId: form.labId, password: form.password });
            setLabToken(res.data.token);
            localStorage.setItem('lab_token', res.data.token);
            localStorage.setItem('lab_user', JSON.stringify(res.data.user));
            setStep('student');
        } catch (e) {
            setError(e.response?.data?.msg || 'Login failed. This terminal may not be authorized.');
        }
        setLoading(false);
    };

    const handleStudentProceed = (e) => {
        e.preventDefault();
        localStorage.setItem('student_info', JSON.stringify({
            studentName: form.studentName,
            rollNumber: form.rollNumber,
            studentEmail: form.studentEmail
        }));
        navigate('/lab/exams');
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {/* Header */}
                <div style={styles.header}>
                    <div style={styles.logo}>🏫</div>
                    <h1 style={styles.systemName}>College Examination System</h1>
                    <p style={styles.subtitle}>Authorized Lab Portal</p>
                </div>

                {step === 'lab' && (
                    <form onSubmit={handleLabLogin} style={styles.form}>
                        <div style={styles.secureNotice}>
                            🔒 This portal is restricted to authorized lab systems only.
                        </div>
                        <label style={styles.label}>Lab ID</label>
                        <input style={styles.input} placeholder="e.g. lab001" required
                            value={form.labId} onChange={e => setForm(f => ({ ...f, labId: e.target.value }))} />
                        <label style={styles.label}>Lab Password</label>
                        <input style={styles.input} type="password" placeholder="••••••••" required
                            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                        {error && <div style={styles.error}>{error}</div>}
                        <button style={styles.btn} type="submit" disabled={loading}>
                            {loading ? 'Verifying...' : '🔐 Verify Lab Access'}
                        </button>
                    </form>
                )}

                {step === 'student' && (
                    <form onSubmit={handleStudentProceed} style={styles.form}>
                        <div style={styles.successNotice}>✅ Lab system verified. Please enter student details.</div>
                        <label style={styles.label}>Student Full Name</label>
                        <input style={styles.input} placeholder="Enter your full name" required
                            value={form.studentName} onChange={e => setForm(f => ({ ...f, studentName: e.target.value }))} />
                        <label style={styles.label}>Roll Number</label>
                        <input style={styles.input} placeholder="e.g. 21CS001" required
                            value={form.rollNumber} onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))} />
                        <label style={styles.label}>Email (optional)</label>
                        <input style={styles.input} type="email" placeholder="student@college.edu"
                            value={form.studentEmail} onChange={e => setForm(f => ({ ...f, studentEmail: e.target.value }))} />
                        <button style={styles.btn} type="submit">📋 Proceed to Exam Selection</button>
                    </form>
                )}

                <div style={styles.footer}>
                    <a href="/" style={styles.backLink}>← Back to main portal</a>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', padding: 24 },
    card: { background: '#fff', borderRadius: 20, width: '100%', maxWidth: 440, padding: '40px 36px', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' },
    header: { textAlign: 'center', marginBottom: 32 },
    logo: { fontSize: 48, marginBottom: 12 },
    systemName: { fontSize: 20, fontWeight: 800, color: '#1e1b4b', margin: '0 0 6px' },
    subtitle: { fontSize: 14, color: '#6b7280', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: 4 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151', marginTop: 12, marginBottom: 4 },
    input: { padding: '11px 14px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit' },
    btn: { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20 },
    error: { background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginTop: 8 },
    secureNotice: { background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center' },
    successNotice: { background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '10px 14px', borderRadius: 8, fontSize: 13, textAlign: 'center' },
    footer: { marginTop: 24, textAlign: 'center' },
    backLink: { color: '#6b7280', fontSize: 13, textDecoration: 'none' }
};
