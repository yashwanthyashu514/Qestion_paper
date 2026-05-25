import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';

export default function AdminResults() {
    const [searchParams] = useSearchParams();
    const examIdParam = searchParams.get('examId');
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(examIdParam || '');
    const [results, setResults] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bridgeKey, setBridgeKey] = useState('');
    const [msg, setMsg] = useState('');
    
    // Sheet Modal State
    const [sheetSessionId, setSheetSessionId] = useState(null);
    const [sheetData, setSheetData] = useState(null);
    const [sheetLoading, setSheetLoading] = useState(false);

    useEffect(() => {
        if (!sheetSessionId) {
            setSheetData(null);
            return;
        }
        setSheetLoading(true);
        api.get(`/api/exams/${selectedExam}/scorecard/${sheetSessionId}`)
            .then(res => {
                setSheetData(res.data);
                setSheetLoading(false);
            })
            .catch(() => {
                setMsg('Failed to load analysis sheet');
                setSheetLoading(false);
                setSheetSessionId(null);
            });
    }, [sheetSessionId, selectedExam]);

    useEffect(() => {
        api.get('/api/exams').then(r => setExams(r.data)).catch(() => {});
        if (examIdParam) fetchResults(examIdParam);
    }, [examIdParam]);

    const fetchResults = async (eid) => {
        setLoading(true);
        try {
            const [res, analyticsRes] = await Promise.all([
                api.get(`/api/exams/${eid}/results`),
                api.get(`/api/exams/${eid}/analytics`).catch(() => ({ data: null }))
            ]);
            setResults(res.data);
            if (analyticsRes.data) setAnalytics(analyticsRes.data);
        } catch (e) { setMsg('Failed to load results'); }
        setLoading(false);
    };

    const handleExamSelect = (e) => {
        setSelectedExam(e.target.value);
        setResults([]);
        setAnalytics(null);
        setBridgeKey('');
        if (e.target.value) fetchResults(e.target.value);
    };

    const generateBridgeKey = async () => {
        if (!selectedExam) return setMsg('Select an exam first');
        try {
            const res = await api.post(`/api/exams/${selectedExam}/bridge-key`);
            setBridgeKey(res.data.key);
            setMsg(`✅ Bridge key generated! Expires: ${new Date(res.data.expiresAt).toLocaleDateString()}`);
        } catch (e) { setMsg('Failed to generate key'); }
    };

    const copyKey = () => {
        navigator.clipboard.writeText(bridgeKey);
        setMsg('✅ Bridge key copied to clipboard!');
    };

    const getScoreColor = (score) => {
        if (score >= 300) return '#10b981';
        if (score >= 150) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📊 Student Exam Results</h2>

            {msg && <div style={styles.msg}>{msg} <button onClick={() => setMsg('')} style={styles.closeMsg}>✕</button></div>}

            <div style={styles.toolbar}>
                <select style={styles.select} value={selectedExam} onChange={handleExamSelect}>
                    <option value="">— Select an Exam —</option>
                    {exams.map(e => <option key={e._id} value={e._id}>{e.title} ({e.examType})</option>)}
                </select>
                <button style={styles.keyBtn} onClick={generateBridgeKey}>🔑 Generate Bridge Key</button>
            </div>

            {bridgeKey && (
                <div style={styles.keyBox}>
                    <span style={styles.keyText}>🔑 {bridgeKey}</span>
                    <button style={styles.copyBtn} onClick={copyKey}>📋 Copy</button>
                </div>
            )}

            {loading && <div style={styles.loading}>Loading results...</div>}

            {results.length > 0 && (
                <>
                    <div style={styles.summary}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryNum}>{results.length}</div>
                            <div style={styles.summaryLabel}>Total Students</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryNum}>
                                {results.length > 0 ? Math.max(...results.map(r => r.score)) : 0}
                            </div>
                            <div style={styles.summaryLabel}>Highest Score</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryNum}>
                                {results.length > 0 ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) : 0}
                            </div>
                            <div style={styles.summaryLabel}>Average Score</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryNum}>{results.filter(r => r.fromLabIp).length}</div>
                            <div style={styles.summaryLabel}>Lab Students</div>
                        </div>
                    </div>

                    {analytics && analytics.length > 0 && (
                        <div style={styles.analyticsSection}>
                            <h3 style={styles.analyticsTitle}>Global Question Analytics</h3>
                            <div style={styles.chartLegend}>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#10b981'}}></span> Correct</span>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#ef4444'}}></span> Incorrect</span>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#e5e7eb'}}></span> Unattempted</span>
                            </div>
                            <div style={styles.chartScroll}>
                                <div style={styles.chartContainer}>
                                    {analytics.map((a, i) => {
                                        const total = a.total || 1; // prevent divide by zero
                                        const cPct = (a.correct / total) * 100;
                                        const iPct = (a.incorrect / total) * 100;
                                        const uPct = (a.unattempted / total) * 100;

                                        return (
                                            <div key={i} style={styles.barColumn} title={`Q${a.questionNumber}\nCorrect: ${a.correct}\nIncorrect: ${a.incorrect}\nUnattempted: ${a.unattempted}`}>
                                                <div style={styles.barVertical}>
                                                    {uPct > 0 && <div style={{ height: `${uPct}%`, background: '#e5e7eb', width: '100%' }} />}
                                                    {iPct > 0 && <div style={{ height: `${iPct}%`, background: '#ef4444', width: '100%' }} />}
                                                    {cPct > 0 && <div style={{ height: `${cPct}%`, background: '#10b981', width: '100%', borderRadius: (uPct === 0 && iPct === 0) ? '4px 4px 0 0' : '0' }} />}
                                                </div>
                                                <div style={styles.barLabel}>{a.questionNumber}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {results && results.length > 0 && (
                        <div style={styles.analyticsSection}>
                            <h3 style={styles.analyticsTitle}>Student Performance Analytics</h3>
                            <div style={styles.chartLegend}>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#10b981'}}></span> Correct</span>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#ef4444'}}></span> Incorrect</span>
                                <span style={styles.legendItem}><span style={{...styles.legendDot, background: '#e5e7eb'}}></span> Unattempted</span>
                            </div>
                            <div style={styles.chartScroll}>
                                <div style={styles.chartContainer}>
                                    {results.map((r, i) => {
                                        const total = r.totalQuestions || 1; // prevent divide by zero
                                        const cPct = (r.correct / total) * 100;
                                        const iPct = (r.incorrect / total) * 100;
                                        const uPct = (r.unattempted / total) * 100;

                                        return (
                                            <div key={i} style={styles.barColumn} title={`Student: ${r.studentName} (${r.rollNumber || 'N/A'})\nScore: ${r.score}\nCorrect: ${r.correct}\nIncorrect: ${r.incorrect}\nUnattempted: ${r.unattempted}`}>
                                                <div style={styles.barVertical}>
                                                    {uPct > 0 && <div style={{ height: `${uPct}%`, background: '#e5e7eb', width: '100%' }} />}
                                                    {iPct > 0 && <div style={{ height: `${iPct}%`, background: '#ef4444', width: '100%' }} />}
                                                    {cPct > 0 && <div style={{ height: `${cPct}%`, background: '#10b981', width: '100%', borderRadius: (uPct === 0 && iPct === 0) ? '4px 4px 0 0' : '0' }} />}
                                                </div>
                                                <div style={styles.barLabel}>{i + 1}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={styles.tableWrap}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thead}>
                                    <th style={styles.th}>#</th>
                                    <th style={styles.th}>Student</th>
                                    <th style={styles.th}>Roll No</th>
                                    <th style={styles.th}>Score</th>
                                    <th style={styles.th}>Correct</th>
                                    <th style={styles.th}>Incorrect</th>
                                    <th style={styles.th}>Unattempted</th>
                                    <th style={styles.th}>Source</th>
                                    <th style={styles.th}>Analysis</th>
                                    <th style={styles.th}>Submitted</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r, i) => (
                                    <tr key={r._id} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb' }}>
                                        <td style={styles.td}>{i + 1}</td>
                                        <td style={styles.td}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontWeight: 600 }}>{r.studentName}</span>
                                                {r.malpracticeFlag && (
                                                    <span style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                                                        ⚠️ Malpractice Detected
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{r.studentEmail}</div>
                                            {r.malpracticeFlag && (
                                                <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 600, marginTop: 4 }}>
                                                    Reason: {r.malpracticeReason || 'Tab switched or window blurred'}
                                                </div>
                                            )}
                                        </td>
                                        <td style={styles.td}>{r.rollNumber || '—'}</td>
                                        <td style={{ ...styles.td, fontWeight: 700, color: getScoreColor(r.score) }}>{r.score}</td>
                                        <td style={{ ...styles.td, color: '#10b981' }}>✅ {r.correct}</td>
                                        <td style={{ ...styles.td, color: '#ef4444' }}>❌ {r.incorrect}</td>
                                        <td style={{ ...styles.td, color: '#9ca3af' }}>— {r.unattempted}</td>
                                        <td style={styles.td}>
                                            <span style={{ ...styles.sourceBadge, background: r.fromLabIp ? '#dbeafe' : '#fef3c7', color: r.fromLabIp ? '#1e40af' : '#92400e' }}>
                                                {r.fromLabIp ? '🏫 Lab' : '🌐 Remote'}
                                            </span>
                                        </td>
                                        <td style={styles.td}>
                                            <button 
                                                style={styles.viewSheetBtn}
                                                onClick={() => setSheetSessionId(r._id)}
                                            >
                                                📄 View Sheet
                                            </button>
                                        </td>
                                        <td style={{ ...styles.td, fontSize: 12, color: '#6b7280' }}>
                                            {r.endTime ? new Date(r.endTime).toLocaleString() : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {!loading && results.length === 0 && selectedExam && (
                <div style={styles.empty}>No submissions yet for this exam.</div>
            )}

            {/* Analysis Sheet Modal */}
            {sheetSessionId && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <div>
                                <h3 style={styles.modalTitle}>Individual Analysis Sheet</h3>
                                {sheetData && <div style={styles.modalSubtitle}>{sheetData.studentName} ({sheetData.rollNumber})</div>}
                            </div>
                            <button style={styles.closeModalBtn} onClick={() => setSheetSessionId(null)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            {sheetLoading ? (
                                <div style={styles.loading}>Loading sheet...</div>
                            ) : sheetData ? (
                                <>
                                    <div style={styles.sheetSummary}>
                                        <div style={styles.sheetStat}>
                                            <div style={styles.statLabel}>Score</div>
                                            <div style={{...styles.statVal, color: getScoreColor(sheetData.score)}}>{sheetData.score}</div>
                                        </div>
                                        <div style={styles.sheetStat}>
                                            <div style={styles.statLabel}>Attempted</div>
                                            <div style={styles.statVal}>{sheetData.totalQuestions - sheetData.unattempted}</div>
                                        </div>
                                        <div style={styles.sheetStat}>
                                            <div style={styles.statLabel}>Unattempted</div>
                                            <div style={{...styles.statVal, color: '#9ca3af'}}>{sheetData.unattempted}</div>
                                        </div>
                                        <div style={styles.sheetStat}>
                                            <div style={styles.statLabel}>Correct</div>
                                            <div style={{...styles.statVal, color: '#10b981'}}>{sheetData.correct}</div>
                                        </div>
                                        <div style={styles.sheetStat}>
                                            <div style={styles.statLabel}>Incorrect</div>
                                            <div style={{...styles.statVal, color: '#ef4444'}}>{sheetData.incorrect}</div>
                                        </div>
                                    </div>
                                    
                                    <table style={styles.sheetTable}>
                                        <thead>
                                            <tr style={styles.thead}>
                                                <th style={styles.th}>Q.No</th>
                                                <th style={styles.th}>Question / Subject</th>
                                                <th style={styles.th}>Status</th>
                                                <th style={styles.th}>Student Answer</th>
                                                <th style={styles.th}>Correct Answer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sheetData.breakdown.map((q, i) => {
                                                const isNum = q.type === 'NUMERICAL';
                                                
                                                let status = '⚪ Unattempted';
                                                let statusColor = '#9ca3af';
                                                if (q.selectedOption !== null && q.selectedOption !== '') {
                                                    const isNumericMatch = isNum && !isNaN(parseFloat(q.selectedOption)) && !isNaN(parseFloat(q.correctAnswer)) && Math.abs(parseFloat(q.selectedOption) - parseFloat(q.correctAnswer)) < 1e-9;
                                                    const isExactMatch = !isNum && q.selectedOption?.toString().trim().toLowerCase() === q.correctAnswer?.toString().trim().toLowerCase();
                                                    
                                                    if (isNumericMatch || isExactMatch) {
                                                        status = '✅ Correct';
                                                        statusColor = '#10b981';
                                                    } else {
                                                        status = '❌ Incorrect';
                                                        statusColor = '#ef4444';
                                                    }
                                                }
                                                
                                                return (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={styles.td}>{i + 1}</td>
                                                        <td style={styles.td}>
                                                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{q.subject} {q.chapter ? `— ${q.chapter}` : ''}</div>
                                                            <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                                                                {q.questionText ? (q.questionText.length > 60 ? q.questionText.substring(0, 60) + '...' : q.questionText) : 'Image Based Question'}
                                                            </div>
                                                        </td>
                                                        <td style={{ ...styles.td, color: statusColor, fontWeight: 600 }}>{status}</td>
                                                        <td style={{ ...styles.td, fontWeight: 500 }}>{q.selectedOption || '—'}</td>
                                                        <td style={{ ...styles.td, fontWeight: 500, color: '#10b981' }}>{q.correctAnswer}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: '24px', fontFamily: 'Inter, sans-serif', maxWidth: 1200, margin: '0 auto' },
    title: { fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 20 },
    msg: { background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', padding: '10px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', justifyContent: 'space-between' },
    closeMsg: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 },
    toolbar: { display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' },
    select: { flex: 1, padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, maxWidth: 400 },
    keyBtn: { background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 },
    keyBox: { background: '#1e1b4b', color: '#a5b4fc', borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, fontFamily: 'monospace', fontSize: 13 },
    keyText: { wordBreak: 'break-all' },
    copyBtn: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', marginLeft: 12, flexShrink: 0 },
    loading: { textAlign: 'center', color: '#9ca3af', padding: 40 },
    empty: { textAlign: 'center', color: '#9ca3af', padding: 60 },
    summary: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
    summaryCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    summaryNum: { fontSize: 32, fontWeight: 800, color: '#4f46e5' },
    summaryLabel: { fontSize: 13, color: '#6b7280', marginTop: 4 },
    tableWrap: { overflowX: 'auto', borderRadius: 12, border: '1px solid #e5e7eb' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
    thead: { background: '#f8fafc' },
    th: { padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '1px solid #e5e7eb', whiteSpace: 'nowrap' },
    td: { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
    sourceBadge: { borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 },
    analyticsSection: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    analyticsTitle: { fontSize: 16, fontWeight: 700, color: '#1e293b', marginBottom: 16, marginTop: 0 },
    chartLegend: { display: 'flex', gap: 16, marginBottom: 16, fontSize: 13, color: '#6b7280' },
    legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: '50%' },
    chartScroll: { overflowX: 'auto', paddingBottom: 12 },
    chartContainer: { display: 'flex', gap: 8, height: 200, alignItems: 'flex-end', minWidth: 'min-content' },
    barColumn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 24, cursor: 'pointer', transition: 'opacity 0.2s' },
    barVertical: { width: 16, height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', background: '#f8fafc', borderRadius: '4px 4px 0 0', overflow: 'hidden' },
    barLabel: { fontSize: 11, color: '#6b7280', fontWeight: 600 },
    viewSheetBtn: { background: '#f1f5f9', color: '#3b82f6', border: '1px solid #cbd5e1', borderRadius: 6, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' },
    modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', width: '90%', maxWidth: 1000, maxHeight: '90vh', borderRadius: 16, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' },
    modalSubtitle: { margin: '4px 0 0 0', fontSize: 14, color: '#64748b', fontWeight: 500 },
    closeModalBtn: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modalBody: { padding: 24, overflowY: 'auto', flex: 1 },
    sheetSummary: { display: 'flex', gap: 16, marginBottom: 24, padding: 20, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' },
    sheetStat: { flex: 1, textAlign: 'center' },
    statLabel: { fontSize: 13, color: '#64748b', marginBottom: 4, fontWeight: 500 },
    statVal: { fontSize: 24, fontWeight: 800, color: '#0f172a' },
    sheetTable: { width: '100%', borderCollapse: 'collapse', fontSize: 14, border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }
};
