import React from 'react';

export default function TimetableTable({ timetable }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  return (
    <div id="timetable" className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">📅 Timetable</h2>
      {timetable.length === 0 ? (
        <div className="text-gray-400">No timetable found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded-lg text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Day</th>
                <th className="p-2">Start</th>
                <th className="p-2">End</th>
                <th className="p-2">Subject</th>
                <th className="p-2">Live Link</th>
              </tr>
            </thead>
            <tbody>
              {timetable.map((t) => (
                <tr key={t.timetable_id} className={`border-t ${t.day_of_week === today ? 'bg-green-50' : ''}`}>
                  <td className="p-2">{t.day_of_week}</td>
                  <td className="p-2">{new Date(`1970-01-01T${t.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-2">{new Date(`1970-01-01T${t.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="p-2">{t.subject_name}</td>
                  <td className="p-2">
                    {t.meeting_link ? (
                      <a href={t.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Join</a>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 