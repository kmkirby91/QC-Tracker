# Quality Control Protocols

## Overview
This document outlines the QC testing protocols implemented in the QC Tracker system for various medical imaging equipment types.

## ⚠️ Important Notice
**These are reference protocols for development purposes only. Clinical QC protocols must follow manufacturer guidelines and regulatory requirements (FDA, ACR, IEC, etc.).**

## Daily QC Protocols

### MRI (Magnetic Resonance Imaging)
Daily QC tests typically performed each morning before patient scanning:

1. **Center Frequency Check**
   - Purpose: Verify RF frequency accuracy
   - Method: Automated system check
   - Tolerance: ±0.1 MHz
   - Action: Adjustment if outside tolerance

2. **Signal-to-Noise Ratio (SNR)**
   - Purpose: Assess image quality
   - Method: Phantom imaging with standard sequence
   - Tolerance: >100 (system dependent)
   - Action: Investigation if <90% of baseline

3. **Geometric Accuracy**
   - Purpose: Verify spatial accuracy
   - Method: Grid phantom measurement
   - Tolerance: ±2mm
   - Action: Calibration if outside tolerance

4. **Image Uniformity**
   - Purpose: Check for artifacts/non-uniformity
   - Method: Large phantom imaging
   - Tolerance: <5% variation across image
   - Action: Shimming adjustment if needed

5. **Artifact Assessment**
   - Purpose: Detect system artifacts
   - Method: Visual inspection of test images
   - Action: Investigation of any new artifacts

6. **RF Coil Check**
   - Purpose: Verify coil functionality
   - Method: Visual and electrical inspection
   - Action: Replace if damaged

### CT (Computed Tomography)
Daily QC tests performed before clinical use:

1. **Warm-up Procedure**
   - Purpose: Bring X-ray tube to operating temperature
   - Method: Automated warm-up sequence
   - Duration: 15-30 minutes
   - Action: Allow completion before scanning

2. **CT Number Accuracy (Water)**
   - Purpose: Verify Hounsfield Unit calibration
   - Method: Water phantom scan
   - Tolerance: 0 ± 5 HU for water
   - Action: Recalibration if outside tolerance

3. **Image Noise Assessment**
   - Purpose: Monitor system noise performance
   - Method: Uniform phantom scan
   - Tolerance: <0.5% coefficient of variation
   - Action: Investigation if increasing trend

4. **Artifact Check**
   - Purpose: Detect ring artifacts, streaks
   - Method: Uniform phantom visual inspection
   - Action: Detector calibration if artifacts present

5. **Table Movement Accuracy**
   - Purpose: Verify table positioning
   - Method: Physical measurement
   - Tolerance: ±1mm
   - Action: Mechanical adjustment if needed

6. **Laser Alignment**
   - Purpose: Check patient positioning lasers
   - Method: Visual and measurement check
   - Tolerance: ±2mm
   - Action: Realignment if necessary

### PET-CT (Positron Emission Tomography)
Daily QC combines PET and CT protocols:

1. **Daily Normalization**
   - Purpose: Correct for detector efficiency variations
   - Method: Uniform source scan
   - Duration: 10-30 minutes
   - Action: Apply correction factors

2. **Coincidence Timing Resolution**
   - Purpose: Verify detector timing accuracy
   - Method: Point source measurement
   - Tolerance: <600 ps FWHM
   - Action: System adjustment if degraded

3. **Energy Resolution Check**
   - Purpose: Monitor photopeak resolution
   - Method: Point source energy spectrum
   - Tolerance: <15% FWHM at 511 keV
   - Action: Detector calibration if needed

4. **Detector Efficiency**
   - Purpose: Check for failed detectors
   - Method: Uniform phantom scan
   - Tolerance: <5% variation
   - Action: Service call if detectors failing

5. **CT Warm-up** (same as CT protocol)

6. **PET/CT Alignment Check**
   - Purpose: Verify spatial registration
   - Method: Multi-modality phantom
   - Tolerance: <3mm
   - Action: Software alignment if needed

## Monthly QC Protocols

### MRI Monthly Tests

1. **Slice Position Accuracy**
   - Purpose: Verify slice positioning accuracy
   - Method: Wedge phantom measurement
   - Tolerance: ±5mm or ±10% slice thickness
   - Frequency: Monthly

2. **Slice Thickness Accuracy**
   - Purpose: Confirm slice thickness calibration
   - Method: Ramp phantom measurement
   - Tolerance: ±30% of nominal thickness
   - Frequency: Monthly

3. **Field Homogeneity**
   - Purpose: Assess magnetic field uniformity
   - Method: Spherical phantom with mapping
   - Tolerance: <10 ppm over 40cm sphere
   - Frequency: Monthly

4. **Gradient Calibration**
   - Purpose: Verify gradient strength accuracy
   - Method: Phantom with known dimensions
   - Tolerance: ±5%
   - Frequency: Monthly

5. **Transmit Gain Calibration**
   - Purpose: Check RF power calibration
   - Method: Automated system test
   - Tolerance: ±10%
   - Frequency: Monthly

6. **Magnetic Field Drift**
   - Purpose: Monitor field stability
   - Method: Frequency measurement over time
   - Tolerance: <0.1 ppm/hour
   - Frequency: Monthly

7. **Helium Level Check**
   - Purpose: Monitor cryogen levels
   - Method: System monitoring display
   - Action: Schedule refill if low
   - Frequency: Monthly

8. **Cold Head Temperature**
   - Purpose: Monitor cooling system
   - Method: System temperature logs
   - Tolerance: Manufacturer specifications
   - Frequency: Monthly

### CT Monthly Tests

1. **CT Number Linearity**
   - Purpose: Verify HU accuracy across range
   - Method: Multi-material phantom
   - Materials: Air, water, bone, soft tissue
   - Tolerance: ±10 HU for each material
   - Frequency: Monthly

2. **Spatial Resolution (MTF)**
   - Purpose: Assess system resolution
   - Method: High-contrast phantom
   - Measurement: 10% MTF point
   - Tolerance: >0.7 lp/mm
   - Frequency: Monthly

3. **Low Contrast Detectability**
   - Purpose: Evaluate contrast sensitivity
   - Method: Low-contrast phantom
   - Measurement: Smallest visible contrast
   - Tolerance: System dependent
   - Frequency: Monthly

4. **Slice Thickness Verification**
   - Purpose: Confirm slice thickness accuracy
   - Method: Ramp phantom
   - Tolerance: ±1mm or ±50% nominal
   - Frequency: Monthly

5. **Patient Dose Verification**
   - Purpose: Monitor radiation dose output
   - Method: Ion chamber measurement
   - Tolerance: ±20% of baseline
   - Frequency: Monthly

6. **kVp Accuracy**
   - Purpose: Verify X-ray energy accuracy
   - Method: kVp meter measurement
   - Tolerance: ±5 kVp
   - Frequency: Monthly

7. **mA Linearity**
   - Purpose: Check tube current accuracy
   - Method: Dose measurement vs mA
   - Tolerance: ±10%
   - Frequency: Monthly

8. **Timer Accuracy**
   - Purpose: Verify exposure time accuracy
   - Method: Oscilloscope measurement
   - Tolerance: ±10%
   - Frequency: Monthly

### PET-CT Monthly Tests

1. **Sensitivity Measurement**
   - Purpose: Quantify detection efficiency
   - Method: Line source in air
   - Tolerance: ±10% of baseline
   - Frequency: Monthly

2. **Spatial Resolution Test**
   - Purpose: Assess image sharpness
   - Method: Point source in air
   - Measurement: FWHM in all directions
   - Tolerance: <8mm FWHM
   - Frequency: Monthly

3. **Count Rate Performance**
   - Purpose: Evaluate deadtime losses
   - Method: Decaying source measurement
   - Tolerance: <10% at clinical count rates
   - Frequency: Monthly

4. **Image Quality Phantom**
   - Purpose: Overall system performance
   - Method: NEMA IQ phantom
   - Measurements: Contrast, noise, uniformity
   - Tolerance: NEMA specifications
   - Frequency: Monthly

5. **Attenuation Correction Accuracy**
   - Purpose: Verify CT-based correction
   - Method: Transmission phantom
   - Tolerance: <10% error in activity
   - Frequency: Monthly

6. **SUV Calibration**
   - Purpose: Quantitative accuracy check
   - Method: Known activity phantom
   - Tolerance: ±10% of true value
   - Frequency: Monthly

7. **Cross-calibration with Dose Calibrator**
   - Purpose: Ensure consistent quantification
   - Method: Same source measured both ways
   - Tolerance: ±10% agreement
   - Frequency: Monthly

## QC Result Interpretation

### Pass Criteria
- All measurements within specified tolerances
- No new artifacts or abnormalities
- System performance stable compared to baseline

### Conditional Pass
- Minor deviations that don't affect clinical use
- Trending toward tolerance limits
- Requires increased monitoring

### Fail Criteria
- Measurements outside tolerance limits
- New artifacts affecting image quality
- Safety concerns identified

### Actions Required

#### Pass
- Document results
- Continue normal operations
- Review trends monthly

#### Conditional
- Increase monitoring frequency
- Schedule preventive maintenance
- Notify service if trending worse

#### Fail
- Stop clinical use immediately
- Contact service engineer
- Document incident
- Perform corrective action
- Repeat failed tests after repair

## Documentation Requirements

### Daily QC Records
- Date and time of testing
- Technologist performing QC
- All measured values
- Pass/fail determination
- Any corrective actions taken
- Signature of responsible physicist

### Monthly QC Reports
- Comprehensive test results
- Trend analysis
- Comparison to acceptance criteria
- Recommendations for action
- Physicist review and signature

### Annual Summary
- Year-over-year trend analysis
- System performance assessment
- Maintenance correlation
- Recommendations for next year

## Regulatory Compliance

### US Requirements
- FDA regulations (21 CFR Part 1020)
- State radiation control programs
- ACR accreditation standards
- Joint Commission requirements

### International Standards
- IEC 61223 series (Medical electrical equipment)
- NEMA standards (manufacturer specific)
- Local regulatory requirements

## Quality Assurance Program

### Program Elements
- Written procedures for all tests
- Trained personnel performing QC
- Regular review of results
- Trending analysis
- Corrective action procedures
- Annual program review

### Personnel Requirements
- Qualified Medical Physicist oversight
- Trained technologists for daily QC
- Service engineer for repairs
- Radiation Safety Officer approval