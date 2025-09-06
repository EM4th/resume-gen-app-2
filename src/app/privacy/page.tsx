import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>
            <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
              <p className="mb-4">
                AI Resume Generator (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) collects information you provide directly to us, such as:
              </p>
              <ul className="list-disc pl-6 mb-6">
                <li>Resume files you upload for processing</li>
                <li>Job descriptions you provide</li>
                <li>Usage analytics and performance data</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-6">
                <li>Process your resume and generate AI-enhanced versions</li>
                <li>Improve our service quality and user experience</li>
                <li>Analyze usage patterns and optimize performance</li>
                <li>Provide customer support when needed</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
              <p className="mb-6">
                We take reasonable measures to protect your information from unauthorized access, 
                alteration, disclosure, or destruction. Resume files are processed temporarily and 
                are not stored permanently on our servers.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Services</h2>
              <p className="mb-4">Our website uses Google AdSense to serve advertisements. Google may use cookies and web beacons to:</p>
              <ul className="list-disc pl-6 mb-6">
                <li>Serve ads based on your visits to this and other websites</li>
                <li>Analyze website traffic and usage patterns</li>
                <li>Provide personalized advertising experiences</li>
              </ul>
              <p className="mb-6">
                You can opt out of personalized advertising by visiting 
                <a href="https://www.google.com/settings/ads" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer"> Google's Ad Settings</a>.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Cookies</h2>
              <p className="mb-6">
                We use cookies and similar technologies to enhance your browsing experience, 
                serve personalized ads and content, and analyze our traffic.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Data Retention</h2>
              <p className="mb-6">
                Resume files and job descriptions are processed in real-time and are not stored 
                on our servers after processing is complete. Analytics data may be retained for 
                service improvement purposes.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-6">
                <li>Access, update, or delete your personal information</li>
                <li>Opt out of certain communications</li>
                <li>Request information about how your data is used</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
              <p className="mb-6">
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                Email: privacy@resume-gen.app
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Policy</h2>
              <p className="mb-6">
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                ← Back to Resume Generator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
