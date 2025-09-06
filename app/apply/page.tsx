'use client';

import { useState, useEffect, useRef } from 'react'; // Import useRef
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getNames } from 'country-list';

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
    countryCode: '+256', // Added for country code
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

  // Add custom styles for PhoneInput alignment
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .react-tel-input .form-control {
        height: 42px !important;
        border-radius: 0.375rem !important;
        border: 1px solid #d1d5db !important;
        padding: 0.5rem 0.75rem !important;
        font-size: 1rem !important;
        line-height: 1.5 !important;
        width: 100% !important;
        border-left: none !important;
        border-top-left-radius: 0 !important;
        border-bottom-left-radius: 0 !important;
      }
      .react-tel-input .flag-dropdown {
        border-radius: 0.375rem 0 0 0.375rem !important;
        border: 1px solid #d1d5db !important;
        background-color: #f9fafb !important;
        height: 42px !important;
        border-right: 2px solid #d1d5db !important;
        margin-right: 0 !important;
        width: auto !important;
        min-width: 80px !important;
      }
      .react-tel-input .form-control:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 1px #3b82f6 !important;
        outline: none !important;
      }
      .react-tel-input .flag-dropdown.open {
        border-color: #3b82f6 !important;
        border-right-color: #3b82f6 !important;
      }
      .react-tel-input .selected-flag {
        height: 42px !important;
        padding: 0 0.75rem !important;
        border-radius: 0.375rem 0 0 0.375rem !important;
      }
      .react-tel-input .form-control {
        padding-left: 0.75rem !important;
      }
      .react-tel-input {
        display: flex !important;
        align-items: stretch !important;
        gap: 0 !important;
        max-width: 400px !important;
        width: 100% !important;
      }
      .react-tel-input .form-control:focus + .flag-dropdown,
      .react-tel-input .form-control:focus ~ .flag-dropdown {
        border-color: #3b82f6 !important;
        border-right-color: #3b82f6 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
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
          parent_contact: `${form.countryCode}${form.parentContact}`,
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
            application_id: applicationInsertData?.[0]?.application_id
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

      // Mark submission as as completed and show success
      submissionCompletedRef.current = true;
      setMessage('Application submitted successfully!');
      setShowSuccessOverlay(true);

      // Reset form fields
      setForm({
        firstName: '', lastName: '', gender: '', dob: '', nationality: 'Uganda',
        curriculum: '', curriculumName: '', className: '', parentName: '', parentContact: '', email: '',
        about: '', consent: false, academicDocs: null, countryCode: '+256',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Student Application Form
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join Class Bridge Online School and start your educational journey today
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 lg:p-10">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-blue-50 border border-blue-200 text-blue-700'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Info */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Student Information
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  name="firstName" 
                  placeholder="First Name" 
                  value={form.firstName} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
                <input 
                  type="text" 
                  name="lastName" 
                  placeholder="Last Name" 
                  value={form.lastName} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select 
                  name="gender" 
                  value={form.gender} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Gender</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                <input 
                  type="date" 
                  name="dob" 
                  value={form.dob} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
              </div>
              
              <div className="relative">
                <input 
                  type="text" 
                  name="nationality" 
                  placeholder="Nationality" 
                  value={form.nationality} 
                  onChange={handleNationalityChange} 
                  autoComplete="off" 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                />
                {filteredCountries.length > 0 && (
                  <ul className="absolute z-10 max-h-48 w-full overflow-auto border border-gray-200 bg-white rounded-lg shadow-lg mt-1">
                    {filteredCountries.map((country) => (
                      <li key={country} className="cursor-pointer px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0" onClick={() => selectCountry(country)}>
                        {country}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Curriculum and Class selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select 
                  name="curriculum" 
                  value={form.curriculum} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Curriculum</option>
                  {curricula.map((p) => ( 
                    <option key={p.program_id} value={p.program_id}>{p.name}</option> 
                  ))}
                </select>
                <select 
                  name="className" 
                  value={form.className} 
                  onChange={handleChange} 
                  required 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
                  disabled={!form.curriculum}
                >
                  <option value="">Select Class</option>
                  {form.curriculum && (() => {
                    const selectedProgram = curricula.find(p => p.program_id === form.curriculum);
                    const programName = selectedProgram?.name || '';
                    return classesByCurriculum[programName]?.map((cls) => ( 
                      <option key={cls} value={cls}> {cls} </option> 
                    )) || <option value="">No classes available</option>;
                  })()}
                </select>
              </div>
            </div>
            
            {/* Academic Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Academic Documents</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className="text-sm font-medium text-gray-700">
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {form.academicDocs ? 'Change File' : 'Choose File'}
                </button>
              </div>
              {form.academicDocs && (
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <span className="font-medium">Selected:</span> {form.academicDocs.name}
                </div>
              )}
            </div>
            
            {/* Parent Info */}
            <div className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 border-b border-gray-200 pb-2">
                Parent / Guardian Information
              </h2>
              
              <input 
                type="text" 
                name="parentName" 
                placeholder="Parent / Guardian Name" 
                value={form.parentName} 
                onChange={handleChange} 
                required 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              />
              
              {/* Custom Phone Input Layout */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-32">
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 h-[50px] bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    value={form.countryCode || '+256'}
                    onChange={(e) => setForm(f => ({ ...f, countryCode: e.target.value }))}
                  >
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+39">🇮🇹 +39</option>
                    <option value="+34">🇪🇸 +34</option>
                  </select>
                </div>
                <div className="flex-1">
                  <input 
                    type="tel" 
                    name="parentContact" 
                    placeholder="Phone Number" 
                    value={form.parentContact} 
                    onChange={(e) => setForm(f => ({ ...f, parentContact: e.target.value }))}
                    required 
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 h-[50px] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
              
              <input 
                type="email" 
                name="email" 
                placeholder="Email Address" 
                value={form.email} 
                onChange={handleChange} 
                required 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200" 
              />
            </div>
            
            {/* About the student */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">About the Student</label>
              <textarea 
                name="about" 
                placeholder="Tell us about the student..." 
                value={form.about} 
                onChange={handleChange} 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none" 
                rows={4} 
              />
            </div>
            
            {/* Consent */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="consent" 
                  checked={form.consent} 
                  onChange={handleChange} 
                  required 
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  I agree to the terms and conditions and consent to the processing of my personal data for the purpose of this application.
                </span>
              </label>
            </div>
            
            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
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

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-6">{successMessageContent}</p>
            <button
              onClick={handleSuccessOk}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}