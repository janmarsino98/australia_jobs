import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Download, Mail, Cookie, Settings, BarChart, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CookiePolicyPage = () => {
  const navigate = useNavigate();
  const lastUpdated = '21 July 2025';

  const handleDownloadPDF = () => {
    const content = document.getElementById('cookie-content')?.innerText || '';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ausjobs-cookie-policy-${new Date().toISOString().split('T')[0]}.txt`;
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
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
        <div id="cookie-content" className="space-y-8">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-blue-600" />
                What Are Cookies?
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                Cookies are small text files that are placed on your device when you visit our website. 
                They help us provide you with a better experience by remembering your preferences, 
                analyzing how you use our services, and improving our platform's functionality.
              </p>
              <p>
                This Cookie Policy explains how AusJobs uses cookies and similar technologies on our 
                website and mobile applications (collectively, the "Services").
              </p>
            </CardContent>
          </Card>

          {/* Types of Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Types of Cookies We Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Essential Cookies</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  These cookies are necessary for the website to function properly and cannot be disabled. They enable core functionality such as:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>User authentication and session management</li>
                  <li>Security features and fraud prevention</li>
                  <li>Load balancing and website performance</li>
                  <li>Remembering your cookie preferences</li>
                </ul>
                <div className="bg-green-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-green-800">
                    <strong>Legal Basis:</strong> These cookies are necessary for the performance of our contract with you.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <BarChart className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Analytics Cookies</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Google Analytics - tracks page views, user sessions, and site usage patterns</li>
                  <li>Performance monitoring - identifies technical issues and loading times</li>
                  <li>User behavior analysis - helps us improve user experience</li>
                </ul>
                <div className="bg-blue-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-blue-800">
                    <strong>Legal Basis:</strong> Your consent (you can opt-out at any time).
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold">Functional Cookies</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  These cookies enhance the functionality of our website and remember your preferences:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Language and region preferences</li>
                  <li>Theme and display settings</li>
                  <li>Search history and saved searches</li>
                  <li>Job alert preferences</li>
                  <li>Form auto-fill information</li>
                </ul>
                <div className="bg-purple-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-purple-800">
                    <strong>Legal Basis:</strong> Your consent and legitimate interest in improving user experience.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Cookie className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold">Marketing Cookies</h3>
                </div>
                <p className="text-gray-700 mb-2">
                  These cookies are used to deliver personalized content and advertisements:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700">
                  <li>Job recommendations based on your profile and activity</li>
                  <li>Personalized email campaign content</li>
                  <li>Social media integration cookies (LinkedIn, Google)</li>
                  <li>Retargeting and conversion tracking</li>
                </ul>
                <div className="bg-orange-50 p-3 rounded-lg mt-3">
                  <p className="text-sm text-orange-800">
                    <strong>Legal Basis:</strong> Your explicit consent (you can withdraw consent at any time).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may allow selected third-party services to place cookies on your device. These include:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Google Services</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Google Analytics (analytics)</li>
                    <li>• Google OAuth (authentication)</li>
                    <li>• Google Ads (marketing)</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">LinkedIn Services</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• LinkedIn OAuth (authentication)</li>
                    <li>• LinkedIn Insight Tag (analytics)</li>
                    <li>• LinkedIn Ads (marketing)</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Stripe</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Payment processing</li>
                    <li>• Fraud detection</li>
                    <li>• Transaction security</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Other Services</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Hotjar (user experience analytics)</li>
                    <li>• Intercom (customer support)</li>
                    <li>• Cloudflare (performance & security)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookie Management */}
          <Card>
            <CardHeader>
              <CardTitle>Managing Your Cookie Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Browser Settings</h3>
                <p className="text-gray-700 mb-3">
                  You can control cookies through your browser settings. Most browsers allow you to:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 mb-4">
                  <li>View what cookies are stored on your device</li>
                  <li>Delete existing cookies</li>
                  <li>Block cookies from specific websites</li>
                  <li>Block third-party cookies</li>
                  <li>Clear all cookies when closing the browser</li>
                </ul>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Disabling essential cookies may affect the functionality of our website and prevent you from using certain features.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Our Cookie Settings</h3>
                <p className="text-gray-700 mb-3">
                  You can manage your cookie preferences directly on our website:
                </p>
                <Button className="mb-3" variant="outline">
                  Cookie Preferences
                </Button>
                <p className="text-sm text-gray-600">
                  Click the button above to open our cookie preference center where you can enable or disable specific categories of cookies.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Browser-Specific Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Browser-Specific Cookie Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Google Chrome</h4>
                  <p className="text-sm text-gray-700 mb-2">Settings → Privacy and Security → Cookies and other site data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Mozilla Firefox</h4>
                  <p className="text-sm text-gray-700 mb-2">Options → Privacy & Security → Cookies and Site Data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Safari</h4>
                  <p className="text-sm text-gray-700 mb-2">Preferences → Privacy → Manage Website Data</p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Microsoft Edge</h4>
                  <p className="text-sm text-gray-700 mb-2">Settings → Privacy, search, and services → Cookies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Mobile Device Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">iOS Safari</h3>
                <p className="text-gray-700">
                  Settings → Safari → Privacy & Security → Block All Cookies
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Android Chrome</h3>
                <p className="text-gray-700">
                  Chrome App → Menu → Settings → Privacy and Security → Cookies
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Cookie Retention Periods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left">Cookie Type</th>
                      <th className="border border-gray-300 p-3 text-left">Retention Period</th>
                      <th className="border border-gray-300 p-3 text-left">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 p-3">Session Cookies</td>
                      <td className="border border-gray-300 p-3">Until browser is closed</td>
                      <td className="border border-gray-300 p-3">Authentication and security</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Persistent Cookies</td>
                      <td className="border border-gray-300 p-3">30 days - 2 years</td>
                      <td className="border border-gray-300 p-3">Preferences and analytics</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Analytics Cookies</td>
                      <td className="border border-gray-300 p-3">2 years</td>
                      <td className="border border-gray-300 p-3">Usage analysis and improvements</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-3">Marketing Cookies</td>
                      <td className="border border-gray-300 p-3">1 year</td>
                      <td className="border border-gray-300 p-3">Personalization and advertising</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Changes to This Cookie Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect changes in our practices 
                or for other operational, legal, or regulatory reasons. We will notify you of any 
                material changes by posting the updated policy on our website and updating the "Last updated" date.
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
                If you have any questions about our use of cookies or this Cookie Policy, please contact us at:
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

export default CookiePolicyPage;