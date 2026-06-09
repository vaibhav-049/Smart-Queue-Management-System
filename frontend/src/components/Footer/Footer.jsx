import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { FiGithub, FiTwitter, FiLinkedin, FiMail } from 'react-icons/fi';

export default function Footer() {
  const { darkMode } = useTheme();

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
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="GitHub"><FiGithub size={18} /></a>
              <a href="#" className="social-link" aria-label="Twitter"><FiTwitter size={18} /></a>
              <a href="#" className="social-link" aria-label="LinkedIn"><FiLinkedin size={18} /></a>
              <a href="#" className="social-link" aria-label="Email"><FiMail size={18} /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/book-token">Book Token</Link>
            <Link to="/queue-status">Queue Status</Link>
            <Link to="/my-tokens">My Tokens</Link>
          </div>

          {/* Services */}
          <div className="footer-col">
            <h4>Services</h4>
            <a href="#">Hospital</a>
            <a href="#">Bank</a>
            <a href="#">College Office</a>
            <a href="#">Government Office</a>
            <a href="#">Salon</a>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4>Contact</h4>
            <p>smartqueue@example.com</p>
            <p>+91 98765 43210</p>
            <p>New Delhi, India</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SmartQueue. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
