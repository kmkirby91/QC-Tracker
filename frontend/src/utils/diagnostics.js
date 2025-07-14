// Diagnostic utilities for debugging QC system

export const checkSomatumForceStatus = () => {
  console.log('=== SOMATOM Force QC Diagnostic ===');
  
  // Check worksheets
  const worksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
  console.log('Total worksheets:', worksheets.length);
  
  const somatumWorksheets = worksheets.filter(w => 
    w.assignedMachines && w.assignedMachines.includes('CT-GON-001')
  );
  
  console.log('Worksheets assigned to SOMATOM Force (CT-GON-001):', somatumWorksheets.length);
  
  somatumWorksheets.forEach((w, index) => {
    console.log(`Worksheet ${index + 1}:`, {
      title: w.title,
      modality: w.modality,
      frequency: w.frequency,
      isWorksheet: w.isWorksheet,
      assignedMachines: w.assignedMachines,
      testsCount: w.tests?.length || 0
    });
  });
  
  // Check templates
  const templates = JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]');
  console.log('Total templates:', templates.length);
  
  const ctTemplates = templates.filter(t => t.modality === 'CT');
  console.log('CT templates:', ctTemplates.length);
  
  // Summary
  const hasExpectedWorksheet = somatumWorksheets.some(w => 
    w.modality === 'CT' && 
    w.frequency === 'daily' && 
    w.isWorksheet === true
  );
  
  console.log('✅ Has expected daily CT worksheet:', hasExpectedWorksheet);
  
  if (!hasExpectedWorksheet) {
    console.log('❌ PROBLEM: SOMATOM Force does not have required daily CT worksheet');
    console.log('💡 SOLUTION: Use "Reset Sample Data" from navigation menu');
  }
  
  return {
    totalWorksheets: worksheets.length,
    somatumWorksheets: somatumWorksheets.length,
    hasExpectedWorksheet,
    templates: templates.length
  };
};

// Quick fix function
export const quickFixSomatumForce = () => {
  const worksheets = JSON.parse(localStorage.getItem('qcWorksheets') || '[]');
  const templates = JSON.parse(localStorage.getItem('qcModalityTemplates') || '[]');
  
  // Check if we already have the needed worksheet
  const hasWorksheet = worksheets.some(w => 
    w.modality === 'CT' && 
    w.frequency === 'daily' && 
    w.assignedMachines && 
    w.assignedMachines.includes('CT-GON-001') &&
    w.isWorksheet === true
  );
  
  if (hasWorksheet) {
    console.log('✅ SOMATOM Force already has daily CT worksheet');
    return false;
  }
  
  // Check if we have a CT daily template
  const ctDailyTemplate = templates.find(t => t.modality === 'CT' && t.frequency === 'daily');
  
  if (!ctDailyTemplate) {
    console.log('❌ No CT daily template found - need to create one first');
    return false;
  }
  
  // Create worksheet from template
  const newWorksheet = {
    id: Date.now(),
    title: ctDailyTemplate.title,
    description: ctDailyTemplate.description,
    modality: 'CT',
    frequency: 'daily',
    tests: ctDailyTemplate.tests.map(test => ({
      ...test,
      templateSource: ctDailyTemplate.title,
      isCustomField: false,
      customFieldType: 'template-default'
    })),
    sourceTemplateId: ctDailyTemplate.id,
    sourceTemplateName: ctDailyTemplate.title,
    isWorksheet: true,
    assignedMachines: ['CT-GON-001'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    templateSource: ctDailyTemplate.title,
    templateId: ctDailyTemplate.id
  };
  
  worksheets.push(newWorksheet);
  localStorage.setItem('qcWorksheets', JSON.stringify(worksheets));
  
  console.log('✅ Created and assigned daily CT worksheet to SOMATOM Force');
  return true;
};