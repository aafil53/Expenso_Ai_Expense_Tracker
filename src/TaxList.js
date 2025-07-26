import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp} from 'firebase/firestore';

const TaxList = ({user}) => {
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'taxes'),
      (snapshot) => {
        const taxData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setTaxes(taxData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsPaid = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'taxes', id), {
      status: 'Paid',
      paidDate: serverTimestamp()
    });
  };

  const deleteTax = async (id) => {
    if (window.confirm('Delete this tax entry?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'taxes', id));
    }
  };

  const calculateDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate.seconds * 1000);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <span role="img" aria-label="tax">💰</span> Your Taxes
      </h2>
      {taxes.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No tax entries added yet.</div>
      ) : (
        <div className="grid gap-6">
          {taxes.map((tax) => {
            const daysRemaining = tax.status === 'Pending' ? calculateDaysRemaining(tax.dueDate) : null;
            const isOverdue = daysRemaining < 0;
            const isPaid = tax.status === 'Paid';

            return (
              <div
                key={tax.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 transition-all ${isOverdue ? 'border-red-400' : isPaid ? 'border-green-400' : 'border-transparent'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📋</span>
                    <span className="font-semibold text-gray-700">{tax.taxType}</span>
                    {isPaid ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Paid</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                    )}
                    {isOverdue && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold animate-pulse">Overdue</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Amount: <span className="font-semibold text-purple-700">₹{tax.amount.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Due Date: <span className={isOverdue ? 'text-red-600 font-bold' : 'font-semibold'}>{tax.dueDate ? new Date(tax.dueDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                  {tax.notes && <div className="text-sm text-gray-600 mb-1">Notes: <span className="font-semibold">{tax.notes}</span></div>}
                  {tax.status === 'Pending' && (
                    <div className="text-sm text-gray-600 mb-1">
                      {daysRemaining >= 0 ? 'Days Remaining:' : 'Overdue by:'} <span className={`font-semibold ${isOverdue ? 'text-red-600' : 'text-yellow-600'}`}>{Math.abs(daysRemaining)} days</span>
                    </div>
                  )}
                  {tax.status === 'Paid' && tax.paidDate && (
                    <div className="text-sm text-gray-600 mb-1">Paid Date: <span className="font-semibold text-green-700">{tax.paidDate ? new Date(tax.paidDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {tax.status === 'Pending' && (
                    <button
                      onClick={() => markAsPaid(tax.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                      title="Mark as Paid"
                    >
                      <span role="img" aria-label="paid">✔️</span> Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => deleteTax(tax.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                    title="Delete Tax Entry"
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

export default TaxList;
