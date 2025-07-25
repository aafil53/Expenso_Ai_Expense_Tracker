import React, {useEffect, useState} from 'react';
import {db} from '../firebase';
import {collection, getDocs, query, where} from 'firebase/firestore';
import dayjs from 'dayjs';

const Dashboard = ({user}) => {
  const [insights, setInsights] = useState({
    categoryInsights: [],
    biggestExpenseDay: null,
    upcomingDues: []
  });

  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.uid) return;

      // 1️⃣ Fetch expenses
      const month = dayjs().format('YYYY-MM');
      const expensesRef = collection(db, 'expenses');
      const q = query(expensesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(q);

      const expenses = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})).filter(exp => {
        if (!exp.date) return false;
        const [ , monthPart, year] = exp.date.split('-');
        return `${year}-${monthPart}` === month;
      });

      // Calculate category percentages
      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const categoryMap = {};
      expenses.forEach(exp => {
        if (!categoryMap[exp.category]) categoryMap[exp.category] = 0;
        categoryMap[exp.category] += exp.amount;
      });
      const categoryInsights = Object.keys(categoryMap).map(cat => ({
        category: cat,
        percent: total ? ((categoryMap[cat] / total) * 100).toFixed(1) : 0
      })).sort((a,b)=>b.percent-a.percent).slice(0,3);

      // Find biggest expense day
      const dailyMap = {};
      expenses.forEach(exp => {
        if (!dailyMap[exp.date]) dailyMap[exp.date] = 0;
        dailyMap[exp.date] += exp.amount;
      });
      let biggestDay = null, maxAmount = 0;
      Object.keys(dailyMap).forEach(date => {
        if (dailyMap[date] > maxAmount) {
          maxAmount = dailyMap[date];
          biggestDay = date;
        }
      });

      // 2️⃣ Fetch upcoming dues
      const upcomingDues = [];

      const today = dayjs();
      const next7 = today.add(7, 'day');

      const fetchUpcoming = async (collectionName, labelField, amountField = 'amount', dueField = 'dueDate') => {
        const ref = collection(db, collectionName);
        const snap = await getDocs(query(ref, where('userId', '==', user.uid)));
        snap.docs.forEach(doc => {
          const data = doc.data();
          const dueDate = data[dueField]?.toDate?.() ?? null;
          if (dueDate && dayjs(dueDate).isAfter(today) && dayjs(dueDate).isBefore(next7)) {
            upcomingDues.push({
              type: collectionName,
              label: data[labelField] ?? 'No Label',
              amount: data[amountField] ?? 0,
              dueDate: dayjs(dueDate).format('DD-MM-YYYY')
            });
          }
        });
      };

      await fetchUpcoming('violations', 'violationType', 'fineAmount');
      await fetchUpcoming('loans', 'loanOrganizationName', 'loanAmount');
      await fetchUpcoming('taxes', 'taxType');

      // Update insights
      setInsights({
        categoryInsights,
        biggestExpenseDay: biggestDay ? {date: biggestDay, amount: maxAmount} : null,
        upcomingDues
      });
    };

    fetchInsights();
  }, [user]);

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-semibold mb-4'>AI Insights Dashboard</h1>

      <div className='bg-white rounded-lg p-4 shadow mb-4'>
        <h2 className='text-lg font-medium mb-2'>Top Spending Categories This Month</h2>
        {insights.categoryInsights.length ? insights.categoryInsights.map((cat, idx) => (
          <p key={idx}>• {cat.category}: {cat.percent}%</p>
        )) : <p>No expenses recorded this month.</p>}
      </div>

      <div className='bg-white rounded-lg p-4 shadow mb-4'>
        <h2 className='text-lg font-medium mb-2'>Biggest Expense Day</h2>
        {insights.biggestExpenseDay ? (
          <p>
            Your biggest expense day was <b>{insights.biggestExpenseDay.date}</b> with spending of ₹{insights.biggestExpenseDay.amount}.
          </p>
        ) : <p>No expenses recorded to calculate.</p>}
      </div>

      <div className='bg-white rounded-lg p-4 shadow mb-4'>
        <h2 className='text-lg font-medium mb-2'>Upcoming Dues (Next 7 Days)</h2>
        {insights.upcomingDues.length ? insights.upcomingDues.map((due, idx) => (
          <p key={idx}>• {due.type} ({due.label}) of ₹{due.amount} due on {due.dueDate}</p>
        )) : <p>No upcoming dues in the next 7 days.</p>}
      </div>
    </div>
  );
};

export default Dashboard;
