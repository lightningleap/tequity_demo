// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import ShadcnChatBotGroq from "./components/ShadcnChatBotGroq";
import SignIn from "./pages/signin";
import SignUp from "./pages/signup";
import { useSelector } from 'react-redux';
import ProtectedRoute from "./components/auth/ProtectedRoute";

function AppContent() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Router>
      <div className="h-screen w-screen bg-background overflow-hidden">
        <Routes>
          <Route path="/signin" element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignIn />
          } />
          <Route path="/signup" element={
            isAuthenticated ? <Navigate to="/" replace /> : <SignUp />
          } />
          <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
            <Route path="/" element={<ShadcnChatBotGroq />} />
          </Route>
          <Route path="*" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Navigate to="/signin" replace />
          } />
        </Routes>
      </div>
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