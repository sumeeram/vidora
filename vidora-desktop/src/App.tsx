import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Shell } from "./components/Shell";

const Home = lazy(() => import("./pages/Home"));
const Queue = lazy(() => import("./pages/Queue"));
const Library = lazy(() => import("./pages/Library"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Settings = lazy(() => import("./pages/Settings"));

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} className="min-h-full">
        <Suspense fallback={<div className="loading loading-ring loading-lg mt-20 mx-auto block" />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/library" element={<Library />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
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
