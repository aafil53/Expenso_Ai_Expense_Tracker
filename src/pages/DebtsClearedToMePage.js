import React, {useState, useEffect, useRef} from 'react';
import {db} from '../firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';

const DebtsClearedToMePage = ({user}) => {
  const [debts, setDebts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({amount: '', debtorName: '', dueDate: '', note: ''});
  const [message, setMessage] = useState('');
  const messageRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setDebts([]);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'debtsClearedToMe'),
      orderBy('clearedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtsArr = [];
      snapshot.forEach(doc => debtsArr.push({id: doc.id, ...doc.data()}));
      setDebts(debtsArr);
    }, (error) => {
      console.error('Error fetching cleared debts:', error);
    });

    return () => unsubscribe();
  }, [user]);

  const showMessage = (msg) => {
    setMessage(msg);
    if (messageRef.current) clearTimeout(messageRef.current);
    messageRef.current = setTimeout(() => setMessage(''), 4000);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'debtsClearedToMe', id));
      showMessage('Cleared debt deleted successfully!');
    } catch (error) {
      console.error('Error deleting cleared debt:', error);
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
      await updateDoc(doc(db, 'users', user.uid, 'debtsClearedToMe', editId), {
        amount: parseFloat(editData.amount),
        debtorName: editData.debtorName,
        dueDate: editData.dueDate,
        note: editData.note
      });
      setEditId(null);
      setEditData({amount: '', debtorName: '', dueDate: '', note: ''});
      showMessage('Cleared debt updated successfully!');
    } catch (error) {
      console.error('Error updating cleared debt:', error);
    }
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditData({amount: '', debtorName: '', dueDate: '', note: ''});
  };

  if (debts.length === 0) return <p>No cleared debts found.</p>;

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Cleared Debts</h2>
      {message && <p className="text-green-600 mb-2">{message}</p>}
      <ul>
        {debts.map((debt) => (
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
                  <button
                    onClick={saveEdit}
                    className="bg-green-500 text-white p-1 rounded text-sm flex-1"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-gray-500 text-white p-1 rounded text-sm flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div><strong>Amount:</strong> ₹{debt.amount}</div>
                <div><strong>Debtor:</strong> {debt.debtorName || 'Unknown'}</div>
                <div><strong>Due Date:</strong> {debt.dueDate || 'N/A'}</div>
                {debt.note && <div><strong>Note:</strong> {debt.note}</div>}
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => startEditing(debt)}
                    className="bg-blue-500 text-white p-1 rounded text-sm flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="bg-red-500 text-white p-1 rounded text-sm flex-1"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DebtsClearedToMePage;
