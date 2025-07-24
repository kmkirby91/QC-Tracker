import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PoliciesProcedures = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const policyCategories = [
    { id: 'all', name: 'All Policies', count: 24 },
    { id: 'qc-protocols', name: 'QC Protocols', count: 8 },
    { id: 'safety', name: 'Safety Guidelines', count: 6 },
    { id: 'maintenance', name: 'Maintenance Procedures', count: 5 },
    { id: 'regulatory', name: 'Regulatory Compliance', count: 3 },
    { id: 'training', name: 'Training Materials', count: 2 }
  ];

  const policies = [
    {
      id: '001',
      title: 'Daily CT QC Testing Protocol',
      category: 'qc-protocols',
      version: '2.1',
      lastUpdated: '2024-01-15',
      status: 'active',
      description: 'Standard protocol for daily quality control testing of CT scanners including phantom setup, image acquisition, and result interpretation.',
      fileSize: '2.4 MB',
      format: 'PDF'
    },
    {
      id: '002',
      title: 'MRI Weekly QC Procedures',
      category: 'qc-protocols',
      version: '1.8',
      lastUpdated: '2023-12-20',
      status: 'active',
      description: 'Comprehensive weekly quality control procedures for MRI systems including SNR, uniformity, and geometric accuracy tests.',
      fileSize: '3.1 MB',
      format: 'PDF'
    },
    {
      id: '003',
      title: 'Radiation Safety Guidelines',
      category: 'safety',
      version: '3.0',
      lastUpdated: '2024-02-01',
      status: 'active',
      description: 'Complete radiation safety protocols for imaging equipment including ALARA principles, dosimetry, and emergency procedures.',
      fileSize: '1.8 MB',
      format: 'PDF'
    },
    {
      id: '004',
      title: 'Equipment Maintenance Schedule',
      category: 'maintenance',
      version: '1.5',
      lastUpdated: '2024-01-10',
      status: 'active',
      description: 'Preventive maintenance schedules and procedures for all imaging equipment including vendor requirements and internal protocols.',
      fileSize: '4.2 MB',
      format: 'PDF'
    },
    {
      id: '005',
      title: 'ACR Accreditation Requirements',
      category: 'regulatory',
      version: '4.2',
      lastUpdated: '2024-01-30',
      status: 'active',
      description: 'Complete guide to ACR accreditation requirements including testing protocols, documentation standards, and submission procedures.',
      fileSize: '5.6 MB',
      format: 'PDF'
    },
    {
      id: '006',
      title: 'Mammography QC Procedures',
      category: 'qc-protocols',
      version: '2.3',
      lastUpdated: '2024-02-05',
      status: 'active',
      description: 'MQSA-compliant quality control procedures for mammography systems including daily, weekly, monthly, and annual tests.',
      fileSize: '3.8 MB',
      format: 'PDF'
    },
    {
      id: '007',
      title: 'Emergency Response Procedures',
      category: 'safety',
      version: '1.2',
      lastUpdated: '2023-11-15',
      status: 'active',
      description: 'Emergency response protocols for equipment failures, radiation incidents, and medical emergencies in imaging departments.',
      fileSize: '1.4 MB',
      format: 'PDF'
    },
    {
      id: '008',
      title: 'Staff Training Requirements',
      category: 'training',
      version: '1.0',
      lastUpdated: '2024-01-05',
      status: 'active',
      description: 'Mandatory training requirements for QC staff including initial certification, continuing education, and competency assessments.',
      fileSize: '2.1 MB',
      format: 'PDF'
    }
  ];

  const filteredPolicies = policies.filter(policy => {
    const matchesCategory = selectedCategory === 'all' || policy.category === selectedCategory;
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'draft': return 'text-yellow-400 bg-yellow-900/20';
      case 'archived': return 'text-gray-400 bg-gray-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3">
              <Link to="/admin" className="text-gray-400 hover:text-gray-300">
                <span className="text-lg">←</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-100">
                📋 Policies & Procedures
              </h1>
            </div>
            <p className="text-gray-400 mt-2">
              Access organizational policies, QC procedures, and operational guidelines
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <div>Total Documents: {policies.length}</div>
            <div>Last Updated: {new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Categories</h3>
              <div className="space-y-2">
                {policyCategories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                        {category.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search policies and procedures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* Policies List */}
            <div className="space-y-4">
              {filteredPolicies.map(policy => (
                <div
                  key={policy.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 p-6 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">
                          {policy.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(policy.status)}`}>
                          {policy.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-400">
                          v{policy.version}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                        {policy.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>📅 Updated: {policy.lastUpdated}</span>
                        <span>📄 {policy.format}</span>
                        <span>📦 {policy.fileSize}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Document
                      </button>
                      <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPolicies.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">No policies found</h3>
                <p>Try adjusting your search terms or category filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <span className="mr-2">➕</span>
              <span>Add New Policy</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span className="mr-2">📤</span>
              <span>Bulk Upload</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <span className="mr-2">📊</span>
              <span>Usage Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliciesProcedures;