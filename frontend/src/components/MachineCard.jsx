import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const MachineCard = ({ machine }) => {
  const [customWorksheets, setCustomWorksheets] = useState([]);

  useEffect(() => {
    loadCustomWorksheets();
  }, []);

  // Listen for localStorage changes to update custom worksheets
  useEffect(() => {
    const handleStorageChange = () => {
      loadCustomWorksheets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const loadCustomWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      if (stored) {
        setCustomWorksheets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading worksheets:', error);
    }
  };

  const getWorksheetForMachineAndFrequency = (machineId, frequency) => {
    const worksheet = customWorksheets.find(ws => 
      ws.assignedMachines && ws.assignedMachines.includes(machineId) && ws.frequency === frequency
    );
    return worksheet;
  };

  const getWorksheetsForMachineAndFrequency = (machineId, frequency) => {
    return customWorksheets.filter(ws => 
      ws.assignedMachines && ws.assignedMachines.includes(machineId) && ws.frequency === frequency
    );
  };

  const getAssignedFrequencies = (machine) => {
    // Only return frequencies where the machine has actual worksheets assigned
    const assignedFrequencies = [];
    if (machine && customWorksheets.length > 0) {
      ['daily', 'weekly', 'monthly', 'quarterly', 'annual'].forEach(frequency => {
        const hasWorksheet = customWorksheets.some(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency && 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machine.machineId)
        );
        if (hasWorksheet) {
          assignedFrequencies.push(frequency);
        }
      });
    }
    return assignedFrequencies;
  };

  const getMachineWorksheets = () => {
    const worksheets = [];
    const assignedFrequencies = getAssignedFrequencies(machine);
    
    if (assignedFrequencies.includes('daily')) {
      const machineWorksheets = getWorksheetsForMachineAndFrequency(machine.machineId, 'daily');
      worksheets.push({
        frequency: 'Daily',
        count: machineWorksheets.length,
        name: machineWorksheets.length > 0 ? 
          (machineWorksheets.length === 1 ? machineWorksheets[0].title : `${machineWorksheets.length} Custom QCs`) : 
          `Default ${machine.type} Daily`,
        isCustom: machineWorksheets.length > 0
      });
    }
    if (assignedFrequencies.includes('weekly')) {
      const machineWorksheets = getWorksheetsForMachineAndFrequency(machine.machineId, 'weekly');
      worksheets.push({
        frequency: 'Weekly',
        count: machineWorksheets.length,
        name: machineWorksheets.length > 0 ? 
          (machineWorksheets.length === 1 ? machineWorksheets[0].title : `${machineWorksheets.length} Custom QCs`) : 
          `Default ${machine.type} Weekly`,
        isCustom: machineWorksheets.length > 0
      });
    }
    if (assignedFrequencies.includes('monthly')) {
      const machineWorksheets = getWorksheetsForMachineAndFrequency(machine.machineId, 'monthly');
      worksheets.push({
        frequency: 'Monthly',
        count: machineWorksheets.length,
        name: machineWorksheets.length > 0 ? 
          (machineWorksheets.length === 1 ? machineWorksheets[0].title : `${machineWorksheets.length} Custom QCs`) : 
          `Default ${machine.type} Monthly`,
        isCustom: machineWorksheets.length > 0
      });
    }
    if (assignedFrequencies.includes('quarterly')) {
      const machineWorksheets = getWorksheetsForMachineAndFrequency(machine.machineId, 'quarterly');
      worksheets.push({
        frequency: 'Quarterly',
        count: machineWorksheets.length,
        name: machineWorksheets.length > 0 ? 
          (machineWorksheets.length === 1 ? machineWorksheets[0].title : `${machineWorksheets.length} Custom QCs`) : 
          `Default ${machine.type} Quarterly`,
        isCustom: machineWorksheets.length > 0
      });
    }
    if (assignedFrequencies.includes('annual')) {
      const machineWorksheets = getWorksheetsForMachineAndFrequency(machine.machineId, 'annual');
      worksheets.push({
        frequency: 'Annual',
        count: machineWorksheets.length,
        name: machineWorksheets.length > 0 ? 
          (machineWorksheets.length === 1 ? machineWorksheets[0].title : `${machineWorksheets.length} Custom QCs`) : 
          `Default ${machine.type} Annual`,
        isCustom: machineWorksheets.length > 0
      });
    }
    
    return worksheets;
  };
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <Link 
            to={`/machines/${machine.machineId}`} 
            className="text-lg font-semibold text-gray-100 hover:text-blue-400 transition-colors"
          >
            {machine.name}
          </Link>
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
              {machine.lastQC.result ? machine.lastQC.result.toUpperCase() : 'N/A'}
            </span>
            <p className="text-xs text-gray-400">
              {machine.lastQC.date ? new Date(machine.lastQC.date).toLocaleDateString() : 'Not performed'}
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

      {/* QC Worksheets Section */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-2">QC Worksheets</h4>
        <div className="space-y-1">
          {getMachineWorksheets().map((worksheet, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <Link
                to={`/qc/view-worksheet/${machine.machineId}/${worksheet.frequency.toLowerCase()}`}
                className="text-gray-400 hover:text-blue-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {worksheet.frequency}:
              </Link>
              <div className="text-right max-w-32">
                <Link
                  to={`/qc/view-worksheet/${machine.machineId}/${worksheet.frequency.toLowerCase()}`}
                  className={`font-medium hover:underline transition-colors ${worksheet.isCustom ? 'text-blue-300 hover:text-blue-200' : 'text-gray-400 hover:text-gray-300'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {worksheet.name}
                </Link>
                {worksheet.isCustom && (
                  <div className="flex items-center space-x-1">
                    <div className="text-xs text-blue-500">📋 Custom</div>
                    {worksheet.count > 1 && (
                      <div className="text-xs bg-orange-600 text-white px-1 rounded">
                        {worksheet.count}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {getMachineWorksheets().length === 0 && (
            <div className="text-xs text-gray-500 italic">No QC schedule configured</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineCard;