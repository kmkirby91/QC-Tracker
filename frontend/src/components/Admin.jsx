import React from 'react';
import { Link } from 'react-router-dom';

const Admin = () => {
  const adminSections = [
    {
      id: 'policies',
      title: 'Policies & Procedures',
      description: 'Access organizational policies, QC procedures, and operational guidelines',
      icon: '📋',
      route: '/admin/policies',
      color: 'bg-blue-600 hover:bg-blue-700',
      features: [
        'QC Testing Protocols',
        'Equipment Maintenance Procedures',
        'Safety Guidelines',
        'Regulatory Compliance Documents'
      ]
    },
    {
      id: 'acr-toolkit',
      title: 'ACR Toolkit',
      description: 'ACR accreditation resources, forms, and compliance tools',
      icon: '🏆',
      route: '/admin/acr-toolkit',
      color: 'bg-green-600 hover:bg-green-700',
      features: [
        'ACR Application Forms',
        'Testing Requirements',
        'Phantom Specifications',
        'Submission Guidelines'
      ]
    },
    {
      id: 'personnel',
      title: 'Personnel Records',
      description: 'Staff credentials, training records, and qualification tracking',
      icon: '👥',
      route: '/admin/personnel',
      color: 'bg-purple-600 hover:bg-purple-700',
      features: [
        'Staff Qualifications',
        'Training Certificates',
        'QC Authorization Levels',
        'Contact Information'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                🔧 Administration Center
              </h1>
              <p className="text-gray-400 mt-2">
                Manage system resources, documentation, and personnel information
              </p>
            </div>
            <div className="text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>System Active</span>
              </div>
              <div className="text-xs mt-1">
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {adminSections.map((section) => (
            <div
              key={section.id}
              className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-200"
            >
              <div className="p-6">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl">{section.icon}</span>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-100">
                        {section.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {section.description}
                </p>

                {/* Features List */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Available Resources:</h4>
                  <ul className="space-y-1">
                    {section.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <Link
                  to={section.route}
                  className={`block w-full text-center px-4 py-3 rounded-lg text-white font-medium transition-colors duration-200 ${section.color}`}
                >
                  Access {section.title}
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <span className="mr-2">⚡</span>
            Quick Actions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/worksheets"
              className="flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <span className="text-blue-400 mr-2">📊</span>
              <span className="text-sm font-medium">Manage Worksheets</span>
            </Link>
            
            <Link
              to="/machines"
              className="flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <span className="text-green-400 mr-2">🖥️</span>
              <span className="text-sm font-medium">Equipment List</span>
            </Link>
            
            <Link
              to="/due-today"
              className="flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <span className="text-yellow-400 mr-2">⚠️</span>
              <span className="text-sm font-medium">Due Today</span>
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
            >
              <span className="text-gray-400 mr-2">🔄</span>
              <span className="text-sm font-medium">Refresh System</span>
            </button>
          </div>
        </div>

        {/* System Information */}
        <div className="mt-8 bg-gray-800 rounded-lg shadow-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center">
            <span className="mr-2">ℹ️</span>
            System Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Environment</h3>
              <div className="space-y-1 text-gray-400">
                <div>Status: <span className="text-green-400">Development</span></div>
                <div>Version: <span className="text-blue-400">v1.0.0-prototype</span></div>
                <div>Mode: <span className="text-yellow-400">Mock Data</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Access URLs</h3>
              <div className="space-y-1 text-gray-400">
                <div>Frontend: <span className="text-blue-400">http://192.168.1.182:3000</span></div>
                <div>Backend: <span className="text-green-400">http://192.168.1.182:5000</span></div>
                <div>Public: <span className="text-purple-400">https://qctracker.a-naviq.com</span></div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-300 mb-2">Resources</h3>
              <div className="space-y-1 text-gray-400">
                <div>Database: <span className="text-yellow-400">File-based Storage</span></div>
                <div>Auth: <span className="text-red-400">Development Mode</span></div>
                <div>Backup: <span className="text-gray-500">Not Configured</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;