'use client';

import { useState } from 'react';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send message.');
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-200 to-blue-300 py-12 px-2 flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl mx-auto text-center mb-8">
        <div className="flex flex-col items-center mb-2">
          <div className="rounded-full bg-gradient-to-tr from-blue-400 to-blue-500 p-3 mb-4">
            <span className="text-white"><FaEnvelope size={28} /></span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 mb-2">Get in touch with us,<br />We&apos;re here to assist you</h1>
          <p className="text-blue-900 mb-2">Fill out the form below and our team will get back to you shortly.<br />We value your feedback and inquiries.</p>
        </div>
      </div>
      <div className="w-full max-w-4xl bg-white border border-blue-200 rounded-2xl shadow-lg p-6 sm:p-8 mb-8 mx-auto">
        {submitted ? (
          <div className="bg-green-100 text-green-700 p-4 rounded text-center">Thank you for reaching out! We&apos;ll get back to you soon.</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && <div className="bg-red-100 text-red-700 p-2 rounded text-center mb-2">{errorMsg}</div>}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-blue-200 rounded-md px-4 py-2 text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-transparent border border-blue-200 rounded-md px-4 py-2 text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-transparent border border-blue-200 rounded-md px-4 py-2 text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <textarea
                name="message"
                placeholder="Message"
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-transparent border border-blue-200 rounded-md px-4 py-2 text-blue-900 placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-fit px-8 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white font-semibold rounded-md shadow hover:from-blue-500 hover:to-blue-700 transition flex items-center gap-2 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Sending...' : <>Send Message <span className="text-lg">→</span></>}
            </button>
          </form>
        )}
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 mx-auto">
        <div className="bg-white border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center">
          <span className="text-blue-500 mb-2"><FaEnvelope size={24} /></span>
          <div className="text-blue-700 font-semibold mb-1">Email Address</div>
          <div className="text-blue-900 text-lg mb-1">info@classbridge.ac.ug</div>
          <div className="text-blue-400 text-xs flex items-center justify-center gap-1"><span className="inline mr-1"><FaClock size={16} /></span> Monday - Friday 8 am to 5 pm EAT</div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-6 flex flex-col items-center text-center">
          <span className="text-blue-500 mb-2"><FaPhone size={24} /></span>
          <div className="text-blue-700 font-semibold mb-1">Contact info</div>
          <div className="text-blue-900 text-lg mb-1">+256 747 808 222</div>
          <div className="text-blue-400 text-xs flex items-center justify-center gap-1"><span className="inline mr-1"><FaClock size={16} /></span> Monday - Friday 8 am to 5 pm EAT</div>
        </div>
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 mx-auto">
        <div className="bg-white border border-blue-200 rounded-xl p-6 flex items-center gap-4">
          <span className="text-blue-500"><FaMapMarkerAlt size={24} /></span>
          <div>
            <div className="text-blue-700 font-semibold">Office Location</div>
            <div className="text-blue-900">Kampala, Uganda</div>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-xl p-6 flex items-center gap-4">
          <span className="text-blue-500"><FaClock size={24} /></span>
          <div>
            <div className="text-blue-700 font-semibold">Working Hours</div>
            <div className="text-blue-900">Monday - Friday, 8 am to 5 pm EAT</div>
          </div>
        </div>
      </div>
    </div>
  );
}
