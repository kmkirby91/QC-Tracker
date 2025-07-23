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

  // Listen for QC completion changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'qcCompletions' || e.key === 'qcStatusRefresh') {
        // Force re-render when QC completions change
        setAssignedWorksheets(prev => ({ ...prev }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check for changes periodically (for same-tab updates)
    const interval = setInterval(() => {
      const refreshFlag = localStorage.getItem('qcStatusRefresh');
      if (refreshFlag) {
        localStorage.removeItem('qcStatusRefresh');
        setAssignedWorksheets(prev => ({ ...prev }));
      }
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

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

    // Get locally stored QC completions
    const localCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');

    worksheets.forEach(worksheet => {
      // Check if this specific worksheet was completed in the relevant time period
      let wasCompleted = false;
      
      // First check localStorage for real completions
      const localCompletion = localCompletions.find(qc => 
        qc.machineId === machine.machineId &&
        qc.frequency === frequency &&
        (qc.worksheetId === worksheet.id || qc.worksheetTitle === worksheet.title)
      );
      
      if (localCompletion) {
        // Check if the completion is within the relevant time period
        switch (frequency) {
          case 'daily':
            wasCompleted = localCompletion.date === todayStr;
            break;
          case 'weekly':
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const weekStart = startOfWeek.toISOString().split('T')[0];
            wasCompleted = localCompletion.date >= weekStart && localCompletion.date <= todayStr;
            break;
          case 'monthly':
            const completionDate = new Date(localCompletion.date);
            wasCompleted = completionDate.getMonth() === currentMonth && 
                           completionDate.getFullYear() === currentYear;
            break;
          case 'quarterly':
            const completionDate_q = new Date(localCompletion.date);
            const currentQuarter = Math.floor(currentMonth / 3);
            const completionQuarter = Math.floor(completionDate_q.getMonth() / 3);
            wasCompleted = completionQuarter === currentQuarter && 
                           completionDate_q.getFullYear() === currentYear;
            break;
          case 'annual':
            const completionDate_a = new Date(localCompletion.date);
            wasCompleted = completionDate_a.getFullYear() === currentYear;
            break;
        }
      }
      
      // If not found locally, check API QC history
      if (!wasCompleted) {
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
      }

      if (wasCompleted) {
        completed.push(worksheet);
      } else {
        missing.push(worksheet);
      }
    });

    return { hasWorksheets: true, completed, missing, isWeekend: false };
  };

  // Get recent daily QC trend
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

  // Get worksheet completion status for all frequencies
  const dailyStatus = getWorksheetCompletionStatus('daily');
  const weeklyStatus = getWorksheetCompletionStatus('weekly');
  const monthlyStatus = getWorksheetCompletionStatus('monthly');
  const quarterlyStatus = getWorksheetCompletionStatus('quarterly');
  const annualStatus = getWorksheetCompletionStatus('annual');
  const recentTrend = getRecentQCTrend();

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

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">QC Status Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Daily QC */}
        <QCWidget 
          frequency="daily"
          status={dailyStatus}
          title="Daily QC"
          timeframe={today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        />

        {/* Weekly QC */}
        <QCWidget 
          frequency="weekly"
          status={weeklyStatus}
          title="Weekly QC"
          timeframe="This week"
        />

        {/* Monthly QC */}
        <QCWidget 
          frequency="monthly"
          status={monthlyStatus}
          title="Monthly QC"
          timeframe={today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        />

        {/* Quarterly QC */}
        <QCWidget 
          frequency="quarterly"
          status={quarterlyStatus}
          title="Quarterly QC"
          timeframe={`Q${Math.floor(currentMonth / 3) + 1} ${currentYear}`}
        />

        {/* Annual QC */}
        <QCWidget 
          frequency="annual"
          status={annualStatus}
          title="Annual QC"
          timeframe={currentYear.toString()}
        />
      </div>

      {/* Compact Recent QC Trend */}
      {recentTrend.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-100">Recent Daily QC</h4>
            <div className="flex items-center space-x-2">
              {recentTrend.map((day) => (
                <div 
                  key={day.date} 
                  className={`w-4 h-4 rounded-full ${
                    day.status === 'pass' ? 'bg-green-500' :
                    day.status === 'fail' ? 'bg-red-500' :
                    day.status === 'conditional' ? 'bg-yellow-500' :
                    'bg-gray-600'
                  }`}
                  title={`${day.dayName}: ${day.status}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCStatusDashboard;