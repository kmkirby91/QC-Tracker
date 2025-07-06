import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const QCTestDetail = () => {
  const { machineId, date } = useParams();
  const [machine, setMachine] = useState(null);
  const [qcData, setQCData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQCData();
  }, [machineId, date]);

  const fetchQCData = async () => {
    try {
      setLoading(true);
      const [machineRes, qcRes] = await Promise.all([
        axios.get(`/api/machines/${machineId}`),
        axios.get(`/api/qc/machines/${machineId}/qc-history/${date}?type=${machineId.includes('MRI') ? 'MRI' : machineId.includes('CT') ? 'CT' : 'PET-CT'}`)
      ]);
      
      setMachine(machineRes.data);
      setQCData(qcRes.data);
    } catch (err) {
      setError('Failed to load QC data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResultColor = (result) => {
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

  const getResultBadge = (result) => {
    const colors = {
      pass: 'bg-green-900 text-green-200 border-green-700',
      fail: 'bg-red-900 text-red-200 border-red-700',
      conditional: 'bg-yellow-900 text-yellow-200 border-yellow-700'
    };
    return `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors[result] || 'bg-gray-900 text-gray-200 border-gray-700'}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading QC details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to={`/machines/${machineId}`} className="text-blue-400 hover:underline text-sm">
            ← Back to {machineId}
          </Link>
        </div>
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!qcData || !qcData.daily) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to={`/machines/${machineId}`} className="text-blue-400 hover:underline text-sm">
            ← Back to {machineId}
          </Link>
        </div>
        <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-yellow-200">
          No QC data found for {formatDate(date)}
        </div>
      </div>
    );
  }

  const dailyQC = qcData.daily;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/machines/${machineId}`} className="text-blue-400 hover:underline text-sm">
          ← Back to {machine?.name || machineId}
        </Link>
      </div>

      {/* Header */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Daily QC Report</h1>
            <p className="text-gray-400">{machine?.name} ({machineId})</p>
            <p className="text-sm text-gray-400">{formatDate(date)}</p>
          </div>
          <span className={getResultBadge(dailyQC.overallResult)}>
            {dailyQC.overallResult.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Completed At:</span>
            <p className="font-medium">{formatTime(dailyQC.completedAt)}</p>
          </div>
          <div>
            <span className="text-gray-400">Total Tests:</span>
            <p className="font-medium">{dailyQC.tests.length}</p>
          </div>
          <div>
            <span className="text-gray-400">Tests Passed:</span>
            <p className="font-medium text-green-400">
              {dailyQC.tests.filter(t => t.result === 'pass').length}/{dailyQC.tests.length}
            </p>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Test Results</h2>
        
        <div className="space-y-4">
          {dailyQC.tests.map((test, index) => (
            <div key={index} className="border border-gray-700 rounded-lg p-4 hover:bg-gray-900 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-100">{test.testName}</h3>
                    <span className={`text-sm font-medium ${getResultColor(test.result)}`}>
                      {test.result === 'pass' ? '✓ PASS' : test.result === 'fail' ? '✗ FAIL' : '! CONDITIONAL'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    {test.value && (
                      <div>
                        <span className="text-gray-400">Measured Value:</span>
                        <p className="font-medium">{test.value}</p>
                      </div>
                    )}
                    
                    {test.tolerance && (
                      <div>
                        <span className="text-gray-400">Tolerance:</span>
                        <p className="font-medium">{test.tolerance}</p>
                      </div>
                    )}
                    
                    <div>
                      <span className="text-gray-400">Performed By:</span>
                      <p className="font-medium">{test.performedBy}</p>
                    </div>
                  </div>
                  
                  {test.notes && (
                    <div className="mt-3 p-3 bg-blue-900 rounded border-l-4 border-blue-400">
                      <p className="text-sm text-blue-200">
                        <span className="font-medium">Notes:</span> {test.notes}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className={`ml-4 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                  test.result === 'pass' ? 'bg-green-500' : 
                  test.result === 'fail' ? 'bg-red-500' : 'bg-yellow-500'
                }`}>
                  {test.result === 'pass' ? '✓' : test.result === 'fail' ? '✗' : '!'}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-900 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  ✓
                </div>
                <div>
                  <p className="text-sm text-gray-400">Passed</p>
                  <p className="text-2xl font-bold text-green-400">
                    {dailyQC.tests.filter(t => t.result === 'pass').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-red-900 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  ✗
                </div>
                <div>
                  <p className="text-sm text-gray-400">Failed</p>
                  <p className="text-2xl font-bold text-red-400">
                    {dailyQC.tests.filter(t => t.result === 'fail').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-900 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                  !
                </div>
                <div>
                  <p className="text-sm text-gray-400">Conditional</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {dailyQC.tests.filter(t => t.result === 'conditional').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QCTestDetail;