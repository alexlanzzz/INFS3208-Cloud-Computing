import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomeScreen from './components/HomeScreen';
import PlanNewTrip from './components/PlanNewTrip';
import DestinationSelection from './components/DestinationSelection';
import MyJourney from './components/Myjourney';
import DestinationDetail from './components/DestinationDetail';
import CommentPage from './components/CommentPage';
import Agreement from './components/Agreement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/plan-trip" element={<PlanNewTrip />} />
          <Route path="/destinations" element={<DestinationSelection />} />
          <Route path="/destination-detail" element={<DestinationDetail />} />
          <Route path="/comment" element={<CommentPage />} />
          <Route path="/agreement" element={<Agreement />} />
          <Route path="/my-journey" element={<MyJourney />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;