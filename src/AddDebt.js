// src/AddDebt.js
import React, {useState} from 'react';
import {db, auth} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddDebt = () => {
    const [person, setPerson] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!person || !amount || !dueDate) return;

        try {
            await addDoc(collection(db, 'debts'), {
                userId: auth.currentUser.uid,
                person,
                amount: parseFloat(amount),
                dueDate: new Date(dueDate),
                notes,
                status: 'unpaid',
                createdAt: serverTimestamp()
            });

            setPerson('');
            setAmount('');
            setDueDate('');
            setNotes('');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input type="text" placeholder="Person" value={person} onChange={(e) => setPerson(e.target.value)} required />
            <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
            <input type="text" placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button type="submit">Add Debt</button>
        </form>
    );
};

export default AddDebt;
