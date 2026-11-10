# Coucou : petits jeux calmes pour tout-petits

Application web installable (PWA) pour un enfant de 1 à 3 ans : 100 % gratuite, sans publicité, sans compte, sans connexion réseau pendant le jeu, sans aucun suivi.

> « Coucou » est un nom provisoire, facile à changer (voir plus bas).

## Les 8 mini-jeux

| Jeu | Comment on joue | Ce qui évolue avec les niveaux |
|---|---|---|
| **Le train des animaux** | Le train arrive avec 3 animaux qui portent un foulard de couleur : on glisse chacun dans la maison de la même couleur. Une manche sur deux, le train revient vide chercher les animaux devant leurs maisons. 16 animaux différents. | Aide au tap → plus d'aide → une 4ᵉ maison « piège » → wagons sans couleur (seul le foulard compte) |
| **Bulles magiques** | Chaque bulle contient une surprise (étoile, cœur, fleur, poisson) qui tombe au sol quand la bulle éclate. 6 surprises = une manche. | Toutes les bulles → « les bulles bleues ! » → « les étoiles ! » → les deux en alternance, un peu plus vite |
| **Formes dans leur trou** | Glisser chaque forme vers sa silhouette. | 3 formes avec aide → sans aide → 4 formes (étoile, cœur, losange) → toutes de la même couleur |
| **Trier les couleurs** | Poser chaque balle dans le panier de sa couleur. | 2 paniers → plus de balles → 3 paniers → 5 balles |
| **Coloriage** | Choisir un pot de couleur, puis toucher ou frotter une partie de l'animal : elle se colorie entièrement. Quand tout est colorié, l'animal fait la fête. | Dessins de 3 parties → 4 parties → 5 parties |
| **Coucou caché** | Un animal se cache derrière un buisson : on touche le bon buisson pour le retrouver (« Coucou ! »). | 2 buissons, oreilles visibles → 3 buissons → plus d'oreilles → les buissons se déplacent après la cachette |
| **À table !** | Donner à chaque animal ce qu'il mange (la carotte au lapin, l'os au chien…). | 2 animaux avec aide → sans aide → 3 animaux → un aliment en trop → 4 animaux |
| **Petit orchestre** | Un xylophone : on joue librement, puis « Écoute bien… À toi ! » : retrouver la lame qui a chanté. | Jeu libre → 1 note → 2 notes → 3 notes → 4 notes |

Aucun échec possible : un tap n'importe où donne toujours une réaction douce, et un objet lâché au mauvais endroit revient doucement à sa place, sans bruit négatif. La voix aide alors gentiment (« Rouge ! », « Qui mange la carotte ? »).

### Les niveaux (sans sauvegarde)

Chaque jeu commence au niveau 1 à l'ouverture de l'app. La difficulté **monte toutes les 3 manches réussies** (petite fanfare et « Tu es trop forte ! »). Si l'enfant peine deux manches de suite (3 erreurs ou plus, ou plus d'1 min 30), on **redescend discrètement d'un cran**. Les niveaux sont gardés tant que l'app reste ouverte, puis tout repart à zéro : rien n'est enregistré.

