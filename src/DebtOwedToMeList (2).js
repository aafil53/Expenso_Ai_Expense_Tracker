// src/DebtOwedToMeList.js
import React, {useState, useEffect} from 'react';
import {db, auth} from './firebase';
import {collection, query, where, onSnapshot, updateDoc, doc} from 'firebase/firestore';

const DebtOwedToMeList = () => {
    const [debts, setDebts] = useState([]);

    useEffect(() => {
        const q = query(
            collection(db, 'debtsOwedToMe'),
            where('userId', '==', auth.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const debtData = [];
            snapshot.forEach((doc) => {
                debtData.push({...doc.data(), id: doc.id});
            });
            setDebts(debtData);
        });

        return () => unsubscribe();
    }, []);

    const markAsPaid = async (id) => {
        try {
            await updateDoc(doc(db, 'debtsOwedToMe', id), {
                status: 'paid'
            });
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div>
            <h3>Debts Owed To You</h3>
            {debts.map((debt) => (
                <div key={debt.id} style={{border: '1px solid #ccc', margin: '8px', padding: '8px'}}>
                    <p><strong>From:</strong> {debt.person}</p>
                    <p><strong>Amount:</strong> ₹{debt.amount}</p>
                    <p><strong>Due:</strong> {new Date(debt.dueDate.seconds * 1000).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> {debt.status}</p>
                    {debt.notes && <p><strong>Notes:</strong> {debt.notes}</p>}
                    {debt.status === 'unpaid' && <button onClick={() => markAsPaid(debt.id)}>Mark as Paid</button>}
                </div>
            ))}
        </div>
    );
};

export default DebtOwedToMeList;
