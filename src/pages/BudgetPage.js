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
    } catch (error) {
      console.error('Error setting budget:', error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Budget Tracking</h2>
      {currentBudget !== null ? (
        <p className="mb-2">
          Current Budget for {currentMonth}: ₹{currentBudget.toFixed(2)}
        </p>
      ) : (
        <p className="mb-2">No budget set for {currentMonth}.</p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mb-4">
        <input
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Enter Budget Amount"
          type="number"
          className="border p-2 rounded"
          min="0"
          step="0.01"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Set Budget
        </button>
      </form>
      <p>Total Expenses: ₹{totalExpenses.toFixed(2)}</p>
      <p>
        Remaining Budget: ₹
        {currentBudget !== null ? (currentBudget - totalExpenses).toFixed(2) : '0.00'}
      </p>
    </div>
  );
};

export default BudgetPage;
