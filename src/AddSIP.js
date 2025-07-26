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
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="sip">📈</span> Add SIP/Mutual Fund
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fund Name<span className="text-red-500">*</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. HDFC Mid-Cap Opportunities"
          value={fundName}
          onChange={(e) => setFundName(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">SIP Amount (₹)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 5000"
          value={sipAmount}
          onChange={(e) => setSipAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date<span className="text-red-500">*</span></label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Expected Return Rate (%)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 12.5"
          value={expectedReturnRate}
          onChange={(e) => setExpectedReturnRate(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (months)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 60"
          value={durationMonths}
          onChange={(e) => setDurationMonths(e.target.value)}
          min="1"
          required
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
      >
        <span role="img" aria-label="add">➕</span> Add SIP
      </button>
    </form>
  );
};

export default AddSIP;
