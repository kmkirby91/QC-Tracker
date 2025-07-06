import React, { useState } from 'react';
import axios from 'axios';

const QCReportWidget = ({ machine }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reportSettings, setReportSettings] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // Today
    includeDaily: true,
    includeMonthly: true,
    includeQuarterly: false,
    includeAnnual: false,
    includeFailedOnly: false,
    includeCharts: true,
    includeComments: true
  });
  const [generating, setGenerating] = useState(false);

  const handleSettingChange = (setting, value) => {
    setReportSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const generateReport = async () => {
    setGenerating(true);
    try {
      const response = await axios.post(`/api/qc/generate-report/${machine.machineId}`, {
        ...reportSettings,
        machineType: machine.type,
        machineName: machine.name
      }, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateRange = `${reportSettings.startDate}_to_${reportSettings.endDate}`;
      const qcTypes = [
        reportSettings.includeDaily && 'daily',
        reportSettings.includeMonthly && 'monthly', 
        reportSettings.includeQuarterly && 'quarterly',
        reportSettings.includeAnnual && 'annual'
      ].filter(Boolean).join('-');
      
      link.download = `QC-Report_${machine.machineId}_${qcTypes}_${dateRange}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getSelectedQCTypes = () => {
    const types = [];
    if (reportSettings.includeDaily) types.push('Daily');
    if (reportSettings.includeMonthly) types.push('Monthly');
    if (reportSettings.includeQuarterly) types.push('Quarterly');
    if (reportSettings.includeAnnual) types.push('Annual');
    return types.length > 0 ? types.join(', ') : 'None selected';
  };

  const getDateRangeDays = () => {
    const start = new Date(reportSettings.startDate);
    const end = new Date(reportSettings.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-200">Generate QC Reports</h3>
            <p className="text-sm text-purple-300">
              {isExpanded ? 'Click to collapse' : `Create PDF reports • ${getSelectedQCTypes()} • ${getDateRangeDays()} days`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {!isExpanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                generateReport();
              }}
              disabled={generating || !(reportSettings.includeDaily || reportSettings.includeMonthly || reportSettings.includeQuarterly || reportSettings.includeAnnual)}
              className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {generating ? 'Generating...' : 'Quick Report'}
            </button>
          )}
          <svg 
            className={`w-5 h-5 text-purple-400 transform transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-6 space-y-6">
          
          {/* Date Range */}
          <div>
            <h4 className="text-sm font-semibold text-gray-100 mb-3">Date Range</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={reportSettings.startDate}
                  onChange={(e) => handleSettingChange('startDate', e.target.value)}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={reportSettings.endDate}
                  onChange={(e) => handleSettingChange('endDate', e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-700 text-gray-100"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Report will cover {getDateRangeDays()} days of QC data
            </p>
          </div>

          {/* QC Types */}
          <div>
            <h4 className="text-sm font-semibold text-gray-100 mb-3">QC Types to Include</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeDaily}
                  onChange={(e) => handleSettingChange('includeDaily', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Daily QC</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeMonthly}
                  onChange={(e) => handleSettingChange('includeMonthly', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Monthly QC</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeQuarterly}
                  onChange={(e) => handleSettingChange('includeQuarterly', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Quarterly QC</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeAnnual}
                  onChange={(e) => handleSettingChange('includeAnnual', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Annual QC</span>
              </label>
            </div>
          </div>

          {/* Report Options */}
          <div>
            <h4 className="text-sm font-semibold text-gray-100 mb-3">Report Options</h4>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeFailedOnly}
                  onChange={(e) => handleSettingChange('includeFailedOnly', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Include failed tests only</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeComments}
                  onChange={(e) => handleSettingChange('includeComments', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Include comments and notes</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={reportSettings.includeCharts}
                  onChange={(e) => handleSettingChange('includeCharts', e.target.checked)}
                  className="rounded border-gray-600 text-purple-400 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-300">Include trend charts and graphs</span>
              </label>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-purple-900 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-purple-200 mb-2">Report Preview</h4>
            <div className="text-sm text-purple-300 space-y-1">
              <p><strong>Machine:</strong> {machine.name} ({machine.machineId})</p>
              <p><strong>Date Range:</strong> {reportSettings.startDate} to {reportSettings.endDate}</p>
              <p><strong>QC Types:</strong> {getSelectedQCTypes()}</p>
              <p><strong>Options:</strong> 
                {reportSettings.includeFailedOnly && ' Failed tests only •'}
                {reportSettings.includeComments && ' Comments included •'}
                {reportSettings.includeCharts && ' Charts included •'}
                {!reportSettings.includeFailedOnly && !reportSettings.includeComments && !reportSettings.includeCharts && ' Standard report'}
              </p>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-gray-300 bg-gray-900 rounded-md hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={generateReport}
              disabled={generating || !(reportSettings.includeDaily || reportSettings.includeMonthly || reportSettings.includeQuarterly || reportSettings.includeAnnual)}
              className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  <span>Generate PDF Report</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QCReportWidget;