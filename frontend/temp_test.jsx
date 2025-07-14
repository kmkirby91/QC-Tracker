                    <span className="font-semibold">FAIL</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">Tests outside tolerance</p>
                </div>
              </div>
            </div>
          )}

          {/* Comments and Actions */}
          {!worksheetData.viewOnly && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Comments and Actions</h3>
              <div className="space-y-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">General Comments:</label>
                  <div className="border border-gray-400 h-24 w-full"></div>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Corrective Actions Taken:</label>
                  <div className="border border-gray-400 h-24 w-full"></div>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Follow-up Required:</label>
                  <div className="border border-gray-400 h-16 w-full"></div>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          {!worksheetData.viewOnly && (
            <div className="border-t-2 border-gray-300 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Technologist Signature:</p>
                  <div className="border-b border-gray-400 h-12 w-full mb-2"></div>
                  <p className="text-sm text-gray-600">Date: _______________</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-2">Physicist Review:</p>
                  <div className="border-b border-gray-400 h-12 w-full mb-2"></div>
                  <p className="text-sm text-gray-600">Date: _______________</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
export default Worksheets;
