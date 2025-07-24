import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Research = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [selectedGrant, setSelectedGrant] = useState('all');

  const timeframes = [
    { id: 'current', name: 'Current Year', period: '2024' },
    { id: 'previous', name: 'Previous Year', period: '2023' },
    { id: 'all', name: 'All Time', period: 'All Years' }
  ];

  const researchGrants = [
    {
      id: 'NIH-2024-001',
      title: 'Advanced MRI Imaging for Neurological Disorders',
      agency: 'NIH/NINDS',
      pi: 'Dr. Sarah Martinez, MD, PhD',
      status: 'active',
      startDate: '2024-01-01',
      endDate: '2026-12-31',
      totalBudget: 2500000,
      yearlyBudget: 833333,
      spentToDate: 156789,
      remainingBudget: 676544,
      scanQuota: 500,
      scansCompleted: 147,
      scansRemaining: 353,
      scanTypes: ['MRI Brain', 'MRI Spine', 'fMRI'],
      equipment: ['MRI-ESS-001', 'MRI-GON-001'],
      recentActivity: '2024-07-22'
    },
    {
      id: 'NSF-2023-005',
      title: 'Machine Learning Applications in Medical Imaging',
      agency: 'NSF',
      pi: 'Dr. Michael Chen, PhD',
      status: 'active',
      startDate: '2023-09-01',
      endDate: '2025-08-31',
      totalBudget: 750000,
      yearlyBudget: 375000,
      spentToDate: 234567,
      remainingBudget: 140433,
      scanQuota: 300,
      scansCompleted: 278,
      scansRemaining: 22,
      scanTypes: ['CT Chest', 'CT Abdomen', 'MRI Brain'],
      equipment: ['CT-ESS-001', 'CT-GON-001', 'MRI-ESS-001'],
      recentActivity: '2024-07-20'
    },
    {
      id: 'FDA-2024-003',
      title: 'Contrast Agent Safety Study',
      agency: 'FDA',
      pi: 'Dr. Jennifer Wilson, MD',
      status: 'active',
      startDate: '2024-03-15',
      endDate: '2025-03-14',
      totalBudget: 450000,
      yearlyBudget: 450000,
      spentToDate: 87432,
      remainingBudget: 362568,
      scanQuota: 200,
      scansCompleted: 43,
      scansRemaining: 157,
      scanTypes: ['CT with Contrast', 'MRI with Contrast'],
      equipment: ['CT-ESS-001', 'MRI-ESS-001'],
      recentActivity: '2024-07-23'
    },
    {
      id: 'AHRQ-2023-012',
      title: 'Healthcare Quality Improvement Initiative',
      agency: 'AHRQ',
      pi: 'Dr. Robert Kim, MD, MPH',
      status: 'completing',
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      totalBudget: 320000,
      yearlyBudget: 160000,
      spentToDate: 298765,
      remainingBudget: 21235,
      scanQuota: 150,
      scansCompleted: 148,
      scansRemaining: 2,
      scanTypes: ['Various CT', 'Various MRI'],
      equipment: ['CT-ESS-001', 'MRI-ESS-001', 'MAMMO-ESS-001'],
      recentActivity: '2024-07-18'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'completing': return 'text-yellow-400 bg-yellow-900/20';
      case 'completed': return 'text-blue-400 bg-blue-900/20';
      case 'suspended': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-600';
    if (percentage >= 60) return 'bg-yellow-600';
    if (percentage >= 40) return 'bg-orange-600';
    return 'bg-red-600';
  };

  const getBudgetUtilization = (spent, total) => {
    return ((spent / total) * 100).toFixed(1);
  };

  const getScanProgress = (completed, total) => {
    return ((completed / total) * 100).toFixed(1);
  };

  const filteredGrants = researchGrants.filter(grant => 
    selectedGrant === 'all' || grant.id === selectedGrant
  );

  const totalBudgetAllGrants = researchGrants.reduce((sum, grant) => sum + grant.totalBudget, 0);
  const totalSpentAllGrants = researchGrants.reduce((sum, grant) => sum + grant.spentToDate, 0);
  const totalScansAllGrants = researchGrants.reduce((sum, grant) => sum + grant.scansCompleted, 0);
  const totalScanQuotaAllGrants = researchGrants.reduce((sum, grant) => sum + grant.scanQuota, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              🔬 Research Grant Tracking
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor research grants, scan quotas, financial spending, and project progress
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <div>Active Grants: {researchGrants.filter(g => g.status === 'active').length}</div>
            <div>Total Budget: ${(totalBudgetAllGrants / 1000000).toFixed(1)}M</div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Budget</h3>
                <p className="text-2xl font-bold text-green-400">
                  ${(totalBudgetAllGrants / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-gray-500">
                  Spent: ${(totalSpentAllGrants / 1000000).toFixed(1)}M ({getBudgetUtilization(totalSpentAllGrants, totalBudgetAllGrants)}%)
                </p>
              </div>
              <span className="text-3xl text-green-400">💰</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Scans</h3>
                <p className="text-2xl font-bold text-blue-400">{totalScansAllGrants.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  Quota: {totalScanQuotaAllGrants.toLocaleString()} ({getScanProgress(totalScansAllGrants, totalScanQuotaAllGrants)}%)
                </p>
              </div>
              <span className="text-3xl text-blue-400">📊</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Active Projects</h3>
                <p className="text-2xl font-bold text-purple-400">
                  {researchGrants.filter(g => g.status === 'active').length}
                </p>
                <p className="text-xs text-gray-500">
                  Completing: {researchGrants.filter(g => g.status === 'completing').length}
                </p>
              </div>
              <span className="text-3xl text-purple-400">🔬</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Equipment Utilization</h3>
                <p className="text-2xl font-bold text-orange-400">85%</p>
                <p className="text-xs text-gray-500">
                  Peak usage across research scanners
                </p>
              </div>
              <span className="text-3xl text-orange-400">🏥</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mr-2">Timeframe:</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-gray-100 text-sm"
                >
                  {timeframes.map(tf => (
                    <option key={tf.id} value={tf.id}>{tf.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-300 mr-2">Grant:</label>
                <select
                  value={selectedGrant}
                  onChange={(e) => setSelectedGrant(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-gray-100 text-sm"
                >
                  <option value="all">All Grants</option>
                  {researchGrants.map(grant => (
                    <option key={grant.id} value={grant.id}>{grant.id}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                📊 Generate Report
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                📤 Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Grant Details */}
        <div className="space-y-6">
          {filteredGrants.map(grant => (
            <div
              key={grant.id}
              className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 p-6 transition-all duration-200"
            >
              {/* Grant Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-100">
                      {grant.title}
                    </h3>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(grant.status)}`}>
                      {grant.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-400">
                    <span>🏛️ {grant.agency}</span>
                    <span>👨‍🔬 PI: {grant.pi}</span>
                    <span>🆔 {grant.id}</span>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm text-gray-500 mt-1">
                    <span>📅 {grant.startDate} - {grant.endDate}</span>
                    <span>🔄 Last Activity: {grant.recentActivity}</span>
                  </div>
                </div>
              </div>

              {/* Financial and Scan Progress */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Budget Progress */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-100 mb-3">💰 Budget Status</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Total Budget:</span>
                      <span className="font-medium">${grant.totalBudget.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Spent to Date:</span>
                      <span className="font-medium text-red-400">
                        ${grant.spentToDate.toLocaleString()} ({getBudgetUtilization(grant.spentToDate, grant.totalBudget)}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Remaining:</span>
                      <span className="font-medium text-green-400">${grant.remainingBudget.toLocaleString()}</span>
                    </div>
                    
                    {/* Budget Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${getProgressColor(parseFloat(getBudgetUtilization(grant.spentToDate, grant.totalBudget)))}`}
                          style={{ width: `${getBudgetUtilization(grant.spentToDate, grant.totalBudget)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scan Progress */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-100 mb-3">📊 Scan Progress</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Scan Quota:</span>
                      <span className="font-medium">{grant.scanQuota.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Completed:</span>
                      <span className="font-medium text-blue-400">
                        {grant.scansCompleted.toLocaleString()} ({getScanProgress(grant.scansCompleted, grant.scanQuota)}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Remaining:</span>
                      <span className="font-medium text-yellow-400">{grant.scansRemaining.toLocaleString()}</span>
                    </div>
                    
                    {/* Scan Progress Bar */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-600 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${getProgressColor(parseFloat(getScanProgress(grant.scansCompleted, grant.scanQuota)))}`}
                          style={{ width: `${getScanProgress(grant.scansCompleted, grant.scanQuota)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Scan Types */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Scan Types:</h4>
                  <div className="flex flex-wrap gap-2">
                    {grant.scanTypes.map((type, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Equipment */}
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Equipment Used:</h4>
                  <div className="flex flex-wrap gap-2">
                    {grant.equipment.map((eq, index) => (
                      <span key={index} className="px-2 py-1 text-xs bg-green-900/30 text-green-300 rounded">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-700">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm">
                  📊 View Details
                </button>
                <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm">
                  💰 Financial Report
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm">
                  📈 Usage Analytics
                </button>
                <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm">
                  ✏️ Edit Grant
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Research Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <span className="mr-2">➕</span>
              <span>New Grant</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span className="mr-2">📊</span>
              <span>Analytics Dashboard</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <span className="mr-2">📅</span>
              <span>Schedule Scans</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <span className="mr-2">💰</span>
              <span>Budget Tracker</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <span className="mr-2">📤</span>
              <span>Submit Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Research;