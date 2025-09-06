"use client";

import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300">
      <div className="bg-white p-12 rounded-2xl shadow-2xl max-w-md w-full text-center border border-purple-100">
        <div className="mb-6">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CLASSBRIDGE
            </span>
          </h1>
          <p className="text-lg text-gray-600">Online School</p>
        </div>
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
