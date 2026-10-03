import React from 'react';
import demoData from '../demoData';

function SampleButtons({ onSelect }) {
  const handleClick = (index) => {
    const demo = demoData[index];
    if (demo) {
      onSelect(demo);
    }
  };

  return (
    <div className="sample-buttons" style={{ marginBottom: '1rem' }}>
      <button onClick={() => handleClick(0)} style={buttonStyle}>Greedy Coin Change</button>
      <button onClick={() => handleClick(1)} style={buttonStyle}>Correct but Unusual</button>
      <button onClick={() => handleClick(2)} style={buttonStyle}>Approach / Code Mismatch</button>
    </div>
  );
}

const buttonStyle = {
  padding: '0.5rem 1rem',
  marginRight: '0.5rem',
  backgroundColor: 'var(--red-pen)',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontFamily: "'Inter', sans-serif",
};

export default SampleButtons;
