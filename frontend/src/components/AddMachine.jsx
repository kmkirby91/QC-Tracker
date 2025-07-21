import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddMachine = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    machineId: '',
    name: '',
    type: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    location: {
      building: '',
      floor: '',
      room: ''
    },
    installationDate: '',
    status: 'operational',
    qcSchedule: {
      daily: false,
      weekly: false,
      monthly: false,
      quarterly: false,
      annual: false
    }
  });

  const machineTypes = ['MRI', 'CT', 'PET', 'PET-CT', 'X-Ray', 'Ultrasound', 'Mammography'];
  const buildings = ['Essen', "Woman's", 'Gonzales'];
  const statuses = ['operational', 'maintenance', 'offline', 'critical'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('location.')) {
      const locationField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else if (name.startsWith('qcSchedule.')) {
      const scheduleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        qcSchedule: {
          ...prev.qcSchedule,
          [scheduleField]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.machineId || !formData.name || !formData.type || !formData.manufacturer || 
          !formData.model || !formData.serialNumber || !formData.installationDate ||
          !formData.location.building || !formData.location.floor || !formData.location.room) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Calculate next QC due date based on schedule
      const nextQCDue = calculateNextQCDue(formData.qcSchedule);
      
      const machineData = {
        ...formData,
        nextQCDue: nextQCDue.toISOString().split('T')[0]
      };

      await axios.post('/api/machines', machineData);
      // Success notification removed
      navigate('/machines');
    } catch (error) {
      console.error('Error adding machine:', error);
      toast.error('Failed to add machine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextQCDue = (schedule) => {
    const today = new Date();
    const nextDates = [];

    if (schedule.daily) {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      nextDates.push(nextDay);
    }
    if (schedule.weekly) {
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      nextDates.push(nextWeek);
    }
    if (schedule.monthly) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      nextDates.push(nextMonth);
    }
    if (schedule.quarterly) {
      const nextQuarter = new Date(today);
      nextQuarter.setMonth(today.getMonth() + 3);
      nextDates.push(nextQuarter);
    }
    if (schedule.annual) {
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      nextDates.push(nextYear);
    }

    // Return the earliest date, or 30 days from now if no schedule selected
    if (nextDates.length === 0) {
      const defaultNext = new Date(today);
      defaultNext.setDate(today.getDate() + 30);
      return defaultNext;
    }

    return new Date(Math.min(...nextDates));
  };

  const handleCancel = () => {
    navigate('/machines');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100">Add New Machine</h1>
        <p className="text-gray-400 mt-2">Add a new imaging machine to the QC tracking system</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 border-b border-gray-700 pb-2">
              Basic Information
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Machine ID *
              </label>
              <input
                type="text"
                name="machineId"
                value={formData.machineId}
                onChange={handleInputChange}
                placeholder="e.g., MRI-ESS-002"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Machine Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Siemens MAGNETOM Vida"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Modality *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select modality</option>
                {machineTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Manufacturer *
              </label>
              <input
                type="text"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleInputChange}
                placeholder="e.g., Siemens, GE Healthcare, Philips"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleInputChange}
                placeholder="e.g., MAGNETOM Vida 3T"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Serial Number *
              </label>
              <input
                type="text"
                name="serialNumber"
                value={formData.serialNumber}
                onChange={handleInputChange}
                placeholder="e.g., SN-MRI-2024-001"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Installation Date *
              </label>
              <input
                type="date"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Initial Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location & QC Schedule */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 border-b border-gray-700 pb-2">
              Location & QC Schedule
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Building *
              </label>
              <select
                name="location.building"
                value={formData.location.building}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select building</option>
                {buildings.map(building => (
                  <option key={building} value={building}>{building}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Floor *
              </label>
              <input
                type="text"
                name="location.floor"
                value={formData.location.floor}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, Ground"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Room *
              </label>
              <input
                type="text"
                name="location.room"
                value={formData.location.room}
                onChange={handleInputChange}
                placeholder="e.g., MRI Suite 1, CT Room A"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                QC Schedule
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qcSchedule.daily"
                    checked={formData.qcSchedule.daily}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Daily QC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qcSchedule.weekly"
                    checked={formData.qcSchedule.weekly}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Weekly QC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qcSchedule.monthly"
                    checked={formData.qcSchedule.monthly}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Monthly QC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qcSchedule.quarterly"
                    checked={formData.qcSchedule.quarterly}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Quarterly QC</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="qcSchedule.annual"
                    checked={formData.qcSchedule.annual}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Annual QC</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-2 bg-gray-600 text-gray-100 rounded-md hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>{loading ? 'Adding...' : 'Add Machine'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddMachine;