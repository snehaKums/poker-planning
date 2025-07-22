import React from 'react';
import { BrowserRouter, Routes, Route} from 'react-router-dom';
import Session from './poker/session';
import Main from './poker/main';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Session />} />
        <Route path="/session/:sessionId" element={<Main />} />
      </Routes>
    </BrowserRouter>
  );
}
