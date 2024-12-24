import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainDashboard from './pages/MainDashboard';
import WebsiteMonitorDashboard from './pages/WebsiteMonitorDashboard';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainDashboard />} />
        <Route path="/monitor/:website" element={<WebsiteMonitorDashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;