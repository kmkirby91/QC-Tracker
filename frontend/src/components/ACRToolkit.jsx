import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ACRToolkit = () => {
  const [selectedAccreditation, setSelectedAccreditation] = useState('all');

  const accreditationTypes = [
    { id: 'all', name: 'All Programs', count: 15 },
    { id: 'ct', name: 'CT Accreditation', count: 4 },
    { id: 'mri', name: 'MRI Accreditation', count: 3 },
    { id: 'mammography', name: 'Mammography', count: 5 },
    { id: 'nuclear', name: 'Nuclear Medicine', count: 2 },
    { id: 'ultrasound', name: 'Ultrasound', count: 1 }
  ];

  const toolkitResources = [
    {
      id: '001',
      title: 'CT Accreditation Application Package',
      type: 'ct',
      status: 'active',
      deadline: '2024-08-15',
      description: 'Complete application package for CT accreditation including forms, phantom images, and documentation requirements.',
      resources: [
        'Application Form CT-001',
        'Phantom Testing Protocol',
        'Sample Test Images',
        'Clinical Image Requirements',
        'Personnel Qualification Forms'
      ],
      progress: 75
    },
    {
      id: '002',
      title: 'MRI Accreditation Renewal',
      type: 'mri',
      status: 'in-progress',
      deadline: '2024-06-30',
      description: 'Renewal documentation for MRI accreditation including updated protocols and test results.',
      resources: [
        'Renewal Application MR-002',
        'Updated QC Test Results',
        'Staff Certification Updates',
        'Equipment Specifications',
        'Site Survey Documentation'
      ],
      progress: 45
    },
    {
      id: '003',
      title: 'Mammography MQSA Compliance',
      type: 'mammography',
      status: 'active',
      deadline: '2024-09-01',
      description: 'MQSA compliance documentation and ACR mammography accreditation materials.',
      resources: [
        'MQSA Application Forms',
        'Mammography Phantom Images',
        'Medical Physicist Reports',
        'Technologist Qualifications',
        'Quality Control Records'
      ],
      progress: 90
    },
    {
      id: '004',
      title: 'Nuclear Medicine Accreditation',
      type: 'nuclear',
      status: 'planning',
      deadline: '2024-12-15',
      description: 'Initial application for nuclear medicine accreditation including PET/CT requirements.',
      resources: [
        'Nuclear Medicine Application',
        'PET/CT Phantom Testing',
        'Radiation Safety Documentation',
        'Staff Training Records',
        'Equipment Calibration Data'
      ],
      progress: 20
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'in-progress': return 'text-yellow-400 bg-yellow-900/20';
      case 'planning': return 'text-blue-400 bg-blue-900/20';
      case 'expired': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-600';
    if (progress >= 50) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const filteredResources = toolkitResources.filter(resource => 
    selectedAccreditation === 'all' || resource.type === selectedAccreditation
  );

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
                🏆 ACR Toolkit
              </h1>
            </div>
            <p className="text-gray-400 mt-2">
              ACR accreditation resources, forms, and compliance tracking tools
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <div>Active Applications: 3</div>
            <div>Renewal Due: 2</div>
          </div>
        </div>

        {/* Accreditation Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Active Accreditations</h3>
                <p className="text-2xl font-bold text-green-400">8</p>
              </div>
              <span className="text-3xl text-green-400">✓</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">In Progress</h3>
                <p className="text-2xl font-bold text-yellow-400">3</p>
              </div>
              <span className="text-3xl text-yellow-400">⚠️</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Renewals Due</h3>
                <p className="text-2xl font-bold text-orange-400">2</p>
              </div>
              <span className="text-3xl text-orange-400">🔔</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Expired</h3>
                <p className="text-2xl font-bold text-red-400">0</p>
              </div>
              <span className="text-3xl text-red-400">❌</span>
            </div>
          </div>
        </div>

        {/* Filter and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Accreditation Types</h3>
              <div className="space-y-2">
                {accreditationTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedAccreditation(type.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedAccreditation === type.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{type.name}</span>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                        {type.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mt-4">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-blue-400 hover:text-blue-300">
                  📄 ACR Forms Library
                </a>
                <a href="#" className="block text-sm text-blue-400 hover:text-blue-300">
                  📊 Testing Protocols
                </a>
                <a href="#" className="block text-sm text-blue-400 hover:text-blue-300">
                  🏥 Site Requirements
                </a>
                <a href="#" className="block text-sm text-blue-400 hover:text-blue-300">
                  👥 Personnel Qualifications
                </a>
                <a href="#" className="block text-sm text-blue-400 hover:text-blue-300">
                  📋 Submission Guidelines
                </a>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {filteredResources.map(resource => (
                <div
                  key={resource.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 p-6 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100">
                          {resource.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(resource.status)}`}>
                          {resource.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                        {resource.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                        <span>📅 Deadline: {resource.deadline}</span>
                        <span>📋 Type: {resource.type.toUpperCase()}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-400">Completion Progress</span>
                          <span className="text-sm text-gray-400">{resource.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(resource.progress)}`}
                            style={{ width: `${resource.progress}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Resources List */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-2">Required Resources:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {resource.resources.map((item, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-400">
                              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></span>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                        Update Progress
                      </button>
                      <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm">
                        Download Forms
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredResources.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-medium mb-2">No accreditation resources found</h3>
                <p>Try selecting a different accreditation type.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <span className="mr-2">➕</span>
              <span>New Application</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span className="mr-2">📤</span>
              <span>Submit Documents</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <span className="mr-2">🔍</span>
              <span>Check Status</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <span className="mr-2">📊</span>
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ACRToolkit;