import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function LabLogin() {
    const [form, setForm] = useState({ labId: '', password: '', rollNumber: '' });
    const [step, setStep] = useState(localStorage.getItem('lab_token') ? 'student' : 'lab');
    const [labToken, setLabToken] = useState(localStorage.getItem('lab_token') || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const handleStudentProceed = async (e) => {
        e.preventDefault();
        if (!form.rollNumber) return setError('Roll Number is required');

        setError('');
        setLoading(true);
        try {
            const res = await api.get(`/api/lab/student/${form.rollNumber.trim()}`);
            const studentData = res.data;

            localStorage.setItem('student_info', JSON.stringify({
                studentName: studentData.name,
                rollNumber: studentData.rollNumber,
                studentEmail: studentData.email,
                section: studentData.section
            }));
            navigate('/lab/exams');
        } catch (err) {
            setError(err.response?.data?.msg || 'Student not found. Please check your roll number.');
        }
        setLoading(false);
    };

    return (
        <div style={styles.container}>
            {/* Background Elements */}
            <div style={{...styles.backdrop, ...styles.backdrop1}}></div>
            <div style={{...styles.backdrop, ...styles.backdrop2}}></div>
            <div style={styles.gridOverlay}></div>

            {/* Animated Orbs */}
            <div style={{ ...styles.orb, ...styles.orbTop }}></div>
            <div style={{ ...styles.orb, ...styles.orbBottom }}></div>

            <div style={{ ...styles.wrapper, opacity: mounted ? 1 : 0, transition: 'opacity 0.6s ease-out' }}>
                <div style={styles.card}>
                    {/* Premium Header */}
                    <div style={styles.header}>
                        <div style={styles.logoContainer}>
                            <img src="/pacelogo.png" alt="PACE Logo" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                        </div>
                        <h1 style={styles.title}>PACE PRE UNIVERSITY COLLEGE</h1>
                        <p style={styles.subtitle}>Examination Portal</p>
                        <div style={styles.divider}></div>
                    </div>

                    {/* Forms */}
                    {step === 'lab' && (
                        <form onSubmit={handleLabLogin} style={{ ...styles.form, animation: 'slideIn 0.5s ease-out' }}>
                            <div style={styles.securityNotice}>
                                <svg style={styles.lockIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                                <span>Authorized Lab Terminal Access</span>
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Lab Terminal ID</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="e.g. LAB-001"
                                    required
                                    value={form.labId}
                                    onChange={e => setForm(f => ({ ...f, labId: e.target.value }))}
                                />
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Secure Password</label>
                                <input
                                    style={styles.input}
                                    type="password"
                                    placeholder="••••••••••••"
                                    required
                                    value={form.password}
                                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                />
                            </div>

                            {error && <div style={styles.errorAlert}>{error}</div>}

                            <button style={styles.primaryBtn} type="submit" disabled={loading}>
                                {loading ? (
                                    <span style={styles.loadingText}>Verifying Access...</span>
                                ) : (
                                    <span>🔐 Verify Lab Terminal</span>
                                )}
                            </button>

                            <p style={styles.helperText}>
                                Contact your lab administrator if you don't have credentials
                            </p>
                        </form>
                    )}

                    {step === 'student' && (
                        <form onSubmit={handleStudentProceed} style={{ ...styles.form, animation: 'slideIn 0.5s ease-out' }}>
                            <div style={styles.successNotice}>
                                <svg style={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                                <span>Terminal Verified • Ready for Student Login</span>
                            </div>

                            <div style={styles.fieldGroup}>
                                <label style={styles.label}>Student Roll Number</label>
                                <input
                                    style={styles.input}
                                    type="text"
                                    placeholder="e.g. 2620101"
                                    required
                                    value={form.rollNumber}
                                    onChange={e => setForm(f => ({ ...f, rollNumber: e.target.value }))}
                                />
                            </div>

                            {error && <div style={styles.errorAlert}>{error}</div>}

                            <button style={styles.primaryBtn} type="submit" disabled={loading}>
                                {loading ? (
                                    <span style={styles.loadingText}>Verifying Student...</span>
                                ) : (
                                    <span>📋 Access Exam Portal</span>
                                )}
                            </button>

                            <button
                                type="button"
                                style={styles.secondaryBtn}
                                onClick={() => {
                                    localStorage.removeItem('lab_token');
                                    localStorage.removeItem('lab_user');
                                    setStep('lab');
                                    setForm(f => ({ ...f, labId: '', password: '' }));
                                }}
                            >
                                ← Different Lab Terminal
                            </button>
                        </form>
                    )}

                    {/* Footer */}
                    <div style={styles.footer}>
                        <p style={styles.footerText}>© {new Date().getFullYear()} PACE PRE UNIVERSITY COLLEGE Examinations</p>
                    </div>
                </div>
            </div>

            <style>{keyframes}</style>
        </div>
    );
}

const keyframes = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @keyframes bgFade1 {
        0%, 40% { opacity: 1; transform: scale(1); }
        45%, 95% { opacity: 0; transform: scale(1.02); }
        100% { opacity: 1; transform: scale(1); }
    }

    @keyframes bgFade2 {
        0%, 40% { opacity: 0; transform: scale(1.02); }
        45%, 95% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.02); }
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }

    @keyframes float-delayed {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(20px); }
    }

    @keyframes pulse-soft {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 1; }
    }

    input:focus {
        outline: none;
    }

    input:focus-visible {
        border-color: #c5a059 !important;
        box-shadow: 0 0 0 3px rgba(197, 160, 89, 0.1) !important;
    }

    button:active {
        transform: scale(0.98);
    }
