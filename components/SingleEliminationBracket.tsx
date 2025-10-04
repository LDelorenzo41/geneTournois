import React from 'react';
import { Match, Player } from '../types';

interface MatchCardProps {
  match: Match;
  onSelectWinner: (matchId: string, winner: Player) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, onSelectWinner }) => {
  const { player1, player2, winner } = match;

  const handlePlayerClick = (player: Player | null) => {
    if (player && player1 && player2 && !winner && player.name !== 'BYE') {
      onSelectWinner(match.id, player);
    }
  };

  const getPlayerClass = (player: Player | null, isWinner: boolean) => {
    if (!player) return 'text-slate-500 italic';
    if (winner) {
      return isWinner ? 'font-bold text-brand-accent' : 'text-slate-500 line-through';
    }
    return 'cursor-pointer hover:text-brand-secondary';
  };
  
  if (!player1 && !player2) {
      return (
          <div className="bg-slate-800 p-3 rounded-lg min-h-[80px] flex flex-col justify-around shadow-md w-52">
              <div className="text-slate-600">À déterminer</div>
              <div className="border-t border-slate-700 my-1"></div>
              <div className="text-slate-600">À déterminer</div>
          </div>
      );
  }

  return (
    <div className="bg-slate-800 p-3 rounded-lg min-h-[80px] flex flex-col justify-around shadow-md border border-slate-700 w-52">
      <div onClick={() => handlePlayerClick(player1)} className={`truncate ${getPlayerClass(player1, winner?.id === player1?.id)}`}>
        {player1?.name || '...'}
      </div>
      <div className="border-t border-slate-700 my-1"></div>
      <div onClick={() => handlePlayerClick(player2)} className={`truncate ${getPlayerClass(player2, winner?.id === player2?.id)}`}>
        {player2?.name || '...'}
      </div>
    </div>
  );
};

interface SingleEliminationBracketProps {
  matches: Match[];
  onSelectWinner: (matchId: string, winner: Player) => void;
  title?: string;
}

const SingleEliminationBracket: React.FC<SingleEliminationBracketProps> = ({ matches, onSelectWinner, title }) => {
  if (matches.length === 0) {
    return (
      <div className="p-4 animate-fade-in w-full text-center">
        <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>
        <p className="text-slate-400">Pas de matchs à afficher.</p>
      </div>
    );
  }

  const rounds = Array.from(new Set(matches.map(m => m.round))).sort((a,b) => a-b);

  return (
    <div className="p-4 animate-fade-in w-full">
        <h2 className="text-3xl font-bold text-center mb-8">{title || 'Tableau du Tournoi - Élimination Directe'}</h2>
        <div className="flex gap-12 overflow-x-auto pb-8">
            {rounds.map(roundNumber => {
                const roundMatches = matches.filter(m => m.round === roundNumber).sort((a,b) => a.matchNumber - b.matchNumber);
                const isFinal = roundMatches.length === 1 && !roundMatches[0].nextMatchId;

                return (
                    <div key={roundNumber} className="flex flex-col items-center flex-shrink-0">
                        <h3 className="text-xl font-semibold mb-4 whitespace-nowrap">
                          {isFinal ? 'Finale' : roundMatches.length === 2 ? 'Demi-finales' : `Round ${roundNumber}`}
                        </h3>
                        <div className="flex flex-col gap-6">
                        {roundMatches.map((match, index) => (
                            <div key={match.id} className="relative flex items-center">
                                <MatchCard match={match} onSelectWinner={onSelectWinner} />
                                {!isFinal && (
                                <div className="absolute left-full w-10 h-full flex items-center">
                                    <div className="w-5 h-px bg-slate-600"></div>
                                    <div 
                                      className={`w-5 h-[calc(50%+1.5rem)] border-slate-600 ${index % 2 === 0 ? 'border-b border-r rounded-br-lg' : 'border-t border-r rounded-tr-lg'}`}>
                                    </div>
                                </div>
                                )}
                            </div>
                        ))}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default SingleEliminationBracket;