La difficulté monte par la réflexion (plus de choix, moins d'indices), jamais par le geste : les objets restent aussi grands et aussi tolérants.

- Pour essayer directement un niveau : ajoutez `?niveau=3` à la fin de l'adresse.

## Pour l'adulte

- **Revenir au menu** : pendant un jeu, rien n'est affiché. Gardez le doigt appuyé **2 secondes dans le coin en haut à gauche**. Un anneau discret se remplit, puis une petite maison apparaît pendant 5 secondes : touchez-la.
- **Pause douce** : au bout de **15 minutes** de jeu, l'écran passe en fondu vers une lune qui dort, et une voix dit au revoir. Un simple tap ne fait rien. Gardez le doigt appuyé **2 secondes n'importe où** : deux boutons apparaissent, ▶ pour reprendre et 🏠 pour revenir au menu.
  - Pour tester la pause sans attendre : ajoutez `?minutes=0.5` à la fin de l'adresse (pause au bout de 30 secondes).
- **Le son** : iOS n'autorise le son qu'après un premier toucher. Le premier tap sur l'accueil le débloque. Si l'iPhone est en mode silencieux (bouton latéral), les sons du jeu peuvent être coupés.

## Bloquer les sorties accidentelles : l'Accès guidé

Une page web ne peut pas bloquer les gestes d'iOS (balayer depuis le bas, centre de contrôle…). C'est l'**Accès guidé** d'Apple qui s'en charge :

1. **Réglages → Accessibilité → Accès guidé** : activez-le.
2. Dans **Réglages du code**, choisissez un code (différent de celui du téléphone, c'est plus sûr).
3. Activez **Raccourci d'accessibilité → Accès guidé**.
4. Ouvrez Coucou, puis **appuyez trois fois sur le bouton latéral** (ou le bouton principal sur les anciens modèles) → **Démarrer**.
5. Pour sortir : **triple-clic** à nouveau, puis entrez votre code → **Fin**.

Dans les options de l'Accès guidé, vous pouvez aussi désactiver les **boutons de volume** et fixer une **limite de temps**.

## Mettre le jeu en ligne gratuitement (GitHub Pages)

1. Créez un compte gratuit sur <https://github.com> (si vous n'en avez pas).
2. En haut à droite : **+ → New repository**. Nom : par exemple `coucou`. Cochez **Public** (obligatoire pour Pages gratuit), puis **Create repository**.
3. Envoyez les fichiers avec Git depuis le dossier du projet (`git push`). Sans Git, sur la page du dépôt, **Add file → Upload files** : glissez le **contenu** du dossier (pas le dossier lui-même), **sans** `node_modules`, `test-results` ni `playwright-report`.
4. Allez dans **Settings → Pages**. Sous *Build and deployment*, choisissez **Source : Deploy from a branch**, puis **Branch : main** et **/ (root)** → **Save**.
5. Après 1 à 2 minutes, l'adresse apparaît en haut de cette page, du type `https://VOTRE-NOM.github.io/coucou/`.

> Le dépôt public est visible par tous, mais il ne contient rien de personnel. Évitez simplement d'y mettre des enregistrements de voix privés si cela vous gêne.

## Installer sur l'iPhone / l'iPad

1. Ouvrez l'adresse dans **Safari** (pas Chrome).
2. Touchez le bouton **Partager** (carré avec une flèche vers le haut).
3. Choisissez **Sur l'écran d'accueil**, puis **Ajouter**.
4. Lancez Coucou depuis sa nouvelle icône : il s'ouvre en plein écran, sans barre Safari.
5. Ouvrez-le une fois avec internet : ensuite, il fonctionne **hors-ligne** (mode avion compris).

## Publier une mise à jour

1. Modifiez les fichiers, puis renvoyez-les sur GitHub (`git push`).
2. **Important** : dans `sw.js`, augmentez le numéro `VERSION` (par exemple `1` → `2`). Sans ça, les appareils garderont l'ancienne version en cache.
3. Sur l'iPhone/iPad, l'app installée se met à jour au lancement suivant avec internet. Si ce n'est pas le cas : fermez complètement l'app (balayez-la depuis le sélecteur d'apps), rouvrez-la, refermez-la, puis rouvrez-la encore.
4. En dernier recours : supprimez l'icône de l'écran d'accueil, puis **Réglages → Safari → Avancé → Données des sites web**, supprimez la ligne `github.io`, et réinstallez depuis Safari.

## Les voix

Toutes les phrases sont dites par une **voix neuronale libre et gratuite** (« Jessica », voix française du projet open source Piper, un peu ralentie et adoucie). Les fichiers audio sont fabriqués une seule fois sur l'ordinateur et livrés avec le jeu : ils fonctionnent hors-ligne, sans aucun service payant. Si un fichier manque, la voix de l'appareil prend le relais.

**Changer ou ajouter une phrase** :
1. Modifiez le texte dans `js/data/phrases.js`.
2. Lancez le générateur (seules les phrases nouvelles ou modifiées sont refaites) :

```bash
node outils/voix/generer.mjs
```

3. Augmentez `VERSION` dans `sw.js`, puis publiez.

Le générateur a besoin de Python avec Piper (`pip install piper-tts`), de la voix `fr_FR-upmc-medium` (`python -m piper.download_voices fr_FR-upmc-medium`) et de ffmpeg, tous gratuits. Les chemins se règlent en haut de `outils/voix/generer.mjs`.

**Votre propre voix (facultatif)** : enregistrez la phrase avec l'app **Dictaphone** (`.m4a`), placez le fichier dans un dossier `audio/`, ajoutez une ligne dans `js/data/recordings.js` (par exemple `'nom-chat': 'audio/chat.m4a'`, la clé étant celle de `phrases.js`), ajoutez le fichier à `FILES` dans `sw.js` et augmentez `VERSION`.

## Site de test (V2 avant publication)

La version en cours de développement est publiée sur un second dépôt, `PWA-App-test`, à l'adresse `https://mino69-7.github.io/PWA-App-test/`. On peut l'installer sur l'écran d'accueil à côté de la vraie : chaque site garde son propre cache hors-ligne. Quand tout est validé, on publie sur `PWA-App`.

## Tester sur ce PC

Double-cliquez (ou clic droit → *Exécuter avec PowerShell*) sur `outils/serveur-local.ps1`, puis ouvrez <http://localhost:8080/> dans Chrome ou Edge. Les outils de développement (F12 → icône téléphone) permettent de simuler un iPhone.

## Tests automatiques (facultatif)

Ils vérifient le jeu dans le moteur de Safari (WebKit), sur iPhone et iPad, en portrait et en paysage : zoom bloqué, coin maison, tailles des cibles, pause, rotation, hors-ligne, chaque jeu et ses niveaux, présence des voix, absence d'erreurs. Ils nécessitent Node.js :

```bash
npm install
```

```bash
npx playwright install webkit
```

```bash
npm test
```

Ces tests ne remplacent pas un essai sur le vrai appareil : son, voix, mode silencieux, installation sur l'écran d'accueil et Accès guidé ne peuvent être vérifiés que sur l'iPhone ou l'iPad.

## Organisation du code

Site statique en JavaScript natif, sans framework ni étape de compilation.

```
index.html               page unique
manifest.webmanifest     informations d'installation (nom, icônes, plein écran)
sw.js                    service worker : cache hors-ligne versionné
icons/                   icônes 180 / 192 / 512 px
css/base.css             palette, anti-zoom, safe areas, styles des jeux
js/main.js               démarrage, menu, passage menu ↔ jeux, pause
js/core/input.js         tactile : anti-zoom, cible la plus proche, anti-rebond, glisser tolérant
js/core/audio.js         sons doux (Web Audio) et voix française
js/core/layout.js        taille d'écran, rotation, encoche
js/core/session.js       minuteur de 15 min et écran de pause
js/core/homeGuard.js     coin caché et bouton maison
js/core/effects.js       ondulation et petits utilitaires
js/core/game.js          base commune des jeux (scène, fin de manche)
js/core/levels.js        niveaux adaptatifs (en mémoire, sans sauvegarde)
js/data/art.js           dessins : 16 animaux, maisons, train, aliments, buissons
js/data/phrases.js       toutes les phrases de la voix
js/data/recordings.js    vos enregistrements audio (facultatif)
js/games/*.js            un fichier par mini-jeu
audio/voix/              voix générées (une phrase = un .mp3)
outils/voix/             générateur des voix (Piper + ffmpeg)
outils/serveur-local.ps1 serveur de test local pour Windows
tests/                   tests automatiques WebKit
```

Chaque jeu exporte `{ id, icon, create() }` et l'objet créé expose `init(container, services)`, `start()`, `stop()` et `resize()`. Pour ajouter un jeu, créez un nouveau fichier dans `js/games/` sur ce modèle et ajoutez-le à la liste `GAMES` de `js/main.js` (et à `FILES` dans `sw.js`).

**Changer le nom** : remplacez « Coucou » dans `index.html` (balises `title` et `apple-mobile-web-app-title`) et dans `manifest.webmanifest`.
