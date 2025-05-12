import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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

        {isLoggedIn && (
          <div className="nav-auth">
            <button onClick={handleLogout} className="auth-link logout-btn">
              Logout
            </button>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar; 