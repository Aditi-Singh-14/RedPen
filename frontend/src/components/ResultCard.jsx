import React from 'react';

function ResultCard({ title, data }) {
  const isNoIssues = data.status === 'no_issues' || (Array.isArray(data.findings) && data.findings.length === 0);
  const cardClass = isNoIssues ? 'card green' : 'card red';

  return (
    <div className={cardClass} style={{ marginTop: '1rem' }}>
      <h3>{title}</h3>
      {isNoIssues ? (
        <p>✅ No issues found.</p>
      ) : (
        <ul>
          {data.findings.map((f, idx) => (
            <li key={idx} style={{ marginBottom: '0.5rem' }}>
              <strong>{f.severity?.toUpperCase() || 'INFO'}:</strong> {f.claim}<br />
              <em>Location:</em> {f.location}<br />
              <em>Evidence:</em> {f.evidence}<br />
              <em>Suggestion:</em> {f.suggestion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ResultCard;
