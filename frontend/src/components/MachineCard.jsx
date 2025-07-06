import React from 'react';
import { Link } from 'react-router-dom';

const MachineCard = ({ machine }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
        return 'bg-green-900 text-green-200 border-green-700';
      case 'maintenance':
        return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'offline':
        return 'bg-gray-900 text-gray-200 border-gray-700';
      case 'critical':
        return 'bg-red-900 text-red-200 border-red-700';
      default:
        return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  const getQCResultColor = (result) => {
    switch (result) {
      case 'pass':
        return 'text-green-400';
      case 'fail':
        return 'text-red-400';
      case 'conditional':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDaysUntilQC = () => {
    const today = new Date();
    const dueDate = new Date(machine.nextQCDue);
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilQC = getDaysUntilQC();

  return (
    <Link to={`/machines/${machine.machineId}`} className="block">
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">{machine.name}</h3>
          <p className="text-sm text-gray-400">{machine.machineId}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(machine.status)}`}>
          {machine.status.toUpperCase()}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Type:</span>
          <span className="font-medium text-gray-100">{machine.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Manufacturer:</span>
          <span className="font-medium text-gray-100">{machine.manufacturer}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Location:</span>
          <span className="font-medium text-gray-100">{machine.location.room}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Last QC:</span>
          <div className="text-right">
            <span className={`text-sm font-medium ${getQCResultColor(machine.lastQC.result)}`}>
              {machine.lastQC.result.toUpperCase()}
            </span>
            <p className="text-xs text-gray-400">
              {new Date(machine.lastQC.date).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Next QC Due:</span>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-100">
              {new Date(machine.nextQCDue).toLocaleDateString()}
            </p>
            <p className={`text-xs ${daysUntilQC <= 3 ? 'text-red-400 font-semibold' : 'text-gray-400'}`}>
              {daysUntilQC > 0 ? `${daysUntilQC} days` : daysUntilQC === 0 ? 'Today' : 'Overdue'}
            </p>
          </div>
        </div>
      </div>

      {machine.lastQC.notes && (
        <div className="mt-3 p-2 bg-gray-900 rounded text-xs text-gray-400">
          <span className="font-medium">Note:</span> {machine.lastQC.notes}
        </div>
      )}
      </div>
    </Link>
  );
};

export default MachineCard;