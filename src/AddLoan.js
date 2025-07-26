import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp} from 'firebase/firestore';

const AddLoan = ({user}) => {
  const [loanOrganizationName, setLoanOrganizationName] = useState('');
  const [loanType, setLoanType] = useState('');
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [annualInterest, setAnnualInterest] = useState('');
  const [loanTenureMonths, setLoanTenureMonths] = useState('');
  const [emi, setEmi] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [processingFee, setProcessingFee] = useState('');
  const [collateral, setCollateral] = useState('');
  const [guarantor, setGuarantor] = useState('');
  const [showCalculator, setShowCalculator] = useState(false);

  const loanTypes = [
    'Personal Loan',
    'Home Loan',
    'Car Loan',
    'Education Loan',
    'Business Loan',
    'Gold Loan',
    'Credit Card',
    'Other'
  ];

  // EMI Calculation
  useEffect(() => {
    if (loanAmount && annualInterest && loanTenureMonths) {
      const principal = parseFloat(loanAmount);
      const monthlyRate = parseFloat(annualInterest) / 12 / 100;
      const tenure = parseInt(loanTenureMonths);

      if (monthlyRate === 0) {
        const calculatedEmi = principal / tenure;
        setEmi(calculatedEmi);
        setTotalPayable(principal);
        setTotalInterest(0);
      } else {
        const calculatedEmi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / (Math.pow(1 + monthlyRate, tenure) - 1);
        const totalPayableAmount = calculatedEmi * tenure;
        const totalInterestAmount = totalPayableAmount - principal;

        setEmi(calculatedEmi);
        setTotalPayable(totalPayableAmount);
        setTotalInterest(totalInterestAmount);
      }
    } else {
      setEmi(0);
      setTotalPayable(0);
      setTotalInterest(0);
    }
  }, [loanAmount, annualInterest, loanTenureMonths]);

  const generateAmortizationSchedule = () => {
    const principal = parseFloat(loanAmount);
    const monthlyRate = parseFloat(annualInterest) / 12 / 100;
    const tenure = parseInt(loanTenureMonths);
    
    let balance = principal;
    const schedule = [];
    
    for (let month = 1; month <= tenure; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;
      
      schedule.push({
        month,
        emi: emi,
        principalPayment: principalPayment,
        interestPayment: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    return schedule;
  };

  const calculateEarlyPaymentScenario = (extraPayment) => {
    const principal = parseFloat(loanAmount);
    const monthlyRate = parseFloat(annualInterest) / 12 / 100;
    let balance = principal;
    let month = 0;
    let totalInterestPaid = 0;
    
    while (balance > 0 && month < parseInt(loanTenureMonths)) {
      month++;
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(emi + extraPayment - interestPayment, balance);
      
      totalInterestPaid += interestPayment;
      balance -= principalPayment;
    }
    
    return {
      monthsToPayOff: month,
      totalInterestSaved: totalInterest - totalInterestPaid,
      totalInterestPaid: totalInterestPaid
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loanOrganizationName || !dueDate || !loanAmount || !annualInterest) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const loanData = {
        loanOrganizationName,
        loanType,
        reason,
        dueDate: new Date(dueDate),
        loanAmount: parseFloat(loanAmount),
        annualInterest: parseFloat(annualInterest),
        loanTenureMonths: parseInt(loanTenureMonths) || null,
        emi: emi || null,
        totalPayable: totalPayable || null,
        totalInterest: totalInterest || null,
        processingFee: parseFloat(processingFee) || 0,
        collateral,
        guarantor,
        status: 'Active',
        paidAmount: 0,
        remainingAmount: parseFloat(loanAmount),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'loans'), loanData);

      // Reset form
      setLoanOrganizationName('');
      setLoanType('');
      setReason('');
      setDueDate('');
      setLoanAmount('');
      setAnnualInterest('');
      setLoanTenureMonths('');
      setProcessingFee('');
      setCollateral('');
      setGuarantor('');
      
      alert('Loan added successfully');
    } catch (error) {
      console.error('Error adding loan:', error);
      alert('Error adding loan');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="loan">💸</span> Add Loan
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Loan Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Organization/Bank <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. HDFC Bank, SBI"
              value={loanOrganizationName}
              onChange={(e) => setLoanOrganizationName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={loanType}
              onChange={(e) => setLoanType(e.target.value)}
            >
              <option value="">Select Loan Type</option>
              {loanTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose/Reason <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Home Purchase, Car, Education"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500000"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual Interest Rate (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="10.5"
                value={annualInterest}
                onChange={(e) => setAnnualInterest(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Tenure (months)
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="60"
                value={loanTenureMonths}
                onChange={(e) => setLoanTenureMonths(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee (₹)</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5000"
                value={processingFee}
                onChange={(e) => setProcessingFee(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Collateral</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Property, Vehicle, etc."
                value={collateral}
                onChange={(e) => setCollateral(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Guarantor</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Guarantor name and relationship"
              value={guarantor}
              onChange={(e) => setGuarantor(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
          >
            <span role="img" aria-label="add">➕</span> Add Loan
          </button>
        </form>

        {/* EMI Calculator & Analysis */}
        <div className="space-y-6">
          {/* EMI Summary */}
          {emi > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📊 EMI Calculation</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Monthly EMI</p>
                  <p className="text-2xl font-bold text-blue-600">₹{emi.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Payable</p>
                  <p className="text-xl font-semibold text-gray-800">₹{totalPayable.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Interest</p>
                  <p className="text-xl font-semibold text-red-600">₹{totalInterest.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Interest %</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {((totalInterest / parseFloat(loanAmount || 0)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Early Payment Calculator */}
          {emi > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Early Payment Benefits</h3>
              <div className="space-y-3">
                {[1000, 2000, 5000].map(extraAmount => {
                  const scenario = calculateEarlyPaymentScenario(extraAmount);
                  return (
                    <div key={extraAmount} className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-800">
                        Extra ₹{extraAmount}/month payment:
                      </p>
                      <div className="text-sm text-gray-600 grid grid-cols-2 gap-2 mt-1">
                        <span>Payoff in: {scenario.monthsToPayOff} months</span>
                        <span className="text-green-600">Save: ₹{scenario.totalInterestSaved.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Loan Tips */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Loan Management Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Consider making extra payments to reduce total interest</li>
              <li>• Set up automatic payments to avoid late fees</li>
              <li>• Review and compare interest rates annually</li>
              <li>• Maintain a good credit score for better rates</li>
              <li>• Consider loan consolidation if you have multiple loans</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLoan;
