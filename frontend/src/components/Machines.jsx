import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { fetchMachinesWithWorksheets } from '../utils/machineAPI';

const Machines = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [worksheets, setWorksheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [machinesData, worksheetsData] = await Promise.all([
        fetchMachinesWithWorksheets(),
        // Fetch worksheets from localStorage since that's where they're stored
        Promise.resolve(JSON.parse(localStorage.getItem('qcWorksheets') || '[]'))
      ]);
      
      setMachines(machinesData);
      setWorksheets(worksheetsData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  // Function to get actual QC schedule based on assigned worksheets
  const getActualQCSchedule = (machine) => {
    // Find all worksheets assigned to this machine
    const assignedWorksheets = worksheets.filter(worksheet => 
      worksheet.machineId === machine.machineId || 
      (worksheet.assignedMachines && worksheet.assignedMachines.includes(machine.machineId))
    );

    // Extract unique frequencies from assigned worksheets
    const frequencies = [...new Set(assignedWorksheets.map(w => w.frequency))];
    
    // Create schedule object based on actual assignments
    const schedule = {
      daily: frequencies.includes('daily'),
      weekly: frequencies.includes('weekly'),
      monthly: frequencies.includes('monthly'),
      quarterly: frequencies.includes('quarterly'),
      annual: frequencies.includes('annual')
    };

    return schedule;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machines...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-600 rounded-lg p-4 text-center">
        <div className="text-red-400 font-medium">{error}</div>
        <button 
          onClick={fetchData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">All Machines</h1>
        <Link
          to="/machines/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Machine</span>
        </Link>
      </div>
      
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Machine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  QC Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {machines.map((machine) => (
                <tr 
                  key={machine.machineId} 
                  className="hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => navigate(`/machines/${machine.machineId}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-100">{machine.name}</div>
                      <div className="text-sm text-gray-400">{machine.machineId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-900 text-blue-200 rounded-full">
                      {machine.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div>
                      <div>{machine.location.building} - Floor {machine.location.floor}</div>
                      <div className="text-gray-400">{machine.location.room}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      machine.status === 'operational' ? 'bg-green-900 text-green-200' :
                      machine.status === 'maintenance' ? 'bg-yellow-900 text-yellow-200' :
                      machine.status === 'offline' ? 'bg-red-900 text-red-200' :
                      'bg-gray-900 text-gray-200'
                    }`}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const actualSchedule = getActualQCSchedule(machine);
                        return Object.entries(actualSchedule).map(([freq, enabled]) => 
                          enabled && (
                            <span key={freq} className="px-1 py-0.5 text-xs bg-purple-900 text-purple-200 rounded">
                              {freq}
                            </span>
                          )
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent row click
                        navigate(`/machines/${machine.machineId}`);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      📊 Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {machines.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">No machines found</div>
          <Link
            to="/machines/add"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <span>+</span>
            <span>Add Your First Machine</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default Machines;