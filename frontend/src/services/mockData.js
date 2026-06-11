// ============================================================
// Mock Data for Smart Queue Management System
// ============================================================

export const services = [
  { id: 'hospital', name: 'Hospital', icon: '🏥', color: '#EF4444', description: 'Book tokens for hospital OPD, lab tests, and consultations' },
  { id: 'bank', name: 'Bank', icon: '🏦', color: '#3B82F6', description: 'Queue for banking services, account operations, and loans' },
  { id: 'college', name: 'College Office', icon: '🎓', color: '#8B5CF6', description: 'Student services, transcript requests, and admissions' },
  { id: 'government', name: 'Government Office', icon: '🏛️', color: '#F59E0B', description: 'Government document processing, permits, and licenses' },
  { id: 'salon', name: 'Salon', icon: '💇', color: '#EC4899', description: 'Haircuts, styling, spa, and beauty services' },
];

export const timeSlots = [
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '12:00 PM - 01:00 PM',
  '01:00 PM - 02:00 PM',
  '02:00 PM - 03:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
];

const users = [
  { id: 1, name: 'Vikram Patel', email: 'vikram@example.com', phone: '+91 98765 43210', role: 'admin', avatar: null },
  { id: 2, name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 87654 32109', role: 'user', avatar: null },
  { id: 3, name: 'Rahul Verma', email: 'rahul@example.com', phone: '+91 76543 21098', role: 'user', avatar: null },
];

export const currentUser = users[0];

export const tokens = [
  { id: 'A089', userId: 2, service: 'hospital', status: 'serving', position: 0, waitTime: 0, priority: 'normal', name: 'Priya Sharma', phone: '+91 87654 32109', timeSlot: '10:00 AM - 11:00 AM', createdAt: '2026-06-09T10:00:00' },
  { id: 'A090', userId: 3, service: 'hospital', status: 'waiting', position: 1, waitTime: 8, priority: 'senior', name: 'Rahul Verma', phone: '+91 76543 21098', timeSlot: '10:00 AM - 11:00 AM', createdAt: '2026-06-09T10:05:00' },
  { id: 'A091', userId: 1, service: 'hospital', status: 'waiting', position: 2, waitTime: 16, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '10:00 AM - 11:00 AM', createdAt: '2026-06-09T10:08:00' },
  { id: 'A092', userId: 2, service: 'hospital', status: 'waiting', position: 3, waitTime: 22, priority: 'vip', name: 'Aarav Gupta', phone: '+91 65432 10987', timeSlot: '11:00 AM - 12:00 PM', createdAt: '2026-06-09T10:12:00' },
  { id: 'A093', userId: 1, service: 'hospital', status: 'waiting', position: 4, waitTime: 30, priority: 'emergency', name: 'Neha Singh', phone: '+91 54321 09876', timeSlot: '11:00 AM - 12:00 PM', createdAt: '2026-06-09T10:15:00' },
  { id: 'B045', userId: 1, service: 'bank', status: 'completed', position: 0, waitTime: 0, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '09:00 AM - 10:00 AM', createdAt: '2026-06-09T09:00:00' },
  { id: 'B046', userId: 2, service: 'bank', status: 'serving', position: 0, waitTime: 0, priority: 'normal', name: 'Priya Sharma', phone: '+91 87654 32109', timeSlot: '09:00 AM - 10:00 AM', createdAt: '2026-06-09T09:10:00' },
  { id: 'B047', userId: 3, service: 'bank', status: 'waiting', position: 1, waitTime: 12, priority: 'senior', name: 'Rahul Verma', phone: '+91 76543 21098', timeSlot: '10:00 AM - 11:00 AM', createdAt: '2026-06-09T09:20:00' },
  { id: 'C012', userId: 1, service: 'college', status: 'waiting', position: 1, waitTime: 15, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '02:00 PM - 03:00 PM', createdAt: '2026-06-09T13:00:00' },
  { id: 'G008', userId: 1, service: 'government', status: 'cancelled', position: 0, waitTime: 0, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '11:00 AM - 12:00 PM', createdAt: '2026-06-09T10:30:00' },
  { id: 'S021', userId: 1, service: 'salon', status: 'completed', position: 0, waitTime: 0, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '04:00 PM - 05:00 PM', createdAt: '2026-06-08T16:00:00' },
  { id: 'A102', userId: 1, service: 'hospital', status: 'waiting', position: 14, waitTime: 22, priority: 'normal', name: 'Vikram Patel', phone: '+91 98765 43210', timeSlot: '03:00 PM - 04:00 PM', createdAt: '2026-06-09T14:00:00' },
];

export const queueData = {
  hospital: { currentServing: 'A089', upcoming: ['A090', 'A091', 'A092', 'A093'], totalInQueue: 5, avgWait: 12 },
  bank: { currentServing: 'B046', upcoming: ['B047'], totalInQueue: 2, avgWait: 15 },
  college: { currentServing: 'C011', upcoming: ['C012'], totalInQueue: 2, avgWait: 20 },
  government: { currentServing: 'G007', upcoming: ['G008'], totalInQueue: 2, avgWait: 25 },
  salon: { currentServing: 'S020', upcoming: ['S021'], totalInQueue: 2, avgWait: 10 },
};

export const dashboardStats = {
  totalTokens: 1248,
  activeQueues: 5,
  todaysVisitors: 342,
  avgWaitTime: 14,
  tokensServedToday: 287,
  peakHour: '10:00 AM - 11:00 AM',
  mostUsedService: 'Hospital',
  satisfactionRate: 94.5,
};

export const dailyQueueData = [
  { day: 'Mon', tokens: 180, waitTime: 12 },
  { day: 'Tue', tokens: 220, waitTime: 15 },
  { day: 'Wed', tokens: 195, waitTime: 11 },
  { day: 'Thu', tokens: 250, waitTime: 18 },
  { day: 'Fri', tokens: 310, waitTime: 20 },
  { day: 'Sat', tokens: 275, waitTime: 16 },
  { day: 'Sun', tokens: 140, waitTime: 8 },
];

export const serviceUsageData = [
  { name: 'Hospital', value: 35, fill: '#EF4444' },
  { name: 'Bank', value: 25, fill: '#3B82F6' },
  { name: 'College', value: 15, fill: '#8B5CF6' },
  { name: 'Government', value: 15, fill: '#F59E0B' },
  { name: 'Salon', value: 10, fill: '#EC4899' },
];

export const hourlyData = [
  { hour: '8AM', visitors: 20 },
  { hour: '9AM', visitors: 45 },
  { hour: '10AM', visitors: 78 },
  { hour: '11AM', visitors: 92 },
  { hour: '12PM', visitors: 65 },
  { hour: '1PM', visitors: 50 },
  { hour: '2PM', visitors: 70 },
  { hour: '3PM', visitors: 85 },
  { hour: '4PM', visitors: 60 },
  { hour: '5PM', visitors: 30 },
];

export const monthlyData = [
  { month: 'Jan', tokens: 3200 },
  { month: 'Feb', tokens: 3800 },
  { month: 'Mar', tokens: 4100 },
  { month: 'Apr', tokens: 3900 },
  { month: 'May', tokens: 4500 },
  { month: 'Jun', tokens: 4200 },
];

export const recentActivity = [
  { id: 1, action: 'Token A093 generated', user: 'Neha Singh', service: 'Hospital', time: '2 min ago', type: 'create' },
  { id: 2, action: 'Token A089 now serving', user: 'Priya Sharma', service: 'Hospital', time: '5 min ago', type: 'serve' },
  { id: 3, action: 'Token B045 completed', user: 'Vikram Patel', service: 'Bank', time: '12 min ago', type: 'complete' },
  { id: 4, action: 'Token G008 cancelled', user: 'Vikram Patel', service: 'Government', time: '18 min ago', type: 'cancel' },
  { id: 5, action: 'Token B046 now serving', user: 'Priya Sharma', service: 'Bank', time: '22 min ago', type: 'serve' },
  { id: 6, action: 'Token C012 generated', user: 'Vikram Patel', service: 'College', time: '30 min ago', type: 'create' },
];

export const testimonials = [
  {
    id: 1,
    name: 'Dr. Ananya Mehta',
    role: 'Hospital Administrator',
    text: 'SmartQueue has revolutionized our patient management. Wait times are down 40% and patient satisfaction is at an all-time high.',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rajesh Kumar',
    role: 'Bank Branch Manager',
    text: 'Our customers love the digital token system. No more chaotic queues — everything is organized and transparent.',
    rating: 5,
  },
  {
    id: 3,
    name: 'Sneha Reddy',
    role: 'College Dean',
    text: 'Student service delivery has improved dramatically. The real-time tracking feature is a game changer for our admin office.',
    rating: 4,
  },
  {
    id: 4,
    name: 'Amit Joshi',
    role: 'Government Official',
    text: 'Citizens can now book their slot from home. It has reduced overcrowding and improved our service efficiency by 60%.',
    rating: 5,
  },
];

export const notifications = [
  { id: 1, title: 'Your token A091 is approaching', message: 'You are 2nd in line. Estimated wait: 16 min', time: '1 min ago', read: false, type: 'alert' },
  { id: 2, title: 'Token A102 booked successfully', message: 'Hospital service, Time: 3:00 PM - 4:00 PM', time: '5 min ago', read: false, type: 'success' },
  { id: 3, title: 'Queue update', message: 'Hospital queue is moving faster than expected', time: '10 min ago', read: true, type: 'info' },
  { id: 4, title: 'Token S021 completed', message: 'Your salon appointment has been completed', time: '1 hour ago', read: true, type: 'complete' },
];

export const reportData = {
  totalTokensGenerated: 12480,
  peakHours: '10:00 AM - 12:00 PM',
  mostUsedService: 'Hospital (35%)',
  avgWaitTime: '14 minutes',
  completionRate: '94.5%',
  cancellationRate: '5.5%',
  busiestDay: 'Friday',
  customerSatisfaction: '4.7/5',
};

export const weeklyReport = [
  { week: 'Week 1', tokens: 850, completed: 810, cancelled: 40 },
  { week: 'Week 2', tokens: 920, completed: 875, cancelled: 45 },
  { week: 'Week 3', tokens: 1100, completed: 1045, cancelled: 55 },
  { week: 'Week 4', tokens: 980, completed: 940, cancelled: 40 },
];
