import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  return (
    <nav className="nav-bar">
      <div className="nav-brand"><Link to="/" className="brand-link">RedPen</Link></div>
      <div className="nav-links">
        <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
        <Link to="/submit" className={isActive('/submit') ? 'active' : ''}>Submit</Link>
        <Link to="/records" className={isActive('/records') ? 'active' : ''}>Records</Link>
      </div>
    </nav>
  );
}
