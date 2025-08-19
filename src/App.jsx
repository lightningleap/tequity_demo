// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { checkAuth } from './store/authThunk';
import ShadcnChatBotGroq from "./components/ShadcnChatBotGroq";
import SignIn from "./pages/signin";
import SignUp from "./pages/signup";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Navbar from "./components/Navbar";
import DataRoom from "./pages/dataRoom";

// Layout component for authenticated routes
const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="">
        <Outlet /> {/* Nested routes render here */}
      </main>
    </div>
  );
};

function AppContent() {
  const dispatch = useDispatch();
  const { isAuthenticated, initialized } = useSelector((state) => ({
    isAuthenticated: state.auth.isAuthenticated,
    initialized: state.auth.initialized
  }));

  // Check auth status on initial load
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  // Show loading state while checking auth
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/signin"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignIn />}
        />
        <Route
          path="/signup"
          element={isAuthenticated ? <Navigate to="/" replace /> : <SignUp />}
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route element={<Layout />}>
            <Route path="/chatbot" element={<ShadcnChatBotGroq />} />
            <Route path="/" element={<DataRoom />} />
          </Route>
        </Route>

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/signin" replace />
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
