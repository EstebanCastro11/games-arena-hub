export interface Team {
  id: number;
  name: string;
  number: number;
  captain: string;
  membersCount: number;
  color: string;
  faculty: string;
  status: 'active' | 'disqualified' | 'eliminated' | 'finished';
  totalPoints: number;
  bettingBalance: number;
  wins: number;
  losses: number;
  draws: number;
  matchesPlayed: number;
}

export interface Competition {
  id: number;
  title: string;
  day: 1 | 2 | 'extra';
  type: 'normal' | 'macro' | 'extra';
  location: string;
  description: string;
  active: boolean;
  order: number;
}

export interface MatchResult {
  id: number;
  competitionId: number;
  teamAId: number;
  teamBId: number;
  result: 'teamA' | 'teamB' | 'draw';
  teamAPoints: number;
  teamBPoints: number;
  penalties: number;
  bonus: number;
  notes: string;
  timestamp: string;
  adminName: string;
}

export interface Bet {
  id: number;
  teamId: number;
  matchId: number;
  amount: number;
  predictedOutcome: 'teamA' | 'teamB' | 'draw';
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  payout: number;
}

export interface Announcement {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'urgent';
  timestamp: string;
  active: boolean;
}

const teamNames = [
  "Dragones", "Fénix", "Titanes", "Relámpagos", "Leones",
  "Águilas", "Lobos", "Panteras", "Halcones", "Vikingos",
  "Gladiadores", "Centuriones", "Espartanos", "Valquirias", "Berserkers",
  "Samurais", "Ninjas", "Ronin", "Corsarios", "Piratas",
  "Templarios", "Cruzados", "Inmortales", "Colosos", "Minotauros",
  "Grifo", "Quimera", "Hidra", "Kraken", "Cerbero"
];

const faculties = [
  "Ingeniería", "Administración", "Ciencias", "Derecho", "Humanidades",
  "Economía", "Comunicación", "Diseño", "Música", "Arquitectura"
];

const teamColors = [
  "#e63946", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261",
  "#264653", "#6a0572", "#1b998b", "#ff6b6b", "#4ecdc4",
  "#45b7d1", "#96ceb4", "#ffeaa7", "#dfe6e9", "#fd79a8",
  "#a29bfe", "#00b894", "#fdcb6e", "#e17055", "#0984e3",
  "#6c5ce7", "#00cec9", "#fab1a0", "#74b9ff", "#55efc4",
  "#ff7675", "#a8e6cf", "#ffd3b6", "#d63031", "#b2bec3"
];

const captainNames = [
  "Santiago Restrepo", "Valentina Gómez", "Mateo López", "Isabella Martínez", "Sebastián Torres",
  "Mariana Rodríguez", "Nicolás Hernández", "Luciana Díaz", "Andrés García", "Camila Sánchez",
  "Daniel Ramírez", "Sofía Castro", "Juan Pablo Morales", "Laura Jiménez", "Alejandro Vargas",
  "María Fernanda Ruiz", "Carlos Mendoza", "Ana María Ortiz", "Felipe Cardona", "Daniela Ríos",
  "Miguel Ángel Peña", "Catalina Suárez", "David Ospina", "Natalia Castaño", "Tomás Giraldo",
  "Juliana Arango", "José Manuel Vélez", "Paula Andrea Mejía", "Esteban Salazar", "Carolina Zapata"
];

export const demoTeams: Team[] = teamNames.map((name, i) => ({
  id: i + 1,
  name,
  number: i + 1,
  captain: captainNames[i],
  membersCount: Math.floor(Math.random() * 5) + 5,
  color: teamColors[i],
  faculty: faculties[i % faculties.length],
  status: 'active' as const,
  totalPoints: Math.floor(Math.random() * 15000) + 2000,
  bettingBalance: Math.floor(Math.random() * 5000) + 1000,
  wins: Math.floor(Math.random() * 10),
  losses: Math.floor(Math.random() * 5),
  draws: Math.floor(Math.random() * 3),
  matchesPlayed: Math.floor(Math.random() * 12) + 3,
}));

// Sort by points for leaderboard
export const leaderboard = [...demoTeams].sort((a, b) => b.totalPoints - a.totalPoints);

export const demoCompetitions: Competition[] = [
  ...Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    title: `Base ${i + 1}`,
    day: 1 as const,
    type: (i === 4 || i === 9 ? 'macro' : 'normal') as 'normal' | 'macro',
    location: `Zona ${String.fromCharCode(65 + (i % 6))}`,
    description: `Competencia ${i + 1} del Día 1`,
    active: i < 8,
    order: i + 1,
  })),
  ...Array.from({ length: 15 }, (_, i) => ({
    id: i + 16,
    title: `Base ${i + 16}`,
    day: 2 as const,
    type: (i === 4 || i === 9 ? 'macro' : 'normal') as 'normal' | 'macro',
    location: `Zona ${String.fromCharCode(65 + (i % 6))}`,
    description: `Competencia ${i + 1} del Día 2`,
    active: false,
    order: i + 1,
  })),
];

export const demoAnnouncements: Announcement[] = [
  { id: 1, message: "🔥 RONDA 3 EN 5 MINUTOS. EQUIPOS, A SUS BASES.", type: "urgent", timestamp: new Date().toISOString(), active: true },
  { id: 2, message: "📢 Equipo 14 debe dirigirse a la Base 7.", type: "info", timestamp: new Date().toISOString(), active: true },
  { id: 3, message: "⚡ Las apuestas para la Ronda 4 cierran en 10 minutos.", type: "warning", timestamp: new Date().toISOString(), active: true },
  { id: 4, message: "🏆 Resultados de la Ronda 2 ya publicados.", type: "info", timestamp: new Date().toISOString(), active: true },
];

// Generate matchups: 1v30, 2v29, etc.
export const demoMatchups = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  teamA: demoTeams[i],
  teamB: demoTeams[29 - i],
  competition: demoCompetitions[i],
  status: i < 5 ? 'completed' : i < 8 ? 'in_progress' : 'pending' as string,
}));
