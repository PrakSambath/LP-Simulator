import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { type Simulation } from '../types';
import { fetchMockTokenPrices } from '../services/geminiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Stat from './ui/Stat';
import TrashIcon from './icons/TrashIcon';
import SyncIcon from './icons/SyncIcon';
import Slider from './ui/Slider';
import Toggle from './ui/Toggle';
import ChevronUpIcon from './icons/ChevronUpIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import Chart from './ui/Chart';

interface SimulationCardProps {
  simulation: Simulation;
  onUpdate: (id: string, updatedSim: Partial<Simulation>) => void;
  onRemove: (id: string) => void;
  defaultExpanded?: boolean;
}

// A type for our local string state keys.
type LocalValuesState = {
  protocol: string;
  tokenA: string;
  tokenB: string;
  initialPriceA: string;
  initialPriceB: string;
  amountA: string;
  valueA: string;
  amountB: string;
  valueB: string;
  apr: string;
  duration: string;
  lowerPriceBound: string;
  upperPriceBound: string;
  pctLower: string;
  pctUpper: string;
  startDate: string;
  latestPriceA: string;
  latestPriceB: string;
  shortAmount: string;
  fundingRate: string;
};
type LocalValueKey = keyof LocalValuesState;


const PriceRangeBar: React.FC<{ min: number; max: number; current: number; tokenA: string; tokenB: string; isInRange: boolean; }> = ({ min, max, current, tokenA, tokenB, isInRange }) => {
  const totalRange = max - min;
  
  if (totalRange <= 0) {
    return (
      <div className="w-full my-4 text-center text-sm text-slate-500">
        Price range must be positive. Upper bound must be greater than lower bound.
      </div>
    );
  }

  const currentPosition = ((current - min) / totalRange) * 100;
  
  const positionClamped = Math.max(0, Math.min(100, currentPosition));

  return (
    <div className="w-full my-4" aria-label="Concentrated Liquidity Price Range">
      <div className="flex justify-between text-xs text-slate-400 mb-1.5 px-1">
        <span className="font-mono" title={`Lower bound: ${min.toFixed(4)}`}>{min.toFixed(2)}</span>
        <span className="font-semibold">{`${tokenA}/${tokenB} Price`}</span>
        <span className="font-mono" title={`Upper bound: ${max.toFixed(4)}`}>{max.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full w-full relative">
        <div className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600 rounded-full"></div>
        
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center transition-all duration-300"
          style={{ left: `calc(${positionClamped}% - 8px)` }}
          title={`Current Price: ${current.toFixed(4)}`}
        >
          <div className={`w-3 h-3 rounded-full border-2 transition-colors ${isInRange ? 'bg-white border-cyan-400 animate-pulse-glow' : 'bg-red-500 border-white'}`}></div>
        </div>
      </div>
      <div className={`text-center mt-2 text-sm font-medium transition-colors ${isInRange ? 'text-cyan-400' : 'text-red-400'}`}>
        {isInRange ? 'In Range' : 'Out of Range'}
      </div>
    </div>
  );
};

const SimulationCard: React.FC<SimulationCardProps> = ({ simulation, onUpdate, onRemove, defaultExpanded = false }) => {
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [focusedInput, setFocusedInput] = useState<LocalValueKey | null>(null);

  const getValuesFromSim = useCallback((sim: Simulation): LocalValuesState => {
    const priceRatio = (sim.initialPriceB > 0) ? sim.initialPriceA / sim.initialPriceB : 0;
    const lowerPct = priceRatio > 0 ? (((priceRatio - sim.lowerPriceBound) / priceRatio) * 100) : 0;
    const upperPct = priceRatio > 0 ? (((sim.upperPriceBound - priceRatio) / priceRatio) * 100) : 0;

    return {
      protocol: sim.protocol,
      tokenA: sim.tokenA,
      tokenB: sim.tokenB,
      initialPriceA: sim.initialPriceA.toString(),
      initialPriceB: sim.initialPriceB.toString(),
      amountA: sim.amountA?.toString() ?? '',
      valueA: ((sim.amountA ?? 0) * sim.initialPriceA).toFixed(2),
      amountB: sim.amountB?.toString() ?? '',
      valueB: ((sim.amountB ?? 0) * sim.initialPriceB).toFixed(2),
      apr: sim.apr.toString(),
      duration: sim.duration.toString(),
      lowerPriceBound: sim.lowerPriceBound.toString(),
      upperPriceBound: sim.upperPriceBound.toString(),
      pctLower: isNaN(lowerPct) ? '0.00' : lowerPct.toFixed(2),
      pctUpper: isNaN(upperPct) ? '0.00' : upperPct.toFixed(2),
      startDate: sim.startDate,
      latestPriceA: sim.latestPriceA.toString(),
      latestPriceB: sim.latestPriceB.toString(),
      shortAmount: sim.shortAmount.toString(),
      fundingRate: sim.fundingRate.toString(),
    };
  }, []);

  const [localValues, setLocalValues] = useLocalStorage<LocalValuesState>(
    `lp-sim-values-${simulation.id}`,
    getValuesFromSim(simulation)
  );
  
  // Effect to sync price updates from props (e.g., AI fetch) without overwriting other user input
  const prevSimRef = useRef<Simulation>();
  useEffect(() => {
      const prevSim = prevSimRef.current;
      if (prevSim && (prevSim.latestPriceA !== simulation.latestPriceA || prevSim.latestPriceB !== simulation.latestPriceB)) {
           setLocalValues(prev => ({
              ...prev,
              latestPriceA: simulation.latestPriceA.toString(),
              latestPriceB: simulation.latestPriceB.toString(),
          }));
      }
      prevSimRef.current = simulation;
  }, [simulation, setLocalValues]);


  const handleInputChange = (key: LocalValueKey, value: string) => {
    // Create a mutable copy of the current local values state
    const newValues = { ...localValues, [key]: value };
  
    // Handle simple string updates first and exit
    if (key === 'protocol' || key === 'tokenA' || key === 'tokenB' || key === 'startDate') {
      onUpdate(simulation.id, { [key]: value });
      setLocalValues(newValues); // Apply the single change
      return;
    }
  
    const numValue = parseFloat(value);
    const isValidNumber = !isNaN(numValue);
    const initialPriceRatio = simulation.initialPriceB > 0 ? simulation.initialPriceA / simulation.initialPriceB : 0;
    
    // This object will collect all changes to be sent to the parent state
    let simUpdate: Partial<Simulation> = {};
  
    // Based on which input was changed, calculate dependent values and stage updates
    switch (key) {
      case 'amountA':
        if (isValidNumber) {
            newValues.valueA = (numValue * simulation.initialPriceA).toFixed(2);
            simUpdate.amountA = numValue;
        } else if (value === '') {
            newValues.valueA = '0.00';
            simUpdate.amountA = 0;
        }
        break;
      case 'valueA':
        if (isValidNumber && simulation.initialPriceA > 0) {
            const newAmount = numValue / simulation.initialPriceA;
            newValues.amountA = newAmount.toString();
            simUpdate.amountA = newAmount;
        } else if (value === '') {
            newValues.amountA = '';
            simUpdate.amountA = 0;
        }
        break;
      case 'amountB':
        if (isValidNumber) {
            newValues.valueB = (numValue * simulation.initialPriceB).toFixed(2);
            simUpdate.amountB = numValue;
        } else if (value === '') {
            newValues.valueB = '0.00';
            simUpdate.amountB = 0;
        }
        break;
      case 'valueB':
        if (isValidNumber && simulation.initialPriceB > 0) {
            const newAmount = numValue / simulation.initialPriceB;
            newValues.amountB = newAmount.toString();
            simUpdate.amountB = newAmount;
        } else if (value === '') {
            newValues.amountB = '';
            simUpdate.amountB = 0;
        }
        break;
      case 'pctLower':
        if (isValidNumber && initialPriceRatio > 0) {
            const newPriceBound = initialPriceRatio * (1 - numValue / 100);
            newValues.lowerPriceBound = newPriceBound.toString();
            simUpdate.lowerPriceBound = newPriceBound;
        }
        break;
      case 'pctUpper':
        if (isValidNumber && initialPriceRatio > 0) {
            const newPriceBound = initialPriceRatio * (1 + numValue / 100);
            newValues.upperPriceBound = newPriceBound.toString();
            simUpdate.upperPriceBound = newPriceBound;
        }
        break;
      case 'lowerPriceBound':
        if (isValidNumber) {
            if (initialPriceRatio > 0) {
                const pct = (((initialPriceRatio - numValue) / initialPriceRatio) * 100);
                newValues.pctLower = isNaN(pct) ? '0.00' : pct.toFixed(2);
            }
            simUpdate.lowerPriceBound = numValue;
        }
        break;
      case 'upperPriceBound':
        if (isValidNumber) {
            if (initialPriceRatio > 0) {
                const pct = (((numValue - initialPriceRatio) / initialPriceRatio) * 100);
                newValues.pctUpper = isNaN(pct) ? '0.00' : pct.toFixed(2);
            }
            simUpdate.upperPriceBound = numValue;
        }
        break;
      default: // Generic numeric handler for other fields
        const simKey = key as keyof Simulation;
        if (isValidNumber) {
            (simUpdate as any)[simKey] = numValue;
        } else if (value === '') {
            (simUpdate as any)[simKey] = 0;
        }
        break;
    }
  
    // Atomically apply all updates
    if (Object.keys(simUpdate).length > 0) {
      onUpdate(simulation.id, simUpdate);
    }
    setLocalValues(newValues);
  };

  const handleHedgeToggle = useCallback((enabled: boolean) => {
    const update: Partial<Simulation> = { isHedgeEnabled: enabled };
    if (enabled) {
      // Use the value of the currently selected short token as the default short size.
      const tokenAValue = (simulation.amountA ?? 0) * simulation.initialPriceA;
      const tokenBValue = (simulation.amountB ?? 0) * simulation.initialPriceB;
      const newShortAmount = simulation.shortToken === 'A' ? tokenAValue : tokenBValue;
      
      update.shortAmount = newShortAmount;
      setLocalValues(prev => ({...prev, shortAmount: newShortAmount.toFixed(2)}));
    }
    onUpdate(simulation.id, update);
  }, [
    simulation.id,
    simulation.amountA,
    simulation.initialPriceA,
    simulation.amountB,
    simulation.initialPriceB,
    simulation.shortToken,
    onUpdate,
    setLocalValues
  ]);

  const handleShortTokenChange = useCallback((token: 'A' | 'B') => {
    const tokenAValue = (simulation.amountA ?? 0) * simulation.initialPriceA;
    const tokenBValue = (simulation.amountB ?? 0) * simulation.initialPriceB;
    const newShortAmount = token === 'A' ? tokenAValue : tokenBValue;
    
    const update: Partial<Simulation> = {
        shortToken: token,
        shortAmount: newShortAmount
    };

    onUpdate(simulation.id, update);
    setLocalValues(prev => ({...prev, shortAmount: newShortAmount.toFixed(2)}));
  }, [
    simulation.id,
    simulation.amountA,
    simulation.initialPriceA,
    simulation.amountB,
    simulation.initialPriceB,
    onUpdate,
    setLocalValues
  ]);

  const endDate = useMemo(() => {
    if (!simulation.startDate || isNaN(new Date(simulation.startDate).getTime())) return '---';
    const date = new Date(simulation.startDate);
    date.setDate(date.getDate() + simulation.duration);
    return date.toISOString().split('T')[0];
  }, [simulation.startDate, simulation.duration]);

  const DURATION_PRESETS = [{ label: '1D', days: 1 }, { label: '1W', days: 7 }, { label: '1M', days: 30 }, { label: '1Y', days: 365 }];

  const calculations = useMemo(() => {
    const { 
        apr, duration, 
        initialPriceA, initialPriceB, latestPriceA, latestPriceB, 
        lowerPriceBound, upperPriceBound,
        isHedgeEnabled, shortAmount, fundingRate, shortToken,
        amountA, amountB
    } = simulation;
    
    const initialAmountA = amountA ?? 0;
    const initialAmountB = amountB ?? 0;
    
    const initialInvestment = initialAmountA * initialPriceA + initialAmountB * initialPriceB;
    const holdValue = initialAmountA * latestPriceA + initialAmountB * latestPriceB;
    
    const latestPriceRatio = latestPriceB > 0 ? latestPriceA / latestPriceB : 0;
    const initialPriceRatio = initialPriceB > 0 ? initialPriceA / initialPriceB : 0;
    const isInRange = latestPriceRatio >= lowerPriceBound && latestPriceRatio <= upperPriceBound;

    let finalLpValue = 0;
    if (initialPriceRatio > 0 && latestPriceRatio > 0 && upperPriceBound > lowerPriceBound) {
        let effectiveLpValue;
        if (latestPriceRatio < lowerPriceBound) {
            const L = (initialAmountA * Math.sqrt(initialPriceRatio) + initialAmountB) / (Math.sqrt(upperPriceBound) - Math.sqrt(lowerPriceBound));
            effectiveLpValue = L * (Math.sqrt(upperPriceBound) - Math.sqrt(lowerPriceBound)) * Math.sqrt(latestPriceA);
            effectiveLpValue = initialAmountA * latestPriceA + initialAmountB * latestPriceB; //Simplified, should be derived from Uniswap V3 math
             const sqrtP = Math.sqrt(latestPriceRatio);
             const sqrtPa = Math.sqrt(lowerPriceBound);
             const sqrtPb = Math.sqrt(upperPriceBound);
             const liquidity = Math.min(initialAmountA / (1/sqrtP - 1/sqrtPb), initialAmountB / (sqrtP-sqrtPa));
             effectiveLpValue = initialAmountA * latestPriceA + initialAmountB * latestPriceB;
             if (latestPriceRatio < lowerPriceBound) {
                 effectiveLpValue = liquidity * (sqrtPb - sqrtPa) * Math.sqrt(latestPriceB);
             } else if (latestPriceRatio > upperPriceBound) {
                 effectiveLpValue = liquidity * (1/sqrtPa - 1/sqrtPb) * latestPriceA;
             } else {
                const amount0 = liquidity * (1/sqrtP - 1/sqrtPb);
                const amount1 = liquidity * (sqrtP - sqrtPa);
                effectiveLpValue = amount0*latestPriceA + amount1*latestPriceB;
             }
        }
        
        const priceRatioChange = latestPriceRatio / initialPriceRatio;
        const impermanentLossFactor = (2 * Math.sqrt(priceRatioChange)) / (1 + priceRatioChange) -1;
        finalLpValue = holdValue * (1 + impermanentLossFactor);
    } else {
        finalLpValue = holdValue;
    }


    const impermanentLoss = finalLpValue - holdValue;
    const impermanentLossPct = holdValue > 0 ? (impermanentLoss / holdValue) * 100 : 0;
    const earnedFees = initialInvestment * (apr / 100) * (duration / 365);
    const lpNetReturn = (finalLpValue + earnedFees) - initialInvestment;
    const lpNetReturnPct = initialInvestment > 0 ? (lpNetReturn / initialInvestment) * 100 : 0;

    let shortPnl = 0, fundingPnl = 0;
    if (isHedgeEnabled) {
      shortPnl = shortToken === 'A' 
        ? (initialPriceA > 0 ? shortAmount * (1 - latestPriceA / initialPriceA) : 0)
        : (initialPriceB > 0 ? shortAmount * (1 - latestPriceB / initialPriceB) : 0);
      fundingPnl = -1 * shortAmount * (fundingRate / 100) * duration;
    }

    const totalNetReturn = lpNetReturn + shortPnl + fundingPnl;
    const totalNetReturnPct = initialInvestment > 0 ? (totalNetReturn / initialInvestment) * 100 : 0;
    const finalTotalValue = initialInvestment + totalNetReturn;

    return {
      initialInvestment, earnedFees, impermanentLoss, impermanentLossPct, holdValue,
      finalLpValue, lpNetReturn, lpNetReturnPct, shortPnl, fundingPnl, totalNetReturn,
      totalNetReturnPct, finalTotalValue, isInRange,
      priceRange: { min: lowerPriceBound, max: upperPriceBound, current: latestPriceRatio, isInRange }
    };
  }, [simulation]);
  
  const chartData = useMemo(() => {
    const {
      duration, apr, initialPriceA, initialPriceB, latestPriceA, latestPriceB,
      amountA, amountB, isHedgeEnabled, shortToken, shortAmount, fundingRate
    } = simulation;

    if (duration <= 0 || !amountA || !amountB) return [];

    const dataPoints = [];
    const initialInvestment = (amountA * initialPriceA) + (amountB * initialPriceB);

    for (let day = 0; day <= duration; day++) {
      const progress = duration > 0 ? day / duration : 1;
      const currentPriceA = initialPriceA + (latestPriceA - initialPriceA) * progress;
      const currentPriceB = initialPriceB > 0 ? initialPriceB + (latestPriceB - initialPriceB) * progress : 1;

      const holdValue = (amountA * currentPriceA) + (amountB * currentPriceB);
      const earnedFees = initialInvestment * (apr / 100) * (day / 365);
      
      const initialPriceRatio = initialPriceB > 0 ? initialPriceA / initialPriceB : 0;
      const currentPriceRatio = currentPriceB > 0 ? currentPriceA / currentPriceB : 0;

      let lpValue = holdValue;
      if (initialPriceRatio > 0 && currentPriceRatio > 0) {
        const priceRatioChange = currentPriceRatio / initialPriceRatio;
        if (priceRatioChange > 0) {
          const impermanentLossFactor = (2 * Math.sqrt(priceRatioChange)) / (1 + priceRatioChange) - 1;
          lpValue = holdValue * (1 + impermanentLossFactor);
        }
      }
      
      let shortPnl = 0, fundingPnl = 0;
      if (isHedgeEnabled) {
          shortPnl = shortToken === 'A' 
            ? (initialPriceA > 0 ? shortAmount * (1 - currentPriceA / initialPriceA) : 0)
            : (initialPriceB > 0 ? shortAmount * (1 - currentPriceB / initialPriceB) : 0);
          fundingPnl = -1 * shortAmount * (fundingRate / 100) * day;
      }

      const totalValue = lpValue + earnedFees + shortPnl + fundingPnl;

      dataPoints.push({
        day,
        totalValue,
        holdValue,
        earnedFees
      });
    }
    return dataPoints;
  }, [simulation]);


  const fetchPrices = useCallback(async () => {
    setIsLoadingPrice(true);
    try {
      const { priceA, priceB } = await fetchMockTokenPrices(simulation);
      onUpdate(simulation.id, { latestPriceA: priceA, latestPriceB: priceB });
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  }, [simulation, onUpdate]);
  
  const isHedgeEnabled = simulation.isHedgeEnabled ?? false;
  
  const handleHeaderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target instanceof HTMLElement && e.target.closest('input, button, a')) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const setFocus = (key: LocalValueKey) => () => setFocusedInput(key);
  const clearFocus = () => setFocusedInput(null);

  return (
    <Card className="transition-all duration-300">
      <div className="cursor-pointer" onClick={handleHeaderClick}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <input
              value={localValues.protocol}
              onChange={(e) => handleInputChange('protocol', e.target.value)}
              onFocus={setFocus('protocol')}
              onBlur={clearFocus}
              className="bg-transparent text-xl font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded-md px-1 -ml-1 w-full sm:w-auto"
              aria-label="Protocol Name"
            />
            <span className="text-slate-400 font-mono hidden sm:inline truncate">{simulation.tokenA}/{simulation.tokenB}</span>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <Button onClick={() => onRemove(simulation.id)} variant="danger" size="sm" className="!p-2" aria-label="Remove Simulation">
              <TrashIcon className="w-4 h-4" />
            </Button>
            <div className="w-6 h-6 text-slate-400" aria-hidden="true">
              {isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
            </div>
          </div>
        </div>

        {!isExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <Stat
                  variant="minimal"
                  label="Status"
                  value={calculations.isInRange ? 'In Range' : 'Out of Range'}
                  valueColor={calculations.isInRange ? 'text-cyan-400' : 'text-red-400'}
                />
                <Stat
                  variant="minimal"
                  label="Hedging"
                  value={isHedgeEnabled ? 'On' : 'Off'}
                  valueColor={isHedgeEnabled ? 'text-cyan-400' : 'text-slate-500'}
                />
                <Stat
                  variant="minimal"
                  label="Total Net Return"
                  value={calculations.totalNetReturn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                  subValue={`(${calculations.totalNetReturnPct.toFixed(2)}%)`}
                  valueColor={calculations.totalNetReturn >= 0 ? 'text-green-400' : 'text-red-400'}
                />
                <Stat
                  variant="minimal"
                  label="Final Total Value"
                  value={calculations.finalTotalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                />
             </div>
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="animate-fade-in">
          <div className="mt-4 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Position Setup</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end p-3 bg-slate-800/50 rounded-lg">
                    <Input label={`Token A Name`} value={localValues.tokenA} onChange={e => handleInputChange('tokenA', e.target.value.toUpperCase())} onFocus={setFocus('tokenA')} onBlur={clearFocus} />
                    <Input label="Initial Price" type="number" step="any" value={localValues.initialPriceA} onChange={e => handleInputChange('initialPriceA', e.target.value)} onFocus={setFocus('initialPriceA')} onBlur={clearFocus} />
                    <Input label="Amount" type="number" step="any" value={localValues.amountA} onChange={e => handleInputChange('amountA', e.target.value)} onFocus={setFocus('amountA')} onBlur={clearFocus} />
                    <Input label="Value ($)" type="number" step="any" value={localValues.valueA} onChange={e => handleInputChange('valueA', e.target.value)} onFocus={setFocus('valueA')} onBlur={clearFocus} />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end p-3 bg-slate-800/50 rounded-lg">
                    <Input label={`Token B Name`} value={localValues.tokenB} onChange={e => handleInputChange('tokenB', e.target.value.toUpperCase())} onFocus={setFocus('tokenB')} onBlur={clearFocus} />
                    <Input label="Initial Price" type="number" step="any" value={localValues.initialPriceB} onChange={e => handleInputChange('initialPriceB', e.target.value)} onFocus={setFocus('initialPriceB')} onBlur={clearFocus} />
                    <Input label="Amount" type="number" step="any" value={localValues.amountB} onChange={e => handleInputChange('amountB', e.target.value)} onFocus={setFocus('amountB')} onBlur={clearFocus} />
                    <Input label="Value ($)" type="number" step="any" value={localValues.valueB} onChange={e => handleInputChange('valueB', e.target.value)} onFocus={setFocus('valueB')} onBlur={clearFocus} />
                </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    <Input label="APR (%)" type="number" step="any" value={localValues.apr} onChange={e => handleInputChange('apr', e.target.value)} onFocus={setFocus('apr')} onBlur={clearFocus} />
                    <div>
                      <label className="mb-1.5 text-sm font-medium text-slate-400 block">Total Investment</label>
                      <div className="h-[42px] bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white flex items-center font-semibold" aria-label="Calculated Total Investment">
                        {calculations.initialInvestment.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                      </div>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">Liquidity Range</h3>
            <p className="text-sm text-slate-400 mb-4 -mt-1">
                Set price range by absolute values or by % deviation from initial price.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <div className="flex flex-col">
                    <label className="mb-1.5 text-sm font-medium text-slate-400">Lower Bound ({simulation.tokenA}/{simulation.tokenB})</label>
                    <div className="flex items-center space-x-2">
                        <Input label="Lower Bound Price" hideLabel type="number" step="any" value={localValues.lowerPriceBound} onChange={e => handleInputChange('lowerPriceBound', e.target.value)} onFocus={setFocus('lowerPriceBound')} onBlur={clearFocus} placeholder="Price"/>
                        <div className="relative w-28">
                            <Input label="Lower Bound Percentage" hideLabel type="number" step="any" value={localValues.pctLower} onChange={e => handleInputChange('pctLower', e.target.value)} onFocus={setFocus('pctLower')} onBlur={clearFocus} placeholder="Downside" className="pr-6 text-red-400 font-semibold" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">%</span>
                        </div>
                    </div>
                    <div className="mt-3">
                      <Slider min="0" max="99.9" step="0.1" value={localValues.pctLower} onChange={e => handleInputChange('pctLower', e.target.value)} aria-label="Lower bound percentage slider" />
                    </div>
                </div>
                <div className="flex flex-col">
                    <label className="mb-1.5 text-sm font-medium text-slate-400">Upper Bound ({simulation.tokenA}/{simulation.tokenB})</label>
                    <div className="flex items-center space-x-2">
                        <Input label="Upper Bound Price" hideLabel type="number" step="any" value={localValues.upperPriceBound} onChange={e => handleInputChange('upperPriceBound', e.target.value)} onFocus={setFocus('upperPriceBound')} onBlur={clearFocus} placeholder="Price" />
                        <div className="relative w-28">
                            <Input label="Upper Bound Percentage" hideLabel type="number" step="any" value={localValues.pctUpper} onChange={e => handleInputChange('pctUpper', e.target.value)} onFocus={setFocus('pctUpper')} onBlur={clearFocus} placeholder="Upside" className="pr-6 text-green-400 font-semibold" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">%</span>
                        </div>
                    </div>
                    <div className="mt-3">
                      <Slider min="0" max="500" step="0.1" value={localValues.pctUpper} onChange={e => handleInputChange('pctUpper', e.target.value)} aria-label="Upper bound percentage slider" />
                    </div>
                </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Market Projection</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <Input label={`Current ${simulation.tokenA} Price`} type="number" step="any" value={localValues.latestPriceA} onChange={e => handleInputChange('latestPriceA', e.target.value)} onFocus={setFocus('latestPriceA')} onBlur={clearFocus} />
              <Input label={`Current ${simulation.tokenB} Price`} type="number" step="any" value={localValues.latestPriceB} onChange={e => handleInputChange('latestPriceB', e.target.value)} onFocus={setFocus('latestPriceB')} onBlur={clearFocus} />
            </div>
            <div className="mt-4">
                <Button onClick={fetchPrices} disabled={isLoadingPrice} className="w-full md:w-auto" variant="secondary">
                    <SyncIcon className={`w-5 h-5 mr-2 ${isLoadingPrice ? 'animate-spin' : ''}`} />
                    {isLoadingPrice ? 'Fetching AI Prices...' : 'Update with AI Price (Mock)'}
                </Button>
            </div>
            <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-300 mb-3">Timeline</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Start Date" type="date" value={localValues.startDate} onChange={e => handleInputChange('startDate', e.target.value)} onFocus={setFocus('startDate')} onBlur={clearFocus} />
                    <div>
                        <Input label="Duration (Days)" type="number" step="any" value={localValues.duration} onChange={e => handleInputChange('duration', e.target.value)} onFocus={setFocus('duration')} onBlur={clearFocus} />
                        <div className="flex items-center space-x-2 mt-2" role="group" aria-label="Duration Presets">
                            {DURATION_PRESETS.map(p => (
                                <Button key={p.label} onClick={() => handleInputChange('duration', p.days.toString())} variant={simulation.duration === p.days ? 'primary' : 'secondary'} size="sm" className="flex-grow !py-1" aria-pressed={simulation.duration === p.days}>
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1.5 text-sm font-medium text-slate-400">End Date</label>
                        <div className="h-[42px] bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-slate-400 flex items-center justify-center" aria-label="Calculated End Date">
                            {endDate}
                        </div>
                    </div>
                </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-slate-300">Hedging: Short Position</h3>
              <Toggle enabled={isHedgeEnabled} onChange={handleHedgeToggle} label="Enable Hedging" />
            </div>
            {isHedgeEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                  <div className="md:col-span-2">
                      <label className="mb-1.5 text-sm font-medium text-slate-400 block">Token to Short</label>
                      <div className="flex space-x-2 mt-1" role="radiogroup" aria-label="Token to short">
                          <Button onClick={() => handleShortTokenChange('A')} variant={simulation.shortToken === 'A' ? 'primary' : 'secondary'} className="flex-1" aria-checked={simulation.shortToken === 'A'} role="radio">
                              {simulation.tokenA || 'Token A'}
                          </Button>
                          <Button onClick={() => handleShortTokenChange('B')} variant={simulation.shortToken === 'B' ? 'primary' : 'secondary'} className="flex-1" aria-checked={simulation.shortToken === 'B'} role="radio">
                              {simulation.tokenB || 'Token B'}
                          </Button>
                      </div>
                  </div>
                  <Input label="Short Size ($)" type="number" step="any" value={localValues.shortAmount} onChange={e => handleInputChange('shortAmount', e.target.value)} onFocus={setFocus('shortAmount')} onBlur={clearFocus} />
                  <Input label="Funding Rate (%/day)" type="number" step="any" value={localValues.fundingRate} onChange={e => handleInputChange('fundingRate', e.target.value)} onFocus={setFocus('fundingRate')} onBlur={clearFocus} />
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-slate-300 mb-3">Projected Results</h3>
            <PriceRangeBar {...calculations.priceRange} tokenA={simulation.tokenA} tokenB={simulation.tokenB} />
            
            <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-400 mb-2">Performance Over Time</h4>
                <div className="h-64 md:h-80 -mx-4 md:mx-0 bg-slate-800/30 rounded-lg p-2">
                    <Chart data={chartData} />
                </div>
            </div>

            <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-400 mb-2 border-b border-slate-700/50 pb-1">LP Performance</h4>
                <div className="grid grid-cols-2 gap-4 mt-3">
                    <Stat label="Earned Fees" value={calculations.earnedFees.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} valueColor="text-green-400" />
                    <Stat label="Impermanent Loss" value={calculations.impermanentLoss.toLocaleString('en-US', { style: 'currency', 'currency': 'USD' })} subValue={`(${calculations.impermanentLossPct.toFixed(2)}%)`} valueColor={calculations.impermanentLoss < 0 ? 'text-red-400' : 'text-green-400'} />
                    <Stat label="HODL Value" value={calculations.holdValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                    <Stat label="Final LP Value" value={calculations.finalLpValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} />
                     <Stat label="LP Net Return" value={calculations.lpNetReturn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} subValue={`(${calculations.lpNetReturnPct.toFixed(2)}%)`} valueColor={calculations.lpNetReturn < 0 ? 'text-red-400' : 'text-green-400'} className="col-span-2" />
                </div>
            </div>
            
            {isHedgeEnabled && simulation.shortAmount > 0 && (
              <div className="mt-6 animate-fade-in">
                  <h4 className="text-md font-semibold text-slate-400 mb-2 border-b border-slate-700/50 pb-1">Hedge Performance</h4>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                      <Stat label="Short P&L" value={calculations.shortPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} valueColor={calculations.shortPnl < 0 ? 'text-red-400' : 'text-green-400'} />
                      <Stat label="Funding Cost" value={calculations.fundingPnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} valueColor={calculations.fundingPnl < 0 ? 'text-red-400' : 'text-green-400'} />
                  </div>
              </div>
            )}
            
            <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-400 mb-2 border-b border-slate-700/50 pb-1">Combined Performance</h4>
                <div className="grid grid-cols-2 gap-4 mt-3">
                    <Stat label="Total Net Return" value={calculations.totalNetReturn.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} subValue={`(${calculations.totalNetReturnPct.toFixed(2)}%)`} valueColor={calculations.totalNetReturn < 0 ? 'text-red-400' : 'text-green-400'} className="col-span-2 sm:col-span-1" />
                    <Stat label="Final Total Value" value={calculations.finalTotalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} className="col-span-2 sm:col-span-1" />
                </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default SimulationCard;