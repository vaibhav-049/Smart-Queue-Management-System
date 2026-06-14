const Token = require('../models/Token');

/**
 * @desc    Generate and download queue analytical reports (CSV or JSON)
 * @route   GET /api/reports/download
 * @access  Private (Admin Only)
 */
const downloadReport = async (req, res, next) => {
  try {
    const { format, service, startDate, endDate } = req.query;

    // Build filter query
    const filter = {};

    if (req.user && req.user.service) {
      filter.service = req.user.service.toLowerCase();
    } else if (service) {
      filter.service = service.toLowerCase();
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // Fetch tokens sorting by date
    const tokens = await Token.find(filter).sort({ createdAt: -1 });

    if (format === 'csv') {
      // Create CSV Headers
      const headers = [
        'Token ID',
        'Customer Name',
        'Mobile Number',
        'Service Name',
        'Priority Tier',
        'Time Slot',
        'Queue Status',
        'Wait Time (min)',
        'Created At',
      ];

      // Format CSV lines
      const csvRows = [headers.join(',')];

      for (const token of tokens) {
        const row = [
          `"${token.displayId}"`,
          `"${token.name.replace(/"/g, '""')}"`,
          `"${token.phone}"`,
          `"${token.service.toUpperCase()}"`,
          `"${token.priority.toUpperCase()}"`,
          `"${token.timeSlot}"`,
          `"${token.status.toUpperCase()}"`,
          token.waitTime,
          `"${new Date(token.createdAt).toISOString()}"`,
        ];
        csvRows.push(row.join(','));
      }

      const csvContent = csvRows.join('\n');

      // Send CSV file
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=queue_report_${new Date().toISOString().substring(0, 10)}.csv`
      );
      return res.status(200).send(csvContent);
    }

    // Default to JSON response
    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get daily report summary
 * @route   GET /api/reports/daily
 * @access  Private (Admin Only)
 */
const getDailyReport = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const serviceFilter = req.user && req.user.service ? { service: req.user.service.toLowerCase() } : {};

    const totalTokens = await Token.countDocuments({ ...serviceFilter, createdAt: { $gte: startOfToday, $lte: endOfToday } });
    const completed = await Token.countDocuments({ ...serviceFilter, status: 'completed', updatedAt: { $gte: startOfToday, $lte: endOfToday } });
    const cancelled = await Token.countDocuments({ ...serviceFilter, status: 'cancelled', updatedAt: { $gte: startOfToday, $lte: endOfToday } });

    res.status(200).json({
      success: true,
      date: new Date().toISOString().substring(0, 10),
      totalTokens,
      completed,
      cancelled,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get weekly report summary
 * @route   GET /api/reports/weekly
 * @access  Private (Admin Only)
 */
const getWeeklyReport = async (req, res, next) => {
  try {
    const dailyQueueData = [
      { day: 'Mon', tokens: 180, waitTime: 12 },
      { day: 'Tue', tokens: 220, waitTime: 15 },
      { day: 'Wed', tokens: 195, waitTime: 11 },
      { day: 'Thu', tokens: 250, waitTime: 18 },
      { day: 'Fri', tokens: 310, waitTime: 20 },
      { day: 'Sat', tokens: 275, waitTime: 16 },
      { day: 'Sun', tokens: 140, waitTime: 8 },
    ];

    res.status(200).json({
      success: true,
      data: dailyQueueData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get monthly report summary
 * @route   GET /api/reports/monthly
 * @access  Private (Admin Only)
 */
const getMonthlyReport = async (req, res, next) => {
  try {
    const monthlyData = [
      { month: 'Jan', tokens: 3200 },
      { month: 'Feb', tokens: 3800 },
      { month: 'Mar', tokens: 4100 },
      { month: 'Apr', tokens: 3900 },
      { month: 'May', tokens: 4500 },
      { month: 'Jun', tokens: 4200 },
    ];

    res.status(200).json({
      success: true,
      data: monthlyData,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  downloadReport,
  getDailyReport,
  getWeeklyReport,
  getMonthlyReport,
};
