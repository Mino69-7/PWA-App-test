// Dessins partagés (SVG) : animaux, maisons, train, aliments, buissons.
// Formes rondes, aplats pastel, aucun contour noir.

const EYE = '#7D6B61';
const NOSE = '#8F7B70';

// Couleurs « vêtements / maisons / wagons » : assez distinctes, mais douces.
export const CLOTH = {
  rouge: { fill: '#E39189', dark: '#D27A72' },
  jaune: { fill: '#F0D67E', dark: '#E0C163' },
  bleu: { fill: '#9EC3DA', dark: '#83AFCB' },
  vert: { fill: '#A6CC9C', dark: '#8CBA81' },
  violet: { fill: '#C3B1DE', dark: '#AC98CF' },
  orange: { fill: '#F2BD8E', dark: '#E5A571' },
};
export const CLOTH_IDS = Object.keys(CLOTH);

const svg = (body, vb = '0 0 100 100') => `<svg viewBox="${vb}">${body}</svg>`;

// Contenu d'un SVG sans sa balise <svg>, pour le combiner dans une icône.
export const inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const eyes = (y, dx = 13, r = 4.5) => `<circle cx="${50 - dx}" cy="${y}" r="${r}" fill="${EYE}"/><circle cx="${50 + dx}" cy="${y}" r="${r}" fill="${EYE}"/>`;
const tri = (d, c, w = 8) => `<path d="${d}" fill="${c}" stroke="${c}" stroke-width="${w}" stroke-linejoin="round"/>`;
const cheeks = (y, dx = 21, c = '#F2C6C2') => `<ellipse cx="${50 - dx}" cy="${y}" rx="6" ry="4" fill="${c}"/><ellipse cx="${50 + dx}" cy="${y}" rx="6" ry="4" fill="${c}"/>`;

// Foulard noué sous le menton, dans la couleur demandée.
function scarf(color) {
  if (!color) return '';
  const c = CLOTH[color];
  return `<path d="M24 79 Q50 95 76 79 L79 88 Q50 104 21 88 Z" fill="${c.fill}"/>${tri('M54 92 L66 105 L52 104 Z', c.dark, 5)}`;
}

