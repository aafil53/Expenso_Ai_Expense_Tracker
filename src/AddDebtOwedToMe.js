import React, {useState} from 'react';
import {db, auth} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddDebtOwedToMe = () => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !amount.trim()) { // ✅ Prevent empty or whitespace-only submissions
      alert('Name and amount are required.');
      return;
    }
    try {
      const userId = auth.currentUser.uid;
      await addDoc(
        collection(db, `users/${userId}/debtsOwedToMe`),
        {
          name: name.trim(),
          amount: Math.abs(parseFloat(amount)), // ✅ Clean positive numeric value
          description: description.trim(),
          date: serverTimestamp()
        }
      );
      setName('');
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Error adding debt:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        type="number"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
      />
      <button type="submit">Add Debt Owed To Me</button>
    </form>
  );
};

export default AddDebtOwedToMe;
