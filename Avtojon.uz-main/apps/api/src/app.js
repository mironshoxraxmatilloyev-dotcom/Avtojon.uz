const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth.routes');
const driverRoutes = require('./routes/driver.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const tripRoutes = require('./routes/trip.routes');
const expenseRoutes = require('./routes/expense.routes');
const salaryRoutes = require('./routes/salary.routes');
const driverPanelRoutes = require('./routes/driverPanel.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/driver', driverPanelRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Avtojon API ishlayapti! 🚀' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server xatosi'
  });
});

module.exports = app;
