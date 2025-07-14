import React, {useState, useEffect} from 'react';
import './App.css';
import AddExpense from './AddExpense';
import ExpenseList from './ExpenseList';
import Login from './Login';
import Logout from './Logout'; // ✅ Import Logout
import {auth} from './firebase';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="App">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="App">
        <Login />
      </div>
    );
  }

  return (
    <div className="App">
      <Logout /> {/* ✅ Added logout button */}
      <AddExpense user={user} />
      <ExpenseList user={user} />
    </div>
  );
}

export default App;
