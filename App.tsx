
import React, { useState, useMemo, useCallback } from 'react';
import { AppState, TournamentType, Player, Match, RoundRobinMatch, Standings, Group, GroupMatch, GroupStandings, Standing } from './types';
import PlayerSetup from './components/PlayerSetup';
import TournamentSelector from './components/TournamentSelector';
import SingleEliminationBracket from './components/SingleEliminationBracket';
import RoundRobinView from './components/RoundRobinView';
import GroupConfig from './components/GroupConfig';
import GroupKnockoutView from './components/GroupKnockoutView';
import { TrophyIcon, ArrowLeftIcon } from './components/Icons';
import Card from './components/ui/Card';

const getBracketOrder = (numPlayers: number): number[] => {
    if (numPlayers <= 1) return [0];
    let rounds = Math.log2(numPlayers);
    if (rounds % 1 !== 0) {
        // This function requires a power of two
        return Array.from({ length: numPlayers }, (_, i) => i);
    }
    let seeds = [1];
    for (let i = 1; i <= rounds; i++) {
        let newSeeds: number[] = [];
        let nextSeed = Math.pow(2, i) + 1;
        for (const seed of seeds) {
            newSeeds.push(seed);
            newSeeds.push(nextSeed - seed);
        }
        seeds = newSeeds;
    }
    return seeds.map(s => s - 1);
};


