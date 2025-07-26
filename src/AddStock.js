import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';

const AddStock = ({user}) => {
  const [stockName, setStockName] = useState('');
  const [stockSymbol, setStockSymbol] = useState('');
  const [sector, setSector] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');
  const [broker, setBroker] = useState('');
  const [investmentGoal, setInvestmentGoal] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [dividendYield, setDividendYield] = useState('');
  const [peRatio, setPeRatio] = useState('');
  const [marketCap, setMarketCap] = useState('');
  const [totalInvestment, setTotalInvestment] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [profitLoss, setProfitLoss] = useState(0);
  const [profitLossPercentage, setProfitLossPercentage] = useState(0);

  const sectors = [
    'Technology',
    'Banking & Finance',
    'Healthcare & Pharmaceuticals',
    'Automobile',
    'FMCG',
    'Oil & Gas',
    'Power & Energy',
    'Infrastructure',
    'Real Estate',
    'Telecommunications',
    'Metals & Mining',
    'Textiles',
    'Chemicals',
    'Agriculture',
    'Retail',
    'Media & Entertainment',
    'Other'
  ];

  const brokers = [
    'Zerodha',
    'Angel Broking',
    'ICICI Direct',
    'HDFC Securities',
    'Sharekhan',
    'Kotak Securities',
    'Motilal Oswal',
    'Groww',
    'Upstox',
    'Other'
  ];

  const investmentGoals = [
    'Long Term Wealth Creation',
    'Short Term Trading',
    'Dividend Income',
    'Portfolio Diversification',
    'Retirement Planning',
    'Child Education',
    'Speculation',
    'Other'
  ];

  const marketCapCategories = {
    'Large Cap': '₹20,000+ Crores',
    'Mid Cap': '₹5,000 - ₹20,000 Crores',
    'Small Cap': 'Below ₹5,000 Crores'
  };

  // Calculate investment metrics
  useEffect(() => {
    if (quantity && buyPrice) {
      const investment = parseFloat(quantity) * parseFloat(buyPrice);
      setTotalInvestment(investment);
    }
  }, [quantity, buyPrice]);

  useEffect(() => {
    if (quantity && currentPrice) {
      const current = parseFloat(quantity) * parseFloat(currentPrice);
      setCurrentValue(current);
      
      if (totalInvestment > 0) {
        const pl = current - totalInvestment;
        const plPercentage = (pl / totalInvestment) * 100;
        setProfitLoss(pl);
        setProfitLossPercentage(plPercentage);
      }
    }
  }, [quantity, currentPrice, totalInvestment]);

  // Risk assessment based on various factors
  const calculateRiskLevel = () => {
    let riskScore = 0;
    
    // Sector risk
    const highRiskSectors = ['Technology', 'Real Estate', 'Metals & Mining'];
    if (highRiskSectors.includes(sector)) riskScore += 2;
    
    // P/E ratio risk
    const pe = parseFloat(peRatio) || 0;
    if (pe > 30) riskScore += 2;
    else if (pe > 20) riskScore += 1;
    
    // Investment goal risk
    if (investmentGoal === 'Short Term Trading' || investmentGoal === 'Speculation') {
      riskScore += 3;
    }
    
    // Market cap risk
    if (marketCap === 'Small Cap') riskScore += 2;
    else if (marketCap === 'Mid Cap') riskScore += 1;
    
    if (riskScore >= 5) return { level: 'High', color: 'text-red-600' };
    if (riskScore >= 3) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  // Portfolio allocation suggestion
  const getPortfolioSuggestion = () => {
    const suggestions = [];
    
    if (investmentGoal === 'Long Term Wealth Creation') {
      suggestions.push('Consider maintaining 70% large cap, 20% mid cap, 10% small cap');
    }
    
    if (parseFloat(dividendYield) > 3) {
      suggestions.push('Good dividend yield for income generation');
    }
    
    if (profitLossPercentage > 20) {
      suggestions.push('Consider booking partial profits');
    } else if (profitLossPercentage < -15) {
      suggestions.push('Review investment thesis or consider stop loss');
    }
    
    return suggestions;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stockName || !quantity || !buyPrice || !currentPrice || !buyDate) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const stockData = {
        stockName,
        stockSymbol: stockSymbol.toUpperCase(),
        sector,
        quantity: parseFloat(quantity),
        buyPrice: parseFloat(buyPrice),
        currentPrice: parseFloat(currentPrice),
        buyDate: new Date(buyDate),
        broker,
        investmentGoal,
        stopLoss: parseFloat(stopLoss) || null,
        targetPrice: parseFloat(targetPrice) || null,
        notes,
        dividendYield: parseFloat(dividendYield) || null,
        peRatio: parseFloat(peRatio) || null,
        marketCap,
        totalInvestment,
        currentValue,
        profitLoss,
        profitLossPercentage,
        riskLevel: calculateRiskLevel().level,
        status: 'Holding',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'users', user.uid, 'stocks'), stockData);

      // Update portfolio statistics
      const portfolioStatsRef = doc(db, 'users', user.uid, 'statistics', 'portfolioSummary');
      const portfolioStatsSnap = await getDoc(portfolioStatsRef);
      
      if (portfolioStatsSnap.exists()) {
        const currentStats = portfolioStatsSnap.data();
        const sectorInvestment = currentStats.sectors?.[sector] || 0;
        await updateDoc(portfolioStatsRef, {
          [`sectors.${sector}`]: sectorInvestment + totalInvestment,
          totalInvestment: (currentStats.totalInvestment || 0) + totalInvestment,
          totalCurrentValue: (currentStats.totalCurrentValue || 0) + currentValue,
          totalProfitLoss: (currentStats.totalProfitLoss || 0) + profitLoss,
          totalStocks: (currentStats.totalStocks || 0) + 1,
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(portfolioStatsRef, {
          sectors: { [sector]: totalInvestment },
          totalInvestment,
          totalCurrentValue: currentValue,
          totalProfitLoss: profitLoss,
          totalStocks: 1,
          lastUpdated: serverTimestamp()
        });
      }

      // Create alerts if needed
      if (stopLoss && parseFloat(currentPrice) <= parseFloat(stopLoss)) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          type: 'stock',
          title: `Stop Loss Alert - ${stockName}`,
          description: `${stockName} has reached stop loss level of ₹${stopLoss}`,
          stockSymbol: stockSymbol.toUpperCase(),
          currentPrice: parseFloat(currentPrice),
          alertPrice: parseFloat(stopLoss),
          alertType: 'stop_loss',
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }

      if (targetPrice && parseFloat(currentPrice) >= parseFloat(targetPrice)) {
        await addDoc(collection(db, 'users', user.uid, 'alerts'), {
          type: 'stock',
          title: `Target Achieved - ${stockName}`,
          description: `${stockName} has reached target price of ₹${targetPrice}`,
          stockSymbol: stockSymbol.toUpperCase(),
          currentPrice: parseFloat(currentPrice),
          alertPrice: parseFloat(targetPrice),
          alertType: 'target',
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }

      // Reset form
      resetForm();
      alert('Stock added successfully');
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Error adding stock');
    }
  };

  const resetForm = () => {
    setStockName('');
    setStockSymbol('');
    setSector('');
    setQuantity('');
    setBuyPrice('');
    setCurrentPrice('');
    setBuyDate('');
    setBroker('');
    setInvestmentGoal('');
    setStopLoss('');
    setTargetPrice('');
    setNotes('');
    setDividendYield('');
    setPeRatio('');
    setMarketCap('');
  };

  const riskLevel = calculateRiskLevel();
  const portfolioSuggestions = getPortfolioSuggestion();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="stock">📊</span> Add Stock Investment
      </h2>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Stock Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            {/* Basic Stock Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Stock Details</h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. Reliance Industries"
                      value={stockName}
                      onChange={(e) => setStockName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Symbol</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                      placeholder="e.g. RELIANCE"
                      value={stockSymbol}
                      onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                    >
                      <option value="">Select Sector</option>
                      {sectors.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Market Cap</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={marketCap}
                      onChange={(e) => setMarketCap(e.target.value)}
                    >
                      <option value="">Select Market Cap</option>
                      {Object.entries(marketCapCategories).map(([cap, range]) => (
                        <option key={cap} value={cap}>{cap} ({range})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Investment Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="100"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="1"
                    step="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1500"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1600"
                    value={currentPrice}
                    onChange={(e) => setCurrentPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buy Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={buyDate}
                    onChange={(e) => setBuyDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Advanced Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Advanced Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stop Loss (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1400"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Price (₹)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1800"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">P/E Ratio</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="25.5"
                    value={peRatio}
                    onChange={(e) => setPeRatio(e.target.value)}
                    min="0"
                    step="0.1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dividend Yield (%)</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2.5"
                    value={dividendYield}
                    onChange={(e) => setDividendYield(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Investment Strategy */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Broker</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={broker}
                  onChange={(e) => setBroker(e.target.value)}
                >
                  <option value="">Select Broker</option>
                  {brokers.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Investment thesis, research notes, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows="3"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
            >
              <span role="img" aria-label="add">➕</span> Add Stock
            </button>
          </form>
        </div>

        {/* Investment Analysis */}
        <div className="space-y-6">
          {/* P&L Summary */}
          {totalInvestment > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💰 Investment Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Investment</p>
                  <p className="text-xl font-bold text-blue-600">₹{totalInvestment.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Current Value</p>
                  <p className="text-xl font-semibold text-gray-800">₹{currentValue.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">P&L Amount</p>
                  <p className={`text-xl font-semibold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLoss >= 0 ? '+' : ''}₹{profitLoss.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">P&L Percentage</p>
                  <p className={`text-xl font-semibold ${profitLossPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLossPercentage >= 0 ? '+' : ''}{profitLossPercentage.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Risk Assessment */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Risk Assessment</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Risk Level:</span>
                <span className={`font-semibold ${riskLevel.color}`}>{riskLevel.level}</span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Sector: {sector || 'Not specified'}</div>
                <div>• Market Cap: {marketCap || 'Not specified'}</div>
                <div>• P/E Ratio: {peRatio || 'Not specified'}</div>
                <div>• Investment Goal: {investmentGoal || 'Not specified'}</div>
              </div>
            </div>
          </div>

          {/* Portfolio Suggestions */}
          {portfolioSuggestions.length > 0 && (
            <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Portfolio Suggestions</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                {portfolioSuggestions.map((suggestion, index) => (
                  <li key={index}>• {suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Key Ratios */}
          <div className="bg-green-50 rounded-xl p-6 border border-green-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📈 Key Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span>Price per Share:</span>
                <span className="font-medium">₹{currentPrice || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>P/E Ratio:</span>
                <span className="font-medium">{peRatio || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Dividend Yield:</span>
                <span className="font-medium">{dividendYield ? `${dividendYield}%` : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Market Cap:</span>
                <span className="font-medium">{marketCap || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Investment Tips */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Investment Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Diversify across sectors and market caps</li>
              <li>• Set stop loss to limit downside risk</li>
              <li>• Review portfolio quarterly</li>
              <li>• Don't invest more than 5-10% in single stock</li>
              <li>• Consider dividend paying stocks for steady income</li>
              <li>• Stay updated with company fundamentals</li>
            </ul>
          </div>

          {/* Market Cap Guide */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Market Cap Guide</h3>
            <div className="text-sm space-y-2">
              {Object.entries(marketCapCategories).map(([cap, range]) => (
                <div key={cap} className="flex justify-between">
                  <span className="font-medium">{cap}:</span>
                  <span className="text-gray-600">{range}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddStock;
