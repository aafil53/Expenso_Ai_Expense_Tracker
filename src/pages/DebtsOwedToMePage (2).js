// src/pages/DebtsOwedToMePage.js
import React from 'react';
import AddDebtOwedToMe from '../AddDebtOwedToMe';
import DebtOwedToMeList from '../DebtOwedToMeList';

const DebtsOwedToMePage = () => {
    return (
        <div>
            <h2>Debts Owed To Me</h2>
            <AddDebtOwedToMe />
            <DebtOwedToMeList />
        </div>
    );
};

export default DebtsOwedToMePage;
