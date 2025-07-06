const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['MRI', 'CT', 'PET', 'PET-CT', 'X-Ray', 'Ultrasound']
  },
  manufacturer: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  serialNumber: {
    type: String,
    required: true
  },
  location: {
    building: String,
    floor: String,
    room: String
  },
  installationDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['operational', 'maintenance', 'offline', 'critical'],
    default: 'operational'
  },
  lastQC: {
    date: Date,
    result: {
      type: String,
      enum: ['pass', 'fail', 'conditional']
    },
    performedBy: String,
    notes: String
  },
  nextQCDue: {
    type: Date,
    required: true
  },
  qcSchedule: {
    daily: Boolean,
    weekly: Boolean,
    monthly: Boolean,
    quarterly: Boolean,
    annual: Boolean
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Machine', machineSchema);