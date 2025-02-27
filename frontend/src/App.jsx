import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuthStatus } from './store/slices/authSlice';

// Components and Layouts
import MainLayout from './components/layout/MainLayout';
import PrivateRoute from './components/auth/PrivateRoute';

// Pages
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import ChapterView from './pages/ChapterView';
import LessonView from './pages/LessonView';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Achievements from './pages/Achievements';
import Leaderboard from './pages/Leaderboard';

// Auth checker component
function AuthChecker({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  return children;
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthChecker>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<PrivateRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chapters/:chapterId" element={<ChapterView />} />
                <Route path="/chapters/:chapterId/lessons/:lessonId" element={<LessonView />} />
                <Route path="/chapters/:chapterId/quiz" element={<Quiz />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/achievements" element={<Achievements />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
              </Route>
            </Route>

            {/* Redirect to dashboard if user goes to old root path */}
            <Route path="/index" element={<Navigate to="/dashboard" replace />} />

            {/* 404 - Redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthChecker>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
