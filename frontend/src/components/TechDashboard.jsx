import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import QCNotifications from './QCNotifications';

const TechDashboard = () => {
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('Essen');
  const [dailyQCTasks, setDailyQCTasks] = useState([]);

  useEffect(() => {
    fetchMachines();
  }, []);

  useEffect(() => {
    if (machines.length > 0) {
      loadDailyQCTasks();
    }
  }, [machines, selectedLocation]);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/machines');
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to load machines');
    } finally {
      setLoading(false);
    }
  };

  // Get unique locations (buildings) from machines
  const getLocations = () => {
    const locationSet = new Set();
    machines.forEach(machine => {
      locationSet.add(machine.location.building);
    });
    return Array.from(locationSet).sort();
  };

  // Filter machines by selected location
  const getMachinesForLocation = () => {
    return machines.filter(machine => 
      machine.location.building === selectedLocation
    );
  };

  // Get QC worksheets from localStorage
  const getQCWorksheets = () => {
    try {
      const stored = localStorage.getItem('qcWorksheets');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading QC worksheets:', error);
      return [];
    }
  };

  // Load QC tasks for the selected location (daily, quarterly, and annual)
  const loadDailyQCTasks = () => {
    const worksheets = getQCWorksheets();
    const locationMachines = getMachinesForLocation();
    const tasks = [];

    locationMachines.forEach(machine => {
      // Find daily, quarterly, and annual QC worksheets assigned to this machine
      const dailyWorksheet = worksheets.find(ws => 
        ws.frequency === 'daily' && 
        ws.modality === machine.type &&
        ws.assignedMachines && 
        ws.assignedMachines.includes(machine.machineId)
      );

      const quarterlyWorksheet = worksheets.find(ws => 
        ws.frequency === 'quarterly' && 
        ws.modality === machine.type &&
        ws.assignedMachines && 
        ws.assignedMachines.includes(machine.machineId)
      );

      const annualWorksheet = worksheets.find(ws => 
        ws.frequency === 'annual' && 
        ws.modality === machine.type &&
        ws.assignedMachines && 
        ws.assignedMachines.includes(machine.machineId)
      );

      // Calculate due status (simplified for now)
      const dailyDueStatus = calculateDueStatus('daily');
      const quarterlyDueStatus = calculateDueStatus('quarterly');
      const annualDueStatus = calculateDueStatus('annual');
      
      tasks.push({
        id: machine.machineId,
        machine: machine,
        dailyWorksheet: dailyWorksheet,
        quarterlyWorksheet: quarterlyWorksheet,
        annualWorksheet: annualWorksheet,
        dailyDueStatus: dailyDueStatus,
        quarterlyDueStatus: quarterlyDueStatus,
        annualDueStatus: annualDueStatus,
        priority: dailyDueStatus === 'overdue' ? 'high' : dailyDueStatus === 'due' ? 'medium' : 'low'
      });
    });

    // Sort tasks by priority (overdue first, then due, then current)
    tasks.sort((a, b) => {
      const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    setDailyQCTasks(tasks);
  };

  // Simple due status calculation (in real app would check actual QC records)
  const calculateDueStatus = (frequency) => {
    const random = Math.random();
    if (frequency === 'daily') {
      if (random < 0.2) return 'overdue';
      if (random < 0.5) return 'due';
      return 'current';
    } else if (frequency === 'quarterly') {
      if (random < 0.1) return 'overdue';
      if (random < 0.3) return 'due';
      return 'current';
    } else if (frequency === 'annual') {
      if (random < 0.05) return 'overdue';
      if (random < 0.2) return 'due';
      return 'current';
    }
    return 'current';
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

  const getDueStatusColor = (status) => {
    switch (status) {
      case 'overdue': return 'text-red-500 font-bold';
      case 'due': return 'text-yellow-400 font-medium';
      case 'current': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getDueStatusIcon = (status) => {
    switch (status) {
      case 'overdue': return '🚨';
      case 'due': return '⚠️';
      case 'current': return '✅';
      default: return '⚪';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-4 border-red-500 bg-red-900/20';
      case 'medium': return 'border-l-4 border-yellow-500 bg-yellow-900/20';
      case 'low': return 'border-l-4 border-green-500 bg-green-900/20';
      default: return 'border-l-4 border-gray-500 bg-gray-900/20';
    }
  };

  const handlePerformQC = (task, frequency) => {
    navigate(`/qc/perform/${task.machine.machineId}/${frequency}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading tech dashboard...</div>
      </div>
    );
  }

  const locations = getLocations();
  const locationMachines = getMachinesForLocation();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Tech Dashboard</h1>
          <p className="text-gray-400 mt-1">Daily QC tasks for technologists</p>
        </div>
        <div className="text-sm text-gray-400">
          {dailyQCTasks.length} daily QC task(s) • {locationMachines.length} machine(s)
        </div>
      </div>

      {/* QC Notifications */}
      <QCNotifications showAll={false} />

      {/* Location Selection */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100">Location</h2>
          <div className="text-sm text-gray-400">
            Showing daily, quarterly, and annual QC for selected location
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-300">
            Select Location:
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {locations.map(location => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          <div className="text-sm text-gray-400">
            ({locationMachines.length} machines in {selectedLocation})
          </div>
        </div>
      </div>

      {/* Due Today and Overdue Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Due Today */}
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-yellow-400 flex items-center">
              ⚠️ Due Today
            </h3>
            <span className="text-yellow-300 text-sm font-medium">
              {dailyQCTasks.filter(t => 
                t.dailyDueStatus === 'due' || 
                t.quarterlyDueStatus === 'due' || 
                t.annualDueStatus === 'due'
              ).length} tasks
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dailyQCTasks.filter(t => 
              t.dailyDueStatus === 'due' || 
              t.quarterlyDueStatus === 'due' || 
              t.annualDueStatus === 'due'
            ).map(task => (
              <div key={task.id} className="bg-yellow-800/30 rounded p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-yellow-100">{task.machine.name}</span>
                    <span className="text-yellow-300 ml-2">({task.machine.type})</span>
                  </div>
                  <div className="flex space-x-1">
                    {task.dailyDueStatus === 'due' && (
                      <button
                        onClick={() => handlePerformQC(task, 'daily')}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Perform Daily QC"
                      >
                        Daily QC
                      </button>
                    )}
                    {task.quarterlyDueStatus === 'due' && (
                      <button
                        onClick={() => handlePerformQC(task, 'quarterly')}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        title="Perform Quarterly QC"
                      >
                        Quarterly QC
                      </button>
                    )}
                    {task.annualDueStatus === 'due' && (
                      <button
                        onClick={() => handlePerformQC(task, 'annual')}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Perform Annual QC"
                      >
                        Annual QC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {dailyQCTasks.filter(t => 
              t.dailyDueStatus === 'due' || 
              t.quarterlyDueStatus === 'due' || 
              t.annualDueStatus === 'due'
            ).length === 0 && (
              <div className="text-center py-4 text-yellow-300">
                <span className="text-2xl">✅</span>
                <p className="text-sm mt-1">No QC tasks due today</p>
              </div>
            )}
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-red-400 flex items-center">
              🚨 Overdue
            </h3>
            <span className="text-red-300 text-sm font-medium">
              {dailyQCTasks.filter(t => 
                t.dailyDueStatus === 'overdue' || 
                t.quarterlyDueStatus === 'overdue' || 
                t.annualDueStatus === 'overdue'
              ).length} tasks
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {dailyQCTasks.filter(t => 
              t.dailyDueStatus === 'overdue' || 
              t.quarterlyDueStatus === 'overdue' || 
              t.annualDueStatus === 'overdue'
            ).map(task => (
              <div key={task.id} className="bg-red-800/30 rounded p-2 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-red-100">{task.machine.name}</span>
                    <span className="text-red-300 ml-2">({task.machine.type})</span>
                  </div>
                  <div className="flex space-x-1">
                    {task.dailyDueStatus === 'overdue' && (
                      <button
                        onClick={() => handlePerformQC(task, 'daily')}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Perform Daily QC"
                      >
                        Daily QC
                      </button>
                    )}
                    {task.quarterlyDueStatus === 'overdue' && (
                      <button
                        onClick={() => handlePerformQC(task, 'quarterly')}
                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        title="Perform Quarterly QC"
                      >
                        Quarterly QC
                      </button>
                    )}
                    {task.annualDueStatus === 'overdue' && (
                      <button
                        onClick={() => handlePerformQC(task, 'annual')}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        title="Perform Annual QC"
                      >
                        Annual QC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {dailyQCTasks.filter(t => 
              t.dailyDueStatus === 'overdue' || 
              t.quarterlyDueStatus === 'overdue' || 
              t.annualDueStatus === 'overdue'
            ).length === 0 && (
              <div className="text-center py-4 text-red-300">
                <span className="text-2xl">✅</span>
                <p className="text-sm mt-1">No overdue QC tasks</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QC Tasks Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-100">
              QC Tasks - {selectedLocation}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-green-400">✅ {dailyQCTasks.filter(t => t.dailyDueStatus === 'current' && t.quarterlyDueStatus === 'current' && t.annualDueStatus === 'current').length} Current</span>
                <span className="text-yellow-400">⚠️ {dailyQCTasks.filter(t => t.dailyDueStatus === 'due' || t.quarterlyDueStatus === 'due' || t.annualDueStatus === 'due').length} Due</span>
                <span className="text-red-400">🚨 {dailyQCTasks.filter(t => t.dailyDueStatus === 'overdue' || t.quarterlyDueStatus === 'overdue' || t.annualDueStatus === 'overdue').length} Overdue</span>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {dailyQCTasks.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium mb-2">No QC Tasks</h3>
              <p>No daily, quarterly, or annual QC worksheets are assigned to machines in {selectedLocation}.</p>
              <p className="text-sm mt-2">Contact your supervisor to assign QC worksheets.</p>
            </div>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Daily QC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Quarterly QC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Annual QC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {dailyQCTasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-100">{task.machine.name}</div>
                        <div className="text-sm text-gray-400">{task.machine.type}</div>
                        <div className="text-xs text-gray-500">{task.machine.location.building} - {task.machine.location.room}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.machine.status)}`}>
                        {task.machine.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.dailyWorksheet ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {(task.dailyDueStatus === 'due' || task.dailyDueStatus === 'overdue') && (
                              <button
                                onClick={() => handlePerformQC(task, 'daily')}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Perform QC"
                              >
                                Perform QC
                              </button>
                            )}
                            <input 
                              type="checkbox" 
                              checked={task.dailyDueStatus === 'current'}
                              onChange={() => handlePerformQC(task, 'daily')}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className={`text-sm font-medium ${
                              task.dailyDueStatus === 'current' ? 'text-green-400' : 
                              task.dailyDueStatus === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {task.dailyDueStatus === 'current' ? 'Up to Date' : 
                               task.dailyDueStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                            </span>
                            {task.dailyDueStatus === 'current' && (
                              <button
                                onClick={() => handlePerformQC(task, 'daily')}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                title="Edit QC"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{task.dailyWorksheet.title}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Not assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.quarterlyWorksheet ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {(task.quarterlyDueStatus === 'due' || task.quarterlyDueStatus === 'overdue') && (
                              <button
                                onClick={() => handlePerformQC(task, 'quarterly')}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Perform QC"
                              >
                                Perform QC
                              </button>
                            )}
                            <input 
                              type="checkbox" 
                              checked={task.quarterlyDueStatus === 'current'}
                              onChange={() => handlePerformQC(task, 'quarterly')}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className={`text-sm font-medium ${
                              task.quarterlyDueStatus === 'current' ? 'text-green-400' : 
                              task.quarterlyDueStatus === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {task.quarterlyDueStatus === 'current' ? 'Up to Date' : 
                               task.quarterlyDueStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                            </span>
                            {task.quarterlyDueStatus === 'current' && (
                              <button
                                onClick={() => handlePerformQC(task, 'quarterly')}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                title="Edit QC"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{task.quarterlyWorksheet.title}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Not assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.annualWorksheet ? (
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {(task.annualDueStatus === 'due' || task.annualDueStatus === 'overdue') && (
                              <button
                                onClick={() => handlePerformQC(task, 'annual')}
                                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                title="Perform QC"
                              >
                                Perform QC
                              </button>
                            )}
                            <input 
                              type="checkbox" 
                              checked={task.annualDueStatus === 'current'}
                              onChange={() => handlePerformQC(task, 'annual')}
                              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <span className={`text-sm font-medium ${
                              task.annualDueStatus === 'current' ? 'text-green-400' : 
                              task.annualDueStatus === 'overdue' ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {task.annualDueStatus === 'current' ? 'Up to Date' : 
                               task.annualDueStatus === 'overdue' ? 'Overdue' : 'Due Today'}
                            </span>
                            {task.annualDueStatus === 'current' && (
                              <button
                                onClick={() => handlePerformQC(task, 'annual')}
                                className="text-xs text-gray-400 hover:text-blue-400 transition-colors"
                                title="Edit QC"
                              >
                                ✏️
                              </button>
                            )}
                          </div>
                          <div className="text-xs text-gray-400">{task.annualWorksheet.title}</div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">Not assigned</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col space-y-1">
                        {task.dailyWorksheet && (
                          <button
                            onClick={() => handlePerformQC(task, 'daily')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              task.dailyDueStatus === 'overdue' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : task.dailyDueStatus === 'due'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {task.dailyDueStatus === 'overdue' ? '🚨 Daily' : 
                             task.dailyDueStatus === 'due' ? '⚠️ Daily' : 
                             '✅ Daily'}
                          </button>
                        )}
                        {task.quarterlyWorksheet && (
                          <button
                            onClick={() => handlePerformQC(task, 'quarterly')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              task.quarterlyDueStatus === 'overdue' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : task.quarterlyDueStatus === 'due'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            {task.quarterlyDueStatus === 'overdue' ? '🚨 Quarterly' : 
                             task.quarterlyDueStatus === 'due' ? '⚠️ Quarterly' : 
                             '📊 Quarterly'}
                          </button>
                        )}
                        {task.annualWorksheet && (
                          <button
                            onClick={() => handlePerformQC(task, 'annual')}
                            className={`px-3 py-1 text-xs rounded transition-colors ${
                              task.annualDueStatus === 'overdue' 
                                ? 'bg-red-600 hover:bg-red-700 text-white' 
                                : task.annualDueStatus === 'due'
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                          >
                            {task.annualDueStatus === 'overdue' ? '🚨 Annual' : 
                             task.annualDueStatus === 'due' ? '⚠️ Annual' : 
                             '📅 Annual'}
                          </button>
                        )}
                        <Link
                          to={`/machines/${task.machine.machineId}`}
                          className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-500 transition-colors text-center"
                        >
                          📊 Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TechDashboard;