'use client';

import { useState, useEffect, useRef } from 'react'; // Import useRef
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getNames } from 'country-list';
import dynamic from 'next/dynamic';
const PhoneInput = dynamic(() => import('react-phone-input-2'), { ssr: false });

export default function ApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    nationality: 'Uganda',
    curriculum: '',
    curriculumName: '', // Added for program name
    className: '',
    parentName: '',
    parentContact: '',
    email: '',
    about: '',
    consent: false,
    academicDocs: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // const [sessionInfo, setSessionInfo] = useState(null);

  const [curricula, setCurricula] = useState<{ program_id: string; name: string }[]>([]);
  const [classesByCurriculum, setClassesByCurriculum] = useState<{ [key: string]: string[] }>({});

  const countries = getNames();
  const [filteredCountries, setFilteredCountries] = useState<string[]>([]);

  // New state for success message overlay
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState('');

  // Ref for the hidden file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const submissionCompletedRef = useRef(false);

  useEffect(() => {
    async function fetchProgramsAndClasses() {
      try {
        const { data: programs, error: programsError } = await supabase
          .from('programs')
          .select('program_id, name')
          .order('name');

        if (programsError) {
          return; // Exit if programs cannot be fetched
        }
        
        setCurricula(programs || []); // Store as array of objects

        const { data: levels, error: levelsError } = await supabase
          .from('levels')
          .select('name, program_id')
          .order('name');

        if (levelsError) {
          return; // Exit if levels cannot be fetched
        }

        const programIdToName: { [key: string]: string } = {};
        (programs || []).forEach((p) => {
          programIdToName[p.program_id] = p.name;
        });

        const grouped: { [key: string]: string[] } = {};
        (levels || []).forEach((level) => {
          const pid = (level.program_id ?? '') as string;
          const programName = (pid && programIdToName[pid]) ? programIdToName[pid] : 'Unknown Program';
          if (!grouped[programName]) grouped[programName] = [];
          grouped[programName].push(level.name);
        });

        setClassesByCurriculum(grouped);
        
      } catch {
        // Handle error silently
      }
    }

    fetchProgramsAndClasses(); // Call the async function

    // async function getSession() {
    //   console.log('getSession: Attempting to get Supabase session...');
    //   const { data: { session }, error } = await supabase.auth.getSession();
    //   if (error) {
    //     console.error('getSession: Error getting Supabase session:', error);
    //     setSessionInfo('Error: Could not get session.');
    //   } else if (session) {
    //     console.log('getSession: Supabase Session (Authenticated):', session);
    //     setSessionInfo(`Authenticated User ID: ${session.user.id}, Role: ${session.user.role}`);
    //   } else {
    //     console.log('getSession: Supabase Session (Anon): No active session, likely anon user.`);
    //     setSessionInfo('No active session (Anon user)');
    //   }
    // }
    // getSession(); // Call the async function
    // END: Logging for initial data fetch in useEffect
  }, []);

  function handleNationalityChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((f) => ({ ...f, nationality: value }));

    if (value.length === 0) {
      setFilteredCountries([]);
      return;
    }

    const filtered = countries.filter((c) =>
      c.toLowerCase().startsWith(value.toLowerCase())
    );
    setFilteredCountries(filtered);
  }

  function selectCountry(country: string) {
    setForm((f) => ({ ...f, nationality: country }));
    setFilteredCountries([]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else if (type === 'file' && e.target instanceof HTMLInputElement) {
      const files = e.target.files;
      setForm((f) => ({ ...f, [name]: files && files[0] ? files[0] : null }));
    } else {
      setForm((f) => {
        if (name === 'curriculum') {
          const selectedProgram = curricula.find(p => p.program_id === value);
          return { ...f, curriculum: value, curriculumName: selectedProgram ? selectedProgram.name : '', className: '' };
        }
        return { ...f, [name]: value };
      });
    }
  }

  function handlePhoneChange(value: string) {
    setForm((f) => ({ ...f, parentContact: value }));
  }

  // New function to handle "OK" click on success message
  const handleSuccessOk = () => {
    setShowSuccessOverlay(false); // Hide the overlay
    submissionCompletedRef.current = false; // Reset submission state
    router.push('/home'); // Navigate to home page using Next.js router
  };

  // Function to programmatically click the hidden file input
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.consent) {
      setMessage('You must agree to the consent.');
      return;
    }

    if (!form.academicDocs) {
      setMessage('Academic documents are required.');
      return;
    }

    setLoading(true);
    setMessage('Starting form submission...');
    submissionCompletedRef.current = false;

    // Add a timeout to prevent the form from getting stuck
    const timeoutId = setTimeout(() => {
      // Only show timeout message if submission hasn't completed yet
      if (!submissionCompletedRef.current) {
        setLoading(false);
        setMessage('Submission is taking longer than expected. Please wait, the form may still be processing in the background.');
      }
    }, 60000); // 60 second timeout - increased to be more reasonable

    try {
      // Clear timeout once we start processing - form is no longer "stuck"
      clearTimeout(timeoutId);
      
      let academicDocsUrl = null;
      if (form.academicDocs) {
        setMessage('Uploading academic documents...');
        const fileExt = form.academicDocs.name.split('.').pop();
        const fileName = `${form.firstName}_${form.lastName}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('academic-docs')
          .upload(fileName, form.academicDocs);

        if (uploadError) {
          clearTimeout(timeoutId);
          setMessage('Error uploading academic documents: ' + uploadError.message);
          setLoading(false);
          return;
        }
        academicDocsUrl = supabase.storage.from('academic-docs').getPublicUrl(fileName).data.publicUrl;
      }

      setMessage('Submitting application to database...');

      const { data: applicationInsertData, error: applicationInsertError } = await supabase.from('applications').insert([
        {
          first_name: form.firstName,
          last_name: form.lastName,
          gender: form.gender,
          dob: form.dob,
          nationality: form.nationality,
          curriculum: form.curriculumName, // Store the program name for display
          program_id: form.curriculum,     // Store the program_id for normalization
          class: form.className,
          parent_name: form.parentName,
          parent_contact: form.parentContact,
          parent_email: form.email,
          about_student: form.about,
          consent: form.consent,
          document_url: academicDocsUrl,
          status: 'pending',
        },
      ]).select('application_id');

      if (applicationInsertError) {
        clearTimeout(timeoutId);
        setMessage('Error submitting application data: ' + applicationInsertError.message);
        setLoading(false);
        return;
      }

      // Try to send confirmation email, but don't fail the entire submission if it fails
      setMessage('Sending confirmation email...');
      try {
        const edgeFunctionPayload = {
          application: {
            ...form,
            document_url: academicDocsUrl,
            application_id: applicationInsertData[0].application_id
          }
        };
        
        const { error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
          body: edgeFunctionPayload,
        });

        if (emailError) {
          setMessage('Application submitted successfully! However, we encountered an issue sending the confirmation email. Please contact support if you do not receive it within an hour.');
          setSuccessMessageContent('Your application has been submitted successfully! \n However, we encountered an issue sending the confirmation email. Please contact support if you do not receive it within an hour. \n Your Application will be processed after confirmation of the Application fee: Ugx 50000/= \n For help 0747808222');
        } else {
          setMessage('Application submitted successfully! A confirmation email has been sent.');
          setSuccessMessageContent('Your application has been submitted successfully! \n A confirmation email has been sent to your parent email. \n Your Application will be processed after confirmation of the Application fee: Ugx 50000/= \n For help 0747808222');
        }
      } catch {
        setMessage('Application submitted successfully! However, we encountered an issue sending the confirmation email. Please contact support if you do not receive it within an hour.');
        setSuccessMessageContent('Your application has been submitted successfully! \n However, we encountered an issue sending the confirmation email. Please contact support if you do not receive it within an hour. \n Your Application will be processed after confirmation of the Application fee: Ugx 50000/= \n For help 0747808222');
      }

      // Mark submission as completed and show success
      submissionCompletedRef.current = true;
      setMessage('Application submitted successfully!');
      setShowSuccessOverlay(true);

      // Reset form fields
      setForm({
        firstName: '', lastName: '', gender: '', dob: '', nationality: 'Uganda',
        curriculum: '', curriculumName: '', className: '', parentName: '', parentContact: '', email: '',
        about: '', consent: false, academicDocs: null,
      });
      
      // Clear the file input field by resetting its value via ref
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      clearTimeout(timeoutId);
      setMessage('Error submitting application: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      clearTimeout(timeoutId); // Clear the timeout (redundant but safe)
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 flex items-center justify-center py-12 px-2 pb-32">
      <div className="max-w-3xl w-full mx-auto p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-2 text-center">Student Application Form</h1>
        <p className="mb-6 text-center text-gray-600">
          Please complete the form below with accurate information and click <span className='font-semibold'>Submit</span> to send your application. Our admissions team will review your submission and contact you as soon as possible with the next steps. If you have any questions, feel free to reach out to us.
        </p>

        {/* Success Message Overlay */}
        {showSuccessOverlay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md mx-4 text-center">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Application Submitted!</h3>
              <p className="text-sm text-gray-600 mb-4 whitespace-pre-line">{successMessageContent}</p> {/* Use whitespace-pre-line to respect \n */}
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
          <div className={`mb-4 p-3 rounded-lg border ${
            message.startsWith('Error') || message.includes('failed') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : message.includes('successfully') 
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center gap-2">
              {message.includes('successfully') ? (
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : message.startsWith('Error') || message.includes('failed') ? (
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              <span className="font-medium">{message}</span>
            </div>
          </div>
        )}

        {/* Progress indicator during submission */}
        {loading && !message.includes('successfully') && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-medium">Please wait while we process your application...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Info */}
        <h2 className="font-semibold text-lg">Student Information</h2>
        <div className="flex gap-4">
          <input type="text" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} required className="flex-1 border rounded px-3 py-2" />
          <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} required className="flex-1 border rounded px-3 py-2" />
        </div>
        <div className="flex gap-4">
          <select name="gender" value={form.gender} onChange={handleChange} required className="flex-1 border rounded px-3 py-2">
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
          </select>
          <input type="date" name="dob" value={form.dob} onChange={handleChange} required className="flex-1 border rounded px-3 py-2" />
        </div>
        <div className="relative w-full">
          <input type="text" name="nationality" placeholder="Nationality" value={form.nationality} onChange={handleNationalityChange} autoComplete="off" required className="w-full border rounded px-3 py-2" />
          {filteredCountries.length > 0 && (
            <ul className="absolute z-10 max-h-48 w-full overflow-auto border bg-white rounded shadow mt-1">
              {filteredCountries.map((country) => (
                <li key={country} className="cursor-pointer px-3 py-2 hover:bg-blue-100" onClick={() => selectCountry(country)}>
                  {country}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Curriculum and Class selectors */}
        <div className="flex gap-4">
          <select name="curriculum" value={form.curriculum} onChange={handleChange} required className="flex-1 border rounded px-3 py-2">
            <option value="">Select Curriculum</option>
            {curricula.map((p) => ( <option key={p.program_id} value={p.program_id}>{p.name}</option> ))}
          </select>
          <select name="className" value={form.className} onChange={handleChange} required className="flex-1 border rounded px-3 py-2" disabled={!form.curriculum}>
            <option value="">Select Class</option>
            {form.curriculum && (() => {
              const selectedProgram = curricula.find(p => p.program_id === form.curriculum);
              const programName = selectedProgram?.name || '';
              return classesByCurriculum[programName]?.map((cls) => ( <option key={cls} value={cls}> {cls} </option> )) || <option value="">No classes available</option>;
            })()}
          </select>
        </div>
        
        {/* Academic Documents - Styled Button */}
        <div className="flex items-center space-x-3">
          <label className="block font-semibold">
            Upload Academic Documents (PDF, JPG, PNG):
          </label>
          <input
            type="file"
            name="academicDocs"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleChange}
            required
            className="hidden"
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={handleButtonClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            {form.academicDocs ? 'Change File' : 'Choose File'}
          </button>
          {form.academicDocs && (
            <span className="text-sm text-gray-700 truncate max-w-[200px] md:max-w-xs font-medium">{form.academicDocs.name}</span>
          )}
        </div>
        {/* Parent Info */}
        <h2 className="font-semibold text-lg">Parent / Guardian Information</h2>
        <input type="text" name="parentName" placeholder="Parent / Guardian Name" value={form.parentName} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        <PhoneInput country="ug" value={form.parentContact} onChange={handlePhoneChange} inputProps={{ name: 'parentContact', required: true, }} containerClass="mb-4" />
        {/* Email */}
        <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        {/* About the student */}
        <textarea name="about" placeholder="Tell us about the student..." value={form.about} onChange={handleChange} className="w-full border rounded px-3 py-2" rows={4} />
        {/* Consent */}
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" name="consent" checked={form.consent} onChange={handleChange} required />
          <span>I agree to the terms and conditions.</span>
        </label>
        <button type="submit" disabled={!!loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition flex items-center justify-center gap-2">
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Submitting...
            </>
          ) : (
            'Submit Application'
          )}
        </button>
      </form>
    </div>
  </div>
  );
}