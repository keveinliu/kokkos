import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEdit from './pages/ArticleEdit';
import Categories from './pages/Categories';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import FirstTimeSetup from './components/FirstTimeSetup';

function App() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Router>
        <AuthProvider>
          <FirstTimeSetup>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/article/:id" element={<ArticleDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/edit/:id?" 
                  element={
                    <ProtectedRoute>
                      <ArticleEdit />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/categories" 
                  element={
                    <ProtectedRoute>
                      <Categories />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </Layout>
            <Toaster position="top-right" richColors />
          </FirstTimeSetup>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;