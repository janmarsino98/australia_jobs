import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Download, Mail, Scale, Users, AlertTriangle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TermsOfServicePage = () => {
  const navigate = useNavigate();
  const lastUpdated = '21 July 2025';

  const handleDownloadPDF = () => {
    const content = document.getElementById('terms-content')?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ausjobs-terms-of-service-${new Date().toISOString().split('T')[0]}.txt`;
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
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
        <div id="terms-content" className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-blue-600" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Welcome to AusJobs. These Terms of Service ("Terms") govern your use of our website, 
                mobile applications, and related services (collectively, the "Services") operated by 
                AusJobs Pty Ltd ("AusJobs," "we," "our," or "us").
              </p>
              <p>
                By accessing or using our Services, you agree to be bound by these Terms. If you 
                disagree with any part of these terms, then you may not access the Services.
              </p>
            </CardContent>
          </Card>

          {/* Eligibility */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-600" />
                Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                You must be at least 18 years old to use our Services. By using our Services, you 
                represent and warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>You are at least 18 years of age</li>
                <li>You have the legal capacity to enter into these Terms</li>
                <li>You will use the Services in compliance with these Terms and applicable laws</li>
                <li>All information you provide is accurate, current, and complete</li>
              </ul>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Account Creation</h3>
                <p className="text-gray-700">
                  To access certain features of our Services, you may be required to create an account. 
                  You can register using your email address or through third-party authentication 
                  services like Google or LinkedIn.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Account Security</h3>
                <p className="text-gray-700 mb-2">
                  You are responsible for maintaining the confidentiality of your account credentials and 
                  for all activities that occur under your account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Keep your password secure and confidential</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Not share your account with others</li>
                  <li>Log out of your account at the end of each session</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Acceptable Use Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700 mb-4">You agree not to use the Services to:</p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others, including intellectual property rights</li>
                <li>Upload or distribute malicious software, viruses, or harmful code</li>
                <li>Engage in fraudulent, deceptive, or misleading activities</li>
                <li>Harass, abuse, or harm another person or group</li>
                <li>Spam or send unsolicited communications</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Post false, inaccurate, or misleading information</li>
                <li>Use automated systems or bots to access the Services</li>
                <li>Interfere with or disrupt the Services or servers</li>
              </ul>
            </CardContent>
          </Card>

          {/* Job Seekers */}
          <Card>
            <CardHeader>
              <CardTitle>For Job Seekers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Resume and Profile Information</h3>
                <p className="text-gray-700">
                  You are responsible for ensuring that all information in your profile and resume 
                  is accurate, current, and truthful. You grant us permission to share this information 
                  with potential employers when you apply for jobs.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Job Applications</h3>
                <p className="text-gray-700">
                  When you apply for a job through our platform, you authorize us to share your 
                  application materials with the employer. We are not responsible for the employer's 
                  use of your information or their hiring decisions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Employers */}
          <Card>
            <CardHeader>
              <CardTitle>For Employers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Job Postings</h3>
                <p className="text-gray-700 mb-2">
                  Employers may post job openings on our platform. You warrant that your job postings:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Are for legitimate job opportunities</li>
                  <li>Comply with all applicable employment laws</li>
                  <li>Do not discriminate based on protected characteristics</li>
                  <li>Are accurate and not misleading</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Candidate Data</h3>
                <p className="text-gray-700">
                  You agree to use candidate information only for legitimate recruitment purposes 
                  and in compliance with applicable privacy and employment laws. You may not share 
                  candidate information with third parties without proper authorization.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Content and Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Content and Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Our Content</h3>
                <p className="text-gray-700">
                  The Services and all content, features, and functionality are owned by AusJobs and 
                  are protected by copyright, trademark, and other intellectual property laws.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">User Content</h3>
                <p className="text-gray-700">
                  You retain ownership of content you upload to our Services. However, you grant us 
                  a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and 
                  distribute your content in connection with our Services.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Premium Services</h3>
                <p className="text-gray-700">
                  Some features of our Services may require payment. All fees are in Australian Dollars 
                  (AUD) unless otherwise specified. Payments are processed securely through our 
                  payment processor.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Refunds</h3>
                <p className="text-gray-700">
                  Refund policies vary by service type. Premium subscription refunds are subject to 
                  our refund policy. Please contact customer support for refund requests.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer of Warranties */}
          <Card>
            <CardHeader>
              <CardTitle>Disclaimer of Warranties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. 
                WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>WARRANTIES OF NON-INFRINGEMENT</li>
                <li>WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE</li>
                <li>WARRANTIES REGARDING THE ACCURACY OR RELIABILITY OF CONTENT</li>
              </ul>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AUSJOBS SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
                LOSS OF PROFITS, DATA, OR USE, ARISING OUT OF OR RELATING TO YOUR USE OF THE SERVICES.
              </p>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the Services immediately, 
                without prior notice, if you breach these Terms or engage in prohibited conduct.
              </p>
              <p className="text-gray-700">
                You may terminate your account at any time by contacting us or using the account 
                deletion feature in your settings.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law and Jurisdiction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                These Terms are governed by the laws of Victoria, Australia. Any disputes arising 
                from these Terms or your use of the Services will be subject to the exclusive 
                jurisdiction of the courts of Victoria, Australia.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. We will notify users of 
                material changes by posting the updated Terms on our website and updating the 
                "Last updated" date. Your continued use of the Services constitutes acceptance 
                of the revised Terms.
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
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">AusJobs Legal Team</p>
                <p>Email: legal@ausjobs.com.au</p>
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

export default TermsOfServicePage;