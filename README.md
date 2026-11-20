# RiftDex – Collection Riftbound

Appli web (installable sur téléphone) pour suivre sa collection de **Riftbound**, le jeu de cartes de League of Legends,
sur le modèle de NightDex :

- **Onglets FR · EN · 中文** en haut de l'écran : chaque langue est une **édition à part**, avec ses cartes, son scellé,
  sa collection, ses souhaits et ses favoris. FR : les séries de la galerie officielle française (Origins, Proving Grounds,
  Armes spirituelles, Déchaînement, Vendetta, Radiance). EN : tout, promos et coffrets compris (imprimés en anglais).
  中文 : les cartes imprimées en chinois avec leurs scans chinois officiels, plus les exclusivités chinoises.
  Les noms des séries suivent l'édition affichée.
- **Langue du site** (bouton 🌐 de l'accueil ou Réglages) : français, anglais ou chinois, indépendante de l'édition
  affichée — changer d'onglet FR · EN · 中文 ne change jamais la langue du site (comme NightDex).
- **Accueil** : les séries avec la progression (cartes possédées / total, %), en liste ou en grille, avec favoris et recherche.
- **Série** : trois affichages (Cartes, Liste, Grille), tri (numéro, prix, nom), filtres (possédées, manquantes, rareté), valeur de la série.
- **Fiche carte** : image, prix tendance Cardmarket en euros, prix minimum, moyennes 7 j et 30 j, **courbe de prix** (7 J, 1 M, 3 M, 1 A, Tout) et bouton **Cardmarket**.
- **Vue 3D** (toucher l'image de la fiche) : la carte tourne au doigt et se retourne ; reflet holographique seulement sur les cartes imprimées en foil
  (rares, épiques, showcase, hors-séries, signées ; pas Proving Grounds). Dos bleu (deck), blanc (runes) ou noir (légendes, champs de bataille) :
  photos des vrais dos à mettre dans `cardBacks` de `data/config.json`, sinon dos RiftDex de la même couleur.
- **Prix d'achat** : prix payé par exemplaire et plus-value par rapport à la cote, total dans *Collection*. Gardé sur l'appareil seulement (et dans l'export).
- **Séries illustrées** : chaque série a une bannière avec sa carte phare, sur l'accueil et en tête de sa page.
- **Listes** (accueil → Listes, façon Pokécardex) : groupes de musique de Riot (K/DA, HEARTSTEEL), illustrations alternatives, hors-séries,
  signatures, légendes, champs de bataille, runes, jetons, promos, régions (Zaun, Piltover, Bandle…), peuples (Yordles, Poros, Dragons…)
  et champions, toutes séries confondues, avec progression et favoris. Régions, peuples et champions viennent des étiquettes de la galerie
  officielle (`tags`) ; les cartes des groupes de musique sont listées dans `MUSIC_CARDS` (`app.js`).
- **Scellé** : boosters, booster box, cases, decks de champion, coffrets et sets complets, classés par langue, avec leur visuel
  (photo TCGplayer du produit ; version anglaise pour le scellé FR et chinois ; montage de cartes pour les sets de cartes).
- **Extra** : les versions vendues sur Cardmarket mais absentes de la galerie officielle (Ahri signée V.4, runes et jetons à part,
  hors-séries pas encore publiés…), rangées à part pour ne pas encombrer les séries.
- **Collection** : onglets Cartes (avec la puce « Doubles »), **Classeurs** (classeurs perso en 2×2, 3×3, 3×4, 4×3 ou 4×4 : un en gratuit,
  illimités avec le statut Soutien ; classeurs Master Set de chaque série), **Stats** (raretés, domaines, séries, badges débloqués avec
  célébration) et **Gradées** (slabs PSA, BGS, CGC… : note, prix payé, ventes relevées, courbe, photo gardée sur l'appareil).
- **Fiche carte** : état (Mint à Poor) et foil de chaque exemplaire, alerte de prix, ajout à une sous-liste de souhaits, version gradée,
  badge des cartes interdites en tournoi (annonces officielles, `banlist` de `data/config.json`).
- **Cotes** (valeur de la collection dans le temps, hausses, baisses, cartes les plus chères) et **Souhaits** : sous-listes avec budget,
  alertes de prix (notification du navigateur), liste d'achat Cardmarket des cartes manquantes (copie au format « 1 Nom (Série) »).
- **Decks** (accueil) : créateur de decks selon les règles de Riftbound (Légende, champion choisi, 40 cartes, 12 runes, 3 champs de bataille,
  3 exemplaires, couleurs, cartes interdites), cartes manquantes et leur coût, et **decks de tournoi** (Riftbound France, source riftdecks.com).
- **Actualités officielles** (bouton 📣 de l'accueil, FR / EN / 中文) et **calendrier des sorties**.
- **Amis** : échanges (ses doubles qui te manquent, tes doubles qui lui manquent) et **classement** amis / monde (valeur, cartes, séries complètes ;
  le classement mondial est sur inscription et ne publie que le pseudo et les totaux).
- **Scanner de cartes** (onglet Recherche → Scan) : la caméra reconnaît la carte, sur le téléphone, sans rien envoyer.
- **Comptes** (Google ou e-mail), **amis** (voir la collection d'un ami, échanges possibles) et **soutien** (Ko-fi).
- Interface **PC** (barre latérale, fiche en fenêtre) et **appli installable** hors ligne.

Aucune dépendance côté appli : HTML, CSS et JavaScript. Les scripts de données sont en Python (Pillow).

## Données

| Source | Contenu |
|---|---|
| Galerie officielle Riftbound, playriftbound.com (anglais, français, chinois simplifié) | noms, raretés, domaines, statistiques, images ; séries de l'édition française |
| Cartes chinoises officielles (images cdn.playloltcg.com, liste reprise par runecamp.com) | scans chinois de toutes les séries, exclusivités chinoises |
| Riftcodex (api.riftcodex.com) | cartes signées et promos absentes de la galerie |
| Cardmarket, fichiers publics du jeu n° 22 | rattachement des cartes, promos, scellé, **prix du jour** |
| TCGplayer, via tcgcsv.com | images des promos et coffrets absents de la galerie (K/DA, T1, Secret Garden…) |

Une série est visible en français dès qu'elle est dans la galerie officielle française de Riot (ou que Cardmarket vend
du scellé « (French) » de la série) ; c'est aussi la liste de riftboundfrance.fr/cartes. En chinois, dès qu'il existe des scans
chinois officiels (ou du scellé « (Chinese) ») ; une carte n'est dans l'édition chinoise qu'avec son scan chinois.
Riot ne publie pas les scans français (la galerie française montre les images anglaises, et riftboundfrance.fr aussi) :
l'édition française affiche les images anglaises (c'est indiqué dans l'appli).
Les cartes imprimées seulement en chinois (illustrations « b », versions « P », coffrets Arcane et T1 chinois…) ont
`only: ["zh"]` dans `data/catalog.json` ; celles des coffrets chinois sont dans la série « Exclusivités Chine » (`CN`), sans prix Cardmarket.
Les prix Cardmarket ne distinguent pas les langues : une carte a le même prix dans les trois éditions.

**Liens Cardmarket** : le bouton de la fiche ouvre la page exacte du produit grâce à la redirection officielle de Cardmarket
par numéro de produit (`Products?idProduct=<n>`, numéro du catalogue public de Cardmarket), filtrée sur la langue de l'édition.
Aucune adresse n'est devinée, donc toutes les versions (illustrations alternatives, hors-séries, signées, jetons) ouvrent la bonne
page. Le scellé utilise le même lien. Les exclusivités chinoises, absentes de Cardmarket, n'ont pas de bouton.
Quand une variante Cardmarket change d'identifiant (publiée ensuite par Riot), `renamed` dans `data/catalog.json` permet à
l'appli de reporter les exemplaires sur la nouvelle carte.

## Mise en ligne et mises à jour automatiques (GitHub Pages)

Le workflow `.github/workflows/prix.yml` fait tout seul :

| Quand | Quoi |
|---|---|
| **Chaque jour** vers 7 h | relève les prix Cardmarket des cartes et du scellé, ajoute un point à chaque courbe, republie le site |
| **Chaque lundi** vers 6 h 45 | cherche les **nouvelles séries et cartes** (images anglaises et chinoises comprises) et les **nouveaux produits scellés**, met à jour le scanner, puis relève les prix |
| À chaque envoi de code | republie le site |

Chaque lundi, **chaque carte déjà présente garde son identifiant et son produit Cardmarket** : les collections ne bougent pas.
Une nouvelle série de la galerie officielle est ajoutée et rattachée automatiquement à son extension Cardmarket
(comparaison des noms des cartes) ; une nouvelle extension Cardmarket de promos devient une série « promo ».
Une nouvelle série reçoit tout automatiquement, comme les autres : images des cartes (galerie officielle, scans chinois), nom français et chinois (galeries de Riot), bannière et classeur Master Set illustrés par sa carte phare, visuels du scellé (TCGplayer, sinon montage de cartes) et, pour les coffrets et promos absents de la galerie, images TCGplayer du groupe dont le nom correspond à la série (`tcg_auto_groups`, résumé dans l'onglet Actions). Rien n'est à préciser à la main.
Le résumé de chaque passage est visible dans l'onglet *Actions* de GitHub ; *Run workflow* (case « nouveautés ») lance la recherche à la main.

## Comptes (collections synchronisées entre appareils)

Avec un compte, les trois collections (FR, EN, chinoise), les souhaits et les séries favorites sont enregistrés en ligne et
synchronisés entre tous les appareils. Sans compte, tout reste sur le téléphone. Au premier passage d'un appareil sur un compte,
les collections sont réunies (quantité la plus haute gardée).

Les comptes utilisent **Firebase** (gratuit à cette échelle). Mise en place, une seule fois :
1. https://console.firebase.google.com → *Créer un projet* « riftdex » (Google Analytics inutile).
2. *Authentication* → *Commencer* → *Sign-in method* : activer **Google** et **Adresse e-mail/Mot de passe**.
3. *Authentication* → *Paramètres* → *Domaines autorisés* : ajouter `erzs247.github.io`.
4. *Firestore Database* → *Créer une base de données* (mode production, région `eur3` Europe).
   Onglet *Règles* : coller le contenu de `firestore.rules`, puis *Publier*.
5. *Paramètres du projet* (roue dentée) → *Vos applications* → icône web `</>` → nom « RiftDex » →
   copier l'objet `firebaseConfig` dans `data/firebase.json` (format JSON : `apiKey`, `authDomain`, `projectId`, `appId`…).
   Ces valeurs sont publiques par conception : la sécurité vient des règles Firestore.

Tant que `data/firebase.json` est vide (`{}`), l'appli fonctionne sans comptes ni amis.

**Nouvelles règles à publier** (Firestore → Règles : recoller tout `firestore.rules`, puis *Publier*) pour :
- `private/<uid>` : classeurs, decks, sous-listes de souhaits, alertes, états des exemplaires et cartes gradées synchronisés entre appareils
  (sans ces règles, ils restent sur l'appareil et dans l'export) ;
- `leaderboard/<uid>` : classement mondial (le classement entre amis marche sans).

**Soutiens** : le bouton « Soutenir RiftDex » ouvre `support.url` de `data/config.json` (Ko-fi). Pour activer les bonus d'un
donateur depuis l'appli, mettre ton ID RiftDex (*Mon compte*) dans `admins` de `data/config.json` **et** dans `isAdmin()`
de `firestore.rules` (puis republier les règles) : un panneau *Administration* apparaît dans *Mon compte*.

## Lancer en local

```bash
python -m http.server 8080
```

Puis ouvrir http://localhost:8080.

## Mettre à jour les données à la main

```bash
pip install -r requirements.txt
python scripts/import_officiel.py
python scripts/import_scelle.py
python scripts/make_scan_index.py
python scripts/update_prices.py
```

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html`, `styles.css`, `app.js` | l'appli |
| `sw.js`, `manifest.webmanifest`, `icons/` | installation et usage hors ligne |
| `data/catalog.json` | séries et cartes |
| `data/prices.json` | prix et historique par carte et produit |
| `data/sealed.json` | produits scellés |
| `data/config.json` | séries (noms FR/EN/ZH, extension Cardmarket), lien de soutien, administrateurs |
| `data/scan-index.json` | empreintes des images pour le scanner |
| `data/firebase.json`, `firestore.rules` | configuration Firebase des comptes et règles de sécurité |
| `images/<série>/` | images des cartes (`zh/` : versions chinoises) |
| `images/sealed/` | visuels des produits scellés |
| `cache/riftcodex.json` | dernière copie de Riftcodex |
| `cache/chinois.json` | dernière copie de la liste des cartes chinoises |
| `data/news.json`, `scripts/import_news.py` | actualités officielles (chaque jour) |
| `data/decks.json`, `scripts/import_decks.py` | decks de tournoi (chaque lundi) |
| `scripts/import_officiel.py` | import des cartes et des images (chaque lundi) |
| `scripts/import_scelle.py` | import des produits scellés (chaque lundi) |
| `scripts/update_prices.py` | relevé quotidien des prix Cardmarket |
| `scripts/make_scan_index.py` | index du scanner |
