import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import JoinMeetingHost from "./JoinMeeting/JoinMeetingHost";
import Particepents from "./JoinMeeting/Particepents";

const App = () => {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/particepent" element={<Particepents />} />
          <Route path="/joinmeetinghost" element={<JoinMeetingHost />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App