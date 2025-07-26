import React, {useState} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddLoan = ({user}) => {
  const [loanOrganizationName, setLoanOrganizationName] = useState('');
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [annualInterest, setAnnualInterest] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loanOrganizationName || !dueDate || !loanAmount || !annualInterest) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'loans'), {
        loanOrganizationName,
        reason,
        dueDate: new Date(dueDate),
        loanAmount: parseFloat(loanAmount),
        annualInterest: parseFloat(annualInterest),
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      setLoanOrganizationName('');
      setReason('');
      setDueDate('');
      setLoanAmount('');
      setAnnualInterest('');
      alert('Loan added successfully');
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Error adding loan');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="loan">💸</span> Add Loan
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Organization Name<span className="text-red-500">*</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. HDFC Bank"
          value={loanOrganizationName}
          onChange={(e) => setLoanOrganizationName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Home Renovation"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date<span className="text-red-500">*</span></label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Loan Amount<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 50000"
          value={loanAmount}
          onChange={(e) => setLoanAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Annual Interest (%)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 10.5"
          value={annualInterest}
          onChange={(e) => setAnnualInterest(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
      >
        <span role="img" aria-label="add">➕</span> Add Loan
      </button>
    </form>
  );
};

export default AddLoan;
