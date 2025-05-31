import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/components/Home';
import BlogPost from './pages/components/BlogPost';
import AdminDashboard from './pages/components/AdminDashboard';
import Login from './pages/components/Login';
import CreateBlog from './pages/components/CreateBlog';
import EditBlog from './pages/components/EditBlog';
import ManageAds from './pages/components/ManageAds';
import CreateAdVendor from './pages/components/CreateAdVendor';
import EditVendor from './pages/components/EditVendor';
import './App.css';

const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-spinner" />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/blog/:id" element={<BlogPost />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/create-blog" element={<CreateBlog />} />
              <Route path="/edit-blog/:id" element={<EditBlog />} />
              <Route path="/manage-ads" element={<ManageAds />} />
              <Route path="/create-ad-vendor" element={<CreateAdVendor />} />
              <Route path="/edit-vendor/:id" element={<EditVendor />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
