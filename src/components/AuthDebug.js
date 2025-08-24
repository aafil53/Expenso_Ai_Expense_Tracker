import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';

const AuthDebug = ({ user }) => {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    if (user) {
      setDebugInfo({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        authTime: user.metadata?.lastSignInTime,
        creationTime: user.metadata?.creationTime
      });
    }
  }, [user]);

  const testFirestoreAccess = async () => {
    if (!user) {
      setTestResult('No user authenticated');
      return;
    }

    try {
      // Test read access
      const expensesRef = collection(db, 'users', user.uid, 'expenses');
      const snapshot = await getDocs(expensesRef);
      
      // Test write access
      const testDoc = {
        testField: 'test value',
        timestamp: new Date(),
        type: 'debug_test'
      };
      
      await addDoc(expensesRef, testDoc);
      
      setTestResult(`✅ Success: Read ${snapshot.size} documents, write test passed`);
    } catch (error) {
      setTestResult(`❌ Error: ${error.code} - ${error.message}`);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <h3 className="font-bold text-red-800">Authentication Debug</h3>
        <p className="text-red-700">No user is currently authenticated</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-100 border border-blue-300 rounded mb-4">
      <h3 className="font-bold text-blue-800 mb-2">Authentication Debug Info</h3>
      <div className="text-sm text-blue-700 space-y-1">
        <p><strong>UID:</strong> {debugInfo.uid}</p>
        <p><strong>Email:</strong> {debugInfo.email || 'Not set'}</p>
        <p><strong>Display Name:</strong> {debugInfo.displayName || 'Not set'}</p>
        <p><strong>Anonymous:</strong> {debugInfo.isAnonymous ? 'Yes' : 'No'}</p>
        <p><strong>Email Verified:</strong> {debugInfo.emailVerified ? 'Yes' : 'No'}</p>
        <p><strong>Last Sign In:</strong> {debugInfo.authTime}</p>
      </div>
      
      <button 
        onClick={testFirestoreAccess}
        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Test Firestore Access
      </button>
      
      {testResult && (
        <div className="mt-2 p-2 bg-white rounded border">
          <strong>Test Result:</strong> {testResult}
        </div>
      )}
    </div>
  );
};

export default AuthDebug;