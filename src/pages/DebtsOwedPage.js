import React from 'react';
import AddDebt from '../AddDebt';
import DebtList from '../DebtList';

const DebtsOwedPage = () => {
    return (
        <div>
            <h2>Debts You Owe</h2>
            <AddDebt />
            <DebtList />
        </div>
    );
};

export default DebtsOwedPage;
