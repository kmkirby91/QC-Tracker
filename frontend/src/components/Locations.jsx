import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Locations = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [sortBy, setSortBy] = useState('machine'); // 'machine', 'type', 'status', 'nextQC'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/machines');
      setMachines(response.data);
      
      // Auto-select first location if available
      if (response.data.length > 0 && !selectedLocation) {
        const firstLocation = response.data[0].location.building;
        setSelectedLocation(firstLocation);
      }
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations from machines (by building only)
  const getLocations = () => {
    const locationSet = new Set();
    machines.forEach(machine => {
      locationSet.add(machine.location.building);
    });
    return Array.from(locationSet).sort();
  };

  // Filter machines by selected location (building)
  const getMachinesForLocation = (location) => {
    if (!location) return [];
    
    return machines.filter(machine => 
      machine.location.building === location
    );
  };

  // Get QC worksheets for machines
  const getQCWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading QC worksheets:', error);
      return [];
    }
  };

  // Get active QC assignments for a machine
  const getActiveQCForMachine = (machineId, machineType) => {
    const worksheets = getQCWorksheets();
    const activeQC = [];
    
    ['daily', 'weekly', 'monthly', 'quarterly', 'annual'].forEach(frequency => {
      const worksheet = worksheets.find(ws => 
        ws.modality === machineType && 
        ws.frequency === frequency && 
        ws.assignedMachines && 
        ws.assignedMachines.includes(machineId)
      );
      
      if (worksheet) {
        activeQC.push({
          frequency,
          worksheet,
          dueStatus: calculateDueStatus(frequency)
        });
      }
    });
    
    return activeQC;
  };

  // Calculate due status for QC frequency
  const calculateDueStatus = (frequency) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Simple due status calculation - in real app would check actual QC records
    switch (frequency) {
      case 'daily':
        return Math.random() > 0.3 ? 'due' : 'current';
      case 'weekly':
        return Math.random() > 0.7 ? 'due' : 'current';
      case 'monthly':
        return Math.random() > 0.8 ? 'due' : 'current';
      case 'quarterly':
        return Math.random() > 0.9 ? 'due' : 'current';
      case 'annual':
        return Math.random() > 0.95 ? 'due' : 'current';
      default:
        return 'current';
    }
  };

  // Sort machines based on selected criteria
  const sortMachines = (machinesArray) => {
    const sorted = [...machinesArray].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'machine':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type.toLowerCase();
          bValue = b.type.toLowerCase();
          break;
        case 'status':
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'nextQC':
          aValue = new Date(a.nextQCDue);
          bValue = new Date(b.nextQCDue);
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'bg-green-900 text-green-200';
      case 'maintenance': return 'bg-yellow-900 text-yellow-200';
      case 'critical': return 'bg-red-900 text-red-200';
      case 'offline': return 'bg-gray-900 text-gray-200';
      default: return 'bg-gray-900 text-gray-200';
    }
  };

  const getFrequencyColor = (frequency) => {
    const colors = {
      daily: 'bg-blue-600 hover:bg-blue-700',
      weekly: 'bg-green-600 hover:bg-green-700',
      monthly: 'bg-purple-600 hover:bg-purple-700',
      quarterly: 'bg-yellow-600 hover:bg-yellow-700',
      annual: 'bg-red-600 hover:bg-red-700'
    };
    return colors[frequency] || 'bg-gray-600 hover:bg-gray-700';
  };

  const getDueStatusColor = (status) => {
    switch (status) {
      case 'due': return 'text-red-400';
      case 'overdue': return 'text-red-500 font-bold';
      case 'current': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getSortIcon = (column) => {
    if (sortBy !== column) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading locations...</div>
      </div>
    );
  }

  const locations = getLocations();
  const machinesForLocation = selectedLocation ? getMachinesForLocation(selectedLocation) : [];
  const sortedMachines = sortMachines(machinesForLocation);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-100">QC by Location</h1>
        <div className="text-sm text-gray-400">
          {locations.length} location(s) • {machines.length} total machines
        </div>
      </div>

      {/* Location Selection */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Select Location</h2>
          <div className="text-sm text-gray-400">
            {machinesForLocation.length} machine(s) in selected location
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {locations.map(location => (
            <button
              key={location}
              onClick={() => setSelectedLocation(location)}
              className={`p-4 rounded-lg border text-left transition-colors ${
                selectedLocation === location
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-medium">{location}</div>
              <div className="text-sm opacity-75">
                {getMachinesForLocation(location).length} machine(s)
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Machine List with QC Status */}
      {selectedLocation && (
        <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">
                Active QC for {selectedLocation}
              </h2>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">Sort by:</span>
                <div className="flex space-x-2">
                  {[
                    { key: 'machine', label: 'Machine' },
                    { key: 'type', label: 'Type' },
                    { key: 'status', label: 'Status' },
                    { key: 'nextQC', label: 'Next QC' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => handleSort(key)}
                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                        sortBy === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {label} {getSortIcon(key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Active QC Programs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {sortedMachines.map(machine => {
                  const activeQC = getActiveQCForMachine(machine.machineId, machine.type);
                  
                  return (
                    <tr key={machine.machineId} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-100">{machine.name}</div>
                          <div className="text-sm text-gray-400">{machine.machineId}</div>
                          <div className="text-xs text-gray-500">{machine.location.building} - {machine.location.room}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {machine.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(machine.status)}`}>
                          {machine.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {activeQC.length === 0 ? (
                          <div className="text-sm text-gray-500 italic">No QC programs assigned</div>
                        ) : (
                          <div className="space-y-2">
                            {activeQC.map(({ frequency, worksheet, dueStatus }) => (
                              <div key={frequency} className="flex items-center space-x-2">
                                <span className={`px-2 py-1 text-xs text-white rounded transition-colors ${getFrequencyColor(frequency)}`}>
                                  {frequency.charAt(0).toUpperCase() + frequency.slice(1)}
                                </span>
                                <span className={`text-xs ${getDueStatusColor(dueStatus)}`}>
                                  {dueStatus === 'due' ? '⚠️ Due' : '✅ Current'}
                                </span>
                                <button
                                  onClick={() => navigate(`/qc/perform/${machine.machineId}/${frequency}`)}
                                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                                >
                                  Perform
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/machines/${machine.machineId}`}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            📊 Details
                          </Link>
                          <Link
                            to={`/worksheets?machine=${machine.machineId}`}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            📋 Worksheets
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedMachines.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No machines found in the selected location.
            </div>
          )}
        </div>
      )}

      {locations.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No locations found. Please add machines to see location data.
        </div>
      )}
    </div>
  );
};

export default Locations;