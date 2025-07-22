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
    <form onSubmit={handleSubmit}>
      <h2>Add Loan</h2>
      <input
        type="text"
        placeholder="Loan Organization Name"
        value={loanOrganizationName}
        onChange={(e) => setLoanOrganizationName(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Reason (optional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Loan Amount"
        value={loanAmount}
        onChange={(e) => setLoanAmount(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Annual Interest (%)"
        value={annualInterest}
        onChange={(e) => setAnnualInterest(e.target.value)}
        required
      />
      <button type="submit">Add Loan</button>
    </form>
  );
};

export default AddLoan;
