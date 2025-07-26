import React, {useState, useEffect} from 'react';
import {db} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

const BudgetPage = ({user}) => {
  const [budget, setBudget] = useState('');
  const [currentBudget, setCurrentBudget] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [message, setMessage] = useState('');

  const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

  useEffect(() => {
    if (!user) return;
    const userId = user.uid;

    // Listen to budget doc for current month
    const budgetRef = doc(db, `users/${userId}/budget/${currentMonth}`);
    const unsubscribeBudget = onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentBudget(docSnap.data().amount);
      } else {
        setCurrentBudget(null);
      }
    }, (error) => {
      console.error('Error listening to budget:', error);
    });

    // Listen to expenses of current month
    const startOfMonth = new Date(`${currentMonth}-01T00:00:00`);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const expensesRef = collection(db, `users/${userId}/expenses`);
    const expensesQuery = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(startOfMonth)),
      where('date', '<', Timestamp.fromDate(endOfMonth))
    );

    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
      let total = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.amount) total += parseFloat(data.amount);
      });
      setTotalExpenses(total);
    }, (error) => {
      console.error('Error listening to expenses:', error);
    });

    return () => {
      unsubscribeBudget();
      unsubscribeExpenses();
    };
  }, [user, currentMonth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!budget.trim()) {
      alert('Budget amount is required.');
      return;
    }
    try {
      const userId = user.uid;
      await setDoc(doc(db, `users/${userId}/budget/${currentMonth}`), {
        amount: parseFloat(budget),
        createdAt: Timestamp.now()
      });
      setBudget('');
      setMessage('Budget set successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error setting budget:', error);
      setMessage('Error setting budget.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Monthly Budget</h2>
      <div className="mb-4 p-3 bg-gray-100 rounded shadow text-sm">
        <div className="flex flex-wrap gap-4 items-center mb-2">
          <span><strong>Month:</strong> {currentMonth}</span>
          <span><strong>Budget:</strong> ₹{currentBudget !== null ? currentBudget.toFixed(2) : '0.00'}</span>
          <span><strong>Expenses:</strong> ₹{totalExpenses.toFixed(2)}</span>
          <span><strong>Remaining:</strong> ₹{currentBudget !== null ? (currentBudget - totalExpenses).toFixed(2) : '0.00'}</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-center mt-2">
          <input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="Set Budget Amount"
            type="number"
            className="border p-1 rounded w-32"
            min="0"
            step="0.01"
          />
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Set Budget</button>
          {message && <span className="ml-2 text-green-600 text-sm">{message}</span>}
        </form>
      </div>
    </div>
  );
};

export default BudgetPage;
