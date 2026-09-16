import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Shell } from "./components/Shell";
import Home from "./pages/Home";
import Queue from "./pages/Queue";
import Library from "./pages/Library";
import Favorites from "./pages/Favorites";
import Settings from "./pages/Settings";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="min-h-full"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.18 } }}
        exit={{ opacity: 0, y: -6, transition: { duration: 0.12 } }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/queue" element={<Queue />} />
          <Route path="/library" element={<Library />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route path="/*" element={<AnimatedRoutes />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
