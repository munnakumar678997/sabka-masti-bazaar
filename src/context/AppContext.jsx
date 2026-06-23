import { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [tasksCompleted, setTasksCompleted] = useState(0);
  const [referrals] = useState(0);
  const [streak] = useState(1);

  const addCoins = (amount) => {
    setBalance(b => b + amount);
  };

  const deductCoins = (amount) => {
    setBalance(b => Math.max(0, b - amount));
  };

  const completeTask = (coins) => {
    addCoins(coins);
    setTasksCompleted(t => t + 1);
  };

  return (
    <AppContext.Provider value={{
      balance,
      addCoins,
      deductCoins,
      completeTask,
      tasksCompleted,
      referrals,
      streak,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
