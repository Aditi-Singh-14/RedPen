import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'redpen_records';

function formatDate(ts) {
  return new Date(ts).toLocaleString();
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
      <h2>Analysis Records</h2>
      {totals.total === 0 ? (
        <div className="empty-state">
          <p>
            No records yet. <Link to="/submit">Try an analysis</Link>.
          </p>
        </div>
      ) : (
        <>
          <div className="stats">
            <div className="stat-tile">
              <div className="num">{totals.total}</div>
              <div className="label">Analyses</div>
            </div>
            <div className="stat-tile">
              <div className="num">{totals.approach}</div>
              <div className="label">Approach findings</div>
            </div>
            <div className="stat-tile">
              <div className="num">{totals.code}</div>
              <div className="label">Code findings</div>
            </div>
            <div className="stat-tile">
              <div className="num">{totals.alignment}</div>
              <div className="label">Alignment findings</div>
            </div>
          </div>
          <div className="records-toolbar">
            <button type="button" className="btn-cta" onClick={clearRecords}>
              Clear records
            </button>
          </div>
          <ul className="record-list">
            {records.map((rec, idx) => (
              <li key={idx} className="record-item">
                <p><strong>{formatDate(rec.timestamp)}</strong></p>
                {rec.approachSnippet && (
                  <p>Approach snippet: <em>{rec.approachSnippet}</em></p>
                )}
                <p>
                  Findings — Approach: {rec.findings?.approach || 0}, Code: {rec.findings?.code || 0}, Alignment: {rec.findings?.alignment || 0}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
