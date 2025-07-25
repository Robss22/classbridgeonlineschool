import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl font-serif">CB</span>
              </div>
              <div>
                <span className="text-2xl font-bold font-serif">CLASSBRIDGE</span>
                <div className="text-xs text-gray-300 font-medium tracking-wider">ONLINE SCHOOL</div>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Empowering students worldwide with quality education through innovative online learning experiences 
              and personalized academic support.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors duration-300">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#home" className="text-gray-300 hover:text-blue-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Home
              </a></li>
              <li><a href="#programs" className="text-gray-300 hover:text-blue-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Programs
              </a></li>
              <li><a href="#features" className="text-gray-300 hover:text-blue-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Features
              </a></li>
              <li><a href="#testimonials" className="text-gray-300 hover:text-blue-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Testimonials
              </a></li>
            </ul>
          </div>

          {/* Programs */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif">Our Programs</h3>
            <ul className="space-y-3">
              <li><a href="#cambridge" className="text-gray-300 hover:text-green-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Cambridge
              </a></li>
              <li><a href="#uneb" className="text-gray-300 hover:text-green-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                UNEB
              </a></li>
              <li><a href="#tech" className="text-gray-300 hover:text-green-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Tech Skills
              </a></li>
              <li><a href="#coaching" className="text-gray-300 hover:text-green-300 transition-colors duration-300 flex items-center group">
                <span className="w-0 h-0.5 bg-green-400 transition-all duration-300 group-hover:w-4 mr-2"></span>
                Personal Coaching
              </a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif">Get In Touch</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Phone</p>
                  <a href="tel:+256747808222" className="text-white hover:text-blue-300 transition-colors duration-300 font-medium">
                    +256 747 808 222
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Email</p>
                  <a href="mailto:info@classbridge.com" className="text-white hover:text-purple-300 transition-colors duration-300 font-medium">
                    info@classbridge.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Location</p>
                  <p className="text-white font-medium">Kampala, Uganda</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-gray-700/50 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} ClassBridge Online School. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors duration-300">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
