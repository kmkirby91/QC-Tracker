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
  const [activeTab, setActiveTab] = useState('daily');
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
    } catch (error) {
      console.error('Error fetching machine data:', error);
    } finally {
      setLoading(false);
    }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="flex justify-between">
                <dt className="text-gray-400">Daily QC:</dt>
                <dd className="font-medium">{machine.qcSchedule.daily ? 'Required' : 'Not Required'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Weekly QC:</dt>
                <dd className="font-medium">{machine.qcSchedule.weekly ? 'Required' : 'Not Required'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Monthly QC:</dt>
                <dd className="font-medium">{machine.qcSchedule.monthly ? 'Required' : 'Not Required'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">Next QC Due:</dt>
                <dd className="font-medium text-blue-400">{new Date(machine.nextQCDue).toLocaleDateString()}</dd>
              </div>
            </dl>
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
              <button
                onClick={() => setActiveTab('daily')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'daily'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Daily QC
              </button>
              <button
                onClick={() => setActiveTab('monthly')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'monthly'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                Monthly QC
              </button>
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