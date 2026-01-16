import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, Phone, MessageSquare } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '../ui/sheet';
import QueryModal from '../common/QueryModal';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Products', path: '/products' },
  { name: 'Videos', path: '/videos' },
  { name: 'Contact', path: '/contact' },
];

export const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2" data-testid="navbar-logo">
              <div className="w-10 h-10 bg-accent rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-lg">SE</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg tracking-tight">Shraddha</span>
                <span className="text-muted-foreground text-sm block -mt-1">Enterprises</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  data-testid={`nav-link-${link.name.toLowerCase()}`}
                  className={`font-medium text-sm uppercase tracking-wide transition-colors ${
                    isActive(link.path)
                      ? 'text-accent'
                      : 'text-foreground hover:text-accent'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="theme-toggle-btn"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button
                onClick={() => setQueryModalOpen(true)}
                data-testid="contact-us-btn"
                className="bg-accent text-white hover:bg-accent/90"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Us
              </Button>
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="mobile-theme-toggle"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              
              {/* Call Now - Mobile Only */}
              <a href="tel:+919876543210" data-testid="call-now-btn">
                <Button variant="outline" size="sm" className="border-accent text-accent">
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
              </a>

              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex flex-col gap-6 mt-8">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setMobileOpen(false)}
                        data-testid={`mobile-nav-${link.name.toLowerCase()}`}
                        className={`font-medium text-lg transition-colors ${
                          isActive(link.path)
                            ? 'text-accent'
                            : 'text-foreground hover:text-accent'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                    <div className="border-t border-border pt-4 mt-2">
                      <Button
                        onClick={() => {
                          setMobileOpen(false);
                          setQueryModalOpen(true);
                        }}
                        className="w-full bg-accent text-white hover:bg-accent/90"
                        data-testid="mobile-contact-btn"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Contact Us
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      <QueryModal open={queryModalOpen} onOpenChange={setQueryModalOpen} />
    </>
  );
};

export default Navbar;
