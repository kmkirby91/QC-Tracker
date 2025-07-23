import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import QCHistory from './QCHistory';
import QCCalendar from './QCCalendar';
import QCStatusDashboard from './QCStatusDashboard';
import QCReportWidget from './QCReportWidget';
import QCScheduleStatus from './QCScheduleStatus';
import { ensureSampleWorksheets, reinitializeSampleWorksheets } from '../utils/initializeSampleWorksheets';

const MachineDetail = () => {
  const { machineId } = useParams();
  const [machine, setMachine] = useState(null);
  const [qcHistory, setQCHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'history'
  const [customWorksheets, setCustomWorksheets] = useState([]);

  useEffect(() => {
    fetchMachineData();
    loadCustomWorksheets();
    // Initialize sample worksheets if they don't exist
    ensureSampleWorksheets();
  }, [machineId]);

  // Listen for localStorage changes to update custom worksheets
  useEffect(() => {
    const handleStorageChange = () => {
      loadCustomWorksheets();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for QC completion to refresh status (but don't refetch API data)
  useEffect(() => {
    const checkQCRefresh = () => {
      const refreshFlag = localStorage.getItem('qcStatusRefresh');
      if (refreshFlag) {
        // Remove the flag
        localStorage.removeItem('qcStatusRefresh');
        console.log('QC completion detected, status dashboard will auto-refresh from localStorage');
        
        // Don't refetch API data since localStorage completions take precedence
        // The QCStatusDashboard component will automatically refresh via its own useEffect
      }
    };

    // Check immediately when component mounts/updates
    checkQCRefresh();

    // Also listen for storage events (in case of multiple tabs)
    const handleQCRefresh = () => checkQCRefresh();
    window.addEventListener('storage', handleQCRefresh);
    
    return () => window.removeEventListener('storage', handleQCRefresh);
  }, [machine]);

  const fetchMachineData = async () => {
    try {
      setLoading(true);
      const machineRes = await axios.get(`/api/machines/${machineId}`);
      setMachine(machineRes.data);
      
      const qcRes = await axios.get(`/api/qc/machines/${machineId}/qc-history?type=${machineRes.data.type}`);
      setQCHistory(qcRes.data);
      
      // Set the first available QC frequency as the default active tab
      const schedule = machineRes.data.qcSchedule;
      if (schedule.daily) setActiveTab('daily');
      else if (schedule.weekly) setActiveTab('weekly');
      else if (schedule.monthly) setActiveTab('monthly');
      else if (schedule.quarterly) setActiveTab('quarterly');
      else if (schedule.annual) setActiveTab('annual');
    } catch (error) {
      console.error('Error fetching machine data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const getWorksheetNamesForFrequency = (machine, frequency) => {
    const worksheets = [];
    
    // Only look for actual worksheets assigned to this machine (NOT templates)
    const assignedWorksheets = customWorksheets.filter(ws => 
      ws.modality === machine.type && 
      ws.frequency === frequency && 
      ws.assignedMachines && 
      ws.assignedMachines.includes(machine.machineId) &&
      ws.isWorksheet === true // Only actual worksheets, not templates
    );
    
    if (assignedWorksheets.length > 0) {
      worksheets.push(...assignedWorksheets);
    } else {
      // If no worksheets are assigned, show that templates are available to create worksheets
      const modalityTemplates = JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]');
      const availableTemplates = modalityTemplates.filter(template => 
        template.modality === machine.type && template.frequency === frequency
      );
      
      if (availableTemplates.length > 0) {
        worksheets.push({
          id: `no-worksheet-${frequency}`,
          title: `No worksheet assigned (${availableTemplates.length} template${availableTemplates.length > 1 ? 's' : ''} available)`,
          needsWorksheet: true,
          availableTemplates: availableTemplates.length
        });
      } else if (machine.qcSchedule && machine.qcSchedule[frequency]) {
        // Show that this frequency is scheduled but no worksheet exists
        worksheets.push({
          id: `no-worksheet-${frequency}`,
          title: `No worksheet assigned (QC scheduled)`,
          needsWorksheet: true,
          availableTemplates: 0
        });
      }
    }
    
    return worksheets;
  };
  
  const getAssignedFrequencies = (machine) => {
    // Return frequencies where the machine has custom worksheets assigned OR has a QC schedule
    const assignedFrequencies = [];
    if (machine) {
      ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on-demand'].forEach(frequency => {
        // Check for custom worksheets first
        const hasCustomWorksheet = customWorksheets.some(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency && 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machine.machineId)
        );
        
        // Fall back to machine's built-in QC schedule
        const hasScheduledQC = machine.qcSchedule && machine.qcSchedule[frequency];
        
        if (hasCustomWorksheet || hasScheduledQC) {
          assignedFrequencies.push(frequency);
        }
      });
    }
    return assignedFrequencies;
  };

  const getWorksheetAssignedFrequencies = (machine) => {
    // Return ONLY frequencies where the machine has actual worksheets assigned
    // No worksheet = no QC can be performed
    const worksheetFrequencies = [];
    if (machine) {
      ['daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on-demand'].forEach(frequency => {
        const hasWorksheet = customWorksheets.some(ws => 
          ws.modality === machine.type && 
          ws.frequency === frequency && 
          ws.assignedMachines && 
          ws.assignedMachines.includes(machine.machineId) &&
          ws.isWorksheet === true // Only actual worksheets
        );
        
        if (hasWorksheet) {
          worksheetFrequencies.push(frequency);
        }
      });
    }
    return worksheetFrequencies;
  };

  const getQCTabs = () => {
    if (!machine) return [];
    const tabs = [];
    const assignedFrequencies = getAssignedFrequencies(machine);
    
    if (assignedFrequencies.includes('daily')) tabs.push({ key: 'daily', label: 'Daily QC' });
    if (assignedFrequencies.includes('weekly')) tabs.push({ key: 'weekly', label: 'Weekly QC' });
    if (assignedFrequencies.includes('monthly')) tabs.push({ key: 'monthly', label: 'Monthly QC' });
    if (assignedFrequencies.includes('quarterly')) tabs.push({ key: 'quarterly', label: 'Quarterly QC' });
    if (assignedFrequencies.includes('annual')) tabs.push({ key: 'annual', label: 'Annual QC' });
    
    return tabs;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machine details...</div>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Machine not found</p>
        <Link to="/" className="text-blue-400 hover:underline mt-4 inline-block">
          Back to Dashboard
        </Link>
      </div>
    );
  }

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

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
        
        {/* Temporary testing button */}
        {machine?.machineId === 'CT-GON-001' && (
          <div className="flex space-x-2">
            <button
              onClick={() => {
                reinitializeSampleWorksheets();
                window.location.reload();
              }}
              className="px-3 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
              title="Reinitialize with multiple daily QCs for testing"
            >
              🔄 Test Multiple QCs
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('qcCompletions');
                window.location.reload();
              }}
              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
              title="Clear all QC completions to reset status"
            >
              🗑️ Clear Completions
            </button>
          </div>
        )}
      </div>

      {/* Machine Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{machine.name}</h1>
            <p className="text-gray-400">{machine.machineId}</p>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(machine.status)}`}>
            {machine.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Equipment Details</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Type:</dt>
                <dd className="font-medium">{machine.type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Manufacturer:</dt>
                <dd className="font-medium">{machine.manufacturer}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Model:</dt>
                <dd className="font-medium">{machine.model}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Serial Number:</dt>
                <dd className="font-medium">{machine.serialNumber}</dd>
              </div>
              {(machine.type === 'MRI' || machine.type === 'CT' || machine.type === 'Mammography') && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">ACR Status:</dt>
                  <dd className="font-medium">
                    {(() => {
                      // Calculate ACR status - using mock data for now
                      const mockGrantedDate = new Date('2022-03-15');
                      const dueDate = new Date(mockGrantedDate);
                      dueDate.setFullYear(dueDate.getFullYear() + 3);
                      const today = new Date();
                      const daysToDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                      
                      if (daysToDue < 0) return <span className="text-red-400">EXPIRED</span>;
                      else if (daysToDue <= 30) return <span className="text-orange-400">RENEWAL</span>;
                      else return <span className="text-green-400">CURRENT</span>;
                    })()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Location</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Building:</dt>
                <dd className="font-medium">{machine.location.building}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Floor:</dt>
                <dd className="font-medium">{machine.location.floor}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Room:</dt>
                <dd className="font-medium">{machine.location.room}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Installed:</dt>
                <dd className="font-medium">{new Date(machine.installationDate).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Last QC</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Date:</dt>
                <dd className="font-medium">{machine.lastQC?.date ? new Date(machine.lastQC.date).toLocaleDateString() : 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Result:</dt>
                <dd className={`font-medium ${machine.lastQC?.result === 'pass' ? 'text-green-400' : machine.lastQC?.result === 'fail' ? 'text-red-400' : 'text-gray-400'}`}>
                  {machine.lastQC?.result ? machine.lastQC.result.toUpperCase() : 'N/A'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Performed By:</dt>
                <dd className="font-medium">{machine.lastQC?.performedBy || 'N/A'}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-gray-400">Notes:</dt>
                <dd className="font-medium text-xs mt-1">{machine.lastQC?.notes || 'N/A'}</dd>
              </div>
            </dl>
          </div>


          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Perform QC</h3>
            <div className="space-y-1">
              {/* Get all assigned worksheets and create individual buttons */}
              {customWorksheets
                .filter(ws => 
                  ws.modality === machine.type && 
                  ws.assignedMachines && 
                  ws.assignedMachines.includes(machine.machineId) &&
                  ws.isWorksheet === true
                )
                .sort((a, b) => {
                  // Sort by frequency priority: daily, weekly, monthly, quarterly, annual, on-demand
                  const order = { daily: 0, weekly: 1, monthly: 2, quarterly: 3, annual: 4, 'on-demand': 5 };
                  return (order[a.frequency] || 5) - (order[b.frequency] || 5);
                })
                .map((worksheet) => {
                  const frequencyColors = {
                    daily: 'bg-blue-600 hover:bg-blue-700',
                    weekly: 'bg-green-600 hover:bg-green-700', 
                    monthly: 'bg-yellow-600 hover:bg-yellow-700',
                    quarterly: 'bg-purple-600 hover:bg-purple-700',
                    annual: 'bg-red-600 hover:bg-red-700',
                    'on-demand': 'bg-gray-600 hover:bg-gray-700'
                  };
                  
                  return (
                    <Link
                      key={worksheet.id}
                      to={`/qc/perform/${machine.machineId}/${worksheet.frequency}/${worksheet.id}`}
                      className={`block w-full px-2 py-1 text-xs font-medium text-center text-white rounded transition-colors ${frequencyColors[worksheet.frequency] || 'bg-gray-600 hover:bg-gray-700'}`}
                    >
                      ▶️ {worksheet.title}
                    </Link>
                  );
                })}
              
              {/* Show message when no worksheets are assigned */}
              {customWorksheets.filter(ws => 
                ws.modality === machine.type && 
                ws.assignedMachines && 
                ws.assignedMachines.includes(machine.machineId) &&
                ws.isWorksheet === true
              ).length === 0 && (
                <div className="text-center py-4">
                  <div className="text-sm text-gray-400 mb-2">No QC worksheets assigned</div>
                  <Link
                    to="/worksheets"
                    className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-500 transition-colors"
                  >
                    📋 Create Worksheets
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Today's QC Dashboard */}
      {qcHistory && (
        <QCStatusDashboard machine={machine} qcHistory={qcHistory} />
      )}

      {/* QC Schedule Status */}
      {machine && (
        <QCScheduleStatus 
          machine={machine} 
          worksheets={customWorksheets.filter(ws => 
            ws.modality === machine.type && 
            ws.assignedMachines && 
            ws.assignedMachines.includes(machine.machineId) &&
            ws.isWorksheet === true
          )} 
          compact={true}
        />
      )}

      {/* Assigned QC Worksheets */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-4">Assigned QC Worksheets</h2>
        
        {getWorksheetAssignedFrequencies(machine).length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No QC worksheets assigned</h3>
            <p className="text-gray-400 mb-4">Create and assign worksheets to enable QC tracking for this machine.</p>
            <Link
              to="/worksheets"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Worksheets
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {getAssignedFrequencies(machine).map(frequency => {
              const worksheets = getWorksheetNamesForFrequency(machine, frequency);
              const hasWorksheet = worksheets.some(ws => !ws.needsWorksheet);
              const frequencyColors = {
                daily: 'text-blue-400',
                weekly: 'text-green-400', 
                monthly: 'text-yellow-400',
                quarterly: 'text-purple-400',
                annual: 'text-red-400',
                'on-demand': 'text-gray-400'
              };
              
              if (!hasWorksheet) return null; // Skip frequencies without actual worksheets
              
              // Get all worksheets for this frequency
              const frequencyWorksheets = customWorksheets.filter(ws => 
                ws.modality === machine.type && 
                ws.frequency === frequency && 
                ws.assignedMachines && 
                ws.assignedMachines.includes(machine.machineId) &&
                ws.isWorksheet === true
              );
              
              if (frequencyWorksheets.length === 0) return null; // No worksheets found
              
              return (
                <div key={frequency} className="border border-gray-600 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${frequencyColors[frequency]} mb-1`}>
                        {frequency.charAt(0).toUpperCase() + frequency.slice(1)} QC
                      </h3>
                      
                      {/* Get all worksheets for this frequency */}
                      {customWorksheets.filter(ws => 
                        ws.modality === machine.type && 
                        ws.frequency === frequency && 
                        ws.assignedMachines && 
                        ws.assignedMachines.includes(machine.machineId) &&
                        ws.isWorksheet === true
                      ).map(worksheetData => {
                        const isModified = worksheetData && (
                          worksheetData.isModified || 
                          (worksheetData.modifications && worksheetData.modifications.length > 0) ||
                          (worksheetData.customizations && worksheetData.customizations.length > 0)
                        );
                        
                        return (
                          <div key={worksheetData.id} className="mb-3 p-3 bg-gray-700 rounded border-l-4 border-blue-500">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-200">{worksheetData.title}</p>
                                {worksheetData && (worksheetData.templateSource || worksheetData.sourceTemplateName) && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {isModified ? (
                                      <span className="text-amber-400">🔧 Modified</span>
                                    ) : (
                                      <span className="text-green-400">✓ Unmodified</span>
                                    )}
                                    {worksheetData.templateSource && (
                                      <span className="ml-2 text-gray-500">• From: {worksheetData.templateSource}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex space-x-2">
                                <Link
                                  to={`/worksheets?editWorksheet=${worksheetData.id}&viewOnly=true`}
                                  className="px-3 py-1 bg-gray-600 text-white text-xs rounded-md hover:bg-gray-500 transition-colors"
                                >
                                  👁️ View
                                </Link>
                                
                                <Link
                                  to={`/worksheets?editWorksheet=${worksheetData.id}`}
                                  className="px-3 py-1 bg-yellow-600 text-white text-xs rounded-md hover:bg-yellow-700 transition-colors"
                                >
                                  ✏️ Edit
                                </Link>
                                
                                <Link
                                  to={`/qc/perform/${machine.machineId}/${frequency}/${worksheetData.id}`}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  ▶️ Perform
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ACR Accreditation Status */}
      {(machine.type === 'MRI' || machine.type === 'CT' || machine.type === 'Mammography') && (
        <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-100 mb-3 flex items-center">
            <span className="text-lg mr-2">🏆</span>
            ACR Accreditation Status
          </h2>
          
          {(() => {
            // Calculate ACR dates - using mock data for now
            // In real implementation, this would come from machine.acrAccreditation
            const mockGrantedDate = new Date('2022-03-15'); // Mock ACR granted date
            const dueDate = new Date(mockGrantedDate);
            dueDate.setFullYear(dueDate.getFullYear() + 3); // 3 years from granted date
            
            const bugDate = new Date(dueDate);
            bugDate.setMonth(bugDate.getMonth() - 8); // 8 months before due date
            
            const today = new Date();
            const daysToDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
            const daysToBug = Math.ceil((bugDate - today) / (1000 * 60 * 60 * 24));
            
            // Determine status and color
            let statusColor = 'text-green-400';
            let statusText = 'Current';
            let statusIcon = '✅';
            
            if (daysToDue < 0) {
              statusColor = 'text-red-400';
              statusText = 'EXPIRED';
              statusIcon = '❌';
            } else if (daysToBug < 0) {
              statusColor = 'text-yellow-400';
              statusText = 'Renewal Required';
              statusIcon = '⚠️';
            } else if (daysToBug <= 30) {
              statusColor = 'text-orange-400';
              statusText = 'Renewal Approaching';
              statusIcon = '🔔';
            }
            
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-300 mb-1 text-xs">DATES</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Granted:</span>
                      <span className="font-medium">{mockGrantedDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Due:</span>
                      <span className="font-medium">{dueDate.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ACR notifies:</span>
                      <span className="font-medium text-orange-300">{bugDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-300 mb-1 text-xs">STATUS</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{statusIcon}</span>
                    <span className={`font-medium ${statusColor}`}>{statusText}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-300 mb-1 text-xs">TIMELINE</h3>
                  <div className="space-y-1">
                    {daysToDue >= 0 && (
                      <div className="text-gray-400">
                        <span className="font-medium text-gray-300">{daysToDue}</span> days until due
                      </div>
                    )}
                    
                    {daysToDue < 0 && (
                      <div className="text-red-400">
                        <span className="font-medium">Expired {Math.abs(daysToDue)}</span> days ago
                      </div>
                    )}
                    
                    {daysToBug > 0 && daysToBug <= 60 && (
                      <div className="text-orange-400 text-xs">
                        ACR notifies in <span className="font-medium">{daysToBug}</span> days
                      </div>
                    )}
                    
                    {daysToBug <= 0 && daysToDue > 0 && (
                      <div className="text-yellow-400 text-xs">
                        ⚠️ Renewal period active
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* QC Report Widget */}
      <QCReportWidget machine={machine} />

      {/* QC Section */}
      <div className="bg-gray-800 rounded-lg shadow-lg">
        <div className="border-b border-gray-700">
          <div className="flex justify-between items-center">
            <nav className="flex -mb-px">
              {getQCTabs().map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            <div className="flex mr-6 bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-gray-800 text-gray-100 shadow'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  viewMode === 'history'
                    ? 'bg-gray-800 text-gray-100 shadow'
                    : 'text-gray-400 hover:text-gray-100'
                }`}
              >
                History
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {qcHistory && (
            <>
              {viewMode === 'calendar' ? (
                <QCCalendar 
                  qcHistory={qcHistory[activeTab]} 
                  type={activeTab}
                />
              ) : (
                <QCHistory 
                  history={qcHistory[activeTab]} 
                  type={activeTab}
                  machineType={machine.type}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MachineDetail;