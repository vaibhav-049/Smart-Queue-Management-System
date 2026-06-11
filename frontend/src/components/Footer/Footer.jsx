import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Footer() {
  const { darkMode } = useTheme();
  const { user } = useAuth();

  return (
    <footer className={`footer ${darkMode ? 'dark' : ''}`}>
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <span className="logo-icon">⚡</span>
              <span className="logo-text">Smart<span className="logo-highlight">Queue</span></span>
            </Link>
            <p className="footer-desc">
              Modern queue management system for hospitals, banks, colleges, government offices, and salons. Reduce wait times, improve efficiency.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            {!user ? (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            ) : (
              <>
                <Link to="/book-token">Book Token</Link>
                <Link to="/queue-status">Queue Status</Link>
                <Link to="/my-tokens">My Tokens</Link>
              </>
            )}
          </div>

          {/* Services */}
          {user && (
            <div className="footer-col">
              <h4>Services</h4>
              <Link to="/book-token">Hospital</Link>
              <Link to="/book-token">Bank</Link>
              <Link to="/book-token">College Office</Link>
              <Link to="/book-token">Government Office</Link>
              <Link to="/book-token">Salon</Link>
            </div>
          )}

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <p><a href="mailto:rvaibhav403@gmail.com">rvaibhav403@gmail.com</a></p>
            <p><a href="mailto:soumyabansal184@gmail.com">soumyabansal184@gmail.com</a></p>
            <p>Uttrakhand, Dehradun,India</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p suppressHydrationWarning>&copy; {new Date().getFullYear()} SmartQueue. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
