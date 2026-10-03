import React, { useState } from 'react';
import UploadPane from '../components/UploadPane';
import ResultCard from '../components/ResultCard';

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
      setLayers(data.layers || {});

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
        localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
      } catch (e) {
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
      <h2>Submit your DSA attempt</h2>
      <UploadPane onSubmit={handleSubmit} loading={loading} />
      {loading && <p className="status-line">Analyzing… please wait.</p>}
      {error && <p className="status-line error">Error: {error}</p>}
      {layer0 && <ResultCard title="Ingest (Layer 0)" data={layer0} />}
      {Object.entries(layers).map(([key, val]) => (
        <ResultCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} data={val} />
      ))}
    </div>
  );
}
