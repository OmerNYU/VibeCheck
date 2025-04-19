import React from 'react';

const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Camera Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Configure your camera preferences for mood detection
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Music Preferences</h3>
            <p className="mt-1 text-sm text-gray-500">
              Customize your music recommendation preferences
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account and connected services
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 