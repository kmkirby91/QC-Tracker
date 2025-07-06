const express = require('express');
const router = express.Router();

// Mock data for development
const mockMachines = [
  {
    machineId: 'MRI-001',
    name: 'Siemens MAGNETOM Vida',
    type: 'MRI',
    manufacturer: 'Siemens',
    model: 'MAGNETOM Vida 3T',
    serialNumber: 'SN-MRI-2021-001',
    location: {
      building: 'Main Hospital',
      floor: '2',
      room: 'MRI Suite 1'
    },
    installationDate: '2021-03-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'John Smith',
      notes: 'All parameters within normal limits'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'CT-001',
    name: 'GE Revolution CT',
    type: 'CT',
    manufacturer: 'GE Healthcare',
    model: 'Revolution CT 256',
    serialNumber: 'SN-CT-2020-001',
    location: {
      building: 'Main Hospital',
      floor: '1',
      room: 'CT Room 1'
    },
    installationDate: '2020-06-20',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Jane Doe',
      notes: 'Routine QC completed successfully'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'PET-001',
    name: 'Philips Vereos PET-CT',
    type: 'PET-CT',
    manufacturer: 'Philips',
    model: 'Vereos Digital PET-CT',
    serialNumber: 'SN-PET-2022-001',
    location: {
      building: 'Nuclear Medicine',
      floor: '1',
      room: 'PET Suite A'
    },
    installationDate: '2022-01-10',
    status: 'maintenance',
    lastQC: {
      date: '2024-01-01',
      result: 'conditional',
      performedBy: 'Mike Johnson',
      notes: 'Minor calibration needed'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MRI-002',
    name: 'Philips Ingenia 1.5T',
    type: 'MRI',
    manufacturer: 'Philips',
    model: 'Ingenia 1.5T',
    serialNumber: 'SN-MRI-2019-002',
    location: {
      building: 'Outpatient Center',
      floor: '1',
      room: 'MRI Room 2'
    },
    installationDate: '2019-11-05',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'Sarah Williams',
      notes: 'All tests passed'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'CT-002',
    name: 'Siemens SOMATOM Force',
    type: 'CT',
    manufacturer: 'Siemens',
    model: 'SOMATOM Force',
    serialNumber: 'SN-CT-2023-002',
    location: {
      building: 'Emergency Department',
      floor: '1',
      room: 'Trauma CT'
    },
    installationDate: '2023-02-28',
    status: 'critical',
    lastQC: {
      date: '2024-01-03',
      result: 'fail',
      performedBy: 'Tom Brown',
      notes: 'Detector calibration issue detected'
    },
    nextQCDue: '2024-01-04',
    qcSchedule: {
      daily: true,
      weekly: true,
      monthly: true,
      quarterly: true,
      annual: true
    }
  }
];

// Get all machines
router.get('/', (req, res) => {
  res.json(mockMachines);
});

// Get machine by ID
router.get('/:id', (req, res) => {
  const machine = mockMachines.find(m => m.machineId === req.params.id);
  if (machine) {
    res.json(machine);
  } else {
    res.status(404).json({ error: 'Machine not found' });
  }
});

// Get machines by status
router.get('/status/:status', (req, res) => {
  const machines = mockMachines.filter(m => m.status === req.params.status);
  res.json(machines);
});

// Get machines by type
router.get('/type/:type', (req, res) => {
  const machines = mockMachines.filter(m => m.type === req.params.type);
  res.json(machines);
});

// Update machine status
router.patch('/:id/status', (req, res) => {
  const machine = mockMachines.find(m => m.machineId === req.params.id);
  if (machine) {
    machine.status = req.body.status;
    res.json(machine);
  } else {
    res.status(404).json({ error: 'Machine not found' });
  }
});

module.exports = router;