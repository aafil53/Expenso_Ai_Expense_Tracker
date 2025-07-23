import React, {useState} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddSIP = ({user}) => {
  const [fundName, setFundName] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fundName || !sipAmount || !startDate || !expectedReturnRate || !durationMonths) {
      alert('Please fill all fields');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'sips'), {
        fundName,
        sipAmount: parseFloat(sipAmount),
        startDate: new Date(startDate),
        expectedReturnRate: parseFloat(expectedReturnRate),
        durationMonths: parseInt(durationMonths),
        status: 'Active',
        createdAt: serverTimestamp()
      });
      setFundName('');
      setSipAmount('');
      setStartDate('');
      setExpectedReturnRate('');
      setDurationMonths('');
      alert('SIP added successfully');
    } catch (error) {
      console.error('Error adding SIP:', error);
      alert('Error adding SIP');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add SIP/Mutual Fund</h2>
      <input
        type="text"
        placeholder="Fund Name"
        value={fundName}
        onChange={(e) => setFundName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="SIP Amount (₹)"
        value={sipAmount}
        onChange={(e) => setSipAmount(e.target.value)}
        required
      />
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Expected Return Rate (%)"
        value={expectedReturnRate}
        onChange={(e) => setExpectedReturnRate(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Duration (months)"
        value={durationMonths}
        onChange={(e) => setDurationMonths(e.target.value)}
        required
      />
      <button type="submit">Add SIP</button>
    </form>
  );
};

export default AddSIP;
