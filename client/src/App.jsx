import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout.jsx";
import Landing from "./pages/Landing.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Timetable from "./pages/Timetable.jsx";
import Notes from "./pages/Notes.jsx";
import Calendar from "./pages/Calendar.jsx";
import Assistant from "./pages/Assistant.jsx";
import NotFound from "./pages/NotFound.jsx";

// Jump back to the top of the page whenever the address changes
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public front page */}
        <Route path="/" element={<Landing />} />

        {/* The app: every page below shares the sidebar and top bar */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="notes" element={<Notes />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="assistant" element={<Assistant />} />
        </Route>

        {/* Anything else */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}