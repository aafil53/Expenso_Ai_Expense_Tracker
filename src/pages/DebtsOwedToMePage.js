// src/pages/DebtsOwedToMePage.js
import React, {useState, useEffect, useRef} from 'react';
import {db} from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';

const DebtsOwedToMePage = ({user}) => {
  const [debts, setDebts] = useState([]);
  const [formData, setFormData] = useState({amount: '', debtorName: '', dueDate: '', note: ''});
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({amount: '', debtorName: '', dueDate: '', note: ''});
  const [message, setMessage] = useState('');
  const messageRef = useRef(null);

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

  const handleInputChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.debtorName || !formData.dueDate) {
      showMessage('Amount, Debtor Name, and Due Date are required.');
      return;
    }
    try {
      await addDoc(collection(db, 'users', user.uid, 'debtsOwedToMe'), {
        amount: parseFloat(formData.amount),
        debtorName: formData.debtorName,
        dueDate: formData.dueDate,
        note: formData.note,
        status: 'pending',
        createdAt: Timestamp.now()
      });
      setFormData({amount: '', debtorName: '', dueDate: '', note: ''});
      showMessage('Debt added successfully!');
    } catch (error) {
      console.error('Error adding debt:', error);
      showMessage('Failed to add debt.');
    }
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

  const markAsCleared = async (id) => {
    try {
      await updateDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', id), {
        status: 'cleared',
        clearedAt: Timestamp.now()
      });
      showMessage('Marked as cleared!');
    } catch (error) {
      console.error('Error marking as cleared:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Debts Owed To Me</h2>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      
      {/* Add Debt Form */}
      <form onSubmit={handleAddDebt} className="mb-6 p-4 border rounded bg-gray-50">
        <h3 className="text-lg font-medium mb-3">Add New Debt</h3>
        <div className="flex flex-col gap-2">
          <input
            type="number"
            name="amount"
            placeholder="Amount"
            value={formData.amount}
            onChange={handleInputChange}
            required
            className="border p-2 rounded"
            min="0.01"
            step="0.01"
          />
          <input
            type="text"
            name="debtorName"
            placeholder="Debtor Name"
            value={formData.debtorName}
            onChange={handleInputChange}
            required
            className="border p-2 rounded"
          />
          <input
            type="date"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleInputChange}
            required
            className="border p-2 rounded"
          />
          <input
            type="text"
            name="note"
            placeholder="Note (optional)"
            value={formData.note}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded">
            Add Debt
          </button>
        </div>
      </form>

      {/* Debts List */}
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
                <div className="flex items-center gap-2 mb-2">
                  <div><strong>Amount:</strong> ₹{debt.amount}</div>
                  {debt.status === 'cleared' ? (
                    <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">✔️ Cleared</span>
                  ) : (
                    <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Pending</span>
                  )}
                </div>
                <div><strong>Debtor:</strong> {debt.debtorName || 'Unknown'}</div>
                <div><strong>Due Date:</strong> {debt.dueDate || 'N/A'}</div>
                {debt.note && <div><strong>Note:</strong> {debt.note}</div>}
                <div className="flex gap-2 mt-1">
                  {debt.status !== 'cleared' && (
                    <button onClick={() => markAsCleared(debt.id)} className="bg-green-500 hover:bg-green-600 text-white p-1 rounded text-sm flex-1 flex items-center justify-center gap-1">
                      <span role="img" aria-label="cleared">✔️</span> Mark as Cleared
                    </button>
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
