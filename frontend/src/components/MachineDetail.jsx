import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import QCHistory from './QCHistory';
import QCCalendar from './QCCalendar';
import QCStatusDashboard from './QCStatusDashboard';
import QCReportWidget from './QCReportWidget';

const MachineDetail = () => {
  const { machineId } = useParams();
  const [machine, setMachine] = useState(null);
  const [qcHistory, setQCHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null);
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' or 'history'

  useEffect(() => {
    fetchMachineData();
  }, [machineId]);

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
  
  const getQCTabs = () => {
    if (!machine) return [];
    const tabs = [];
    const schedule = machine.qcSchedule;
    
    if (schedule.daily) tabs.push({ key: 'daily', label: 'Daily QC' });
    if (schedule.weekly) tabs.push({ key: 'weekly', label: 'Weekly QC' });
    if (schedule.monthly) tabs.push({ key: 'monthly', label: 'Monthly QC' });
    if (schedule.quarterly) tabs.push({ key: 'quarterly', label: 'Quarterly QC' });
    if (schedule.annual) tabs.push({ key: 'annual', label: 'Annual QC' });
    
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
      <div className="mb-6">
        <Link to="/" className="text-blue-400 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <h3 className="font-semibold text-gray-300 mb-2">QC Schedule</h3>
            <dl className="space-y-1 text-sm">
              {machine.qcSchedule.daily && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Daily QC:</dt>
                  <dd className="font-medium text-green-400">Required</dd>
                </div>
              )}
              {machine.qcSchedule.weekly && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Weekly QC:</dt>
                  <dd className="font-medium text-green-400">Required</dd>
                </div>
              )}
              {machine.qcSchedule.monthly && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Monthly QC:</dt>
                  <dd className="font-medium text-green-400">Required</dd>
                </div>
              )}
              {machine.qcSchedule.quarterly && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Quarterly QC:</dt>
                  <dd className="font-medium text-green-400">Required</dd>
                </div>
              )}
              {machine.qcSchedule.annual && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">Annual QC:</dt>
                  <dd className="font-medium text-green-400">Required</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-700 pt-1 mt-2">
                <dt className="text-gray-400">Next QC Due:</dt>
                <dd className="font-medium text-blue-400">{new Date(machine.nextQCDue).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="font-semibold text-gray-300 mb-2">Perform QC</h3>
            <div className="space-y-2">
              {machine.qcSchedule.daily && (
                <Link
                  to={`/qc/perform/${machine.machineId}/daily`}
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Daily QC
                </Link>
              )}
              {machine.qcSchedule.weekly && (
                <Link
                  to={`/qc/perform/${machine.machineId}/weekly`}
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Weekly QC
                </Link>
              )}
              {machine.qcSchedule.monthly && (
                <Link
                  to={`/qc/perform/${machine.machineId}/monthly`}
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-yellow-600 hover:bg-yellow-700 rounded-md transition-colors"
                >
                  Monthly QC
                </Link>
              )}
              {machine.qcSchedule.quarterly && (
                <Link
                  to={`/qc/perform/${machine.machineId}/quarterly`}
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
                >
                  Quarterly QC
                </Link>
              )}
              {machine.qcSchedule.annual && (
                <Link
                  to={`/qc/perform/${machine.machineId}/annual`}
                  className="block w-full px-3 py-2 text-sm font-medium text-center text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  Annual QC
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QC Status Dashboard */}
      {qcHistory && (
        <QCStatusDashboard machine={machine} qcHistory={qcHistory} />
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