import React, { useState } from 'react';
import UploadPane from '../components/UploadPane';
import ResultCard from '../components/ResultCard';

// Key used for persisting analysis records
const STORAGE_KEY = 'redpen_records';

export default function Submit() {
  const [layer0, setLayer0] = useState(null);
  const [layers, setLayers] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch('/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Server error ${resp.status}: ${txt}`);
      }
      const data = await resp.json();
      setLayer0(data.layer0);
      setLayers(data.layers);

      // Persist record (only for real analyses)
      try {
        const record = {
          timestamp: Date.now(),
          approachSnippet: payload.approach_text?.slice(0, 30) || '',
          findings: {
            approach: data.layers?.approach?.findings?.length || 0,
            code: data.layers?.code?.findings?.length || 0,
            alignment: data.layers?.alignment?.findings?.length || 0,
          },
        };
        const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const updated = [record, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        // Swallow storage errors – they shouldn't break UI
        console.warn('Failed to store analysis record', e);
      }
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-page">
      <h2 style={{ fontFamily: "'Fraunces', serif" }}>Submit your DSA attempt</h2>
      <UploadPane onSubmit={handleSubmit} />
      {loading && <p>Analyzing… please wait.</p>}
      {error && <p style={{ color: 'var(--red-pen)' }}>Error: {error}</p>}
      {layer0 && (
        <div style={{ marginTop: '1rem' }}>
          <ResultCard title="Ingest (Layer 0)" data={layer0} />
          {Object.entries(layers).map(([key, val]) => (
            <ResultCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} data={val} />
          ))}
        </div>
      )}
    </div>
  );
}
