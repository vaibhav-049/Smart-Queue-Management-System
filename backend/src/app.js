const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Data Sanitization against NoSQL injection
app.use(mongoSanitize());

// Logging Middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');

// Default base route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Smart Queue Management System API. View docs at /api-docs',
    version: '1.0.0',
  });
});

// Swagger UI Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mounting API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

module.exports = app;
