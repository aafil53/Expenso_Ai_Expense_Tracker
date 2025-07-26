import React, {useState} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddViolation = ({user}) => {
  const [violationType, setViolationType] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [violationDate, setViolationDate] = useState('');
  const [noticeNumber, setNoticeNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Calculate due date = violationDate + 30 days
  const calculateDueDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 30);
    return date;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!violationType || !fineAmount || !violationDate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      const dueDate = calculateDueDate(violationDate);
      await addDoc(collection(db, 'users', user.uid, 'violations'), {
        violationType,
        fineAmount: parseFloat(fineAmount),
        violationDate: new Date(violationDate),
        dueDate,
        status: 'Pending',
        noticeNumber,
        notes,
        createdAt: serverTimestamp()
      });
      setViolationType('');
      setFineAmount('');
      setViolationDate('');
      setNoticeNumber('');
      setNotes('');
      alert('Violation added successfully');
    } catch (error) {
      console.error('Error adding violation:', error);
      alert('Error adding violation');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 mb-8 max-w-md mx-auto flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="violation">🚨</span> Add Traffic Violation
      </h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Violation Type<span className="text-red-500">*</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Seat Belt, Helmet, Speed Limit"
          value={violationType}
          onChange={(e) => setViolationType(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Fine Amount (₹)<span className="text-red-500">*</span></label>
        <input
          type="number"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. 1000"
          value={fineAmount}
          onChange={(e) => setFineAmount(e.target.value)}
          min="0"
          step="0.01"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Violation Date<span className="text-red-500">*</span></label>
        <input
          type="date"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={violationDate}
          onChange={(e) => setViolationDate(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notice Number <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. TN01AB1234"
          value={noticeNumber}
          onChange={(e) => setNoticeNumber(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g. Location, Officer details"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
      >
        <span role="img" aria-label="add">➕</span> Add Violation
      </button>
    </form>
  );
};

export default AddViolation;
