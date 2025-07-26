import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {addDoc, collection, doc, getDoc, setDoc, updateDoc, Timestamp} from 'firebase/firestore';

const AddExpense = ({user}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPeriod, setRecurringPeriod] = useState('monthly');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState('');
  const [message, setMessage] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  // Predefined categories with subcategories
  const categories = {
    'Food & Dining': ['Groceries', 'Restaurants', 'Food Delivery', 'Coffee & Tea', 'Fast Food'],
    'Transportation': ['Fuel', 'Public Transport', 'Taxi/Uber', 'Car Maintenance', 'Parking'],
    'Shopping': ['Clothing', 'Electronics', 'Home & Garden', 'Books', 'Gifts'],
    'Bills & Utilities': ['Electricity', 'Water', 'Internet', 'Mobile', 'Insurance'],
    'Entertainment': ['Movies', 'Gaming', 'Sports', 'Music', 'Travel'],
    'Health & Fitness': ['Medical', 'Pharmacy', 'Gym', 'Sports Equipment', 'Wellness'],
    'Education': ['Courses', 'Books', 'Training', 'Certification', 'Subscriptions'],
    'Personal Care': ['Salon', 'Cosmetics', 'Clothing', 'Accessories'],
    'Investments': ['Stocks', 'Mutual Funds', 'Fixed Deposits', 'Crypto'],
    'Miscellaneous': ['ATM Fees', 'Bank Charges', 'Donations', 'Others']
  };

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Digital Wallet'];

  useEffect(() => {
    // Set default date to today
    setDate(new Date().toISOString().slice(0, 10));
  }, []);

  const handleCategoryChange = (selectedCategory) => {
    setCategory(selectedCategory);
    setSubcategory(''); // Reset subcategory when category changes
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();

    if (!user) {
      setMessage('User not logged in.');
      return;
    }

    const finalCategory = customCategory || category;
    if (!finalCategory) {
      setMessage('Please select or enter a category.');
      return;
    }

    try {
      const expenseDate = date ? Timestamp.fromDate(new Date(date)) : null;
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);

      const expenseData = {
        amount: parseFloat(amount),
        category: finalCategory,
        subcategory,
        date: expenseDate,
        note,
        paymentMethod,
        isRecurring,
        recurringPeriod: isRecurring ? recurringPeriod : null,
        tags: tagsArray,
        location,
        createdAt: Timestamp.now()
      };

      // Add expense to Firestore
      await addDoc(collection(db, 'users', user.uid, 'expenses'), expenseData);

      // Update budget
      const budgetRef = doc(db, 'users', user.uid, 'budget', 'budgetData');
      const budgetSnap = await getDoc(budgetRef);

      if (budgetSnap.exists()) {
        const currentBudget = budgetSnap.data().amount || 0;
        const newBudget = currentBudget - parseFloat(amount);
        await updateDoc(budgetRef, {amount: newBudget});
      } else {
        await setDoc(budgetRef, {amount: 0});
        setMessage('Budget document not found, created with default amount 0. Please update your budget.');
      }

      // Update category-wise spending statistics
      const categoryStatsRef = doc(db, 'users', user.uid, 'statistics', 'categorySpending');
      const categoryStatsSnap = await getDoc(categoryStatsRef);
      
      if (categoryStatsSnap.exists()) {
        const currentStats = categoryStatsSnap.data();
        const categoryTotal = (currentStats[finalCategory] || 0) + parseFloat(amount);
        await updateDoc(categoryStatsRef, {[finalCategory]: categoryTotal});
      } else {
        await setDoc(categoryStatsRef, {[finalCategory]: parseFloat(amount)});
      }

      // If recurring, schedule next expense reminder
      if (isRecurring) {
        const nextDate = calculateNextRecurringDate(new Date(date), recurringPeriod);
        await addDoc(collection(db, 'users', user.uid, 'recurringReminders'), {
          type: 'expense',
          amount: parseFloat(amount),
          category: finalCategory,
          subcategory,
          nextDate: Timestamp.fromDate(nextDate),
          recurringPeriod,
          note,
          paymentMethod,
          createdAt: Timestamp.now()
        });
      }

      if (!message) {
        setMessage('Expense added successfully!');
        resetForm();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setMessage('Error adding expense.');
    }
  };

  const calculateNextRecurringDate = (currentDate, period) => {
    const nextDate = new Date(currentDate);
    switch (period) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    return nextDate;
  };

  const resetForm = () => {
    setAmount('');
    setCategory('');
    setSubcategory('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
    setPaymentMethod('');
    setIsRecurring(false);
    setRecurringPeriod('monthly');
    setTags('');
    setLocation('');
    setCustomCategory('');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="expense">💳</span> Add Expense
      </h2>
      
      {message && (
        <div className={`p-3 mb-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleAddExpense} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹) *</label>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Category</option>
              {Object.keys(categories).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              <option value="custom">+ Add Custom Category</option>
            </select>
          </div>

          {category === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Custom Category *</label>
              <input
                type="text"
                placeholder="Enter custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {category && category !== 'custom' && categories[category] && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subcategory</option>
                {categories[category].map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Payment Method</option>
            {paymentMethods.map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <input
              type="text"
              placeholder="Store name or location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              placeholder="business, urgent, gift"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
          <textarea
            placeholder="Additional details about this expense"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows="3"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <input
              type="checkbox"
              id="recurring"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="recurring" className="text-sm font-medium text-gray-700">
              This is a recurring expense
            </label>
          </div>

          {isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Period</label>
              <select
                value={recurringPeriod}
                onChange={(e) => setRecurringPeriod(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
          >
            <span role="img" aria-label="add">➕</span> Add Expense
          </button>
          
          <button
            type="button"
            onClick={resetForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddExpense;
