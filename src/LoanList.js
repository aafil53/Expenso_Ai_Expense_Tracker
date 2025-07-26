import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const LoanList = ({user}) => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'loans'),
      (snapshot) => {
        const loanData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setLoans(loanData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsPaid = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'loans', id), {status: 'Paid'});
  };

  const deleteLoan = async (id) => {
    if (window.confirm('Delete this loan?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'loans', id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <span role="img" aria-label="loan">💳</span> Loans You Owe
      </h2>
      {loans.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No loans added yet.</div>
      ) : (
        <div className="grid gap-6">
          {loans.map((loan) => {
            const monthlyInterestRate = loan.annualInterest / 12 / 100;
            const monthlyInterestAmount = loan.loanAmount * monthlyInterestRate;
            const isOverdue = loan.dueDate && new Date(loan.dueDate.seconds * 1000) < new Date() && loan.status !== 'Paid';
            return (
              <div
                key={loan.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 transition-all ${isOverdue ? 'border-red-400' : 'border-transparent'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏦</span>
                    <span className="font-semibold text-gray-700">{loan.loanOrganizationName}</span>
                    {loan.status === 'Paid' ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Paid</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                    )}
                    {isOverdue && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-red-100 text-red-700 text-xs font-semibold animate-pulse">Overdue</span>
                    )}
                  </div>
                  {loan.reason && <div className="text-sm text-gray-500 mb-1">Reason: {loan.reason}</div>}
                  <div className="text-sm text-gray-600 mb-1">Due Date: <span className={isOverdue ? 'text-red-600 font-bold' : ''}>{loan.dueDate ? new Date(loan.dueDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Loan Amount: <span className="font-semibold text-blue-700"> ₹{loan.loanAmount.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Annual Interest: <span className="font-semibold">{loan.annualInterest}%</span></div>
                  <div className="text-sm text-gray-600 mb-1">Monthly Interest: <span className="font-semibold"> ₹{monthlyInterestAmount.toFixed(2)}</span></div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {loan.status === 'Pending' && (
                    <button
                      onClick={() => markAsPaid(loan.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                      title="Mark as Paid"
                    >
                      <span role="img" aria-label="paid">✔️</span> Mark as Paid
                    </button>
                  )}
                  <button
                    onClick={() => deleteLoan(loan.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                    title="Delete Loan"
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

export default LoanList;
