const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { generalLimiter } = require('./middleware/rateLimitMiddleware');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const { notFound, errorHandler } = require('./middleware/errorMiddleware');


const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const queueRoutes = require('./routes/queueRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]
  .filter(Boolean)
  .flatMap(origin => origin.split(',').map(item => item.trim()))
  .filter(Boolean);


app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin) return callback(null, true);
      
      
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      
      if (allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);


app.use('/api', generalLimiter);


app.use(mongoSanitize());


app.use(xss());


if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./config/swagger.json');


app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Smart Queue Management System API. View docs at /api-docs',
    version: '1.0.0',
  });
});


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const branchRoutes = require('./routes/branchRoutes');


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/branches', branchRoutes);


app.use(notFound);
app.use(errorHandler);

module.exports = app;
