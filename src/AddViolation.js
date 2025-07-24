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
    <form onSubmit={handleSubmit}>
      <h2>Add Traffic Violation</h2>
      <input
        type="text"
        placeholder="Violation Type (Seat Belt, Helmet, etc.)"
        value={violationType}
        onChange={(e) => setViolationType(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Fine Amount (₹)"
        value={fineAmount}
        onChange={(e) => setFineAmount(e.target.value)}
        required
      />
      <input
        type="date"
        value={violationDate}
        onChange={(e) => setViolationDate(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Notice Number (optional)"
        value={noticeNumber}
        onChange={(e) => setNoticeNumber(e.target.value)}
      />
      <input
        type="text"
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <button type="submit">Add Violation</button>
    </form>
  );
};

export default AddViolation;
