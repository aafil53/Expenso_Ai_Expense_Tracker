import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, onSnapshot, doc, updateDoc, deleteDoc} from 'firebase/firestore';

const StockList = ({user}) => {
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users', user.uid, 'stocks'),
      (snapshot) => {
        const stockData = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
        setStocks(stockData);
      }
    );
    return () => unsub();
  }, [user]);

  const markAsSold = async (id) => {
    await updateDoc(doc(db, 'users', user.uid, 'stocks', id), {status: 'Sold'});
  };

  const deleteStock = async (id) => {
    if (window.confirm('Delete this stock?')) {
      await deleteDoc(doc(db, 'users', user.uid, 'stocks', id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-800">
        <span role="img" aria-label="stock">📊</span> Your Stocks
      </h2>
      {stocks.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No stocks added yet.</div>
      ) : (
        <div className="grid gap-6">
          {stocks.map((stock) => {
            const totalInvested = stock.quantity * stock.buyPrice;
            const currentValue = stock.quantity * stock.currentPrice;
            const gainLoss = currentValue - totalInvested;
            const gainLossPercentage = (gainLoss / totalInvested) * 100;
            const isProfit = gainLoss > 0;
            const isSold = stock.status === 'Sold';

            return (
              <div
                key={stock.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 transition-all ${isSold ? 'border-green-400' : 'border-transparent'}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📈</span>
                    <span className="font-semibold text-gray-700">{stock.stockName}</span>
                    {isSold ? (
                      <span className="ml-2 px-2 py-0.5 rounded bg-green-100 text-green-700 text-xs font-semibold">Sold</span>
                    ) : (
                      <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-semibold">Holding</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mb-1">Quantity: <span className="font-semibold">{stock.quantity}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Buy Price: <span className="font-semibold text-blue-700">₹{stock.buyPrice.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Current Price: <span className="font-semibold text-blue-700">₹{stock.currentPrice.toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Buy Date: <span className="font-semibold">{stock.buyDate ? new Date(stock.buyDate.seconds * 1000).toLocaleDateString() : 'N/A'}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Total Invested: <span className="font-semibold text-blue-700">₹{totalInvested.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600 mb-1">Current Value: <span className="font-semibold text-blue-700">₹{currentValue.toFixed(2)}</span></div>
                  <div className="text-sm text-gray-600 mb-1">
                    Gain/Loss: <span className={`font-semibold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
                      ₹{gainLoss.toFixed(2)} ({gainLossPercentage.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  {!isSold && (
                    <button
                      onClick={() => markAsSold(stock.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                      title="Mark as Sold"
                    >
                      <span role="img" aria-label="sold">💰</span> Mark as Sold
                    </button>
                  )}
                  <button
                    onClick={() => deleteStock(stock.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2 transition-colors"
                    title="Delete Stock"
                  >
                    <span role="img" aria-label="delete">🗑️</span> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StockList;
