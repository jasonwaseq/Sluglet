import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Main heading */}
        <h1 className="text-6xl font-bold text-gray-800 mb-4">
          Hello World!
        </h1>
        
        {/* Subtitle */}
        <p className="text-xl text-gray-600 mb-8">
          Welcome to your new React app
        </p>
        
        {/* Call to action button */}
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
          Get Started
        </button>
        
        {/* Additional info */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Built with Next.js and Tailwind CSS</p>
        </div>
      </div>
    </div>
  );
}
