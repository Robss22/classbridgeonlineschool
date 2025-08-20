import React from 'react';

export default function LiveClassCard({ liveClass }) {
  if (!liveClass) return null;
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-l-4 border-blue-400 rounded flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div className="text-base sm:text-lg font-semibold text-blue-900">
        Today&apos;s Live Class: {liveClass.subject_name} – {new Date(liveClass.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <a href={liveClass.link} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded font-semibold shadow hover:bg-blue-700 transition flex items-center gap-2 text-xs sm:text-base">Join Now ▶️</a>
    </div>
  );
} 