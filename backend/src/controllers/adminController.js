const Token = require('../models/Token');
const Queue = require('../models/Queue');
const Service = require('../models/Service');
const User = require('../models/User');
const AdminInviteCode = require('../models/AdminInviteCode');
const { recalculateQueue } = require('../services/queueManager');
const { sendTokenAlerts } = require('../services/alertService');
const { emitUserNotification, emitQueueUpdate, emitTokenCalled, emitQueueCompleted } = require('../config/socket');
const { getLocalDateString } = require('../utils/dateUtils');


const callNextToken = async (req, res, next) => {
  try {
    const serviceParam = req.params.service || req.body.service;
    if (!serviceParam) {
      res.status(400);
      throw new Error('Please provide a service');
    }
    const service = serviceParam.toLowerCase();

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== service) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    const todayStr = getLocalDateString();

    
    const currentServingToken = await Token.findOne({ service, status: 'serving', bookingDate: todayStr });
    if (currentServingToken) {
      currentServingToken.status = 'completed';
      currentServingToken.waitTime = 0;
      currentServingToken.completedAt = new Date();
      await currentServingToken.save();
      sendTokenAlerts(currentServingToken._id, 'completed').catch(console.error);
    }

    
    const PRIORITY_RANKS = {
      'Emergency': 4,
      'Senior Citizen': 3,
      'VIP': 2,
      'Normal': 1,
      emergency: 4,
      'senior citizen': 3,
      senior: 3,
      vip: 2,
      normal: 1,
    };
    const waitingTokens = await Token.find({ service, status: 'waiting', bookingDate: todayStr });
    
    let nextToken = null;
    if (waitingTokens.length > 0) {
      
      waitingTokens.sort((a, b) => {
        const rankA = PRIORITY_RANKS[a.priority] || 1;
        const rankB = PRIORITY_RANKS[b.priority] || 1;
        if (rankA !== rankB) return rankB - rankA;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });

      nextToken = waitingTokens[0];
      nextToken.status = 'serving';
      nextToken.servedAt = new Date();
      nextToken.waitTime = 0;
      await nextToken.save();

      
      emitUserNotification(nextToken.userId, {
        id: Math.random().toString(),
        title: `Your token ${nextToken.displayId} is now active!`,
        message: `Please proceed to the counter. Your token is now being served.`,
        time: 'Just now',
        read: false,
        type: 'success',
      });

      
      emitTokenCalled(nextToken);
    } else {
      
      emitQueueCompleted(service);
    }

    
    await recalculateQueue(service, todayStr);

    res.status(200).json({
      success: true,
      message: nextToken 
        ? `Token ${nextToken.displayId} is now being served.` 
        : 'No waiting tokens in the queue.',
      data: {
        completedToken: currentServingToken,
        nowServing: nextToken,
      },
    });
  } catch (error) {
    next(error);
  }
};


