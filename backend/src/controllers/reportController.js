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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const matchStage = {
      createdAt: { $gte: sevenDaysAgo }
    };
    if (req.user && req.user.service) {
      matchStage.service = req.user.service.toLowerCase();
    }

    const aggregation = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" },
          tokens: { $sum: 1 },
          avgWaitTime: { $avg: "$waitTime" }
        }
      }
    ]);

    // Map dayOfWeek (1=Sun, 2=Mon...7=Sat) to string labels
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyQueueData = [];
    
    // Build rolling 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayIndex = d.getDay(); // 0-6 (Sun-Sat)
      
      // MongoDB $dayOfWeek is 1-7 (1=Sun, 7=Sat)
      const found = aggregation.find(a => a._id === (dayIndex + 1));
      dailyQueueData.push({
        day: days[dayIndex],
        tokens: found ? found.tokens : 0,
        waitTime: found && found.avgWaitTime ? Math.round(found.avgWaitTime) : 0
      });
    }

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
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const matchStage = {
      createdAt: { $gte: sixMonthsAgo }
    };
    if (req.user && req.user.service) {
      matchStage.service = req.user.service.toLowerCase();
    }

    const aggregation = await Token.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          tokens: { $sum: 1 }
        }
      }
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = [];
    
    // Build rolling 6 months ending this month
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthNum = d.getMonth() + 1; // 1-12
      const yearNum = d.getFullYear();
      
      const found = aggregation.find(a => a._id.month === monthNum && a._id.year === yearNum);
      monthlyData.push({
        month: months[monthNum - 1],
        tokens: found ? found.tokens : 0
      });
    }

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
