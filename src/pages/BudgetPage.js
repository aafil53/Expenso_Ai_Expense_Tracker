import React, {useState, useEffect} from 'react';
import {db} from '../firebase';
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  query,
  where,
  Timestamp,
  orderBy,
  limit,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';

const BudgetPage = ({user}) => {
  const [totalBudget, setTotalBudget] = useState('');
  const [currentTotalBudget, setCurrentTotalBudget] = useState(null);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [categoryBudgets, setCategoryBudgets] = useState({});
  const [categoryExpenses, setCategoryExpenses] = useState({});
  const [newCategoryBudget, setNewCategoryBudget] = useState({category: '', amount: ''});
  const [selectedTimeframe, setSelectedTimeframe] = useState('current');
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [spendingTrends, setSpendingTrends] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState('');
  const [currentSavings, setCurrentSavings] = useState(0);

  const categories = [
    'Food & Dining', 'Transportation', 'Shopping', 'Bills & Utilities',
    'Entertainment', 'Health & Fitness', 'Education', 'Personal Care',
    'Investments', 'Miscellaneous'
  ];

  const timeframes = [
    {value: 'current', label: 'Current Month'},
    {value: 'last', label: 'Last Month'},
    {value: 'last3', label: 'Last 3 Months'},
    {value: 'ytd', label: 'Year to Date'}
  ];

  const getCurrentPeriod = (timeframe) => {
    const now = new Date();
    switch (timeframe) {
      case 'current':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          label: now.toISOString().slice(0, 7)
        };
      case 'last':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return {
          start: lastMonth,
          end: new Date(now.getFullYear(), now.getMonth(), 0),
          label: lastMonth.toISOString().slice(0, 7)
        };
      case 'last3':
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 2, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
          label: 'Last 3 Months'
        };
      case 'ytd':
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
          label: `YTD ${now.getFullYear()}`
        };
      default:
        return getCurrentPeriod('current');
    }
  };

  useEffect(() => {
    if (!user) return;
    const userId = user.uid;
    const period = getCurrentPeriod(selectedTimeframe);

    // Listen to total budget
    const budgetRef = doc(db, `users/${userId}/budget/${period.label}`);
    const unsubscribeBudget = onSnapshot(budgetRef, (docSnap) => {
      if (docSnap.exists()) {
        setCurrentTotalBudget(docSnap.data().amount);
      } else {
        setCurrentTotalBudget(null);
      }
    });

    // Listen to category budgets
    const categoryBudgetRef = doc(db, `users/${userId}/categoryBudgets/${period.label}`);
    const unsubscribeCategoryBudgets = onSnapshot(categoryBudgetRef, (docSnap) => {
      if (docSnap.exists()) {
        setCategoryBudgets(docSnap.data());
      } else {
        setCategoryBudgets({});
      }
    });

    // Listen to expenses in the selected period
    const expensesRef = collection(db, `users/${userId}/expenses`);
    const expensesQuery = query(
      expensesRef,
      where('date', '>=', Timestamp.fromDate(period.start)),
      where('date', '<=', Timestamp.fromDate(period.end)),
      orderBy('date', 'desc')
    );

    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
      let total = 0;
      const categoryTotals = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.amount) {
          total += parseFloat(data.amount);
          const category = data.category || 'Miscellaneous';
          categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(data.amount);
        }
      });
      
      setTotalExpenses(total);
      setCategoryExpenses(categoryTotals);
      
      // Calculate savings
      if (currentTotalBudget) {
        setCurrentSavings(currentTotalBudget - total);
      }
    });

    // Generate budget alerts
    generateBudgetAlerts();

    return () => {
      unsubscribeBudget();
      unsubscribeCategoryBudgets();
      unsubscribeExpenses();
    };
  }, [user, selectedTimeframe, currentTotalBudget, categoryBudgets, categoryExpenses]);

  const generateBudgetAlerts = () => {
    const alerts = [];
    
    // Total budget alert
    if (currentTotalBudget && totalExpenses > currentTotalBudget * 0.8) {
      alerts.push({
        type: 'warning',
        category: 'Total Budget',
        message: `You've spent ${((totalExpenses / currentTotalBudget) * 100).toFixed(0)}% of your total budget`,
        severity: totalExpenses > currentTotalBudget ? 'high' : 'medium'
      });
    }

    // Category budget alerts
    Object.entries(categoryBudgets).forEach(([category, budget]) => {
      const spent = categoryExpenses[category] || 0;
      const percentage = (spent / budget) * 100;
      
      if (percentage > 80) {
        alerts.push({
          type: 'category',
          category,
          message: `${category}: ${percentage.toFixed(0)}% of budget used`,
          severity: percentage > 100 ? 'high' : 'medium'
        });
      }
    });

    setBudgetAlerts(alerts);
  };

  const handleTotalBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!totalBudget.trim()) {
      alert('Budget amount is required.');
      return;
    }
    
    try {
      const userId = user.uid;
      const period = getCurrentPeriod(selectedTimeframe);
      
      await setDoc(doc(db, `users/${userId}/budget/${period.label}`), {
        amount: parseFloat(totalBudget),
        createdAt: Timestamp.now(),
        period: period.label
      });
      
      setTotalBudget('');
    } catch (error) {
      console.error('Error setting budget:', error);
    }
  };

  const handleCategoryBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryBudget.category || !newCategoryBudget.amount) {
      alert('Please select category and enter amount.');
      return;
    }
    
    try {
      const userId = user.uid;
      const period = getCurrentPeriod(selectedTimeframe);
      
      const updatedCategoryBudgets = {
        ...categoryBudgets,
        [newCategoryBudget.category]: parseFloat(newCategoryBudget.amount)
      };
      
      await setDoc(doc(db, `users/${userId}/categoryBudgets/${period.label}`), {
        ...updatedCategoryBudgets,
        lastUpdated: Timestamp.now()
      });
      
      setNewCategoryBudget({category: '', amount: ''});
    } catch (error) {
      console.error('Error setting category budget:', error);
    }
  };

  const handleSavingsGoalSubmit = async (e) => {
    e.preventDefault();
    if (!savingsGoal.trim()) return;
    
    try {
      const userId = user.uid;
      await setDoc(doc(db, `users/${userId}/savingsGoal/current`), {
        amount: parseFloat(savingsGoal),
        createdAt: Timestamp.now()
      });
      
      setSavingsGoal('');
    } catch (error) {
      console.error('Error setting savings goal:', error);
    }
  };

  const getBudgetUtilization = (category) => {
    const budget = categoryBudgets[category] || 0;
    const spent = categoryExpenses[category] || 0;
    return budget > 0 ? (spent / budget) * 100 : 0;
  };

  const getUtilizationColor = (percentage) => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const calculateProjectedSpending = () => {
    const period = getCurrentPeriod(selectedTimeframe);
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const daysPassed = today.getDate();
    const dailyAverage = totalExpenses / daysPassed;
    
    return dailyAverage * daysInMonth;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <span role="img" aria-label="budget">💰</span> Budget Management
        </h2>
        
        <select
          value={selectedTimeframe}
          onChange={(e) => setSelectedTimeframe(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {timeframes.map(tf => (
            <option key={tf.value} value={tf.value}>{tf.label}</option>
          ))}
        </select>
      </div>

      {/* Budget Alerts */}
      {budgetAlerts.length > 0 && (
        <div className="space-y-2">
          {budgetAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-l-4 ${
                alert.severity === 'high' 
                  ? 'bg-red-50 border-red-500 text-red-800' 
                  : 'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span role="img" aria-label="warning">⚠️</span>
                <span className="font-medium">{alert.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="text-sm text-gray-600">Total Budget</div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{currentTotalBudget?.toLocaleString() || '0'}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
          <div className="text-sm text-gray-600">Total Spent</div>
          <div className="text-2xl font-bold text-red-600">
            ₹{totalExpenses.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <div className="text-sm text-gray-600">Remaining</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{(currentTotalBudget ? currentTotalBudget - totalExpenses : 0).toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-6 border border-purple-200">
          <div className="text-sm text-gray-600">Projected Spending</div>
          <div className="text-2xl font-bold text-purple-600">
            ₹{calculateProjectedSpending().toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Budget Forms */}
        <div className="space-y-6">
          {/* Total Budget Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Set Total Budget</h3>
            <form onSubmit={handleTotalBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (₹)
                </label>
                <input
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="Enter total budget"
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Set Total Budget
              </button>
            </form>
          </div>

          {/* Category Budget Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Set Category Budget</h3>
            <form onSubmit={handleCategoryBudgetSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newCategoryBudget.category}
                  onChange={(e) => setNewCategoryBudget(prev => ({...prev, category: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget Amount (₹)
                </label>
                <input
                  value={newCategoryBudget.amount}
                  onChange={(e) => setNewCategoryBudget(prev => ({...prev, amount: e.target.value}))}
                  placeholder="Enter budget amount"
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Set Category Budget
              </button>
            </form>
          </div>
        </div>

        {/* Category Budget Tracking */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Category Budget Tracking</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(categoryBudgets).map(([category, budget]) => {
              const spent = categoryExpenses[category] || 0;
              const percentage = getBudgetUtilization(category);
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-800">{category}</span>
                    <span className="text-sm text-gray-600">
                      ₹{spent.toLocaleString()} / ₹{budget.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getUtilizationColor(percentage)}`}
                      style={{width: `${Math.min(percentage, 100)}%`}}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className={percentage >= 100 ? 'text-red-600' : 'text-gray-600'}>
                      {percentage.toFixed(1)}% used
                    </span>
                    <span className="text-gray-600">
                      ₹{(budget - spent).toLocaleString()} remaining
                    </span>
                  </div>
                </div>
              );
            })}
            
            {Object.keys(categoryBudgets).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No category budgets set yet. Add some using the form on the left.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Insights */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Budget Insights</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <div className="text-gray-600">Largest Expense Category</div>
            <div className="font-semibold text-gray-800">
              {Object.entries(categoryExpenses).length > 0 
                ? Object.entries(categoryExpenses).reduce((a, b) => a[1] > b[1] ? a : b)[0]
                : 'None'
              }
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <div className="text-gray-600">Daily Average Spending</div>
            <div className="font-semibold text-gray-800">
              ₹{(totalExpenses / new Date().getDate()).toFixed(0)}
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <div className="text-gray-600">Budget Utilization</div>
            <div className="font-semibold text-gray-800">
              {currentTotalBudget ? ((totalExpenses / currentTotalBudget) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPage;
