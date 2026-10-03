import React from 'react';

function isIngest(data) {
  return data && (data.problem_statement || data.code || data.approach || data.language);
}

function ResultCard({ title, data }) {
  if (!data) return null;

  if (isIngest(data) && !Array.isArray(data.findings)) {
    return (
      <div className="result-card">
        <h3>{title}</h3>
        {data.problem_statement && (
          <div className="ingest-block">
            <span className="label">Problem</span>
            <p className="claim">{data.problem_statement}</p>
          </div>
        )}
        {data.approach && (
          <div className="ingest-block">
            <span className="label">Approach</span>
            <p>{data.approach}</p>
          </div>
        )}
        {data.code && (
          <div className="ingest-block">
            <span className="label">Code{data.language ? ` · ${data.language}` : ''}</span>
            <pre>{data.code}</pre>
          </div>
        )}
        <p className="ai-read">The AI’s read of the uploaded attempt.</p>
      </div>
    );
  }

  const findings = Array.isArray(data.findings) ? data.findings : [];
  const isNoIssues = data.status === 'no_issues' || findings.length === 0;

  return (
    <div className={`result-card${isNoIssues ? ' green' : ''}`}>
      <h3>{title}</h3>
      {isNoIssues ? (
        <p className="no-issues-stamp">No issues</p>
      ) : (
        <ul className="finding-list">
          {findings.map((f, idx) => (
            <li key={idx}>
              <span className="claim">
                {(f.severity || 'info').toUpperCase()}: {f.claim}
              </span>
              {f.confidence && <span className="confidence-chip">{f.confidence}</span>}
              {f.location && (
                <div className="meta-row">
                  <em>Location:</em> {f.location}
                </div>
              )}
              {f.evidence && (
                <div className="evidence">{f.evidence}</div>
              )}
              {f.suggestion && f.suggestion !== 'None' && (
                <div className="meta-row">
                  <em>Suggestion:</em> {f.suggestion}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="ai-read">This is the AI’s read, not an executed verdict.</p>
    </div>
  );
}

export default ResultCard;
