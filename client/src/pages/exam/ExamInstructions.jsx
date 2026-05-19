import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

const PALETTE_LEGEND = [
    { color: '#6b7280', label: 'Not Visited' },
    { color: '#ef4444', label: 'Not Answered' },
    { color: '#10b981', label: 'Answered' },
    { color: '#8b5cf6', label: 'Marked for Review' },
    { color: '#8b5cf6', dot: true, label: 'Answered & Marked for Review' }
];

export default function ExamInstructions() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [agreed, setAgreed] = useState(false);
    const [loading, setLoading] = useState(true);
    const studentInfo = JSON.parse(localStorage.getItem('student_info') || '{}');

    const [timeLeftToStart, setTimeLeftToStart] = useState(null); // seconds until start

    useEffect(() => {
        api.get(`/api/exams/${examId}/take`).then(r => { setExam(r.data); setLoading(false); })
            .catch(() => { setLoading(false); });
    }, [examId]);

    useEffect(() => {
        if (!exam || !exam.start_time) {
            setTimeLeftToStart(null);
            return;
        }
        const checkStart = () => {
            const start = new Date(exam.start_time).getTime();
            const now = new Date().getTime();
            const diff = Math.floor((start - now) / 1000);
            if (diff > 0) {
                setTimeLeftToStart(diff);
            } else {
                setTimeLeftToStart(null);
            }
        };
        checkStart();
        const timer = setInterval(checkStart, 1000);
        return () => clearInterval(timer);
    }, [exam]);

    const formatStartCountdown = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const handleProceed = () => {
        if (!agreed) return;
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen().then(() => {
                navigate(`/exam/${examId}`);
            }).catch(() => {
                navigate(`/exam/${examId}`);
            });
        } else {
            navigate(`/exam/${examId}`);
        }
    };

    if (loading) return <div style={styles.center}>Loading exam...</div>;
    if (!exam) return <div style={styles.center}>Exam not found or not available.</div>;

    const instructions = exam.instructions || '';

    return (
        <div style={styles.page}>
            {/* Top Bar */}
            <div style={styles.topBar}>
                <div style={styles.systemName}>🎓 National Testing Agency — Exam Portal</div>
                <div style={styles.topRight}>
                    <span style={styles.examTypeTag}>{exam.examType}</span>
                </div>
            </div>

            <div style={styles.body}>
                {/* Left: Candidate Profile + Instructions */}
                <div style={styles.left}>
                    {/* Candidate Profile Block */}
                    <div style={styles.profileBlock}>
                        <div style={styles.avatarBox}>👤</div>
                        <div>
                            <div style={styles.profileName}>{studentInfo.studentName || 'Candidate'}</div>
                            <div style={styles.profileRoll}>Roll No: {studentInfo.rollNumber || '—'}</div>
                            <div style={styles.profileEmail}>{studentInfo.studentEmail || ''}</div>
                        </div>
                    </div>

                    {/* Exam Info */}
                    <div style={styles.examInfoBox}>
                        <h2 style={styles.examTitle}>{exam.title}</h2>
                        <div style={styles.examMeta}>
                            <span>📝 {exam.questions?.length || 0} Questions</span>
                            <span>⏱ {exam.duration_minutes} Minutes</span>
                            <span>✅ +4 | ❌ −1</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div style={styles.instrBox}>
                        <h3 style={styles.instrTitle}>General Instructions</h3>
                        <div style={styles.instrContent}>
                            {instructions.split('\n').filter(Boolean).map((line, i) => (
                                <p key={i} style={styles.instrLine}>{line}</p>
                            ))}
                            {!instructions && (
                                <p style={styles.instrLine}>Please read the exam rules carefully before proceeding.</p>
                            )}
                            <div style={styles.markingScheme}>
                                <strong>Marking Scheme:</strong>
                                <div style={styles.markingGrid}>
                                    <div style={styles.markingItem}><span style={styles.plus}>+4</span> Correct Answer</div>
                                    <div style={styles.markingItem}><span style={styles.minus}>−1</span> Wrong Answer</div>
                                    <div style={styles.markingItem}><span style={styles.zero}>0</span> Unattempted</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Palette Legend + Proceed */}
                <div style={styles.right}>
                    <div style={styles.legendBox}>
                        <h3 style={styles.legendTitle}>Question Palette Legend</h3>
                        {PALETTE_LEGEND.map((item, i) => (
                            <div key={i} style={styles.legendItem}>
                                <div style={{ ...styles.legendDot, background: item.color, position: 'relative' }}>
                                    {item.dot && <span style={styles.greenDot} />}
                                </div>
                                <span style={styles.legendLabel}>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div style={styles.agreeBox}>
                        <label style={styles.agreeLabel}>
                            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={styles.checkbox} />
                            <span>I have read and understood all the instructions. I agree to abide by the rules of this examination.</span>
                        </label>
                    </div>

                    {timeLeftToStart !== null ? (
                        <div style={{ ...styles.warning, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', textAlign: 'center', fontSize: 14, fontWeight: 700, padding: '14px', borderRadius: '10px' }}>
                            ⏳ Exam starts in {formatStartCountdown(timeLeftToStart)}
                        </div>
                    ) : (
                        <button
                            style={{ ...styles.proceedBtn, ...(agreed ? {} : styles.proceedBtnDisabled) }}
                            onClick={handleProceed}
                            disabled={!agreed}
                        >
                            ▶ Proceed to Exam
                        </button>
                    )}

                    <div style={{ ...styles.warning, background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '12px 16px', borderRadius: 8, fontSize: 13, lineHeight: '1.5' }}>
                        🔒 <strong>SECURE EXAM CONTEXT:</strong> The exam will open in full-screen mode. Closing full-screen, switching tabs, minimizing, opening other apps, or using keyboard shortcuts will trigger immediate disqualification.
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'Inter, sans-serif' },
    topBar: { background: '#1e3a5f', color: '#fff', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    systemName: { fontSize: 16, fontWeight: 700 },
    topRight: { display: 'flex', alignItems: 'center', gap: 12 },
    examTypeTag: { background: '#f59e0b', color: '#000', borderRadius: 6, padding: '4px 12px', fontSize: 13, fontWeight: 700 },
    body: { display: 'flex', gap: 20, padding: '20px 24px', maxWidth: 1100, margin: '0 auto' },
    left: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },
    right: { width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 },
    profileBlock: { background: '#1e3a5f', color: '#fff', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'center' },
    avatarBox: { fontSize: 40, background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    profileName: { fontSize: 18, fontWeight: 700 },
    profileRoll: { fontSize: 14, color: '#93c5fd', marginTop: 2 },
    profileEmail: { fontSize: 12, color: '#cbd5e1', marginTop: 2 },
    examInfoBox: { background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e5e7eb' },
    examTitle: { fontSize: 18, fontWeight: 700, color: '#1e293b', margin: '0 0 10px' },
    examMeta: { display: 'flex', gap: 20, fontSize: 14, color: '#6b7280' },
    instrBox: { background: '#fff', borderRadius: 12, padding: '20px', border: '1px solid #e5e7eb', flex: 1 },
    instrTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', margin: '0 0 14px', borderBottom: '2px solid #e5e7eb', paddingBottom: 10 },
    instrContent: { fontSize: 14, color: '#374151', lineHeight: 1.7 },
    instrLine: { margin: '6px 0' },
    markingScheme: { background: '#f0fdf4', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', marginTop: 16 },
    markingGrid: { display: 'flex', gap: 24, marginTop: 8, flexWrap: 'wrap' },
    markingItem: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 },
    plus: { background: '#10b981', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 },
    minus: { background: '#ef4444', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 },
    zero: { background: '#9ca3af', color: '#fff', borderRadius: 6, padding: '2px 8px', fontWeight: 700 },
    legendBox: { background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e5e7eb' },
    legendTitle: { fontSize: 14, fontWeight: 700, color: '#1e293b', margin: '0 0 14px' },
    legendItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
    legendDot: { width: 32, height: 32, borderRadius: '50%', flexShrink: 0 },
    greenDot: { position: 'absolute', width: 10, height: 10, background: '#10b981', borderRadius: '50%', bottom: -2, right: -2, border: '2px solid #fff' },
    legendLabel: { fontSize: 13, color: '#374151' },
    agreeBox: { background: '#fff', borderRadius: 12, padding: '14px', border: '1px solid #e5e7eb' },
    agreeLabel: { display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: '#374151', cursor: 'pointer', lineHeight: 1.5 },
    checkbox: { marginTop: 2, accentColor: '#4f46e5', width: 16, height: 16, flexShrink: 0 },
    proceedBtn: { background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: 10, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', textAlign: 'center' },
    proceedBtnDisabled: { background: '#d1d5db', cursor: 'not-allowed' },
    warning: { background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', borderRadius: 8, padding: '10px 14px', fontSize: 12 },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280', fontSize: 16 }
};
