import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const QCStatusDashboard = ({ machine, qcHistory }) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const [assignedWorksheets, setAssignedWorksheets] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    quarterly: [],
    annual: []
  });

  // Load assigned worksheets for this machine by frequency
  useEffect(() => {
    try {
      const storedWorksheets = localStorage.getItem('qcWorksheets');
      if (storedWorksheets) {
        const worksheets = JSON.parse(storedWorksheets);
        
        const frequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annual'];
        const assignedByFrequency = {};
        
        frequencies.forEach(frequency => {
          assignedByFrequency[frequency] = worksheets.filter(ws => 
            ws.modality === machine.type && 
            ws.frequency === frequency && 
            ws.assignedMachines && 
            ws.assignedMachines.includes(machine.machineId) &&
            ws.isWorksheet === true
          );
        });
        
        setAssignedWorksheets(assignedByFrequency);
      }
    } catch (error) {
      console.error('Error loading assigned worksheets:', error);
    }
  }, [machine.machineId, machine.type]);

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

  // Check worksheet completion status for any frequency
  const getWorksheetCompletionStatus = (frequency) => {
    const worksheets = assignedWorksheets[frequency] || [];
    if (worksheets.length === 0) return { hasWorksheets: false, completed: [], missing: [] };
    
    // Skip weekends for daily QC only
    if (frequency === 'daily') {
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { hasWorksheets: true, isWeekend: true, completed: [], missing: [] };
      }
    }

    const completed = [];
    const missing = [];

    worksheets.forEach(worksheet => {
      // Check if this specific worksheet was completed in the relevant time period
      let wasCompleted = false;
      
      switch (frequency) {
        case 'daily':
          wasCompleted = qcHistory?.daily?.some(qc => 
            qc.date === todayStr && 
            (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title)
          );
          break;
        case 'weekly':
          // Check if completed this week
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - today.getDay());
          const weekStart = startOfWeek.toISOString().split('T')[0];
          wasCompleted = qcHistory?.weekly?.some(qc => 
            qc.date >= weekStart && qc.date <= todayStr &&
            (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title)
          );
          break;
        case 'monthly':
          wasCompleted = qcHistory?.monthly?.some(qc => {
            const qcDate = new Date(qc.date);
            return qcDate.getMonth() === currentMonth && 
                   qcDate.getFullYear() === currentYear &&
                   (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title);
          });
          break;
        case 'quarterly':
          const currentQuarter = Math.floor(currentMonth / 3);
          wasCompleted = qcHistory?.quarterly?.some(qc => {
            const qcDate = new Date(qc.date);
            const qcQuarter = Math.floor(qcDate.getMonth() / 3);
            return qcQuarter === currentQuarter && 
                   qcDate.getFullYear() === currentYear &&
                   (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title);
          });
          break;
        case 'annual':
          wasCompleted = qcHistory?.annual?.some(qc => {
            const qcDate = new Date(qc.date);
            return qcDate.getFullYear() === currentYear &&
                   (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title);
          });
          break;
      }

      if (wasCompleted) {
        completed.push(worksheet);
      } else {
        missing.push(worksheet);
      }
    });

    return { hasWorksheets: true, completed, missing, isWeekend: false };
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
  
  // Get worksheet completion status for all frequencies
  const dailyStatus = getWorksheetCompletionStatus('daily');
  const weeklyStatus = getWorksheetCompletionStatus('weekly');
  const monthlyStatus = getWorksheetCompletionStatus('monthly');
  const quarterlyStatus = getWorksheetCompletionStatus('quarterly');
  const annualStatus = getWorksheetCompletionStatus('annual');

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

  // Compact QC Widget Component
  const QCWidget = ({ frequency, status, title, timeframe }) => {
    const hasWorksheets = status.hasWorksheets;
    const completed = status.completed || [];
    const missing = status.missing || [];
    const isWeekend = status.isWeekend;

    if (!hasWorksheets && !isWeekend) {
      return (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-300">{title}</h4>
              <p className="text-xs text-gray-500">{timeframe}</p>
            </div>
            <div className="text-xs text-gray-400">No worksheets</div>
          </div>
        </div>
      );
    }

    if (isWeekend) {
      return (
        <div className="bg-blue-800 rounded-lg p-3 border border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-blue-200">{title}</h4>
              <p className="text-xs text-blue-300">{timeframe}</p>
            </div>
            <div className="text-xs text-blue-300">🏖️ Weekend</div>
          </div>
        </div>
      );
    }

    const allComplete = missing.length === 0 && completed.length > 0;
    const hasIncomplete = missing.length > 0;

    return (
      <div className={`rounded-lg p-3 border ${
        allComplete 
          ? 'bg-green-800 border-green-600' 
          : hasIncomplete 
            ? 'bg-red-800 border-red-600'
            : 'bg-gray-800 border-gray-600'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className={`text-sm font-medium ${
              allComplete 
                ? 'text-green-200' 
                : hasIncomplete 
                  ? 'text-red-200'
                  : 'text-gray-300'
            }`}>
              {title}
            </h4>
            <p className={`text-xs ${
              allComplete 
                ? 'text-green-300' 
                : hasIncomplete 
                  ? 'text-red-300'
                  : 'text-gray-500'
            }`}>
              {timeframe}
            </p>
          </div>
          <div className={`text-xs ${
            allComplete 
              ? 'text-green-300' 
              : hasIncomplete 
                ? 'text-red-300'
                : 'text-gray-400'
          }`}>
            {completed.length}/{completed.length + missing.length} complete
          </div>
        </div>

        {hasIncomplete && (
          <div className="space-y-1">
            {missing.map((worksheet) => (
              <Link
                key={worksheet.id}
                to={`/qc/perform/${machine.machineId}/${frequency}/${worksheet.id}`}
                className="block text-red-300 hover:text-red-200 text-xs hover:underline transition-colors"
              >
                ▶️ {worksheet.title}
              </Link>
            ))}
          </div>
        )}

        {allComplete && (
          <div className="space-y-1">
            {completed.map((worksheet) => (
              <div key={worksheet.id} className="text-xs text-green-300">
                ✓ {worksheet.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">QC Status Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

          {/* Show completion status for assigned worksheets */}
          {worksheetStatus.hasWorksheets && !worksheetStatus.isWeekend && (
            <>
              {worksheetStatus.completed.length > 0 && (
                <div className="bg-green-900 border border-green-700 rounded p-3 mb-3">
                  <p className="text-sm text-green-200 font-medium">Completed Today</p>
                  <div className="space-y-1 mt-2">
                    {worksheetStatus.completed.map((worksheet) => (
                      <div key={worksheet.id} className="text-xs text-green-300">
                        ✓ {worksheet.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {worksheetStatus.missing.length > 0 && (
                <div className="bg-red-900 border border-red-700 rounded p-3">
                  <p className="text-sm text-red-200 font-medium">⚠ Daily QC not performed today</p>
                  <p className="text-xs text-red-300 mt-1 mb-2">
                    {worksheetStatus.missing.length} of {assignedDailyWorksheets.length} daily worksheet{assignedDailyWorksheets.length > 1 ? 's' : ''} incomplete
                  </p>
                  <div className="space-y-1">
                    {worksheetStatus.missing.map((worksheet) => (
                      <Link
                        key={worksheet.id}
                        to={`/qc/perform/${machine.machineId}/daily/${worksheet.id}`}
                        className="block text-red-400 hover:underline text-sm hover:text-red-300 transition-colors"
                      >
                        ▶️ Perform {worksheet.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          
          {/* Show message when no worksheets are assigned */}
          {!worksheetStatus.hasWorksheets && !todayQC?.isWeekend && (
            <div className="bg-gray-700 border border-gray-600 rounded p-3">
              <p className="text-sm text-gray-300">ℹ️ No daily QC worksheets assigned</p>
              <Link
                to="/worksheets"
                className="text-gray-400 hover:underline text-sm mt-1 block"
              >
                Create Daily QC Worksheets →
              </Link>
            </div>
          )}
          
          {/* Weekend message */}
          {worksheetStatus.isWeekend && (
            <div className="bg-blue-900 border border-blue-700 rounded p-3">
              <p className="text-sm text-blue-200">🏖️ Weekend - Daily QC not required</p>
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