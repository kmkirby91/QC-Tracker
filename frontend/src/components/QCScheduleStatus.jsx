import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const QCScheduleStatus = ({ machine, worksheets, compact = false }) => {
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (machine && worksheets && worksheets.length > 0) {
      loadQCSchedules();
    }
  }, [machine, worksheets]);

  const loadQCSchedules = async () => {
    setLoading(true);
    const schedules = {};

    try {
      // Get completed QCs from both localStorage and backend
      const localCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
      
      // Fetch completions from backend API
      let backendCompletions = [];
      try {
        const response = await axios.get(`/api/qc/completions?machineId=${machine.machineId}`);
        backendCompletions = response.data || [];
      } catch (error) {
        console.error('Error fetching backend completions for QCScheduleStatus:', error);
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
      
      console.log(`🔍 QCScheduleStatus loaded ${allCompletions.length} total completions (${backendCompletions.length} from backend, ${localCompletions.length} from localStorage)`);
      
      for (const worksheet of worksheets) {
        // Get completed dates for this specific worksheet using merged data
        const completedDates = allCompletions
          .filter(qc => 
            qc.machineId === machine.machineId && 
            qc.worksheetId === worksheet.id
          )
          .map(qc => qc.date)
          .sort();

        try {
          // Get schedule for this worksheet
          const response = await axios.get(
            `/api/qc/schedule/generate?frequency=${worksheet.frequency}&startDate=${worksheet.startDate || '2024-01-15'}&completedDates=${JSON.stringify(completedDates)}`
          );
          
          schedules[worksheet.id] = {
            ...response.data,
            worksheet: worksheet,
            completedDates: completedDates,
            overdueCount: response.data.dueDates.filter(date => {
              const today = new Date().toISOString().split('T')[0];
              return date <= today && !completedDates.includes(date);
            }).length,
            completionRate: response.data.dueDates.length > 0 ? 
              (completedDates.length / response.data.dueDates.filter(date => date <= new Date().toISOString().split('T')[0]).length * 100).toFixed(1) : 0
          };
        } catch (error) {
          console.error(`Error loading schedule for worksheet ${worksheet.id}:`, error);
        }
      }

      setScheduleData(schedules);
    } catch (error) {
      console.error('Error loading QC schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQCsDue = () => {
    const today = new Date().toISOString().split('T')[0];
    const dueList = [];

    Object.values(scheduleData).forEach(schedule => {
      // QCs due today that haven't been completed
      const dueTodayDates = schedule.dueDates.filter(date => 
        date === today && !schedule.completedDates.includes(date)
      );
      
      if (dueTodayDates.length > 0) {
        dueList.push({
          worksheet: schedule.worksheet,
          dueDates: dueTodayDates,
          count: dueTodayDates.length,
          status: 'due_today'
        });
      }
    });

    return dueList;
  };

  const getOverdueQCs = () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueList = [];

    Object.values(scheduleData).forEach(schedule => {
      const overdueDates = schedule.dueDates.filter(date => 
        date < today && !schedule.completedDates.includes(date)
      );
      
      if (overdueDates.length > 0) {
        overdueList.push({
          worksheet: schedule.worksheet,
          overdueDates: overdueDates,
          count: overdueDates.length,
          status: 'overdue'
        });
      }
    });

    return overdueList;
  };

  const getQCFailures = () => {
    const failures = [];
    
    try {
      // Get QC completions from localStorage to check for failures
      const localCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
      
      // Filter for failures from this machine's worksheets
      const machineFailures = localCompletions.filter(qc => 
        qc.machineId === machine.machineId &&
        qc.overallResult === 'fail' &&
        // Only include failures from assigned worksheets
        worksheets.some(ws => ws.id === qc.worksheetId)
      );

      // Group failures by worksheet
      const failuresByWorksheet = {};
      machineFailures.forEach(failure => {
        const worksheet = worksheets.find(ws => ws.id === failure.worksheetId);
        if (worksheet) {
          const key = worksheet.id;
          if (!failuresByWorksheet[key]) {
            failuresByWorksheet[key] = {
              worksheet: worksheet,
              failures: [],
              count: 0
            };
          }
          failuresByWorksheet[key].failures.push(failure);
          failuresByWorksheet[key].count++;
        }
      });

      return Object.values(failuresByWorksheet);
    } catch (error) {
      console.error('Error getting QC failures:', error);
      return [];
    }
  };

  const getTotalStats = () => {
    let totalDue = 0;
    let totalCompleted = 0;
    let totalOverdue = 0;
    let totalDueToday = 0;
    let totalFailures = 0;

    const today = new Date().toISOString().split('T')[0];

    Object.values(scheduleData).forEach(schedule => {
      const dueToDate = schedule.dueDates.filter(date => date <= today);
      const dueToday = schedule.dueDates.filter(date => date === today && !schedule.completedDates.includes(date));
      const overdue = schedule.dueDates.filter(date => date < today && !schedule.completedDates.includes(date));
      
      totalDue += dueToDate.length;
      totalCompleted += schedule.completedDates.length;
      totalOverdue += overdue.length;
      totalDueToday += dueToday.length;
    });

    // Count failures
    const failures = getQCFailures();
    totalFailures = failures.reduce((sum, failure) => sum + failure.count, 0);

    return { 
      totalDue, 
      totalCompleted, 
      totalOverdue, 
      totalDueToday,
      totalFailures
    };
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">QC Schedule Status</h2>
        <div className="text-gray-400">Loading QC schedule...</div>
      </div>
    );
  }

  if (!worksheets || worksheets.length === 0) {
    return null;
  }

  const qcsDue = getQCsDue();
  const overdueQCs = getOverdueQCs();
  const qcFailures = getQCFailures();
  const stats = getTotalStats();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">QC Schedule Status</h2>
      
      {/* Overall Stats */}
      <div className={`grid gap-4 mb-6 ${compact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-5'}`}>
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <div className="text-sm text-yellow-400">Due Today</div>
          <div className="text-2xl font-bold text-yellow-400">{stats.totalDueToday}</div>
        </div>
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="text-sm text-red-400">Overdue</div>
          <div className="text-2xl font-bold text-red-400">{stats.totalOverdue}</div>
        </div>
        <div className="bg-red-900/30 border border-red-500 rounded-lg p-4">
          <div className="text-sm text-red-300">Failures</div>
          <div className="text-2xl font-bold text-red-300">{stats.totalFailures}</div>
        </div>
        {!compact && (
          <>
            <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
              <div className="text-sm text-green-400">Completed</div>
              <div className="text-2xl font-bold text-green-400">{stats.totalCompleted}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Due</div>
              <div className="text-2xl font-bold text-gray-100">{stats.totalDue}</div>
            </div>
          </>
        )}
      </div>

      {/* QCs Due Today */}
      {qcsDue.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-yellow-400 mb-3">📅 QCs Due Today</h3>
          <div className="space-y-3">
            {qcsDue.map((item, index) => (
              <div key={index} className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-medium text-yellow-200">{item.worksheet.title}</div>
                    <div className="text-xs text-yellow-300 mt-1">
                      Frequency: {item.worksheet.frequency} | 
                      Started: {item.worksheet.startDate || 'Unknown'}
                    </div>
                    <div className="text-xs text-yellow-400 mt-1">
                      Due date: {item.dueDates[0]}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-sm text-yellow-300">{item.count} due today</div>
                    <Link
                      to={`/qc/perform/${machine.machineId}/${item.worksheet.frequency}/${item.worksheet.id}`}
                      className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      ▶️ Perform QC
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue QCs */}
      {overdueQCs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-red-400 mb-3">⚠️ Overdue QCs</h3>
          <div className="space-y-3">
            {overdueQCs.map((item, index) => (
              <div key={index} className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-medium text-red-200">{item.worksheet.title}</div>
                    <div className="text-xs text-red-300 mt-1">
                      Frequency: {item.worksheet.frequency} | 
                      Started: {item.worksheet.startDate || 'Unknown'}
                    </div>
                    <div className="text-xs text-red-400 mt-1">
                      Oldest overdue: {item.overdueDates[0]}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-sm text-red-300">{item.count} overdue</div>
                    <Link
                      to={`/qc/perform/${machine.machineId}/${item.worksheet.frequency}/${item.worksheet.id}`}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700 transition-colors"
                    >
                      ▶️ Perform QC
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QC Failures */}
      {qcFailures.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-red-300 mb-3">❌ Recent QC Failures</h3>
          <div className="space-y-3">
            {qcFailures.map((item, index) => {
              const mostRecentFailure = item.failures[item.failures.length - 1];
              return (
                <div key={index} className="bg-red-900/30 border border-red-500 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-medium text-red-200">{item.worksheet.title}</div>
                      <div className="text-xs text-red-300 mt-1">
                        Frequency: {item.worksheet.frequency}
                      </div>
                      <div className="text-xs text-red-400 mt-1">
                        Most recent failure: {mostRecentFailure?.date || 'Unknown'}
                      </div>
                      <div className="text-xs text-red-400">
                        Performed by: {mostRecentFailure?.performedBy || 'Unknown'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-sm text-red-300">{item.count} failure{item.count > 1 ? 's' : ''}</div>
                      {mostRecentFailure && (
                        <Link
                          to={`/qc/view/${machine.machineId}/${item.worksheet.frequency}/${item.worksheet.id}?date=${mostRecentFailure.date}&viewOnly=true`}
                          className="px-3 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors"
                        >
                          👁️ View Failure
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Worksheet Status - only show in full mode */}
      {!compact && (
        <div className="space-y-3">
          <h3 className="text-md font-medium text-gray-100">Worksheet Schedules</h3>
          {Object.values(scheduleData).map((schedule, index) => (
            <div key={index} className="bg-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="font-medium text-gray-100">{schedule.worksheet.title}</div>
                  <div className="text-sm text-gray-400">
                    {schedule.worksheet.frequency} QC | Started: {schedule.worksheet.startDate || 'Unknown'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-300">
                    {schedule.completionRate}% complete
                  </div>
                  <div className="text-xs text-gray-400">
                    {schedule.completedDates.length} / {schedule.dueDates.filter(date => date <= new Date().toISOString().split('T')[0]).length} done
                  </div>
                </div>
              </div>
              
              {schedule.overdueCount > 0 && (
                <div className="text-sm text-red-400">
                  🚨 {schedule.overdueCount} QCs overdue
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {qcsDue.length === 0 && overdueQCs.length === 0 && qcFailures.length === 0 && (
        <div className="text-green-400 text-sm mt-4">
          All QCs are up to date with no failures!
        </div>
      )}
    </div>
  );
};

export default QCScheduleStatus;