'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
    },
  },
};

// Animation for each letter
const letterVariants = {
  initial: { y: 40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.4 } },
};

const wordStagger = {
  animate: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

export default function HomePage() {
  // Ensure the function returns valid JSX
  return (
    <main className="flex-1 w-full">
      {/* Hero Section with Background Image */}
      <section
        id="hero"
        className="relative flex items-center justify-center min-h-screen text-center text-white pt-24"
        style={{
          backgroundImage: 'url("/images/hero-background.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Content */}
        <div className="relative z-10 p-8 max-w-5xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            <span className="block bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              CLASSBRIDGE
            </span>
            <span className="block text-4xl md:text-5xl mt-2 font-light">
              ONLINE SCHOOL
            </span>
          </h1>
          <p className="text-xl md:text-2xl font-light mb-8 text-blue-100 max-w-3xl mx-auto">
            Learning without Boundaries - Transform your future with expert instruction, 
            flexible learning, and career-focused programs designed for success.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/our-programs/uneb" className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-blue-500/25">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              National (UNEB)
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/our-programs/cambridge" className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-4 px-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/25">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
              Cambridge
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/our-programs/tech-skills" className="group inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 px-8 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-purple-500/25">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              Tech Skills
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {/* Additional CTA */}
          <div className="mt-8">
            <Link href="/apply" className="inline-flex items-center gap-2 text-white hover:text-blue-200 font-medium transition-all duration-300 underline decoration-2 underline-offset-4 hover:underline-offset-8">
              Start Your Journey Today
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        id="stats"
        className="stats-section py-20 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="section-title text-center mb-12">Why Choose CLASSBRIDGE?</h2>
            <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              <div className="stat-card text-center">
                <div className="stat-number text-4xl font-bold text-blue-600">500+</div>
                <div className="stat-label text-gray-700">Students Enrolled</div>
              </div>
              <div className="stat-card text-center">
                <div className="stat-number text-4xl font-bold text-green-600">95%</div>
                <div className="stat-label text-gray-700">Success Rate</div>
              </div>
              <div className="stat-card text-center">
                <div className="stat-number text-4xl font-bold text-purple-600">50+</div>
                <div className="stat-label text-gray-700">Expert Instructors</div>
          </div>
              <div className="stat-card text-center">
                <div className="stat-number text-4xl font-bold text-blue-800">24/7</div>
                <div className="stat-label text-gray-700">Learning Support</div>
          </div>
        </div>
      </div>
    </section>

      {/* Features Section */}
      <section
        id="features"
        className="features-section py-20 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="section-title text-center mb-12">Why Choose CLASSBRIDGE?</h2>
            <div className="features-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Expert Curriculum</h3>
                <p className="feature-description text-gray-700">
                Carefully designed courses by industry professionals and academic experts, 
                ensuring you learn the most relevant and up-to-date skills.
              </p>
            </div>

              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Flexible Learning</h3>
                <p className="feature-description text-gray-700">
                Study at your own pace with 24/7 access to course materials, 
                live sessions, and recorded lectures that fit your schedule.
              </p>
            </div>

              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Personal Support</h3>
                <p className="feature-description text-gray-700">
                Get one-on-one guidance from dedicated mentors and join a 
                vibrant community of learners supporting each other.
              </p>
            </div>

              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Certified Programs</h3>
                <p className="feature-description text-gray-700">
                Earn recognized certifications that boost your career prospects 
                and demonstrate your expertise to employers worldwide.
              </p>
            </div>

              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Career Ready</h3>
                <p className="feature-description text-gray-700">
                Bridge the gap between learning and employment with practical 
                projects, internships, and direct connections to industry partners.
              </p>
            </div>

              <div className="feature-card bg-white p-8 rounded-2xl shadow-lg">
                <div className="feature-icon mb-6">
                  <svg className="w-12 h-12 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
                <h3 className="feature-title text-2xl font-bold mb-4">Innovation Focus</h3>
                <p className="feature-description text-gray-700">
                Stay ahead with cutting-edge technology, modern teaching methods, 
                and access to the latest tools and resources in your field.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section
        id="programs"
        className="programs-section py-20 bg-white"
      >
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="section-title text-center mb-12">Our Programs</h2>
            <div className="programs-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
              <div className="program-card bg-gray-100 p-8 rounded-2xl shadow-lg">
              <div className="feature-icon mx-auto mb-4">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                </svg>
              </div>
                <h3 className="program-title text-2xl font-bold mb-4">Cambridge Programs</h3>
                <p className="program-description text-gray-700">
                Comprehensive Cambridge curriculum preparation with expert tutors 
                and proven success strategies for IGCSE and A-Level students.
              </p>
                <Link href="/our-programs/cambridge" className="program-cta inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 underline decoration-2 underline-offset-4 hover:underline-offset-8">
                Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </Link>
            </div>

              <div className="program-card bg-gray-100 p-8 rounded-2xl shadow-lg">
              <div className="feature-icon mx-auto mb-4">
                  <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
                <h3 className="program-title text-2xl font-bold mb-4">UNEB Programs</h3>
                <p className="program-description text-gray-700">
                Specialized coaching for UNEB examinations with local expertise 
                and deep understanding of the Ugandan education system.
              </p>
                <Link href="/programs/uneb" className="program-cta inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 underline decoration-2 underline-offset-4 hover:underline-offset-8">
                Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </Link>
            </div>

              <div className="program-card bg-gray-100 p-8 rounded-2xl shadow-lg">
              <div className="feature-icon mx-auto mb-4">
                  <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
                <h3 className="program-title text-2xl font-bold mb-4">Tech Skills</h3>
                <p className="program-description text-gray-700">
                Future-ready technology courses covering programming, web development, 
                data science, and digital marketing for the modern workforce.
              </p>
                <Link href="/programs/tech-skills" className="program-cta inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 underline decoration-2 underline-offset-4 hover:underline-offset-8">
                Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </Link>
            </div>

              <div className="program-card bg-gray-100 p-8 rounded-2xl shadow-lg">
              <div className="feature-icon mx-auto mb-4">
                  <svg className="w-12 h-12 text-purple-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
                <h3 className="program-title text-2xl font-bold mb-4">Personal Coaching</h3>
                <p className="program-description text-gray-700">
                One-on-one mentorship and career guidance to help you achieve 
                your academic and professional goals with personalized support.
              </p>
                <Link href="/programs/coaching" className="program-cta inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 underline decoration-2 underline-offset-4 hover:underline-offset-8">
                Learn More
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        id="cta"
        className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800"
      >
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Future?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of successful students who have accelerated their careers 
            through our innovative online education platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/apply" className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-50 transition-all duration-300 hover:scale-105 shadow-lg">
              Get Started Today
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300 hover:scale-105">
              Talk to an Advisor
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 bg-gray-50"
      >
        <div className="max-w-6xl mx-auto px-4">
            <h2 className="section-title text-center mb-12">What Our Students Say</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  A
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Amina K.</h4>
                  <p className="text-gray-600 text-sm">Cambridge A-Level Student</p>
                </div>
              </div>
                      <p className="text-gray-700 italic">
                        &quot;CLASSBRIDGE helped me achieve straight A&apos;s in my A-Levels. The personalized attention and expert guidance made all the difference!&quot;
              </p>
            </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  D
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">David M.</h4>
                  <p className="text-gray-600 text-sm">Tech Skills Graduate</p>
                </div>
              </div>
                      <p className="text-gray-700 italic">
                        &quot;The programming courses were incredibly practical. I landed my dream job as a software developer within 3 months of graduation!&quot;
              </p>
            </div>

              <div className="bg-white p-8 rounded-2xl shadow-lg">
              <div className="flex items-center mb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900">Sarah N.</h4>
                  <p className="text-gray-600 text-sm">UNEB Student</p>
                </div>
              </div>
                      <p className="text-gray-700 italic">
                        &quot;The flexible learning schedule allowed me to balance work and studies. I&apos;m now pursuing my university dreams!&quot;
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}