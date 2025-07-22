import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const LoanList = ({user}) => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'loans'),
      (snapshot) => {
        const loanData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setLoans(loanData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsPaid = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'loans', id), {status: 'Paid'});
  };

  const deleteLoan = async (id) => {
    if (window.confirm('Delete this loan?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'loans', id));
    }
  };

  return (
    <div>
      <h2>Loans You Owe</h2>
      {loans.length === 0 ? <p>No loans added yet.</p> :
        loans.map((loan) => {
          const monthlyInterestRate = loan.annualInterest / 12 / 100;
          const monthlyInterestAmount = loan.loanAmount * monthlyInterestRate;

          return (
            <div key={loan.id} style={{border: '1px solid #ccc', padding: '8px', marginBottom: '8px'}}>
              <p><strong>Organization:</strong> {loan.loanOrganizationName}</p>
              {loan.reason && <p><strong>Reason:</strong> {loan.reason}</p>}
              <p><strong>Due Date:</strong> {new Date(loan.dueDate.seconds * 1000).toLocaleDateString()}</p>
              <p><strong>Loan Amount:</strong> ₹{loan.loanAmount}</p>
              <p><strong>Annual Interest:</strong> {loan.annualInterest}%</p>
              <p><strong>Monthly Interest Amount:</strong> ₹{monthlyInterestAmount.toFixed(2)}</p>
              <p><strong>Status:</strong> {loan.status}</p>
              {loan.status === 'Pending' && (
                <button onClick={() => markAsPaid(loan.id)}>Mark as Paid</button>
              )}
              <button onClick={() => deleteLoan(loan.id)}>Delete</button>
            </div>
          );
        })
      }
    </div>
  );
};

export default LoanList;
