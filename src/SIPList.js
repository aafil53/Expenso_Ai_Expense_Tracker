import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const SIPList = ({user}) => {
  const [sips, setSips] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'sips'),
      (snapshot) => {
        const sipData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setSips(sipData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsCompleted = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'sips', id), {status: 'Completed'});
  };

  const deleteSIP = async (id) => {
    if (window.confirm('Delete this SIP?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'sips', id));
    }
  };

  const calculateMonthsElapsed = (startDate) => {
    const now = new Date();
    const start = new Date(startDate.seconds * 1000);
    const diff = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return diff >= 0 ? diff : 0;
  };

  return (
    <div>
      <h2>Your SIPs/Mutual Funds</h2>
      {sips.length === 0 ? <p>No SIPs added yet.</p> :
        sips.map((sip) => {
          const monthsElapsed = calculateMonthsElapsed(sip.startDate);
          const monthsToConsider = Math.min(monthsElapsed, sip.durationMonths);
          const totalInvested = sip.sipAmount * monthsToConsider;
          const r = sip.expectedReturnRate / 12 / 100;
          const n = monthsToConsider;
          const estimatedReturns = sip.sipAmount * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

          return (
            <div key={sip.id} style={{border: '1px solid #ccc', padding: '8px', marginBottom: '8px'}}>
              <p><strong>Fund:</strong> {sip.fundName}</p>
              <p><strong>SIP Amount:</strong> ₹{sip.sipAmount}</p>
              <p><strong>Start Date:</strong> {new Date(sip.startDate.seconds * 1000).toLocaleDateString()}</p>
              <p><strong>Expected Return Rate:</strong> {sip.expectedReturnRate}%</p>
              <p><strong>Duration:</strong> {sip.durationMonths} months</p>
              <p><strong>Months Elapsed:</strong> {monthsToConsider} months</p>
              <p><strong>Total Invested:</strong> ₹{totalInvested.toFixed(2)}</p>
              <p><strong>Estimated Returns:</strong> ₹{estimatedReturns.toFixed(2)}</p>
              <p><strong>Status:</strong> {sip.status}</p>
              {sip.status === 'Active' && (
                <button onClick={() => markAsCompleted(sip.id)}>Mark as Completed</button>
              )}
              <button onClick={() => deleteSIP(sip.id)}>Delete</button>
            </div>
          );
        })
      }
    </div>
  );
};

export default SIPList;
