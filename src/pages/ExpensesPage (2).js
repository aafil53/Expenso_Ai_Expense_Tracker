import React from 'react';
import AddExpense from '../AddExpense';
import ExpenseList from '../ExpenseList';

const ExpensesPage = () => {
    return (
        <div>
            <h2>Expenses</h2>
            <AddExpense />
            <ExpenseList />
        </div>
    );
};

export default ExpensesPage;
