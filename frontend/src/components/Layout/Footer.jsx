import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border py-6 px-4 mt-auto text-sm text-muted-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Copyright */}
        <div className="text-center md:text-left">
          &copy; {currentYear} ProjectFlow. All rights reserved.
        </div>

        {/* Links */}
        <div className="flex gap-6">
          <a
            href="#"
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:text-primary transition-colors"
          >
            Terms of Service
          </a>
        </div>

        {/* Version */}
        <div className="text-xs text-muted-foreground/80">v1.0.0 Beta</div>
      </div>
    </footer>
  );
};

export default Footer;