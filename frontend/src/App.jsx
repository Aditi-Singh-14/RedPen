import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Submit from './pages/Submit';
import Records from './pages/Records';

function App() {
  return (
    <Router>
      <NavBar />
      <div className="container" style={{ paddingTop: '1rem' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<Submit />} />
          <Route path="/records" element={<Records />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
