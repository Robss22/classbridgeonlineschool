import Link from 'next/link';

export default function SubjectGrid({ subjects }) {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">📘 Your Subjects</h2>
      {subjects.length === 0 ? (
        <div className="text-gray-400">No enrolled subjects found.</div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {subjects.map((s) => (
            <div key={s.subject_id} className="bg-white border rounded-xl shadow p-3 sm:p-4 flex flex-col gap-2 hover:shadow-lg transition">
              <div className="text-base sm:text-lg font-bold text-blue-800 flex items-center gap-2">
                <span role="img" aria-label="Subject">📚</span> {s.name}
              </div>
              <div className="flex gap-2 mt-2">
                <Link href={`/students/subjects/${s.subject_id}`} className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition">Resources</Link>
                <button className="bg-gray-200 text-gray-700 px-2 sm:px-3 py-1 rounded text-xs font-semibold cursor-not-allowed" disabled title="Coming Soon">Assignments</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 