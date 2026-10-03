import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'redpen_records';

function formatDate(ts) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function Records() {
  const [records, setRecords] = useState([]);
  const [totals, setTotals] = useState({ total: 0, approach: 0, code: 0, alignment: 0 });

  const loadRecords = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setRecords(stored);
      const agg = stored.reduce(
        (acc, rec) => {
          acc.total += 1;
          acc.approach += rec.findings?.approach || 0;
          acc.code += rec.findings?.code || 0;
          acc.alignment += rec.findings?.alignment || 0;
          return acc;
        },
        { total: 0, approach: 0, code: 0, alignment: 0 }
      );
      setTotals(agg);
    } catch (e) {
      console.warn('Failed to load records from localStorage', e);
      setRecords([]);
      setTotals({ total: 0, approach: 0, code: 0, alignment: 0 });
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const clearRecords = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear records', e);
    }
    setRecords([]);
    setTotals({ total: 0, approach: 0, code: 0, alignment: 0 });
  };

  return (
    <div className="records-page">
      <h2 style={{ fontFamily: "'Fraunces', serif" }}>Analysis Records</h2>
      {totals.total === 0 ? (
        <p>
          No records yet. <Link to="/submit">Try an analysis</Link>.
        </p>
      ) : (
        <>
          <div className="summary" style={{ marginBottom: '1rem' }}>
            <p>Total analyses: {totals.total}</p>
            <p>Total findings – Approach: {totals.approach}, Code: {totals.code}, Alignment: {totals.alignment}</p>
            <button
              onClick={clearRecords}
              style={{
                backgroundColor: 'var(--red-pen)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '0.4rem 0.8rem',
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Clear records
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {records.map((rec, idx) => (
              <li
                key={idx}
                className="record-item"
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.8rem',
                  marginBottom: '0.8rem',
                }}
              >
                <p><strong>{formatDate(rec.timestamp)}</strong></p>
                {rec.approachSnippet && (
                  <p>Approach snippet: <em>{rec.approachSnippet}</em></p>
                )}
                <p>Findings – Approach: {rec.findings?.approach || 0}, Code: {rec.findings?.code || 0}, Alignment: {rec.findings?.alignment || 0}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