const skipToken = async (req, res, next) => {
  try {
    const { tokenId } = req.params;
    const { service, tokenNumber } = req.body;

    const todayStr = getLocalDateString();

    let token;
    if (tokenId) {
      token = await Token.findById(tokenId);
    } else if (tokenNumber && service) {
      token = await Token.findOne({ displayId: tokenNumber, service: service.toLowerCase(), bookingDate: todayStr });
    }

    if (!token) {
      res.status(404);
      throw new Error('Token not found');
    }

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== token.service.toLowerCase()) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    if (token.status !== 'waiting' && token.status !== 'serving') {
      res.status(400);
      throw new Error(`Token is already in ${token.status} state`);
    }

    
    token.status = 'cancelled';
    token.waitTime = 0;
    token.completedAt = new Date(); 
    await token.save();
    sendTokenAlerts(token._id, 'cancelled').catch(console.error);

    
    emitUserNotification(token.userId, {
      id: Math.random().toString(),
      title: `Token ${token.displayId} has been skipped`,
      message: 'Your token was skipped by the administrator. Please contact counter.',
      time: 'Just now',
      read: false,
      type: 'alert',
    });

    
    await recalculateQueue(token.service, token.bookingDate);

    res.status(200).json({
      success: true,
      message: `Token ${token.displayId} skipped successfully.`,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};


const completeToken = async (req, res, next) => {
  try {
    const { service, tokenNumber } = req.body;
    if (!service) {
      res.status(400);
      throw new Error('Please provide a service');
    }

    const todayStr = getLocalDateString();

    const serviceSlug = service.toLowerCase();

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== serviceSlug) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    const query = { service: serviceSlug, status: 'serving', bookingDate: todayStr };
    if (tokenNumber) {
      query.displayId = tokenNumber;
    }

    const token = await Token.findOne(query);
    if (!token) {
      res.status(404);
      throw new Error('No serving token found for this service');
    }

    token.status = 'completed';
    token.waitTime = 0;
    token.completedAt = new Date();
    await token.save();
    sendTokenAlerts(token._id, 'completed').catch(console.error);

    
    await recalculateQueue(serviceSlug, token.bookingDate);

    res.status(200).json({
      success: true,
      message: `Token ${token.displayId} marked as completed.`,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};


const closeQueue = async (req, res, next) => {
  try {
    const serviceParam = req.params.service || req.body.service;
    if (!serviceParam) {
      res.status(400);
      throw new Error('Please provide a service');
    }
    const service = serviceParam.toLowerCase();

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== service) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    const queue = await Queue.findOneAndUpdate(
      { service },
      { isActive: false },
      { new: true, upsert: true }
    );

    
    emitQueueUpdate(service, {
      currentServing: queue.currentServing,
      upcoming: queue.upcoming,
      totalInQueue: queue.totalInQueue,
      avgWait: queue.avgWait,
      isActive: false,
    });

    res.status(200).json({
      success: true,
      message: `Queue for '${service}' has been closed.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};


const openQueue = async (req, res, next) => {
  try {
    const serviceParam = req.params.service || req.body.service;
    if (!serviceParam) {
      res.status(400);
      throw new Error('Please provide a service');
    }
    const service = serviceParam.toLowerCase();

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== service) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    const queue = await Queue.findOneAndUpdate(
      { service },
      { isActive: true },
      { new: true, upsert: true }
    );

    
    emitQueueUpdate(service, {
      currentServing: queue.currentServing,
      upcoming: queue.upcoming,
      totalInQueue: queue.totalInQueue,
      avgWait: queue.avgWait,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: `Queue for '${service}' is now open.`,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const serviceFilter = req.user.service ? { service: req.user.service } : {};

    
    const totalTokens = await Token.countDocuments(serviceFilter);
    const activeQueuesCount = await Queue.countDocuments({ ...serviceFilter, isActive: true });
    const todaysVisitors = await Token.countDocuments({ ...serviceFilter, createdAt: { $gte: startOfToday, $lte: endOfToday } });
    const tokensServedToday = await Token.countDocuments({
      ...serviceFilter,
      status: 'completed',
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    });

    
    const completedTokensToday = await Token.find({
      ...serviceFilter,
      status: 'completed',
      updatedAt: { $gte: startOfToday, $lte: endOfToday },
    });
    
    let avgWaitTime = 14; 
    if (completedTokensToday.length > 0) {
      
      const totalWait = completedTokensToday.reduce((acc, t) => acc + (t.sequenceNumber * 1.5), 0);
      avgWaitTime = Math.round(totalWait / completedTokensToday.length) || 12;
    }

    
    let mostUsedService = req.user.service || 'Hospital';
    if (!req.user.service) {
      const serviceGrouping = await Token.aggregate([
        { $group: { _id: '$service', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ]);
      mostUsedService = serviceGrouping.length > 0 ? serviceGrouping[0]._id : 'Hospital';
    }
    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    
    const cancelledCount = await Token.countDocuments({ ...serviceFilter, status: 'cancelled' });
    const cancellationRate = totalTokens > 0 ? Number(((cancelledCount / totalTokens) * 100).toFixed(1)) : 0;

    const ratedTokens = await Token.find({ ...serviceFilter, status: 'completed', rating: { $ne: null } });
    let satisfactionRate = 100;
    let avgRating = 5;
    if (ratedTokens.length > 0) {
      const sum = ratedTokens.reduce((acc, t) => acc + t.rating, 0);
      avgRating = Number((sum / ratedTokens.length).toFixed(1));
      satisfactionRate = Number(((avgRating / 5) * 100).toFixed(1));
    }

    const dashboardStats = {
      totalTokens,
      activeQueues: activeQueuesCount,
      todaysVisitors,
      avgWaitTime,
      tokensServedToday,
      mostUsedService: capitalize(mostUsedService),
      satisfactionRate,
      cancellationRate,
      avgRating
    };

    
    const usageAggregate = await Token.aggregate([
      { $match: serviceFilter },
      { $group: { _id: '$service', count: { $sum: 1 } } },
    ]);
    const totalUsageCount = usageAggregate.reduce((acc, curr) => acc + curr.count, 0) || 1;
    const colors = { hospital: '#EF4444', college: '#8B5CF6', salon: '#EC4899' };

    const serviceUsageData = usageAggregate.map((item) => ({
      name: capitalize(item._id),
      value: Math.round((item.count / totalUsageCount) * 100),
      fill: colors[item._id] || '#6B7280',
    }));

    if (serviceUsageData.length === 0) {
      serviceUsageData.push({ name: 'No Data', value: 100, fill: '#D1D5DB' });
    }

    
    const hourlyAggregate = await Token.aggregate([
      { $match: { ...serviceFilter, createdAt: { $gte: startOfToday, $lte: endOfToday } } },
      { $project: { hour: { $hour: { date: '$createdAt', timezone: 'Asia/Kolkata' } } } },
      { $group: { _id: '$hour', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const formatHourLabel = (h) => {
      if (h === 0) return '12AM';
      if (h === 12) return '12PM';
      return h > 12 ? `${h - 12}PM` : `${h}AM`;
    };

    const hourlyMap = new Map();
    let maxHourly = -1;
    let peakHourStr = 'N/A';
    hourlyAggregate.forEach((item) => {
      const lbl = formatHourLabel(item._id);
      hourlyMap.set(lbl, item.count);
      if (item.count > maxHourly) {
        maxHourly = item.count;
        peakHourStr = lbl;
      }
    });

    dashboardStats.peakHour = maxHourly > 0 ? `${peakHourStr}` : 'N/A';

    const standardHours = ['8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'];
    const hourlyData = standardHours.map((h) => ({
      hour: h,
      visitors: hourlyMap.get(h) || 0,
    }));

    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyAggregate = await Token.aggregate([
      { $match: { ...serviceFilter, createdAt: { $gte: sevenDaysAgo, $lte: endOfToday } } },
      { $project: { dayOfWeek: { $dayOfWeek: { date: '$createdAt', timezone: 'Asia/Kolkata' } } } },
      { $group: { _id: '$dayOfWeek', tokens: { $sum: 1 } } },
    ]);

    const daysMap = { 1: 'Sun', 2: 'Mon', 3: 'Tue', 4: 'Wed', 5: 'Thu', 6: 'Fri', 7: 'Sat' };
    const dailyMap = new Map();
    
    let maxDailyTokens = -1;
    let busiestDayName = 'N/A';

    dailyAggregate.forEach((item) => {
      const dName = daysMap[item._id];
      dailyMap.set(dName, item.tokens);
      if (item.tokens > maxDailyTokens) {
        maxDailyTokens = item.tokens;
        busiestDayName = dName;
      }
    });

    dashboardStats.busiestDay = maxDailyTokens > 0 ? busiestDayName : 'N/A';

    const dailyQueueData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = daysMap[d.getDay() + 1];
      dailyQueueData.push({
        day: dayName,
        tokens: dailyMap.get(dayName) || 0,
        waitTime: 0, 
      });
    }

    
    // Monthly data – supports custom date range via query params
    const { startMonth, startYear, endMonth, endYear } = req.query;
    
    let monthStart, monthEnd, monthCount;
    
    if (startMonth && startYear && endMonth && endYear) {
      // Custom range from super admin
      monthStart = new Date(parseInt(endYear), parseInt(endMonth) - 1, 1);
      monthStart.setHours(0, 0, 0, 0);
      const rangeStartDate = new Date(parseInt(startYear), parseInt(startMonth) - 1, 1);
      rangeStartDate.setHours(0, 0, 0, 0);
      
      // Calculate number of months between start and end
      monthCount = (parseInt(endYear) - parseInt(startYear)) * 12 + (parseInt(endMonth) - parseInt(startMonth)) + 1;
      monthCount = Math.max(1, Math.min(monthCount, 24)); // limit to 24 months max
      
      monthEnd = new Date(parseInt(endYear), parseInt(endMonth), 0, 23, 59, 59, 999); // last day of end month
    } else {
      // Default: last 6 months
      monthCount = 6;
      monthEnd = new Date();
      monthEnd.setHours(23, 59, 59, 999);
    }
    
    const sixMonthsAgo = new Date();
    if (startMonth && startYear) {
      sixMonthsAgo.setFullYear(parseInt(startYear));
      sixMonthsAgo.setMonth(parseInt(startMonth) - 1);
    } else {
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - (monthCount - 1));
    }
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyMatchFilter = { ...serviceFilter, createdAt: { $gte: sixMonthsAgo } };
    if (monthEnd) {
      monthlyMatchFilter.createdAt.$lte = monthEnd;
    }

    const monthlyAggregate = await Token.aggregate([
      { $match: monthlyMatchFilter },
      { $project: { month: { $month: { date: '$createdAt', timezone: 'Asia/Kolkata' } }, year: { $year: { date: '$createdAt', timezone: 'Asia/Kolkata' } } } },
      { $group: { _id: { month: '$month', year: '$year' }, tokens: { $sum: 1 } } }
    ]);
    
    const monthNamesList = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyMap = new Map();
    monthlyAggregate.forEach(item => monthlyMap.set(`${item._id.year}-${item._id.month}`, item.tokens));
    
    const monthlyData = [];
    for (let i = monthCount - 1; i >= 0; i--) {
       const d = new Date();
       if (startMonth && startYear && endMonth && endYear) {
         d.setFullYear(parseInt(endYear));
         d.setMonth(parseInt(endMonth) - 1 - i);
       } else {
         d.setMonth(d.getMonth() - i);
       }
       const mId = d.getMonth() + 1;
       const yr = d.getFullYear();
       monthlyData.push({
           month: `${monthNamesList[d.getMonth()]} ${yr}`,
           tokens: monthlyMap.get(`${yr}-${mId}`) || 0
       });
    }

    
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    fourWeeksAgo.setHours(0, 0, 0, 0);

    const recentTokensList = await Token.find({ ...serviceFilter, createdAt: { $gte: fourWeeksAgo } });
    const weeklyReport = [
       { week: 'Week 1', tokens: 0, completed: 0, cancelled: 0 },
       { week: 'Week 2', tokens: 0, completed: 0, cancelled: 0 },
       { week: 'Week 3', tokens: 0, completed: 0, cancelled: 0 },
       { week: 'Week 4', tokens: 0, completed: 0, cancelled: 0 },
    ];
    
    recentTokensList.forEach(t => {
       const diffTime = Math.abs(t.createdAt - fourWeeksAgo);
       const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
       const weekIdx = Math.min(Math.floor(diffDays / 7), 3);
       
       weeklyReport[weekIdx].tokens += 1;
       if (t.status === 'completed') weeklyReport[weekIdx].completed += 1;
       if (t.status === 'cancelled') weeklyReport[weekIdx].cancelled += 1;
    });

    
    const recentTokens = await Token.find(serviceFilter)
      .sort({ updatedAt: -1 })
      .limit(6);

    const recentActivity = recentTokens.map((t, idx) => {
      let action = `Token ${t.displayId} generated`;
      let type = 'create';

      if (t.status === 'serving') {
        action = `Token ${t.displayId} now serving`;
        type = 'serve';
      } else if (t.status === 'completed') {
        action = `Token ${t.displayId} completed`;
        type = 'complete';
      } else if (t.status === 'cancelled') {
        action = `Token ${t.displayId} cancelled`;
        type = 'cancel';
      }

      
      const diffMs = new Date() - new Date(t.updatedAt);
      const diffMins = Math.floor(diffMs / 60000);
      let timeLabel = 'Just now';
      if (diffMins > 0) {
        timeLabel = diffMins === 1 ? '1 min ago' : `${diffMins} min ago`;
      }
      if (diffMins >= 60) {
        const diffHrs = Math.floor(diffMins / 60);
        timeLabel = diffHrs === 1 ? '1 hour ago' : `${diffHrs} hours ago`;
      }

      return {
        id: t._id,
        action,
        user: t.name,
        service: capitalize(t.service),
        time: timeLabel,
        type,
      };
    });

    
    if (recentActivity.length === 0) {
      recentActivity.push(
        { id: 1, action: 'Token A093 generated', user: 'Neha Singh', service: 'Hospital', time: '2 min ago', type: 'create' },
        { id: 2, action: 'Token A089 now serving', user: 'Priya Sharma', service: 'Hospital', time: '5 min ago', type: 'serve' },
        { id: 3, action: 'Token B045 completed', user: 'Vikram Patel', service: 'Bank', time: '12 min ago', type: 'complete' }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        dashboardStats,
        serviceUsageData,
        hourlyData,
        dailyQueueData,
        monthlyData,
        weeklyReport,
        recentActivity,
      },
    });
  } catch (error) {
    next(error);
  }
};


const verifyScannedToken = async (req, res, next) => {
  try {
    const { displayId } = req.body;
    
    const todayStr = getLocalDateString();

    const token = await Token.findOne({ displayId, bookingDate: todayStr });

    if (!token) {
      res.status(404);
      throw new Error(`Token '${displayId}' not found for today's date.`);
    }

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== token.service.toLowerCase()) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    res.status(200).json({
      success: true,
      message: 'Token verified successfully',
      data: token
    });
  } catch (error) {
    next(error);
  }
};


const serveScannedToken = async (req, res, next) => {
  try {
    const { displayId } = req.body;
    
    const todayStr = getLocalDateString();

    const token = await Token.findOne({ displayId, bookingDate: todayStr });
    if (!token) {
      res.status(404);
      throw new Error(`Token '${displayId}' not found for today's date.`);
    }

    
    if (req.user && req.user.service && req.user.service.toLowerCase() !== token.service.toLowerCase()) {
      res.status(403);
      throw new Error(`Access denied: You are restricted to operating the ${req.user.service} service queue.`);
    }

    if (token.status === 'completed' || token.status === 'cancelled') {
      res.status(400);
      throw new Error(`Token has already been ${token.status}.`);
    }

    
    const currentServingToken = await Token.findOne({ service: token.service, status: 'serving', bookingDate: todayStr });
    if (currentServingToken) {
      currentServingToken.status = 'completed';
      currentServingToken.waitTime = 0;
      await currentServingToken.save();
    }

    
    token.status = 'serving';
    token.waitTime = 0;
    await token.save();

    
    emitUserNotification(token.userId, {
      id: Math.random().toString(),
      title: `Your token ${token.displayId} is now active!`,
      message: `Please proceed to the counter. Your token is now being served.`,
      time: 'Just now',
      read: false,
      type: 'success',
    });

    
    emitTokenCalled(token);

    
    await recalculateQueue(token.service, todayStr);

    res.status(200).json({
      success: true,
      message: `Token ${token.displayId} is now being served.`,
      data: token
    });
  } catch (error) {
    next(error);
  }
};


const generateInviteCode = async (req, res, next) => {
  try {
    
    if (req.user.role !== 'admin' || req.user.service) {
      res.status(403);
      throw new Error('Access denied: Only Super Admin can generate invite codes.');
    }

    const { service } = req.body;
    if (!service || !['hospital', 'college', 'salon'].includes(service.toLowerCase())) {
      res.status(400);
      throw new Error('Please provide a valid service (hospital, college, salon)');
    }

    
    const rawCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${service.substring(0, 4).toUpperCase()}-${rawCode}`;

    const inviteCode = await AdminInviteCode.create({
      code,
      service: service.toLowerCase(),
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: inviteCode,
    });
  } catch (error) {
    next(error);
  }
};


const getInviteCodes = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' || req.user.service) {
      res.status(403);
      throw new Error('Access denied: Only Super Admin can view invite codes.');
    }

    const codes = await AdminInviteCode.find()
      .populate('usedBy', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: codes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an invite code
// @route   DELETE /api/admin/invite-codes/:id
// @access  Private/SuperAdmin
const deleteInviteCode = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' || req.user.service) {
      res.status(403);
      throw new Error('Access denied: Only Super Admin can delete invite codes.');
    }

    const code = await AdminInviteCode.findById(req.params.id);
    if (!code) {
      res.status(404);
      throw new Error('Invite code not found');
    }

    await AdminInviteCode.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Invite code deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  callNextToken,
  skipToken,
  completeToken,
  closeQueue,
  openQueue,
  getAnalytics,
  verifyScannedToken,
  serveScannedToken,
  generateInviteCode,
  getInviteCodes,
  deleteInviteCode,
};
