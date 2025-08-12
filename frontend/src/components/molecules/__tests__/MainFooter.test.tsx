import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MainFooter from '../MainFooter';

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <MainFooter />
    </BrowserRouter>
  );
};

describe('MainFooter', () => {
  test('renders footer with correct role', () => {
    renderComponent();
    
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  test('displays company branding and description', () => {
    renderComponent();
    
    expect(screen.getByText('AusJobs')).toBeInTheDocument();
    expect(screen.getByText("Australia's leading job search platform connecting talent with opportunity.")).toBeInTheDocument();
  });

  test('displays job seeker navigation section', () => {
    renderComponent();
    
    expect(screen.getByText('For Job Seekers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse Jobs' })).toHaveAttribute('href', '/jobs');
    expect(screen.getByRole('link', { name: 'Saved Jobs' })).toHaveAttribute('href', '/saved');
    expect(screen.getByRole('link', { name: 'Career Advice' })).toHaveAttribute('href', '/advice');
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute('href', '/resources');
  });

  test('displays employer navigation section', () => {
    renderComponent();
    
    expect(screen.getByText('For Employers')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Post Jobs' })).toHaveAttribute('href', '/employers');
    expect(screen.getByRole('link', { name: 'Pricing' })).toHaveAttribute('href', '/pricing');
    expect(screen.getByRole('link', { name: 'Hire Talent' })).toHaveAttribute('href', '/post-job');
  });

  test('displays company navigation section', () => {
    renderComponent();
    
    expect(screen.getByText('Company')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'About Us' })).toHaveAttribute('href', '/about');
    expect(screen.getByRole('link', { name: 'Career Vlog' })).toHaveAttribute('href', '/vlog');
    expect(screen.getByRole('link', { name: 'Tech Blog' })).toHaveAttribute('href', '/techblog');
  });

  test('displays legal links section', () => {
    renderComponent();
    
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms-of-service');
    expect(screen.getByRole('link', { name: 'Cookie Policy' })).toHaveAttribute('href', '/cookie-policy');
  });

  test('displays copyright information', () => {
    renderComponent();
    
    expect(screen.getByText('© 2025 AusJobs. All rights reserved.')).toBeInTheDocument();
  });

  test('applies correct CSS classes for responsive layout', () => {
    const { container } = renderComponent();
    
    // Check main grid layout
    const mainGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-4');
    expect(mainGrid).toBeInTheDocument();
    
    // Check footer container
    const footerContainer = container.querySelector('.max-w-6xl.mx-auto');
    expect(footerContainer).toBeInTheDocument();
  });

  test('applies hover effects to navigation links', () => {
    renderComponent();
    
    const browseJobsLink = screen.getByRole('link', { name: 'Browse Jobs' });
    expect(browseJobsLink).toHaveClass('hover:text-pill-text');
    
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(privacyLink).toHaveClass('hover:text-pill-text');
  });

  test('uses semantic HTML structure', () => {
    renderComponent();
    
    // Check for navigation elements
    const navElements = screen.getAllByRole('navigation');
    expect(navElements).toHaveLength(3); // Job Seekers, Employers, Company
    
    // Check for proper heading hierarchy
    const companyHeading = screen.getByRole('heading', { name: 'AusJobs' });
    expect(companyHeading.tagName).toBe('H3');
    
    const sectionHeadings = screen.getAllByRole('heading', { level: 4 });
    expect(sectionHeadings).toHaveLength(3);
    expect(sectionHeadings[0]).toHaveTextContent('For Job Seekers');
    expect(sectionHeadings[1]).toHaveTextContent('For Employers');
    expect(sectionHeadings[2]).toHaveTextContent('Company');
  });

  test('maintains correct spacing between sections', () => {
    const { container } = renderComponent();
    
    // Check for space-y classes on navigation sections
    const navSections = container.querySelectorAll('nav.flex.flex-col.space-y-3');
    expect(navSections).toHaveLength(3);
  });

  test('applies correct text colors throughout footer', () => {
    renderComponent();
    
    // Check main text color
    const mainHeading = screen.getByText('AusJobs');
    expect(mainHeading).toHaveClass('text-main-text');
    
    // Check section heading colors
    const sectionHeading = screen.getByText('For Job Seekers');
    expect(sectionHeading).toHaveClass('text-main-text');
    
    // Check description text color
    const description = screen.getByText("Australia's leading job search platform connecting talent with opportunity.");
    expect(description).toHaveClass('text-searchbar-text');
    
    // Check link text color
    const browseJobsLink = screen.getByRole('link', { name: 'Browse Jobs' });
    expect(browseJobsLink).toHaveClass('text-searchbar-text');
  });

  test('includes proper border styling', () => {
    const { container } = renderComponent();
    
    // Check top border of footer
    const footer = container.querySelector('footer.border-t.border-navbar-border');
    expect(footer).toBeInTheDocument();
    
    // Check border above legal section
    const legalSection = container.querySelector('.border-t.border-navbar-border.mt-8.pt-8');
    expect(legalSection).toBeInTheDocument();
  });

  test('applies responsive flexbox layout for legal section', () => {
    const { container } = renderComponent();
    
    const legalContainer = container.querySelector('.flex.flex-col.md\\:flex-row.justify-between.items-center');
    expect(legalContainer).toBeInTheDocument();
  });

  test('groups legal links appropriately', () => {
    const { container } = renderComponent();
    
    const legalLinksWrapper = container.querySelector('.flex.flex-wrap.gap-6');
    expect(legalLinksWrapper).toBeInTheDocument();
    
    // Check that all legal links are within the wrapper
    const privacyLink = screen.getByRole('link', { name: 'Privacy Policy' });
    const termsLink = screen.getByRole('link', { name: 'Terms of Service' });
    const cookieLink = screen.getByRole('link', { name: 'Cookie Policy' });
    
    expect(legalLinksWrapper).toContainElement(privacyLink);
    expect(legalLinksWrapper).toContainElement(termsLink);
    expect(legalLinksWrapper).toContainElement(cookieLink);
  });

  test('includes transition effects on hover', () => {
    renderComponent();
    
    const allLinks = screen.getAllByRole('link');
    
    allLinks.forEach(link => {
      expect(link).toHaveClass('transition-colors');
    });
  });

  test('applies correct font sizes', () => {
    renderComponent();
    
    // Check main heading font size
    const mainHeading = screen.getByText('AusJobs');
    expect(mainHeading).toHaveClass('text-lg');
    
    // Check section heading font size
    const sectionHeading = screen.getByText('For Job Seekers');
    expect(sectionHeading).toHaveClass('text-[16px]');
    
    // Check description font size
    const description = screen.getByText("Australia's leading job search platform connecting talent with opportunity.");
    expect(description).toHaveClass('text-sm');
    
    // Check link font size
    const browseJobsLink = screen.getByRole('link', { name: 'Browse Jobs' });
    expect(browseJobsLink).toHaveClass('text-sm');
  });

  test('ensures accessibility with proper link text', () => {
    renderComponent();
    
    // Check that all links have descriptive text
    const links = screen.getAllByRole('link');
    
    links.forEach(link => {
      expect(link.textContent).toBeTruthy();
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  test('maintains proper content hierarchy', () => {
    renderComponent();
    
    // Check that section content appears after headings
    const jobSeekersHeading = screen.getByText('For Job Seekers');
    const browseJobsLink = screen.getByRole('link', { name: 'Browse Jobs' });
    
    // The link should appear after its section heading in the document
    expect(jobSeekersHeading.compareDocumentPosition(browseJobsLink))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('uses consistent spacing throughout', () => {
    const { container } = renderComponent();
    
    // Check section spacing
    const sections = container.querySelectorAll('.space-y-4');
    expect(sections.length).toBeGreaterThan(0);
    
    // Check navigation spacing
    const navs = container.querySelectorAll('.space-y-3');
    expect(navs.length).toBeGreaterThan(0);
  });
});