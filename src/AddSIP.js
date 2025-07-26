import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';

const AddSIP = ({user}) => {
  const [fundName, setFundName] = useState('');
  const [fundCategory, setFundCategory] = useState('');
  const [sipAmount, setSipAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [expectedReturnRate, setExpectedReturnRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [goalAmount, setGoalAmount] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [riskProfile, setRiskProfile] = useState('');
  const [investmentGoal, setInvestmentGoal] = useState('');
  const [autoIncrease, setAutoIncrease] = useState(false);
  const [autoIncreasePercent, setAutoIncreasePercent] = useState('10');
  const [maturityValue, setMaturityValue] = useState(0);
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [totalGains, setTotalGains] = useState(0);
  const [requiredSIP, setRequiredSIP] = useState(0);

  const fundCategories = [
    'Large Cap Equity',
    'Mid Cap Equity', 
    'Small Cap Equity',
    'Multi Cap Equity',
    'Flexi Cap Equity',
    'Sectoral/Thematic',
    'ELSS (Tax Saving)',
    'Hybrid Funds',
    'Debt Funds',
    'Index Funds',
    'International Funds',
    'Gold ETF/Funds'
  ];

  const riskProfiles = ['Conservative', 'Moderate', 'Aggressive'];
  const investmentGoals = [
    'Retirement Planning',
    'Child Education',
    'Child Marriage',
    'Home Purchase',
    'Car Purchase',
    'Emergency Fund',
    'Vacation/Travel',
    'Wealth Creation',
    'Other'
  ];

  // SIP Calculation
  useEffect(() => {
    if (sipAmount && expectedReturnRate && durationMonths) {
      const monthlyAmount = parseFloat(sipAmount);
      const annualRate = parseFloat(expectedReturnRate);
      const months = parseInt(durationMonths);
      
      const monthlyRate = annualRate / 12 / 100;
      const futureValue = monthlyAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
      const totalInvested = monthlyAmount * months;
      const gains = futureValue - totalInvested;
      
      setMaturityValue(futureValue);
      setTotalInvestment(totalInvested);
      setTotalGains(gains);
    }
  }, [sipAmount, expectedReturnRate, durationMonths]);

  // Goal-based SIP calculation
  useEffect(() => {
    if (goalAmount && expectedReturnRate && durationMonths) {
      const targetAmount = parseFloat(goalAmount);
      const annualRate = parseFloat(expectedReturnRate);
      const months = parseInt(durationMonths);
      
      const monthlyRate = annualRate / 12 / 100;
      const requiredMonthlyAmount = targetAmount * monthlyRate / (((1 + monthlyRate) ** months - 1) * (1 + monthlyRate));
      
      setRequiredSIP(requiredMonthlyAmount);
    }
  }, [goalAmount, expectedReturnRate, durationMonths]);

  const calculateStepUpReturns = () => {
    if (!sipAmount || !expectedReturnRate || !durationMonths || !autoIncrease) return null;
    
    const initialAmount = parseFloat(sipAmount);
    const annualRate = parseFloat(expectedReturnRate);
    const months = parseInt(durationMonths);
    const stepUpRate = parseFloat(autoIncreasePercent) / 100;
    
    let futureValue = 0;
    let totalInvested = 0;
    let currentAmount = initialAmount;
    
    for (let month = 1; month <= months; month++) {
      // Increase SIP amount annually
      if (month > 1 && (month - 1) % 12 === 0) {
        currentAmount = currentAmount * (1 + stepUpRate);
      }
      
      const monthlyRate = annualRate / 12 / 100;
      const remainingMonths = months - month + 1;
      futureValue += currentAmount * ((1 + monthlyRate) ** remainingMonths);
      totalInvested += currentAmount;
    }
    
    return {
      futureValue,
      totalInvested,
      totalGains: futureValue - totalInvested
    };
  };

  const getRecommendedFunds = (category) => {
    const recommendations = {
      'Large Cap Equity': ['HDFC Top 100', 'ICICI Prudential Bluechip', 'SBI Large Cap'],
      'Mid Cap Equity': ['HDFC Mid-Cap Opportunities', 'DSP Mid Cap', 'Kotak Emerging Equity'],
      'Small Cap Equity': ['SBI Small Cap', 'DSP Small Cap', 'Nippon India Small Cap'],
      'ELSS (Tax Saving)': ['Axis Long Term Equity', 'Mirae Asset Tax Saver', 'HDFC TaxSaver']
    };
    return recommendations[category] || [];
  };

  const getExpectedReturnRange = (category) => {
    const returns = {
      'Large Cap Equity': '10-12%',
      'Mid Cap Equity': '12-15%',
      'Small Cap Equity': '15-18%',
      'ELSS (Tax Saving)': '12-15%',
      'Hybrid Funds': '8-10%',
      'Debt Funds': '6-8%'
    };
    return returns[category] || '8-12%';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fundName || !sipAmount || !startDate || !expectedReturnRate || !durationMonths) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const sipData = {
        fundName,
        fundCategory,
        sipAmount: parseFloat(sipAmount),
        startDate: new Date(startDate),
        expectedReturnRate: parseFloat(expectedReturnRate),
        durationMonths: parseInt(durationMonths),
        goalAmount: parseFloat(goalAmount) || null,
        goalDescription,
        riskProfile,
        investmentGoal,
        autoIncrease,
        autoIncreasePercent: autoIncrease ? parseFloat(autoIncreasePercent) : null,
        maturityValue,
        totalInvestment,
        totalGains,
        status: 'Active',
        currentValue: 0,
        unitsAccumulated: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'sips'), sipData);

      // Update SIP statistics
      const sipStatsRef = doc(db, 'users', user.uid, 'statistics', 'sipSummary');
      const sipStatsSnap = await getDoc(sipStatsRef);
      
      if (sipStatsSnap.exists()) {
        const currentStats = sipStatsSnap.data();
        const categoryInvestment = currentStats[fundCategory] || 0;
        await updateDoc(sipStatsRef, {
          [fundCategory]: categoryInvestment + parseFloat(sipAmount),
          totalMonthlySIP: (currentStats.totalMonthlySIP || 0) + parseFloat(sipAmount),
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(sipStatsRef, {
          [fundCategory]: parseFloat(sipAmount),
          totalMonthlySIP: parseFloat(sipAmount),
          lastUpdated: serverTimestamp()
        });
      }

      // Create investment goal reminder
      if (goalAmount && goalDescription) {
        const goalDate = new Date(startDate);
        goalDate.setMonth(goalDate.getMonth() + parseInt(durationMonths));
        
        await addDoc(collection(db, 'users', user.uid, 'goals'), {
          type: 'investment',
          title: goalDescription,
          targetAmount: parseFloat(goalAmount),
          currentAmount: 0,
          targetDate: goalDate,
          sipId: null, // Will be updated after SIP is created
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }

      // Reset form
      resetForm();
      alert('SIP added successfully');
    } catch (error) {
      console.error('Error adding SIP:', error);
      alert('Error adding SIP');
    }
  };

  const resetForm = () => {
    setFundName('');
    setFundCategory('');
    setSipAmount('');
    setStartDate('');
    setExpectedReturnRate('');
    setDurationMonths('');
    setGoalAmount('');
    setGoalDescription('');
    setRiskProfile('');
    setInvestmentGoal('');
    setAutoIncrease(false);
    setAutoIncreasePercent('10');
  };

  const stepUpReturns = calculateStepUpReturns();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="sip">📈</span> Add SIP Investment
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* SIP Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {/* Fund Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Fund Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fund Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. HDFC Mid-Cap Opportunities"
                    value={fundName}
                    onChange={(e) => setFundName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fund Category</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={fundCategory}
                    onChange={(e) => setFundCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    {fundCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {fundCategory && (
                    <p className="text-xs text-gray-500 mt-1">
                      Expected Returns: {getExpectedReturnRange(fundCategory)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Investment Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SIP Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="5000"
                    value={sipAmount}
                    onChange={(e) => setSipAmount(e.target.value)}
                    min="500"
                    step="100"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Return (% p.a.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="12"
                    value={expectedReturnRate}
                    onChange={(e) => setExpectedReturnRate(e.target.value)}
                    min="1"
                    max="30"
                    step="0.1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (months) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="60"
                    value={durationMonths}
                    onChange={(e) => setDurationMonths(e.target.value)}
                    min="6"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Goal-Based Planning */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Goal-Based Planning</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investment Goal</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={investmentGoal}
                      onChange={(e) => setInvestmentGoal(e.target.value)}
                    >
                      <option value="">Select Goal</option>
                      {investmentGoals.map(goal => (
                        <option key={goal} value={goal}>{goal}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Profile</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={riskProfile}
                      onChange={(e) => setRiskProfile(e.target.value)}
                    >
                      <option value="">Select Risk Profile</option>
                      {riskProfiles.map(profile => (
                        <option key={profile} value={profile}>{profile}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Goal Description</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Child's higher education fund"
                    value={goalDescription}
                    onChange={(e) => setGoalDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000000"
                    value={goalAmount}
                    onChange={(e) => setGoalAmount(e.target.value)}
                    min="10000"
                  />
                  {requiredSIP > 0 && goalAmount && (
                    <p className="text-sm text-blue-600 mt-1">
                      Required SIP: ₹{requiredSIP.toFixed(0)}/month
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Step-up SIP */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="stepup"
                  checked={autoIncrease}
                  onChange={(e) => setAutoIncrease(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="stepup" className="text-sm font-medium text-gray-700">
                  Enable Step-up SIP (Annual increase)
                </label>
              </div>

              {autoIncrease && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Increase (%)</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={autoIncreasePercent}
                    onChange={(e) => setAutoIncreasePercent(e.target.value)}
                  >
                    <option value="5">5%</option>
                    <option value="10">10%</option>
                    <option value="15">15%</option>
                    <option value="20">20%</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
            >
              <span role="img" aria-label="add">➕</span> Add SIP
            </button>
          </form>
        </div>

        {/* SIP Analysis & Projections */}
        <div className="space-y-6">
          {/* SIP Returns Projection */}
          {maturityValue > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💰 SIP Projection</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Monthly Investment</p>
                  <p className="text-xl font-bold text-blue-600">₹{parseFloat(sipAmount).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Duration</p>
                  <p className="text-xl font-semibold text-gray-800">{durationMonths} months</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Investment</p>
                  <p className="text-xl font-semibold text-orange-600">₹{totalInvestment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expected Gains</p>
                  <p className="text-xl font-semibold text-green-600">₹{totalGains.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Maturity Value</p>
                  <p className="text-3xl font-bold text-green-700">₹{maturityValue.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Step-up SIP Benefits */}
          {stepUpReturns && autoIncrease && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">🚀 Step-up SIP Benefits</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Regular SIP Maturity:</span>
                  <span className="font-semibold">₹{maturityValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Step-up SIP Maturity:</span>
                  <span className="font-semibold">₹{stepUpReturns.futureValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-medium">Additional Returns:</span>
                  <span className="font-bold text-purple-600">
                    ₹{(stepUpReturns.futureValue - maturityValue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Fund Recommendations */}
          {fundCategory && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💡 Fund Recommendations</h3>
              <p className="text-sm text-gray-600 mb-3">Popular {fundCategory} funds:</p>
              <div className="space-y-2">
                {getRecommendedFunds(fundCategory).map((fund, index) => (
                  <div key={index} className="bg-gray-50 p-2 rounded text-sm">
                    {fund}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Investment Tips */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 SIP Investment Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Start early to harness the power of compounding</li>
              <li>• Increase SIP amount annually with salary increments</li>
              <li>• Don't stop SIP during market downturns</li>
              <li>• Diversify across different fund categories</li>
              <li>• Review and rebalance portfolio annually</li>
              <li>• Consider ELSS funds for tax savings under 80C</li>
            </ul>
          </div>

          {/* Risk-Return Matrix */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📊 Risk-Return Matrix</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Large Cap (Low Risk):</span>
                <span className="font-medium">10-12% returns</span>
              </div>
              <div className="flex justify-between">
                <span>Mid Cap (Medium Risk):</span>
                <span className="font-medium">12-15% returns</span>
              </div>
              <div className="flex justify-between">
                <span>Small Cap (High Risk):</span>
                <span className="font-medium">15-18% returns</span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                * Returns are indicative and not guaranteed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSIP;
