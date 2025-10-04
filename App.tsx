import React, { useState, useCallback } from 'react';
import { type Simulation } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import Header from './components/Header';
import SimulationList from './components/SimulationList';

const App: React.FC = () => {
  const [simulations, setSimulations] = useLocalStorage<Simulation[]>('lp-simulations', []);
  const [newlyCreatedSimId, setNewlyCreatedSimId] = useState<string | null>(null);

  const addSimulation = useCallback(() => {
    const initialInvestment = 1000;
    const initialPriceA = 3000;
    const initialPriceB = 1;

    const newSimulation: Simulation = {
      id: Date.now().toString(),
      protocol: 'Uniswap V3',
      tokenA: 'ETH',
      tokenB: 'USDC',
      amountA: (initialInvestment / 2) / initialPriceA,
      amountB: (initialInvestment / 2) / initialPriceB,
      apr: 25,
      duration: 30,
      lowerPriceBound: 2400,
      upperPriceBound: 3600,
      startDate: new Date().toISOString().split('T')[0],
      initialPriceA: initialPriceA,
      initialPriceB: initialPriceB,
      latestPriceA: 3000,
      latestPriceB: 1,
      tradeVolume: 1000000,
      volumeFee: 0.3,
      isHedgeEnabled: false,
      shortAmount: initialInvestment / 2,
      fundingRate: 0.01,
      shortToken: 'A',
    };
    setSimulations(prev => [newSimulation, ...prev]);
    setNewlyCreatedSimId(newSimulation.id);
  }, [setSimulations]);

  const updateSimulation = useCallback((id: string, updatedSim: Partial<Simulation>) => {
    setSimulations(prev => prev.map(sim => sim.id === id ? { ...sim, ...updatedSim } : sim));
  }, [setSimulations]);

  const removeSimulation = useCallback((id: string) => {
    setSimulations(prev => prev.filter(sim => sim.id !== id));
    // Also remove the persisted input values for this simulation.
    if (typeof window !== 'undefined') {
        window.localStorage.removeItem(`lp-sim-values-${id}`);
    }
  }, [setSimulations]);

  return (
    <div className="min-h-screen font-sans">
      <div className="container mx-auto p-4 md:p-8">
        <Header onAddSimulation={addSimulation} />
        <main>
          <SimulationList
            simulations={simulations}
            updateSimulation={updateSimulation}
            removeSimulation={removeSimulation}
            newlyCreatedSimId={newlyCreatedSimId}
          />
        </main>
      </div>
    </div>
  );
};

export default App;