# DICOM Integration Plan

## Overview
This document outlines the planned DICOM integration for automatic QC value calculation from medical imaging data.

## Current Status: Placeholder Implementation
- **Branch**: `dicomtesting`
- **Status**: Placeholder components and API endpoints created
- **Connection**: Not yet implemented (shows disconnected state)

## Features Implemented (Placeholder)

### Frontend Component: `DICOMAnalysis.jsx`
- Connection status indicator
- Study selection interface
- Analysis results display
- Mock data generation for testing

### Backend API: `/api/dicom/*`
- Connection status endpoint
- Study query functionality
- Image analysis processing
- Placeholder measurement calculations

## Planned DICOM Capabilities

### 1. Database Connectivity
- **PACS Integration**: Picture Archiving and Communication System
- **VNA Support**: Vendor Neutral Archive
- **DICOMweb Services**: RESTful DICOM services
- **Local DICOM Storage**: File-based DICOM repository

### 2. Automatic QC Measurements

#### CT Quality Control
- **CT Number Accuracy**: Automatic ROI placement in water phantom
- **Image Noise**: Standard deviation calculation in uniform regions
- **Uniformity**: Multi-ROI analysis across phantom
- **Spatial Resolution**: Line pair detection and measurement
- **Slice Thickness**: Ramp phantom analysis

#### MRI Quality Control
- **SNR Calculation**: Signal-to-noise ratio from phantom images
- **Uniformity Assessment**: Percentage integral uniformity
- **Ghosting Analysis**: Phase encoding artifact detection
- **Geometric Accuracy**: Distortion measurement
- **Slice Thickness**: Profile analysis

#### General Capabilities
- **ROI Management**: Automatic and manual ROI placement
- **Historical Trending**: Comparison with baseline measurements
- **Multi-slice Analysis**: 3D measurement capabilities
- **Export Integration**: Populate QC worksheets automatically

### 3. Technical Implementation

#### Required Libraries
```javascript
// Backend dependencies to add:
"dcmjs": "^0.29.0",           // DICOM parsing and manipulation
"dicom-parser": "^1.8.21",    // DICOM file parsing
"cornerstone-core": "^2.6.1", // Medical image rendering
"cornerstone-math": "^0.1.9", // ROI and measurement tools
"node-dicom": "^0.1.0"        // DICOM networking
```

#### Environment Configuration
```bash
# DICOM Database Configuration
DICOM_DATABASE_URL=postgresql://user:pass@host:5432/pacs
DICOM_AE_TITLE=QC_TRACKER
DICOM_PORT=11112
PACS_AE_TITLE=MAIN_PACS
PACS_HOST=192.168.1.100
PACS_PORT=104

# DICOMweb Configuration
DICOMWEB_URL=https://pacs.hospital.com/dicomweb
DICOMWEB_AUTH_TOKEN=xxx

# Storage Configuration
DICOM_STORAGE_PATH=/data/dicom/qc
```

### 4. Integration Points

#### QC Worksheet Integration
- Automatic value population from DICOM analysis
- Manual override capabilities
- Tolerance checking and pass/fail determination
- Historical comparison and trending

#### Machine Association
- AE Title mapping to machine IDs
- Study filtering by acquisition device
- Protocol-specific analysis selection

#### User Workflow
1. Select QC worksheet to perform
2. Query available DICOM studies for machine
3. Select appropriate QC phantom study
4. Run automated analysis
5. Review and accept calculated values
6. Complete QC worksheet with additional manual tests

### 5. Security Considerations
- DICOM data encryption in transit
- PHI scrubbing for QC phantom studies
- Access logging and audit trails
- Role-based access to DICOM functionality

### 6. Performance Optimization
- Caching of frequently accessed studies
- Background processing for analysis
- Progressive loading of large datasets
- Compression for image transfer

## Development Roadmap

### Phase 1: Basic Connectivity
- [ ] DICOM database connection
- [ ] Study query implementation
- [ ] Basic image retrieval

### Phase 2: CT Analysis
- [ ] Water phantom detection
- [ ] CT number measurement
- [ ] Noise calculation
- [ ] Uniformity analysis

### Phase 3: MRI Analysis
- [ ] SNR calculation
- [ ] Uniformity measurement
- [ ] Frequency analysis integration

### Phase 4: Advanced Features
- [ ] Historical trending
- [ ] Multi-vendor support
- [ ] Custom analysis protocols
- [ ] Automated reporting

## Testing Strategy
- Mock DICOM server for development
- Test phantom image datasets
- Validation against manual measurements
- Performance testing with large studies

## Deployment Considerations
- DICOM viewer integration
- Network security configuration
- Backup and disaster recovery
- Compliance with medical device regulations

---

**Note**: This is a placeholder implementation for future development. The actual DICOM integration will require specialized medical imaging libraries and proper DICOM networking protocols.