const getLocalDateString = (offsetDays = 0) => {
  const d = new Date();
  if (offsetDays) {
    d.setDate(d.getDate() + offsetDays);
  }
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

const isTimeSlotPast = (bookingDateStr, timeSlotStr) => {
  try {
    const todayStr = getLocalDateString();

    if (bookingDateStr < todayStr) return true;
    if (bookingDateStr > todayStr) return false;

    // If today, parse the end time of the slot (e.g. "09:00 AM - 10:00 AM" -> end time is "10:00 AM")
    const parts = timeSlotStr.split('-');
    if (parts.length < 2) return false;
    const endTimeStr = parts[1].trim(); // e.g. "10:00 AM"
    
    // Parse "10:00 AM" or "02:00 PM"
    const match = endTimeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return false;
    
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();

    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    // Get today's local date/time
    const d = new Date();
    const offset = d.getTimezoneOffset();
    const localNow = new Date(d.getTime() - (offset * 60 * 1000));

    const slotEnd = new Date(localNow);
    slotEnd.setHours(hours, minutes, 0, 0);

    return localNow > slotEnd;
  } catch (e) {
    console.error('Error checking time slot:', e);
    return false;
  }
};

module.exports = {
  getLocalDateString,
  isTimeSlotPast
};
