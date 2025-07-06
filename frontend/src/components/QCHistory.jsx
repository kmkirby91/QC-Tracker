import React, { useState } from 'react';

const QCHistory = ({ history, type, machineType }) => {
  const [expandedDate, setExpandedDate] = useState(null);

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
      pass: 'bg-green-900 text-green-200',
      fail: 'bg-red-900 text-red-200',
      conditional: 'bg-yellow-900 text-yellow-200'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[result] || 'bg-gray-900 text-gray-200'}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (type === 'daily') {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric'
      });
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true
    });
  };

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No {type} QC history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-4">
          <p className="text-sm text-gray-400">Total {type === 'daily' ? 'Daily' : 'Monthly'} QCs</p>
          <p className="text-2xl font-bold text-gray-100">{history.length}</p>
        </div>
        <div className="bg-green-900 rounded-lg p-4">
          <p className="text-sm text-gray-400">Passed</p>
          <p className="text-2xl font-bold text-green-400">
            {history.filter(h => h.overallResult === 'pass').length}
          </p>
        </div>
        <div className="bg-red-900 rounded-lg p-4">
          <p className="text-sm text-gray-400">Failed/Conditional</p>
          <p className="text-2xl font-bold text-red-400">
            {history.filter(h => h.overallResult !== 'pass').length}
          </p>
        </div>
      </div>

      {/* QC History List */}
      <div className="space-y-2">
        {history.map((qc, index) => (
          <div key={qc.date} className="border border-gray-700 rounded-lg">
            <div
              className="flex items-center justify-between p-4 hover:bg-gray-900 cursor-pointer"
              onClick={() => setExpandedDate(expandedDate === qc.date ? null : qc.date)}
            >
              <div className="flex items-center space-x-4">
                <div>
                  <p className="font-medium text-gray-100">{formatDate(qc.date)}</p>
                  <p className="text-sm text-gray-400">
                    Completed at {formatTime(qc.completedAt)}
                  </p>
                </div>
                <span className={getResultBadge(qc.overallResult)}>
                  {qc.overallResult.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-400">
                  {qc.tests.filter(t => t.result === 'pass').length}/{qc.tests.length} tests passed
                </span>
                {type === 'monthly' && qc.reportUrl && (
                  <a
                    href={qc.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline text-sm flex items-center bg-blue-900 px-2 py-1 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF Report
                  </a>
                )}
                <svg
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${
                    expandedDate === qc.date ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {expandedDate === qc.date && (
              <div className="border-t border-gray-700 bg-gray-900 p-4">
                <div className="space-y-3">
                  {qc.tests.map((test, testIndex) => (
                    <div key={testIndex} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-100">{test.testName}</h4>
                            <span className={`text-sm ${getResultColor(test.result)}`}>
                              {test.result === 'pass' ? '✓' : test.result === 'fail' ? '✗' : '!'}
                            </span>
                          </div>
                          <div className="mt-1 text-sm text-gray-400 space-y-1">
                            {test.value && (
                              <p>
                                Value: <span className="font-medium">{test.value}</span>
                                {test.tolerance && <span className="text-gray-400"> ({test.tolerance})</span>}
                              </p>
                            )}
                            {test.notes && <p className="italic">{test.notes}</p>}
                            <p className="text-xs text-gray-400">Performed by: {test.performedBy}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {type === 'monthly' && qc.reportUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <a
                      href={qc.reportUrl}
                      className="text-blue-400 hover:underline text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Full Report
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default QCHistory;