import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const QCNotifications = ({ minimized = false, showAll = false }) => {
  const [dueTasks, setDueTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNotifications, setShowNotifications] = useState(!minimized);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDueTasks();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDueTasks, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDueTasks = async () => {
    try {
      const response = await axios.get('/api/qc/due-tasks');
      setDueTasks(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching due tasks:', err);
      setError('Failed to load QC notifications');
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'bg-red-900 border-red-500 text-red-100';
      case 'high': return 'bg-orange-900 border-orange-500 text-orange-100';
      case 'medium': return 'bg-yellow-900 border-yellow-500 text-yellow-100';
      case 'low': return 'bg-blue-900 border-blue-500 text-blue-100';
      default: return 'bg-gray-800 border-gray-600 text-gray-100';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '📋';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case 'daily': return '📅';
      case 'weekly': return '📊';
      case 'monthly': return '📆';
      case 'quarterly': return '🗓️';
      case 'annual': return '📋';
      default: return '📋';
    }
  };

  const handlePerformQC = (task) => {
    navigate(`/qc/${task.machineId}/${task.frequency}/${task.type.toLowerCase()}`);
  };

  const getTotalCriticalTasks = () => {
    if (!dueTasks) return 0;
    return Object.values(dueTasks).flat().filter(task => task.priority === 'critical').length;
  };

  const getTotalOverdueTasks = () => {
    if (!dueTasks) return 0;
    return Object.entries(dueTasks)
      .filter(([key]) => key.includes('Overdue'))
      .reduce((total, [, tasks]) => total + tasks.length, 0);
  };

  const getTotalDueTodayTasks = () => {
    if (!dueTasks) return 0;
    return Object.entries(dueTasks)
      .filter(([key]) => key.includes('DueToday'))
      .reduce((total, [, tasks]) => total + tasks.length, 0);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 mb-4 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 mb-4">
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  const criticalCount = getTotalCriticalTasks();
  const overdueCount = getTotalOverdueTasks();
  const dueTodayCount = getTotalDueTodayTasks();
  const hasNotifications = criticalCount > 0 || overdueCount > 0 || dueTodayCount > 0;

  if (minimized) {
    return (
      <div 
        className={`fixed top-4 right-4 z-50 cursor-pointer transition-all duration-200 ${
          hasNotifications 
            ? 'bg-red-900 border-red-500 hover:bg-red-800' 
            : 'bg-green-900 border-green-500 hover:bg-green-800'
        } border rounded-lg p-3 shadow-lg`}
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <div className="flex items-center space-x-2">
          {hasNotifications ? (
            <>
              <span className="text-red-100 text-sm font-medium">
                {criticalCount > 0 && `🚨 ${criticalCount} Critical`}
                {overdueCount > 0 && ` • ${overdueCount} Overdue`}
                {dueTodayCount > 0 && ` • ${dueTodayCount} Due Today`}
              </span>
            </>
          ) : (
            <span className="text-green-100 text-sm">All QC Current</span>
          )}
          <span className="text-xs opacity-70">{showNotifications ? '▼' : '▶'}</span>
        </div>
        
        {showNotifications && hasNotifications && (
          <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800 rounded-lg shadow-xl border border-gray-600 max-h-96 overflow-y-auto">
            <QCNotificationsList 
              dueTasks={dueTasks} 
              onPerformQC={handlePerformQC}
              getPriorityColor={getPriorityColor}
              getPriorityIcon={getPriorityIcon}
              getFrequencyIcon={getFrequencyIcon}
            />
          </div>
        )}
      </div>
    );
  }

  if (!hasNotifications && !showAll) {
    return (
      <div className="bg-green-900/20 border border-green-600 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-100">✓</span>
          <span className="text-green-200 font-medium">All QC Up to Date</span>
        </div>
        <p className="text-green-300 text-sm mt-1">
          No overdue or due today QC tasks. Great work!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg mb-6">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-100 flex items-center space-x-2">
            <span>🔔</span>
            <span>QC Notifications</span>
          </h3>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="text-gray-400 hover:text-gray-200 p-1"
          >
            {showNotifications ? '▼' : '▶'}
          </button>
        </div>
        
        {hasNotifications && (
          <div className="flex items-center space-x-4 mt-2 text-sm">
            {criticalCount > 0 && (
              <span className="flex items-center space-x-1 text-red-300">
                <span>🚨</span>
                <span>{criticalCount} Critical</span>
              </span>
            )}
            {overdueCount > 0 && (
              <span className="flex items-center space-x-1 text-orange-300">
                <span>⚠️</span>
                <span>{overdueCount} Overdue</span>
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="flex items-center space-x-1 text-yellow-300">
                <span>📅</span>
                <span>{dueTodayCount} Due Today</span>
              </span>
            )}
          </div>
        )}
      </div>

      {showNotifications && (
        <QCNotificationsList 
          dueTasks={dueTasks} 
          onPerformQC={handlePerformQC}
          getPriorityColor={getPriorityColor}
          getPriorityIcon={getPriorityIcon}
          getFrequencyIcon={getFrequencyIcon}
        />
      )}
    </div>
  );
};

const QCNotificationsList = ({ dueTasks, onPerformQC, getPriorityColor, getPriorityIcon, getFrequencyIcon }) => {
  const allTasks = Object.entries(dueTasks)
    .flatMap(([category, tasks]) => 
      tasks.map(task => ({ ...task, category }))
    )
    .sort((a, b) => {
      // Sort by priority first, then by days overdue
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      if (a.priority !== b.priority) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.daysOverdue - a.daysOverdue;
    });

  if (allTasks.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">
        <span>No outstanding QC tasks</span>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      {allTasks.map((task, index) => (
        <div
          key={`${task.machineId}-${task.frequency}-${index}`}
          className={`p-3 border-l-4 ${getPriorityColor(task.priority)} ${
            index < allTasks.length - 1 ? 'border-b border-gray-700' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span>{getPriorityIcon(task.priority)}</span>
                <span>{getFrequencyIcon(task.frequency)}</span>
                <span className="font-medium text-sm">{task.machineName}</span>
                <span className="text-xs opacity-75">({task.type})</span>
              </div>
              
              <div className="text-xs opacity-90 mb-1">
                {task.location}
              </div>
              
              <div className="flex items-center space-x-4 text-xs">
                <span>
                  {task.frequency.charAt(0).toUpperCase() + task.frequency.slice(1)} QC
                </span>
                {task.daysOverdue > 0 ? (
                  <span className="text-red-300">
                    {task.daysOverdue} days overdue
                  </span>
                ) : (
                  <span className="text-yellow-300">Due today</span>
                )}
                {task.missedCount > 0 && (
                  <span className="text-orange-300">
                    {task.missedCount} missed
                  </span>
                )}
              </div>
            </div>
            
            <button
              onClick={() => onPerformQC(task)}
              className="ml-3 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors"
            >
              Perform QC
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QCNotifications;