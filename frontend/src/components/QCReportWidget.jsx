import React, { useState } from 'react';
import axios from 'axios';

const QCReportWidget = ({ machine }) => {
  const [generating, setGenerating] = useState('');

  const generateQuickReport = async () => {
    setGenerating('quick');
    
    // Generate comprehensive report with all QC types using their respective timeframes:
    // Daily: last 5 days, Weekly: last 4 weeks, Monthly: last 3 months, Annual: last 2 years
    const today = new Date();
    
    // Use the longest timeframe (2 years) to capture all data
    const startDate = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const reportSettings = {
      startDate,
      endDate,
      includeDaily: true,
      includeWeekly: true, 
      includeMonthly: true,
      includeAnnual: true,
      includeFailedOnly: false,
      includeCharts: true,
      includeComments: true,
      // Add timeframe limits for each QC type
      dailyDays: 5,      // Last 5 days of daily QC
      weeklyWeeks: 4,    // Last 4 weeks of weekly QC  
      monthlyMonths: 3,  // Last 3 months of monthly QC
      annualYears: 2,    // Last 2 years of annual QC
      machineType: machine.type,
      machineName: machine.name
    };

    try {
      const response = await axios.post(`/api/qc/generate-report/${machine.machineId}`, reportSettings, {
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const dateRange = `${startDate}_to_${endDate}`;
      link.download = `QC-Report_${machine.machineId}_comprehensive_${dateRange}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setGenerating('');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-200">Generate QC Reports</h3>
            <p className="text-sm text-purple-300">Quick PDF reports with preset timeframes</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Quick Report Button */}
          <button
            onClick={generateQuickReport}
            disabled={generating === 'quick'}
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {generating === 'quick' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
                <span>Quick Report</span>
              </>
            )}
          </button>
          
          {/* Custom Reports Button */}
          <a
            href={`/reporting?machine=${machine.machineId}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Custom Reports</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default QCReportWidget;