`;

const styles = {
    container: {
        height: '100vh',
        width: '100vw',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },

    backdrop: {
        position: 'absolute',
        inset: -20, // Negative inset to allow scaling without seeing edges
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        zIndex: 0,
    },

    backdrop1: {
        backgroundImage: 'linear-gradient(rgba(0, 31, 109, 0.75), rgba(13, 27, 77, 0.85)), url("/pacecollege1.jpg")',
        animation: 'bgFade1 14s infinite ease-in-out',
    },

    backdrop2: {
        backgroundImage: 'linear-gradient(rgba(0, 31, 109, 0.75), rgba(13, 27, 77, 0.85)), url("/pacecollege2.jpg")',
        animation: 'bgFade2 14s infinite ease-in-out',
    },

    gridOverlay: {
        position: 'absolute',
        inset: 0,
        backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        zIndex: 1,
        pointerEvents: 'none',
    },

    orb: {
        position: 'absolute',
        borderRadius: '50%',
        opacity: 0.1,
        filter: 'blur(60px)',
        zIndex: 1,
    },

    orbTop: {
        width: '400px',
        height: '400px',
        top: '-100px',
        right: '-50px',
        background: '#c5a059',
        animation: 'float 8s ease-in-out infinite',
    },

    orbBottom: {
        width: '300px',
        height: '300px',
        bottom: '-100px',
        left: '10%',
        background: '#c5a059',
        animation: 'float-delayed 10s ease-in-out infinite',
    },

    wrapper: {
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        boxSizing: 'border-box',
        padding: '20px',
    },

    card: {
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0, 31, 109, 0.25), 0 0 1px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.8)',
    },

    header: {
        textAlign: 'center',
        marginBottom: '40px',
    },

    logoContainer: {
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '24px',
    },

    logoShield: {
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #001f6d, #c5a059)',
        borderRadius: '12px',
        color: '#ffffff',
        boxShadow: '0 8px 20px rgba(0, 31, 109, 0.3)',
    },

    logoSvg: {
        width: '36px',
        height: '36px',
        color: '#c5a059',
    },

    title: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#001f6d',
        margin: '0 0 6px 0',
        letterSpacing: '-0.5px',
    },

    subtitle: {
        fontSize: '14px',
        color: '#64748b',
        margin: '0 0 16px 0',
        fontWeight: '500',
    },

    divider: {
        height: '2px',
        background: 'linear-gradient(90deg, transparent, #c5a059, transparent)',
        marginTop: '16px',
    },

    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },

    fieldGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
    },

    label: {
        fontSize: '13px',
        fontWeight: '600',
        color: '#001f6d',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },

    input: {
        padding: '13px 16px',
        border: '1.5px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '14px',
        fontFamily: 'inherit',
        background: '#f8fafc',
        transition: 'all 0.2s ease',
        color: '#1e293b',
    },

    securityNotice: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, #fef3c7, #fcd34d)',
        border: '1.5px solid #fbbf24',
        color: '#92400e',
        padding: '14px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
    },

    lockIcon: {
        width: '18px',
        height: '18px',
        flexShrink: 0,
        strokeWidth: '2.5',
    },

    successNotice: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        border: '1.5px solid #6ee7b7',
        color: '#065f46',
        padding: '14px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '500',
    },

    checkIcon: {
        width: '18px',
        height: '18px',
        flexShrink: 0,
        strokeWidth: '3',
    },

    errorAlert: {
        background: '#fef2f2',
        border: '1.5px solid #fca5a5',
        color: '#991b1b',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '13px',
        fontWeight: '500',
    },

    primaryBtn: {
        background: 'linear-gradient(135deg, #001f6d, #003a9a)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        padding: '14px 20px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '8px',
        boxShadow: '0 4px 12px rgba(0, 31, 109, 0.3)',
        textTransform: 'none',
        letterSpacing: '0.3px',
    },

    secondaryBtn: {
        background: 'transparent',
        color: '#64748b',
        border: '1.5px solid #e2e8f0',
        borderRadius: '10px',
        padding: '12px 20px',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    },

    loadingText: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    },

    helperText: {
        fontSize: '12px',
        color: '#94a3b8',
        margin: '8px 0 0 0',
        textAlign: 'center',
        fontStyle: 'italic',
    },

    footer: {
        marginTop: '32px',
        paddingTop: '24px',
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
    },

    homeLink: {
        color: '#64748b',
        fontSize: '13px',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.2s ease',
        display: 'inline-block',
        marginBottom: '12px',
    },

    footerText: {
        fontSize: '11px',
        color: '#cbd5e1',
        margin: '0',
        marginTop: '8px',
    },
};