import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import RoomCreator from './components/RoomCreator';
import RoomJoiner from './components/RoomJoiner';
import FileTransfer from './components/FileTransfer';
import BackgroundOrbs from './components/BackgroundOrbs';
import { useWebRTC } from './hooks/useWebRTC';
import './global.css';

function App() {
  const rtcState = useWebRTC();

  return (
    <Router>
      <BackgroundOrbs />
      <div className="container">
        {/* We can pass rtcState to components to avoid multiple context providers if preferred, 
            or use it at the App level to handle global routing and state passing */}
        <Routes>
          <Route path="/" element={<Home rtcState={rtcState} />} />
          <Route path="/create" element={<RoomCreator rtcState={rtcState} />} />
          <Route path="/join" element={<RoomJoiner rtcState={rtcState} />} />
          <Route path="/transfer" element={<FileTransfer rtcState={rtcState} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
