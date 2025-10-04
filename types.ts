export interface Player {
  id: number;
  name: string;
  isSeeded?: boolean;
}

export interface Match {
  id: string;
  round: number;
  matchNumber: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
  nextMatchId: string | null;
}

export interface RoundRobinMatch {
    id: string;
    player1: Player;
    player2: Player;
    winner: Player | null;
    round: number;
    player1Score: number | null;
    player2Score: number | null;
}

export interface Standing {
    wins: number;
    losses: number;
    gamesPlayed: number;
    pointsFor: number;
    pointsAgainst: number;
    pointDifference: number;
}

export interface Standings {
    [playerName: string]: Standing;
}

export interface Group {
  id: string;
  name: string;
  players: Player[];
}

export interface GroupMatch {
  id: string;
  groupId: string;
  player1: Player;
  player2: Player;
  player1Score: number | null;
  player2Score: number | null;
  winner: Player | null;
  round: number;
}

export interface GroupStandings {
  [groupId: string]: Standings;
}

export enum AppState {
  SETUP = 'SETUP',
  GROUP_CONFIG = 'GROUP_CONFIG',
  TOURNAMENT = 'TOURNAMENT',
  FINISHED = 'FINISHED',
}

export enum TournamentType {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  GROUP_KNOCKOUT = 'GROUP_KNOCKOUT',
}