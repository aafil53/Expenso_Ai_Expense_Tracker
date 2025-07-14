import React from 'react';
import {auth, googleProvider, signInWithPopup} from './firebase';

const Login = () => {
  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <button
        onClick={handleGoogleSignIn}
        className="bg-red-600 text-white p-2 rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
};

export default Login;
