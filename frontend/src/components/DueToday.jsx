import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DueToday = () => {
  const [dueTasks, setDueTasks] = useState({
    dailyOverdue: [],
    dailyDueToday: [],
    monthlyOverdue: [],
    monthlyDueThisMonth: [],
    quarterlyOverdue: [],
    quarterlyDueThisQuarter: [],
    annualOverdue: [],
    annualDueThisYear: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDueTasks();
  }, []);

  const fetchDueTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/qc/due-tasks');
      setDueTasks(response.data);
    } catch (err) {
      setError('Failed to load due tasks: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-900 border-red-700';
      case 'high':
        return 'bg-orange-900 border-orange-700';
      case 'medium':
        return 'bg-yellow-900 border-yellow-700';
      default:
        return 'bg-blue-900 border-blue-700';
    }
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      critical: 'bg-red-900 text-red-200',
      high: 'bg-orange-900 text-orange-200',
      medium: 'bg-yellow-900 text-yellow-200',
      low: 'bg-blue-900 text-blue-200'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority] || colors.low}`;
  };

  const formatDaysOverdue = (daysOverdue) => {
    if (daysOverdue === 0) return 'Due Today';
    if (daysOverdue > 0) return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    return `Due in ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) > 1 ? 's' : ''}`;
  };

  const TaskCard = ({ task, type }) => (
    <div className={`border rounded-lg p-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-100">{task.machineName}</h3>
            <span className={getPriorityBadge(task.priority)}>
              {task.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-400">{task.machineId} • {task.location}</p>
          <p className="text-sm text-gray-400">{task.type} • {type === 'daily' ? 'Daily QC' : type === 'monthly' ? 'Monthly QC' : type === 'quarterly' ? 'Quarterly QC' : 'Annual QC'}</p>
        </div>
        
        <div className="text-right">
          <p className={`text-sm font-medium ${
            task.daysOverdue > 0 ? 'text-red-400' : 
            task.daysOverdue === 0 ? 'text-orange-400' : 'text-blue-400'
          }`}>
            {formatDaysOverdue(task.daysOverdue)}
          </p>
          {task.lastQC && (
            <p className="text-xs text-gray-400">
              Last: {new Date(task.lastQC).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          {task.nextDue && (
            <span>Due: {new Date(task.nextDue).toLocaleDateString()}</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Link
            to={`/machines/${task.machineId}`}
            className="text-blue-400 hover:underline text-sm"
          >
            View Machine
          </Link>
          {type === 'daily' && task.daysOverdue >= 0 && (
            <button className="text-green-400 hover:underline text-sm">
              Perform QC
            </button>
          )}
          {(type === 'monthly' || type === 'quarterly' || type === 'annual') && (
            <button className="text-green-400 hover:underline text-sm">
              Schedule QC
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-400">Loading due tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  const totalOverdue = dueTasks.dailyOverdue.length + dueTasks.monthlyOverdue.length + dueTasks.quarterlyOverdue.length + dueTasks.annualOverdue.length;
  const totalDueToday = dueTasks.dailyDueToday.length;
  const totalDueThisMonth = dueTasks.monthlyDueThisMonth.length;
  const totalDueThisQuarter = dueTasks.quarterlyDueThisQuarter.length;
  const totalDueThisYear = dueTasks.annualDueThisYear.length;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link to="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">QC Tasks Due</h1>
            <p className="text-gray-400">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <button
            onClick={fetchDueTasks}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Overdue Tasks</p>
            <p className="text-3xl font-bold text-red-400">{totalOverdue}</p>
          </div>
          <div className="bg-orange-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Due Today</p>
            <p className="text-3xl font-bold text-orange-400">{totalDueToday}</p>
          </div>
          <div className="bg-yellow-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Due This Period</p>
            <p className="text-3xl font-bold text-yellow-400">{totalDueThisMonth + totalDueThisQuarter + totalDueThisYear}</p>
          </div>
          <div className="bg-green-900 rounded-lg p-4">
            <p className="text-sm text-gray-400">Total Tasks</p>
            <p className="text-3xl font-bold text-green-400">
              {totalOverdue + totalDueToday + totalDueThisMonth + totalDueThisQuarter + totalDueThisYear}
            </p>
          </div>
        </div>
      </div>

      {/* Overdue Daily QC */}
      {dueTasks.dailyOverdue.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Overdue Daily QC ({dueTasks.dailyOverdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.dailyOverdue.map((task, index) => (
              <TaskCard key={`daily-overdue-${index}`} task={task} type="daily" />
            ))}
          </div>
        </div>
      )}

      {/* Due Today Daily QC */}
      {dueTasks.dailyDueToday.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Daily QC Due Today ({dueTasks.dailyDueToday.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.dailyDueToday.map((task, index) => (
              <TaskCard key={`daily-today-${index}`} task={task} type="daily" />
            ))}
          </div>
        </div>
      )}

      {/* Overdue Monthly QC */}
      {dueTasks.monthlyOverdue.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Overdue Monthly QC ({dueTasks.monthlyOverdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.monthlyOverdue.map((task, index) => (
              <TaskCard key={`monthly-overdue-${index}`} task={task} type="monthly" />
            ))}
          </div>
        </div>
      )}

      {/* Due This Month QC */}
      {dueTasks.monthlyDueThisMonth.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Monthly QC Due This Month ({dueTasks.monthlyDueThisMonth.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.monthlyDueThisMonth.map((task, index) => (
              <TaskCard key={`monthly-month-${index}`} task={task} type="monthly" />
            ))}
          </div>
        </div>
      )}

      {/* Quarterly QC Overdue */}
      {dueTasks.quarterlyOverdue.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Overdue Quarterly QC ({dueTasks.quarterlyOverdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.quarterlyOverdue.map((task, index) => (
              <TaskCard key={`quarterly-overdue-${index}`} task={task} type="quarterly" />
            ))}
          </div>
        </div>
      )}

      {/* Due This Quarter QC */}
      {dueTasks.quarterlyDueThisQuarter.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Quarterly QC Due This Quarter ({dueTasks.quarterlyDueThisQuarter.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.quarterlyDueThisQuarter.map((task, index) => (
              <TaskCard key={`quarterly-quarter-${index}`} task={task} type="quarterly" />
            ))}
          </div>
        </div>
      )}

      {/* Annual QC Overdue */}
      {dueTasks.annualOverdue.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Overdue Annual QC ({dueTasks.annualOverdue.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.annualOverdue.map((task, index) => (
              <TaskCard key={`annual-overdue-${index}`} task={task} type="annual" />
            ))}
          </div>
        </div>
      )}

      {/* Due This Year QC */}
      {dueTasks.annualDueThisYear.length > 0 && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <h2 className="text-xl font-semibold text-gray-100">
              Annual QC Due This Year ({dueTasks.annualDueThisYear.length})
            </h2>
          </div>
          <div className="space-y-3">
            {dueTasks.annualDueThisYear.map((task, index) => (
              <TaskCard key={`annual-year-${index}`} task={task} type="annual" />
            ))}
          </div>
        </div>
      )}

      {/* No tasks */}
      {totalOverdue === 0 && totalDueToday === 0 && totalDueThisMonth === 0 && totalDueThisQuarter === 0 && totalDueThisYear === 0 && (
        <div className="bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-100 mb-2">All QC Tasks Up to Date!</h3>
          <p className="text-gray-400">
            Great job! All machines are current with their QC requirements.
          </p>
        </div>
      )}
    </div>
  );
};

export default DueToday;