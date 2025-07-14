import React, {useState} from 'react';
import {db} from './firebase'; // remove auth import since we get user from props
import {addDoc, collection} from 'firebase/firestore';

// Accept user as a prop
const AddExpense = ({user}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const handleAddExpense = async (e) => {
    e.preventDefault();

    // Use passed user, not auth.currentUser
    if (!user) {
      setMessage('User not logged in.');
      return;
    }

    try {
      await addDoc(collection(db, 'users', user.uid, 'expenses'), {
        amount: parseFloat(amount),
        category,
        date,
        note,
        createdAt: new Date()
      });
      setMessage('Expense added successfully!');
      setAmount('');
      setCategory('');
      setDate('');
      setNote('');
    } catch (error) {
      console.error(error);
      setMessage('Error adding expense.');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Add Expense</h2>
      {message && <p className="text-sm mb-2">{message}</p>}
      <form onSubmit={handleAddExpense} className="flex flex-col gap-2">
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpense;
