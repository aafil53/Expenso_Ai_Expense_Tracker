import React, {useState, useEffect} from 'react';
import {db} from '../firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp
} from 'firebase/firestore';

const DebtsOwedToMePage = ({user}) => {
  const [debts, setDebts] = useState([]);
  const [newDebt, setNewDebt] = useState({amount: '', debtorName: '', dueDate: '', note: ''});
  const [editId, setEditId] = useState(null);
  const [editDebt, setEditDebt] = useState({amount: '', debtorName: '', dueDate: '', note: ''});

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'debtsOwedToMe'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const debtsList = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setDebts(debtsList);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!newDebt.amount || !newDebt.debtorName || !newDebt.dueDate) return;

    await addDoc(collection(db, 'users', user.uid, 'debtsOwedToMe'), {
      amount: parseFloat(newDebt.amount),
      debtorName: newDebt.debtorName,
      dueDate: newDebt.dueDate,
      note: newDebt.note || '',
      createdAt: serverTimestamp()
    });

    setNewDebt({amount: '', debtorName: '', dueDate: '', note: ''});
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', id));
  };

  const startEdit = (debt) => {
    setEditId(debt.id);
    setEditDebt({
      amount: debt.amount,
      debtorName: debt.debtorName,
      dueDate: debt.dueDate,
      note: debt.note || ''
    });
  };

  const handleSaveEdit = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'debtsOwedToMe', id), {
      amount: parseFloat(editDebt.amount),
      debtorName: editDebt.debtorName,
      dueDate: editDebt.dueDate,
      note: editDebt.note || ''
    });
    setEditId(null);
    setEditDebt({amount: '', debtorName: '', dueDate: '', note: ''});
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Debts Owed To Me</h2>

      {/* Add Debt Form */}
      <form onSubmit={handleAddDebt} className="space-y-2 mb-6">
        <input
          type="number"
          placeholder="Amount"
          value={newDebt.amount}
          onChange={(e) => setNewDebt({...newDebt, amount: e.target.value})}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Debtor Name"
          value={newDebt.debtorName}
          onChange={(e) => setNewDebt({...newDebt, debtorName: e.target.value})}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="date"
          value={newDebt.dueDate}
          onChange={(e) => setNewDebt({...newDebt, dueDate: e.target.value})}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={newDebt.note}
          onChange={(e) => setNewDebt({...newDebt, note: e.target.value})}
          className="border p-2 rounded w-full"
        />
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Add Debt
        </button>
      </form>

      {/* Debts List */}
      {debts.length === 0 ? (
        <p className="text-center">No debts found.</p>
      ) : (
        debts.map((debt) => (
          <div key={debt.id} className="border p-3 rounded mb-2">
            {editId === debt.id ? (
              <>
                <input
                  type="number"
                  value={editDebt.amount}
                  onChange={(e) => setEditDebt({...editDebt, amount: e.target.value})}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="text"
                  value={editDebt.debtorName}
                  onChange={(e) => setEditDebt({...editDebt, debtorName: e.target.value})}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="date"
                  value={editDebt.dueDate}
                  onChange={(e) => setEditDebt({...editDebt, dueDate: e.target.value})}
                  className="border p-1 rounded w-full mb-1"
                />
                <input
                  type="text"
                  value={editDebt.note}
                  onChange={(e) => setEditDebt({...editDebt, note: e.target.value})}
                  className="border p-1 rounded w-full mb-1"
                />
                <button
                  onClick={() => handleSaveEdit(debt.id)}
                  className="bg-green-500 text-white p-1 rounded w-full mt-1"
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <div><strong>₹{debt.amount}</strong> - {debt.debtorName}</div>
                <div>Due: {debt.dueDate}</div>
                {debt.note && <div>Note: {debt.note}</div>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => startEdit(debt)}
                    className="bg-blue-500 text-white p-1 rounded flex-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(debt.id)}
                    className="bg-red-500 text-white p-1 rounded flex-1"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default DebtsOwedToMePage;
