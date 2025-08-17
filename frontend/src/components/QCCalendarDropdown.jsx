import React, { useState, useRef, useEffect } from 'react';

const QCCalendarDropdown = ({ 
  selectedDate, 
  onDateChange, 
  existingQCDates = [], 
  qcDueDates = [], 
  minDate, 
  maxDate,
  frequency 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Always start with the month containing the selected date, or current month if none selected
    if (selectedDate) {
      return new Date(selectedDate);
    }
    // Default to current month to show today
    return new Date();
  });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get date status
  const getDateStatus = (dateStr) => {
    const hasData = existingQCDates.includes(dateStr);
    const isDueDate = qcDueDates.includes(dateStr);
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const isToday = dateStr === today;
    const isYesterday = dateStr === yesterday;
    const isSelected = dateStr === selectedDate;
    
    return { hasData, isDueDate, isToday, isYesterday, isSelected };
  };

  // Get date styling
  const getDateStyle = (dateStr, isCurrentMonth = true) => {
    const { hasData, isDueDate, isToday, isYesterday, isSelected } = getDateStatus(dateStr);
    const dateObj = new Date(dateStr);
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;
    
    const isDisabled = !isCurrentMonth || 
      (minDateObj && dateObj < minDateObj) || 
      (maxDateObj && dateObj > maxDateObj);

    let baseClasses = "w-8 h-8 rounded text-xs font-medium flex items-center justify-center transition-colors relative";
    
    if (isDisabled) {
      baseClasses += " text-gray-500 cursor-not-allowed";
    } else {
      baseClasses += " cursor-pointer hover:bg-gray-600";
      
      if (isSelected) {
        baseClasses += " ring-2 ring-blue-400 text-white font-bold";
      }
      
      if (hasData) {
        baseClasses += " bg-green-700 text-green-100";
      } else if (isDueDate) {
        baseClasses += " bg-yellow-700 text-yellow-100";
      } else {
        baseClasses += " bg-gray-700 text-gray-300";
      }
      
      // Special styling for today and yesterday
      if (isToday) {
        baseClasses += " border-2 border-white shadow-lg animate-pulse";
        // Make today more prominent with a stronger border
        if (!isSelected) {
          baseClasses += " ring-1 ring-white/50";
        }
      } else if (isYesterday) {
        baseClasses += " border-2 border-gray-300";
      }
    }
    
    return baseClasses;
  };

  // Get date indicator icon
  const getDateIcon = (dateStr) => {
    const { hasData, isDueDate, isToday, isYesterday } = getDateStatus(dateStr);
    
    // Priority order: QC status first, then date indicators
    if (hasData) return "✅";
    if (isDueDate) return "📅";
    if (isToday) return "🎯"; // Target icon for today
    if (isYesterday) return "📍"; // Pin icon for yesterday
    return "";
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start of the calendar (previous month's days to fill the week)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End of the calendar (next month's days to fill the week)
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      const isCurrentMonth = current.getMonth() === month;
      
      days.push({
        date: new Date(current),
        dateStr,
        day: current.getDate(),
        isCurrentMonth
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const handleDateClick = (dateStr) => {
    const dateObj = new Date(dateStr);
    const minDateObj = minDate ? new Date(minDate) : null;
    const maxDateObj = maxDate ? new Date(maxDate) : null;
    
    // Check if date is disabled
    if ((minDateObj && dateObj < minDateObj) || (maxDateObj && dateObj > maxDateObj)) {
      return;
    }
    
    onDateChange(dateStr);
    setIsOpen(false);
  };

  const formatDisplayDate = (date) => {
    if (!date) return 'Select date';
    
    const { isToday, isYesterday } = getDateStatus(date);
    const dateObj = new Date(date);
    
    let formattedDate = dateObj.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (isToday) {
      formattedDate += ' (Today)';
    } else if (isYesterday) {
      formattedDate += ' (Yesterday)';
    }
    
    return formattedDate;
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Date Input Display */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100 cursor-pointer flex items-center justify-between"
        style={{
          backgroundColor: (() => {
            const { hasData, isDueDate } = getDateStatus(selectedDate);
            if (hasData) return 'rgb(21 128 61)'; // green-800
            if (isDueDate) return 'rgb(146 64 14)'; // amber-800  
            return 'rgb(30 58 138)'; // blue-800
          })()
        }}
      >
        <span>{formatDisplayDate(selectedDate)}</span>
        <div className="flex items-center space-x-2">
          {(() => {
            const { hasData, isDueDate, isToday, isYesterday } = getDateStatus(selectedDate);
            if (hasData) return <span className="text-green-300">✅</span>;
            if (isDueDate) return <span className="text-yellow-300">📅</span>;
            if (isToday) return <span className="text-white">🎯</span>;
            if (isYesterday) return <span className="text-gray-300">📍</span>;
            return <span className="text-blue-300">📝</span>;
          })()}
          <svg className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Calendar Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded hover:bg-gray-700 text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-100">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded hover:bg-gray-700 text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ dateStr, day, isCurrentMonth }) => (
              <div
                key={dateStr}
                onClick={() => handleDateClick(dateStr)}
                className={getDateStyle(dateStr, isCurrentMonth)}
                title={(() => {
                  const { hasData, isDueDate, isToday, isYesterday } = getDateStatus(dateStr);
                  let title = dateStr;
                  if (hasData) title += " - QC Completed";
                  else if (isDueDate) title += " - QC Due";
                  
                  if (isToday) title += " (Today)";
                  else if (isYesterday) title += " (Yesterday)";
                  
                  return title;
                })()}
              >
                <span className="z-10 relative">{day}</span>
                {getDateIcon(dateStr) && (
                  <div className="absolute top-0 right-0 transform translate-x-1 -translate-y-1">
                    <span className="text-xs">{getDateIcon(dateStr)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-gray-600">
            <div className="flex items-center justify-center space-x-3 text-xs flex-wrap gap-y-2">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-700 rounded"></div>
                <span className="text-gray-300">✅ Completed</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-700 rounded"></div>
                <span className="text-gray-300">📅 Due</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-700 rounded"></div>
                <span className="text-gray-300">📝 Available</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-700 rounded border-2 border-white"></div>
                <span className="text-gray-300">🎯 Today</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-700 rounded border-2 border-gray-300"></div>
                <span className="text-gray-300">📍 Yesterday</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCCalendarDropdown;