const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const generateMonthlyQCReport = (machine, qcData, month, year) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    });

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `monthly-qc-${machine.machineId}-${year}-${String(month).padStart(2, '0')}.pdf`;
    const filepath = path.join(reportsDir, filename);
    
    // Pipe PDF to file
    doc.pipe(fs.createWriteStream(filepath));

    // Header
    doc.fontSize(20).text('Monthly QC Report', { align: 'center' });
    doc.moveDown();
    
    // Report Info
    doc.fontSize(12);
    doc.text(`Report Date: ${new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, { align: 'right' });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Machine Information
    doc.fontSize(16).text('Equipment Information', { underline: true });
    doc.fontSize(10).moveDown(0.5);
    
    const machineInfo = [
      ['Machine Name:', machine.name],
      ['Machine ID:', machine.machineId],
      ['Type:', machine.type],
      ['Manufacturer:', machine.manufacturer],
      ['Model:', machine.model],
      ['Serial Number:', machine.serialNumber],
      ['Location:', `${machine.location.building} - ${machine.location.floor} - ${machine.location.room}`]
    ];

    machineInfo.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(label, { continued: true, width: 120 });
      doc.font('Helvetica').text(` ${value}`);
    });

    doc.moveDown();

    // QC Summary
    doc.fontSize(16).text('QC Summary', { underline: true });
    doc.fontSize(10).moveDown(0.5);
    
    doc.font('Helvetica-Bold').text('Overall Result: ', { continued: true });
    const resultColor = qcData.overallResult === 'pass' ? 'green' : 
                       qcData.overallResult === 'fail' ? 'red' : 'orange';
    doc.fillColor(resultColor).text(qcData.overallResult.toUpperCase());
    doc.fillColor('black');
    
    doc.font('Helvetica-Bold').text('Performed By: ', { continued: true });
    doc.font('Helvetica').text(qcData.tests[0]?.performedBy || 'N/A');
    
    doc.font('Helvetica-Bold').text('Completion Date: ', { continued: true });
    doc.font('Helvetica').text(new Date(qcData.completedAt).toLocaleString());
    
    doc.moveDown();

    // Test Results
    doc.fontSize(16).text('Test Results', { underline: true });
    doc.fontSize(10).moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 250;
    const col3 = 350;
    const col4 = 450;
    
    doc.font('Helvetica-Bold');
    doc.text('Test Name', col1, tableTop);
    doc.text('Result', col2, tableTop);
    doc.text('Value', col3, tableTop);
    doc.text('Notes', col4, tableTop);
    
    // Draw header line
    doc.moveTo(col1, tableTop + 15)
       .lineTo(520, tableTop + 15)
       .stroke();
    
    // Table rows
    let yPosition = tableTop + 25;
    doc.font('Helvetica');
    
    qcData.tests.forEach((test, index) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      
      // Test name (wrap text if needed)
      doc.text(test.testName, col1, yPosition, { width: 190 });
      
      // Result with color
      const testColor = test.result === 'pass' ? 'green' : 
                       test.result === 'fail' ? 'red' : 'orange';
      doc.fillColor(testColor).text(test.result.toUpperCase(), col2, yPosition);
      doc.fillColor('black');
      
      // Value
      doc.text(test.value || 'N/A', col3, yPosition);
      
      // Notes (wrap text if needed)
      doc.text(test.notes || '-', col4, yPosition, { width: 70 });
      
      yPosition += 30;
      
      // Draw separator line
      if (index < qcData.tests.length - 1) {
        doc.moveTo(col1, yPosition - 10)
           .lineTo(520, yPosition - 10)
           .stroke('gray');
      }
    });

    // Footer
    doc.fontSize(8).fillColor('gray');
    const pages = doc.bufferedPageRange();
    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      doc.text(`Page ${i + 1} of ${pages.count}`, 50, 750, { align: 'center' });
    }

    // Additional Notes Section
    if (qcData.additionalNotes) {
      doc.addPage();
      doc.fillColor('black').fontSize(16).text('Additional Notes', { underline: true });
      doc.fontSize(10).moveDown();
      doc.text(qcData.additionalNotes);
    }

    // Finalize PDF
    doc.end();
    
    resolve({ filename, filepath });
  });
};

module.exports = { generateMonthlyQCReport };