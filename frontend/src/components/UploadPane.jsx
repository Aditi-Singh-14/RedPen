import React, { useState } from 'react';

function UploadPane({ onSubmit, loading }) {
  const [imageBase64, setImageBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [fallbackText, setFallbackText] = useState('');
  const [approachText, setApproachText] = useState('');
  const [dragover, setDragover] = useState(false);

  const readImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
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
        setImageBase64(dataUrl.split(',')[1]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFile = (e) => {
    readImageFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    readImageFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = () => {
    const payload = {};
    if (imageBase64) payload.image_base64 = imageBase64;
    if (fallbackText.trim()) payload.fallback_text = fallbackText.trim();
    if (approachText.trim()) payload.approach_text = approachText.trim();
    onSubmit(payload);
  };

  const canSubmit = imageBase64 || fallbackText.trim() || approachText.trim();

  return (
    <div className="upload-card">
      <h3>Upload DSA attempt</h3>
      <p>Drop a photo or screenshot, or paste the problem and code as text.</p>
      <label
        className={`dropzone${dragover ? ' dragover' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragover(true);
        }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <span className="dropzone-title">Choose an image</span>
        <span className="dropzone-hint">PNG or JPG, resized on the client before upload</span>
        <input className="hidden-input" type="file" accept="image/*" onChange={handleFile} />
      </label>
      {fileName && <p className="preview-name">Attached: {fileName}</p>}
      <label className="field-label" htmlFor="fallback-text">Problem / code (fallback if vision fails)</label>
      <textarea
        id="fallback-text"
        className="code-input"
        rows={5}
        placeholder="Paste the problem statement and your code…"
        value={fallbackText}
        onChange={(e) => setFallbackText(e.target.value)}
      />
      <label className="field-label" htmlFor="approach-text">Your approach</label>
      <textarea
        id="approach-text"
        className="code-input"
        rows={3}
        placeholder="Describe how you thought about the problem…"
        value={approachText}
        onChange={(e) => setApproachText(e.target.value)}
      />
      <button className="btn-primary" onClick={handleSubmit} disabled={loading || !canSubmit}>
        {loading ? 'Analyzing…' : 'Analyze'}
      </button>
    </div>
  );
}

export default UploadPane;
