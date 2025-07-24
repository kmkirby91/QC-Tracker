import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PersonnelRecords = () => {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const departments = [
    { id: 'all', name: 'All Staff', count: 24 },
    { id: 'radiologic-tech', name: 'Radiologic Technologists', count: 8 },
    { id: 'medical-physicist', name: 'Medical Physicists', count: 3 },
    { id: 'qc-specialist', name: 'QC Specialists', count: 5 },
    { id: 'service-engineer', name: 'Service Engineers', count: 4 },
    { id: 'administrator', name: 'Administrators', count: 4 }
  ];

  const personnel = [
    {
      id: '001',
      name: 'John Smith, RT(R)(CT)',
      position: 'Senior Radiologic Technologist',
      department: 'radiologic-tech',
      email: 'john.smith@hospital.com',
      phone: '(555) 123-4567',
      hireDate: '2019-03-15',
      status: 'active',
      certifications: ['ARRT(R)', 'ARRT(CT)', 'CPR'],
      qcAuthorizations: ['Daily CT QC', 'Weekly MRI QC', 'Monthly Mammography QC'],
      trainingExpiry: '2024-06-30',
      avatar: '👨‍⚕️'
    },
    {
      id: '002',
      name: 'Dr. Sarah Williams, PhD',
      position: 'Chief Medical Physicist',
      department: 'medical-physicist',
      email: 'sarah.williams@hospital.com',
      phone: '(555) 234-5678',
      hireDate: '2017-08-20',
      status: 'active',
      certifications: ['ABR Diagnostic Physics', 'AAPM Member'],
      qcAuthorizations: ['All QC Protocols', 'ACR Submissions', 'Regulatory Compliance'],
      trainingExpiry: '2025-01-15',
      avatar: '👩‍🔬'
    },
    {
      id: '003',
      name: 'Mike Johnson, RT(R)(M)',
      position: 'Mammography Specialist',
      department: 'qc-specialist',
      email: 'mike.johnson@hospital.com',
      phone: '(555) 345-6789',
      hireDate: '2020-11-10',
      status: 'active',
      certifications: ['ARRT(R)', 'ARRT(M)', 'MQSA Certified'],
      qcAuthorizations: ['Daily Mammography QC', 'Weekly Mammography QC', 'Monthly Mammography QC'],
      trainingExpiry: '2024-11-10',
      avatar: '👨‍💼'
    },
    {
      id: '004',
      name: 'Lisa Chen, RT(R)(MR)',
      position: 'MRI Lead Technologist',
      department: 'radiologic-tech',
      email: 'lisa.chen@hospital.com',
      phone: '(555) 456-7890',
      hireDate: '2018-05-22',
      status: 'active',
      certifications: ['ARRT(R)', 'ARRT(MR)', 'MRI Safety Officer'],
      qcAuthorizations: ['Daily MRI QC', 'Weekly MRI QC', 'Monthly MRI QC'],
      trainingExpiry: '2024-08-22',
      avatar: '👩‍⚕️'
    },
    {
      id: '005',
      name: 'Robert Zhang, BSME',
      position: 'Senior Service Engineer',
      department: 'service-engineer',
      email: 'robert.zhang@hospital.com',
      phone: '(555) 567-8901',
      hireDate: '2016-01-15',
      status: 'active',
      certifications: ['Siemens Certified', 'GE Certified', 'Philips Certified'],
      qcAuthorizations: ['Equipment Calibration', 'Preventive Maintenance', 'Performance Testing'],
      trainingExpiry: '2024-12-31',
      avatar: '🔧'
    },
    {
      id: '006',
      name: 'Maria Rodriguez, RT(R)',
      position: 'QC Coordinator',
      department: 'qc-specialist',
      email: 'maria.rodriguez@hospital.com',
      phone: '(555) 678-9012',
      hireDate: '2021-09-01',
      status: 'active',
      certifications: ['ARRT(R)', 'Quality Management', 'Lead Auditor'],
      qcAuthorizations: ['QC Program Management', 'Staff Training', 'Compliance Reporting'],
      trainingExpiry: '2024-09-01',
      avatar: '👩‍💼'
    }
  ];

  const filteredPersonnel = personnel.filter(person => {
    const matchesDepartment = selectedDepartment === 'all' || person.department === selectedDepartment;
    const matchesSearch = person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         person.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDepartment && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-900/20';
      case 'inactive': return 'text-red-400 bg-red-900/20';
      case 'training': return 'text-yellow-400 bg-yellow-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const isTrainingExpiringSoon = (expiryDate) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysToExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysToExpiry <= 90; // Warning if expiring within 90 days
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
                👥 Personnel Records
              </h1>
            </div>
            <p className="text-gray-400 mt-2">
              Staff credentials, training records, and qualification tracking
            </p>
          </div>
          <div className="text-sm text-gray-400">
            <div>Total Staff: {personnel.length}</div>
            <div>Active: {personnel.filter(p => p.status === 'active').length}</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Active Staff</h3>
                <p className="text-2xl font-bold text-green-400">{personnel.filter(p => p.status === 'active').length}</p>
              </div>
              <span className="text-3xl text-green-400">✅</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">QC Authorized</h3>
                <p className="text-2xl font-bold text-blue-400">{personnel.filter(p => p.qcAuthorizations.length > 0).length}</p>
              </div>
              <span className="text-3xl text-blue-400">🏅</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Training Due Soon</h3>
                <p className="text-2xl font-bold text-orange-400">
                  {personnel.filter(p => isTrainingExpiringSoon(p.trainingExpiry)).length}
                </p>
              </div>
              <span className="text-3xl text-orange-400">⏰</span>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Departments</h3>
                <p className="text-2xl font-bold text-purple-400">{departments.length - 1}</p>
              </div>
              <span className="text-3xl text-purple-400">🏢</span>
            </div>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Departments</h3>
              <div className="space-y-2">
                {departments.map(dept => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedDepartment === dept.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{dept.name}</span>
                      <span className="text-xs bg-gray-600 px-2 py-1 rounded-full">
                        {dept.count}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search staff by name, position, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-400">🔍</span>
                </div>
              </div>
            </div>

            {/* Personnel Cards */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredPersonnel.map(person => (
                <div
                  key={person.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 p-6 transition-all duration-200"
                >
                  <div className="flex items-start space-x-4">
                    <div className="text-4xl">{person.avatar}</div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-100 truncate">
                          {person.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(person.status)}`}>
                          {person.status.toUpperCase()}
                        </span>
                        {isTrainingExpiringSoon(person.trainingExpiry) && (
                          <span className="text-xs text-orange-400">⏰ Training Due</span>
                        )}
                      </div>
                      
                      <p className="text-gray-400 text-sm mb-3">
                        {person.position}
                      </p>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-400">
                          <span className="mr-2">📧</span>
                          <span className="truncate">{person.email}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <span className="mr-2">📞</span>
                          <span>{person.phone}</span>
                        </div>
                        <div className="flex items-center text-gray-400">
                          <span className="mr-2">📅</span>
                          <span>Hired: {person.hireDate}</span>
                        </div>
                      </div>

                      {/* Certifications */}
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-gray-300 mb-2">Certifications:</h4>
                        <div className="flex flex-wrap gap-1">
                          {person.certifications.map((cert, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* QC Authorizations */}
                      <div className="mt-4">
                        <h4 className="text-xs font-medium text-gray-300 mb-2">QC Authorizations:</h4>
                        <div className="space-y-1">
                          {person.qcAuthorizations.slice(0, 2).map((auth, index) => (
                            <div key={index} className="flex items-center text-xs text-gray-400">
                              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                              {auth}
                            </div>
                          ))}
                          {person.qcAuthorizations.length > 2 && (
                            <div className="text-xs text-blue-400">
                              +{person.qcAuthorizations.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-4">
                        <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                          View Profile
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors">
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPersonnel.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-medium mb-2">No personnel found</h3>
                <p>Try adjusting your search terms or department filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">Personnel Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <span className="mr-2">➕</span>
              <span>Add Staff Member</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <span className="mr-2">📊</span>
              <span>Training Report</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <span className="mr-2">🏅</span>
              <span>Certification Tracker</span>
            </button>
            <button className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
              <span className="mr-2">📤</span>
              <span>Export Records</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelRecords;