import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdminPage = location.pathname === '/admin';

  return (
    <header className="header">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            BlogSpot
          </Link>
        </div>
        
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
        </div>

        <div className="nav-auth">
          {isLoggedIn ? (
            <>
              {!isAdminPage && (
                <Link to="/admin" className="auth-link admin-btn">
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className="auth-link logout-btn">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="auth-link login-btn">
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar; 