import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">SE</span>
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight">Shraddha</span>
                <span className="text-primary-foreground/70 text-sm block -mt-1">Enterprises</span>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted partner for industrial products. Quality, reliability, and service excellence since establishment.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'Home', path: '/' },
                { name: 'Products', path: '/products' },
                { name: 'Videos', path: '/videos' },
                { name: 'Contact', path: '/contact' },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                    data-testid={`footer-link-${link.name.toLowerCase()}`}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                <span className="text-primary-foreground/70">
                  Indradhanu, Sector No. 21, Scheme No. 4, Plot No. 78, 
                  Yamunanagar, Nigdi, Pune – 411044, Maharashtra, India
                </span>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-accent flex-shrink-0" />
                <a href="tel:+919876543210" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-accent flex-shrink-0" />
                <a href="mailto:info@shraddhaenterprises.com" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  info@shraddhaenterprises.com
                </a>
              </li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="font-bold text-lg mb-4">Business Hours</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                <div className="text-primary-foreground/70">
                  <p>Monday - Saturday</p>
                  <p className="font-medium text-primary-foreground">9:00 AM - 6:00 PM</p>
                </div>
              </li>
              <li className="text-primary-foreground/70 text-sm ml-7">
                Sunday: Closed
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} Shraddha Enterprises. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-primary-foreground/50 hover:text-accent text-sm transition-colors" data-testid="admin-link">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
