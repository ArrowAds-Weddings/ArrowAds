import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import MainSite from './MainSite';
import Admin from './Admin.tsx';
import './index.css';

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<MainSite />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}
