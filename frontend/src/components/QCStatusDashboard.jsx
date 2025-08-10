import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

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
  const [worksheetSchedules, setWorksheetSchedules] = useState({});

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

  // Load schedule data for all worksheets
  useEffect(() => {
    const loadAllSchedules = async () => {
      const scheduleData = {};
      const allWorksheets = Object.values(assignedWorksheets).flat();
      
      if (allWorksheets.length === 0) return;

      try {
        // Get completions from both localStorage and backend API
        const localCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
        
        // Fetch completions from backend API
        let backendCompletions = [];
        try {
          const response = await axios.get(`/api/qc/completions?machineId=${machine.machineId}`);
          backendCompletions = response.data || [];
        } catch (error) {
          console.error('Error fetching backend completions:', error);
        }
        
        // Merge backend and local completions, with backend taking precedence
        const allCompletions = [...backendCompletions];
        
        // Add local completions that aren't already in backend
        localCompletions.forEach(localQC => {
          const existsInBackend = backendCompletions.some(backendQC => 
            backendQC.machineId === localQC.machineId &&
            backendQC.frequency === localQC.frequency &&
            backendQC.date === localQC.date &&
            backendQC.worksheetId === localQC.worksheetId
          );
          
          if (!existsInBackend) {
            allCompletions.push(localQC);
          }
        });
        
        console.log(`🔍 QCStatusDashboard loaded ${allCompletions.length} total completions (${backendCompletions.length} from backend, ${localCompletions.length} from localStorage)`);

        // Use merged completions for schedule calculation
        
        for (const worksheet of allWorksheets) {
          const completedDates = allCompletions
            .filter(qc => 
              qc.machineId === machine.machineId && 
              qc.worksheetId === worksheet.id
            )
            .map(qc => qc.date)
            .sort();

          try {
            const response = await axios.get(
              `/api/qc/schedule/generate?frequency=${worksheet.frequency}&startDate=${worksheet.startDate || '2024-01-15'}&completedDates=${JSON.stringify(completedDates)}`
            );
            
            // API returns array of due dates directly
            const dueDates = response.data;
            
            scheduleData[worksheet.id] = {
              dueDates: dueDates,
              completedDates: completedDates,
              isDueToday: dueDates.includes(todayStr) && !completedDates.includes(todayStr)
            };
          } catch (error) {
            console.error(`Error loading schedule for worksheet ${worksheet.id}:`, error);
            scheduleData[worksheet.id] = {
              dueDates: [],
              completedDates: completedDates,
              isDueToday: false
            };
          }
        }
        
        setWorksheetSchedules(scheduleData);
      } catch (error) {
        console.error('Error loading worksheet schedules:', error);
      }
    };

    loadAllSchedules();
  }, [assignedWorksheets, machine.machineId, todayStr]);

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
    console.log(`🔍 QCStatusDashboard checking ${frequency} for machine ${machine.machineId}:`, {
      totalWorksheets: worksheets.length,
      localCompletions: localCompletions.filter(qc => qc.machineId === machine.machineId && qc.frequency === frequency),
      todayStr
    });

    worksheets.forEach(worksheet => {
      const scheduleData = worksheetSchedules[worksheet.id];
      if (!scheduleData) {
        // Schedule data not loaded yet, skip this worksheet
        return;
      }

      // Use schedule-based logic for all frequencies to match QCScheduleStatus
      const isDueInCurrentPeriod = (() => {
        const today = new Date().toISOString().split('T')[0];
        
        switch (frequency) {
          case 'daily':
            return scheduleData.isDueToday;
          
          case 'weekly':
            // Check if any due date falls within this week OR is overdue from previous weeks
            const startOfWeek = new Date(today);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const weekStart = startOfWeek.toISOString().split('T')[0];
            
            // Include any due date that is today or earlier (including overdue from previous weeks)
            return scheduleData.dueDates.some(date => date <= today);
          
          case 'monthly':
            // Check if any due date falls within this month
            const currentMonth = new Date(today).getMonth();
            const currentYear = new Date(today).getFullYear();
            return scheduleData.dueDates.some(date => {
              const dueDate = new Date(date);
              return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
            });
          
          case 'quarterly':
            // Check if any due date falls within this quarter
            const currentQuarter = Math.floor(new Date(today).getMonth() / 3);
            const quarterYear = new Date(today).getFullYear();
            return scheduleData.dueDates.some(date => {
              const dueDate = new Date(date);
              const dueQuarter = Math.floor(dueDate.getMonth() / 3);
              return dueQuarter === currentQuarter && dueDate.getFullYear() === quarterYear;
            });
          
          case 'annual':
            // Check if any due date falls within this year
            const year = new Date(today).getFullYear();
            return scheduleData.dueDates.some(date => {
              return new Date(date).getFullYear() === year;
            });
          
          default:
            return false;
        }
      })();

      const wasCompletedInPeriod = (() => {
        switch (frequency) {
          case 'daily':
            return scheduleData.completedDates.includes(todayStr);
          
          case 'weekly':
            // For weekly QC, check if any completion exists for due dates up to today
            // This handles both current week and overdue from previous weeks
            const relevantDueDates = scheduleData.dueDates.filter(date => date <= todayStr);
            return relevantDueDates.some(dueDate => scheduleData.completedDates.includes(dueDate));
          
          case 'monthly':
            const currentMonth = new Date(todayStr).getMonth();
            const currentYear = new Date(todayStr).getFullYear();
            return scheduleData.completedDates.some(date => {
              const completedDate = new Date(date);
              return completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear;
            });
          
          case 'quarterly':
            const currentQuarter = Math.floor(new Date(todayStr).getMonth() / 3);
            const quarterYear = new Date(todayStr).getFullYear();
            return scheduleData.completedDates.some(date => {
              const completedDate = new Date(date);
              const completedQuarter = Math.floor(completedDate.getMonth() / 3);
              return completedQuarter === currentQuarter && completedDate.getFullYear() === quarterYear;
            });
          
          case 'annual':
            const year = new Date(todayStr).getFullYear();
            return scheduleData.completedDates.some(date => {
              return new Date(date).getFullYear() === year;
            });
          
          default:
            return false;
        }
      })();

      // Determine status based on schedule and completion
      if (isDueInCurrentPeriod && !wasCompletedInPeriod) {
        missing.push(worksheet);
      } else if (wasCompletedInPeriod) {
        completed.push(worksheet);
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
              {timeframe && <p className="text-xs text-gray-500">{timeframe}</p>}
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
              {timeframe && <p className="text-xs text-blue-300">{timeframe}</p>}
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
            {timeframe && <p className={`text-xs ${
              allComplete 
                ? 'text-green-300' 
                : hasIncomplete 
                  ? 'text-red-300'
                  : 'text-gray-500'
            }`}>
              {timeframe}
            </p>}
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
      <h2 className="text-lg font-semibold text-gray-100 mb-4">Today's QC Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Daily QC */}
        <QCWidget 
          frequency="daily"
          status={dailyStatus}
          title="Daily"
          timeframe=""
        />

        {/* Weekly QC */}
        <QCWidget 
          frequency="weekly"
          status={weeklyStatus}
          title="Weekly"
          timeframe=""
        />

        {/* Monthly QC */}
        <QCWidget 
          frequency="monthly"
          status={monthlyStatus}
          title="Monthly"
          timeframe=""
        />

        {/* Quarterly QC */}
        <QCWidget 
          frequency="quarterly"
          status={quarterlyStatus}
          title="Quarterly"
          timeframe=""
        />

        {/* Annual QC */}
        <QCWidget 
          frequency="annual"
          status={annualStatus}
          title="Annual"
          timeframe=""
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