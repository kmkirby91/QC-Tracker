import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PostItNote from './PostItNote';

const StatusSummary = ({ machines }) => {
  const [openFailures, setOpenFailures] = useState([]);
  const [loadingFailures, setLoadingFailures] = useState(true);

  useEffect(() => {
    fetchOpenFailures();
  }, []);

  const fetchOpenFailures = async () => {
    try {
      const response = await axios.get('/api/qc/open-failures');
      setOpenFailures(response.data);
    } catch (error) {
      console.error('Error fetching open failures:', error);
      setOpenFailures([]);
    } finally {
      setLoadingFailures(false);
    }
  };

  const statusCounts = machines.reduce((acc, machine) => {
    acc[machine.status] = (acc[machine.status] || 0) + 1;
    return acc;
  }, {});

  const typeCounts = machines.reduce((acc, machine) => {
    acc[machine.type] = (acc[machine.type] || 0) + 1;
    return acc;
  }, {});

  const overdueCount = machines.filter(machine => {
    const dueDate = new Date(machine.nextQCDue);
    return dueDate < new Date();
  }).length;

  const dueSoonCount = machines.filter(machine => {
    const today = new Date();
    const dueDate = new Date(machine.nextQCDue);
    const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }).length;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'text-red-400';
      case 'investigating': return 'text-orange-400';
      case 'scheduled': return 'text-blue-400';
      case 'parts_ordered': return 'text-purple-400';
      case 'monitoring': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Operational Status</h3>
        <p className="text-3xl font-bold text-green-400">{statusCounts.operational || 0}</p>
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-yellow-400">Maintenance:</span>
            <span className="font-medium text-gray-100">{statusCounts.maintenance || 0}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-red-400">Critical:</span>
            <span className="font-medium text-gray-100">{statusCounts.critical || 0}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Offline:</span>
            <span className="font-medium text-gray-100">{statusCounts.offline || 0}</span>
          </div>
        </div>
      </div>

      <PostItNote />

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">QC Schedule</h3>
        <p className="text-3xl font-bold text-blue-400">{dueSoonCount}</p>
        <p className="text-xs text-gray-400 mt-1">Due in next 3 days</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs">
            <span className="text-red-400 font-medium">Overdue:</span>
            <span className="font-bold text-red-400">{overdueCount}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-400">Open Failures</h3>
          <Link 
            to="/open-failures" 
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View All
          </Link>
        </div>
        
        {loadingFailures ? (
          <div className="flex items-center space-x-2 mt-3">
            <div className="w-4 h-4 bg-gray-600 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-400">Loading...</span>
          </div>
        ) : openFailures.length === 0 ? (
          <div className="text-center py-4">
            <div className="w-8 h-8 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-green-400 font-medium">No Open Failures</p>
            <p className="text-xs text-gray-500">All systems passing QC</p>
          </div>
        ) : (
          <div className="space-y-2 mt-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-red-400">{openFailures.length}</span>
              <div className="text-xs text-gray-400">
                {openFailures.filter(f => f.severity === 'critical').length} critical
              </div>
            </div>
            
            {openFailures.slice(0, 3).map((failure, index) => (
              <div key={failure.id} className="bg-gray-700 bg-opacity-50 rounded p-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <Link 
                      to={`/machines/${failure.machineId}`}
                      className="text-xs font-medium text-gray-100 hover:text-blue-400 truncate block"
                    >
                      {failure.machineName}
                    </Link>
                    <p className="text-xs text-gray-400 truncate">{failure.testName}</p>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className={`text-xs font-medium ${getSeverityColor(failure.severity)}`}>
                      {failure.severity}
                    </span>
                    <span className="text-xs text-gray-500">{failure.daysOpen}d</span>
                  </div>
                </div>
              </div>
            ))}
            
            {openFailures.length > 3 && (
              <div className="text-center pt-2">
                <Link 
                  to="/open-failures"
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  +{openFailures.length - 3} more failures
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusSummary;