
import React from 'react';
import Button from './ui/Button';
import PlusIcon from './icons/PlusIcon';

interface HeaderProps {
  onAddSimulation: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddSimulation }) => {
  return (
    <header className="sticky top-0 z-10 -mx-8 px-8 py-4 mb-8 bg-slate-950/70 backdrop-blur-lg">
      <div className="container mx-auto flex items-center justify-between border-b border-slate-700/50 pb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-50 to-slate-400">
            LP Simulator
          </h1>
          <p className="text-slate-400 mt-1">Model your liquidity provider positions.</p>
        </div>
        <Button onClick={onAddSimulation} variant="primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New Sim
        </Button>
      </div>
    </header>
  );
};

export default Header;