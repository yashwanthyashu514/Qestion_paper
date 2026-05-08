import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../config';
import { exportToWord } from '../../utils/exportWord';

/* ─── Inline styles ─── */
const S = {
    page: { fontFamily: "'Inter', 'DM Sans', system-ui, sans-serif" },

    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '14px',
        marginBottom: '24px',
    },
    summaryCard: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '16px 20px',
    },
    summaryLabel: {
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: '#94a3b8',
        marginBottom: '4px',
    },
    summaryValue: {
        fontSize: '26px',
        fontWeight: 700,
        color: '#0f172a',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        lineHeight: 1.1,
    },
    summarySub: { fontSize: '12px', color: '#94a3b8', marginTop: '3px' },

    sectionLabel: {
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#94a3b8',
        marginBottom: '10px',
    },

    /* ── Filter bar ── */
    filterBar: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '12px',
        flexWrap: 'wrap',
    },
    filterSelect: {
        height: '34px',
        padding: '0 12px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '7px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#374151',
        fontFamily: 'inherit',
        cursor: 'pointer',
        outline: 'none',
        minWidth: '160px',
    },
    filterDate: {
        height: '34px',
        padding: '0 10px',
        fontSize: '13px',
        fontWeight: 500,
        borderRadius: '7px',
        border: '1px solid #e2e8f0',
        background: '#fff',
        color: '#374151',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        cursor: 'pointer',
        outline: 'none',
    },
    filterLabel: {
        fontSize: '12px',
        fontWeight: 600,
        color: '#64748b',
        whiteSpace: 'nowrap',
    },
    btnClearFilters: {
        height: '34px',
        padding: '0 14px',
        fontSize: '12px',
        fontWeight: 500,
        borderRadius: '7px',
        border: '1px solid #e2e8f0',
        background: '#f8fafc',
        color: '#64748b',
        fontFamily: 'inherit',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.14s',
    },

    tableWrap: {
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        overflow: 'hidden',
    },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: '#94a3b8',
        padding: '11px 18px',
        textAlign: 'left',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
    },
    thRight: { textAlign: 'right' },
    td: { padding: '14px 18px', verticalAlign: 'middle', borderBottom: '1px solid #f1f5f9' },
    tdLast: { padding: '14px 18px', verticalAlign: 'middle' },

    paperCell: { display: 'flex', alignItems: 'center', gap: '12px' },
    paperIcon: {
        width: '38px', height: '38px',
        background: '#dbeafe',
        borderRadius: '8px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', flexShrink: 0,
    },
    paperTitle: { fontSize: '14px', fontWeight: 600, color: '#0f172a' },
    paperId: {
        fontSize: '11px', color: '#94a3b8',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
        marginTop: '2px',
    },

    tagClass: {
        display: 'inline-flex', alignItems: 'center',
        fontSize: '11.5px', fontWeight: 600,
        padding: '3px 10px', borderRadius: '5px',
        background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
    },
    tagQ: {
        display: 'inline-flex', alignItems: 'center',
        fontSize: '11.5px', fontWeight: 600,
        padding: '3px 10px', borderRadius: '5px',
        background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
    },
    dateCell: {
        fontSize: '12.5px', color: '#475569',
        fontFamily: "'JetBrains Mono','Courier New',monospace",
    },

    actionCell: { display: 'flex', gap: '6px', justifyContent: 'flex-end' },
    btnView: {
        height: '30px', padding: '0 14px',
        fontSize: '12px', fontWeight: 500,
        borderRadius: '6px', cursor: 'pointer',
        background: '#fff', color: '#2563eb',
        border: '1px solid #bfdbfe',
        fontFamily: 'inherit',
        transition: 'all 0.14s',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
    },
    btnDel: {
        height: '30px', padding: '0 14px',
        fontSize: '12px', fontWeight: 500,
        borderRadius: '6px', cursor: 'pointer',
        background: '#fff', color: '#dc2626',
        border: '1px solid #fecaca',
        fontFamily: 'inherit',
        transition: 'all 0.14s',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
    },

    empty: {
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '60px 0', gap: '8px',
    },
    emptyIcon: { fontSize: '36px', marginBottom: '6px' },
    emptyTitle: { fontSize: '14px', fontWeight: 600, color: '#475569' },
    emptySub: { fontSize: '12.5px', color: '#94a3b8' },

    viewToolbar: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px',
        padding: '12px 18px',
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
    },
    btnBack: {
        height: '34px', padding: '0 16px',
        fontSize: '13px', fontWeight: 500,
        borderRadius: '7px', cursor: 'pointer',
        background: '#f1f5f9', color: '#475569',
        border: '1px solid #e2e8f0',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
    },
    btnPrint: {
        height: '34px', padding: '0 16px',
        fontSize: '13px', fontWeight: 500,
        borderRadius: '7px', cursor: 'pointer',
        background: '#2563eb', color: '#fff',
        border: 'none', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
    },
    btnPdf: {
        height: '34px', padding: '0 16px',
        fontSize: '13px', fontWeight: 500,
        borderRadius: '7px', cursor: 'pointer',
        background: '#7c3aed', color: '#fff',
        border: 'none', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
    },
    viewBtns: { display: 'flex', gap: '8px' },
};

