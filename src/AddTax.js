import React, {useState} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddTax = ({user}) => {
  const [taxType, setTaxType] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taxType || !amount || !dueDate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'taxes'), {
        taxType,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      setTaxType('');
      setAmount('');
      setDueDate('');
      setNotes('');
      alert('Tax entry added successfully');
    } catch (error) {
      console.error('Error adding tax entry:', error);
      alert('Error adding tax entry');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Tax Entry</h2>
      <input
        type="text"
        placeholder="Tax Type (Income Tax, GST, etc.)"
        value={taxType}
        onChange={(e) => setTaxType(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Amount (₹)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="submit">Add Tax Entry</button>
    </form>
  );
};

export default AddTax;
