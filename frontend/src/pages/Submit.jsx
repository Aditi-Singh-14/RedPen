import React, { useState } from 'react';
import UploadPane from '../components/UploadPane';
import ResultCard from '../components/ResultCard';

const STORAGE_KEY = 'redpen_records';
const ANALYZE_URL = new URL(
  import.meta.env.VITE_API_URL || '/analyze',
  'http://localhost:8000',
).toString();

export default function Submit() {
  const [layer0, setLayer0] = useState(null);
  const [layers, setLayers] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    try {
      const resp = await fetch(ANALYZE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const responseBody = await resp.text();
      if (!resp.ok) {
        const requestError = new Error(`Request failed (${resp.status})`);
        requestError.responseBody = responseBody || '(empty response body)';
        try {
          const serverError = JSON.parse(responseBody);
          requestError.serverError = serverError.error;
          requestError.step = serverError.step;
        } catch {
          // Keep the raw response body when the server response is not JSON.
        }
        throw requestError;
      }
      let data;
      try {
        data = JSON.parse(responseBody);
      } catch {
        const requestError = new Error('Request returned invalid JSON');
        requestError.responseBody = responseBody || '(empty response body)';
        throw requestError;
      }
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
      setError({
        message: e.name === 'AbortError' ? 'Request timed out after 20 seconds.' : (e.serverError || e.message),
        step: e.step || (e.name === 'AbortError' ? 'request' : 'unknown'),
        url: ANALYZE_URL,
        body: e.responseBody || 'No response body was received.',
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  return (
    <div className="submit-page">
      <h2>Submit your DSA attempt</h2>
      <UploadPane onSubmit={handleSubmit} loading={loading} />
      {loading && <p className="status-line">Analyzing… please wait.</p>}
      {error && (
        <div className="status-line error">
          <p>Error: {error.message}</p>
          <p>Step: {error.step}</p>
          <p>Request URL: {error.url}</p>
          <p>Response body: {error.body}</p>
        </div>
      )}
      {layer0 && <ResultCard title="Ingest (Layer 0)" data={layer0} />}
      {Object.entries(layers).map(([key, val]) => (
        <ResultCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} data={val} />
      ))}
    </div>
  );
}
