# RiftDex – Collection Riftbound

Appli web (installable sur téléphone) pour suivre sa collection de **Riftbound**, le jeu de cartes de League of Legends,
sur le modèle de NightDex :

- **Onglets de langue FR · EN · 中文** en haut de l'écran : chaque langue est une **édition à part**, avec ses séries
  (seules les séries sorties dans cette langue), son scellé, sa collection, ses souhaits et ses favoris.
  Les textes de l'appli, les noms et les images des cartes suivent la langue choisie.
- **Accueil** : les séries avec la progression (cartes possédées / total, %), en liste ou en grille, avec favoris et recherche.
- **Série** : trois affichages (Cartes, Liste, Grille), tri (numéro, prix, nom), filtres (possédées, manquantes, rareté), valeur de la série.
- **Fiche carte** : image, prix tendance Cardmarket en euros, prix minimum, moyennes 7 j et 30 j, **courbe de prix** (7 J, 1 M, 3 M, 1 A, Tout) et bouton **Cardmarket**.
- **Scellé** : boosters, booster box, cases, decks de champion, coffrets et sets complets, classés par langue.
- **Collection**, **Cotes** (valeur de la collection dans le temps, hausses, baisses, cartes les plus chères) et **Souhaits**.
- **Scanner de cartes** (onglet Recherche → Scan) : la caméra reconnaît la carte, sur le téléphone, sans rien envoyer.
- **Comptes** (Google ou e-mail), **amis** (voir la collection d'un ami, échanges possibles) et **soutien** (Ko-fi).
- Interface **PC** (barre latérale, fiche en fenêtre) et **appli installable** hors ligne.

Aucune dépendance côté appli : HTML, CSS et JavaScript. Les scripts de données sont en Python (Pillow).

## Données

| Source | Contenu |
|---|---|
| Galerie officielle Riftbound (anglais et chinois simplifié) | noms, raretés, domaines, statistiques, images |
| Riftcodex (api.riftcodex.com) | cartes signées et promos absentes de la galerie |
| Cardmarket, fichiers publics du jeu n° 22 | rattachement des cartes, promos, scellé, **prix du jour** |

Les séries sont visibles en français dès que Cardmarket vend du scellé « (French) » de la série, en chinois dès qu'il existe
du scellé « (Chinese) » ou des images chinoises officielles.
Riot ne publie pas encore les scans français : l'édition française affiche les images anglaises (c'est indiqué dans l'appli).
Les prix Cardmarket ne distinguent pas les langues : une carte a le même prix dans les trois éditions.

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
Seuls le nom français (`fr`) et le nom chinois (`zh`) d'une nouvelle série restent à préciser à la main dans `data/config.json`.
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
| `cache/riftcodex.json` | dernière copie de Riftcodex |
| `scripts/import_officiel.py` | import des cartes et des images (chaque lundi) |
| `scripts/import_scelle.py` | import des produits scellés (chaque lundi) |
| `scripts/update_prices.py` | relevé quotidien des prix Cardmarket |
| `scripts/make_scan_index.py` | index du scanner |
