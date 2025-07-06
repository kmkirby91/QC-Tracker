import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const QCCalendar = ({ qcHistory, type }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();
  const { machineId } = useParams();

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getQCStatus = (date) => {
    if (!qcHistory || qcHistory.length === 0) return null;
    
    const dateStr = date.toISOString().split('T')[0];
    const qc = qcHistory.find(q => q.date === dateStr);
    return qc ? qc.overallResult : null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pass':
        return 'bg-green-500 border-green-600';
      case 'fail':
        return 'bg-red-500 border-red-600';
      case 'conditional':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-700 border-gray-600';
    }
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  if (type === 'daily') {
    return (
      <DailyCalendar 
        currentDate={currentDate}
        qcHistory={qcHistory}
        navigateMonth={navigateMonth}
        navigateToToday={navigateToToday}
        getDaysInMonth={getDaysInMonth}
        getFirstDayOfMonth={getFirstDayOfMonth}
        getQCStatus={getQCStatus}
        getStatusColor={getStatusColor}
        isToday={isToday}
        isWeekend={isWeekend}
        navigate={navigate}
        machineId={machineId}
      />
    );
  }

  return (
    <MonthlyCalendar 
      currentDate={currentDate}
      qcHistory={qcHistory}
      navigateMonth={navigateMonth}
      navigateToToday={navigateToToday}
      getQCStatus={getQCStatus}
      getStatusColor={getStatusColor}
    />
  );
};

const DailyCalendar = ({ 
  currentDate, qcHistory, navigateMonth, navigateToToday,
  getDaysInMonth, getFirstDayOfMonth, getQCStatus, getStatusColor,
  isToday, isWeekend, navigate, machineId 
}) => {
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = getFirstDayOfMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayClick = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const status = getQCStatus(date);
    
    // Only navigate if there's QC data for this day
    if (status) {
      const dateStr = date.toISOString().split('T')[0];
      navigate(`/machines/${machineId}/qc/${dateStr}`);
    }
  };

  const renderDay = (day) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const status = getQCStatus(date);
    const isCurrentDay = isToday(date);
    const isWeekendDay = isWeekend(date);
    const hasQC = status !== null;
    
    return (
      <div
        key={day}
        onClick={() => handleDayClick(day)}
        className={`
          relative h-12 border border-gray-700 flex items-center justify-center text-sm
          ${isCurrentDay ? 'ring-2 ring-blue-500' : ''}
          ${isWeekendDay ? 'bg-gray-900' : 'bg-gray-800'}
          ${hasQC ? 'cursor-pointer hover:bg-blue-900 transition-colors' : ''}
        `}
      >
        <span className={`${isCurrentDay ? 'font-bold text-blue-400' : 'text-gray-300'}`}>
          {day}
        </span>
        {status && (
          <div className={`absolute top-1 right-1 w-3 h-3 rounded-full border ${getStatusColor(status)}`} />
        )}
        {!status && !isWeekendDay && (
          <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
        )}
        {hasQC && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-blue-400 text-gray-100 text-xs px-1 py-0.5 rounded shadow">
              View QC
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Daily QC Calendar</h3>
        <button
          onClick={navigateToToday}
          className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
        >
          Today
        </button>
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-xl font-medium text-gray-100">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="h-8 flex items-center justify-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for days before the first day of the month */}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="h-12" />
        ))}
        
        {/* Days of the month */}
        {Array.from({ length: daysInMonth }, (_, i) => renderDay(i + 1))}
      </div>

      <div className="mt-4 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600" />
          <span>Passed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600" />
          <span>Failed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600" />
          <span>Conditional</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-gray-700 border border-gray-600" />
          <span>Not Performed</span>
        </div>
      </div>
    </div>
  );
};

const MonthlyCalendar = ({ 
  currentDate, qcHistory, navigateMonth, navigateToToday,
  getQCStatus, getStatusColor 
}) => {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getMonthStatus = (month, year) => {
    if (!qcHistory || qcHistory.length === 0) return null;
    
    // Find QC for this month
    const qc = qcHistory.find(q => {
      const qcDate = new Date(q.date);
      return qcDate.getMonth() === month && qcDate.getFullYear() === year;
    });
    
    return qc ? qc.overallResult : null;
  };

  const renderMonth = (month) => {
    const status = getMonthStatus(month, selectedYear);
    const isCurrentMonth = month === new Date().getMonth() && selectedYear === new Date().getFullYear();
    
    return (
      <div
        key={month}
        className={`
          relative h-20 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${status ? getStatusColor(status) : 'bg-gray-900 border-gray-600'}
          ${isCurrentMonth ? 'ring-2 ring-blue-500' : ''}
        `}
      >
        <span className={`text-sm font-medium ${status ? 'text-white' : 'text-gray-400'}`}>
          {monthNames[month]}
        </span>
        <span className={`text-xs ${status ? 'text-white' : 'text-gray-400'}`}>
          {selectedYear}
        </span>
        {status && (
          <div className="absolute top-1 right-1">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Monthly QC Calendar</h3>
        <button
          onClick={navigateToToday}
          className="px-3 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
        >
          Current Year
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setSelectedYear(selectedYear - 1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h4 className="text-xl font-medium text-gray-100">{selectedYear}</h4>
        
        <button
          onClick={() => setSelectedYear(selectedYear + 1)}
          className="p-2 hover:bg-gray-700 rounded"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 12 }, (_, i) => renderMonth(i))}
      </div>

      <div className="mt-6 flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-green-500 border border-green-600" />
          <span>Passed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-red-500 border border-red-600" />
          <span>Failed</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-yellow-500 border border-yellow-600" />
          <span>Conditional</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-4 h-4 rounded bg-gray-900 border border-gray-600" />
          <span>Not Performed</span>
        </div>
      </div>
    </div>
  );
};

export default QCCalendar;