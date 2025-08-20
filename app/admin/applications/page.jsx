'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; 




export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let timeoutId;
    let retryCount = 0;
    const maxRetries = 3;
    const fetchApplications = async () => {
      setLoading(true);
      setMessage('');
      setError("");
      try {
        const { data, error } = await supabase
          .from('applications')
          .select(`
            application_id,
            parent_email,
            first_name,    
            last_name,     
            gender,
            dob,
            nationality,
            curriculum,
            class,         
            parent_name,
            parent_contact,
            about_student,
            consent,
            document_url,
            status,
            submitted_at,
            updated_at
          `)
          .order('submitted_at', { ascending: false });

        if (error) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchApplications, 1000); // Retry after 1s
            return;
          }
          setError('Error loading applications: ' + error.message);
          setApplications([]);
          clearTimeout(timeoutId);
        } else if (!data || !Array.isArray(data)) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchApplications, 1000);
            return;
          }
          setError('No data returned from Supabase.');
          setApplications([]);
          clearTimeout(timeoutId);
        } else {
          setApplications(data);
          if (data.length === 0) {
            setMessage('No applications found.');
          }
          clearTimeout(timeoutId);
        }
      } catch (err) {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(fetchApplications, 1000);
          return;
        }
        setError('Unexpected error: ' + (err?.message || 'Unknown error'));
        setApplications([]);
        clearTimeout(timeoutId);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();

    // Timeout fallback: if loading takes more than 20 seconds, show error
    timeoutId = setTimeout(() => {
      setLoading(false);
      setError("Request timed out. Please check your network or Supabase configuration.");
    }, 20000);

    const channel = supabase
      .channel('applications_changes_admin_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
        fetchApplications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleApprove = async (applicationId) => {
    setApprovingId(applicationId);
    setMessage('');

    try {
      const response = await fetch('/api/approve-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Approval API Route Failed:', result.error, result.details);
        setMessage(`Error approving application: ${result.error || 'Unknown error'}. Details: ${result.details || ''}`);
      } else {
        const successMsg = `Application approved successfully! Registration: ${result.registration_number || 'N/A'}`;
        setSuccessMessage(successMsg);
        setShowSuccessMessage(true);
        // Removed setTimeout for automatic reload
      }
    } catch (error) {
      console.error('Network or unexpected error calling API route:', error);
      setMessage('Network error during approval: ' + error.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeny = async (applicationId) => {
    setLoading(true); // Keep loading true during the deny operation
    setMessage('');
    const { error } = await supabase
      .from('applications')
      .update({ status: 'denied', updated_at: new Date().toISOString() })
      .eq('application_id', applicationId);

    if (error) {
      console.error(`Failed to deny application:`, error);
      setMessage(`Failed to deny application: ` + error.message);
    } else {
      setMessage(`Application denied successfully!`);
      window.location.reload(); // Reload on deny is fine as per original logic
    }
    setLoading(false);
  };

  // New function to handle "OK" click on success message
  const handleSuccessOk = () => {
    setShowSuccessMessage(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-center text-lg text-gray-700">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <p className="text-center text-lg text-red-700 font-bold mb-4">{error}</p>
        <button
          className="mx-auto block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => { setError(""); setLoading(true); setMessage(""); }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-xl font-inter">
      <div className="mb-8 pb-4 border-b-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2 text-center">Student Applications Dashboard</h1>
        <p className="text-lg text-gray-600 text-center">Review and manage student applications for enrollment</p>
      </div>

      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
            <p className="text-sm text-gray-600 mb-4">{successMessage}</p>
            {/* OK Button added here */}
            <button
              onClick={handleSuccessOk}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className={`mb-6 p-3 rounded-lg text-center ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </p>
      )}

      {applications.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">No applications found.</p>
      ) : (
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tl-lg">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Curriculum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.map((app) => (
                <tr key={app.application_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {app.first_name} {app.last_name}
                    <div className="text-xs text-gray-500">Gender: {app.gender || 'N/A'}</div>
                    <div className="text-xs text-gray-500">DOB: {app.dob ? new Date(app.dob).toLocaleDateString() : 'N/A'}</div>
                    <div className="text-xs text-gray-500">Nationality: {app.nationality || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {app.parent_email || 'N/A'}
                    <div className="text-xs text-gray-500">Parent: {app.parent_name || 'N/A'}</div>
                    <div className="text-xs text-gray-500">Parent Contact: {app.parent_contact || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{app.curriculum || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{app.class || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      app.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : app.status === 'denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {app.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      Submitted: {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'N/A'}
                    </div>
                    {app.updated_at && (
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(app.updated_at).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {app.document_url ? (
                      <a
                        href={app.document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View Doc
                      </a>
                    ) : (
                      'N/A'
                    )}
                    {app.about_student && (
                      <div className="mt-2 text-xs text-gray-500">
                        About: {app.about_student.substring(0, 50)}...
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {app.status === 'pending' && (
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleApprove(app.application_id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-150 ease-in-out text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          disabled={approvingId === app.application_id || loading}
                        >
                          {approvingId === app.application_id ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleDeny(app.application_id)}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-150 ease-in-out text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          disabled={!!loading}
                        >
                          Deny
                        </button>
                      </div>
                    )}
                    {(app.status === 'approved' || app.status === 'denied') && (
                      <span className="text-gray-500">Status: {app.status}</span>
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