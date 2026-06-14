const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() + offsetDays);
  }
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(d);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  
  return `${year}-${month}-${day}`;
};

const isTimeSlotPast = (bookingDateStr, timeSlotStr) => {
  try {
    const todayStr = getLocalDateString();

    if (bookingDateStr < todayStr) return true;
    if (bookingDateStr > todayStr) return false;

    // Parse the slot end time (e.g., "10:00 AM")
    const parts = timeSlotStr.split('-');
    if (parts.length < 2) return false;
    const endTimeStr = parts[1].trim(); // e.g. "10:00 AM"

    const match = endTimeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;

    let slotHours = parseInt(match[1]);
    const slotMinutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && slotHours !== 12) slotHours += 12;
    if (ampm === 'AM' && slotHours === 12) slotHours = 0;

    // Get current time in Indian Standard Time (IST)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    
    const formattedParts = formatter.formatToParts(now);
    const hoursPart = formattedParts.find(p => p.type === 'hour');
    const minutesPart = formattedParts.find(p => p.type === 'minute');
    
    const currentHours = parseInt(hoursPart.value, 10);
    const currentMinutes = parseInt(minutesPart.value, 10);

    if (currentHours > slotHours) {
      return true;
    }
    if (currentHours === slotHours && currentMinutes > slotMinutes) {
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error checking time slot:', e);
    return false;
  }
};

module.exports = {
  getLocalDateString,
  isTimeSlotPast
};
