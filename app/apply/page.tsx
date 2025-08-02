'use client';

import { useState, useEffect, useRef } from 'react'; // Import useRef
import { supabase } from '@/lib/supabaseClient';
import { getNames } from 'country-list';
import 'react-phone-input-2/lib/style.css';
import dynamic from 'next/dynamic';
const PhoneInput = dynamic(() => import('react-phone-input-2'), { ssr: false });

export default function ApplyPage() {
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
    academicDocs: null,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);

  const [curricula, setCurricula] = useState<{ program_id: string; name: string }[]>([]);
  const [classesByCurriculum, setClassesByCurriculum] = useState({});

  const countries = getNames();
  const [filteredCountries, setFilteredCountries] = useState([]);

  // New state for success message overlay
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successMessageContent, setSuccessMessageContent] = useState('');

  // Ref for the hidden file input
  const fileInputRef = useRef(null);

  useEffect(() => {
    // START: Logging for initial data fetch in useEffect
    console.log('useEffect: Initiating fetch for programs, classes, and session.');

    async function fetchProgramsAndClasses() {
      console.log('fetchProgramsAndClasses: Fetching programs from Supabase...');
      let { data: programs, error: programsError } = await supabase
        .from('programs')
        .select('program_id, name')
        .order('name');

      if (programsError) {
        console.error('fetchProgramsAndClasses: Error fetching programs:', programsError);
        return; // Exit if programs cannot be fetched
      }
      console.log('fetchProgramsAndClasses: Programs fetched successfully. Count:', programs.length);
      setCurricula(programs); // Store as array of objects

      console.log('fetchProgramsAndClasses: Fetching levels from Supabase...');
      let { data: levels, error: levelsError } = await supabase
        .from('levels')
        .select('name, program_id')
        .order('name');

      if (levelsError) {
        console.error('fetchProgramsAndClasses: Error fetching levels:', levelsError);
        return; // Exit if levels cannot be fetched
      }
      console.log('fetchProgramsAndClasses: Levels fetched successfully. Count:', levels.length);

      const programIdToName = {};
      programs.forEach((p) => {
        programIdToName[p.program_id] = p.name;
      });

      const grouped = {};
      levels.forEach((level) => {
        const programName = programIdToName[level.program_id] || 'Unknown Program';
        if (!grouped[programName]) grouped[programName] = [];
        grouped[programName].push(level.name);
      });

      setClassesByCurriculum(grouped);

      console.log('fetchProgramsAndClasses: Curricula state updated.');
      console.log('fetchProgramsAndClasses: Classes by Curriculum state updated.');
    }

    fetchProgramsAndClasses(); // Call the async function

    async function getSession() {
      console.log('getSession: Attempting to get Supabase session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('getSession: Error getting Supabase session:', error);
        setSessionInfo('Error: Could not get session.');
      } else if (session) {
        console.log('getSession: Supabase Session (Authenticated):', session);
        setSessionInfo(`Authenticated User ID: ${session.user.id}, Role: ${session.user.role}`);
      } else {
        console.log('getSession: Supabase Session (Anon): No active session, likely anon user.');
        setSessionInfo('No active session (Anon user)');
      }
    }
    getSession(); // Call the async function
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
      console.log(`handleChange: File selected for ${name}:`, files && files[0]?.name);
      setForm((f) => ({ ...f, [name]: files && files[0] ? files[0] : null }));
    } else {
      setForm((f) => {
        if (name === 'curriculum') {
          const selectedProgram = curricula.find(p => p.program_id === value);
          return { ...f, curriculum: value, curriculumName: selectedProgram ? selectedProgram.name : '', className: '' };
        }
        console.log(`handleChange: Setting form field ${name} to ${value}`);
        return { ...f, [name]: value };
      });
    }
  }

  function handlePhoneChange(value: string) {
    console.log('handlePhoneChange: Parent contact updated to:', value);
    setForm((f) => ({ ...f, parentContact: value }));
  }

  // New function to handle "OK" click on success message
  const handleSuccessOk = () => {
    setShowSuccessOverlay(false); // Hide the overlay
    window.location.reload(); // Reload the page
  };

  // Function to programmatically click the hidden file input
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('handleSubmit: Form submission initiated.');
    console.log('handleSubmit: Current form state:', form);

    if (!form.consent) {
      setMessage('You must agree to the consent.');
      console.log('handleSubmit: Submission blocked - Consent not checked.');
      return;
    }

    if (!form.academicDocs) {
      setMessage('Academic documents are required.');
      console.log('handleSubmit: Submission blocked - Academic documents not provided.');
      return;
    }

    setLoading(true);
    setMessage('');
    console.log('handleSubmit: Loading state set to true, message cleared.');

    try {
      let academicDocsUrl = null;
      if (form.academicDocs) {
        console.log('handleSubmit: Attempting to upload academic documents to Supabase Storage.');
        const fileExt = form.academicDocs.name.split('.').pop();
        const fileName = `${form.firstName}_${form.lastName}_${Date.now()}.${fileExt}`;

        console.log('handleSubmit: File to upload:', form.academicDocs.name);
        console.log('handleSubmit: Calculated storage fileName:', fileName);

        const { data, error: uploadError } = await supabase.storage
          .from('academic-docs')
          .upload(fileName, form.academicDocs);

        if (uploadError) {
          console.error('handleSubmit: ERROR uploading academic documents:', uploadError);
          setMessage('Error uploading academic documents: ' + uploadError.message);
          throw uploadError;
        }
        academicDocsUrl = supabase.storage.from('academic-docs').getPublicUrl(fileName).data.publicUrl;
        console.log('handleSubmit: Academic documents uploaded successfully. Public URL:', academicDocsUrl);
      } else {
        console.log('handleSubmit: No academic documents provided for upload.');
      }

      console.log('handleSubmit: Attempting to insert application data into "applications" table.');
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
        console.error('handleSubmit: ERROR inserting application data into Supabase DB:', applicationInsertError);
        setMessage('Error submitting application data: ' + applicationInsertError.message);
        throw applicationInsertError;
      }
      console.log('handleSubmit: Application data inserted successfully. Application ID:', applicationInsertData[0].application_id);

      // --- CRITICAL LOGGING AROUND EDGE FUNCTION INVOCATION ---
      console.log('handleSubmit: Attempting to invoke "send-confirmation-email" Edge Function.');
      const edgeFunctionPayload = {
        application: {
          ...form,
          document_url: academicDocsUrl,
          application_id: applicationInsertData[0].application_id
        }
      };
      console.log('handleSubmit: Payload being sent to Edge Function:', JSON.stringify(edgeFunctionPayload, null, 2));

      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-confirmation-email', {
        body: edgeFunctionPayload,
      });

      if (emailError) {
        console.error('handleSubmit: ERROR during Edge Function invocation!', emailError);
        if (emailError.context && typeof emailError.context === 'object') {
          console.error('handleSubmit: Edge Function error context:', emailError.context);
          if (emailError.context.details) {
            console.error('handleSubmit: Edge Function error context details:', emailError.context.details);
          }
          if (emailError.context.status) {
            console.error('handleSubmit: Edge Function response status:', emailError.context.status);
          }
        }
        // Set an error message but still allow the success overlay to appear for the main submission success
        setMessage('Application submitted, but failed to send confirmation email. Please contact support. Error: ' + (emailError.message || 'Unknown email error.'));
        setSuccessMessageContent('Your application has been submitted, but we encountered an issue sending the confirmation email. Please contact support if you do not receive it within an hour.');
        setShowSuccessOverlay(true);

      } else {
        console.log('handleSubmit: SUCCESS: Confirmation email function invoked successfully.', emailData);
        setSuccessMessageContent('Your application has been submitted successfully! \n A confirmation email has been sent to your parent email. \n Your Application will be processed after confirmation of the Application fee: Ugx 50000/= \n For help 0747808222');
        setShowSuccessOverlay(true); // Show the success overlay
      }

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
      console.error('handleSubmit: Catch block - General error during application submission:', err);
      setMessage('Error submitting application: ' + err.message);
    } finally {
      setLoading(false);
      console.log('handleSubmit: Form submission process completed. Loading state set to false.');
    }
  }

  return (
    <div className="bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 min-h-screen flex items-center justify-center py-12 px-2">
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

        <p className={`mb-4 ${message.startsWith('Error') || message.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>

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
            {form.curriculum && classesByCurriculum[form.curriculum]?.map((cls) => ( <option key={cls} value={cls}> {cls} </option> )) || <option value="">No classes available</option>}
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
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  </div>
  );
}