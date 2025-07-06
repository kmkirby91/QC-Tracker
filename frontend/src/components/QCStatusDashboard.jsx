import React from 'react';
import { Link } from 'react-router-dom';

const QCStatusDashboard = ({ machine, qcHistory }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Get today's daily QC status
  const getTodayQCStatus = () => {
    if (!qcHistory?.daily) return null;
    
    // Skip weekends for daily QC
    const dayOfWeek = today.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return { isWeekend: true };
    }
    
    const todayQC = qcHistory.daily.find(qc => qc.date === todayStr);
    return todayQC || null;
  };

  // Get current month's QC status
  const getCurrentMonthQCStatus = () => {
    if (!qcHistory?.monthly) return null;
    
    const currentMonthQC = qcHistory.monthly.find(qc => {
      const qcDate = new Date(qc.date);
      return qcDate.getMonth() === currentMonth && qcDate.getFullYear() === currentYear;
    });
    
    return currentMonthQC || null;
  };

  // Get last few days QC status for trend
  const getRecentQCTrend = () => {
    if (!qcHistory?.daily) return [];
    
    const recentDays = [];
    for (let i = 1; i <= 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      const dateStr = date.toISOString().split('T')[0];
      const qc = qcHistory.daily.find(q => q.date === dateStr);
      
      recentDays.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        status: qc ? qc.overallResult : 'not-performed'
      });
    }
    
    return recentDays.slice(0, 4).reverse(); // Show last 4 working days
  };

  const todayQC = getTodayQCStatus();
  const monthlyQC = getCurrentMonthQCStatus();
  const recentTrend = getRecentQCTrend();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'fail':
        return (
          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'conditional':
        return (
          <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-gray-300">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStatusText = (status, isWeekend = false) => {
    if (isWeekend) return 'Weekend - No QC Required';
    
    switch (status) {
      case 'pass':
        return 'Completed - Passed';
      case 'fail':
        return 'Completed - Failed';
      case 'conditional':
        return 'Completed - Conditional';
      default:
        return 'Not Performed';
    }
  };

  const getStatusColor = (status, isWeekend = false) => {
    if (isWeekend) return 'text-gray-400';
    
    switch (status) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'conditional':
        return 'text-yellow-400';
      default:
        return 'text-red-400'; // Not performed is critical
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">QC Status Dashboard</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily QC Status */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-100">Daily QC</h3>
            <span className="text-sm text-gray-400">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            {getStatusIcon(todayQC?.isWeekend ? 'weekend' : todayQC?.overallResult)}
            <div>
              <p className={`font-medium ${getStatusColor(todayQC?.overallResult, todayQC?.isWeekend)}`}>
                {getStatusText(todayQC?.overallResult, todayQC?.isWeekend)}
              </p>
              {todayQC?.completedAt && (
                <p className="text-sm text-gray-400">
                  Completed at {new Date(todayQC.completedAt).toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </p>
              )}
            </div>
          </div>

          {todayQC && !todayQC.isWeekend && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Tests: {todayQC.tests?.filter(t => t.result === 'pass').length || 0}/{todayQC.tests?.length || 0} passed
              </span>
              <Link
                to={`/machines/${machine.machineId}/qc/${todayStr}`}
                className="text-blue-400 hover:underline text-sm"
              >
                View Details →
              </Link>
            </div>
          )}

          {!todayQC?.isWeekend && !todayQC && (
            <div className="bg-red-900 border border-red-700 rounded p-3">
              <p className="text-sm text-red-200 font-medium">⚠ Daily QC not performed today</p>
              <button className="text-red-400 hover:underline text-sm mt-1">
                Perform Daily QC →
              </button>
            </div>
          )}
        </div>

        {/* Monthly QC Status */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-100">Monthly QC</h3>
            <span className="text-sm text-gray-400">
              {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 mb-4">
            {getStatusIcon(monthlyQC?.overallResult)}
            <div>
              <p className={`font-medium ${getStatusColor(monthlyQC?.overallResult)}`}>
                {getStatusText(monthlyQC?.overallResult)}
              </p>
              {monthlyQC?.completedAt && (
                <p className="text-sm text-gray-400">
                  Completed on {new Date(monthlyQC.completedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {monthlyQC && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                Tests: {monthlyQC.tests?.filter(t => t.result === 'pass').length || 0}/{monthlyQC.tests?.length || 0} passed
              </span>
              <a
                href={monthlyQC.reportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-sm"
              >
                View Report →
              </a>
            </div>
          )}

          {!monthlyQC && (
            <div className="bg-yellow-900 border border-yellow-700 rounded p-3">
              <p className="text-sm text-yellow-200 font-medium">⚠ Monthly QC not performed this month</p>
              <button className="text-yellow-400 hover:underline text-sm mt-1">
                Schedule Monthly QC →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent QC Trend */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-100 mb-3">Recent Daily QC Trend</h4>
        <div className="flex items-center space-x-4">
          {recentTrend.map((day, index) => (
            <div key={day.date} className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                day.status === 'pass' ? 'bg-green-500 border-green-600' :
                day.status === 'fail' ? 'bg-red-500 border-red-600' :
                day.status === 'conditional' ? 'bg-yellow-500 border-yellow-600' :
                'bg-gray-700 border-gray-600'
              }`}>
                {day.status === 'pass' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {day.status === 'fail' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-xs text-gray-400 mt-1">{day.dayName}</span>
            </div>
          ))}
          <div className="flex items-center text-xs text-gray-400">
            <span>→ Today</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCStatusDashboard;