import React from 'react';

const Recommendations = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Recommendations</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Based on Your Current Mood</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Placeholder for mood-based recommendations */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">No mood detected yet</p>
                <p className="mt-2 text-sm text-blue-500">Try our mood detection feature</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Recent Recommendations</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Placeholder for recent recommendations */}
              <div className="border rounded-lg p-4">
                <p className="text-sm text-gray-500">No recent recommendations</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Recommendations; 