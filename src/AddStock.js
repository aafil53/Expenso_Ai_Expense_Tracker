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
    <form onSubmit={handleSubmit}>
      <h2>Add Stock</h2>
      <input
        type="text"
        placeholder="Stock Name"
        value={stockName}
        onChange={(e) => setStockName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Quantity"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Buy Price (₹)"
        value={buyPrice}
        onChange={(e) => setBuyPrice(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Current Price (₹)"
        value={currentPrice}
        onChange={(e) => setCurrentPrice(e.target.value)}
        required
      />
      <input
        type="date"
        value={buyDate}
        onChange={(e) => setBuyDate(e.target.value)}
        required
      />
      <button type="submit">Add Stock</button>
    </form>
  );
};

export default AddStock;
