import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Terms of Service</h1>
            <p className="text-gray-600 mb-4">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <h2 className="text-2xl font-semibold mt-8 mb-4">Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using AI Resume Generator ("the Service"), you accept and agree to be bound by these Terms of Service.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Service Description</h2>
              <p className="mb-4">
                AI Resume Generator provides an automated service to enhance and customize resumes using artificial intelligence technology based on job descriptions provided by users.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">User Responsibilities</h2>
              <ul className="list-disc pl-6 mb-6">
                <li>You are responsible for the accuracy of information you provide</li>
                <li>You may only upload resume content that you own or have permission to use</li>
                <li>You agree not to use the service for illegal or unauthorized purposes</li>
                <li>You will not attempt to reverse engineer or disrupt the service</li>
              </ul>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Content and Data</h2>
              <p className="mb-4">
                Resume files and job descriptions are processed temporarily and are not stored permanently on our servers. We do not claim ownership of your content.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Service Availability</h2>
              <p className="mb-6">
                We strive to maintain service availability but do not guarantee uninterrupted access. The service may be temporarily unavailable for maintenance or technical issues.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
              <p className="mb-6">
                The service is provided "as is" without warranties. We are not liable for any damages arising from use of the service, including but not limited to career outcomes or hiring decisions.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Privacy</h2>
              <p className="mb-6">
                Your use of the service is also governed by our Privacy Policy, which can be found at /privacy.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to Terms</h2>
              <p className="mb-6">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes through the website.
              </p>

              <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Information</h2>
              <p className="mb-6">
                For questions about these Terms of Service, please contact us at: terms@resume-gen.app
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
