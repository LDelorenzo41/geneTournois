import React, { useState } from 'react';
import { Group, GroupMatch, GroupStandings, Match, Player, Standings } from '../types';
import Card from './ui/Card';
import SingleEliminationBracket from './SingleEliminationBracket';
import { PencilIcon } from './Icons';

interface GroupKnockoutViewProps {
    groups: Group[];
    groupMatches: GroupMatch[];
    groupStandings: GroupStandings;
    knockoutMatches: Match[];
    consolationMatches: Match[];
    tournamentPhase: 'groups' | 'knockout';
    onGroupScoreUpdate: (matchId: string, p1Score: number, p2Score: number) => void;
    onKnockoutWinner: (matchId: string, winner: Player) => void;
    onConsolationWinner: (matchId: string, winner: Player) => void;
}

interface MatchScoreEditorProps {
  match: GroupMatch;
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

const GroupView: React.FC<{
    group: Group;
    matches: GroupMatch[];
    standings: Standings;
    onScoreUpdate: (matchId: string, p1Score: number, p2Score: number) => void;
}> = ({ group, matches, standings, onScoreUpdate }) => {
    const [editingMatchId, setEditingMatchId] = useState<string | null>(null);

    const sortedStandings = Object.entries(standings).sort(([, a], [, b]) => {
        if (b.wins !== a.wins) {
            return b.wins - a.wins;
        }
        return b.pointDifference - a.pointDifference;
    });

    return (
        <Card className="mb-6">
            <h3 className="text-xl font-bold mb-4 text-brand-accent">{group.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold mb-2">Matchs</h4>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {matches.map(match => {
                        const isEditing = editingMatchId === match.id;
                        const showEditor = isEditing || !match.winner;

                        return (
                            <div key={match.id} className="bg-slate-800 p-3 rounded-lg text-sm">
                                <div className="flex justify-between items-center">
                                   <span className={`${match.winner?.id === match.player1.id ? 'font-bold text-brand-accent' : ''}`}>{match.player1.name}</span> 
                                   {!showEditor && (
                                       <span className="text-slate-500">vs</span>
                                   )}
                                   <span className={`${match.winner?.id === match.player2.id ? 'font-bold text-brand-accent' : ''}`}>{match.player2.name}</span>
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
                    })}
                    </div>
                </div>
                <div>
                    <h4 className="font-semibold mb-2">Classement</h4>
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
                            <tr key={name} className={`border-b border-slate-700 ${index < 2 ? 'font-semibold text-green-400' : ''}`}>
                                <td className="p-1">{index + 1}</td>
                                <td className="p-1 truncate">{name}</td>
                                <td className="p-1 text-center">{stats.wins}-{stats.losses}</td>
                                <td className="p-1 text-center">{stats.pointDifference > 0 ? `+${stats.pointDifference}` : stats.pointDifference}</td>
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    )
}


const GroupKnockoutView: React.FC<GroupKnockoutViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'groups' | 'main' | 'consolation'>('groups');

  const tabClass = (tabName: 'groups' | 'main' | 'consolation') => 
    `px-4 py-2 font-semibold rounded-t-lg transition-colors ${
      activeTab === tabName
        ? 'bg-slate-800 text-brand-secondary'
        : 'bg-slate-900 text-slate-400 hover:bg-slate-800/50'
    }`;
    
  const disabledTabClass = "px-4 py-2 font-semibold rounded-t-lg bg-slate-900 text-slate-600 cursor-not-allowed";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 animate-fade-in">
        <div className="border-b border-slate-700 mb-6 flex">
            <button onClick={() => setActiveTab('groups')} className={tabClass('groups')}>Phase de Poules</button>
            <button 
                onClick={() => setActiveTab('main')} 
                className={props.tournamentPhase === 'groups' ? disabledTabClass : tabClass('main')}
                disabled={props.tournamentPhase === 'groups'}
            >
                Tableau Principal
            </button>
            <button 
                onClick={() => setActiveTab('consolation')} 
                className={props.tournamentPhase === 'groups' ? disabledTabClass : tabClass('consolation')}
                disabled={props.tournamentPhase === 'groups'}
            >
                Consolante
            </button>
        </div>

        {activeTab === 'groups' && (
            <div>
                 {props.tournamentPhase === 'groups' ? (
                     <p className="text-center text-slate-400 mb-4">Terminez tous les matchs de poule pour générer les tableaux finaux.</p>
                 ) : (
                     <p className="text-center text-green-400 mb-4">Phase de poule terminée ! Consultez les tableaux finaux.</p>
                 )}
                {props.groups.map(group => (
                    <GroupView 
                        key={group.id}
                        group={group}
                        matches={props.groupMatches.filter(m => m.groupId === group.id)}
                        standings={props.groupStandings[group.id]}
                        onScoreUpdate={props.onGroupScoreUpdate}
                    />
                ))}
            </div>
        )}

        {activeTab === 'main' && (
            <SingleEliminationBracket 
                title="Tableau Principal"
                matches={props.knockoutMatches}
                onSelectWinner={props.onKnockoutWinner}
            />
        )}

        {activeTab === 'consolation' && (
             <SingleEliminationBracket 
                title="Tournoi Consolante"
                matches={props.consolationMatches}
                onSelectWinner={props.onConsolationWinner}
            />
        )}
    </div>
  );
};

export default GroupKnockoutView;