import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';

// ── Palette States ──────────────────────────────────────────────
// not_visited: #6b7280 (grey)
// not_answered: #ef4444 (red)
// answered: #10b981 (green)
// marked: #8b5cf6 (purple)
// answered_marked: #8b5cf6 with green dot

const STATE = {
    NOT_VISITED: 'not_visited',
    NOT_ANSWERED: 'not_answered',
    ANSWERED: 'answered',
    MARKED: 'marked',
    ANSWERED_MARKED: 'answered_marked'
};

const STATE_COLORS = {
    [STATE.NOT_VISITED]: '#6b7280',
    [STATE.NOT_ANSWERED]: '#ef4444',
    [STATE.ANSWERED]: '#10b981',
    [STATE.MARKED]: '#8b5cf6',
    [STATE.ANSWERED_MARKED]: '#8b5cf6'
};

function getState(q) {
    if (!q.visited) return STATE.NOT_VISITED;
    if (q.selectedOption && q.markedForReview) return STATE.ANSWERED_MARKED;
    if (q.markedForReview) return STATE.MARKED;
    if (q.selectedOption) return STATE.ANSWERED;
    return STATE.NOT_ANSWERED;
}

export default function ExamEngine() {
    const { examId } = useParams();
    const navigate = useNavigate();
    const studentInfo = JSON.parse(localStorage.getItem('student_info') || '{}');

    const [exam, setExam] = useState(null);
    const [session, setSession] = useState(null);
    const [answers, setAnswers] = useState([]); // per-question local state
    const [current, setCurrent] = useState(0);
    const [timeLeft, setTimeLeft] = useState(null); // seconds
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const timerRef = useRef(null);
    const autoSubmitted = useRef(false);
    const isSubmittingOrFinished = useRef(false);

    const triggerMalpractice = useCallback(async (reason) => {
        if (isSubmittingOrFinished.current) return;
        isSubmittingOrFinished.current = true;
        
        try {
            await api.post(`/api/exams/${examId}/malpractice`, {
                sessionId: session?._id,
                reason
            });
        } catch (e) {
            console.error('Failed to report malpractice:', e);
        }

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }

        localStorage.removeItem('active_exam_session_id');
        navigate(`/exam/disqualified?reason=${encodeURIComponent(reason)}`);
    }, [session, examId, navigate]);

    // ── Load exam and start session ─────────────────────────────
    useEffect(() => {
        const init = async () => {
            try {
                const examRes = await api.get(`/api/exams/${examId}/take`);
                const e = examRes.data;

                // 1. Enforce scheduled start time: if student tries to enter early, redirect to instructions
                if (e.start_time) {
                    const start = new Date(e.start_time).getTime();
                    const now = new Date().getTime();
                    if (now < start) {
                        navigate(`/exam/${examId}/instructions`);
                        return;
                    }
                }

                setExam(e);

                // 2. Late Entry Check: Capped remaining time based on end_time
                let durationSeconds = e.duration_minutes * 60;
                if (e.end_time) {
                    const end = new Date(e.end_time).getTime();
                    const now = new Date().getTime();
                    const scheduledRemaining = Math.floor((end - now) / 1000);
                    if (scheduledRemaining < durationSeconds) {
                        durationSeconds = Math.max(0, scheduledRemaining);
                    }
                }
                setTimeLeft(durationSeconds);

                const sessionRes = await api.post(`/api/exams/${examId}/start`, {
                    studentName: studentInfo.studentName || 'Student',
                    studentEmail: studentInfo.studentEmail || '',
                    rollNumber: studentInfo.rollNumber || ''
                });
                setSession(sessionRes.data.session);

                // Initialize local answers state
                setAnswers(e.questions.map((q, i) => ({
                    questionId: q._id,
                    selectedOption: null,
                    markedForReview: false,
                    visited: i === 0
                })));
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        init();
        return () => clearInterval(timerRef.current);
    }, [examId, navigate]);

    // ── Malpractice and Security Controls ─────────────────────────
    useEffect(() => {
        if (!session || !exam) return;

        // Enter fullscreen mode and keep it fullscreen
        const enterFullscreen = () => {
            if (!document.fullscreenElement && !isSubmittingOrFinished.current) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        };
        enterFullscreen();

        const preventDefault = (e) => e.preventDefault();

        // Disable mouse-based copy-pasting & right click
        document.addEventListener('contextmenu', preventDefault);
        document.addEventListener('selectstart', preventDefault);
        document.addEventListener('dragstart', preventDefault);
        document.addEventListener('copy', preventDefault);
        document.addEventListener('cut', preventDefault);
        document.addEventListener('paste', preventDefault);

        // Block secure/developer shortcuts
        const handleKeyDown = (e) => {
            if (isSubmittingOrFinished.current) return;
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
                (e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V' || e.key === 'x' || e.key === 'X' || e.key === 's' || e.key === 'S'))
            ) {
                e.preventDefault();
                triggerMalpractice(`Unauthorized keyboard shortcut: ${e.key}`);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Detect switching tabs or minimizing window
        const handleVisibilityChange = () => {
            if (isSubmittingOrFinished.current) return;
            if (document.visibilityState === 'hidden') {
                triggerMalpractice('Switched tabs or minimized window');
            }
        };

        // Detect loss of window focus (e.g. system alerts, clicking outside browser, secondary monitors/overlays)
        const handleBlur = () => {
            setTimeout(() => {
                if (isSubmittingOrFinished.current) return;
                if (!document.hasFocus()) {
                    triggerMalpractice('Window focus lost (possible overlay or secondary application opened)');
                }
            }, 400);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        // Detect exit from fullscreen
        const handleFullscreenChange = () => {
            if (isSubmittingOrFinished.current) return;
            if (!document.fullscreenElement) {
                triggerMalpractice('Exited secure full-screen mode');
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('contextmenu', preventDefault);
            document.removeEventListener('selectstart', preventDefault);
            document.removeEventListener('dragstart', preventDefault);
            document.removeEventListener('copy', preventDefault);
            document.removeEventListener('cut', preventDefault);
            document.removeEventListener('paste', preventDefault);
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [session, exam, triggerMalpractice]);

    // ── Countdown Timer ─────────────────────────────────────────
    useEffect(() => {
        if (timeLeft === null) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current);
                    if (!autoSubmitted.current) { autoSubmitted.current = true; handleSubmit(true); }
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [timeLeft !== null]);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const isTimeCritical = timeLeft !== null && timeLeft < 300;

    // ── Palette helpers ─────────────────────────────────────────
    const updateAnswer = (idx, patch) => {
        setAnswers(prev => prev.map((a, i) => i === idx ? { ...a, ...patch } : a));
    };

    const goTo = (idx) => {
        if (idx < 0 || !exam || idx >= exam.questions.length) return;
        // Mark current as visited
        updateAnswer(idx, { visited: true });
        setCurrent(idx);
    };

    // ── Actions ─────────────────────────────────────────────────
    const handleOptionSelect = (opt) => {
        updateAnswer(current, { selectedOption: opt });
    };

    const handleSaveNext = () => {
        updateAnswer(current, { visited: true });
        if (current < exam.questions.length - 1) goTo(current + 1);
    };

    const handleClear = () => {
        updateAnswer(current, { selectedOption: null });
    };

    const handleMarkForReview = () => {
        updateAnswer(current, { markedForReview: true, visited: true });
        if (current < exam.questions.length - 1) goTo(current + 1);
    };

    const handleSaveAndMarkForReview = () => {
        updateAnswer(current, { markedForReview: true, visited: true });
        if (current < exam.questions.length - 1) goTo(current + 1);
    };

    const handleSubmit = useCallback(async (auto = false) => {
        if (submitting) return;
        isSubmittingOrFinished.current = true;
        setSubmitting(true);
        clearInterval(timerRef.current);
        try {
            const res = await api.post(`/api/exams/${examId}/submit`, {
                sessionId: session?._id,
                answers
            });
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            navigate(`/exam/${examId}/scorecard/${res.data.sessionId}`);
        } catch (err) {
            console.error('Submit failed', err);
            isSubmittingOrFinished.current = false;
            setSubmitting(false);
        }
    }, [submitting, session, answers, examId, navigate]);

    // ── Computed palette counts ─────────────────────────────────
    const counts = answers.reduce((acc, a) => {
        const s = getState(a);
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    if (loading) return <div style={styles.center}>Loading exam...</div>;
    if (!exam) return <div style={styles.center}>Exam not available.</div>;

    const currentQ = exam.questions[current];
    const currentA = answers[current] || {};

    return (
        <div style={styles.page}>
            {/* Top Bar */}
            <div style={styles.topBar}>
                <div style={styles.topLeft}>
                    <span style={styles.examTitleTop}>{exam.title}</span>
                    <span style={styles.examTypeTag}>{exam.examType}</span>
                </div>
                <div style={styles.timerBox}>
                    <span style={styles.timerLabel}>Time Left</span>
                    <span style={{ ...styles.timer, color: isTimeCritical ? '#ef4444' : '#10b981' }}>
                        {timeLeft !== null ? formatTime(timeLeft) : '--:--:--'}
                    </span>
                </div>
                <div style={styles.topRight}>
                    <span style={styles.candidateName}>👤 {studentInfo.studentName || 'Candidate'}</span>
                </div>
            </div>

            <div style={styles.body}>
                {/* ── Left: Question Panel ── */}
                <div style={styles.questionPanel}>
                    {/* Question Header */}
                    <div style={styles.qHeader}>
                        <span style={styles.qNum}>Question {current + 1} of {exam.questions.length}</span>
                        <span style={styles.qSubject}>{currentQ.subject} | {currentQ.chapter}</span>
                    </div>

                    {/* Question Text */}
                    <div style={styles.qBody}>
                        <p style={styles.qText} dangerouslySetInnerHTML={{ __html: currentQ.questionText }} />
                        {currentQ.imageUrl && (
                            <img src={currentQ.imageUrl} alt="Question" style={styles.qImage} />
                        )}

                        {/* Options or Numerical Input */}
                        {currentQ.type === 'numerical' || !currentQ.options || currentQ.options.length === 0 ? (
                            <div style={styles.numericalContainer}>
                                <div style={styles.numericalRow}>
                                    <div style={styles.inputWrapper}>
                                        <label style={styles.inputLabel}>Enter your answer (Numerical Value):</label>
                                        <input
                                            type="text"
                                            value={currentA.selectedOption || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^-?\d*\.?\d*$/.test(val)) {
                                                    handleOptionSelect(val);
                                                }
                                            }}
                                            placeholder="Type your answer here..."
                                            style={styles.numericalInput}
                                            autoFocus
                                        />
                                    </div>
                                    
                                    {/* Virtual Keypad */}
                                    <div style={styles.keypadWrapper}>
                                        <div style={styles.keypadTitle}>Virtual Keypad</div>
                                        <div style={styles.keypadGrid}>
                                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '.'].map((key) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentVal = (currentA.selectedOption || '').toString();
                                                        let newVal = currentVal;
                                                        if (key === '-') {
                                                            if (currentVal.startsWith('-')) {
                                                                newVal = currentVal.substring(1);
                                                            } else {
                                                                newVal = '-' + currentVal;
                                                            }
                                                        } else if (key === '.') {
                                                            if (!currentVal.includes('.')) {
                                                                newVal = currentVal + '.';
                                                            }
                                                        } else {
                                                            if (currentVal === '0') {
                                                                newVal = key;
                                                            } else {
                                                                newVal = currentVal + key;
                                                            }
                                                        }
                                                        if (/^-?\d*\.?\d*$/.test(newVal)) {
                                                            handleOptionSelect(newVal);
                                                        }
                                                    }}
                                                    style={styles.keypadBtn}
                                                >
                                                    {key}
                                                </button>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const currentVal = (currentA.selectedOption || '').toString();
                                                    if (currentVal.length > 0) {
                                                        handleOptionSelect(currentVal.substring(0, currentVal.length - 1));
                                                    }
                                                }}
                                                style={{ ...styles.keypadBtn, gridColumn: 'span 2', background: '#f3f4f6', color: '#374151' }}
                                            >
                                                ⌫ Backspace
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleOptionSelect('')}
                                                style={{ ...styles.keypadBtn, background: '#fef2f2', color: '#b91c1c' }}
                                            >
                                                Clear
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={styles.options}>
                                {currentQ.options?.map((opt, i) => {
                                    const label = String.fromCharCode(65 + i);
                                    const selected = currentA.selectedOption === opt;
                                    return (
                                        <div key={i}
                                            style={{ ...styles.option, ...(selected ? styles.optionSelected : {}) }}
                                            onClick={() => handleOptionSelect(opt)}
                                        >
                                            <span style={{ ...styles.optionLabel, ...(selected ? styles.optionLabelSelected : {}) }}>{label}</span>
                                            <span style={styles.optionText} dangerouslySetInnerHTML={{ __html: opt }} />
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Action Buttons - placed below the options */}
                        <div style={{ ...styles.actionBar, marginTop: 24, borderTop: 'none', background: 'transparent', padding: '12px 0' }}>
                            <div style={styles.actionLeft}>
                                <button style={styles.btnMarkReview} onClick={handleMarkForReview}>
                                    🔖 Mark for Review & Next
                                </button>
                                <button style={styles.btnClear} onClick={handleClear}>
                                    🗑 Clear Response
                                </button>
                            </div>
                            <div style={styles.actionRight}>
                                <button style={styles.btnSaveMarkReview} onClick={handleSaveAndMarkForReview}>
                                    💾 Save & Mark for Review
                                </button>
                                <button style={styles.btnPrev} onClick={() => goTo(current - 1)} disabled={current === 0}>
                                    ◀ Previous
                                </button>
                                <button style={styles.btnSaveNext} onClick={handleSaveNext}>
                                    Save & Next ▶
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right: Question Palette ── */}
                <div style={styles.palettePanel}>
                    {/* Candidate Info */}
                    <div style={styles.candidateBlock}>
                        <div style={styles.candidateAvatar}>👤</div>
                        <div>
                            <div style={styles.candidateNameRight}>{studentInfo.studentName || 'Student'}</div>
                            <div style={styles.candidateRoll}>{studentInfo.rollNumber || ''}</div>
                        </div>
                    </div>

                    {/* Status Counts */}
                    <div style={styles.statusRow}>
                        <div style={styles.statusItem}>
                            <span style={{ ...styles.statusDot, background: '#10b981' }}>{counts[STATE.ANSWERED] || 0}</span>
                            <span style={styles.statusLabel}>Answered</span>
                        </div>
                        <div style={styles.statusItem}>
                            <span style={{ ...styles.statusDot, background: '#ef4444' }}>{counts[STATE.NOT_ANSWERED] || 0}</span>
                            <span style={styles.statusLabel}>Not Answered</span>
                        </div>
                        <div style={styles.statusItem}>
                            <span style={{ ...styles.statusDot, background: '#6b7280' }}>{counts[STATE.NOT_VISITED] || 0}</span>
                            <span style={styles.statusLabel}>Not Visited</span>
                        </div>
                        <div style={styles.statusItem}>
                            <span style={{ ...styles.statusDot, background: '#8b5cf6' }}>
                                {(counts[STATE.MARKED] || 0) + (counts[STATE.ANSWERED_MARKED] || 0)}
                            </span>
                            <span style={styles.statusLabel}>Marked</span>
                        </div>
                    </div>

                    {/* Palette Title */}
                    <div style={styles.paletteTitle}>Question Palette</div>

                    {/* Palette Grid */}
                    <div style={styles.paletteGrid}>
                        {answers.map((a, i) => {
                            const state = getState(a);
                            const color = STATE_COLORS[state];
                            const isAnsweredMarked = state === STATE.ANSWERED_MARKED;
                            const isCurrent = i === current;
                            return (
                                <div key={i} style={{ position: 'relative', display: 'inline-block' }}>
                                    <button
                                        style={{
                                            ...styles.paletteBtn,
                                            background: color,
                                            border: isCurrent ? '3px solid #1e3a5f' : '2px solid transparent',
                                            boxShadow: isCurrent ? '0 0 0 2px #fff inset' : 'none'
                                        }}
                                        onClick={() => goTo(i)}
                                    >
                                        {i + 1}
                                    </button>
                                    {isAnsweredMarked && (
                                        <span style={styles.greenDotPalette} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Submit Button */}
                    <button style={styles.submitBtn} onClick={() => setShowSubmitConfirm(true)}>
                        🏁 Submit Exam
                    </button>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitConfirm && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modal}>
                        <h3 style={styles.modalTitle}>⚠️ Submit Examination?</h3>
                        <div style={styles.modalStats}>
                            <div style={styles.modalStat}><span style={{ color: '#10b981', fontWeight: 700 }}>{counts[STATE.ANSWERED] || 0}</span> Answered</div>
                            <div style={styles.modalStat}><span style={{ color: '#ef4444', fontWeight: 700 }}>{counts[STATE.NOT_ANSWERED] || 0}</span> Not Answered</div>
                            <div style={styles.modalStat}><span style={{ color: '#6b7280', fontWeight: 700 }}>{counts[STATE.NOT_VISITED] || 0}</span> Not Visited</div>
                            <div style={styles.modalStat}><span style={{ color: '#8b5cf6', fontWeight: 700 }}>{(counts[STATE.MARKED] || 0) + (counts[STATE.ANSWERED_MARKED] || 0)}</span> Marked</div>
                        </div>
                        <p style={styles.modalNote}>Once submitted, you cannot return to the exam. Are you sure?</p>
                        <div style={styles.modalBtns}>
                            <button style={styles.cancelBtn} onClick={() => setShowSubmitConfirm(false)}>◀ Return to Exam</button>
                            <button style={styles.confirmBtn} onClick={() => handleSubmit(false)} disabled={submitting}>
                                {submitting ? 'Submitting...' : '✅ Confirm Submit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    page: { minHeight: '100vh', background: '#f0f2f5', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' },
    topBar: { background: '#1e3a5f', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
    examTitleTop: { fontSize: 14, fontWeight: 600 },
    examTypeTag: { background: '#f59e0b', color: '#000', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 },
    timerBox: { textAlign: 'center' },
    timerLabel: { display: 'block', fontSize: 11, color: '#94a3b8', letterSpacing: 1 },
    timer: { fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
    topRight: { fontSize: 13, color: '#cbd5e1' },
    candidateName: { fontWeight: 600 },
    body: { display: 'flex', flex: 1, gap: 0 },
    // Question Panel
    questionPanel: { flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', margin: 16, borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' },
    qHeader: { background: '#1e3a5f', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', fontSize: 13 },
    qNum: { fontWeight: 700 },
    qSubject: { color: '#94a3b8', fontSize: 12 },
    qBody: { flex: 1, padding: '24px 28px', overflowY: 'auto' },
    qText: { fontSize: 15, color: '#1e293b', lineHeight: 1.7, marginBottom: 20, fontWeight: 500 },
    qImage: { maxWidth: '100%', borderRadius: 8, marginBottom: 16, border: '1px solid #e5e7eb' },
    options: { display: 'flex', flexDirection: 'column', gap: 12 },
    option: { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', border: '2px solid #e5e7eb', borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s' },
    optionSelected: { border: '2px solid #4f46e5', background: '#ede9fe' },
    optionLabel: { width: 32, height: 32, borderRadius: '50%', background: '#e5e7eb', color: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 },
    optionLabelSelected: { background: '#4f46e5', color: '#fff' },
    optionText: { fontSize: 14, color: '#374151', lineHeight: 1.5 },
    actionBar: { borderTop: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: '#f8fafc' },
    actionLeft: { display: 'flex', gap: 8 },
    actionRight: { display: 'flex', gap: 8 },
    btnMarkReview: { background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    btnClear: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13 },
    btnSaveMarkReview: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
    btnPrev: { background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', fontSize: 13 },
    btnSaveNext: { background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 13 },
    // Palette Panel
    palettePanel: { width: 280, flexShrink: 0, background: '#fff', margin: '16px 16px 16px 0', borderRadius: 12, border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflowY: 'auto' },
    candidateBlock: { display: 'flex', gap: 10, alignItems: 'center', background: '#1e3a5f', borderRadius: 10, padding: '10px 14px', color: '#fff' },
    candidateAvatar: { fontSize: 24 },
    candidateNameRight: { fontSize: 13, fontWeight: 700 },
    candidateRoll: { fontSize: 11, color: '#93c5fd' },
    statusRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
    statusItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
    statusDot: { color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 },
    statusLabel: { color: '#6b7280' },
    paletteTitle: { fontSize: 13, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e5e7eb', paddingBottom: 8 },
    paletteGrid: { display: 'flex', flexWrap: 'wrap', gap: 6 },
    paletteBtn: { width: 36, height: 36, borderRadius: '50%', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all 0.1s', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    greenDotPalette: { position: 'absolute', width: 10, height: 10, background: '#10b981', borderRadius: '50%', bottom: 0, right: 0, border: '2px solid #fff' },
    submitBtn: { background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 'auto' },
    // Modal
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modal: { background: '#fff', borderRadius: 16, padding: '32px 36px', width: '90%', maxWidth: 460 },
    modalTitle: { fontSize: 20, fontWeight: 700, color: '#1e293b', margin: '0 0 20px', textAlign: 'center' },
    modalStats: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 },
    modalStat: { background: '#f8fafc', borderRadius: 8, padding: '12px', textAlign: 'center', fontSize: 14 },
    modalNote: { color: '#6b7280', fontSize: 14, textAlign: 'center', marginBottom: 24 },
    modalBtns: { display: 'flex', gap: 12 },
    cancelBtn: { flex: 1, background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
    confirmBtn: { flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    center: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#6b7280', fontSize: 16 },
    numericalContainer: {
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '24px',
        margin: '12px 0',
        width: '100%'
    },
    numericalRow: {
        display: 'flex',
        gap: 32,
        alignItems: 'flex-start',
        flexWrap: 'wrap'
    },
    inputWrapper: {
        flex: 1,
        minWidth: 260,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: 600,
        color: '#475569'
    },
    numericalInput: {
        padding: '14px 18px',
        fontSize: 20,
        fontWeight: 700,
        fontFamily: 'Courier New, monospace',
        border: '2.5px solid #cbd5e1',
        borderRadius: 10,
        outline: 'none',
        transition: 'all 0.15s',
        color: '#1e293b',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)',
        textAlign: 'center',
        background: '#fff'
    },
    keypadWrapper: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
        width: '100%',
        maxWidth: 240
    },
    keypadTitle: {
        fontSize: 12,
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 12,
        textAlign: 'center'
    },
    keypadGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 8
    },
    keypadBtn: {
        padding: '10px 0',
        fontSize: 16,
        fontWeight: 700,
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        background: '#fff',
        cursor: 'pointer',
        transition: 'all 0.1s',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
    }
};
