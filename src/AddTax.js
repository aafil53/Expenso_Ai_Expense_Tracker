import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';

const AddTax = ({user}) => {
  const [taxType, setTaxType] = useState('');
  const [taxSubType, setTaxSubType] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [financialYear, setFinancialYear] = useState('');
  const [assessmentYear, setAssessmentYear] = useState('');
  const [quarter, setQuarter] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [deductions, setDeductions] = useState('');
  const [taxableIncome, setTaxableIncome] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [calculatedTax, setCalculatedTax] = useState(0);
  const [panNumber, setPanNumber] = useState('');
  const [challanNumber, setChallanNumber] = useState('');

  const taxTypes = {
    'Income Tax': ['Advance Tax', 'Self Assessment Tax', 'TDS', 'TCS', 'Regular Assessment'],
    'GST': ['CGST', 'SGST', 'IGST', 'Compensation Cess', 'Late Fee'],
    'Property Tax': ['Municipal Tax', 'Water Tax', 'Sewerage Tax', 'Property Transfer Tax'],
    'Professional Tax': ['State Professional Tax', 'Municipal Professional Tax'],
    'Service Tax': ['Service Tax', 'Swachh Bharat Cess', 'Krishi Kalyan Cess'],
    'Corporate Tax': ['Corporate Income Tax', 'MAT', 'AMT', 'Dividend Distribution Tax'],
    'Other': ['Wealth Tax', 'Gift Tax', 'Capital Gains Tax', 'Securities Transaction Tax']
  };

  const quarters = ['Q1 (Apr-Jun)', 'Q2 (Jul-Sep)', 'Q3 (Oct-Dec)', 'Q4 (Jan-Mar)'];

  // Calculate Financial Year and Assessment Year based on current date
  useEffect(() => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // 0-indexed, so add 1
    
    if (currentMonth >= 4) {
      // Current FY
      setFinancialYear(`${currentYear}-${(currentYear + 1).toString().slice(-2)}`);
      setAssessmentYear(`${currentYear + 1}-${(currentYear + 2).toString().slice(-2)}`);
    } else {
      // Previous FY
      setFinancialYear(`${currentYear - 1}-${currentYear.toString().slice(-2)}`);
      setAssessmentYear(`${currentYear}-${(currentYear + 1).toString().slice(-2)}`);
    }
  }, []);

  // Tax calculation based on taxable income and rate
  useEffect(() => {
    if (taxableIncome && taxRate) {
      const income = parseFloat(taxableIncome);
      const rate = parseFloat(taxRate);
      const tax = (income * rate) / 100;
      setCalculatedTax(tax);
      setAmount(tax.toString());
    }
  }, [taxableIncome, taxRate]);

  // Auto-populate tax rate based on income slabs (simplified)
  const getIncomeTaxRate = (income) => {
    if (income <= 250000) return 0;
    if (income <= 500000) return 5;
    if (income <= 1000000) return 20;
    return 30;
  };

  const handleTaxableIncomeChange = (value) => {
    setTaxableIncome(value);
    if (taxType === 'Income Tax') {
      const rate = getIncomeTaxRate(parseFloat(value) || 0);
      setTaxRate(rate.toString());
    }
  };

  const calculateTaxSavings = () => {
    const deductionAmount = parseFloat(deductions) || 0;
    const income = parseFloat(taxableIncome) || 0;
    const rate = parseFloat(taxRate) || 0;
    
    const taxWithoutDeduction = (income * rate) / 100;
    const taxWithDeduction = ((income - deductionAmount) * rate) / 100;
    const savings = taxWithoutDeduction - taxWithDeduction;
    
    return {
      originalTax: taxWithoutDeduction,
      finalTax: Math.max(0, taxWithDeduction),
      savings: Math.max(0, savings)
    };
  };

  const generateTaxDueDates = (type, fy) => {
    const year = parseInt(fy.split('-')[0]);
    const dueDates = {
      'Advance Tax': [
        { quarter: 'Q1', date: `${year}-06-15`, description: 'First installment (15%)' },
        { quarter: 'Q2', date: `${year}-09-15`, description: 'Second installment (45%)' },
        { quarter: 'Q3', date: `${year}-12-15`, description: 'Third installment (75%)' },
        { quarter: 'Q4', date: `${year + 1}-03-15`, description: 'Fourth installment (100%)' }
      ],
      'GST': [
        { quarter: 'Monthly', date: `${year}-04-20`, description: 'Monthly GST Return' }
      ]
    };
    return dueDates[type] || [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taxType || !amount || !dueDate) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const taxData = {
        taxType,
        taxSubType,
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        notes,
        financialYear,
        assessmentYear,
        quarter,
        paymentStatus,
        deductions: parseFloat(deductions) || 0,
        taxableIncome: parseFloat(taxableIncome) || 0,
        taxRate: parseFloat(taxRate) || 0,
        panNumber,
        challanNumber,
        status: 'Pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'taxes'), taxData);

      // Update tax statistics
      const taxStatsRef = doc(db, 'users', user.uid, 'statistics', 'taxSummary');
      const taxStatsSnap = await getDoc(taxStatsRef);
      
      if (taxStatsSnap.exists()) {
        const currentStats = taxStatsSnap.data();
        const yearlyTax = currentStats[financialYear] || 0;
        await updateDoc(taxStatsRef, {
          [financialYear]: yearlyTax + parseFloat(amount),
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(taxStatsRef, {
          [financialYear]: parseFloat(amount),
          lastUpdated: serverTimestamp()
        });
      }

      // Create reminder for next tax payment if it's advance tax
      if (taxType === 'Income Tax' && taxSubType === 'Advance Tax') {
        const dueDates = generateTaxDueDates('Advance Tax', financialYear);
        const currentQuarterIndex = quarters.indexOf(quarter);
        
        if (currentQuarterIndex < 3) { // Not the last quarter
          const nextDueDate = dueDates[currentQuarterIndex + 1];
          if (nextDueDate) {
            await addDoc(collection(db, 'users', user.uid, 'reminders'), {
              type: 'tax',
              title: `Advance Tax - ${nextDueDate.description}`,
              dueDate: new Date(nextDueDate.date),
              amount: parseFloat(amount),
              financialYear,
              createdAt: serverTimestamp()
            });
          }
        }
      }

      // Reset form
      setTaxType('');
      setTaxSubType('');
      setAmount('');
      setDueDate('');
      setNotes('');
      setQuarter('');
      setPaymentStatus('Pending');
      setDeductions('');
      setTaxableIncome('');
      setTaxRate('');
      setPanNumber('');
      setChallanNumber('');
      
      alert('Tax entry added successfully');
    } catch (error) {
      console.error('Error adding tax entry:', error);
      alert('Error adding tax entry');
    }
  };

  const taxSavings = taxableIncome && deductions ? calculateTaxSavings() : null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="tax">💰</span> Add Tax Entry
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Tax Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          {/* Basic Tax Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Type <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={taxType}
                onChange={(e) => {
                  setTaxType(e.target.value);
                  setTaxSubType('');
                }}
                required
              >
                <option value="">Select Tax Type</option>
                {Object.keys(taxTypes).map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {taxType && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Sub-Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={taxSubType}
                  onChange={(e) => setTaxSubType(e.target.value)}
                >
                  <option value="">Select Sub-Type</option>
                  {taxTypes[taxType].map(subType => (
                    <option key={subType} value={subType}>{subType}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Financial Year Information */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Financial Year</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2023-24"
                value={financialYear}
                onChange={(e) => setFinancialYear(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Year</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="2024-25"
                value={assessmentYear}
                onChange={(e) => setAssessmentYear(e.target.value)}
              />
            </div>

            {(taxType === 'Income Tax' && taxSubType === 'Advance Tax') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quarter</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={quarter}
                  onChange={(e) => setQuarter(e.target.value)}
                >
                  <option value="">Select Quarter</option>
                  {quarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tax Calculation Section */}
          {taxType === 'Income Tax' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <h3 className="font-medium text-gray-800">Tax Calculation</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Taxable Income (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000000"
                    value={taxableIncome}
                    onChange={(e) => handleTaxableIncomeChange(e.target.value)}
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="20"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deductions (₹)</label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="150000"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  80C, 80D, HRA, etc.
                </p>
              </div>

              {calculatedTax > 0 && (
                <div className="bg-white p-3 rounded border">
                  <p className="text-sm text-gray-600">Calculated Tax:</p>
                  <p className="text-lg font-bold text-green-600">₹{calculatedTax.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Payment Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="50000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABCDE1234F"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                maxLength="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan Number</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="280"
                value={challanNumber}
                onChange={(e) => setChallanNumber(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes, deduction details, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
          >
            <span role="img" aria-label="add">➕</span> Add Tax Entry
          </button>
        </form>

        {/* Tax Analysis & Information */}
        <div className="space-y-6">
          {/* Tax Savings Calculator */}
          {taxSavings && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💚 Tax Savings Analysis</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax without deductions:</span>
                  <span className="font-semibold text-red-600">₹{taxSavings.originalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax with deductions:</span>
                  <span className="font-semibold text-orange-600">₹{taxSavings.finalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-medium">Total Savings:</span>
                  <span className="font-bold text-green-600">₹{taxSavings.savings.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tax Calendar */}
          {taxType === 'Income Tax' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">📅 Tax Calendar</h3>
              <div className="space-y-2 text-sm">
                <div className="font-medium text-gray-800">Advance Tax Due Dates:</div>
                <div className="space-y-1 text-gray-600">
                  <div>• June 15: 15% of estimated tax</div>
                  <div>• Sep 15: 45% of estimated tax</div>
                  <div>• Dec 15: 75% of estimated tax</div>
                  <div>• Mar 15: 100% of estimated tax</div>
                </div>
                <div className="mt-3 p-2 bg-yellow-50 rounded text-xs">
                  <strong>Note:</strong> Late payment attracts interest @ 1% per month
                </div>
              </div>
            </div>
          )}

          {/* Tax Deduction Tips */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Tax Saving Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Invest in ELSS, PPF, NSC under 80C (₹1.5L limit)</li>
              <li>• Health insurance premium under 80D (₹25K-50K)</li>
              <li>• Home loan interest under 24(b) (₹2L limit)</li>
              <li>• Education loan interest under 80E (no limit)</li>
              <li>• NPS contribution under 80CCD(1B) (₹50K limit)</li>
              <li>• Keep all tax-related documents organized</li>
            </ul>
          </div>

          {/* Tax Slabs Info */}
          {taxType === 'Income Tax' && (
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Tax Slabs (Old Regime)</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Up to ₹2.5L:</span>
                  <span className="font-medium">0%</span>
                </div>
                <div className="flex justify-between">
                  <span>₹2.5L - ₹5L:</span>
                  <span className="font-medium">5%</span>
                </div>
                <div className="flex justify-between">
                  <span>₹5L - ₹10L:</span>
                  <span className="font-medium">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>Above ₹10L:</span>
                  <span className="font-medium">30%</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  + Health & Education Cess @ 4%
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddTax;
