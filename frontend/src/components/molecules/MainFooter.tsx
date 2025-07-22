import { Link } from "react-router-dom";

const MainFooter = () => {
  return (
    <footer className="w-full bg-white border-t border-navbar-border mt-[100px]">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-main-text">AusJobs</h3>
            <p className="text-sm text-searchbar-text">
              Australia's leading job search platform connecting talent with opportunity.
            </p>
          </div>

          {/* Job Seekers */}
          <div className="space-y-4">
            <h4 className="text-[16px] font-medium text-main-text">For Job Seekers</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/jobs" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Browse Jobs
              </Link>
              <Link to="/saved" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Saved Jobs
              </Link>
              <Link to="/advice" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Career Advice
              </Link>
              <Link to="/resources" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Resources
              </Link>
            </nav>
          </div>

          {/* Employers */}
          <div className="space-y-4">
            <h4 className="text-[16px] font-medium text-main-text">For Employers</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/employers" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Post Jobs
              </Link>
              <Link to="/pricing" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Pricing
              </Link>
              <Link to="/post-job" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Hire Talent
              </Link>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-[16px] font-medium text-main-text">Company</h4>
            <nav className="flex flex-col space-y-3">
              <Link to="/about" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                About Us
              </Link>
              <Link to="/vlog" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Career Vlog
              </Link>
              <Link to="/techblog" className="text-sm text-searchbar-text hover:text-pill-text transition-colors">
                Tech Blog
              </Link>
            </nav>
          </div>
        </div>

        {/* Legal Links Section */}
        <div className="border-t border-navbar-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-6">
              <Link 
                to="/privacy-policy" 
                className="text-sm text-searchbar-text hover:text-pill-text transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                to="/terms-of-service" 
                className="text-sm text-searchbar-text hover:text-pill-text transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/cookie-policy" 
                className="text-sm text-searchbar-text hover:text-pill-text transition-colors"
              >
                Cookie Policy
              </Link>
            </div>
            <p className="text-sm text-searchbar-text">
              © 2025 AusJobs. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
