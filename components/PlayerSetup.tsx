
import React, { useState } from 'react';
import { Player } from '../types';
import { PlusIcon, TrashIcon, UsersIcon, LightningBoltIcon, StarIcon } from './Icons';
import Card from './ui/Card';

interface PlayerSetupProps {
  players: Player[];
  onAddPlayer: (name: string) => void;
  onRemovePlayer: (id: number) => void;
  onQuickAdd: (count: number) => void;
  isSeedingEnabled: boolean;
  onToggleSeeding: (enabled: boolean) => void;
  onToggleSeed: (id: number) => void;
}

const PlayerSetup: React.FC<PlayerSetupProps> = ({
  players,
  onAddPlayer,
  onRemovePlayer,
  onQuickAdd,
  isSeedingEnabled,
  onToggleSeeding,
  onToggleSeed
}) => {
  const [playerName, setPlayerName] = useState('');
  const [quickAddCount, setQuickAddCount] = useState<string>('8');

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddPlayer(playerName);
    setPlayerName('');
  };
  
  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(quickAddCount, 10);
    if (!isNaN(count) && count >= 2 && count <= 28) {
        onQuickAdd(count);
    }
  };
  
  const seededCount = players.filter(p => p.isSeeded).length;

  return (
    <Card className="w-full max-w-md animate-slide-in-up">
      <div className="mb-6 border-b border-slate-700 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <LightningBoltIcon className="w-8 h-8 text-brand-accent" />
          <h2 className="text-2xl font-bold">Inscription Rapide</h2>
        </div>
        <form onSubmit={handleQuickAddSubmit} className="flex gap-2">
          <input
            type="number"
            value={quickAddCount}
            onChange={(e) => setQuickAddCount(e.target.value)}
            min="2"
            max="28"
            placeholder="Nb de joueurs"
            aria-label="Nombre de joueurs pour l'inscription rapide"
            className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-accent transition"
          />
          <button
            type="submit"
            className="bg-brand-accent hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-md transition-colors flex-shrink-0"
          >
            Générer
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">Remplace la liste de joueurs actuelle.</p>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <UsersIcon className="w-8 h-8 text-brand-secondary" />
        <h2 className="text-2xl font-bold">Ajout Manuel</h2>
      </div>

      <form onSubmit={handleManualSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Nom du joueur ou de l'équipe"
          className="flex-grow bg-slate-700 border border-slate-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-secondary transition"
          disabled={players.length >= 28}
        />
        <button
          type="submit"
          className="bg-brand-primary hover:bg-brand-dark text-white font-bold p-2 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          disabled={!playerName.trim() || players.length >= 28}
          aria-label="Ajouter un joueur"
        >
          <PlusIcon className="w-6 h-6" />
        </button>
      </form>

       <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
                <label htmlFor="seeding-toggle" className="font-semibold text-white">
                    Activer les têtes de série
                    <span className="block text-xs text-slate-400 font-normal">Pour le format Élimination Directe</span>
                </label>
                <button
                    id="seeding-toggle"
                    onClick={() => onToggleSeeding(!isSeedingEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-secondary focus:ring-offset-2 focus:ring-offset-slate-800 ${isSeedingEnabled ? 'bg-brand-secondary' : 'bg-slate-600'}`}
                    role="switch"
                    aria-checked={isSeedingEnabled}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isSeedingEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                    ></span>
                </button>
            </div>
             {isSeedingEnabled && (
                <p className="text-xs text-slate-400 mt-2">
                    Cliquez sur l'étoile pour désigner une tête de série. Têtes de série : {seededCount}/8.
                </p>
            )}
        </div>


      <div className="flex justify-between items-center text-sm text-slate-400 mb-2">
        <span>Participants</span>
        <span>{players.length} / 28</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2.5 mb-4">
        <div className="bg-brand-secondary h-2.5 rounded-full" style={{ width: `${(players.length / 28) * 100}%` }}></div>
      </div>
      
      <div id="player-list" className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {players.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between bg-slate-700 p-2 rounded-md animate-fade-in"
          >
            <div className="flex items-center gap-3">
              {isSeedingEnabled && (
                  <button onClick={() => onToggleSeed(player.id)} aria-label={`Désigner ${player.name} comme tête de série`}>
                      <StarIcon className={`w-5 h-5 transition-colors ${player.isSeeded ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-500'}`} />
                  </button>
              )}
              <span className="font-medium">{player.name}</span>
            </div>
            <button 
              onClick={() => onRemovePlayer(player.id)} 
              className="text-slate-400 hover:text-red-500 transition-colors"
              aria-label={`Supprimer ${player.name}`}
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        {players.length === 0 && (
            <p className="text-center text-slate-500 pt-4">Aucun joueur ajouté pour le moment.</p>
        )}
      </div>
    </Card>
  );
};

export default PlayerSetup;