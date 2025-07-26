import React, {useState} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddStock = ({user}) => {
  const [stockName, setStockName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stockName || !quantity || !buyPrice || !currentPrice || !buyDate) {
      alert('Please fill all fields');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'stocks'), {
        stockName,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        currentPrice: parseFloat(currentPrice),
        buyDate: new Date(buyDate),
        status: 'Holding',
        createdAt: serverTimestamp()
      });
      setStockName('');
      setQuantity('');
      setBuyPrice('');
      setCurrentPrice('');
      setBuyDate('');
      alert('Stock added successfully');
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="stock">📊</span> Add Stock
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Name<span className="text-red-500">*</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. TCS"
          value={stockName}
          onChange={(e) => setStockName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Buy Price (₹)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 1500"
          value={buyPrice}
          onChange={(e) => setBuyPrice(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Current Price (₹)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 1600"
          value={currentPrice}
          onChange={(e) => setCurrentPrice(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Buy Date<span className="text-red-500">*</span></label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={buyDate}
          onChange={(e) => setBuyDate(e.target.value)}
          required
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
      >
        <span role="img" aria-label="add">➕</span> Add Stock
      </button>
    </form>
  );
};

export default AddStock;
