import React, { useState } from 'react';
import demoData from '../demoData';
import ResultCard from '../components/ResultCard';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [layer0, setLayer0] = useState(null);
  const [layers, setLayers] = useState({});
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  const handleDemoSelect = (demo) => {
    setLayer0(demo.layer0);
    setLayers(demo.layers);
    setIsDemo(true);
  };

  return (
    <div className="home">
      <h2 className="hero-title">RedPen checks your thinking, not just your code</h2>
      <p className="hero-pitch">
        Upload a photo or screenshot of your DSA attempt together with a brief description of your approach, and the AI will diagnose misconceptions, code bugs and alignment issues.
      </p>
      <div className="sample-grid">
        {demoData.map((demo, idx) => (
          <div key={idx} className="sample-card" onClick={() => handleDemoSelect(demo)} role="button" tabIndex={0} onKeyPress={() => handleDemoSelect(demo)}>
            <h4>{['Greedy Coin Change', 'Correct but Unusual', 'Approach / Code Mismatch'][idx]}</h4>
            <p>{demo.layers?.approach?.findings?.[0]?.claim || 'Sample description'}</p>
          </div>
        ))}
      </div>
      <button className="btn-primary" onClick={() => navigate('/submit')}>Try your own</button>
      {isDemo && <div className="banner">Sample / cached, not your input</div>}
      {layer0 && <ResultCard title="Ingest (Layer 0)" data={layer0} />}
      {Object.entries(layers).map(([key, val]) => (
        <ResultCard key={key} title={key.charAt(0).toUpperCase() + key.slice(1)} data={val} />
      ))}
    </div>
  );
}
