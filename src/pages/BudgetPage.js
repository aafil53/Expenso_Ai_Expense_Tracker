import React, {useState, useEffect} from 'react';
import {db} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

const BudgetPage = ({user}) => { // ✅ receive user as prop
  const [budget, setBudget] = useState('');
  const [currentBudget, setCurrentBudget] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const currentMonth = new Date().toISOString().slice(0, 7); // e.g., '2025-07'

  useEffect(() => {
    if (!user) return; // ✅ skip if user not ready
    const userId = user.uid;

    const fetchBudget = async () => {
      try {
        const budgetDoc = await getDoc(doc(db, `users/${userId}/budget/${currentMonth}`));
        if (budgetDoc.exists()) {
          setCurrentBudget(budgetDoc.data().amount);
        }
      } catch (error) {
        console.error('Error fetching budget:', error);
      }
    };

    const fetchTotalExpenses = async () => {
      try {
        const startOfMonth = new Date(`${currentMonth}-01T00:00:00`);
        const endOfMonth = new Date(startOfMonth);
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);

        const expensesRef = collection(db, `users/${userId}/expenses`);
        const expensesQuery = query(
          expensesRef,
          where('date', '>=', Timestamp.fromDate(startOfMonth)),
          where('date', '<', Timestamp.fromDate(endOfMonth))
        );

        const snapshot = await getDocs(expensesQuery);
        let total = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.amount) {
            total += parseFloat(data.amount);
          }
        });
        setTotalExpenses(total);
      } catch (error) {
        console.error('Error fetching expenses:', error);
      }
    };

    fetchBudget();
    fetchTotalExpenses();
  }, [user, currentMonth]); // ✅ depends on user

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
      setCurrentBudget(parseFloat(budget));
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
          Current Budget for {currentMonth}: ₹{currentBudget}
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
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Set Budget
        </button>
      </form>
      <p>Total Expenses: ₹{totalExpenses}</p>
      <p>
        Remaining Budget: ₹
        {currentBudget !== null ? (currentBudget - totalExpenses) : 0}
      </p>
    </div>
  );
};

export default BudgetPage;
