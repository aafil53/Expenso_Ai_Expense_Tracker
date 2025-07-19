import React, {useState} from 'react';
import {db} from './firebase';
import {addDoc, collection, doc, getDoc, setDoc, updateDoc, Timestamp} from 'firebase/firestore';

const AddExpense = ({user}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage('User not logged in.');
      return;
    }

    try {
      // Convert date string to Firestore Timestamp
      const expenseDate = date ? Timestamp.fromDate(new Date(date)) : null;

      // 1️⃣ Add expense to Firestore
      await addDoc(collection(db, 'users', user.uid, 'expenses'), {
        amount: parseFloat(amount),
        category,
        date: expenseDate,
        note,
        createdAt: Timestamp.now()
      });

      // 2️⃣ Update budget document (create if missing)
      const budgetRef = doc(db, 'users', user.uid, 'budget', 'budgetData');
      const budgetSnap = await getDoc(budgetRef);

      if (budgetSnap.exists()) {
        const currentBudget = budgetSnap.data().amount || 0;
        const newBudget = currentBudget - parseFloat(amount);
        await updateDoc(budgetRef, {amount: newBudget});
      } else {
        // Create budget document with default 0 if missing
        await setDoc(budgetRef, {amount: 0});
        setMessage('Budget document not found, created with default amount 0. Please update your budget.');
      }

      // Clear form inputs if no earlier message set
      if (!message) {
        setMessage('Expense added successfully!');
        setAmount('');
        setCategory('');
        setDate('');
        setNote('');
      }
    } catch (error) {
      console.error('Error adding expense or updating budget:', error);
      setMessage('Error adding expense or updating budget.');
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
