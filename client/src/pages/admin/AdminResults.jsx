import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';

export default function AdminResults() {
    const [searchParams] = useSearchParams();
    const examIdParam = searchParams.get('examId');
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(examIdParam || '');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [bridgeKey, setBridgeKey] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        api.get('/api/exams').then(r => setExams(r.data)).catch(() => {});
        if (examIdParam) fetchResults(examIdParam);
    }, [examIdParam]);

    const fetchResults = async (eid) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/exams/${eid}/results`);
            setResults(res.data);
        } catch (e) { setMsg('Failed to load results'); }
        setLoading(false);
    };

    const handleExamSelect = (e) => {
        setSelectedExam(e.target.value);
        setResults([]);
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
                                    <th style={styles.th}>Weak Areas</th>
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
                                            <div style={{ fontSize: 12 }}>
                                                {r.weakAreas?.slice(0, 2).map((w, j) => (
                                                    <div key={j} style={{ color: '#ef4444' }}>• {w.chapter} ({w.incorrect}✕)</div>
                                                ))}
                                            </div>
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
    sourceBadge: { borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 600 }
};
