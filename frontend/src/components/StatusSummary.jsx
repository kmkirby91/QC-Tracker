import React from 'react';

const StatusSummary = ({ machines }) => {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-sm font-medium text-gray-400 mb-2">Total Machines</h3>
        <p className="text-3xl font-bold text-gray-100">{machines.length}</p>
        <div className="mt-3 text-xs space-y-1">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="flex justify-between">
              <span className="text-gray-400">{type}:</span>
              <span className="font-medium text-gray-100">{count}</span>
            </div>
          ))}
        </div>
      </div>

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
        <h3 className="text-sm font-medium text-gray-400 mb-2">Recent QC Results</h3>
        <div className="space-y-2 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-green-400">Pass</span>
            <div className="flex-1 mx-2 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full" 
                style={{width: `${(machines.filter(m => m.lastQC.result === 'pass').length / machines.length) * 100}%`}}
              />
            </div>
            <span className="text-xs font-medium text-gray-100">{machines.filter(m => m.lastQC.result === 'pass').length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-red-400">Fail</span>
            <div className="flex-1 mx-2 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-red-400 h-2 rounded-full" 
                style={{width: `${(machines.filter(m => m.lastQC.result === 'fail').length / machines.length) * 100}%`}}
              />
            </div>
            <span className="text-xs font-medium text-gray-100">{machines.filter(m => m.lastQC.result === 'fail').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusSummary;