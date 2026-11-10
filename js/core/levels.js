// Niveaux adaptatifs, sans sauvegarde : gardés en mémoire tant que l'app est ouverte.
// Ça monte toutes les 3 manches réussies, et ça redescend doucement d'un cran
// si l'enfant peine deux manches de suite (beaucoup d'erreurs ou très long).

const PER_LEVEL = 3;
const HARD_MISTAKES = 3;
const HARD_MS = 90000;

const memory = new Map();

// Pour tester un niveau précis : ajouter ?niveau=3 à l'adresse.
const forced = parseInt(new URLSearchParams(location.search).get('niveau'), 10);

export function levelsFor(gameId, max) {
  if (!memory.has(gameId)) {
    const start = Number.isFinite(forced) ? Math.min(max, Math.max(1, forced)) : 1;
    memory.set(gameId, { level: start, wins: 0, hard: 0 });
  }
  const s = memory.get(gameId);
  let mistakes = 0;
  let started = performance.now();

  return {
    get level() { return s.level; },
    max,
    // Une manche commence : on remet les compteurs à zéro.
    begin() {
      mistakes = 0;
      started = performance.now();
    },
    miss() { mistakes++; },
    get mistakes() { return mistakes; },
    // Fin de manche : renvoie +1 si on monte, -1 si on descend, 0 sinon.
    end() {
      const struggled = mistakes >= HARD_MISTAKES || performance.now() - started > HARD_MS;
      if (struggled) {
        s.wins = 0;
        s.hard++;
        if (s.hard >= 2 && s.level > 1) {
          s.level--;
          s.hard = 0;
          return -1;
        }
        return 0;
      }
      s.hard = 0;
      s.wins++;
      if (s.wins >= PER_LEVEL && s.level < max) {
        s.level++;
        s.wins = 0;
        return 1;
      }
      return 0;
    },
  };
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