const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tournamentType, setTournamentType] = useState<TournamentType | null>(null);
  const [winner, setWinner] = useState<Player | null>(null);
  const [isSeedingEnabled, setIsSeedingEnabled] = useState<boolean>(false);


  // State for Single Elimination & Round Robin
  const [matches, setMatches] = useState<Match[]>([]);
  const [roundRobinMatches, setRoundRobinMatches] = useState<RoundRobinMatch[]>([]);
  const [standings, setStandings] = useState<Standings>({});

  // State for Group + Knockout
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMatches, setGroupMatches] = useState<GroupMatch[]>([]);
  const [groupStandings, setGroupStandings] = useState<GroupStandings>({});
  const [knockoutMatches, setKnockoutMatches] = useState<Match[]>([]);
  const [consolationMatches, setConsolationMatches] = useState<Match[]>([]);
  const [tournamentPhase, setTournamentPhase] = useState<'groups' | 'knockout'>('groups');
  const [mainWinner, setMainWinner] = useState<Player | null>(null);


  const handleAddPlayer = (name: string) => {
    if (players.length < 28 && name.trim()) {
      setPlayers(prev => [...prev, { id: Date.now(), name: name.trim(), isSeeded: false }]);
    }
  };

  const handleRemovePlayer = (id: number) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
  };
  
  const handleToggleSeed = (id: number) => {
    const player = players.find(p => p.id === id);
    if (!player) return;

    const seededCount = players.filter(p => p.isSeeded).length;
    if (!player.isSeeded && seededCount >= 8) {
        console.warn("Maximum de 8 têtes de série atteint.");
        return;
    }

    setPlayers(players.map(p =>
        p.id === id ? { ...p, isSeeded: !p.isSeeded } : p
    ));
  };

  const handleQuickAddPlayers = (count: number) => {
    if (count < 2 || count > 28) return;

    const newPlayers: Player[] = [];
    for (let i = 0; i < count; i++) {
      let name: string;
      if (i < 26) {
        name = String.fromCharCode(65 + i);
      } else {
        name = 'A' + String.fromCharCode(65 + (i - 26));
      }
      newPlayers.push({ id: Date.now() + i, name, isSeeded: false });
    }
    setPlayers(newPlayers);
  };
  
  const generateMatchesFromList = useCallback((playerList: (Player | { id: number, name: string})[]) : Match[] => {
    let roundMatches: Match[] = [];
    for (let i = 0; i < playerList.length; i += 2) {
      roundMatches.push({
        id: `R1M${i / 2 + 1}`,
        round: 1, matchNumber: i / 2 + 1,
        player1: playerList[i] as Player, player2: playerList[i+1] as Player,
        winner: null, nextMatchId: `R2M${Math.floor(i / 4) + 1}`,
      });
    }

    let allMatches = [...roundMatches];
    let currentRound = 1;
    let matchesInRound = roundMatches.length;

    while (matchesInRound > 1) {
      const nextRound = currentRound + 1;
      const nextMatchesInRound = matchesInRound / 2;
      for (let i = 0; i < nextMatchesInRound; i++) {
        allMatches.push({
          id: `R${nextRound}M${i + 1}`, round: nextRound, matchNumber: i + 1,
          player1: null, player2: null, winner: null,
          nextMatchId: nextMatchesInRound === 1 ? null : `R${nextRound + 1}M${Math.floor(i / 2) + 1}`,
        });
      }
      matchesInRound = nextMatchesInRound;
      currentRound = nextRound;
    }
    
    const processedMatches = allMatches.map(m => {
        if (m.round === 1) {
            if (m.player1?.name === 'BYE') return {...m, winner: m.player2};
            if (m.player2?.name === 'BYE') return {...m, winner: m.player1};
        }
        return m;
    });
    return processedMatches;
  }, []);

  const createBracket = useCallback((bracketPlayers: Player[], useRandomSort: boolean = true): Match[] => {
    if (bracketPlayers.length < 2) return [];
    
    const playersForBracket = useRandomSort ? [...bracketPlayers].sort(() => Math.random() - 0.5) : [...bracketPlayers];
    
    let finalPlayers = [...playersForBracket];
    const numPlayers = finalPlayers.length;

    if (Math.log2(numPlayers) % 1 !== 0) {
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
        const byes = nextPowerOfTwo - numPlayers;
        finalPlayers.push(...Array(byes).fill({ id: -1, name: 'BYE' }));
    }
    
    return generateMatchesFromList(finalPlayers);
  }, [generateMatchesFromList]);

  const advanceWinners = (currentMatches: Match[], onFinish?: (player: Player) => void): Match[] => {
      let updatedMatches = [...currentMatches];
      let changesMade = true;
      while(changesMade) {
        changesMade = false;
        updatedMatches.forEach(match => {
            if(match.winner && match.nextMatchId) {
                const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId);
                if (nextMatchIndex !== -1) {
                    const nextMatch = updatedMatches[nextMatchIndex];
                    if (match.matchNumber % 2 !== 0 && !nextMatch.player1) {
                        updatedMatches[nextMatchIndex] = {...nextMatch, player1: match.winner};
                        changesMade = true;
                    } else if (match.matchNumber % 2 === 0 && !nextMatch.player2) {
                      updatedMatches[nextMatchIndex] = {...nextMatch, player2: match.winner};
                        changesMade = true;
                    }
                }
            }
        });
      }
      const finalMatch = updatedMatches.find(m => !m.nextMatchId);
      if (finalMatch && finalMatch.winner) {
        onFinish?.(finalMatch.winner);
      }
      return updatedMatches;
  };
  
  const startSingleElimination = useCallback(() => {
    const useSeeding = isSeedingEnabled && players.filter(p => p.isSeeded).length > 1;
    let bracketMatches;

    if (useSeeding) {
        const seeds = players.filter(p => p.isSeeded);
        const others = players.filter(p => !p.isSeeded).sort(() => Math.random() - 0.5);

        const numPlayers = players.length;
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
        const playerSlots = new Array(bracketSize).fill(null);

        const seedPlacementIndices = getBracketOrder(bracketSize);
        seeds.forEach((seed, i) => {
            playerSlots[seedPlacementIndices[i]] = seed;
        });
        
        let otherPlayerIndex = 0;
        for (let i = 0; i < bracketSize; i++) {
            if (playerSlots[i] === null && otherPlayerIndex < others.length) {
                playerSlots[i] = others[otherPlayerIndex];
                otherPlayerIndex++;
            }
        }
        for (let i = 0; i < bracketSize; i++) {
            if (playerSlots[i] === null) {
                playerSlots[i] = { id: -1, name: 'BYE' };
            }
        }
        bracketMatches = generateMatchesFromList(playerSlots);
    } else {
        bracketMatches = createBracket(players, true);
    }

    setMatches(advanceWinners(bracketMatches, (winner) => {
        setWinner(winner);
        setAppState(AppState.FINISHED);
    }));
  }, [players, isSeedingEnabled, createBracket, generateMatchesFromList]);

  const handleStartTournament = (type: TournamentType) => {
    setTournamentType(type);
    if (type === TournamentType.SINGLE_ELIMINATION) {
      startSingleElimination();
      setAppState(AppState.TOURNAMENT);
    } else if (type === TournamentType.ROUND_ROBIN) {
      startRoundRobin();
      setAppState(AppState.TOURNAMENT);
    } else if (type === TournamentType.GROUP_KNOCKOUT) {
      setAppState(AppState.GROUP_CONFIG);
    }
  };

  
  const handleSelectWinner = (matchId: string, winner: Player) => {
    const newMatches = matches.map(m => m.id === matchId ? { ...m, winner } : m);
    setMatches(advanceWinners(newMatches, (winner) => {
        setWinner(winner);
        setAppState(AppState.FINISHED);
    }));
  };
  
  const startRoundRobin = useCallback(() => {
    const schedule: RoundRobinMatch[] = [];
    let tempPlayers = [...players];

    if (tempPlayers.length < 2) return;

    if (tempPlayers.length % 2 !== 0) {
      tempPlayers.push({ id: -1, name: 'BYE', isSeeded: false });
    }
    
    const numRounds = tempPlayers.length - 1;
    const halfSize = tempPlayers.length / 2;
    
    for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
            const p1 = tempPlayers[i];
            const p2 = tempPlayers[tempPlayers.length - 1 - i];
            if (p1.name !== 'BYE' && p2.name !== 'BYE') {
                schedule.push({
                    id: `R${round + 1}M${i + 1}-${p1.id}-${p2.id}`,
                    player1: p1,
                    player2: p2,
                    winner: null,
                    round: round + 1,
                    player1Score: null,
                    player2Score: null,
                });
            }
        }
        const lastPlayer = tempPlayers.pop();
        if(lastPlayer) tempPlayers.splice(1, 0, lastPlayer);
    }
    
    setRoundRobinMatches(schedule);
    
    const initialStandings: Standings = {};
    players.forEach(p => {
      initialStandings[p.name] = { wins: 0, losses: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0, pointDifference: 0 };
    });
    setStandings(initialStandings);
  }, [players]);

  const handleRoundRobinScoreUpdate = (matchId: string, p1Score: number, p2Score: number) => {
    const matchIndex = roundRobinMatches.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const oldMatch = roundRobinMatches[matchIndex];
    const { player1, player2 } = oldMatch;

    const newWinner = p1Score > p2Score ? player1 : player2;

    const updatedMatches = [...roundRobinMatches];
    updatedMatches[matchIndex] = { ...oldMatch, winner: newWinner, player1Score: p1Score, player2Score: p2Score };

    setStandings(prev => {
      const newStandings = JSON.parse(JSON.stringify(prev));
      
      if (oldMatch.winner) {
        const oldWinner = oldMatch.player1Score! > oldMatch.player2Score! ? player1 : player2;
        const oldLoser = oldWinner.id === player1.id ? player2 : player1;
        newStandings[oldWinner.name].wins -= 1;
        newStandings[oldLoser.name].losses -= 1;
        
        newStandings[player1.name].pointsFor -= oldMatch.player1Score!;
        newStandings[player1.name].pointsAgainst -= oldMatch.player2Score!;
        newStandings[player2.name].pointsFor -= oldMatch.player2Score!;
        newStandings[player2.name].pointsAgainst -= oldMatch.player1Score!;

      } else {
        newStandings[player1.name].gamesPlayed += 1;
        newStandings[player2.name].gamesPlayed += 1;
      }
      
      const newLoser = newWinner.id === player1.id ? player2 : player1;
      newStandings[newWinner.name].wins += 1;
      newStandings[newLoser.name].losses += 1;

      newStandings[player1.name].pointsFor += p1Score;
      newStandings[player1.name].pointsAgainst += p2Score;
      newStandings[player2.name].pointsFor += p2Score;
      newStandings[player2.name].pointsAgainst += p1Score;
      
      newStandings[player1.name].pointDifference = newStandings[player1.name].pointsFor - newStandings[player1.name].pointsAgainst;
      newStandings[player2.name].pointDifference = newStandings[player2.name].pointsFor - newStandings[player2.name].pointsAgainst;

      return newStandings;
    });

    setRoundRobinMatches(updatedMatches);
  };

  React.useEffect(() => {
    if (
        tournamentType === TournamentType.ROUND_ROBIN &&
        roundRobinMatches.length > 0 &&
        roundRobinMatches.every(m => m.winner)
    ) {
        const sortedStandings = Object.entries(standings)
            .sort(([,a], [,b]) => {
                if (b.wins !== a.wins) return b.wins - a.wins;
                return b.pointDifference - a.pointDifference;
            });

        if (sortedStandings.length > 0) {
            const topPlayerName = sortedStandings[0][0];
            const winnerPlayer = players.find(p => p.name === topPlayerName);
            if (winnerPlayer) {
                setWinner(winnerPlayer);
                setAppState(AppState.FINISHED);
            }
        }
    }
  }, [roundRobinMatches, standings, players, tournamentType]);

  const handleConfirmGroupSetup = (config: { numGroups: number }) => {
    const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);
    const newGroups: Group[] = Array.from({ length: config.numGroups }, (_, i) => ({
      id: `G${i + 1}`,
      name: `Poule ${String.fromCharCode(65 + i)}`,
      players: [],
    }));
    shuffledPlayers.forEach((player, index) => {
      newGroups[index % config.numGroups].players.push(player);
    });
    setGroups(newGroups);

    const allGroupMatches: GroupMatch[] = [];
    const allGroupStandings: GroupStandings = {};

    newGroups.forEach(group => {
      const schedule: GroupMatch[] = [];
      const tempPlayers = [...group.players];
      if (tempPlayers.length % 2 !== 0) tempPlayers.push({ id: -1, name: 'BYE' });
      const numRounds = tempPlayers.length - 1;
      const halfSize = tempPlayers.length / 2;
      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < halfSize; i++) {
          const p1 = tempPlayers[i];
          const p2 = tempPlayers[tempPlayers.length - 1 - i];
          if (p1.name !== 'BYE' && p2.name !== 'BYE') {
            schedule.push({
              id: `${group.id}R${round+1}M${i+1}`, groupId: group.id,
              player1: p1, player2: p2, winner: null, round: round + 1,
              player1Score: null, player2Score: null,
            });
          }
        }
        const lastPlayer = tempPlayers.pop();
        if(lastPlayer) tempPlayers.splice(1, 0, lastPlayer);
      }
      allGroupMatches.push(...schedule);
      
      const initialStandings: Standings = {};
      group.players.forEach(p => {
        initialStandings[p.name] = { wins: 0, losses: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0, pointDifference: 0 };
      });
      allGroupStandings[group.id] = initialStandings;
    });

    setGroupMatches(allGroupMatches);
    setGroupStandings(allGroupStandings);
    setAppState(AppState.TOURNAMENT);
  };
  
  const generateKnockoutStages = useCallback(() => {
    const groupWinners: Player[] = [];
    const groupRunnersUp: Player[] = [];

    groups.forEach(group => {
        const groupStanding = groupStandings[group.id];
        const sortedPlayers = [...group.players].sort((a, b) => {
            const statsA = groupStanding[a.name];
            const statsB = groupStanding[b.name];
            if (!statsA || !statsB) return 0;
            if (statsB.wins !== statsA.wins) {
                return statsB.wins - statsA.wins;
            }
            return statsB.pointDifference - statsA.pointDifference;
        });
        if (sortedPlayers.length > 0) groupWinners.push(sortedPlayers[0]);
        if (sortedPlayers.length > 1) groupRunnersUp.push(sortedPlayers[1]);
    });
    
    const shuffledRunnersUp = [...groupRunnersUp].sort(() => Math.random() - 0.5);
    
    const qualifierIds = new Set([...groupWinners, ...groupRunnersUp].map(p => p.id));
    const others: Player[] = players.filter(p => !qualifierIds.has(p.id));

    const numQualifiers = groupWinners.length + groupRunnersUp.length;
    if (numQualifiers >= 2) {
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(numQualifiers)));
        const finalSlots = new Array(bracketSize).fill(null);
        const seedPlacements = getBracketOrder(bracketSize);

        groupWinners.forEach((seed, index) => {
            finalSlots[seedPlacements[index]] = seed;
        });

        let runnerUpIndex = 0;
        for (let i = 0; i < bracketSize; i++) {
            if (finalSlots[i] === null && runnerUpIndex < shuffledRunnersUp.length) {
                finalSlots[i] = shuffledRunnersUp[runnerUpIndex];
                runnerUpIndex++;
            }
        }
        
        for (let i = 0; i < bracketSize; i++) {
            if (finalSlots[i] === null) {
                finalSlots[i] = { id: -1, name: 'BYE' };
            }
        }

        const mainBracketMatches = generateMatchesFromList(finalSlots);
        setKnockoutMatches(advanceWinners(mainBracketMatches, (winner) => setMainWinner(winner)));
    } else {
        setKnockoutMatches([]);
    }
    
    if (others.length >= 2) {
        const consolationBracketMatches = createBracket(others, true);
        setConsolationMatches(advanceWinners(consolationBracketMatches));
    }

    setTournamentPhase('knockout');
  }, [groups, groupStandings, players, generateMatchesFromList, createBracket]);

  const handleGroupMatchScoreUpdate = (matchId: string, p1Score: number, p2Score: number) => {
    const oldMatch = groupMatches.find(m => m.id === matchId);
    if (!oldMatch) return;

    const { player1, player2, groupId } = oldMatch;
    const newWinner = p1Score > p2Score ? player1 : player2;

    const updatedMatches = groupMatches.map(m => 
        m.id === matchId ? { ...m, winner: newWinner, player1Score: p1Score, player2Score: p2Score } : m
    );
    setGroupMatches(updatedMatches);
    
    setGroupStandings(prev => {
      const newStandings = JSON.parse(JSON.stringify(prev));
      const groupStd = newStandings[groupId];
      
      if (oldMatch.winner) {
        const oldWinner = oldMatch.player1Score! > oldMatch.player2Score! ? oldMatch.player1 : oldMatch.player2;
        const oldLoser = oldMatch.player1Score! > oldMatch.player2Score! ? oldMatch.player2 : oldMatch.player1;
        
        groupStd[oldWinner.name].wins -= 1;
        groupStd[oldLoser.name].losses -= 1;

        groupStd[player1.name].pointsFor -= oldMatch.player1Score!;
        groupStd[player1.name].pointsAgainst -= oldMatch.player2Score!;
        groupStd[player2.name].pointsFor -= oldMatch.player2Score!;
        groupStd[player2.name].pointsAgainst -= oldMatch.player1Score!;
      } else {
        groupStd[player1.name].gamesPlayed += 1;
        groupStd[player2.name].gamesPlayed += 1;
      }
      
      const newLoser = newWinner.id === player1.id ? player2 : player1;
      groupStd[newWinner.name].wins += 1;
      groupStd[newLoser.name].losses += 1;

      groupStd[player1.name].pointsFor += p1Score;
      groupStd[player1.name].pointsAgainst += p2Score;
      groupStd[player2.name].pointsFor += p2Score;
      groupStd[player2.name].pointsAgainst += p1Score;
      
      groupStd[player1.name].pointDifference = groupStd[player1.name].pointsFor - groupStd[player1.name].pointsAgainst;
      groupStd[player2.name].pointDifference = groupStd[player2.name].pointsFor - groupStd[player2.name].pointsAgainst;

      return newStandings;
    });
  };

  React.useEffect(() => {
    if (
        tournamentType === TournamentType.GROUP_KNOCKOUT &&
        tournamentPhase === 'groups' &&
        groupMatches.length > 0 &&
        groupMatches.every(m => m.winner)
    ) {
        generateKnockoutStages();
    }
  }, [groupMatches, tournamentType, tournamentPhase, generateKnockoutStages]);
  
  const handleKnockoutWinner = (matchId: string, winner: Player) => {
    const newMatches = knockoutMatches.map(m => m.id === matchId ? { ...m, winner } : m);
    setKnockoutMatches(advanceWinners(newMatches, (finalWinner) => {
        setWinner(finalWinner);
        setAppState(AppState.FINISHED);
    }));
  };

  const handleConsolationWinner = (matchId: string, winner: Player) => {
    const newMatches = consolationMatches.map(m => m.id === matchId ? { ...m, winner } : m);
    setConsolationMatches(advanceWinners(newMatches));
  };

  const resetTournament = () => {
    setAppState(AppState.SETUP);
    setPlayers([]);
    setTournamentType(null);
    setWinner(null);
    setMatches([]);
    setRoundRobinMatches([]);
    setStandings({});
    setGroups([]);
    setGroupMatches([]);
    setGroupStandings({});
    setKnockoutMatches([]);
    setConsolationMatches([]);
    setTournamentPhase('groups');
    setMainWinner(null);
    setIsSeedingEnabled(false);
  };
  
  const backToSetup = () => {
    setAppState(AppState.SETUP);
    setTournamentType(null);
    setWinner(null);
    setMatches([]);
    setRoundRobinMatches([]);
    setStandings({});
    setGroups([]);
    setGroupMatches([]);
    setGroupStandings({});
    setKnockoutMatches([]);
    setConsolationMatches([]);
    setTournamentPhase('groups');
    setMainWinner(null);
  };


  const renderContent = () => {
    switch (appState) {
      case AppState.SETUP:
        return (
          <>
            <PlayerSetup
              players={players}
              onAddPlayer={handleAddPlayer}
              onRemovePlayer={handleRemovePlayer}
              onQuickAdd={handleQuickAddPlayers}
              isSeedingEnabled={isSeedingEnabled}
              onToggleSeeding={setIsSeedingEnabled}
              onToggleSeed={handleToggleSeed}
            />
            {players.length >= 2 && (
              <TournamentSelector onSelect={handleStartTournament} />
            )}
          </>
        );
      case AppState.GROUP_CONFIG:
        return (
            <GroupConfig 
                playersCount={players.length}
                onConfirm={handleConfirmGroupSetup}
                onBack={backToSetup}
            />
        );
      case AppState.TOURNAMENT:
        return (
          <div className="w-full">
            <button
                onClick={backToSetup}
                className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-brand-secondary hover:bg-blue-600 text-white font-bold rounded-lg shadow-md transition-transform transform hover:scale-105"
            >
                <ArrowLeftIcon />
                Retour
            </button>
            {tournamentType === TournamentType.SINGLE_ELIMINATION && (
              <SingleEliminationBracket matches={matches} onSelectWinner={handleSelectWinner} />
            )}
            {tournamentType === TournamentType.ROUND_ROBIN && (
              <RoundRobinView matches={roundRobinMatches} standings={standings} onScoreUpdate={handleRoundRobinScoreUpdate} />
            )}
            {tournamentType === TournamentType.GROUP_KNOCKOUT && (
                <GroupKnockoutView
                    groups={groups}
                    groupMatches={groupMatches}
                    groupStandings={groupStandings}
                    knockoutMatches={knockoutMatches}
                    consolationMatches={consolationMatches}
                    tournamentPhase={tournamentPhase}
                    onGroupScoreUpdate={handleGroupMatchScoreUpdate}
                    onKnockoutWinner={handleKnockoutWinner}
                    onConsolationWinner={handleConsolationWinner}
                />
            )}
          </div>
        );
      case AppState.FINISHED:
        const finalStandings = tournamentType === TournamentType.ROUND_ROBIN 
            ? Object.entries(standings)
                .map(([name, stats]) => ({ name, ...stats }))
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (b.pointDifference !== a.pointDifference) return b.pointDifference - a.pointDifference;
                    return b.pointsFor - a.pointsFor;
                })
            : [];

        return (
          <div className="text-center animate-fade-in w-full max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Le tournoi est terminé !</h2>
            
            {tournamentType === TournamentType.ROUND_ROBIN && finalStandings.length > 0 ? (
                <Card className="w-full">
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <TrophyIcon className="w-16 h-16 text-brand-accent" />
                        <div>
                             <h3 className="text-3xl font-extrabold text-white">Classement Final</h3>
                             <p className="text-lg text-slate-400">Vainqueur : <span className="text-brand-accent font-bold">{finalStandings[0].name}</span></p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-max">
                            <thead>
                                <tr className="border-b border-slate-600 text-sm">
                                    <th className="p-2">#</th>
                                    <th className="p-2">Joueur</th>
                                    <th className="p-2 text-center">V</th>
                                    <th className="p-2 text-center">D</th>
                                    <th className="p-2 text-center">Pour</th>
                                    <th className="p-2 text-center">Contre</th>
                                    <th className="p-2 text-center">Diff.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {finalStandings.map((s, index) => (
                                    <tr key={s.name} className={`border-b border-slate-700 ${index === 0 ? 'text-brand-accent font-bold' : ''}`}>
                                        <td className="p-2">{index + 1}</td>
                                        <td className="p-2 truncate">{s.name}</td>
                                        <td className="p-2 text-center text-green-400">{s.wins}</td>
                                        <td className="p-2 text-center text-red-400">{s.losses}</td>
                                        <td className="p-2 text-center">{s.pointsFor}</td>
                                        <td className="p-2 text-center">{s.pointsAgainst}</td>
                                        <td className="p-2 text-center">{s.pointDifference > 0 ? `+${s.pointDifference}` : s.pointDifference}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <div className="bg-slate-800 p-8 rounded-xl shadow-2xl inline-block border border-brand-accent">
                    <TrophyIcon className="w-24 h-24 mx-auto text-brand-accent" />
                    <h3 className="text-4xl font-extrabold text-white mt-4">Vainqueur</h3>
                    <p className="text-5xl font-black text-brand-accent mt-2 animate-pulse">{winner?.name}</p>
                </div>
            )}

            <button
              onClick={resetTournament}
              className="mt-8 px-8 py-3 bg-brand-primary hover:bg-brand-dark text-white font-bold text-lg rounded-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Créer un nouveau tournoi
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-8 flex flex-col items-center relative">
        <header className="w-full max-w-6xl text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-secondary to-brand-accent">
              Générateur de Tournoi
            </h1>
            <p className="text-slate-400 mt-2">Créez et gérez vos propres compétitions sportives facilement.</p>
        </header>
        <main className="w-full max-w-7xl flex-grow flex flex-col items-center justify-center">
            {renderContent()}
        </main>
    </div>
  );
};

export default App;