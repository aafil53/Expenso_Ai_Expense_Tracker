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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="tax">💰</span> Add Tax Entry
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type<span className="text-red-500">*</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Income Tax, GST, Property Tax"
          value={taxType}
          onChange={(e) => setTaxType(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="0"
          step="0.01"
          required
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
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. FY 2023-24, Advance Tax"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
      >
        <span role="img" aria-label="add">➕</span> Add Tax Entry
      </button>
    </form>
  );
};

export default AddTax;
