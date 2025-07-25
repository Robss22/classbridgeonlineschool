import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'CLASSBRIDGE Online School',
  description: 'Learn, Apply, and Grow with CLASSBRIDGE Online School',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head />
      <body className="bg-transparent text-gray-900 flex flex-col min-h-screen">

        {/* Modern Header with Glassmorphism */}
        <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
          <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link href="/home" className="flex items-center space-x-3 group">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <span className="text-white font-bold text-xl">CB</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  CLASSBRIDGE
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <ul className="hidden md:flex items-center space-x-8">
              <li>
                <Link href="/home" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:scale-105">
                  Home
                </Link>
              </li>

              <li className="relative group">
                <Link
                  href="#"
                  className="text-gray-700 hover:text-blue-600 font-medium cursor-pointer transition-all duration-300 hover:scale-105 flex items-center space-x-1"
                >
                  <span>Our Programs</span>
                  <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Modern Dropdown */}
                <ul className="absolute left-0 mt-3 w-56 bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 group-hover:visible transition-all duration-300 invisible transform scale-95 group-hover:scale-100">
                  <li>
                    <Link href="/programs/cambridge" className="block px-6 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-t-2xl transition-all duration-200">
                      Cambridge
                    </Link>
                  </li>
                  <li>
                    <Link href="/programs/uneb" className="block px-6 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                      UNEB
                    </Link>
                  </li>
                  <li>
                    <Link href="/programs/tech-skills" className="block px-6 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200">
                      Tech Skills
                    </Link>
                  </li>
                  <li>
                    <Link href="/programs/coaching" className="block px-6 py-3 text-gray-800 hover:bg-blue-50 hover:text-blue-600 rounded-b-2xl transition-all duration-200">
                      Coaching
                    </Link>
                  </li>
                </ul>
              </li>

              <li>
                <Link href="/apply" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:scale-105">
                  Apply
                </Link>
              </li>
              <li>
                <Link href="/calendar" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:scale-105">
                  Calendar
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-300 hover:scale-105">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/login" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all duration-300">
                  Login
                </Link>
              </li>
            </ul>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-gray-700 hover:text-blue-600 transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </nav>
        </header>

        <main className="flex-grow pt-20">
          {children}
        </main>

        {/* Modern Footer */}
        <footer className="bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 text-white py-12">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* Company Info */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold">CB</span>
                  </div>
                  <span className="text-xl font-bold">CLASSBRIDGE</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Empowering students with quality education through innovative online learning experiences.
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                <ul className="space-y-2">
                  <li><Link href="/home" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Home</Link></li>
                  <li><Link href="/programs" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Programs</Link></li>
                  <li><Link href="/apply" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Apply</Link></li>
                  <li><Link href="/contact" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Contact</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Legal</h3>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">Terms of Service</Link></li>
                  <li><Link href="/faq" className="text-gray-300 hover:text-blue-300 transition-colors duration-200">FAQ</Link></li>
                </ul>
              </div>

              {/* Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Contact Info</h3>
                <div className="space-y-2">
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Phone:</span>{' '}
                    <a href="tel:+256747808222" className="hover:text-blue-300 transition-colors duration-200">
                      0747808222
                    </a>
                  </p>
                  <p className="text-gray-300 text-sm">
                    <span className="font-medium">Email:</span>{' '}
                    <a href="mailto:info@classbridge.com" className="hover:text-blue-300 transition-colors duration-200">
                      info@classbridge.com
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Footer */}
            <div className="border-t border-gray-700 mt-8 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} CLASSBRIDGE Online School. All rights reserved.
              </p>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}