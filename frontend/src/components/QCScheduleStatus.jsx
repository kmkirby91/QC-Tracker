import React, { useState, useEffect } from 'react';
import axios from 'axios';

const QCScheduleStatus = ({ machine, worksheets }) => {
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
      // Get completed QCs from localStorage
      const localCompletions = JSON.parse(localStorage.getItem('qcCompletions') || '[]');
      
      for (const worksheet of worksheets) {
        // Get completed dates for this specific worksheet
        const completedDates = localCompletions
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

  const getOverdueQCs = () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueList = [];

    Object.values(scheduleData).forEach(schedule => {
      const overdueDates = schedule.dueDates.filter(date => 
        date <= today && !schedule.completedDates.includes(date)
      );
      
      if (overdueDates.length > 0) {
        overdueList.push({
          worksheet: schedule.worksheet,
          overdueDates: overdueDates,
          count: overdueDates.length
        });
      }
    });

    return overdueList;
  };

  const getTotalStats = () => {
    let totalDue = 0;
    let totalCompleted = 0;
    let totalOverdue = 0;

    Object.values(scheduleData).forEach(schedule => {
      const today = new Date().toISOString().split('T')[0];
      const dueToDate = schedule.dueDates.filter(date => date <= today);
      totalDue += dueToDate.length;
      totalCompleted += schedule.completedDates.length;
      totalOverdue += dueToDate.length - schedule.completedDates.length;
    });

    return { totalDue, totalCompleted, totalOverdue };
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

  const overdueQCs = getOverdueQCs();
  const stats = getTotalStats();

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">QC Schedule Status</h2>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total QCs Due</div>
          <div className="text-2xl font-bold text-gray-100">{stats.totalDue}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Completed</div>
          <div className="text-2xl font-bold text-green-400">{stats.totalCompleted}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="text-sm text-gray-400">Overdue</div>
          <div className="text-2xl font-bold text-red-400">{stats.totalOverdue}</div>
        </div>
      </div>

      {/* Overdue QCs */}
      {overdueQCs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-md font-medium text-red-400 mb-3">⚠️ Overdue QCs</h3>
          <div className="space-y-3">
            {overdueQCs.map((item, index) => (
              <div key={index} className="bg-red-900/20 border border-red-600 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium text-red-200">{item.worksheet.title}</div>
                  <div className="text-sm text-red-300">{item.count} overdue</div>
                </div>
                <div className="text-xs text-red-300">
                  Frequency: {item.worksheet.frequency} | 
                  Started: {item.worksheet.startDate || 'Unknown'}
                </div>
                <div className="text-xs text-red-400 mt-1">
                  Oldest overdue: {item.overdueDates[0]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Individual Worksheet Status */}
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

      {overdueQCs.length === 0 && (
        <div className="text-green-400 text-sm mt-4">
          ✅ All QCs are up to date!
        </div>
      )}
    </div>
  );
};

export default QCScheduleStatus;