const FACES = {
  chat: () => `${tri('M17 44 L21 12 L45 28 Z', '#EFC6A2')}${tri('M83 44 L79 12 L55 28 Z', '#EFC6A2')}${tri('M24 30 L26 19 L35 26 Z', '#F2C6C2', 4)}${tri('M76 30 L74 19 L65 26 Z', '#F2C6C2', 4)}<circle cx="50" cy="54" r="35" fill="#F6D5B8"/>${eyes(50)}${tri('M46 60 H54 L50 65 Z', '#E3A39D', 3)}${cheeks(63)}`,
  chien: () => `<circle cx="50" cy="50" r="34" fill="#EBD8BC"/><ellipse cx="19" cy="48" rx="11" ry="22" fill="#CDB394" transform="rotate(18 19 48)"/><ellipse cx="81" cy="48" rx="11" ry="22" fill="#CDB394" transform="rotate(-18 81 48)"/><ellipse cx="50" cy="65" rx="17" ry="13" fill="#F6EBDA"/>${eyes(45, 12)}<ellipse cx="50" cy="60" rx="6.5" ry="4.5" fill="${NOSE}"/>`,
  vache: () => `<path d="M31 20 Q26 8 34 5" stroke="#F0DC8E" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M69 20 Q74 8 66 5" stroke="#F0DC8E" stroke-width="6" stroke-linecap="round" fill="none"/><ellipse cx="14" cy="36" rx="12" ry="6" fill="#D9CEE5" transform="rotate(-20 14 36)"/><ellipse cx="86" cy="36" rx="12" ry="6" fill="#D9CEE5" transform="rotate(20 86 36)"/><ellipse cx="50" cy="46" rx="32" ry="33" fill="#E7E1EE"/><circle cx="35" cy="29" r="9" fill="#CFC3E0"/><circle cx="67" cy="38" r="6" fill="#CFC3E0"/><ellipse cx="50" cy="68" rx="23" ry="14" fill="#F2C6C2"/><ellipse cx="42" cy="68" rx="3" ry="4" fill="#D79B95"/><ellipse cx="58" cy="68" rx="3" ry="4" fill="#D79B95"/>${eyes(46, 12)}`,
  canard: () => `<path d="M50 14 q-3 -11 7 -11" stroke="#F0DC8E" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="48" r="34" fill="#F5E6A8"/><ellipse cx="50" cy="65" rx="20" ry="9" fill="#F3BE94"/><ellipse cx="50" cy="60" rx="18" ry="6" fill="#F6CBA6"/>${eyes(43)}${cheeks(56, 23)}`,
  mouton: () => `<g fill="#E3DCEB"><circle cx="50" cy="19" r="14"/><circle cx="30" cy="26" r="13"/><circle cx="70" cy="26" r="13"/><circle cx="21" cy="44" r="12"/><circle cx="79" cy="44" r="12"/><circle cx="25" cy="62" r="12"/><circle cx="75" cy="62" r="12"/><circle cx="50" cy="48" r="30"/></g><ellipse cx="29" cy="44" rx="10" ry="5" fill="#CBB8A8" transform="rotate(-25 29 44)"/><ellipse cx="71" cy="44" rx="10" ry="5" fill="#CBB8A8" transform="rotate(25 71 44)"/><ellipse cx="50" cy="53" rx="18" ry="22" fill="#D9C6B6"/>${eyes(49, 7, 3.8)}<ellipse cx="50" cy="64" rx="5" ry="3" fill="#B89F8E"/>`,
  cochon: () => `${tri('M22 32 L20 10 L40 20 Z', '#EBB0AB')}${tri('M78 32 L80 10 L60 20 Z', '#EBB0AB')}<circle cx="50" cy="50" r="35" fill="#F2C6C2"/><ellipse cx="50" cy="61" rx="15" ry="11" fill="#E9AEA9"/><ellipse cx="45" cy="61" rx="3" ry="4.5" fill="#C98F8A"/><ellipse cx="55" cy="61" rx="3" ry="4.5" fill="#C98F8A"/>${eyes(43)}`,
  lapin: () => `<ellipse cx="36" cy="20" rx="9" ry="22" fill="#E6DCEC"/><ellipse cx="64" cy="20" rx="9" ry="22" fill="#E6DCEC"/><ellipse cx="36" cy="22" rx="4.5" ry="15" fill="#F2C6C2"/><ellipse cx="64" cy="22" rx="4.5" ry="15" fill="#F2C6C2"/><circle cx="50" cy="56" r="31" fill="#ECE4F0"/>${eyes(52, 12)}${tri('M46 61 H54 L50 65 Z', '#E3A39D', 3)}${cheeks(65, 19)}`,
  ours: () => `<circle cx="24" cy="25" r="13" fill="#CDB08F"/><circle cx="76" cy="25" r="13" fill="#CDB08F"/><circle cx="24" cy="25" r="6.5" fill="#E3CCB0"/><circle cx="76" cy="25" r="6.5" fill="#E3CCB0"/><circle cx="50" cy="52" r="34" fill="#D9BC9C"/><ellipse cx="50" cy="64" rx="16" ry="12" fill="#EBDCC6"/>${eyes(47, 13)}<ellipse cx="50" cy="59" rx="6" ry="4.5" fill="${NOSE}"/>`,
  souris: () => `<circle cx="20" cy="30" r="18" fill="#D8D0DA"/><circle cx="80" cy="30" r="18" fill="#D8D0DA"/><circle cx="20" cy="30" r="10" fill="#F2C6C2"/><circle cx="80" cy="30" r="10" fill="#F2C6C2"/><circle cx="50" cy="55" r="30" fill="#E2DCE5"/>${eyes(51, 11, 4)}<circle cx="50" cy="63" r="4.5" fill="#E3A39D"/>${cheeks(64, 18)}`,
  poussin: () => `<path d="M46 20 q0 -12 8 -14 M52 20 q4 -10 12 -8" stroke="#F0D67E" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="52" r="33" fill="#F7E7A1"/>${eyes(47, 11)}${tri('M44 56 L56 56 L50 64 Z', '#F3BE94', 5)}${cheeks(60, 21)}`,
  renard: () => `${tri('M18 40 L20 8 L44 26 Z', '#EBA978')}${tri('M82 40 L80 8 L56 26 Z', '#EBA978')}${tri('M25 28 L26 17 L35 24 Z', '#FAF1E4', 4)}${tri('M75 28 L74 17 L65 24 Z', '#FAF1E4', 4)}<circle cx="50" cy="52" r="33" fill="#F2BD8E"/><path d="M18 56 Q34 58 50 80 Q66 58 82 56 Q80 82 50 86 Q20 82 18 56 Z" fill="#FAF1E4"/>${eyes(48, 12)}<ellipse cx="50" cy="66" rx="5.5" ry="4" fill="${NOSE}"/>`,
  grenouille: () => `<circle cx="30" cy="32" r="15" fill="#B9D7A8"/><circle cx="70" cy="32" r="15" fill="#B9D7A8"/><ellipse cx="50" cy="58" rx="38" ry="28" fill="#B9D7A8"/><circle cx="30" cy="31" r="9" fill="#FAF6EC"/><circle cx="70" cy="31" r="9" fill="#FAF6EC"/><circle cx="31" cy="32" r="4.5" fill="${EYE}"/><circle cx="69" cy="32" r="4.5" fill="${EYE}"/><path d="M36 64 Q50 74 64 64" stroke="#7FA873" stroke-width="3.5" fill="none" stroke-linecap="round"/>${cheeks(62, 26)}`,
  elephant: () => `<ellipse cx="18" cy="46" rx="17" ry="24" fill="#CFC8DE"/><ellipse cx="82" cy="46" rx="17" ry="24" fill="#CFC8DE"/><circle cx="50" cy="46" r="30" fill="#DCD5E8"/><path d="M50 58 Q50 76 40 82" stroke="#DCD5E8" stroke-width="13" fill="none" stroke-linecap="round"/>${eyes(42, 12)}${cheeks(55, 20)}`,
  lion: () => `<g fill="#E9BF7F"><circle cx="50" cy="16" r="13"/><circle cx="27" cy="23" r="13"/><circle cx="73" cy="23" r="13"/><circle cx="17" cy="44" r="13"/><circle cx="83" cy="44" r="13"/><circle cx="22" cy="66" r="13"/><circle cx="78" cy="66" r="13"/><circle cx="50" cy="48" r="34"/></g><circle cx="50" cy="50" r="26" fill="#F5DDA8"/><ellipse cx="50" cy="61" rx="12" ry="9" fill="#FAEBCB"/>${eyes(46, 10, 4)}${tri('M46 56 H54 L50 60 Z', NOSE, 3)}`,
  hibou: () => `${tri('M20 26 L24 6 L38 20 Z', '#C8B097')}${tri('M80 26 L76 6 L62 20 Z', '#C8B097')}<ellipse cx="50" cy="52" rx="35" ry="36" fill="#D7C2AC"/><circle cx="35" cy="45" r="14" fill="#F6EEDF"/><circle cx="65" cy="45" r="14" fill="#F6EEDF"/><circle cx="35" cy="46" r="6" fill="${EYE}"/><circle cx="65" cy="46" r="6" fill="${EYE}"/>${tri('M45 58 L55 58 L50 66 Z', '#F0C98C', 4)}`,
  panda: () => `<circle cx="22" cy="24" r="12" fill="#9C8F8A"/><circle cx="78" cy="24" r="12" fill="#9C8F8A"/><circle cx="50" cy="52" r="34" fill="#EEE8E8"/><ellipse cx="36" cy="48" rx="9" ry="11" fill="#9C8F8A" transform="rotate(20 36 48)"/><ellipse cx="64" cy="48" rx="9" ry="11" fill="#9C8F8A" transform="rotate(-20 64 48)"/><circle cx="37" cy="48" r="3.5" fill="#FAF6EC"/><circle cx="63" cy="48" r="3.5" fill="#FAF6EC"/><ellipse cx="50" cy="62" rx="6" ry="4.5" fill="${NOSE}"/>${cheeks(66, 22)}`,
};

export const ANIMAL_IDS = Object.keys(FACES);

// Tête d'animal, avec un foulard de couleur si demandé.
export function face(id, cloth = null) {
  return svg(FACES[id]() + scarf(cloth));
}

// Maison : toit et porte de la couleur donnée.
export function house(color) {
  const c = CLOTH[color];
  return svg(`${tri('M50 8 L92 44 L8 44 Z', c.fill, 10)}<rect x="16" y="42" width="68" height="52" rx="8" fill="#EADCC8"/><path d="M40 94 V72 Q40 62 50 62 Q60 62 60 72 V94 Z" fill="${c.dark}"/><circle cx="31" cy="60" r="7" fill="${c.fill}"/><circle cx="69" cy="60" r="7" fill="${c.fill}"/>`);
}

// Wagon : caisse colorée (ou neutre) et deux roues.
export function wagon(color) {
  const c = color ? CLOTH[color].fill : '#E2D5C3';
  return svg(`<rect x="4" y="22" width="92" height="44" rx="12" fill="${c}"/><rect x="0" y="16" width="100" height="12" rx="6" fill="${c}" opacity=".75"/><circle cx="26" cy="72" r="11" fill="#B9A88F"/><circle cx="74" cy="72" r="11" fill="#B9A88F"/><circle cx="26" cy="72" r="4" fill="#E2D5C3"/><circle cx="74" cy="72" r="4" fill="#E2D5C3"/>`, '0 0 100 84');
}

export function locomotive() {
  return svg(`<rect x="8" y="10" width="34" height="34" rx="8" fill="#CDBFAE"/><rect x="14" y="16" width="22" height="16" rx="5" fill="#F6EEDF"/><rect x="8" y="34" width="106" height="34" rx="14" fill="#D9C6AE"/><rect x="82" y="12" width="14" height="24" rx="5" fill="#CDBFAE"/><circle cx="104" cy="51" r="6" fill="#F5E6A8"/><circle cx="30" cy="74" r="12" fill="#B9A88F"/><circle cx="80" cy="74" r="12" fill="#B9A88F"/><circle cx="30" cy="74" r="4.5" fill="#E2D5C3"/><circle cx="80" cy="74" r="4.5" fill="#E2D5C3"/>`, '0 0 120 88');
}

const FOODS = {
  carotte: () => `<path d="M50 30 Q64 30 62 46 L52 92 Q50 98 48 92 L38 46 Q36 30 50 30 Z" fill="#F2B27E"/><path d="M50 32 Q40 14 30 12 M50 32 Q50 12 50 6 M50 32 Q60 14 70 12" stroke="#A6CC9C" stroke-width="7" fill="none" stroke-linecap="round"/>`,
  os: () => `<rect x="24" y="42" width="52" height="16" rx="8" fill="#E3CFB2"/><circle cx="22" cy="40" r="11" fill="#E3CFB2"/><circle cx="22" cy="60" r="11" fill="#E3CFB2"/><circle cx="78" cy="40" r="11" fill="#E3CFB2"/><circle cx="78" cy="60" r="11" fill="#E3CFB2"/>`,
  poisson: () => `${tri('M70 50 L94 32 L94 68 Z', '#8DB5CD', 8)}<ellipse cx="46" cy="50" rx="32" ry="22" fill="#A7C9DE"/><circle cx="30" cy="45" r="4" fill="${EYE}"/>`,
  fromage: () => `${tri('M10 76 L90 76 L90 40 L22 40 Z', '#F0D67E', 8)}${tri('M22 40 L90 40 L70 22 Z', '#F5E6A8', 6)}<circle cx="40" cy="58" r="6" fill="#E0C163"/><circle cx="66" cy="62" r="8" fill="#E0C163"/><circle cx="78" cy="50" r="4" fill="#E0C163"/>`,
  miel: () => `<rect x="22" y="34" width="56" height="56" rx="18" fill="#F0C98C"/><rect x="18" y="26" width="64" height="14" rx="7" fill="#E0B373"/><path d="M28 40 Q34 54 40 40" fill="#E8B26A"/><ellipse cx="50" cy="64" rx="16" ry="10" fill="#F7DDA9"/>`,
  herbe: () => `<path d="M20 86 Q22 50 12 28 Q34 50 34 86 Z M38 86 Q40 40 32 12 Q56 44 52 86 Z M56 86 Q60 46 66 18 Q76 52 70 86 Z M72 86 Q76 60 90 40 Q90 66 86 86 Z" fill="#A6CC9C"/><rect x="12" y="80" width="80" height="12" rx="6" fill="#8CBA81"/>`,
  mais: () => `<ellipse cx="50" cy="48" rx="18" ry="34" fill="#F0D67E"/><g fill="#E0C163"><circle cx="43" cy="30" r="3.5"/><circle cx="57" cy="30" r="3.5"/><circle cx="43" cy="44" r="3.5"/><circle cx="57" cy="44" r="3.5"/><circle cx="43" cy="58" r="3.5"/><circle cx="57" cy="58" r="3.5"/></g><path d="M50 92 Q26 80 24 52 Q38 66 50 70 Z M50 92 Q74 80 76 52 Q62 66 50 70 Z" fill="#A6CC9C"/>`,
  bambou: () => `<rect x="30" y="8" width="16" height="86" rx="8" fill="#A6CC9C"/><rect x="54" y="18" width="16" height="76" rx="8" fill="#B9D7A8"/><rect x="28" y="36" width="20" height="5" rx="2.5" fill="#8CBA81"/><rect x="28" y="64" width="20" height="5" rx="2.5" fill="#8CBA81"/><rect x="52" y="48" width="20" height="5" rx="2.5" fill="#8CBA81"/><path d="M70 30 Q86 18 92 24 Q84 34 70 34 Z" fill="#8CBA81"/>`,
};

// Qui mange quoi.
export const DIET = {
  lapin: 'carotte',
  chien: 'os',
  chat: 'poisson',
  souris: 'fromage',
  ours: 'miel',
  vache: 'herbe',
  poussin: 'mais',
  panda: 'bambou',
};

export function food(id) {
  return svg(FOODS[id]());
}

// Buisson rond, ou boîte cadeau (aux niveaux plus avancés).
export function bush(variant = 0) {
  const greens = [['#B9D7A8', '#A6CC9C'], ['#C5DDBF', '#ADD0A4'], ['#A9CFA0', '#96C08C'], ['#BCD8B2', '#A2C898']];
  const [a, b] = greens[variant % greens.length];
  return svg(`<g fill="${b}"><circle cx="26" cy="62" r="22"/><circle cx="74" cy="62" r="22"/></g><g fill="${a}"><circle cx="50" cy="44" r="30"/><circle cx="28" cy="70" r="20"/><circle cx="72" cy="70" r="20"/><rect x="18" y="62" width="64" height="30" rx="14"/></g><circle cx="40" cy="38" r="5" fill="#D6E8CD"/>`);
}

export function box(color) {
  const c = CLOTH[color];
  return svg(`<rect x="10" y="30" width="80" height="62" rx="10" fill="${c.fill}"/><rect x="4" y="22" width="92" height="18" rx="8" fill="${c.dark}"/><rect x="44" y="22" width="12" height="70" fill="#F6EEDF" opacity=".8"/>`);
}
