import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const SIPList = ({user}) => {
  const [sips, setSips] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'sips'),
      (snapshot) => {
        const sipData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setSips(sipData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsCompleted = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'sips', id), {status: 'Completed'});
  };

  const deleteSIP = async (id) => {
    if (window.confirm('Delete this SIP?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'sips', id));
    }
  };

  const calculateMonthsElapsed = (startDate) => {
    const now = new Date();
    const start = new Date(startDate.seconds * 1000);
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return diff >= 0 ? diff : 0;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <span role="img" aria-label="sip">📈</span> Your SIPs/Mutual Funds
      </h2>
      {sips.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No SIPs added yet.</div>
      ) : (
        <div className="grid gap-6">
          {sips.map((sip) => {
            const monthsElapsed = calculateMonthsElapsed(sip.startDate);
            const monthsToConsider = Math.min(monthsElapsed, sip.durationMonths);
            const totalInvested = sip.sipAmount * monthsToConsider;
            const r = sip.expectedReturnRate / 12 / 100;
            const n = monthsToConsider;
            const estimatedReturns = sip.sipAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
            const progressPercentage = (monthsToConsider / sip.durationMonths) * 100;
            const isCompleted = sip.status === 'Completed';
            const isActive = sip.status === 'Active';

            return (
              <div
                key={sip.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 transition-all ${isCompleted ? 'border-green-400' : 'border-transparent'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏦</span>
                    <span className="font-semibold text-gray-700">{sip.fundName}</span>
                    {isCompleted ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Completed</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">Active</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">SIP Amount: <span className="font-semibold text-blue-700">₹{sip.sipAmount.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Start Date: <span className="font-semibold">{sip.startDate ? new Date(sip.startDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Expected Return Rate: <span className="font-semibold text-green-700">{sip.expectedReturnRate}%</span></div>
                  <div className="text-sm text-gray-600 mb-1">Duration: <span className="font-semibold">{sip.durationMonths} months</span></div>
                  <div className="text-sm text-gray-600 mb-1">Months Elapsed: <span className="font-semibold">{monthsToConsider} months</span></div>
                  <div className="text-sm text-gray-600 mb-1">Total Invested: <span className="font-semibold text-blue-700">₹{totalInvested.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Estimated Returns: <span className="font-semibold text-green-700">₹{estimatedReturns.toFixed(2)}</span></div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{progressPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {isActive && (
                    <button
                      onClick={() => markAsCompleted(sip.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                      title="Mark as Completed"
                    >
                      <span role="img" aria-label="completed">✅</span> Mark as Completed
                    </button>
                  )}
                  <button
                    onClick={() => deleteSIP(sip.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                    title="Delete SIP"
                  >
                    <span role="img" aria-label="delete">🗑️</span> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SIPList;
