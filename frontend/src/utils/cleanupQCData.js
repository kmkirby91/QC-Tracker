// Utility functions for cleaning up orphaned QC data

/**
 * Clean up QC completion data from deleted worksheets
 * This preserves data but marks it as orphaned for historical purposes
 */
export const cleanupOrphanedQCData = () => {
  try {
    // Get current worksheets
    const worksheetsData = localStorage.getItem('qcWorksheets');
    const activeWorksheets = worksheetsData ? JSON.parse(worksheetsData) : [];
    const activeWorksheetIds = new Set(activeWorksheets.map(w => w.id));

    // Get QC completions
    const completionsData = localStorage.getItem('qcCompletions');
    const completions = completionsData ? JSON.parse(completionsData) : [];

    let orphanedCount = 0;
    let cleanedCompletions = completions.map(completion => {
      if (completion.worksheetId && !activeWorksheetIds.has(completion.worksheetId)) {
        orphanedCount++;
        return {
          ...completion,
          // Mark as orphaned but preserve the data
          isOrphaned: true,
          originalWorksheetId: completion.worksheetId,
          // Remove worksheetId so it doesn't interfere with new worksheets
          worksheetId: null
        };
      }
      return completion;
    });

    // Save cleaned data
    localStorage.setItem('qcCompletions', JSON.stringify(cleanedCompletions));

    console.log(`🧹 Cleaned up ${orphanedCount} orphaned QC completion records`);
    return { cleaned: orphanedCount, total: completions.length };

  } catch (error) {
    console.error('Error cleaning up orphaned QC data:', error);
    return { error: error.message };
  }
};

/**
 * Get statistics about QC data
 */
export const getQCDataStats = () => {
  try {
    // Get current worksheets
    const worksheetsData = localStorage.getItem('qcWorksheets');
    const activeWorksheets = worksheetsData ? JSON.parse(worksheetsData) : [];

    // Get QC completions
    const completionsData = localStorage.getItem('qcCompletions');
    const completions = completionsData ? JSON.parse(completionsData) : [];

    const activeWorksheetIds = new Set(activeWorksheets.map(w => w.id));
    
    const stats = {
      totalWorksheets: activeWorksheets.length,
      totalCompletions: completions.length,
      linkedCompletions: completions.filter(c => c.worksheetId && activeWorksheetIds.has(c.worksheetId)).length,
      orphanedCompletions: completions.filter(c => c.worksheetId && !activeWorksheetIds.has(c.worksheetId)).length,
      unlinkedCompletions: completions.filter(c => !c.worksheetId || c.isOrphaned).length
    };

    console.log('📊 QC Data Statistics:', stats);
    return stats;

  } catch (error) {
    console.error('Error getting QC data stats:', error);
    return { error: error.message };
  }
};

/**
 * Remove old orphaned data (older than specified days)
 * Use with caution - this permanently deletes historical data
 */
export const removeOldOrphanedData = (daysOld = 90) => {
  try {
    const completionsData = localStorage.getItem('qcCompletions');
    const completions = completionsData ? JSON.parse(completionsData) : [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const remainingCompletions = completions.filter(completion => {
      if (completion.isOrphaned) {
        const completionDate = new Date(completion.date || completion.completedAt);
        return completionDate >= cutoffDate;
      }
      return true; // Keep all non-orphaned data
    });

    const removedCount = completions.length - remainingCompletions.length;
    localStorage.setItem('qcCompletions', JSON.stringify(remainingCompletions));

    console.log(`🗑️ Removed ${removedCount} old orphaned QC records older than ${daysOld} days`);
    return { removed: removedCount, remaining: remainingCompletions.length };

  } catch (error) {
    console.error('Error removing old orphaned data:', error);
    return { error: error.message };
  }
};