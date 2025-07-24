import React from 'react';
import {Link} from 'react-router-dom';

const Navbar = () => {
  return (
    <nav style={{padding: '10px', background: '#f0f0f0', display: 'flex', gap: '20px'}}>
      <Link to="/">Dashboard</Link>
      <Link to="/expenses">Expenses</Link>
      <Link to="/debts-owed-by-me">Debts Owed</Link>
      <Link to="/debts-owed-to-me">Debts Owed To Me</Link>
      <Link to="/budget">Budget</Link>
      <Link to="/loan-pending">Loan Pending</Link>
      <Link to="/sip">SIP Mutual Funds</Link>
      <Link to="/stocks">Stocks Invested</Link>
      <Link to="/tax">Tax</Link>
      <Link to="/violations">Go to Violations</Link>
    </nav>
  );
};

export default Navbar;
