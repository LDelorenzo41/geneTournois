
import React, { useState } from 'react';
import { RoundRobinMatch, Standings, Player } from '../types';
import Card from './ui/Card';
import { PencilIcon } from './Icons';

interface MatchScoreEditorProps {
  match: RoundRobinMatch;
  onSave: (matchId: string, p1Score: number, p2Score: number) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const MatchScoreEditor: React.FC<MatchScoreEditorProps> = ({ match, onSave, onCancel, isEditing }) => {
    const [p1Score, setP1Score] = useState(match.player1Score?.toString() ?? '');
    const [p2Score, setP2Score] = useState(match.player2Score?.toString() ?? '');
    const [error, setError] = useState('');

    const handleSave = () => {
        const score1 = parseInt(p1Score, 10);
        const score2 = parseInt(p2Score, 10);

        if (isNaN(score1) || isNaN(score2)) {
            setError("Les scores doivent être des nombres.");
            return;
        }
        if (score1 === score2) {
            setError("Les scores ne peuvent pas être égaux.");
            return;
        }
        setError('');
        onSave(match.id, score1, score2);
    };

    return (
        <div className="mt-2 text-xs">
            <div className="flex items-center justify-center gap-2">
                <input type="number" value={p1Score} onChange={e => setP1Score(e.target.value)} className="w-12 bg-slate-900 text-center rounded p-1 border border-slate-600 focus:ring-brand-accent focus:border-brand-accent" placeholder="-" aria-label={`Score de ${match.player1.name}`} />
                <span>-</span>
                <input type="number" value={p2Score} onChange={e => setP2Score(e.target.value)} className="w-12 bg-slate-900 text-center rounded p-1 border border-slate-600 focus:ring-brand-accent focus:border-brand-accent" placeholder="-" aria-label={`Score de ${match.player2.name}`} />
                <button onClick={handleSave} className="px-2 py-1 bg-brand-accent hover:bg-amber-600 text-white font-bold rounded">OK</button>
                {isEditing && (
                    <button onClick={onCancel} className="px-2 py-1 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded">X</button>
                )}
            </div>
            {error && <p className="text-red-500 text-center text-xs mt-1">{error}</p>}
        </div>
    );
};


interface RoundRobinViewProps {
  matches: RoundRobinMatch[];
  standings: Standings;
  onScoreUpdate: (matchId: string, p1Score: number, p2Score: number) => void;
}

const RoundRobinView: React.FC<RoundRobinViewProps> = ({ matches, standings, onScoreUpdate }) => {
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  
  const sortedStandings = Object.entries(standings).sort(([, a], [, b]) => {
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }
        return b.pointDifference - a.pointDifference;
    });

  const allMatches = [...matches].sort((a,b) => a.round - b.round);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <h2 className="text-3xl font-bold text-center mb-8">Tournoi Toutes Rondes</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <h3 className="text-xl font-semibold mb-4">Matchs</h3>
                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {allMatches.length > 0 ? allMatches.map(match => {
                        const isEditing = editingMatchId === match.id;
                        const showEditor = isEditing || !match.winner;

                        return (
                            <div key={match.id} className="bg-slate-800 p-3 rounded-lg text-sm">
                                <div className="flex justify-between items-center">
                                   <span className={`truncate ${match.winner?.id === match.player1.id ? 'font-bold text-brand-accent' : ''}`}>{match.player1.name}</span> 
                                   {!showEditor && (
                                       <span className="text-slate-500 text-xs">vs</span>
                                   )}
                                   <span className={`truncate text-right ${match.winner?.id === match.player2.id ? 'font-bold text-brand-accent' : ''}`}>{match.player2.name}</span>
                                </div>

                                {showEditor ? (
                                    <MatchScoreEditor
                                        match={match}
                                        onSave={(matchId, p1s, p2s) => {
                                            onScoreUpdate(matchId, p1s, p2s);
                                            setEditingMatchId(null);
                                        }}
                                        onCancel={() => setEditingMatchId(null)}
                                        isEditing={isEditing}
                                    />
                                ) : (
                                    <div className="flex justify-center items-center mt-2" role="group">
                                        <span className="font-mono text-lg bg-slate-900 px-3 py-1 rounded">
                                            {match.player1Score} - {match.player2Score}
                                        </span>
                                        <button 
                                            onClick={() => setEditingMatchId(match.id)} 
                                            className="ml-4 text-slate-400 hover:text-brand-accent transition-colors"
                                            aria-label="Modifier le score"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    }) : (
                        <p className="text-slate-400 text-center py-4">Aucun match généré.</p>
                    )}
                     {matches.every(m => m.winner) && matches.length > 0 && (
                        <p className="text-green-400 text-center font-semibold py-4">Tous les matchs ont été joués ! Le classement est final.</p>
                     )}
                </div>
            </Card>
        </div>
        <div>
          <Card>
            <h3 className="text-xl font-semibold mb-4">Classement</h3>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="p-1">#</th>
                  <th className="p-1">Joueur</th>
                  <th className="p-1 text-center">V-D</th>
                  <th className="p-1 text-center">+/-</th>
                </tr>
              </thead>
              <tbody>
                {sortedStandings.map(([name, stats], index) => (
                  <tr key={name} className={`border-b border-slate-700 ${index === 0 ? 'text-brand-accent' : ''}`}>
                    <td className="p-1 font-bold">{index + 1}</td>
                    <td className="p-1 truncate">{name}</td>
                    <td className="p-1 text-center">{stats.wins}-{stats.losses}</td>
                    <td className="p-1 text-center">{stats.pointDifference > 0 ? `+${stats.pointDifference}` : stats.pointDifference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RoundRobinView;