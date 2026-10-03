import React, { useState } from 'react';

function UploadPane({ onSubmit }) {
  const [imageBase64, setImageBase64] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const [approachText, setApproachText] = useState(''); // new state for approach

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Resize canvas to max 1600px on longest side
      const img = new Image();
      img.onload = () => {
        const maxSide = 1600;
        const scale = Math.min(maxSide / img.width, maxSide / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        setImageBase64(base64);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const payload = {};
    if (imageBase64) payload.image_base64 = imageBase64;
    if (fallbackText.trim()) payload.fallback_text = fallbackText.trim();
    if (approachText.trim()) payload.approach_text = approachText.trim(); // send separate field
    onSubmit(payload);
  };

  return (
    <div className="card">
      <h2>Upload DSA attempt</h2>
      <p>Upload an image or provide raw text and your approach.</p>
      <input type="file" accept="image/*" onChange={handleFile} />
      <p>Or paste / type the raw text below (fallback if vision fails):</p>
      <textarea
        rows={4}
        placeholder="Enter problem statement, code, fallback text..."
        value={fallbackText}
        onChange={(e) => setFallbackText(e.target.value)}
        style={{ width: '100%', marginTop: '0.5rem' }}
      />
      {/* Separate textarea for the user’s approach */}
      <textarea
        rows={3}
        placeholder="Enter your approach (optional)"
        value={approachText}
        onChange={(e) => setApproachText(e.target.value)}
        style={{ width: '100%', marginTop: '0.5rem' }}
      />
      <button onClick={handleSubmit} style={{ marginTop: '0.5rem' }}>
        Analyze
      </button>
    </div>
  );
}

export default UploadPane;
