import React from 'react';

const FilterBar = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Machine Type
          </label>
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
          >
            <option value="">All Types</option>
            <option value="MRI">MRI</option>
            <option value="CT">CT</option>
            <option value="PET">PET</option>
            <option value="PET-CT">PET-CT</option>
            <option value="X-Ray">X-Ray</option>
            <option value="Ultrasound">Ultrasound</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
          >
            <option value="">All Statuses</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Location
          </label>
          <select
            value={filters.location}
            onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
          >
            <option value="">All Locations</option>
            <option value="Main Hospital">Main Hospital</option>
            <option value="Outpatient Center">Outpatient Center</option>
            <option value="Emergency Department">Emergency Department</option>
            <option value="Nuclear Medicine">Nuclear Medicine</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
          >
            <option value="nextQCDue">Next QC Due</option>
            <option value="name">Name</option>
            <option value="status">Status</option>
            <option value="type">Type</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;