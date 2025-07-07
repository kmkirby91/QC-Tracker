import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FilterBar from './FilterBar';

const OpenFailures = () => {
  const [failures, setFailures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    severity: '',
    status: ''
  });

  useEffect(() => {
    fetchOpenFailures();
  }, []);

  const fetchOpenFailures = async () => {
    try {
      const response = await axios.get('/api/qc/open-failures');
      setFailures(response.data);
    } catch (error) {
      console.error('Error fetching open failures:', error);
      setFailures([]);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-900 text-red-200 border-red-700';
      case 'high': return 'bg-orange-900 text-orange-200 border-orange-700';
      case 'medium': return 'bg-yellow-900 text-yellow-200 border-yellow-700';
      case 'low': return 'bg-green-900 text-green-200 border-green-700';
      default: return 'bg-gray-900 text-gray-200 border-gray-700';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'urgent': return 'text-red-400';
      case 'investigating': return 'text-orange-400';
      case 'scheduled': return 'text-blue-400';
      case 'parts_ordered': return 'text-purple-400';
      case 'monitoring': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'urgent': return 'Urgent';
      case 'investigating': return 'Investigating';
      case 'scheduled': return 'Scheduled';
      case 'parts_ordered': return 'Parts Ordered';
      case 'monitoring': return 'Monitoring';
      default: return status;
    }
  };

  const filteredFailures = failures.filter(failure => {
    const matchesSearch = failure.machineName.toLowerCase().includes(filters.search.toLowerCase()) ||
                         failure.testName.toLowerCase().includes(filters.search.toLowerCase()) ||
                         failure.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = !filters.type || failure.type === filters.type;
    const matchesSeverity = !filters.severity || failure.severity === filters.severity;
    const matchesStatus = !filters.status || failure.status === filters.status;

    return matchesSearch && matchesType && matchesSeverity && matchesStatus;
  });

  // Group by severity for better organization
  const groupedFailures = {
    critical: filteredFailures.filter(f => f.severity === 'critical'),
    high: filteredFailures.filter(f => f.severity === 'high'),
    medium: filteredFailures.filter(f => f.severity === 'medium'),
    low: filteredFailures.filter(f => f.severity === 'low')
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
            <span className="text-lg">Loading open failures...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Open QC Failures</h1>
            <p className="text-gray-400 mt-2">
              {filteredFailures.length} open failure{filteredFailures.length !== 1 ? 's' : ''} requiring attention
            </p>
          </div>
          <Link
            to="/"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <FilterBar 
          onFilterChange={handleFilterChange}
          showTypeFilter={true}
          additionalFilters={(
            <>
              <select
                value={filters.severity}
                onChange={(e) => handleFilterChange({...filters, severity: e.target.value})}
                className="bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({...filters, status: e.target.value})}
                className="bg-gray-800 border border-gray-700 text-gray-100 px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="urgent">Urgent</option>
                <option value="investigating">Investigating</option>
                <option value="scheduled">Scheduled</option>
                <option value="parts_ordered">Parts Ordered</option>
                <option value="monitoring">Monitoring</option>
              </select>
            </>
          )}
        />

        {filteredFailures.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-green-200 mb-2">No Open Failures Found</h3>
            <p className="text-green-400">
              {failures.length === 0 ? 'All QC tests are passing!' : 'No failures match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFailures).map(([severity, severityFailures]) => (
              severityFailures.length > 0 && (
                <div key={severity} className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-200 flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      severity === 'critical' ? 'bg-red-500' :
                      severity === 'high' ? 'bg-orange-500' :
                      severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}></span>
                    {severity.charAt(0).toUpperCase() + severity.slice(1)} Priority ({severityFailures.length})
                  </h2>
                  
                  <div className="grid gap-4">
                    {severityFailures.map((failure) => (
                      <div key={failure.id} className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(failure.severity)}`}>
                                {failure.severity.toUpperCase()}
                              </span>
                              <span className="text-gray-400">#{failure.id}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">{failure.daysOpen} days open</span>
                            </div>
                            
                            <div className="mb-4">
                              <Link 
                                to={`/machines/${failure.machineId}`}
                                className="text-lg font-semibold text-gray-100 hover:text-blue-400 transition-colors"
                              >
                                {failure.machineName}
                              </Link>
                              <p className="text-gray-400">{failure.location}</p>
                            </div>
                            
                            <div className="mb-4">
                              <h4 className="font-medium text-gray-200 mb-1">Failed Test: {failure.testName}</h4>
                              <p className="text-gray-400 text-sm">{failure.description}</p>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm">
                              <div>
                                <span className="text-gray-500">Assigned to:</span>
                                <span className="ml-2 text-gray-300">{failure.assignedTo}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <span className={`ml-2 font-medium ${getStatusColor(failure.status)}`}>
                                  {getStatusLabel(failure.status)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Failure Date:</span>
                                <span className="ml-2 text-gray-300">
                                  {new Date(failure.failureDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <Link
                              to={`/qc/perform/${failure.machineId}/daily`}
                              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors text-center"
                            >
                              Retest
                            </Link>
                            <button className="bg-gray-700 text-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-600 transition-colors">
                              Update Status
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenFailures;