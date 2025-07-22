import React, {useState, useEffect} from 'react'
import {db} from '../firebase'
import {collection, getDocs, query, where} from 'firebase/firestore'
import {PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend} from 'recharts'

const Dashboard = ({user}) => {
  const [expenses, setExpenses] = useState([])
  const [budget, setBudget] = useState(0)
  const [debtsOwedToMe, setDebtsOwedToMe] = useState([])
  const [debtsOwedByMe, setDebtsOwedByMe] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return
      const month = '2025-07'
      const expensesRef = collection(db, 'expenses')
      const q = query(expensesRef, where('userId', '==', user.uid))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})).filter(exp => {
        if (!exp.date) return false
        const [day, monthPart, year] = exp.date.split('-')
        return `${year}-${monthPart}` === month
      })
      setExpenses(data)

      const budgetsRef = collection(db, 'budgets')
      const budgetSnap = await getDocs(query(budgetsRef, where('userId', '==', user.uid), where('month', '==', month)))
      budgetSnap.forEach(doc => setBudget(doc.data().amount))

      const debtsToMeRef = collection(db, 'debtsOwedToMe')
      const debtsToMeSnap = await getDocs(query(debtsToMeRef, where('userId', '==', user.uid)))
      const debtsToMeData = debtsToMeSnap.docs.map(doc => ({id: doc.id, ...doc.data()}))
      setDebtsOwedToMe(debtsToMeData)

      const debtsByMeRef = collection(db, 'debtsOwedByMe')
      const debtsByMeSnap = await getDocs(query(debtsByMeRef, where('userId', '==', user.uid)))
      const debtsByMeData = debtsByMeSnap.docs.map(doc => ({id: doc.id, ...doc.data()}))
      setDebtsOwedByMe(debtsByMeData)
    }
    fetchData()
  }, [user])

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0)
  const remainingBudget = budget - totalExpenses
  const totalDebtsToMe = debtsOwedToMe.reduce((sum, d) => sum + d.amount, 0)
  const totalDebtsByMe = debtsOwedByMe.reduce((sum, d) => sum + d.amount, 0)

  const categoryData = []
  expenses.forEach(exp => {
    const found = categoryData.find(c => c.name === exp.category)
    if(found){found.value += exp.amount}else{categoryData.push({name: exp.category, value: exp.amount})}
  })

  const dailyData = []
  expenses.forEach(exp => {
    const day = exp.date.slice(0,10)
    const found = dailyData.find(d => d.date === day)
    if(found){found.amount += exp.amount}else{dailyData.push({date: day, amount: exp.amount})}
  })

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD', '#CD6155']

  return (
    <div className='p-4'>
      <h1 className='text-2xl font-semibold mb-4'>Dashboard</h1>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium'>Total Expenses</h2>
          <p className='text-xl font-bold'>₹{totalExpenses.toFixed(2)}</p>
        </div>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium'>Remaining Budget</h2>
          <p className='text-xl font-bold'>₹{remainingBudget.toFixed(2)}</p>
        </div>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium'>Debts Owed To Me</h2>
          <p className='text-xl font-bold'>₹{totalDebtsToMe.toFixed(2)}</p>
        </div>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium'>Debts Owed By Me</h2>
          <p className='text-xl font-bold'>₹{totalDebtsByMe.toFixed(2)}</p>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium mb-2'>Expenses by Category</h2>
          <PieChart width={300} height={300}>
            <Pie data={categoryData} dataKey='value' nameKey='name' cx='50%' cy='50%' outerRadius={100}>
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>
        <div className='bg-white rounded-lg p-4 shadow'>
          <h2 className='text-lg font-medium mb-2'>Expenses Over Time</h2>
          <LineChart width={350} height={300} data={dailyData.sort((a,b)=>a.date.localeCompare(b.date))}>
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis dataKey='date' />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type='monotone' dataKey='amount' stroke='#8884d8' activeDot={{r:8}} />
          </LineChart>
        </div>
      </div>
      <div className='bg-white rounded-lg p-4 shadow mt-6'>
        <h2 className='text-lg font-medium mb-2'>Recent Transactions</h2>
        {expenses.slice(-5).reverse().map(exp => (
          <div key={exp.id} className='border-b py-2'>
            <p className='text-sm'>{exp.date} | {exp.category} | ₹{exp.amount} | {exp.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard;