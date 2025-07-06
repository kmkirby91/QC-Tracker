import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const DueTasksWidget = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dueTasks, setDueTasks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDueTasks();
  }, []);

  const fetchDueTasks = async () => {
    try {
      const response = await axios.get('/api/qc/due-tasks');
      setDueTasks(response.data);
    } catch (error) {
      console.error('Error fetching due tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-600 rounded-full animate-pulse"></div>
          <span className="text-gray-400">Loading QC tasks...</span>
        </div>
      </div>
    );
  }

  if (!dueTasks) return null;

  const totalOverdue = dueTasks.dailyOverdue.length + dueTasks.monthlyOverdue.length + 
                       (dueTasks.quarterlyOverdue?.length || 0) + (dueTasks.annualOverdue?.length || 0);
  const totalDueToday = dueTasks.dailyDueToday.length + dueTasks.monthlyDueThisMonth.length + 
                        (dueTasks.quarterlyDueThisQuarter?.length || 0) + (dueTasks.annualDueThisYear?.length || 0);
  const totalTasks = totalOverdue + totalDueToday;

  // For development - always show widget even if no tasks (remove this in production)
  const showForDevelopment = true;
  
  // Don't show widget if no tasks (unless in development mode)
  if (totalTasks === 0 && !showForDevelopment) return null;

  const getTaskPriority = (task) => {
    if (task.priority === 'critical') return 'text-red-400 font-semibold';
    if (task.priority === 'high') return 'text-orange-400 font-medium';
    return 'text-yellow-400';
  };

  const formatDaysOverdue = (daysOverdue) => {
    if (daysOverdue === 0) return 'Due Today';
    if (daysOverdue > 0) return `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`;
    return `Due in ${Math.abs(daysOverdue)} day${Math.abs(daysOverdue) > 1 ? 's' : ''}`;
  };

  const headerBgClass = totalTasks === 0 
    ? "bg-gradient-to-r from-green-900 to-blue-900 border border-green-700" 
    : "bg-gradient-to-r from-blue-900 to-purple-900 border border-blue-700";
    
  const hoverClass = totalTasks === 0 
    ? "hover:bg-green-800" 
    : "hover:bg-blue-800";
    
  const iconBgClass = totalTasks === 0 
    ? "bg-green-500" 
    : "bg-blue-500";
    
  const headerTextClass = totalTasks === 0 
    ? "text-green-200" 
    : "text-blue-200";
    
  const subTextClass = totalTasks === 0 
    ? "text-green-400" 
    : "text-blue-400";

  return (
    <div className={`${headerBgClass} rounded-lg mb-6 overflow-hidden`}>
      {/* Header - Always Visible */}
      <div 
        className={`p-4 cursor-pointer ${hoverClass} transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 ${iconBgClass} rounded-full flex items-center justify-center`}>
              {totalTasks === 0 ? (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-4">
                <h3 className={`text-sm font-semibold ${headerTextClass}`}>
                  {totalTasks === 0 ? 'QC Status: All Up to Date' : 'QC Tasks Due'}
                </h3>
                <div className="flex space-x-2 text-xs">
                  {totalOverdue > 0 && (
                    <span className="bg-red-900 text-red-200 px-2 py-1 rounded-full font-medium">
                      {totalOverdue} Overdue
                    </span>
                  )}
                  {totalDueToday > 0 && (
                    <span className="bg-orange-900 text-orange-200 px-2 py-1 rounded-full font-medium">
                      {totalDueToday} Due
                    </span>
                  )}
                </div>
              </div>
              <p className={`text-sm ${subTextClass}`}>
                {totalTasks === 0 ? 
                  (isExpanded ? 'Click to collapse' : 'All QC tasks up to date - click to expand for details') :
                  (isExpanded ? 'Click to collapse' : `${totalTasks} tasks need attention - click to expand`)
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Link
              to="/due-today"
              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View All
            </Link>
            <svg 
              className={`w-5 h-5 text-red-600 transform transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-red-700 bg-gray-800 bg-opacity-50">
          <div className="p-4 space-y-4">
            
            {/* No tasks message */}
            {totalTasks === 0 && (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-green-200 mb-1">All QC Tasks Up to Date!</h3>
                <p className="text-green-400 text-sm">
                  Great job! All machines are current with their QC requirements.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Daily QC completed
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Monthly QC current
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Quarterly QC on schedule
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Annual QC up to date
                  </div>
                </div>
              </div>
            )}
            
            {/* OVERDUE SECTION */}
            {totalOverdue > 0 && (
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="text-lg font-semibold text-red-200 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Overdue ({totalOverdue})
                </h4>
                
                {/* Overdue Daily QC */}
                {dueTasks.dailyOverdue.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Daily QC</h5>
                    <div className="space-y-1">
                      {dueTasks.dailyOverdue.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <span className={getTaskPriority(task)}>
                            {formatDaysOverdue(task.daysOverdue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Overdue Monthly QC */}
                {dueTasks.monthlyOverdue.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Monthly QC</h5>
                    <div className="space-y-1">
                      {dueTasks.monthlyOverdue.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <span className={getTaskPriority(task)}>
                            {formatDaysOverdue(task.daysOverdue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Overdue Quarterly QC */}
                {dueTasks.quarterlyOverdue?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Quarterly QC</h5>
                    <div className="space-y-1">
                      {dueTasks.quarterlyOverdue.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <span className={getTaskPriority(task)}>
                            Overdue
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Overdue Annual QC */}
                {dueTasks.annualOverdue?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Annual QC</h5>
                    <div className="space-y-1">
                      {dueTasks.annualOverdue.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-2">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <span className={getTaskPriority(task)}>
                            Overdue
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* DUE TODAY SECTION */}
            {totalDueToday > 0 && (
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="text-lg font-semibold text-blue-200 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  Due This Period ({totalDueToday})
                </h4>
                
                {/* Due Today Daily QC */}
                {dueTasks.dailyDueToday.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Daily QC</h5>
                    <div className="space-y-1">
                      {dueTasks.dailyDueToday.slice(0, 3).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-3">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400 text-xs">Due Today</span>
                            <Link
                              to={`/qc/perform/${task.machineId}/daily`}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Perform QC
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Due This Month Monthly QC */}
                {dueTasks.monthlyDueThisMonth.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Monthly QC</h5>
                    <div className="space-y-1">
                      {dueTasks.monthlyDueThisMonth.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-3">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-400 text-xs">Due This Month</span>
                            <Link
                              to={`/qc/perform/${task.machineId}/monthly`}
                              className="bg-yellow-600 text-white px-3 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
                            >
                              Perform QC
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Due This Quarter Quarterly QC */}
                {dueTasks.quarterlyDueThisQuarter?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Quarterly QC</h5>
                    <div className="space-y-1">
                      {dueTasks.quarterlyDueThisQuarter.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-3">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-400 text-xs">Due This Quarter</span>
                            <Link
                              to={`/qc/perform/${task.machineId}/quarterly`}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                            >
                              Perform QC
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Due This Year Annual QC */}
                {dueTasks.annualDueThisYear?.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-sm font-medium text-gray-300 mb-1">Annual QC</h5>
                    <div className="space-y-1">
                      {dueTasks.annualDueThisYear.slice(0, 2).map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-gray-800 bg-opacity-70 rounded p-3">
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/machines/${task.machineId}`}
                              className="font-medium text-gray-100 hover:text-blue-400"
                            >
                              {task.machineName}
                            </Link>
                            <span className="text-gray-400">({task.type})</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-400 text-xs">Due This Year</span>
                            <Link
                              to={`/qc/perform/${task.machineId}/annual`}
                              className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 transition-colors"
                            >
                              Perform QC
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Quick Actions */}
            <div className="pt-2 border-t border-red-700 flex justify-end">
              <Link
                to="/due-today"
                className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center"
              >
                View all {totalTasks} tasks →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DueTasksWidget;