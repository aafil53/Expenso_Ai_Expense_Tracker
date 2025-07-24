import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const ViolationList = ({user}) => {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'violations'),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setViolations(data);
      }
    );
    return () => unsub();
  }, [user]);

  const markStatus = async (id, status) => {
    await updateDoc(doc(db, 'users', user.uid, 'violations', id), {status});
  };

  const deleteViolation = async (id) => {
    if (window.confirm('Delete this violation?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'violations', id));
    }
  };

  const daysBetween = (date1, date2) => {
    const diff = date2 - date1;
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <h2>Your Traffic Violations</h2>
      {violations.length === 0 ? <p>No violations added yet.</p> :
        violations.map((violation) => {
          const violationDate = violation.violationDate.seconds ? new Date(violation.violationDate.seconds * 1000) : new Date(violation.violationDate);
          const dueDate = violation.dueDate.seconds ? new Date(violation.dueDate.seconds * 1000) : new Date(violation.dueDate);
          const now = new Date();

          const daysSinceViolation = daysBetween(violationDate, now);

          let daysRemaining = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
          let overdue = daysRemaining < 0;

          return (
            <div key={violation.id} style={{border: '1px solid #ccc', padding: '8px', marginBottom: '8px'}}>
              <p><strong>Violation:</strong> {violation.violationType}</p>
              <p><strong>Fine Amount:</strong> ₹{violation.fineAmount}</p>
              <p><strong>Violation Date:</strong> {violationDate.toLocaleDateString()}</p>
              <p><strong>Due Date:</strong> {dueDate.toLocaleDateString()}</p>
              <p><strong>Days Since Violation:</strong> {daysSinceViolation} days</p>
              {violation.status === 'Pending' && (
                <p style={{color: overdue ? 'red' : 'black'}}>
                  <strong>{overdue ? `Overdue by:` : `Days Remaining:`}</strong> {Math.abs(daysRemaining)} days
                </p>
              )}
              <p><strong>Status:</strong> {violation.status}</p>
              {violation.noticeNumber && <p><strong>Notice Number:</strong> {violation.noticeNumber}</p>}
              {violation.notes && <p><strong>Notes:</strong> {violation.notes}</p>}
              {violation.status === 'Pending' && (
                <>
                  <button onClick={() => markStatus(violation.id, 'Paid')}>Mark as Paid</button>
                  <button onClick={() => markStatus(violation.id, 'Cancelled')}>Cancel</button>
                </>
              )}
              <button onClick={() => deleteViolation(violation.id)}>Delete</button>
            </div>
          );
        })
      }
    </div>
  );
};

export default ViolationList;
