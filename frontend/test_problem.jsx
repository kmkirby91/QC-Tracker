      {/* Generated Worksheet */}
      {worksheetData && (
        <div className="bg-white text-black rounded-lg p-8 print:shadow-none print:p-6" id="worksheet">
          <div className="mb-6 border-b-2 border-gray-300 pb-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {worksheetData.isCustom ? worksheetData.title : 'QC Worksheet'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {getFrequencyIcon(worksheetData.frequency)} {getFrequencyLabel(worksheetData.frequency)}
                  {worksheetData.isCustom && worksheetData.description && 
                    <span className="ml-2">- {worksheetData.description}</span>
                  }
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <p>Generated: {new Date().toLocaleDateString()}</p>
                <p>Time: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Machine Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">Machine ID:</td>
                      <td className="py-1">{worksheetData.machine.machineId}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Name:</td>
                      <td className="py-1">{worksheetData.machine.name}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Type:</td>
                      <td className="py-1">{worksheetData.machine.type}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Manufacturer:</td>
                      <td className="py-1">{worksheetData.machine.manufacturer}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Model:</td>
                      <td className="py-1">{worksheetData.machine.model}</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Location:</td>
                      <td className="py-1">{worksheetData.machine.location.building} - {worksheetData.machine.location.room}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">QC Information</h3>
                <table className="w-full text-sm">
                  <tbody>
                    <tr>
                      <td className="font-medium py-1">QC Date:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Start Time:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">End Time:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Performed By:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                    <tr>
                      <td className="font-medium py-1">Reviewed By:</td>
                      <td className="py-1 border-b border-gray-400">_________________</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* QC Tests Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">QC Tests</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-400">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-4 py-2 text-left font-semibold">Test Name</th>
                    {!worksheetData.viewOnly && (
                      <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Measured Value</th>
                    )}
                    <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Tolerance</th>
                    {!worksheetData.viewOnly && (
                      <>
                        <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Pass/Fail</th>
                        <th className="border border-gray-400 px-4 py-2 text-center font-semibold">Notes</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {worksheetData.tests.map((test, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-4 py-3 font-medium">
                        {test.name}
                        {test.notes && worksheetData.isCustom && (
                          <div className="text-xs text-gray-500 mt-1 italic">{test.notes}</div>
                        )}
                      </td>
                      {!worksheetData.viewOnly && (
                        <td className="border border-gray-400 px-4 py-3 text-center">
                          {worksheetData.isCustom ? (
                            <>
                              {test.type === 'value' && (
                                <div className="flex items-center justify-center space-x-2">
                                  <div className="border-b border-gray-400 h-8 w-20"></div>
                                  {test.units && <span className="text-sm text-gray-600">{test.units}</span>}
                                </div>
                              )}
                              {test.type === 'text' && (
                                <div className="border-b border-gray-400 h-8 w-full"></div>
                              )}
                              {test.type === 'passfail' && (
                                <div className="flex justify-center space-x-4">
                                  <label className="flex items-center">
                                    <input type="radio" name={`test-${index}`} className="mr-1" />
                                    <span className="text-sm">Pass</span>
                                  </label>
                                  <label className="flex items-center">
                                    <input type="radio" name={`test-${index}`} className="mr-1" />
                                    <span className="text-sm">Fail</span>
                                  </label>
                                </div>
                              )}
                              {test.type === 'checkbox' && (
                                <div className="flex justify-center">
                                  <input type="checkbox" className="scale-125" />
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="border-b border-gray-400 h-8 w-full"></div>
                          )}
                        </td>
                      )}
                      <td className="border border-gray-400 px-4 py-3 text-center text-sm">
                        {test.tolerance || 'See Protocol'}
                      </td>
                      {!worksheetData.viewOnly && (
                        <>
                          <td className="border border-gray-400 px-4 py-3 text-center">
                            {!worksheetData.isCustom || test.type === 'value' || test.type === 'text' ? (
                              <div className="flex justify-center space-x-4">
                                <label className="flex items-center">
                                  <input type="checkbox" className="mr-1" />
                                  <span className="text-sm">Pass</span>
                                </label>
                                <label className="flex items-center">
                                  <input type="checkbox" className="mr-1" />
                                  <span className="text-sm">Fail</span>
                                </label>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500">N/A</div>
                            )}
                          </td>
                          <td className="border border-gray-400 px-4 py-3">
                            <div className="border-b border-gray-400 h-8 w-full"></div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overall Results */}
          {!worksheetData.viewOnly && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall QC Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-gray-400 p-4 rounded">
                  <label className="flex items-center text-green-700">
                    <input type="checkbox" className="mr-2 scale-125" />
                    <span className="font-semibold">PASS</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">All tests within tolerance</p>
                </div>
                <div className="border border-gray-400 p-4 rounded">
                  <label className="flex items-center text-yellow-700">
                    <input type="checkbox" className="mr-2 scale-125" />
                    <span className="font-semibold">CONDITIONAL</span>
                  </label>
                  <p className="text-sm text-gray-600 mt-1">Minor deviations noted</p>
                </div>
                <div className="border border-gray-400 p-4 rounded">
                  <label className="flex items-center text-red-700">
                    <input type="checkbox" className="mr-2 scale-125" />
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
};
