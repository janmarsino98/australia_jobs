import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Download, Mail, Shield, Eye, Database, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();
  const lastUpdated = '21 July 2025';

  const handleDownloadPDF = () => {
    // Generate PDF functionality would be implemented here
    // For now, we'll create a simple text file as a placeholder
    const content = document.getElementById('privacy-content')?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ausjobs-privacy-policy-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Last updated: {lastUpdated}
              </p>
            </div>
            <Button onClick={handleDownloadPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div id="privacy-content" className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                At AusJobs ("we," "our," or "us"), we are committed to protecting and respecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when 
                you visit our website and use our job search platform services.
              </p>
              <p>
                This policy applies to all information collected through our website, mobile applications, 
                and any related services, sales, marketing, or events (collectively, the "Services").
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Personal Information</h3>
                <p className="text-gray-700 mb-4">
                  We may collect personal information that you voluntarily provide to us when you:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Register for an account</li>
                  <li>Upload your resume or CV</li>
                  <li>Apply for jobs through our platform</li>
                  <li>Contact us for support or inquiries</li>
                  <li>Subscribe to our newsletter or communications</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  This information may include: name, email address, phone number, postal address, 
                  employment history, education details, skills, and other professional information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">OAuth and Social Media Information</h3>
                <p className="text-gray-700">
                  When you choose to register or log in using Google or LinkedIn, we collect information 
                  made available to us by these services, including your profile information, email address, 
                  and any other information you have consented to share.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Automatically Collected Information</h3>
                <p className="text-gray-700 mb-2">
                  We automatically collect certain information when you visit our Services, including:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Log information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, time spent, clicks)</li>
                  <li>Device information (device type, unique device identifiers)</li>
                  <li>Location information (general geographic location)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide, operate, and maintain our Services</li>
                <li>Match you with relevant job opportunities</li>
                <li>Process job applications and facilitate communication with employers</li>
                <li>Improve and personalize your user experience</li>
                <li>Send you technical notices, updates, security alerts, and support messages</li>
                <li>Provide customer service and respond to your comments and questions</li>
                <li>Send you marketing communications (with your consent)</li>
                <li>Monitor and analyze usage patterns and trends</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
                <li>Comply with legal obligations and resolve disputes</li>
              </ul>
            </CardContent>
          </Card>

          {/* Data Sharing and Disclosure */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may share your information in the following situations:
              </p>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">With Employers</h3>
                <p className="text-gray-700">
                  When you apply for a job, we share your application information, including your resume 
                  and contact details, with the relevant employer or their authorized representatives.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Service Providers</h3>
                <p className="text-gray-700">
                  We may share your information with third-party service providers who perform services 
                  on our behalf, such as payment processing, data analysis, email delivery, hosting services, 
                  customer service, and marketing assistance.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Legal Requirements</h3>
                <p className="text-gray-700">
                  We may disclose your information if required to do so by law or in response to valid 
                  requests by public authorities (e.g., a court or government agency).
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational security measures to protect your 
                personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>
              <p className="text-gray-700">
                However, please note that no method of transmission over the internet or electronic storage 
                is 100% secure. While we strive to use commercially acceptable means to protect your personal 
                information, we cannot guarantee its absolute security.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We retain your personal information only for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required or permitted 
                by law. When we no longer need your personal information, we will securely delete or 
                anonymize it.
              </p>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Depending on your location, you may have the following rights regarding your personal information:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Right to access your personal information</li>
                <li>Right to correct inaccurate or incomplete information</li>
                <li>Right to delete your personal information</li>
                <li>Right to restrict processing of your information</li>
                <li>Right to data portability</li>
                <li>Right to withdraw consent at any time</li>
                <li>Right to object to processing for marketing purposes</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, please contact us using the information provided below.
              </p>
            </CardContent>
          </Card>

          {/* Cookies and Tracking */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to track activity on our Services and 
                hold certain information. You can instruct your browser to refuse all cookies or to 
                indicate when a cookie is being sent.
              </p>
              <p className="text-gray-700">
                For more detailed information about our use of cookies, please see our Cookie Policy.
              </p>
            </CardContent>
          </Card>

          {/* Third-Party Links */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Links</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Our Services may contain links to third-party websites or services that are not owned 
                or controlled by AusJobs. We have no control over and assume no responsibility for the 
                content, privacy policies, or practices of any third-party websites or services.
              </p>
            </CardContent>
          </Card>

          {/* Changes to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Privacy Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update our Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                We encourage you to review this Privacy Policy periodically for any changes.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">AusJobs Privacy Team</p>
                <p>Email: privacy@ausjobs.com.au</p>
                <p>Phone: 1800 AUS JOBS (1800 287 5627)</p>
                <p>Address: Level 15, 123 Collins Street, Melbourne VIC 3000, Australia</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Back Button */}
        <div className="mt-12 text-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="mx-auto">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;