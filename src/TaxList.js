import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp} from 'firebase/firestore';

const TaxList = ({user}) => {
  const [taxes, setTaxes] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'taxes'),
      (snapshot) => {
        const taxData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setTaxes(taxData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsPaid = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'taxes', id), {
      status: 'Paid',
      paidDate: serverTimestamp()
    });
  };

  const deleteTax = async (id) => {
    if (window.confirm('Delete this tax entry?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'taxes', id));
    }
  };

  const calculateDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate.seconds * 1000);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <h2>Your Taxes</h2>
      {taxes.length === 0 ? <p>No tax entries added yet.</p> :
        taxes.map((tax) => {
          const daysRemaining = tax.status === 'Pending' ? calculateDaysRemaining(tax.dueDate) : null;
          return (
            <div key={tax.id} style={{border: '1px solid #ccc', padding: '8px', marginBottom: '8px'}}>
              <p><strong>Tax Type:</strong> {tax.taxType}</p>
              <p><strong>Amount:</strong> ₹{tax.amount}</p>
              <p><strong>Due Date:</strong> {new Date(tax.dueDate.seconds * 1000).toLocaleDateString()}</p>
              {tax.notes && <p><strong>Notes:</strong> {tax.notes}</p>}
              {tax.status === 'Pending' && (
                <p>
                  <strong>{daysRemaining >= 0 ? 'Days Remaining:' : 'Overdue by:'}</strong> {Math.abs(daysRemaining)} days
                </p>
              )}
              {tax.status === 'Paid' && tax.paidDate && (
                <p><strong>Paid Date:</strong> {new Date(tax.paidDate.seconds * 1000).toLocaleDateString()}</p>
              )}
              <p><strong>Status:</strong> {tax.status}</p>
              {tax.status === 'Pending' && (
                <button onClick={() => markAsPaid(tax.id)}>Mark as Paid</button>
              )}
              <button onClick={() => deleteTax(tax.id)}>Delete</button>
            </div>
          );
        })
      }
    </div>
  );
};

export default TaxList;
