// src/pages/DebtsOwedToMePage.js
import React, {useState, useEffect, useRef} from 'react';
import {db} from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';

const DebtsOwedToMePage = ({user}) => {
  const [debts, setDebts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({amount: '', debtorName: '', dueDate: '', note: ''});
  const [message, setMessage] = useState('');
  const [paidDebts, setPaidDebts] = useState(new Set());
  const messageRef = useRef(null);
  
  // Add debt form state
  const [newDebt, setNewDebt] = useState({debtorName: '', amount: '', dueDate: '', note: ''});

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'debtsOwedToMe'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = [];
      snapshot.forEach(doc => data.push({id: doc.id, ...doc.data()}));
      setDebts(data);
    }, error => console.error('Error fetching debts owed to me:', error));

    return () => unsubscribe();
  }, [user]);

  const showMessage = (msg) => {
    setMessage(msg);
    if (messageRef.current) clearTimeout(messageRef.current);
    messageRef.current = setTimeout(() => setMessage(''), 3000);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', id));
      showMessage('Debt deleted successfully!');
    } catch (error) {
      console.error('Error deleting debt:', error);
    }
  };

  const startEditing = (debt) => {
    setEditId(debt.id);
    setEditData({
      amount: debt.amount,
      debtorName: debt.debtorName || '',
      dueDate: debt.dueDate || '',
      note: debt.note || ''
    });
  };

  const handleEditChange = (e) => {
    setEditData({...editData, [e.target.name]: e.target.value});
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', editId), {
        amount: parseFloat(editData.amount),
        debtorName: editData.debtorName,
        dueDate: editData.dueDate,
        note: editData.note
      });
      setEditId(null);
      setEditData({amount: '', debtorName: '', dueDate: '', note: ''});
      showMessage('Debt updated successfully!');
    } catch (error) {
      console.error('Error updating debt:', error);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({amount: '', debtorName: '', dueDate: '', note: ''});
  };

  const markAsPaid = async (id) => {
    try {
      // Update local state immediately for instant feedback
      setPaidDebts(prev => new Set([...prev, id]));
      
      // Update database
      await updateDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', id), {
        status: 'Paid',
        paidAt: Timestamp.now()
      });
      showMessage('Marked as paid!');
    } catch (error) {
      console.error('Error marking as paid:', error);
    }
  };

  const addDebt = async () => {
    if (!newDebt.debtorName || !newDebt.amount || !newDebt.dueDate) {
      showMessage('Please fill all required fields');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'debtsOwedToMe'), {
        debtorName: newDebt.debtorName,
        amount: parseFloat(newDebt.amount),
        dueDate: newDebt.dueDate,
        note: newDebt.note,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setNewDebt({debtorName: '', amount: '', dueDate: '', note: ''});
      showMessage('Debt added successfully!');
    } catch (error) {
      console.error('Error adding debt:', error);
      showMessage('Error adding debt');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Debts Owed To Me</h2>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      
      {/* Add Debt Form */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <h3 className="text-lg font-medium mb-3">Add New Debt</h3>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Debtor Name *"
            value={newDebt.debtorName}
            onChange={(e) => setNewDebt({...newDebt, debtorName: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="number"
            placeholder="Amount (₹) *"
            value={newDebt.amount}
            onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
          />
          <input
            type="date"
            value={newDebt.dueDate}
            onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="Note (optional)"
            value={newDebt.note}
            onChange={(e) => setNewDebt({...newDebt, note: e.target.value})}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addDebt}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow transition-colors"
          >
            Add Debt
          </button>
        </div>
      </div>

      <ul>
        {debts.length === 0 && <p>No debts found.</p>}
        {debts.map(debt => (
          <li key={debt.id} className="border p-2 mb-2 rounded">
            {editId === debt.id ? (
              <>
                <input
                  type="number"
                  name="amount"
                  value={editData.amount}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="text"
                  name="debtorName"
                  placeholder="Debtor Name"
                  value={editData.debtorName}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="date"
                  name="dueDate"
                  value={editData.dueDate}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="text"
                  name="note"
                  placeholder="Note (optional)"
                  value={editData.note}
                  onChange={handleEditChange}
                  className="border p-1 rounded w-full mb-1"
                />
                <div className="flex gap-2">
                  <button onClick={saveEdit} className="bg-green-500 text-white p-1 rounded text-sm flex-1">Save</button>
                  <button onClick={cancelEdit} className="bg-gray-500 text-white p-1 rounded text-sm flex-1">Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div><strong>Amount:</strong> ₹{debt.amount}</div>
                <div><strong>Debtor:</strong> {debt.debtorName || 'Unknown'}</div>
                <div><strong>Due Date:</strong> {debt.dueDate || 'N/A'}</div>
                {debt.note && <div><strong>Note:</strong> {debt.note}</div>}
                <div><strong>Status:</strong> {(debt.status === 'Paid' || paidDebts.has(debt.id)) ? 'Paid ✅' : (debt.status || 'pending')}</div>
                <div className="flex gap-2 mt-1">
                  {(debt.status !== 'Paid' && !paidDebts.has(debt.id)) ? (
                    <button onClick={() => markAsPaid(debt.id)} className="bg-green-500 text-white p-1 rounded text-sm flex-1">
                      Mark as Paid
                    </button>
                  ) : (
                    <span className="text-green-600 font-bold p-1 text-sm flex-1">✅ Paid</span>
                  )}
                  <button onClick={() => startEditing(debt)} className="bg-blue-500 text-white p-1 rounded text-sm flex-1">Edit</button>
                  <button onClick={() => handleDelete(debt.id)} className="bg-red-500 text-white p-1 rounded text-sm flex-1">Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DebtsOwedToMePage;
