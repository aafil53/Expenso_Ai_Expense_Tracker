import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const ViolationList = ({user}) => {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'violations'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setViolations(data);
      }
    );
    return () => unsub();
  }, [user]);

  const markStatus = async (id, status) => {
    await updateDoc(doc(db, 'users', user.uid, 'violations', id), {status});
  };

  const deleteViolation = async (id) => {
    if (window.confirm('Delete this violation?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'violations', id));
    }
  };

  const daysBetween = (date1, date2) => {
    const diff = date2 - date1;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <span role="img" aria-label="violation">🚨</span> Your Traffic Violations
      </h2>
      {violations.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No violations added yet.</div>
      ) : (
        <div className="grid gap-6">
          {violations.map((violation) => {
            const violationDate = violation.violationDate.seconds ? new Date(violation.violationDate.seconds * 1000) : new Date(violation.violationDate);
            const dueDate = violation.dueDate.seconds ? new Date(violation.dueDate.seconds * 1000) : new Date(violation.dueDate);
            const now = new Date();

            const daysSinceViolation = daysBetween(violationDate, now);
            let daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
            let overdue = daysRemaining < 0;
            const isPaid = violation.status === 'Paid';
            const isCancelled = violation.status === 'Cancelled';

            return (
              <div
                key={violation.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 transition-all ${overdue ? 'border-red-400' : isPaid ? 'border-green-400' : isCancelled ? 'border-gray-400' : 'border-transparent'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🚗</span>
                    <span className="font-semibold text-gray-700">{violation.violationType}</span>
                    {isPaid ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Paid</span>
                    ) : isCancelled ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-semibold">Cancelled</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                    )}
                    {overdue && violation.status === 'Pending' && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold animate-pulse">Overdue</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Fine Amount: <span className="font-semibold text-red-700">₹{violation.fineAmount.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Violation Date: <span className="font-semibold">{violationDate.toLocaleDateString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Due Date: <span className={overdue ? 'text-red-600 font-bold' : 'font-semibold'}>{dueDate.toLocaleDateString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Days Since Violation: <span className="font-semibold">{daysSinceViolation} days</span></div>
                  {violation.status === 'Pending' && (
                    <div className="text-sm text-gray-600 mb-1">
                      {overdue ? 'Overdue by:' : 'Days Remaining:'} <span className={`font-semibold ${overdue ? 'text-red-600' : 'text-yellow-600'}`}>{Math.abs(daysRemaining)} days</span>
                    </div>
                  )}
                  {violation.noticeNumber && <div className="text-sm text-gray-600 mb-1">Notice Number: <span className="font-semibold">{violation.noticeNumber}</span></div>}
                  {violation.notes && <div className="text-sm text-gray-600 mb-1">Notes: <span className="font-semibold">{violation.notes}</span></div>}
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {violation.status === 'Pending' && (
                    <>
                      <button
                        onClick={() => markStatus(violation.id, 'Paid')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                        title="Mark as Paid"
                      >
                        <span role="img" aria-label="paid">✔️</span> Mark as Paid
                      </button>
                      <button
                        onClick={() => markStatus(violation.id, 'Cancelled')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                        title="Cancel Violation"
                      >
                        <span role="img" aria-label="cancel">❌</span> Cancel
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteViolation(violation.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                    title="Delete Violation"
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

export default ViolationList;
