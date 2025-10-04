import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import { ArrowLeftIcon, GridIcon } from './Icons';

interface GroupConfigProps {
  playersCount: number;
  onConfirm: (config: { numGroups: number }) => void;
  onBack: () => void;
}

const GroupConfig: React.FC<GroupConfigProps> = ({ playersCount, onConfirm, onBack }) => {
  const minGroups = 2;
  const maxGroups = Math.floor(playersCount / 2);
  const [numGroups, setNumGroups] = useState<number>(Math.max(minGroups, Math.min(4, maxGroups)));

  const groupDistribution = useMemo(() => {
    if (numGroups <= 0) return '';
    const baseSize = Math.floor(playersCount / numGroups);
    const remainder = playersCount % numGroups;
    if (remainder === 0) {
      return `${numGroups} poules de ${baseSize} joueurs`;
    }
    const largeGroups = remainder;
    const smallGroups = numGroups - remainder;
    return `${largeGroups} poules de ${baseSize + 1} joueurs et ${smallGroups} poules de ${baseSize} joueurs`;
  }, [playersCount, numGroups]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numGroups >= minGroups && numGroups <= maxGroups) {
      onConfirm({ numGroups });
    }
  };

  return (
    <Card className="w-full max-w-md animate-slide-in-up">
      <div className="flex items-center gap-3 mb-4">
        <GridIcon className="w-8 h-8 text-brand-secondary" />
        <h2 className="text-2xl font-bold">Configuration des Poules</h2>
      </div>
      <p className="text-slate-400 mb-6">
        Divisez les {playersCount} participants en poules. Les 2 meilleurs de chaque poule seront qualifiés.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="num-groups" className="block text-sm font-medium text-slate-300 mb-2">
            Nombre de poules
          </label>
          <input
            id="num-groups"
            type="range"
            min={minGroups}
            max={maxGroups}
            value={numGroups}
            onChange={(e) => setNumGroups(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            disabled={maxGroups < minGroups}
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{minGroups}</span>
            <span>{maxGroups}</span>
          </div>
        </div>

        <div className="bg-slate-900/50 p-4 rounded-lg text-center mb-6">
          <p className="text-3xl font-bold text-brand-accent">{numGroups}</p>
          <p className="text-slate-300">{groupDistribution}</p>
        </div>

        <div className="flex items-center gap-4">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg shadow-md transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5"/>
                Retour
            </button>
            <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg shadow-md transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
            disabled={maxGroups < minGroups}
            >
            Démarrer le tournoi
            </button>
        </div>
      </form>
    </Card>
  );
};

export default GroupConfig;
