import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ACRStatus = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/machines');
      // Filter for machines that require ACR accreditation
      const acrMachines = response.data.filter(machine => 
        machine.type === 'MRI' || machine.type === 'CT' || machine.type === 'Mammography'
      );
      setMachines(acrMachines);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateACRStatus = (machine) => {
    // Using mock data for now - in real implementation, this would come from machine.acrAccreditation
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
    let bgColor = 'bg-green-900/20';
    let borderColor = 'border-green-600';
    
    if (daysToDue < 0) {
      statusColor = 'text-red-400';
      statusText = 'EXPIRED';
      statusIcon = '❌';
      bgColor = 'bg-red-900/20';
      borderColor = 'border-red-600';
    } else if (daysToBug < 0) {
      statusColor = 'text-yellow-400';
      statusText = 'Renewal Required';
      statusIcon = '⚠️';
      bgColor = 'bg-yellow-900/20';
      borderColor = 'border-yellow-600';
    } else if (daysToBug <= 30) {
      statusColor = 'text-orange-400';
      statusText = 'Renewal Approaching';
      statusIcon = '🔔';
      bgColor = 'bg-orange-900/20';
      borderColor = 'border-orange-600';
    }
    
    return {
      grantedDate: mockGrantedDate,
      dueDate,
      bugDate,
      daysToDue,
      daysToBug,
      statusColor,
      statusText,
      statusIcon,
      bgColor,
      borderColor
    };
  };

  const getUrgencyLevel = (status) => {
    if (status.daysToDue < 0) return 1; // Expired - highest priority
    if (status.daysToBug < 0) return 2; // Renewal required
    if (status.daysToBug <= 30) return 3; // Renewal approaching
    if (status.daysToBug <= 90) return 4; // Should start planning
    return 5; // Current - lowest priority
  };

  // Sort machines by urgency (expired first, then by days until action needed)
  const sortedMachines = machines
    .map(machine => ({ ...machine, acrStatus: calculateACRStatus(machine) }))
    .sort((a, b) => {
      const urgencyA = getUrgencyLevel(a.acrStatus);
      const urgencyB = getUrgencyLevel(b.acrStatus);
      
      if (urgencyA !== urgencyB) {
        return urgencyA - urgencyB; // Lower urgency number = higher priority
      }
      
      // Within same urgency level, sort by days (most urgent first)
      if (a.acrStatus.daysToDue < 0 && b.acrStatus.daysToDue < 0) {
        return a.acrStatus.daysToDue - b.acrStatus.daysToDue; // Most expired first
      }
      
      return a.acrStatus.daysToBug - b.acrStatus.daysToBug; // Closest to action date first
    });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-400">Loading ACR status...</div>
        </div>
      </div>
    );
  }

  if (machines.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-100">ACR Accreditation Status</h1>
          <p className="text-gray-400">Monitor ACR accreditation status for all imaging equipment</p>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">No ACR-Required Machines Found</h3>
            <p className="text-gray-400">No CT, MRI, or Mammography machines requiring ACR accreditation were found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">ACR Accreditation Status</h1>
        <p className="text-gray-400">Monitor ACR accreditation status for all imaging equipment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {(() => {
          const expired = sortedMachines.filter(m => m.acrStatus.daysToDue < 0).length;
          const renewalRequired = sortedMachines.filter(m => m.acrStatus.daysToBug < 0 && m.acrStatus.daysToDue >= 0).length;
          const renewalApproaching = sortedMachines.filter(m => m.acrStatus.daysToBug <= 30 && m.acrStatus.daysToBug >= 0).length;
          const current = sortedMachines.filter(m => m.acrStatus.daysToBug > 30).length;
          
          return (
            <>
              <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                <div className="text-sm text-red-400">Expired</div>
                <div className="text-2xl font-bold text-red-400">{expired}</div>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <div className="text-sm text-yellow-400">Renewal Required</div>
                <div className="text-2xl font-bold text-yellow-400">{renewalRequired}</div>
              </div>
              <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4">
                <div className="text-sm text-orange-400">Renewal Approaching</div>
                <div className="text-2xl font-bold text-orange-400">{renewalApproaching}</div>
              </div>
              <div className="bg-green-900/20 border border-green-600 rounded-lg p-4">
                <div className="text-sm text-green-400">Current</div>
                <div className="text-2xl font-bold text-green-400">{current}</div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Machines Table */}
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-gray-100">All Machines - ACR Status</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Machine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Granted Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ACR Notification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedMachines.map((machine) => {
                const status = machine.acrStatus;
                return (
                  <tr key={machine.machineId} className={`${status.bgColor} border-l-4 ${status.borderColor}`}>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-100">{machine.name}</div>
                        <div className="text-sm text-gray-400">{machine.machineId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{machine.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-300">
                        {machine.location.building} - Floor {machine.location.floor}
                      </div>
                      <div className="text-sm text-gray-400">{machine.location.room}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{status.statusIcon}</span>
                        <span className={`font-medium ${status.statusColor}`}>{status.statusText}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{status.grantedDate.toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-300">{status.dueDate.toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-orange-300">{status.bugDate.toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {status.daysToDue >= 0 ? (
                          <div className="text-gray-300">
                            <span className="font-medium">{status.daysToDue}</span> days until due
                          </div>
                        ) : (
                          <div className="text-red-400">
                            <span className="font-medium">Expired {Math.abs(status.daysToDue)}</span> days ago
                          </div>
                        )}
                        
                        {status.daysToBug > 0 && status.daysToBug <= 60 && (
                          <div className="text-orange-400 text-xs mt-1">
                            ACR notifies in <span className="font-medium">{status.daysToBug}</span> days
                          </div>
                        )}
                        
                        {status.daysToBug <= 0 && status.daysToDue > 0 && (
                          <div className="text-yellow-400 text-xs mt-1">
                            ⚠️ Renewal period active
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 bg-gray-800 rounded-lg shadow-lg p-4">
        <h3 className="text-lg font-semibold text-gray-100 mb-3">ACR Accreditation Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Status Definitions:</h4>
            <div className="space-y-1">
              <div className="flex items-center">
                <span className="text-green-400 mr-2">✅ Current:</span>
                <span className="text-gray-400">More than 8 months until renewal notification</span>
              </div>
              <div className="flex items-center">
                <span className="text-orange-400 mr-2">🔔 Renewal Approaching:</span>
                <span className="text-gray-400">Within 30 days of ACR notification</span>
              </div>
              <div className="flex items-center">
                <span className="text-yellow-400 mr-2">⚠️ Renewal Required:</span>
                <span className="text-gray-400">ACR has sent renewal notification</span>
              </div>
              <div className="flex items-center">
                <span className="text-red-400 mr-2">❌ Expired:</span>
                <span className="text-gray-400">Accreditation has expired</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-300 mb-2">Important Notes:</h4>
            <div className="space-y-1 text-gray-400">
              <div>• ACR accreditations are valid for 3 years</div>
              <div>• ACR sends renewal notifications 8 months before expiration</div>
              <div>• Renewal applications should be submitted promptly</div>
              <div>• Equipment cannot be used clinically if accreditation expires</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACRStatus;