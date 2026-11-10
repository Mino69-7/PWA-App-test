// Toutes les phrases dites par la voix, en un seul endroit.
// Chaque clé correspond à un fichier audio/voix/<clé>.mp3 généré par outils/voix (voir README).
// Si un fichier manque, la voix de synthèse de l'appareil lit le texte.

export const ANIMAL_NAMES = {
  chat: 'le chat',
  chien: 'le chien',
  vache: 'la vache',
  canard: 'le canard',
  mouton: 'le mouton',
  cochon: 'le cochon',
  lapin: 'le lapin',
  ours: "l'ours",
  souris: 'la souris',
  poussin: 'le poussin',
  renard: 'le renard',
  grenouille: 'la grenouille',
  elephant: "l'éléphant",
  lion: 'le lion',
  hibou: 'le hibou',
  panda: 'le panda',
};

// Nom, pluriel pour « les bulles … ».
export const COLOR_NAMES = {
  rouge: ['rouge', 'rouges'],
  jaune: ['jaune', 'jaunes'],
  bleu: ['bleu', 'bleues'],
  vert: ['vert', 'vertes'],
  violet: ['violet', 'violettes'],
  orange: ['orange', 'orange'],
  rose: ['rose', 'roses'],
};

export const SHAPE_NAMES = {
  rond: 'Le rond !',
  carre: 'Le carré !',
  triangle: 'Le triangle !',
  etoile: "L'étoile !",
  coeur: 'Le cœur !',
  losange: 'Le losange !',
};

export const FOOD_NAMES = {
  carotte: 'la carotte',
  os: "l'os",
  poisson: 'le poisson',
  fromage: 'le fromage',
  miel: 'le miel',
  herbe: "l'herbe",
  mais: 'le maïs',
  bambou: 'le bambou',
};

export const DRAWING_NAMES = {
  poisson: 'le poisson',
  escargot: "l'escargot",
  coccinelle: 'la coccinelle',
  tortue: 'la tortue',
  oiseau: "l'oiseau",
  papillon: 'le papillon',
  chat: 'le chat',
  elephant: "l'éléphant",
};

export const BUBBLE_ITEMS = {
  etoile: 'Les étoiles !',
  coeur: 'Les cœurs !',
  fleur: 'Les fleurs !',
  poisson: 'Les poissons !',
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const each = (obj, fn) => Object.fromEntries(Object.entries(obj).flatMap(([k, v]) => fn(k, v)));

export const PHRASES = {
  'bravo-1': 'Bravo !',
  'bravo-2': 'Super !',
  'bravo-3': 'Bien joué !',
  'bravo-4': 'Youpi !',
  'bravo-5': "Oh, c'est très bien !",
  niveau: 'Tu es trop forte !',
  pause: 'On fait une petite pause. À bientôt !',

  ...each(COLOR_NAMES, (k, [name, plural]) => [
    [`couleur-${k}`, `${cap(name)} !`],
    [`bulles-${k}`, `Les bulles ${plural} !`],
  ]),
  ...each(BUBBLE_ITEMS, (k, text) => [[`bulles-${k}`, text]]),
  ...each(SHAPE_NAMES, (k, text) => [[`forme-${k}`, text]]),

  // Train des animaux
  ...each(ANIMAL_NAMES, (k, name) => [
    [`nom-${k}`, `${cap(name)}…`],
    [`ou-est-${k}`, `Où est ${name} ?`],
  ]),
  ...each(COLOR_NAMES, (k, [name]) => [
    [`maison-${k}`, `dans la maison ${name} !`],
    [`wagon-${k}`, `dans le wagon ${name} !`],
  ]),
  'train-arrive': 'Tchou tchou ! Voilà le train !',
  'train-vide': 'Le train vient chercher les animaux !',
  'train-part': 'Au revoir ! Tchou tchou !',

  // Coucou caché
  coucou: 'Coucou !',

  // À table !
  'a-table': 'À table !',
  miam: 'Miam miam !',
  'miam-2': "Hmm, que c'est bon !",
  ...each(FOOD_NAMES, (k, name) => [[`qui-mange-${k}`, `Qui mange ${name} ?`]]),

  // Petit orchestre
  ecoute: 'Écoute bien…',
  'a-toi': 'À toi !',
  musique: 'Quelle jolie musique !',

  // Coloriage
  ...each(DRAWING_NAMES, (k, name) => [[`coloriage-${k}`, `On colorie ${name} !`]]),
  joli: "Oh, comme c'est joli !",
};

export const BRAVO = ['bravo-1', 'bravo-2', 'bravo-3', 'bravo-4', 'bravo-5'];
