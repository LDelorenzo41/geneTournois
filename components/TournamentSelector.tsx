import React from 'react';
import { TournamentType } from '../types';
import Card from './ui/Card';

interface TournamentSelectorProps {
  onSelect: (type: TournamentType) => void;
}

const TournamentSelector: React.FC<TournamentSelectorProps> = ({ onSelect }) => {
  return (
    <Card className="w-full max-w-md mt-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-center mb-4">Choisir le Format du Tournoi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => onSelect(TournamentType.SINGLE_ELIMINATION)}
                className="p-6 bg-slate-800 hover:bg-brand-dark border border-slate-700 hover:border-brand-secondary rounded-lg transition-all transform hover:-translate-y-1"
            >
                <h3 className="text-xl font-semibold">Élimination Directe</h3>
                <p className="text-sm text-slate-400 mt-1">Le vainqueur avance, le perdant est éliminé.</p>
            </button>
            <button
                onClick={() => onSelect(TournamentType.ROUND_ROBIN)}
                className="p-6 bg-slate-800 hover:bg-brand-dark border border-slate-700 hover:border-brand-secondary rounded-lg transition-all transform hover:-translate-y-1"
            >
                <h3 className="text-xl font-semibold">Toutes Rondes</h3>
                <p className="text-sm text-slate-400 mt-1">Chaque participant affronte tous les autres.</p>
            </button>
            <button
                onClick={() => onSelect(TournamentType.GROUP_KNOCKOUT)}
                className="p-6 bg-slate-800 hover:bg-brand-dark border border-slate-700 hover:border-brand-secondary rounded-lg transition-all transform hover:-translate-y-1 md:col-span-2"
            >
                <h3 className="text-xl font-semibold">Phase de Poules + Élimination Directe</h3>
                <p className="text-sm text-slate-400 mt-1">Les meilleurs de chaque poule avancent dans un tableau final.</p>
            </button>
        </div>
    </Card>
  );
};

export default TournamentSelector;
