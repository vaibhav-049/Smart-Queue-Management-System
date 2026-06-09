import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiArrowRight, FiCheck, FiStar } from 'react-icons/fi';
import { testimonials, dashboardStats } from '../../services/mockData';

function AnimatedNumber({ value, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return (
    <span>
      <motion.span>{rounded}</motion.span>{suffix}
    </span>
  );
}

const features = [
  { icon: '🎫', title: 'Online Token Booking', desc: 'Book your queue token from anywhere, anytime. Skip the physical lines.' },
  { icon: '📡', title: 'Live Queue Tracking', desc: 'Track your queue position in real-time with instant updates.' },
  { icon: '📱', title: 'QR Token', desc: 'Get a digital QR-based token for contactless check-in at service counters.' },
  { icon: '⏱️', title: 'Estimated Wait Time', desc: 'Know exactly how long you\'ll wait with AI-powered estimations.' },
  { icon: '⚡', title: 'Priority Queue', desc: 'Emergency, senior citizen, and VIP priority lanes for faster service.' },
  { icon: '📊', title: 'Admin Analytics', desc: 'Comprehensive dashboard with real-time analytics and reporting.' },
];

const stats = [
  { label: 'Tokens Served Today', value: dashboardStats.tokensServedToday, suffix: '+' },
  { label: 'Active Users', value: 1520, suffix: '+' },
  { label: 'Wait Time Reduced', value: 40, suffix: '%' },
];

export default function Home() {
  const { darkMode } = useTheme();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`home-page ${darkMode ? 'dark' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="hero-shape shape-1" />
          <div className="hero-shape shape-2" />
          <div className="hero-shape shape-3" />
        </div>
        <div className="hero-container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.span
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              ⚡ Next-Gen Queue Management
            </motion.span>
            <h1 className="hero-title">
              Smart Queue<br />
              <span className="hero-gradient-text">Management System</span>
            </h1>
            <p className="hero-subtitle">
              Eliminate long queues and reduce wait times by up to 40%. Designed for hospitals, banks, colleges,
              government offices, and salons. Book tokens, track queues, and get served — all digitally.
            </p>
            <div className="hero-actions">
              <Link to="/book-token" className="btn-primary-lg">
                Get Started <FiArrowRight />
              </Link>
              <a href="#features" className="btn-secondary-lg">
                Learn More
              </a>
            </div>
            <div className="hero-trust">
              <div className="hero-trust-avatars">
                {['VP', 'PS', 'RV', 'AG'].map((initials, i) => (
                  <div key={i} className="hero-avatar" style={{ zIndex: 4 - i }}>
                    {initials}
                  </div>
                ))}
              </div>
              <p>Trusted by <strong>2,500+</strong> organizations</p>
            </div>
          </motion.div>

          <motion.div
            className="hero-visual"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="hero-dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span className="dot red" />
                  <span className="dot yellow" />
                  <span className="dot green" />
                </div>
                <span className="preview-title">SmartQueue Dashboard</span>
              </div>
              <div className="preview-body">
                <div className="preview-stat-row">
                  <div className="preview-stat">
                    <span className="preview-stat-value">287</span>
                    <span className="preview-stat-label">Tokens Today</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-value">14m</span>
                    <span className="preview-stat-label">Avg Wait</span>
                  </div>
                  <div className="preview-stat">
                    <span className="preview-stat-value">5</span>
                    <span className="preview-stat-label">Active Queues</span>
                  </div>
                </div>
                <div className="preview-queue">
                  <div className="preview-queue-item serving">
                    <span className="pq-token">A089</span>
                    <span className="pq-status">Serving</span>
                  </div>
                  <div className="preview-queue-item">
                    <span className="pq-token">A090</span>
                    <span className="pq-status">Next</span>
                  </div>
                  <div className="preview-queue-item">
                    <span className="pq-token">A091</span>
                    <span className="pq-status">Waiting</span>
                  </div>
                </div>
                <div className="preview-chart">
                  <div className="chart-bar" style={{ height: '60%' }} />
                  <div className="chart-bar" style={{ height: '80%' }} />
                  <div className="chart-bar" style={{ height: '45%' }} />
                  <div className="chart-bar" style={{ height: '90%' }} />
                  <div className="chart-bar" style={{ height: '70%' }} />
                  <div className="chart-bar active" style={{ height: '85%' }} />
                  <div className="chart-bar" style={{ height: '50%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything you need to manage queues</h2>
            <p className="section-desc">Powerful features designed to streamline queue management and enhance customer experience.</p>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid-home">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-card-home"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
              >
                <h3 className="stat-value-home">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </h3>
                <p className="stat-label-home">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="section-container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Testimonials</span>
            <h2 className="section-title">Trusted by industry leaders</h2>
          </motion.div>

          <div className="testimonials-wrapper">
            {testimonials.map((t, index) => (
              <motion.div
                key={t.id}
                className={`testimonial-card ${index === activeTestimonial ? 'active' : ''}`}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="testimonial-stars">
                  {[...Array(t.rating)].map((_, i) => (
                    <FiStar key={i} size={16} className="star-filled" />
                  ))}
                </div>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="testimonial-dots">
            {testimonials.map((_, i) => (
              <button
                key={i}
                className={`testimonial-dot ${i === activeTestimonial ? 'active' : ''}`}
                onClick={() => setActiveTestimonial(i)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <motion.div
            className="cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to eliminate long queues?</h2>
            <p>Join 2,500+ organizations already using SmartQueue to manage their queues efficiently.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn-primary-lg">
                Start Free Trial <FiArrowRight />
              </Link>
              <Link to="/login" className="btn-ghost-lg">
                Sign In
              </Link>
            </div>
            <div className="cta-features">
              <span><FiCheck /> Free 14-day trial</span>
              <span><FiCheck /> No credit card required</span>
              <span><FiCheck /> Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
