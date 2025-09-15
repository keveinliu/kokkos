import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useTheme } from './hooks/useTheme';
import Layout from './components/Layout';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEdit from './pages/ArticleEdit';
import Categories from './pages/Categories';
import Settings from './pages/Settings';

function App() {
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/edit/:id?" element={<ArticleEdit />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;