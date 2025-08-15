'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

const links = [
  { name: 'Dashboard', href: '/admin/dashboard' },
  { name: 'Assessments', href: '/assessments' },
  { name: 'Applications', href: '/admin/applications' },
  { name: 'Classes', href: '/admin/classes' },
  { name: 'Live Classes', href: '/admin/live-classes' },
  { name: 'Subjects', href: '/admin/subjects' },
  { name: 'Timetable', href: '/admin/timetable' },
  { name: 'Users', href: '/admin/users' },
  { name: 'Programs', href: '/admin/programs' },
  { name: 'Resources', href: '/admin/resources' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <div className="lg:hidden">
      {/* Mobile Menu Button - styled like teacher hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center p-2 rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-label="Toggle mobile menu"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute top-16 left-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Admin Navigation</h3>
              <nav className="space-y-2">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-lg transition-colors
                      ${pathname === link.href 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
