import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const EditMachine = () => {
  const navigate = useNavigate();
  const { machineId } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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
    },
    // ACR accreditation tracking
    acrAccreditation: {
      enabled: false,
      status: 'not-accredited',
      grantedDate: '',
      expirationDate: '',
      renewalDueDate: '',
      accreditationNumber: '',
      notes: ''
    }
  });

  const machineTypes = ['MRI', 'CT', 'PET', 'PET-CT', 'X-Ray', 'Ultrasound', 'Mammography'];
  const buildings = ['Essen', "Woman's", 'Gonzales'];
  const statuses = ['operational', 'maintenance', 'offline', 'critical'];
  
  // ACR requires renewal 8 months before expiration (most common)
  const calculateRenewalDueDate = (expirationDate) => {
    if (!expirationDate) return '';
    const expDate = new Date(expirationDate);
    const renewalDate = new Date(expDate);
    renewalDate.setMonth(expDate.getMonth() - 8);
    return renewalDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchMachineData();
  }, [machineId]);

  const fetchMachineData = async () => {
    try {
      setFetchLoading(true);
      const response = await axios.get(`/api/machines/${machineId}`);
      const machine = response.data;
      
      setFormData({
        machineId: machine.machineId || '',
        name: machine.name || '',
        type: machine.type || '',
        manufacturer: machine.manufacturer || '',
        model: machine.model || '',
        serialNumber: machine.serialNumber || '',
        location: {
          building: machine.location?.building || '',
          floor: machine.location?.floor || '',
          room: machine.location?.room || ''
        },
        installationDate: machine.installationDate || '',
        status: machine.status || 'operational',
        qcSchedule: {
          daily: machine.qcSchedule?.daily || false,
          weekly: machine.qcSchedule?.weekly || false,
          monthly: machine.qcSchedule?.monthly || false,
          quarterly: machine.qcSchedule?.quarterly || false,
          annual: machine.qcSchedule?.annual || false
        },
        acrAccreditation: {
          enabled: machine.acrAccreditation?.enabled || false,
          status: machine.acrAccreditation?.status || 'not-accredited',
          grantedDate: machine.acrAccreditation?.grantedDate || '',
          expirationDate: machine.acrAccreditation?.expirationDate || '',
          renewalDueDate: machine.acrAccreditation?.renewalDueDate || '',
          accreditationNumber: machine.acrAccreditation?.accreditationNumber || '',
          notes: machine.acrAccreditation?.notes || ''
        }
      });
    } catch (error) {
      console.error('Error fetching machine data:', error);
      toast.error('Failed to load machine data');
      navigate('/machines');
    } finally {
      setFetchLoading(false);
    }
  };

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
    } else if (name.startsWith('acrAccreditation.')) {
      const acrField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        acrAccreditation: {
          ...prev.acrAccreditation,
          [acrField]: type === 'checkbox' ? checked : value
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

      await axios.put(`/api/machines/${machineId}`, formData);
      toast.success('Machine updated successfully');
      navigate(`/machines/${machineId}`);
    } catch (error) {
      console.error('Error updating machine:', error);
      toast.error('Failed to update machine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/machines/${machineId}`);
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-400">Loading machine data...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to={`/machines/${machineId}`} className="text-blue-400 hover:underline text-sm mb-4 inline-block">
          ← Back to Machine Details
        </Link>
        <h1 className="text-2xl font-bold text-gray-100">Edit Machine</h1>
        <p className="text-gray-400 mt-2">Update machine information and ACR status</p>
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
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Machine ID cannot be changed</p>
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
                Status
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

          {/* Location, QC Schedule & ACR Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-100 border-b border-gray-700 pb-2">
              Location & Settings
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
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Annual QC</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ACR Accreditation Section */}
        {(formData.type === 'MRI' || formData.type === 'CT' || formData.type === 'Mammography') && (
          <div className="mt-6 bg-gray-700 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-100 border-b border-gray-600 pb-2 mb-4">
              ACR Accreditation Tracking
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="acrAccreditation.enabled"
                    checked={formData.acrAccreditation.enabled}
                    onChange={handleInputChange}
                    className="mr-2 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Track ACR accreditation for this machine</span>
                </label>
              </div>

              {formData.acrAccreditation.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-600">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Accreditation Status
                    </label>
                    <select
                      name="acrAccreditation.status"
                      value={formData.acrAccreditation.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="not-accredited">Not Accredited</option>
                      <option value="current">Current</option>
                      <option value="expired">Expired</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Accreditation Number
                    </label>
                    <input
                      type="text"
                      name="acrAccreditation.accreditationNumber"
                      value={formData.acrAccreditation.accreditationNumber}
                      onChange={handleInputChange}
                      placeholder="e.g., ACR-2024-001"
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Granted Date
                    </label>
                    <input
                      type="date"
                      name="acrAccreditation.grantedDate"
                      value={formData.acrAccreditation.grantedDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="date"
                      name="acrAccreditation.expirationDate"
                      value={formData.acrAccreditation.expirationDate}
                      onChange={(e) => {
                        handleInputChange(e);
                        // Auto-calculate renewal due date when expiration changes
                        const renewalDue = calculateRenewalDueDate(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          acrAccreditation: {
                            ...prev.acrAccreditation,
                            renewalDueDate: renewalDue
                          }
                        }));
                      }}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Renewal Due Date
                    </label>
                    <input
                      type="date"
                      name="acrAccreditation.renewalDueDate"
                      value={formData.acrAccreditation.renewalDueDate}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Typically 8 months before expiration
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="acrAccreditation.notes"
                      value={formData.acrAccreditation.notes}
                      onChange={handleInputChange}
                      placeholder="Additional notes about ACR accreditation status..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
            <span>{loading ? 'Updating...' : 'Update Machine'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditMachine;