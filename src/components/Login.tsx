import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Brain } from 'lucide-react';

const Login: React.FC = () => {
  const { signInWithGoogle, loading, error, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to main app after successful login
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-white">
            Welcome to Context Graph Generator
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Sign in to save and manage your context graphs securely in the cloud
          </p>
        </div>
        
        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg relative backdrop-blur-sm">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-300">
                    Authentication Error
                  </h3>
                  <div className="mt-2 text-sm text-red-200">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className={`group relative w-full flex justify-center py-4 px-6 border text-base font-medium rounded-lg transition-all duration-200 transform ${
              loading 
                ? 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed' 
                : 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm hover:scale-105 shadow-lg hover:shadow-xl'
            }`}
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-4">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
            </span>
            <span className="ml-3">
              {loading ? 'Signing in...' : 'Continue with Google'}
            </span>
          </button>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-gray-400">
                  or
                </span>
              </div>
            </div>
          </div>
          
          <Link
            to="/"
            className="group relative w-full flex justify-center py-3 px-6 border border-gray-600 text-base font-medium rounded-lg text-gray-300 bg-gray-800/30 hover:bg-gray-700/40 backdrop-blur-sm transition-all duration-200 transform hover:scale-105 mt-4 shadow-lg hover:shadow-xl"
          >
            <span className="absolute left-0 inset-y-0 flex items-center pl-4">
              <svg
                className="h-5 w-5 text-gray-400 group-hover:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </span>
            Continue as Guest
          </Link>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-800 text-gray-400">
                  Secure authentication with Google
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-6 space-y-4">
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
              <p className="font-medium text-gray-300 mb-2">Guest Mode:</p>
              <p className="text-green-400">• Create and edit graphs locally</p>
              <p className="text-green-400">• View graph visualizations</p>
              <p className="text-orange-400">• Cannot save or sync data</p>
            </div>
            
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-4 border border-gray-700/50">
              <p className="font-medium text-gray-300 mb-2">Signed-in Benefits:</p>
              <p className="text-purple-400">• Save graphs to the cloud</p>
              <p className="text-purple-400">• Sync across devices</p>
              <p className="text-purple-400">• Access from anywhere</p>
            </div>
            
            <div className="pt-4 border-t border-gray-700">
              <p className="text-gray-500">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
              <p className="text-gray-500">Your data is encrypted and stored securely in Firebase.</p>
            </div>
            
            <div className="flex items-center justify-center space-x-6 mt-4">
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Secure</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Private</span>
              </div>
              <div className="flex items-center">
                <svg className="h-4 w-4 text-green-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-gray-300">Reliable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