/* ─── Helpers ─── */
const formatMarks = (type) => {
    if (type === 'MCQ' || type === '1m') return '1 Mark';
    if (type === '2m') return '2 Marks';
    if (type === '3m') return '3 Marks';
    if (type === '4m') return '4 Marks';
    if (type === '5m') return '5 Marks';
    return type;
};

const calcTotal = (paper) => {
    if (paper.pattern?.length) return paper.pattern.reduce((s, sec) => s + (sec.marks || 0), 0);
    return paper.questions.reduce((s, q) => {
        if (q.type === 'MCQ' || q.type === '1m') return s + 1;
        if (q.type === '2m') return s + 2;
        if (q.type === '3m') return s + 3;
        if (q.type === '4m') return s + 4;
        if (q.type === '5m') return s + 5;
        return s;
    }, 0);
};

/* ─── toDateStr: returns "YYYY-MM-DD" from a Date ─── */
const toDateStr = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

/* ═══════════════════════════════════════════════════════════════════════ */
/*  PAPER VIEW                                                            */
/* ═══════════════════════════════════════════════════════════════════════ */
const PaperView = ({ paper, activeTemplate, onBack }) => {
    const totalMarks = calcTotal(paper);

    const renderQuestions = () => {
        if (paper.pattern?.length) {
            let pool = [...paper.questions];
            return paper.pattern.map((sec, secIdx) => {
                const num = sec.numQuestions || 0;
                let secQs = sec.type
                    ? pool.filter(q => q.type === sec.type).slice(0, num)
                    : pool.slice(0, num);
                const usedIds = new Set(secQs.map(q => q._id));
                pool = pool.filter(q => !usedIds.has(q._id));
                if (!secQs.length) return null;
                return (
                    <div key={secIdx} style={{ marginBottom: '28px' }}>
                        <div style={{ textAlign: 'center', margin: '28px 0 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: '17px', textDecoration: 'underline' }}>{sec.sectionName}</div>
                            {sec.description && <div style={{ fontSize: '13px', color: '#555', fontStyle: 'italic', marginTop: '4px' }}>{sec.description}</div>}
                        </div>
                        <QuestionList questions={secQs} />
                    </div>
                );
            });
        }
        return <QuestionList questions={paper.questions} />;
    };

    return (
        <div style={S.page}>
            <div style={S.viewToolbar} className="no-print">
                <button style={S.btnBack} onClick={onBack}>← Back to Papers</button>
                <div style={S.viewBtns}>
                    {paper.status === 'Approved' ? (
                        <>
                            <button style={S.btnPrint} onClick={() => window.print()}>🖨 Print Paper</button>
                            <button style={S.btnPdf} onClick={() => exportToWord('.print-area', `${paper.title.replace(/\s+/g, '_')}.doc`)}>⬇ Export Word</button>
                        </>
                    ) : (
                        <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                            Paper must be approved by admin to print or export.
                        </span>
                    )}
                </div>
            </div>

            <div className="print-area" style={{
                background: '#fff', padding: '48px 56px',
                maxWidth: '860px', margin: '0 auto',
                border: '1px solid #e2e8f0', borderRadius: '12px',
                fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '14px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
                {activeTemplate?.fileUrl?.match(/\.(jpeg|jpg|gif|png)$/i) && (
                    <div style={{ marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '16px', textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                        <img src={`${API_URL}${activeTemplate.fileUrl}`} alt="Header" style={{ maxWidth: '100%', maxHeight: '140px', objectFit: 'contain', margin: '0 auto', display: 'block' }} />
                    </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>{paper.title}</h1>
                        <p style={{ marginTop: '6px', color: '#333', fontWeight: 500 }}>Subject: {paper.subject} &nbsp;|&nbsp; Class: {paper.classes?.join(', ')}</p>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderBottom: '2px solid #000', paddingBottom: '8px', fontWeight: 700, fontSize: '15px' }}>
                        <span>Time: 3 Hours</span>
                        <span>Max. Marks: {totalMarks}</span>
                    </div>
                </div>

                <div>{renderQuestions()}</div>

                <div style={{ textAlign: 'center', fontWeight: 700, borderTop: '2px solid #000', paddingTop: '16px', marginTop: '48px', fontSize: '13px' }}>
                    *** End of Paper ***
                </div>
            </div>

            <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; margin: 0 !important; }
          .no-print { display: none !important; }
          @page { margin: 20mm; }
        }
      `}</style>
        </div>
    );
};

const QuestionList = ({ questions }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {questions.map((q, idx) => (
            <div key={q._id} style={{ color: '#111' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1, paddingRight: '16px' }}>
                        <span style={{ fontWeight: 700, marginRight: '8px', whiteSpace: 'nowrap', fontSize: '15px' }}>{idx + 1}.</span>
                        <div style={{ flex: 1 }}>
                            <p style={{ whiteSpace: 'pre-wrap', textAlign: 'justify', fontSize: '15px', margin: 0 }}>{q.questionText}</p>
                            {q.imageUrl && (
                                <div style={{ marginTop: '12px', marginBottom: '8px' }}>
                                    <img src={`${API_URL}${q.imageUrl}`} alt="Diagram" style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }} />
                                </div>
                            )}
                        </div>
                    </div>
                    <span style={{ fontWeight: 700, whiteSpace: 'nowrap', fontSize: '14px' }}>[{formatMarks(q.type)}]</span>
                </div>
                {q.type === 'MCQ' && q.options && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', marginTop: '12px', marginLeft: '24px', fontSize: '14px' }}>
                        {q.options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex' }}>
                                <span style={{ marginRight: '6px', fontWeight: 600 }}>{String.fromCharCode(65 + i)})</span>
                                <span>{opt}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        ))}
    </div>
);

/* ═══════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                        */
/* ═══════════════════════════════════════════════════════════════════════ */
const SavedPapers = () => {
    const [papers, setPapers] = useState([]);
    const [selectedPaper, setSelectedPaper] = useState(null);
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [hoveredRow, setHoveredRow] = useState(null);

    /* ── Filter state ── */
    const [filterClass, setFilterClass] = useState('');
    const [filterDate, setFilterDate] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [papersRes, templatesRes] = await Promise.all([
                    axios.get(`${API_URL}/api/papers`),
                    axios.get(`${API_URL}/api/templates`),
                ]);
                setPapers(papersRes.data);
                if (templatesRes.data.length > 0) setActiveTemplate(templatesRes.data[0]);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Delete this paper? This cannot be undone.')) return;
        try {
            await axios.delete(`${API_URL}/api/papers/${id}`);
            setPapers(prev => prev.filter(p => p._id !== id));
        } catch {
            alert('Failed to delete paper.');
        }
    };

    /* ── Unique class options from all papers ── */
    const classOptions = [...new Set(
        papers.flatMap(p => p.classes || [])
    )].sort();

    /* ── Filtered papers ── */
    const filteredPapers = papers.filter(p => {
        const matchClass = filterClass
            ? (p.classes || []).includes(filterClass)
            : true;
        const matchDate = filterDate
            ? toDateStr(p.createdAt) === filterDate
            : true;
        return matchClass && matchDate;
    });

    const hasActiveFilters = filterClass || filterDate;

    const clearFilters = () => {
        setFilterClass('');
        setFilterDate('');
    };

    /* ── Paper view ── */
    if (selectedPaper) {
        return (
            <PaperView
                paper={selectedPaper}
                activeTemplate={activeTemplate}
                onBack={() => setSelectedPaper(null)}
            />
        );
    }

    /* ── Summary values (based on ALL papers, not filtered) ── */
    const lastDate = papers.length
        ? new Date(Math.max(...papers.map(p => new Date(p.createdAt)))).toLocaleDateString()
        : '—';

    /* ── List view ── */
    return (
        <div style={S.page}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.02em', margin: 0 }}>Saved Question Papers</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '3px' }}>Manage and print your question papers</p>
                </div>
                <div style={{
                    fontSize: '12px', color: '#64748b',
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: '6px', padding: '5px 14px',
                    fontFamily: "'JetBrains Mono','Courier New',monospace",
                    fontWeight: 500,
                }}>
                    {papers.length} paper{papers.length !== 1 ? 's' : ''}
                </div>
            </div>

            {/* Summary cards — 2 cards only (Total Questions removed) */}
            <div style={S.summaryGrid}>
                <div style={S.summaryCard}>
                    <div style={S.summaryLabel}>Total Papers</div>
                    <div style={S.summaryValue}>{papers.length}</div>
                    <div style={S.summarySub}>All saved question papers</div>
                </div>
                <div style={S.summaryCard}>
                    <div style={S.summaryLabel}>Last Created</div>
                    <div style={{ ...S.summaryValue, fontSize: '16px', paddingTop: '5px' }}>{lastDate}</div>
                    <div style={S.summarySub}>Most recent paper</div>
                </div>
            </div>

            {/* Section label + filter bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={S.sectionLabel}>All Papers</div>

                {/* ── Filters ── */}
                <div style={S.filterBar}>
                    {/* Class filter */}
                    <span style={S.filterLabel}>Class:</span>
                    <select
                        style={S.filterSelect}
                        value={filterClass}
                        onChange={e => setFilterClass(e.target.value)}
                    >
                        <option value="">All Classes</option>
                        {classOptions.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                        ))}
                    </select>

                    {/* Date filter */}
                    <span style={S.filterLabel}>Created:</span>
                    <input
                        type="date"
                        style={S.filterDate}
                        value={filterDate}
                        onChange={e => setFilterDate(e.target.value)}
                    />

                    {/* Clear button — only shown when filters are active */}
                    {hasActiveFilters && (
                        <button
                            style={S.btnClearFilters}
                            onClick={clearFilters}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#374151'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}
                        >
                            ✕ Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div style={S.tableWrap}>
                {filteredPapers.length === 0 ? (
                    <div style={S.empty}>
                        <div style={S.emptyIcon}>{papers.length === 0 ? '📄' : '🔍'}</div>
                        <div style={S.emptyTitle}>{papers.length === 0 ? 'No saved papers yet' : 'No papers match your filters'}</div>
                        <div style={S.emptySub}>
                            {papers.length === 0
                                ? 'Create a paper from the Paper Builder to see it here.'
                                : 'Try changing or clearing the filters above.'}
                        </div>
                    </div>
                ) : (
                    <table style={S.table}>
                        <thead>
                            <tr>
                                <th style={S.th}>Paper</th>
                                <th style={S.th}>Class</th>
                                <th style={S.th}>Questions</th>
                                <th style={S.th}>Created</th>
                                <th style={S.th}>Status</th>
                                <th style={{ ...S.th, ...S.thRight }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPapers.map((p, i) => (
                                <tr
                                    key={p._id}
                                    style={{
                                        background: hoveredRow === p._id ? '#f8fafc' : '#fff',
                                        cursor: 'default',
                                        transition: 'background 0.12s',
                                    }}
                                    onMouseEnter={() => setHoveredRow(p._id)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                >
                                    {/* Paper */}
                                    <td style={{ ...S.td, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <div style={S.paperCell}>
                                            <div style={S.paperIcon}>📝</div>
                                            <div>
                                                <div style={S.paperTitle}>{p.title}</div>
                                                <div style={S.paperId}>#{String(i + 1).padStart(4, '0')}</div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Class */}
                                    <td style={{ ...S.td, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <span style={S.tagClass}>Class {p.classes?.join(', ')}</span>
                                    </td>

                                    {/* Questions */}
                                    <td style={{ ...S.td, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <span style={S.tagQ}>{p.questions?.length} Qs</span>
                                    </td>

                                    {/* Date */}
                                    <td style={{ ...S.td, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <span style={S.dateCell}>{new Date(p.createdAt).toLocaleDateString()}</span>
                                    </td>

                                    {/* Status */}
                                    <td style={{ ...S.td, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <span style={{
                                            ...S.tagClass, 
                                            background: p.status === 'Approved' ? '#dcfce7' : p.status === 'Rejected' ? '#fee2e2' : '#fef9c3',
                                            color: p.status === 'Approved' ? '#166534' : p.status === 'Rejected' ? '#991b1b' : '#854d0e',
                                            border: 'none'
                                        }}>
                                            {p.status || 'Pending Approval'}
                                        </span>
                                    </td>

                                    {/* Actions */}
                                    <td style={{ ...S.tdLast, borderBottom: i === filteredPapers.length - 1 ? 'none' : '1px solid #f1f5f9' }}>
                                        <div style={S.actionCell}>
                                            <button
                                                style={S.btnView}
                                                onClick={() => setSelectedPaper(p)}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#2563eb'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#2563eb'; }}
                                            >
                                                View
                                            </button>
                                            <button
                                                style={S.btnDel}
                                                onClick={e => handleDelete(e, p._id)}
                                                onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#dc2626'; }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SavedPapers;