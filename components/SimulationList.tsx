import React from 'react';
import { type Simulation } from '../types';
import SimulationCard from './SimulationCard';

interface SimulationListProps {
  simulations: Simulation[];
  updateSimulation: (id: string, updatedSim: Partial<Simulation>) => void;
  removeSimulation: (id: string) => void;
}

const SimulationList: React.FC<SimulationListProps> = ({ simulations, updateSimulation, removeSimulation }) => {
  if (simulations.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-semibold text-slate-400">No Simulations Yet</h2>
        <p className="text-slate-500 mt-2">Click "New Sim" to create your first liquidity simulation.</p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-6">
      {simulations.map((sim, index) => (
        <SimulationCard
          key={sim.id}
          simulation={sim}
          onUpdate={updateSimulation}
          onRemove={removeSimulation}
          defaultExpanded={index === 0}
        />
      ))}
    </div>
  );
};

export default SimulationList;