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
    <div>
      <h2>Your Stocks</h2>
      {stocks.length === 0 ? <p>No stocks added yet.</p> :
        stocks.map((stock) => {
          const totalInvested = stock.quantity * stock.buyPrice;
          const currentValue = stock.quantity * stock.currentPrice;
          const gainLoss = currentValue - totalInvested;

          return (
            <div key={stock.id} style={{border: '1px solid #ccc', padding: '8px', marginBottom: '8px'}}>
              <p><strong>Stock:</strong> {stock.stockName}</p>
              <p><strong>Quantity:</strong> {stock.quantity}</p>
              <p><strong>Buy Price:</strong> ₹{stock.buyPrice}</p>
              <p><strong>Current Price:</strong> ₹{stock.currentPrice}</p>
              <p><strong>Buy Date:</strong> {new Date(stock.buyDate.seconds * 1000).toLocaleDateString()}</p>
              <p><strong>Total Invested:</strong> ₹{totalInvested.toFixed(2)}</p>
              <p><strong>Current Value:</strong> ₹{currentValue.toFixed(2)}</p>
              <p><strong>Gain/Loss:</strong> ₹{gainLoss.toFixed(2)}</p>
              <p><strong>Status:</strong> {stock.status}</p>
              {stock.status === 'Holding' && (
                <button onClick={() => markAsSold(stock.id)}>Mark as Sold</button>
              )}
              <button onClick={() => deleteStock(stock.id)}>Delete</button>
            </div>
          );
        })
      }
    </div>
  );
};

export default StockList;
