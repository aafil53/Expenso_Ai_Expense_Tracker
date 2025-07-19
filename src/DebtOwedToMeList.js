import React, {useEffect, useState} from 'react';
import {db, auth} from './firebase';
import {collection, onSnapshot} from 'firebase/firestore';

const DebtOwedToMeList = () => {
  const [debts, setDebts] = useState([]);

  useEffect(() => {
    const userId = auth.currentUser.uid;
    const debtsRef = collection(db, `users/${userId}/debtsOwedToMe`);
    const unsubscribe = onSnapshot(debtsRef, (snapshot) => {
      const debtsData = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
      setDebts(debtsData);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <h3>Debts Owed To You</h3>
      <ul>
        {debts.map(debt => (
          <li key={debt.id}>
            {debt.name} owes ₹{debt.amount} ({debt.description || 'No description'})
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DebtOwedToMeList;
