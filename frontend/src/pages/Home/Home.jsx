import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { m, useMotionValue, useTransform, animate } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';
import { FiArrowRight, FiCheck, FiStar } from 'react-icons/fi';
import api from '../../services/api';

function AnimatedNumber({ value, suffix = '' }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, v => Math.round(v).toLocaleString());

  useEffect(() => {
    const controls = animate(count, value, { duration: 2.5, ease: 'easeOut' });
    return controls.stop;
  }, [value, count]);

  return (
    <span>
      <m.span>{rounded}</m.span>{suffix}
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

export default function Home() {
  const { darkMode } = useTheme();
  const [dynamicStats, setDynamicStats] = useState({
    tokensServedToday: 0,
    activeUsers: 0,
    waitTimeReduced: 0,
  });

  useEffect(() => {
    api.get('/queues/public-stats')
      .then((res) => {
        if (res.data && res.data.success) {
          setDynamicStats(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Error fetching public stats:', err);
      });
  }, []);

  const showPlusAfterThousand = (value) => Number(value) > 1000 ? '+' : '';

  const stats = [
    { label: 'Tokens Served Today', value: dynamicStats.tokensServedToday, suffix: showPlusAfterThousand(dynamicStats.tokensServedToday) },
    { label: 'Active Users', value: dynamicStats.activeUsers, suffix: showPlusAfterThousand(dynamicStats.activeUsers) },
    { label: 'Wait Time Reduced', value: dynamicStats.waitTimeReduced, suffix: '%' },
  ];



  return (
    <div className={`home-page ${darkMode ? 'dark' : ''}`}>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="hero-shape shape-1" />
          <div className="hero-shape shape-2" />
          <div className="hero-shape shape-3" />
        </div>
        <div className="hero-container centered-hero">
          <m.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <m.span
              className="hero-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              ⚡ Next-Gen Queue Management
            </m.span>
            <h1 className="hero-title">
              Smart Queue<br />
              <span className="hero-gradient-text">Management System</span>
            </h1>
            <p className="hero-subtitle">
              Eliminate long queues and reduce wait times by up to 40%. Designed for hospitals, banks, colleges,
              government offices, and salons. Book tokens, track queues, and get served — all digitally.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary-lg">
                Get Started <FiArrowRight />
              </Link>
              <a href="#features" className="btn-secondary-lg" aria-label="Learn more about features">
                Learn More
              </a>
            </div>
          </m.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-container">
          <m.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything you need to manage queues</h2>
            <p className="section-desc">Powerful features designed to streamline queue management and enhance customer experience.</p>
          </m.div>

          <div className="features-grid">
            {features.map((feature) => (
              <m.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -8, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="section-container">
          <div className="stats-grid-home">
            {stats.map((stat, index) => (
              <m.div
                key={stat.label}
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
              </m.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="section-container">
          <m.div
            className="cta-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to eliminate long queues?</h2>
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
          </m.div>
        </div>
      </section>
    </div>
  );
}
