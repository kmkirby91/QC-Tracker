const express = require('express');
const router = express.Router();

// Mock data for development
const mockMachines = [
  {
    machineId: 'MRI-ESS-001',
    name: 'Siemens MAGNETOM Vida',
    type: 'MRI',
    manufacturer: 'Siemens',
    model: 'MAGNETOM Vida 3T',
    serialNumber: 'SN-MRI-2021-001',
    location: {
      building: 'Essen',
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
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-ESS-001',
    name: 'GE Revolution CT',
    type: 'CT',
    manufacturer: 'GE Healthcare',
    model: 'Revolution CT 256',
    serialNumber: 'SN-CT-2020-001',
    location: {
      building: 'Essen',
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
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'PET-WOM-001',
    name: 'Philips Vereos PET/CT',
    type: 'PET',
    manufacturer: 'Philips',
    model: 'Vereos Digital PET/CT',
    serialNumber: 'SN-PET-2022-001',
    location: {
      building: "Woman's",
      floor: '1',
      room: 'Nuclear Medicine Suite'
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
      weekly: false,
      monthly: false,
      quarterly: true,
      annual: true
    }
  },
  {
    machineId: 'MRI-WOM-001',
    name: 'Philips Ingenia 1.5T',
    type: 'MRI',
    manufacturer: 'Philips',
    model: 'Ingenia 1.5T',
    serialNumber: 'SN-MRI-2019-002',
    location: {
      building: "Woman's",
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
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-GON-001',
    name: 'Siemens SOMATOM Force',
    type: 'CT',
    manufacturer: 'Siemens',
    model: 'SOMATOM Force',
    serialNumber: 'SN-CT-2023-002',
    location: {
      building: 'Gonzales',
      floor: '1',
      room: 'Emergency CT'
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
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'MRI-GON-001',
    name: 'GE SIGNA Premier',
    type: 'MRI',
    manufacturer: 'GE Healthcare',
    model: 'SIGNA Premier 3T',
    serialNumber: 'SN-MRI-2022-003',
    location: {
      building: 'Gonzales',
      floor: '2',
      room: 'MRI Suite A'
    },
    installationDate: '2022-08-10',
    status: 'operational',
    lastQC: {
      date: '2024-01-02',
      result: 'pass',
      performedBy: 'David Chen',
      notes: 'System performing optimally'
    },
    nextQCDue: '2024-01-09',
    qcSchedule: {
      daily: false,
      weekly: true,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'CT-WOM-001',
    name: 'Canon Aquilion ONE',
    type: 'CT',
    manufacturer: 'Canon Medical',
    model: 'Aquilion ONE Genesis',
    serialNumber: 'SN-CT-2021-003',
    location: {
      building: "Woman's",
      floor: '2',
      room: 'CT Suite B'
    },
    installationDate: '2021-05-20',
    status: 'operational',
    lastQC: {
      date: '2024-01-03',
      result: 'pass',
      performedBy: 'Emily Rodriguez',
      notes: 'All QC tests within tolerance'
    },
    nextQCDue: '2024-01-10',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: true,
      quarterly: false,
      annual: true
    }
  },
  {
    machineId: 'PET-ESS-001',
    name: 'Siemens Biograph Vision',
    type: 'PET',
    manufacturer: 'Siemens',
    model: 'Biograph Vision 600',
    serialNumber: 'SN-PET-2023-002',
    location: {
      building: 'Essen',
      floor: '3',
      room: 'Nuclear Medicine'
    },
    installationDate: '2023-01-15',
    status: 'operational',
    lastQC: {
      date: '2024-01-01',
      result: 'pass',
      performedBy: 'Robert Martinez',
      notes: 'Excellent image quality'
    },
    nextQCDue: '2024-01-08',
    qcSchedule: {
      daily: true,
      weekly: false,
      monthly: false,
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