// RiftDex : suivi de collection Riftbound (cartes, prix Cardmarket, courbes de prix), en français, anglais et chinois.
// Chaque langue est une édition à part : ses séries, son scellé, sa collection, ses souhaits et ses favoris.
// Aucune dépendance : HTML + CSS + ce module. Les données viennent de data/*.json.

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const parseDay = (s) => new Date(`${s}T00:00:00`);
const LANGS = ['fr', 'en', 'zh'];

// ---------- Détection de l'appareil : interface PC ou téléphone ----------
// « PC » = grand écran avec souris ou pavé tactile, ou très grand écran (tablette en paysage, TV…).
// On se base sur l'écran et le pointeur plutôt que sur le nom de l'appareil : c'est plus fiable,
// et l'interface bascule en direct si la fenêtre est redimensionnée ou l'écran tourné.
const pcQuery = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine), (min-width: 1280px)');
const isPC = () => pcQuery.matches;
const applyDevice = () => { document.documentElement.dataset.device = isPC() ? 'pc' : 'mobile'; };
applyDevice();

// ---------- Textes FR / EN / ZH ----------
const plural = (n, one, many) => (n > 1 ? many : one);
const TEXT = {
  fr: {
    sealed: 'Scellé', setsTab: 'Séries', toggleView: 'Changer l\'affichage',
    cats: { booster: 'Boosters', box: 'Booster Box', case: 'Cases de 6 Booster Box', deck: 'Decks', kit: 'Coffrets & kits', set: 'Sets complets' },
    catOne: { booster: 'Booster', box: 'Booster Box', case: 'Case de 6 Booster Box', deck: 'Deck', kit: 'Coffret', set: 'Set complet' },
    sealedNote: (d, e) => `Prix tendance Cardmarket des produits scellés de l'édition ${TEXT.fr.ed[e]}${d ? ` · mis à jour le ${d}` : ''}. Les produits sans prix n'ont pas encore de ventes.`,
    sealedCount: (n) => `${n} ${plural(n, 'produit scellé', 'produits scellés')}`, noSealed: 'Aucun produit scellé dans cette langue pour l\'instant.',
    home: 'Accueil', collection: 'Collection', market: 'Cotes', wishlist: 'Souhaits', search: 'Recherche', searchCard: 'Rechercher une carte',
    settings: 'Réglages', list: 'Liste', grid: 'Grille', cards: 'Cartes', searchSet: 'Rechercher une série', noSet: 'Aucune série trouvée', favorites: 'Favoris',
    blocks: { main: 'Séries', promo: 'Promos & produits spéciaux', new: 'Nouvelles séries' },
    ed: { fr: 'française', en: 'anglaise', zh: 'chinoise' }, edShort: { fr: 'FR', en: 'EN', zh: 'chinoise' }, langNote: (e) => (e === 'fr' ? '<b>Édition française.</b> Séries sorties en VF, avec une collection et des souhaits propres. Riot ne publie pas encore les scans VF : les visuels sont ceux de la version anglaise.' : e === 'zh' ? '<b>Édition chinoise.</b> Seulement les cartes dont Riot publie la version chinoise, avec une collection et des souhaits propres.' : ''),
    back: 'Retour', favSet: 'Série favorite', changeSort: 'Changer le tri', filters: 'Filtres',
    owned: (a, b) => `${a}/${b} possédées`, myValue: 'Ma valeur', pricesSoon: 'Prix Cardmarket à venir',
    sorts: { num: 'Numéro', 'price-desc': 'Prix décroissant', 'price-asc': 'Prix croissant', name: 'Nom' },
    ownF: { all: 'Toutes', owned: 'Possédées', missing: 'Manquantes' }, allRarities: 'Toutes raretés',
    noCards: 'Aucune carte', noCardsHint: 'Modifiez les filtres pour en voir davantage.', searchInSet: 'Rechercher dans la série (nom, numéro…)',
    setNote: (sort, n, full) => `Tri : ${sort} · ${n} ${plural(n, 'carte affichée', 'cartes affichées')}${full ? ` · série complète ≈ ${full}` : ''}`,
    addedCol: 'Ajoutée à la collection', removedCol: 'Retirée de la collection', addedWish: 'Ajoutée aux souhaits', removedWish: 'Retirée des souhaits',
    favOn: 'Série ajoutée aux favoris', favOff: 'Série retirée des favoris', sortToast: (s) => `Tri : ${s}`,
    myCollection: (e) => `Ma collection ${TEXT.fr.edShort[e]}`, emptyCol: (e) => `Ta collection ${TEXT.fr.edShort[e]} est vide`, emptyColHint: 'Ouvrez une série et touchez l\'icône carte pour marquer celles que vous possédez.', browseSets: 'Voir les séries',
    kCards: 'Cartes', kUnique: 'Uniques', kValue: 'Valeur', all: 'Toutes',
    emptyWish: 'Aucune carte en souhait', emptyWishHint: 'Touchez le cœur d\'une carte pour l\'ajouter ici et suivre son prix.',
    wishBudget: 'Budget pour compléter mes souhaits', wishNote: (n, m) => `${n} ${plural(n, 'carte', 'cartes')} à acheter sur ${m}, au prix tendance Cardmarket.`,
    searchPh: 'Nom de carte ou numéro (ex. OGN 030)', searchHint: (n, m) => `${n} cartes dans ${m} séries. Tapez au moins 2 lettres.`,
    results: (n) => `${n} ${plural(n, 'résultat', 'résultats')}`, noResult: 'Aucune carte trouvée',
    colValue: (e) => `Valeur de ma collection ${TEXT.fr.edShort[e]}`, colValueHint: 'Marquez des cartes comme possédées pour suivre la valeur de votre collection dans le temps.',
    pricesNote: (d) => `Prix Cardmarket (tendance, en euros, toutes langues confondues) · mis à jour le ${d}`, noPricesNote: 'Les prix Cardmarket ne sont pas encore importés.',
    risers: 'Plus fortes hausses sur 7 jours', fallers: 'Plus fortes baisses sur 7 jours', priciest: 'Cartes les plus chères', noHistory: 'Pas encore assez d\'historique.',
    trend: 'Tendance Cardmarket', noPrice: 'Prix à venir', over30: 'sur 30 jours', removeCopy: 'Retirer un exemplaire', addCopy: 'Ajouter un exemplaire', copies: 'Exemplaires possédés',
    wishBtn: 'Liste de souhaits', ownBtn: 'Je possède cette carte', from: 'À partir de', avg7: 'Moy. 7 j', avg30: 'Moy. 30 j', foil: 'Foil', foilPrice: (v) => `Version foil : ${v}`,
    curve: 'Courbe de prix', seeded: 'Les premiers points sont les moyennes 30 j, 7 j et 1 j de Cardmarket ; ensuite un relevé par jour.',
    cmSearch: 'Rechercher sur Cardmarket', cmView: 'Voir sur Cardmarket', cmVersions: 'Voir les versions sur Cardmarket', cmAll: 'Pas la bonne version ? Toutes les versions sur Cardmarket', art: (a) => `Illustration : ${a}`, artApprox: 'Visuel de la version standard (pas d\'image officielle de cette version).', enArt: 'Visuel de la version anglaise.', enOnly: 'Carte imprimée en anglais.',
    worth: (q, v) => (q > 1 ? `Vos ${q} exemplaires valent ${v}` : `Votre exemplaire vaut ${v}`),
    energy: 'Énergie', might: 'Puissance', power: 'Rune', dayShort: 'j',
    chartWait: 'Pas encore assez d\'historique pour tracer une courbe. Le prix est relevé chaque jour.', chartNone: 'Pas de prix Cardmarket pour cette carte pour l\'instant.',
    ranges: ['7 J', '1 M', '3 M', '1 A', 'Tout'], chartAria: (a, b, c, d) => `Courbe du prix du ${a} au ${b}, de ${c} à ${d}`,
    language: 'Langue du site', editionToast: (e) => `Édition ${TEXT.fr.ed[e]}`, langToast: 'Site en français',
    prev: 'Carte précédente', next: 'Carte suivante',
    fr: {
      title: 'Amis', gate: 'Connecte-toi à ton compte RiftDex pour ajouter des amis et voir leurs collections.', noCloud: 'Les amis ont besoin des comptes RiftDex, pas encore activés.',
      choose: 'Choisis ton pseudo', chooseHint: 'Tes amis t\'ajouteront avec ce pseudo. 3 à 20 caractères : lettres minuscules, chiffres, . _ -',
      pseudoPh: 'ex. faille_77', save: 'Enregistrer', pseudoRule: 'Pseudo invalide : 3 à 20 caractères (a-z, 0-9, . _ -).', pseudoTaken: 'Ce pseudo est déjà pris, essaie-en un autre.', pseudoSaved: 'Pseudo enregistré',
      add: 'Ajouter un ami', yourPseudo: 'Ton pseudo :', addPh: 'Pseudo de ton ami', send: 'Envoyer',
      privacy: 'Tes amis acceptés peuvent voir tes collections et tes souhaits. Personne d\'autre.',
      notFound: (p) => `Aucun compte avec le pseudo « ${p} ».`, self: 'C\'est ton propre pseudo !', already: (p) => `@${p} est déjà ton ami.`,
      sent: 'Demande envoyée', accepted: 'Ami ajouté', removed: 'Ami retiré', denied: 'Action refusée : vérifie que les règles Firestore sont à jour.', error: 'Une erreur est survenue, réessaie.',
      requests: 'Demandes reçues', wants: 'veut devenir ton ami', accept: 'Accepter', decline: 'Refuser',
      mine: 'Mes amis', see: 'Voir sa collection', open: 'Voir', remove: 'Retirer', confirm: 'Confirmer ?',
      none: 'Pas encore d\'amis', noneHint: 'Ajoute un ami avec son pseudo : il devra accepter ta demande.',
      loading: 'Chargement de sa collection…', cantSee: 'Collection inaccessible', cantSeeHint: 'Vous n\'êtes peut-être plus amis, ou les règles Firestore ne sont pas à jour.',
      fAll: (e) => `Sa collection ${TEXT.fr.edShort[e]}`, fTrade: 'Il l\'a, pas moi', fGive: 'Il la cherche, je l\'ai', fWish: 'Ses souhaits', emptyFilter: 'Rien dans ce filtre pour l\'instant.',
      tagMine: 'Je l\'ai', tagWant: 'Dans mes souhaits',
    },
    scan: { btn: 'Scan', title: 'Scanner une carte', starting: 'Ouverture de la caméra…', aim: 'Place la carte dans le cadre, bien à plat, sans reflet.', holding: 'Je la tiens… ne bouge plus.', photo: 'Choisir une photo', torch: 'Lampe',
      denied: 'Accès à la caméra refusé. Autorise-le dans les réglages du navigateur, ou choisis une photo de la carte.', noCamera: 'Pas de caméra disponible. Choisis plutôt une photo de la carte, bien cadrée.', indexErr: 'Impossible de charger le scanner. Vérifie ta connexion et réessaie.',
      unsure: 'Pas sûr à 100 % : vérifie que c\'est la bonne.', owned: (q) => `Tu en as déjà ${q}.`, versions: 'Autres versions de cette carte :', notIt: 'Ce n\'est pas elle ?',
      add: '+1 Je l\'ai', open: 'Voir la fiche', again: 'Rescanner', added: (q) => `Ajoutée : tu en as ${q}` },
    inst: { title: 'Installe RiftDex', pitch: 'Comme une vraie appli : icône sur ton écran, plein écran sans navigateur, et ça marche hors connexion.', btn: 'Installer', ios: 'Sur iPhone : touche Partager (le carré avec la flèche), puis « Sur l\'écran d\'accueil ».', done: 'RiftDex est installée ! Ouvre-la depuis ton écran d\'accueil.' },
    adm: { title: 'Administration', role: 'rôle admin', idPh: 'ID RiftDex du donateur', activate: 'Activer', remove: 'Retirer', listTitle: 'Soutiens actifs', none: 'Aucun soutien pour l\'instant.', on: 'Soutien activé', off: 'Soutien retiré', badId: 'ID invalide : copie-le depuis « Mon compte » du donateur.', denied: 'Refusé : les règles Firestore ne reconnaissent pas encore ce compte comme admin (publie les nouvelles règles).' },
    support: 'Soutenir RiftDex', supportHint: 'RiftDex est gratuit et fait par un fan. Un don aide à le faire vivre et débloque des bonus (photo de profil, cadre doré).',
    supporter: 'Soutien', supporterThanks: 'Merci pour ton soutien ! Tes bonus sont actifs.',
    myId: 'Ton ID RiftDex', myIdHint: 'Indique-le dans le message de ton don pour recevoir tes bonus.', copy: 'Copier', copiedId: 'ID copié',
    avatar: 'Photo de profil', avatarChange: 'Changer la photo', avatarAdd: 'Ajouter une photo', avatarRemove: 'Retirer', avatarLocked: 'Réservé aux soutiens de RiftDex.', avatarSaved: 'Photo enregistrée', avatarRemoved: 'Photo retirée', avatarErr: 'Impossible d\'enregistrer la photo. Réessaie.', avatarDenied: 'Photo réservée aux soutiens : ton statut n\'est pas encore actif.',
    account: 'Mon compte', accountShort: 'Compte',
    accountPitch: 'Connecte-toi pour retrouver tes collections (FR, EN et chinoise), tes souhaits et tes séries favorites sur tous tes appareils. Sans compte, elles restent enregistrées sur ce téléphone.',
    google: 'Continuer avec Google', or: 'ou', email: 'Adresse e-mail', password: 'Mot de passe (6 caractères minimum)',
    signIn: 'Se connecter', signUp: 'Créer un compte', forgot: 'Mot de passe oublié ?', resetSent: 'E-mail de réinitialisation envoyé',
    signedAs: (e) => `Connecté : ${e}`, signOut: 'Se déconnecter', signedOut: 'Déconnecté. Ta collection reste sur ce téléphone.',
    welcome: 'Connecté : ta collection est synchronisée',
    syncOk: (t) => `Collection synchronisée${t ? ` · ${t}` : ''}`, syncing: 'Synchronisation…', syncErr: 'Synchronisation impossible pour le moment. Tes changements sont gardés sur ce téléphone et seront envoyés plus tard.',
    syncInfo: (n, w) => `${n} ${plural(n, 'carte ou produit possédé', 'cartes et produits possédés')}, ${w} ${plural(w, 'souhait', 'souhaits')} (toutes éditions) : enregistrés sur ton compte.`,
    deleteAcc: 'Supprimer mon compte', deleteConfirm: 'Confirmer la suppression définitive', deleteNote: 'Supprime ton compte et la copie en ligne de tes collections. Elles restent sur ce téléphone.',
    deleted: 'Compte supprimé',
    authErr: { 'auth/invalid-email': 'Adresse e-mail invalide.', 'auth/missing-password': 'Indique un mot de passe.', 'auth/weak-password': 'Mot de passe trop court : 6 caractères minimum.', 'auth/email-already-in-use': 'Un compte existe déjà avec cette adresse : connecte-toi.', 'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/wrong-password': 'E-mail ou mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cette adresse.', 'auth/too-many-requests': 'Trop d\'essais : réessaie dans quelques minutes.', 'auth/network-request-failed': 'Pas de connexion internet.', 'auth/requires-recent-login': 'Par sécurité, déconnecte-toi puis reconnecte-toi avant de supprimer ton compte.', 'auth/unauthorized-domain': 'Ce site n\'est pas encore autorisé dans Firebase (domaines autorisés).', default: 'Une erreur est survenue, réessaie.' },
    disclaimer: 'RiftDex est une appli de fan non officielle, sans lien avec Riot Games. Riftbound et League of Legends sont des marques de Riot Games ; les images des cartes et des produits appartiennent à leurs ayants droit. Prix : Cardmarket (tendance, mis à jour chaque jour).',
    storage: (n, w, e) => `Ta collection ${TEXT.fr.edShort[e]} est enregistrée sur cet appareil (${n} cartes possédées, ${w} souhaits). Chaque édition (FR, EN, chinoise) a sa propre collection. Exporte le tout pour le sauvegarder ou le transférer sur un autre téléphone.`, editionHint: 'Les onglets FR · EN · 中文 en haut de l\'écran changent l\'édition des cartes (séries, images, collection), pas la langue du site.',
    export: 'Exporter mes collections (copier)', import: 'Importer un fichier de sauvegarde', dataLine: (n, m, d) => `Données : ${n} cartes, ${m} séries · prix Cardmarket du ${d}.`, close: 'Fermer',
    copied: 'Sauvegarde copiée', selectCopy: 'Sélectionnez le texte pour le copier', imported: 'Collections importées', badFile: 'Fichier invalide : choisissez un export RiftDex',
    loadError: 'Impossible de charger les cartes', loadErrorHint: 'Vérifiez votre connexion, puis rechargez la page.',
    rarity: { common: 'Commune', uncommon: 'Peu commune', rare: 'Rare', epic: 'Épique', showcase: 'Showcase', signature: 'Signature', promo: 'Promo' },
    type: { unit: 'Unité', spell: 'Sort', legend: 'Légende', gear: 'Équipement', battlefield: 'Champ de bataille', rune: 'Rune', token: 'Jeton' },
    domain: { fury: 'Fureur', calm: 'Calme', mind: 'Esprit', body: 'Corps', chaos: 'Chaos', order: 'Ordre', colorless: 'Neutre' },
    variant: { alt: 'Illustration alternative', star: 'Hors-série', sig: 'Signature', extra: 'Variante' },
  },
  en: {
    sealed: 'Sealed', setsTab: 'Sets', toggleView: 'Change view',
    cats: { booster: 'Boosters', box: 'Booster boxes', case: 'Cases of 6 booster boxes', deck: 'Decks', kit: 'Box sets & kits', set: 'Complete sets' },
    catOne: { booster: 'Booster', box: 'Booster box', case: 'Case of 6 booster boxes', deck: 'Deck', kit: 'Box set', set: 'Complete set' },
    sealedNote: (d, e) => `Cardmarket trend prices for ${TEXT.en.ed[e]} sealed products${d ? ` · updated ${d}` : ''}. Products without a price have no sales yet.`,
    sealedCount: (n) => `${n} sealed ${plural(n, 'product', 'products')}`, noSealed: 'No sealed products in this language yet.',
    home: 'Home', collection: 'Collection', market: 'Market', wishlist: 'Wishlist', search: 'Search', searchCard: 'Search a card',
    settings: 'Settings', list: 'List', grid: 'Grid', cards: 'Cards', searchSet: 'Search a set', noSet: 'No set found', favorites: 'Favourites',
    blocks: { main: 'Sets', promo: 'Promos & special products', new: 'New sets' },
    ed: { fr: 'French', en: 'English', zh: 'Chinese' }, edShort: { fr: 'French', en: 'English', zh: 'Chinese' }, langNote: (e) => (e === 'fr' ? '<b>French edition.</b> Sets released in French, with their own collection and wishlist. Riot does not publish French scans yet: the pictures are the English ones.' : e === 'zh' ? '<b>Chinese edition.</b> Only the cards Riot publishes in Chinese, with their own collection and wishlist.' : ''),
    back: 'Back', favSet: 'Favourite set', changeSort: 'Change sort', filters: 'Filters',
    owned: (a, b) => `${a}/${b} owned`, myValue: 'My value', pricesSoon: 'Cardmarket prices coming soon',
    sorts: { num: 'Number', 'price-desc': 'Price high to low', 'price-asc': 'Price low to high', name: 'Name' },
    ownF: { all: 'All', owned: 'Owned', missing: 'Missing' }, allRarities: 'All rarities',
    noCards: 'No cards', noCardsHint: 'Change the filters to see more.', searchInSet: 'Search this set (name, number…)',
    setNote: (sort, n, full) => `Sort: ${sort} · ${n} ${plural(n, 'card', 'cards')} shown${full ? ` · full set ≈ ${full}` : ''}`,
    addedCol: 'Added to collection', removedCol: 'Removed from collection', addedWish: 'Added to wishlist', removedWish: 'Removed from wishlist',
    favOn: 'Set added to favourites', favOff: 'Set removed from favourites', sortToast: (s) => `Sort: ${s}`,
    myCollection: (e) => `My ${TEXT.en.edShort[e]} collection`, emptyCol: (e) => `Your ${TEXT.en.edShort[e]} collection is empty`, emptyColHint: 'Open a set and tap the card icon to mark the cards you own.', browseSets: 'Browse sets',
    kCards: 'Cards', kUnique: 'Unique', kValue: 'Value', all: 'All',
    emptyWish: 'Your wishlist is empty', emptyWishHint: 'Tap the heart on a card to add it here and follow its price.',
    wishBudget: 'Budget to complete my wishlist', wishNote: (n, m) => `${n} ${plural(n, 'card', 'cards')} to buy out of ${m}, at Cardmarket trend price.`,
    searchPh: 'Card name or number (e.g. OGN 030)', searchHint: (n, m) => `${n} cards in ${m} sets. Type at least 2 letters.`,
    results: (n) => `${n} ${plural(n, 'result', 'results')}`, noResult: 'No card found',
    colValue: (e) => `My ${TEXT.en.edShort[e]} collection value`, colValueHint: 'Mark cards as owned to follow the value of your collection over time.',
    pricesNote: (d) => `Cardmarket prices (trend, in euros, all languages) · updated ${d}`, noPricesNote: 'Cardmarket prices have not been imported yet.',
    risers: 'Biggest risers over 7 days', fallers: 'Biggest fallers over 7 days', priciest: 'Most expensive cards', noHistory: 'Not enough history yet.',
    trend: 'Cardmarket trend', noPrice: 'No price yet', over30: 'over 30 days', removeCopy: 'Remove a copy', addCopy: 'Add a copy', copies: 'Copies owned',
    wishBtn: 'Wishlist', ownBtn: 'I own this card', from: 'From', avg7: '7-day avg', avg30: '30-day avg', foil: 'Foil', foilPrice: (v) => `Foil version: ${v}`,
    curve: 'Price history', seeded: 'The first points are Cardmarket\'s 30-day, 7-day and 1-day averages; after that, one reading per day.',
    cmSearch: 'Search on Cardmarket', cmView: 'View on Cardmarket', cmVersions: 'See the versions on Cardmarket', cmAll: 'Not the right version? All versions on Cardmarket', art: (a) => `Art: ${a}`, artApprox: 'Standard version artwork (no official image of this version).', enArt: '', enOnly: '',
    worth: (q, v) => (q > 1 ? `Your ${q} copies are worth ${v}` : `Your copy is worth ${v}`),
    energy: 'Energy', might: 'Might', power: 'Power', dayShort: 'd',
    chartWait: 'Not enough history to draw a curve yet. Prices are recorded every day.', chartNone: 'No Cardmarket price for this card yet.',
    ranges: ['7D', '1M', '3M', '1Y', 'All'], chartAria: (a, b, c, d) => `Price from ${a} to ${b}, from ${c} to ${d}`,
    language: 'Site language', editionToast: (e) => `${TEXT.en.ed[e]} edition`, langToast: 'Site in English',
    prev: 'Previous card', next: 'Next card',
    fr: {
      title: 'Friends', gate: 'Sign in to your RiftDex account to add friends and see their collections.', noCloud: 'Friends need RiftDex accounts, which are not enabled yet.',
      choose: 'Choose your username', chooseHint: 'Friends will add you with this username. 3 to 20 characters: lowercase letters, digits, . _ -',
      pseudoPh: 'e.g. rift_walker_77', save: 'Save', pseudoRule: 'Invalid username: 3 to 20 characters (a-z, 0-9, . _ -).', pseudoTaken: 'This username is taken, try another one.', pseudoSaved: 'Username saved',
      add: 'Add a friend', yourPseudo: 'Your username:', addPh: 'Your friend\'s username', send: 'Send',
      privacy: 'Accepted friends can see your collections and wishlist. Nobody else.',
      notFound: (p) => `No account with the username “${p}”.`, self: 'That\'s your own username!', already: (p) => `@${p} is already your friend.`,
      sent: 'Request sent', accepted: 'Friend added', removed: 'Friend removed', denied: 'Action refused: check that the Firestore rules are up to date.', error: 'Something went wrong, try again.',
      requests: 'Requests', wants: 'wants to be your friend', accept: 'Accept', decline: 'Decline',
      mine: 'My friends', see: 'See their collection', open: 'View', remove: 'Remove', confirm: 'Confirm?',
      none: 'No friends yet', noneHint: 'Add a friend with their username: they will have to accept.',
      loading: 'Loading their collection…', cantSee: 'Collection unavailable', cantSeeHint: 'You may no longer be friends, or the Firestore rules are not up to date.',
      fAll: (e) => `Their ${TEXT.en.edShort[e]} collection`, fTrade: 'They have, I don\'t', fGive: 'They want, I have', fWish: 'Their wishlist', emptyFilter: 'Nothing in this filter yet.',
      tagMine: 'I have it', tagWant: 'On my wishlist',
    },
    scan: { btn: 'Scan', title: 'Scan a card', starting: 'Opening the camera…', aim: 'Place the card in the frame, flat, without glare.', holding: 'Got it… hold still.', photo: 'Choose a photo', torch: 'Torch',
      denied: 'Camera access denied. Allow it in your browser settings, or choose a photo of the card.', noCamera: 'No camera available. Choose a well-framed photo of the card instead.', indexErr: 'Could not load the scanner. Check your connection and try again.',
      unsure: 'Not 100 % sure: check it is the right one.', owned: (q) => `You already have ${q}.`, versions: 'Other versions of this card:', notIt: 'Not this one?',
      add: '+1 I have it', open: 'View card', again: 'Scan again', added: (q) => `Added: you have ${q}` },
    inst: { title: 'Install RiftDex', pitch: 'Like a real app: an icon on your screen, full screen without a browser, and it works offline.', btn: 'Install', ios: 'On iPhone: tap Share (the square with the arrow), then “Add to Home Screen”.', done: 'RiftDex is installed! Open it from your home screen.' },
    adm: { title: 'Administration', role: 'admin role', idPh: 'Donor\'s RiftDex ID', activate: 'Activate', remove: 'Remove', listTitle: 'Active supporters', none: 'No supporters yet.', on: 'Supporter activated', off: 'Supporter removed', badId: 'Invalid ID: copy it from the donor\'s “My account”.', denied: 'Refused: the Firestore rules do not recognise this account as admin yet (publish the new rules).' },
    support: 'Support RiftDex', supportHint: 'RiftDex is free and fan-made. A donation keeps it alive and unlocks extras (profile picture, gold frame).',
    supporter: 'Supporter', supporterThanks: 'Thanks for your support! Your extras are active.',
    myId: 'Your RiftDex ID', myIdHint: 'Add it to your donation message to receive your extras.', copy: 'Copy', copiedId: 'ID copied',
    avatar: 'Profile picture', avatarChange: 'Change picture', avatarAdd: 'Add a picture', avatarRemove: 'Remove', avatarLocked: 'For RiftDex supporters only.', avatarSaved: 'Picture saved', avatarRemoved: 'Picture removed', avatarErr: 'Could not save the picture. Try again.', avatarDenied: 'Pictures are for supporters: your status is not active yet.',
    account: 'My account', accountShort: 'Account',
    accountPitch: 'Sign in to find your collections (French, English and Chinese), wishlist and favourite sets on all your devices. Without an account, they stay on this phone.',
    google: 'Continue with Google', or: 'or', email: 'Email address', password: 'Password (at least 6 characters)',
    signIn: 'Sign in', signUp: 'Create an account', forgot: 'Forgot password?', resetSent: 'Password reset email sent',
    signedAs: (e) => `Signed in: ${e}`, signOut: 'Sign out', signedOut: 'Signed out. Your collection stays on this phone.',
    welcome: 'Signed in: your collection is synced',
    syncOk: (t) => `Collection synced${t ? ` · ${t}` : ''}`, syncing: 'Syncing…', syncErr: 'Sync is not possible right now. Your changes are kept on this phone and will be sent later.',
    syncInfo: (n, w) => `${n} ${plural(n, 'card or product', 'cards and products')} owned, ${w} in wishlist (all editions): saved to your account.`,
    deleteAcc: 'Delete my account', deleteConfirm: 'Confirm permanent deletion', deleteNote: 'Deletes your account and the online copy of your collections. They stay on this phone.',
    deleted: 'Account deleted',
    authErr: { 'auth/invalid-email': 'Invalid email address.', 'auth/missing-password': 'Enter a password.', 'auth/weak-password': 'Password too short: at least 6 characters.', 'auth/email-already-in-use': 'An account already exists with this email: sign in.', 'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'No account with this email.', 'auth/too-many-requests': 'Too many attempts: try again in a few minutes.', 'auth/network-request-failed': 'No internet connection.', 'auth/requires-recent-login': 'For security, sign out and sign in again before deleting your account.', 'auth/unauthorized-domain': 'This site is not yet authorised in Firebase (authorised domains).', default: 'Something went wrong, please try again.' },
    disclaimer: 'RiftDex is an unofficial fan app, not affiliated with Riot Games. Riftbound and League of Legends are trademarks of Riot Games; card and product images belong to their respective owners. Prices: Cardmarket (trend, updated daily).',
    storage: (n, w, e) => `Your ${TEXT.en.edShort[e]} collection is saved on this device (${n} cards owned, ${w} in wishlist). Each edition (French, English, Chinese) has its own collection. Export everything to back it up or move it to another phone.`, editionHint: 'The FR · EN · 中文 tabs at the top switch the card edition (sets, pictures, collection), not the site language.',
    export: 'Export my collections (copy)', import: 'Import a backup file', dataLine: (n, m, d) => `Data: ${n} cards, ${m} sets · Cardmarket prices from ${d}.`, close: 'Close',
    copied: 'Backup copied', selectCopy: 'Select the text to copy it', imported: 'Collections imported', badFile: 'Invalid file: choose a RiftDex export',
    loadError: 'Could not load the cards', loadErrorHint: 'Check your connection, then reload the page.',
    rarity: { common: 'Common', uncommon: 'Uncommon', rare: 'Rare', epic: 'Epic', showcase: 'Showcase', signature: 'Signature', promo: 'Promo' },
    type: { unit: 'Unit', spell: 'Spell', legend: 'Legend', gear: 'Gear', battlefield: 'Battlefield', rune: 'Rune', token: 'Token' },
    domain: { fury: 'Fury', calm: 'Calm', mind: 'Mind', body: 'Body', chaos: 'Chaos', order: 'Order', colorless: 'Colorless' },
    variant: { alt: 'Alternate art', star: 'Overnumbered', sig: 'Signature', extra: 'Variant' },
  },
  zh: {
    sealed: '未拆封', setsTab: '系列', toggleView: '切换显示',
    cats: { booster: '补充包', box: '补充包盒', case: '整箱', deck: '套牌', kit: '礼盒', set: '全套' },
    catOne: { booster: '补充包', box: '补充包盒', case: '整箱（6 盒）', deck: '套牌', kit: '礼盒', set: '全套' },
    sealedNote: (d, e) => `${TEXT.zh.ed[e]}版未拆封商品的 Cardmarket 趋势价${d ? ` · 更新于 ${d}` : ''}。没有价格的商品暂无成交。`,
    sealedCount: (n) => `${n} 件未拆封商品`, noSealed: '该语言暂无未拆封商品。',
    home: '首页', collection: '收藏', market: '行情', wishlist: '心愿单', search: '搜索', searchCard: '搜索卡牌',
    settings: '设置', list: '列表', grid: '网格', cards: '卡牌', searchSet: '搜索系列', noSet: '未找到系列', favorites: '收藏的系列',
    blocks: { main: '系列', promo: '宣传卡与特别商品', new: '新系列' },
    ed: { fr: '法语', en: '英语', zh: '中文' }, edShort: { fr: '法语', en: '英语', zh: '中文' }, langNote: (e) => (e === 'fr' ? '<b>法语版。</b>已发行法语版的系列，收藏与心愿单独立。Riot 尚未公布法语卡图，显示英文版卡图。' : e === 'zh' ? '<b>中文版。</b>仅显示 Riot 已公布中文版的卡牌，收藏与心愿单独立。' : ''),
    back: '返回', favSet: '收藏系列', changeSort: '更改排序', filters: '筛选',
    owned: (a, b) => `已拥有 ${a}/${b}`, myValue: '我的价值', pricesSoon: 'Cardmarket 价格即将更新',
    sorts: { num: '编号', 'price-desc': '价格从高到低', 'price-asc': '价格从低到高', name: '名称' },
    ownF: { all: '全部', owned: '已拥有', missing: '未拥有' }, allRarities: '全部稀有度',
    noCards: '没有卡牌', noCardsHint: '调整筛选条件以查看更多。', searchInSet: '在本系列中搜索（名称、编号…）',
    setNote: (sort, n, full) => `排序：${sort} · 显示 ${n} 张${full ? ` · 整套约 ${full}` : ''}`,
    addedCol: '已加入收藏', removedCol: '已从收藏移除', addedWish: '已加入心愿单', removedWish: '已从心愿单移除',
    favOn: '已收藏该系列', favOff: '已取消收藏该系列', sortToast: (s) => `排序：${s}`,
    myCollection: (e) => `我的${TEXT.zh.ed[e]}版收藏`, emptyCol: (e) => `你的${TEXT.zh.ed[e]}版收藏还是空的`, emptyColHint: '打开一个系列，点击卡牌图标标记你拥有的卡牌。', browseSets: '浏览系列',
    kCards: '卡牌', kUnique: '不重复', kValue: '价值', all: '全部',
    emptyWish: '心愿单为空', emptyWishHint: '点击卡牌上的爱心即可加入心愿单并追踪价格。',
    wishBudget: '完成心愿单所需预算', wishNote: (n, m) => `${m} 张中还需购买 ${n} 张，按 Cardmarket 趋势价计算。`,
    searchPh: '卡牌名称或编号（如 OGN 030）', searchHint: (n, m) => `${m} 个系列共 ${n} 张卡牌。请输入至少 2 个字符。`,
    results: (n) => `${n} 个结果`, noResult: '未找到卡牌',
    colValue: (e) => `我的${TEXT.zh.ed[e]}版收藏价值`, colValueHint: '将卡牌标记为已拥有，即可追踪收藏价值的变化。',
    pricesNote: (d) => `Cardmarket 价格（趋势价，欧元，不区分语言）· 更新于 ${d}`, noPricesNote: '尚未导入 Cardmarket 价格。',
    risers: '7 日涨幅最大', fallers: '7 日跌幅最大', priciest: '最贵的卡牌', noHistory: '历史数据不足。',
    trend: 'Cardmarket 趋势价', noPrice: '暂无价格', over30: '（30 日）', removeCopy: '减少一张', addCopy: '增加一张', copies: '拥有数量',
    wishBtn: '心愿单', ownBtn: '我拥有这张卡', from: '最低价', avg7: '7 日均价', avg30: '30 日均价', foil: '闪卡', foilPrice: (v) => `闪卡版本：${v}`,
    curve: '价格走势', seeded: '最初几个点为 Cardmarket 的 30 日、7 日和 1 日均价，之后每天记录一次。',
    cmSearch: '在 Cardmarket 上搜索', cmView: '在 Cardmarket 上查看', cmVersions: '在 Cardmarket 上查看所有版本', cmAll: '版本不对？查看 Cardmarket 上的所有版本', art: (a) => `画师：${a}`, artApprox: '显示的是标准版卡图（该版本暂无官方图片）。', enArt: '暂无中文卡图，显示英文版。', enOnly: '该卡仅有英文版。',
    worth: (q, v) => (q > 1 ? `你的 ${q} 张价值 ${v}` : `你的这张价值 ${v}`),
    energy: '能量', might: '战力', power: '符能', dayShort: '天',
    chartWait: '历史数据不足，暂时无法绘制走势。价格每天记录一次。', chartNone: '这张卡暂无 Cardmarket 价格。',
    ranges: ['7天', '1月', '3月', '1年', '全部'], chartAria: (a, b, c, d) => `${a} 至 ${b} 的价格，从 ${c} 到 ${d}`,
    language: '网站语言', editionToast: (e) => `${TEXT.zh.ed[e]}版`, langToast: '网站语言：中文',
    prev: '上一张', next: '下一张',
    fr: {
      title: '好友', gate: '登录 RiftDex 账号即可添加好友并查看他们的收藏。', noCloud: '好友功能需要 RiftDex 账号，目前尚未开放。',
      choose: '选择你的用户名', chooseHint: '好友将通过这个用户名添加你。3 到 20 个字符：小写字母、数字、. _ -',
      pseudoPh: '例如 rift_walker_77', save: '保存', pseudoRule: '用户名无效：3 到 20 个字符（a-z、0-9、. _ -）。', pseudoTaken: '该用户名已被占用，请换一个。', pseudoSaved: '用户名已保存',
      add: '添加好友', yourPseudo: '你的用户名：', addPh: '好友的用户名', send: '发送',
      privacy: '只有已接受的好友能看到你的收藏和心愿单。',
      notFound: (p) => `没有用户名为「${p}」的账号。`, self: '这是你自己的用户名！', already: (p) => `@${p} 已经是你的好友。`,
      sent: '请求已发送', accepted: '已添加好友', removed: '已移除好友', denied: '操作被拒绝：请确认 Firestore 规则已更新。', error: '出错了，请重试。',
      requests: '收到的请求', wants: '想加你为好友', accept: '接受', decline: '拒绝',
      mine: '我的好友', see: '查看收藏', open: '查看', remove: '移除', confirm: '确认？',
      none: '还没有好友', noneHint: '输入好友的用户名添加好友，对方需要接受请求。',
      loading: '正在加载收藏…', cantSee: '无法查看收藏', cantSeeHint: '你们可能已不是好友，或 Firestore 规则未更新。',
      fAll: (e) => `他的${TEXT.zh.ed[e]}版收藏`, fTrade: '他有我没有', fGive: '他想要我有', fWish: '他的心愿单', emptyFilter: '这里暂时没有内容。',
      tagMine: '我有', tagWant: '在我的心愿单',
    },
    scan: { btn: '扫描', title: '扫描卡牌', starting: '正在打开相机…', aim: '把卡牌放进框内，保持平整、避免反光。', holding: '识别中…请保持不动。', photo: '选择照片', torch: '手电筒',
      denied: '相机权限被拒绝。请在浏览器设置中允许，或选择一张卡牌照片。', noCamera: '没有可用的相机。请选择一张构图清晰的卡牌照片。', indexErr: '扫描器加载失败。请检查网络后重试。',
      unsure: '不完全确定：请确认是否正确。', owned: (q) => `你已经有 ${q} 张。`, versions: '这张卡的其他版本：', notIt: '不是这张？',
      add: '+1 我有', open: '查看详情', again: '重新扫描', added: (q) => `已添加：你现在有 ${q} 张` },
    inst: { title: '安装 RiftDex', pitch: '像真正的应用一样：主屏幕图标、全屏无浏览器，并且离线可用。', btn: '安装', ios: 'iPhone：点击「分享」（带箭头的方框），然后选择「添加到主屏幕」。', done: 'RiftDex 已安装！从主屏幕打开即可。' },
    adm: { title: '管理', role: '管理员', idPh: '捐助者的 RiftDex ID', activate: '激活', remove: '移除', listTitle: '有效支持者', none: '暂无支持者。', on: '已激活支持者', off: '已移除支持者', badId: 'ID 无效：请从捐助者的「我的账号」中复制。', denied: '被拒绝：Firestore 规则尚未将此账号识别为管理员（请发布新规则）。' },
    support: '支持 RiftDex', supportHint: 'RiftDex 是粉丝制作的免费应用。捐助可以帮助它持续运营，并解锁额外功能（头像、金色边框）。',
    supporter: '支持者', supporterThanks: '感谢你的支持！你的额外功能已激活。',
    myId: '你的 RiftDex ID', myIdHint: '在捐助留言中注明此 ID 即可获得额外功能。', copy: '复制', copiedId: 'ID 已复制',
    avatar: '头像', avatarChange: '更换头像', avatarAdd: '添加头像', avatarRemove: '移除', avatarLocked: '仅限 RiftDex 支持者。', avatarSaved: '头像已保存', avatarRemoved: '头像已移除', avatarErr: '头像保存失败，请重试。', avatarDenied: '头像仅限支持者：你的状态尚未激活。',
    account: '我的账号', accountShort: '账号',
    accountPitch: '登录后，即可在所有设备上同步你的收藏（法语版、英语版和中文版）、心愿单和收藏的系列。不登录时，数据只保存在这部手机上。',
    google: '使用 Google 继续', or: '或', email: '电子邮箱', password: '密码（至少 6 个字符）',
    signIn: '登录', signUp: '创建账号', forgot: '忘记密码？', resetSent: '重置密码邮件已发送',
    signedAs: (e) => `已登录：${e}`, signOut: '退出登录', signedOut: '已退出登录。你的收藏仍保存在这部手机上。',
    welcome: '已登录：你的收藏已同步',
    syncOk: (t) => `收藏已同步${t ? ` · ${t}` : ''}`, syncing: '同步中…', syncErr: '暂时无法同步。你的修改已保存在这部手机上，稍后会自动上传。',
    syncInfo: (n, w) => `已拥有 ${n} 张卡牌或商品，心愿单 ${w} 项（所有版本）：已保存到你的账号。`,
    deleteAcc: '删除我的账号', deleteConfirm: '确认永久删除', deleteNote: '删除你的账号和收藏的云端副本。收藏仍会保留在这部手机上。',
    deleted: '账号已删除',
    authErr: { 'auth/invalid-email': '邮箱地址无效。', 'auth/missing-password': '请输入密码。', 'auth/weak-password': '密码太短：至少 6 个字符。', 'auth/email-already-in-use': '该邮箱已注册账号：请直接登录。', 'auth/invalid-credential': '邮箱或密码错误。', 'auth/wrong-password': '邮箱或密码错误。', 'auth/user-not-found': '没有使用该邮箱的账号。', 'auth/too-many-requests': '尝试次数过多：请几分钟后再试。', 'auth/network-request-failed': '没有网络连接。', 'auth/requires-recent-login': '为了安全，请先退出并重新登录，再删除账号。', 'auth/unauthorized-domain': '该网站尚未在 Firebase 中获得授权（授权域名）。', default: '出错了，请重试。' },
    disclaimer: 'RiftDex 是非官方粉丝应用，与 Riot Games 无关。Riftbound 和英雄联盟是 Riot Games 的商标；卡牌和商品图片归其权利人所有。价格来源：Cardmarket（趋势价，每日更新）。',
    storage: (n, w, e) => `你的${TEXT.zh.ed[e]}版收藏保存在此设备上（已拥有 ${n} 张，心愿单 ${w} 张）。每个版本（法语、英语、中文）都有各自的收藏。导出全部数据以备份或转移到其他手机。`, editionHint: '顶部的 FR · EN · 中文 标签切换的是卡牌版本（系列、卡图、收藏），而不是网站语言。',
    export: '导出我的收藏（复制）', import: '导入备份文件', dataLine: (n, m, d) => `数据：${n} 张卡牌，${m} 个系列 · Cardmarket 价格日期 ${d}。`, close: '关闭',
    copied: '备份已复制', selectCopy: '请选中文字进行复制', imported: '收藏已导入', badFile: '文件无效：请选择 RiftDex 导出文件',
    loadError: '无法加载卡牌', loadErrorHint: '请检查网络连接，然后刷新页面。',
    rarity: { common: '普通', uncommon: '罕见', rare: '稀有', epic: '史诗', showcase: '异画', signature: '签名', promo: '宣传卡' },
    type: { unit: '单位', spell: '法术', legend: '传奇', gear: '装备', battlefield: '战场', rune: '符文', token: '衍生物' },
    domain: { fury: '狂怒', calm: '平静', mind: '心灵', body: '体魄', chaos: '混沌', order: '秩序', colorless: '无色' },
    variant: { alt: '异画', star: '超编号', sig: '签名', extra: '变体' },
  },
};

// ---------- Icônes ----------
const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
  sort: '<svg viewBox="0 0 24 24"><path d="M8 4v16"/><path d="m4 8 4-4 4 4"/><path d="M16 20V4"/><path d="m12 16 4 4 4-4"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  heartSmall: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.5" r="3.8"/></svg>',
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
  person: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  own: '<svg viewBox="0 0 24 24"><rect x="6" y="3.5" width="12" height="17" rx="2"/><path d="m9.5 12 2 2 3.5-4"/></svg>',
  listIcon: '<svg viewBox="0 0 24 24"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg>',
  gridIcon: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  chevron: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M14 4h6v6"/><path d="M20 4 10 14"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
};

// ---------- Raretés & domaines (clés des données) ----------
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'showcase', 'signature', 'promo'];
const RARITY_HEX = { common: '#a4b8aa', uncommon: '#41b4b8', rare: '#c58fdc', epic: '#f0a33a', showcase: '#f0d28c', signature: '#ff6fae', promo: '#8fb3ff' };
const rarityStyle = (r) => (RARITY_HEX[r] ? `style="--rc: var(--r-${r})"` : '');
const DOMAIN_HEX = { fury: '#e5484d', calm: '#3fbf7f', mind: '#3f8cff', body: '#f08a24', chaos: '#9b5cff', order: '#e8c547', colorless: '#9aa3b5' };

// ---------- Stockage local (une collection par édition, préférences) ----------
const KEY = 'riftdex:v1';
const emptyCol = () => ({ owned: {}, wish: [], fav: [] });
const defaults = () => ({ col: { fr: emptyCol(), en: emptyCol(), zh: emptyCol() }, prefs: { lang: 'fr', ui: 'fr', homeMode: 'list', setMode: 'cards', sort: 'num', own: 'all', rarity: null, valueRange: 90 } });
function loadUser() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    const u = JSON.parse(raw);
    const d = defaults();
    const prefs = { ...d.prefs, ...(u.prefs ?? {}) };
    if (prefs.rarity && !RARITIES.includes(prefs.rarity)) prefs.rarity = null;
    const col = {};
    for (const l of LANGS) col[l] = { ...emptyCol(), ...(u.col?.[l] ?? {}) };
    return { ...d, ...u, col, prefs };
  } catch { return defaults(); }
}
const user = loadUser();
let lang = LANGS.includes(user.prefs.lang) ? user.prefs.lang : 'fr'; // édition affichée (cartes, collection)
let ui = LANGS.includes(user.prefs.ui) ? user.prefs.ui : 'fr';       // langue du site (textes)
let C, wish, fav; // collection, souhaits et favoris de l'édition affichée
function useCollection() {
  C = user.col[lang];
  wish = new Set(C.wish);
  fav = new Set(C.fav);
}
useCollection();
// signature de ce qui est synchronisé avec le compte (les trois éditions ; pas les préférences d'affichage)
const colCanon = (col) => JSON.stringify(LANGS.map((l) => [Object.entries(col?.[l]?.owned ?? {}).filter(([, q]) => q > 0).sort(), [...(col?.[l]?.wish ?? [])].sort(), [...(col?.[l]?.fav ?? [])].sort()]));
let lastSig = colCanon(user.col);
function save() {
  C.wish = [...wish]; C.fav = [...fav];
  const sig = colCanon(user.col);
  if (sig !== lastSig) { lastSig = sig; cloudChanged(); }
  try { localStorage.setItem(KEY, JSON.stringify(user)); } catch { /* stockage indisponible */ }
}

// ---------- Langue & formats ----------
let L = TEXT[ui];
let fmt;
function setFormats() {
  const loc = { fr: 'fr-FR', en: 'en-GB', zh: 'zh-CN' }[ui];
  fmt = {
    eur: new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR' }),
    pct: new Intl.NumberFormat(loc, { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' }),
    day: new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short' }),
    date: new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }),
    loc,
  };
}
setFormats();
const eur = (v) => (v == null ? '—' : fmt.eur.format(v));
const pct = (v) => (v == null || !isFinite(v) ? '' : fmt.pct.format(v));
const rarityLabel = (r) => L.rarity[r] ?? r;
const typeLabel = (t) => L.type[t] ?? t;
const domainLabel = (d) => L.domain[d] ?? d;
const cardName = (c) => (lang === 'zh' ? c.nameZh ?? c.nameEn ?? c.name : lang === 'en' ? c.nameEn ?? c.name : c.name);
const setName = (s) => (ui === 'zh' ? s.nameZh ?? s.nameEn : ui === 'en' ? s.nameEn ?? s.name : s.name);
const blockName = (b) => L.blocks[b] ?? b;

// ---------- Données ----------
let catalog = { sets: [], cards: [] };
let priceFile = { prices: {} };
let sealedAll = [];
let config = { cardmarket: { gameSlug: 'Riftbound' } };
const cardsById = new Map();
const cardsBySet = new Map();

async function loadData() {
  const get = (p) => fetch(p, { cache: 'no-cache' }).then((r) => { if (!r.ok) throw new Error(p); return r.json(); });
  let sealedFile;
  [catalog, priceFile, config, sealedFile] = await Promise.all([get('data/catalog.json'), get('data/prices.json'), get('data/config.json').catch(() => config), get('data/sealed.json').catch(() => ({ items: [] }))]);
  renderSupportSide();
  sealedAll = sealedFile.items ?? [];
  for (const it of sealedAll) cardsById.set(it.id, it);
  for (const c of catalog.cards) {
    cardsById.set(c.id, c);
    if (!cardsBySet.has(c.set)) cardsBySet.set(c.set, []);
    cardsBySet.get(c.set).push(c);
  }
  // numéros imprimés d'abord ; les variantes Cardmarket sans numéro à la fin
  const extra = (c) => (c.variant === 'extra' ? 1 : 0);
  for (const list of cardsBySet.values()) list.sort((a, b) => extra(a) - extra(b) || String(a.number).localeCompare(String(b.number), 'en', { numeric: true }));
}

// Ce que montre chaque édition : ses séries, ses cartes, son scellé
// - édition chinoise : seulement les cartes dont Riot publie la version chinoise (image chinoise)
// - promos et coffrets : imprimés en anglais, donc seulement dans l'édition anglaise (langues de la série dans catalog.json)
const inEdition = (c) => (isSealed(c) ? c.lang === lang : !!setOf(c.set)?.langs.includes(lang) && (lang !== 'zh' || !!c.imageZh));
const setCards = (code) => (cardsBySet.get(code) ?? []).filter(inEdition);
const editionSet = (s) => !!s && s.langs.includes(lang) && setCards(s.code).length > 0;
const visibleSets = () => catalog.sets.filter(editionSet);
const editionCards = () => catalog.cards.filter(inEdition);
const sealed = () => sealedAll.filter((s) => s.lang === lang);

const P = (id) => priceFile.prices[id];
const hasPrices = () => Object.keys(priceFile.prices ?? {}).length > 0;
const price = (id) => P(id)?.trend ?? null;
const qty = (id) => C.owned[id] ?? 0;
const setOf = (code) => catalog.sets.find((s) => s.code === code);
const setTotal = (s) => setCards(s.code).length;
const ownedIn = (code) => setCards(code).filter((c) => qty(c.id) > 0).length;
const isSealed = (c) => c.kind === 'sealed';
const itemCode = (c) => c.set ?? '';
const numLabel = (c) => (c.variant === 'extra' ? `${L.variant.extra}${/^V\./.test(c.number ?? '') ? ` ${c.number}` : ''}` : c.number ?? '');
const allItems = () => [...editionCards(), ...sealed()];

function valueAt(hist, day) {
  let v = null;
  for (const [d, p] of hist) { if (d <= day) v = p; else break; }
  return v;
}
function change(id, days) {
  const h = P(id)?.history;
  if (!h || h.length < 2) return null;
  const last = h[h.length - 1];
  const from = new Date(parseDay(last[0]) - days * 864e5).toISOString().slice(0, 10);
  const before = valueAt(h, from) ?? h[0][1];
  return before ? last[1] / before - 1 : null;
}
// Lien Cardmarket : page exacte de la carte, filtrée sur la langue de l'édition ; quand la version n'est pas certaine
// (rareté écrite par Cardmarket), un second lien ouvre la page de toutes les versions de la carte ; produits scellés : recherche.
function cmLinks(card) {
  const site = `https://www.cardmarket.com/${ui === 'fr' ? 'fr' : 'en'}/${config.cardmarket?.gameSlug ?? 'Riftbound'}`;
  const langId = config.cardmarket?.languageIds?.[lang];
  const cm = card.cardmarket ?? {};
  if (!isSealed(card) && cm.path) return { url: `${site}/${cm.path}${langId ? `?language=${langId}` : ''}`, label: L.cmView, all: cm.guess && cm.versions ? `${site}/${cm.versions}` : null };
  if (!isSealed(card) && cm.versions) return { url: `${site}/${cm.versions}`, label: L.cmVersions, all: null };
  const q = isSealed(card) ? String(card.nameEn).replace(/\s*\((Slim|Jumbo)\)$/, '') : card.name;
  return { url: `${site}/Products/Search?searchString=${encodeURIComponent(q)}`, label: L.cmSearch, all: null };
}

// ---------- Images ----------
const artCache = new Map();
function wrap(text, max, maxLines) {
  const lines = [''];
  const cjk = /[㐀-鿿]/.test(text);
  for (const w of cjk ? [...text] : String(text).split(' ')) {
    const next = cjk ? lines[lines.length - 1] + w : (lines[lines.length - 1] + ' ' + w).trim();
    if (next.length > (cjk ? Math.ceil(max / 1.7) : max) && lines.length < maxLines) lines.push(w); else lines[lines.length - 1] = next;
  }
  return lines;
}
function sealedArt(it) {
  const lines = wrap(cardName(it), 18, 4);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2a45"/><stop offset="1" stop-color="#0a0f18"/></linearGradient></defs>
<rect x="110" y="50" width="380" height="500" rx="26" fill="url(#g)" stroke="#c8aa6e" stroke-width="6"/>
<circle cx="300" cy="190" r="70" fill="none" stroke="#0ac8b9" stroke-width="6"/><circle cx="300" cy="190" r="34" fill="#c8aa6e"/>
${lines.map((l, i) => `<text x="300" y="${350 + i * 40}" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="28" fill="#ece6d6">${esc(l)}</text>`).join('')}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
function placeholderArt(card) {
  const k = `${card.id}|${lang}`;
  if (artCache.has(k)) return artCache.get(k);
  if (isSealed(card)) { const u = sealedArt(card); artCache.set(k, u); return u; }
  const c1 = DOMAIN_HEX[card.domains?.[0]] ?? '#0ac8b9';
  const rc = RARITY_HEX[card.rarity] ?? '#a4b8aa';
  const lines = wrap(cardName(card), 16, 3);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 744 1039">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}" stop-opacity=".55"/><stop offset=".55" stop-color="#0f1625"/><stop offset="1" stop-color="#070b14"/></linearGradient></defs>
<rect width="744" height="1039" rx="40" fill="#070b14"/><rect x="22" y="22" width="700" height="995" rx="26" fill="url(#g)" stroke="#c8aa6e" stroke-opacity=".5" stroke-width="4"/>
<text x="56" y="96" font-family="sans-serif" font-weight="700" font-size="44" fill="#ece6d6">${esc(card.set)} · ${esc(numLabel(card))}</text>
${lines.map((l, i) => `<text x="56" y="${240 + i * 76}" font-family="sans-serif" font-weight="700" font-size="64" fill="#ece6d6">${esc(l)}</text>`).join('')}
<polygon points="372,520 478,580 478,700 372,760 266,700 266,580" fill="none" stroke="${rc}" stroke-width="7"/></svg>`;
  const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  artCache.set(k, uri);
  return uri;
}
const imageOf = (c) => (lang === 'zh' && c.imageZh ? c.imageZh : c.image);
function cardImg(card, eager = false) {
  const ph = placeholderArt(card);
  return `<img src="${esc(imageOf(card) || ph)}" alt="${esc(cardName(card))}" ${eager ? '' : 'loading="lazy"'} decoding="async" data-ph="${esc(ph)}">`;
}
// image en échec : un nouvel essai direct sur le serveur, puis le visuel de remplacement
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG' || !img.dataset.ph || img.src === img.dataset.ph) return;
  if (!img.dataset.retried && !img.src.startsWith('data:')) {
    img.dataset.retried = '1';
    const u = new URL(img.src, location.href); u.searchParams.set('r', Date.now());
    img.src = u.href;
  } else img.src = img.dataset.ph;
}, true);

// ---------- Rendu des cartes ----------
function cardTile(c) {
  const q = qty(c.id);
  return `<div class="card ${q ? 'owned' : 'missing'}" data-cid="${esc(c.id)}">
    <button class="card-img" data-open="${esc(c.id)}" aria-label="${esc(cardName(c))}, ${esc(c.set)} ${esc(numLabel(c))}">${cardImg(c)}</button>
    ${price(c.id) != null ? `<span class="price num">${eur(price(c.id))}</span>` : ''}
    <div class="actions">
      <button class="mini-btn heart" data-wish="${esc(c.id)}" aria-pressed="${wish.has(c.id)}" aria-label="${L.wishBtn}">${I.heart}</button>
      <button class="mini-btn own" data-own="${esc(c.id)}" aria-pressed="${q > 0}" aria-label="${L.ownBtn}">${I.own}${q > 1 ? `<span class="qty">${q}</span>` : ''}</button>
    </div>
  </div>`;
}
function sealedTile(it) {
  const q = qty(it.id);
  const code = itemCode(it);
  return `<div class="sealed ${q ? 'owned' : ''}" data-cid="${esc(it.id)}" data-kind="sealed">
    <button class="sealed-img" data-open="${esc(it.id)}" aria-label="${esc(cardName(it))}">${cardImg(it)}</button>
    <div class="sealed-info"><strong>${esc(cardName(it))}</strong><span>${code ? `<b class="print">${esc(code)}</b> · ` : ''}${esc(L.catOne[it.category] ?? '')}</span></div>
    <div class="sealed-foot">
      <span class="sprice num">${price(it.id) != null ? eur(price(it.id)) : `<small>${L.noPrice}</small>`}</span>
      <button class="mini-btn heart" data-wish="${esc(it.id)}" aria-pressed="${wish.has(it.id)}" aria-label="${L.wishBtn}">${I.heart}</button>
      <button class="mini-btn own" data-own="${esc(it.id)}" aria-pressed="${q > 0}" aria-label="${L.ownBtn}">${I.own}${q > 1 ? `<span class="qty">${q}</span>` : ''}</button>
    </div>
  </div>`;
}
function compactTile(c) {
  const q = qty(c.id);
  return `<div class="card ${q ? 'owned' : 'missing'}" data-cid="${esc(c.id)}" data-kind="compact">
    <button class="card-img" data-open="${esc(c.id)}" aria-label="${esc(cardName(c))}">${cardImg(c)}<span class="num-badge num">${esc(numLabel(c))}</span></button>
  </div>`;
}
function cardRow(c, days = 30) {
  const q = qty(c.id);
  const ch = change(c.id, days);
  return `<div class="row" data-cid="${esc(c.id)}" data-kind="row" data-days="${days}">
    <button class="thumb ${isSealed(c) ? 'is-sealed' : ''}" data-open="${esc(c.id)}" aria-label="${esc(cardName(c))}">${cardImg(c)}</button>
    <button class="meta" data-open="${esc(c.id)}">
      <strong>${esc(cardName(c))}</strong>
      <span>${isSealed(c) ? `${itemCode(c) ? `${esc(itemCode(c))} · ` : ''}${esc(L.catOne[c.category] ?? '')}` : `${esc(c.set)} · ${esc(numLabel(c))}${c.rarity ? ` · <span class="rarity" ${rarityStyle(c.rarity)}>${esc(rarityLabel(c.rarity))}</span>` : ''}`}</span>
    </button>
    <div class="rprice num">${eur(price(c.id))}${ch != null ? `<small class="${ch >= 0 ? 'up' : 'down'}">${pct(ch)} ${days} ${L.dayShort}</small>` : ''}</div>
    <button class="mini-btn own" data-own="${esc(c.id)}" aria-pressed="${q > 0}" aria-label="${L.ownBtn}">${I.own}${q > 1 ? `<span class="qty">${q}</span>` : ''}</button>
  </div>`;
}
function refreshCard(id) {
  const c = cardsById.get(id);
  for (const el of document.querySelectorAll(`[data-cid="${CSS.escape(id)}"]`)) {
    if (el.classList.contains('ftile')) continue;
    const kind = el.dataset.kind;
    el.outerHTML = kind === 'row' ? cardRow(c, Number(el.dataset.days) || 30) : kind === 'compact' ? compactTile(c) : kind === 'sealed' ? sealedTile(c) : cardTile(c);
  }
}

// ---------- Vues ----------
const view = document.getElementById('view');
const topbar = document.getElementById('topbar');
let currentRender = () => {};

function setTopbar(html) { topbar.innerHTML = html; }
function seg(name, value, options) {
  return `<div class="seg" role="group">${options.map(([v, label]) => `<button data-seg="${name}" data-value="${v}" aria-pressed="${value === v}">${label}</button>`).join('')}</div>`;
}
function progressRow(s) {
  const total = setTotal(s); const own = ownedIn(s.code);
  const p = total ? own / total : 0;
  return `<a class="set-row" href="#set-${esc(s.code)}">
    <div class="set-head"><span class="set-code">${esc(s.code)}</span><span class="set-name">${esc(setName(s))}</span>
    <span class="set-count num">${own}<small>/${total}</small><b>${Math.floor(p * 100)} %</b></span></div>
    <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
  </a>`;
}
function progressTile(s) {
  const total = setTotal(s); const own = ownedIn(s.code);
  const p = total ? own / total : 0;
  return `<a class="set-tile" href="#set-${esc(s.code)}">
    <div class="set-head"><span class="set-code">${esc(s.code)}</span></div>
    <span class="set-name">${esc(setName(s))}</span>
    <span class="big num">${Math.floor(p * 100)} %</span>
    <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
    <span class="set-meta num"><span>${own}/${total}</span><span>${s.releaseDate ? fmt.date.format(parseDay(s.releaseDate)) : ''}</span></span>
  </a>`;
}

let homeQuery = '';
function homeTopbar(withMode) {
  const mode = user.prefs.homeMode;
  setTopbar(`<h1>${L.home}</h1>${withMode ? `<button class="icon-btn" data-action="home-mode" aria-label="${L.toggleView}">${mode === 'grid' ? I.listIcon : I.gridIcon}</button>` : ''}${accountBtn()}<button class="icon-btn" data-action="settings" aria-label="${L.settings}">${I.gear}</button>`);
}
const homeTabs = (active) => `<div class="seg" role="tablist">${[['home', L.setsTab], ['sealed', L.sealed]].map(([h, l]) => `<button data-nav="${h}" aria-pressed="${active === h}">${l}</button>`).join('')}</div>`;
const langNote = () => (L.langNote(lang) ? `<p class="lang-note">${L.langNote(lang)}</p>` : '');
function renderSealed() {
  homeTopbar(false);
  const updated = priceFile.updatedAt ? fmt.date.format(parseDay(priceFile.updatedAt)) : '';
  const cats = ['booster', 'box', 'case', 'deck', 'kit', 'set'];
  const items = sealed();
  view.innerHTML = `<div class="stack">
    ${homeTabs('sealed')}
    ${items.length ? cats.map((cat) => { const list = items.filter((s) => s.category === cat).sort((a, b) => a.order - b.order); return list.length ? `<h2 class="section-title">${L.cats[cat]}</h2><div class="sealed-grid">${list.map(sealedTile).join('')}</div>` : ''; }).join('') : `<div class="empty"><strong>${L.noSealed}</strong></div>`}
    <p class="note">${L.sealedNote(updated, lang)}</p>
  </div>`;
}
function renderHome() {
  homeTopbar(true);
  const mode = user.prefs.homeMode;
  const q = homeQuery.trim().toLowerCase();
  const sets = visibleSets()
    .filter((s) => !q || [s.name, s.nameEn, s.nameZh, s.code].some((x) => String(x ?? '').toLowerCase().includes(q)))
    .sort((a, b) => (a.block === 'new') - (b.block === 'new') || (a.order ?? 999) - (b.order ?? 999));
  const groups = new Map();
  const favSets = sets.filter((s) => fav.has(s.code));
  if (favSets.length) groups.set(L.favorites, favSets);
  for (const s of [...sets.filter((x) => x.block === 'new'), ...sets.filter((x) => x.block !== 'new')]) { const b = blockName(s.block ?? 'main'); if (!groups.has(b)) groups.set(b, []); groups.get(b).push(s); }
  const body = [...groups].map(([name, list]) => `<details class="block" open>
      <summary>${esc(name)}${I.chevron}</summary>
      ${mode === 'grid' ? `<div class="set-tiles">${list.map(progressTile).join('')}</div>` : `<div class="set-list">${list.map(progressRow).join('')}</div>`}
    </details>`).join('');
  view.innerHTML = `<div class="stack">
    ${installBanner()}
    ${homeTabs('home')}
    ${langNote()}
    <input class="search" id="setSearch" type="search" placeholder="${L.searchSet}" value="${esc(homeQuery)}" autocomplete="off">
    ${body || `<div class="empty"><strong>${L.noSet}</strong></div>`}
  </div>`;
}

let showFilters = false;
const SORTS = ['num', 'price-desc', 'price-asc', 'name'];
function sortCards(list, sort) {
  const l = [...list];
  if (sort === 'price-desc') l.sort((a, b) => (price(b.id) ?? -1) - (price(a.id) ?? -1));
  else if (sort === 'price-asc') l.sort((a, b) => (price(a.id) ?? 1e9) - (price(b.id) ?? 1e9));
  else if (sort === 'name') l.sort((a, b) => cardName(a).localeCompare(cardName(b), fmt.loc));
  return l;
}
function filterCards(list) {
  const { own, rarity } = user.prefs;
  return list.filter((c) => (own === 'all' || (own === 'owned') === qty(c.id) > 0) && (!rarity || c.rarity === rarity));
}
function filtersPanel(list) {
  const { own, rarity, sort } = user.prefs;
  const rs = RARITIES.filter((r) => list.some((c) => c.rarity === r));
  return `<div class="stack" style="gap:8px">
    <div class="chips">${SORTS.map((v) => `<button class="chip" data-pref="sort" data-value="${v}" aria-pressed="${sort === v}">${L.sorts[v]}</button>`).join('')}</div>
    <div class="chips">${['all', 'owned', 'missing'].map((v) => `<button class="chip" data-pref="own" data-value="${v}" aria-pressed="${own === v}">${L.ownF[v]}</button>`).join('')}</div>
    ${rs.length ? `<div class="chips"><button class="chip" data-pref="rarity" data-value="" aria-pressed="${!rarity}">${L.allRarities}</button>${rs.map((r) => `<button class="chip" data-pref="rarity" data-value="${esc(r)}" aria-pressed="${rarity === r}"><span class="rarity" ${rarityStyle(r)}>${esc(rarityLabel(r))}</span></button>`).join('')}</div>` : ''}
  </div>`;
}
function cardsBlock(list, mode) {
  if (!list.length) return `<div class="empty"><strong>${L.noCards}</strong>${L.noCardsHint}</div>`;
  if (mode === 'list') return `<div class="rows">${list.map((c) => cardRow(c)).join('')}</div>`;
  if (mode === 'grid') return `<div class="cards compact">${list.map(compactTile).join('')}</div>`;
  return `<div class="cards">${list.map(cardTile).join('')}</div>`;
}

// recherche dans une série : noms FR/EN/ZH, numéro, rareté (sans accents ni majuscules)
let setQuery = '', setQueryCode = '';
const fold = (t) => String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function matchQuery(c, q) {
  if (!q) return true;
  const hay = fold([c.name, c.nameEn, c.nameZh, c.number, rarityLabel(c.rarity), typeLabel(c.type)].join(' '));
  return fold(q).split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}
function renderSet(code) {
  const s = setOf(code);
  if (!editionSet(s)) { location.hash = '#home'; return; }
  if (setQueryCode !== code) { setQueryCode = code; setQuery = ''; }
  const all = setCards(code);
  const list = sortCards(filterCards(all).filter((c) => matchQuery(c, setQuery)), user.prefs.sort);
  const value = all.reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const full = all.reduce((a, c) => a + (price(c.id) ?? 0), 0);
  const isFiltered = user.prefs.own !== 'all' || user.prefs.rarity;
  setTopbar(`<a class="icon-btn" href="#home" aria-label="${L.back}">${I.back}</a>
    <h1 class="small"><span class="title-code">${esc(s.code)}</span>${esc(setName(s))}</h1>
    <button class="icon-btn ${fav.has(code) ? 'on' : ''}" data-fav="${esc(code)}" aria-pressed="${fav.has(code)}" aria-label="${L.favSet}">${I.star}</button>
    <button class="icon-btn" data-action="cycle-sort" aria-label="${L.changeSort}">${I.sort}</button>
    <button class="icon-btn ${showFilters || isFiltered ? 'on' : ''}" data-action="filters" aria-label="${L.filters}" aria-expanded="${showFilters}">${I.filter}</button>`);
  view.innerHTML = `<div class="stack">
    ${seg('setMode', user.prefs.setMode, [['cards', L.cards], ['list', L.list], ['grid', L.grid]])}
    ${showFilters ? filtersPanel(all) : ''}
    <input class="search" id="setCardSearch" type="search" placeholder="${L.searchInSet}" value="${esc(setQuery)}" autocomplete="off" enterkeyhint="search">
    <div class="toolbar num">
      <span>${L.owned(ownedIn(code), setTotal(s))}</span><span class="grow"></span>
      ${hasPrices() ? `<span>${L.myValue} : <b style="color:var(--fg)">${eur(value)}</b></span>` : `<span>${L.pricesSoon}</span>`}
    </div>
    ${cardsBlock(list, user.prefs.setMode)}
    <p class="note num">${L.setNote(L.sorts[user.prefs.sort], list.length, hasPrices() ? eur(full) : '')}</p>
  </div>`;
}

let colSet = '';
function renderCollection() {
  setTopbar(`<h1>${L.myCollection(lang)}</h1>${cloud.enabled ? `<a class="chip friends-chip" href="#friends">${L.fr.title}<span class="fbadge" data-friends-badge ${fr.requests.length ? '' : 'hidden'}>${fr.requests.length || ''}</span></a>` : ''}`);
  const owned = editionCards().filter((c) => qty(c.id) > 0);
  const ownedSealed = sealed().filter((s) => qty(s.id) > 0);
  if (!owned.length && !ownedSealed.length) {
    view.innerHTML = `<div class="empty"><strong>${L.emptyCol(lang)}</strong>${L.emptyColHint}<a class="btn-ghost" href="#home" style="text-decoration:none">${L.browseSets}</a></div>`;
    return;
  }
  const total = owned.reduce((a, c) => a + qty(c.id), 0);
  const value = [...owned, ...ownedSealed].reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const sealedQty = ownedSealed.reduce((a, s) => a + qty(s.id), 0);
  const sets = visibleSets().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).filter((s) => ownedIn(s.code) > 0);
  const shown = colSet === '__sealed' ? [] : sortCards(owned.filter((c) => !colSet || c.set === colSet), 'price-desc');
  const sealedShown = !colSet || colSet === '__sealed' ? ownedSealed : [];
  view.innerHTML = `<div class="stack">
    <div class="kpis">
      <div class="stat"><small>${L.kCards}</small><b class="num">${total}</b></div>
      <div class="stat"><small>${L.kUnique}</small><b class="num">${owned.length}</b></div>
      <div class="stat"><small>${L.kValue}</small><b class="num">${eur(value)}</b></div>
    </div>
    <div class="chips"><button class="chip" data-colset="" aria-pressed="${!colSet}">${L.all}</button>${ownedSealed.length ? `<button class="chip" data-colset="__sealed" aria-pressed="${colSet === '__sealed'}">${L.sealed} · ${sealedQty}</button>` : ''}${sets.map((s) => `<button class="chip" data-colset="${esc(s.code)}" aria-pressed="${colSet === s.code}">${esc(s.code)} · ${ownedIn(s.code)}</button>`).join('')}</div>
    ${shown.length ? `${seg('setMode', user.prefs.setMode, [['cards', L.cards], ['list', L.list], ['grid', L.grid]])}${cardsBlock(shown, user.prefs.setMode)}` : ''}
    ${sealedShown.length ? `<h2 class="section-title">${L.sealed} · ${L.sealedCount(sealedQty)}</h2><div class="sealed-grid">${sealedShown.map(sealedTile).join('')}</div>` : ''}
  </div>`;
}

function renderWishlist() {
  setTopbar(`<h1>${L.wishlist}</h1>`);
  const list = sortCards([...wish].map((id) => cardsById.get(id)).filter((c) => c && inEdition(c)), 'price-desc');
  if (!list.length) {
    view.innerHTML = `<div class="empty"><strong>${L.emptyWish}</strong>${L.emptyWishHint}</div>`;
    return;
  }
  const missing = list.filter((c) => !qty(c.id));
  const cost = missing.reduce((a, c) => a + (price(c.id) ?? 0), 0);
  view.innerHTML = `<div class="stack">
    <div class="hero-value"><small>${L.wishBudget}</small><strong class="num">${eur(cost)}</strong>
    <span class="note">${L.wishNote(missing.length, list.length)}</span></div>
    <div class="rows">${list.map((c) => cardRow(c)).join('')}</div>
  </div>`;
}

let searchQuery = '';
function renderSearch() {
  setTopbar(`<h1>${L.search}</h1><button class="chip scan-chip" data-action="scan">${I.camera}<span>${L.scan.btn}</span></button>`);
  const q = searchQuery.trim().toLowerCase();
  const res = q.length < 2 ? [] : allItems().filter((c) => [c.name, c.nameEn, c.nameZh, `${itemCode(c)} ${c.number ?? ''}`, `${itemCode(c)}-${c.number ?? ''}`].some((x) => String(x ?? '').toLowerCase().includes(q)));
  view.innerHTML = `<div class="stack">
    <input class="search" id="cardSearch" type="search" placeholder="${L.searchPh}" value="${esc(searchQuery)}" autocomplete="off">
    <div id="searchResults">${q.length < 2 ? `<p class="note">${L.searchHint(editionCards().length, visibleSets().length)}</p>`
      : res.length ? `<p class="note">${L.results(res.length)}</p><div class="rows">${sortCards(res, 'price-desc').slice(0, 150).map((c) => cardRow(c)).join('')}</div>`
      : `<div class="empty"><strong>${L.noResult}</strong></div>`}</div>
  </div>`;
}

function portfolioSeries() {
  const owned = allItems().filter((c) => qty(c.id) > 0 && P(c.id)?.history?.length);
  if (!owned.length) return [];
  // la courbe commence quand toutes les cartes possédées ont un prix (sinon faux saut depuis 0 €)
  const start = owned.reduce((m, c) => (P(c.id).history[0][0] > m ? P(c.id).history[0][0] : m), '');
  const days = new Set();
  for (const c of owned) for (const [d] of P(c.id).history) if (d >= start) days.add(d);
  return [...days].sort().map((d) => [d, Math.round(owned.reduce((a, c) => a + qty(c.id) * (valueAt(P(c.id).history, d) ?? 0), 0) * 100) / 100]);
}
function renderValues() {
  setTopbar(`<h1>${L.market}</h1>`);
  const items = allItems();
  const owned = items.filter((c) => qty(c.id) > 0);
  const value = owned.reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const priced = items.filter((c) => (price(c.id) ?? 0) >= 0.5);
  const movers = priced.map((c) => [c, change(c.id, 7)]).filter(([, v]) => v != null && v !== 0);
  const ups = [...movers].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const downs = [...movers].filter(([, v]) => v < 0).sort((a, b) => a[1] - b[1]).slice(0, 5);
  const top = sortCards(editionCards().filter((c) => price(c.id) != null), 'price-desc').slice(0, 10);
  const updated = priceFile.updatedAt ? fmt.date.format(parseDay(priceFile.updatedAt)) : '—';
  const empty = `<p class="note" style="padding:12px">${L.noHistory}</p>`;
  view.innerHTML = `<div class="stack">
    <section class="panel">
      <div class="hero-value"><small>${L.colValue(lang)}</small><strong class="num">${eur(value)}</strong></div>
      ${owned.length ? '<div class="ranges" id="pfRanges"></div><div class="chart" id="pfChart"></div>' : `<p class="note">${L.colValueHint}</p>`}
      <p class="note">${hasPrices() ? L.pricesNote(updated) : L.noPricesNote}</p>
    </section>
    <h2 class="section-title">${L.risers}</h2>
    <div class="rows">${ups.map(([c]) => cardRow(c, 7)).join('') || empty}</div>
    <h2 class="section-title">${L.fallers}</h2>
    <div class="rows">${downs.map(([c]) => cardRow(c, 7)).join('') || empty}</div>
    <h2 class="section-title">${L.priciest}</h2>
    <div class="rows">${top.map((c) => cardRow(c)).join('') || empty}</div>
  </div>`;
  if (owned.length) mountRangedChart(document.getElementById('pfRanges'), document.getElementById('pfChart'), portfolioSeries(), 'valueRange', true);
}

// ---------- Graphique de prix ----------
const RANGE_DAYS = [7, 30, 90, 365, 0];
function mountRangedChart(rangesEl, chartEl, series, prefKey, hasData) {
  const draw = () => {
    const days = user.prefs[prefKey] ?? 90;
    rangesEl.innerHTML = RANGE_DAYS.map((d, i) => `<button type="button" data-days="${d}" aria-pressed="${days === d}">${L.ranges[i]}</button>`).join('');
    let pts = series;
    if (days && series.length) {
      const last = parseDay(series[series.length - 1][0]);
      const from = new Date(last - days * 864e5).toISOString().slice(0, 10);
      pts = series.filter(([d]) => d >= from);
      if (pts.length < 2) pts = series.slice(-2);
    }
    drawChart(chartEl, pts, hasData);
  };
  rangesEl.onclick = (e) => {
    const b = e.target.closest('[data-days]');
    if (!b) return;
    user.prefs[prefKey] = Number(b.dataset.days); save(); draw();
  };
  draw();
}

function niceTicks(min, max, count = 4) {
  if (min === max) { const d = Math.abs(min) * 0.1 || 1; min -= d; max += d; }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 100) / 100);
  return ticks;
}
let chartSeq = 0;
function drawChart(el, pts, hasData) {
  if (!pts || pts.length < 2) {
    el.innerHTML = `<div class="chart-empty">${hasData ? L.chartWait : L.chartNone}</div>`;
    return;
  }
  const W = Math.max(260, el.clientWidth || 320), H = el.clientHeight || 210;
  const padL = 58, padR = 12, padT = 14, padB = 26;
  const xs = pts.map(([d]) => +parseDay(d));
  const ys = pts.map(([, v]) => v);
  const t0 = xs[0], t1 = xs[xs.length - 1];
  const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
  const y0 = ticks[0], y1 = ticks[ticks.length - 1];
  const X = (t) => padL + ((t - t0) / (t1 - t0 || 1)) * (W - padL - padR);
  const Y = (v) => padT + (1 - (v - y0) / (y1 - y0 || 1)) * (H - padT - padB);
  const line = pts.map((_, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join('');
  const area = `${line}L${X(t1).toFixed(1)},${Y(y0).toFixed(1)}L${X(t0).toFixed(1)},${Y(y0).toFixed(1)}Z`;
  const gid = `ga${++chartSeq}`;
  const xLabels = [0, Math.floor((pts.length - 1) / 2), pts.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const tickFmt = new Intl.NumberFormat(fmt.loc, { style: 'currency', currency: 'EUR', maximumFractionDigits: y1 - y0 < 5 ? 2 : 0 });
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.chartAria(fmt.date.format(t0), fmt.date.format(t1), eur(ys[0]), eur(ys[ys.length - 1])))}">
    <defs><linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--accent)" stop-opacity=".32"/><stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
    <g class="grid">${ticks.map((t) => `<line x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}"/>`).join('')}</g>
    <g class="axis">${ticks.map((t) => `<text x="${padL - 8}" y="${Y(t) + 4}" text-anchor="end">${tickFmt.format(t)}</text>`).join('')}
      ${xLabels.map((i, k, a) => `<text x="${X(xs[i])}" y="${H - 6}" text-anchor="${k === 0 ? 'start' : k === a.length - 1 ? 'end' : 'middle'}">${fmt.day.format(xs[i])}</text>`).join('')}</g>
    <path d="${area}" fill="url(#${gid})"/>
    <path class="line" d="${line}"/>
    ${pts.length <= 12 ? pts.map((_, i) => `<circle class="pt" cx="${X(xs[i])}" cy="${Y(ys[i])}" r="3.5"/>`).join('') : ''}
    <circle class="end" cx="${X(t1)}" cy="${Y(ys[ys.length - 1])}" r="5"/>
    <g class="hover" visibility="hidden"><line class="cross" y1="${padT}" y2="${H - padB}"/><circle class="dot" r="5"/></g>
  </svg><div class="tip num" hidden></div>`;
  const svg = el.querySelector('svg');
  const hover = svg.querySelector('.hover');
  const cross = hover.querySelector('line');
  const dot = hover.querySelector('circle');
  const tip = el.querySelector('.tip');
  const move = (e) => {
    const r = svg.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 1; i < xs.length; i++) if (Math.abs(X(xs[i]) - px) < Math.abs(X(xs[best]) - px)) best = i;
    const cx = X(xs[best]), cy = Y(ys[best]);
    hover.setAttribute('visibility', 'visible');
    cross.setAttribute('x1', cx); cross.setAttribute('x2', cx);
    dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
    tip.hidden = false;
    tip.innerHTML = `<b>${eur(ys[best])}</b>${fmt.date.format(xs[best])}`;
    const left = (cx / W) * r.width;
    const half = tip.offsetWidth / 2;
    tip.style.left = `${Math.min(r.width - half, Math.max(half, left))}px`;
    tip.style.top = `${Math.max(0, (cy / H) * r.height - 52)}px`;
  };
  svg.addEventListener('pointermove', move);
  svg.addEventListener('pointerdown', move);
  svg.addEventListener('pointerleave', () => { hover.setAttribute('visibility', 'hidden'); tip.hidden = true; });
}

// ---------- Fiche carte ----------
const sheet = document.getElementById('sheet');
// haut des panneaux : poignée (téléphone), boutons précédent / suivant (PC) et fermer
const sheetTop = (nav) => `<div class="grab"></div><div class="sheet-tools">${nav ? `<button class="icon-btn nav-btn" data-action="prev" aria-label="${L.prev}">${I.back}</button><button class="icon-btn nav-btn flip" data-action="next" aria-label="${L.next}">${I.back}</button>` : ''}<button class="icon-btn" data-close aria-label="${L.close}">${I.x}</button></div>`;
let navList = [];
function navStep(dir) {
  const i = navList.indexOf(openId);
  const next = navList[i + dir];
  if (i >= 0 && next) openCard(next, true);
}
const sheetPanel = document.getElementById('sheetPanel');
let openId = null;
let lastFocus = null;

function openCard(id, keepNav) {
  const c = cardsById.get(id);
  if (!c) return;
  if (!keepNav) navList = [...new Set([...view.querySelectorAll('[data-open]')].map((e) => e.dataset.open))];
  if (!openId) lastFocus = document.activeElement;
  openId = id; sheetMode = null;
  const s = setOf(c.set);
  const p = P(id) ?? {};
  const ch = change(id, 30);
  const q = qty(id);
  const cm = cmLinks(c);
  const stats = [c.energy != null ? `${L.energy} ${c.energy}` : '', c.might != null ? `${L.might} ${c.might}` : '', c.power != null ? `${L.power} ${c.power}` : ''].filter(Boolean).join(' · ');
  const sealedItem = isSealed(c);
  const enOnly = !sealedItem && s?.block === 'promo' && lang !== 'en';
  const artNote = sealedItem ? '' : c.artApprox ? L.artApprox : !enOnly && (lang === 'fr' || (lang === 'zh' && !c.imageZh)) && c.image ? L.enArt : '';
  const traits = [c.type ? typeLabel(c.type) : '', ...(c.domains ?? []).map(domainLabel)].filter(Boolean).join(' · ');
  sheetPanel.innerHTML = `${sheetTop(navList.length > 1)}
    <div class="stack detail">
      <div class="detail-top ${sealedItem ? 'is-sealed' : ''}" ${rarityStyle(c.rarity)}>
        <div class="card-img">${cardImg(c, true)}</div>
        <div class="detail-info">
          <h2 id="sheetTitle">${esc(cardName(c))}</h2>
          ${sealedItem
            ? `<div class="sub">${esc(L.catOne[c.category] ?? '')}${s ? `<br><b class="print">${esc(s.code)}</b> · ${esc(setName(s))}` : ''}</div>`
            : `<div class="sub">${esc(s ? setName(s) : c.set)}<br><span class="num"><b class="print">${esc(c.set)}</b> · ${esc(numLabel(c))}${s?.total && c.variant !== 'extra' ? `/${s.total}` : ''}</span>${c.variant && c.variant !== 'extra' ? ` <span class="variant">${esc(L.variant[c.variant] ?? c.variant)}</span>` : ''}</div>`}
          ${c.rarity ? `<span class="rarity" ${rarityStyle(c.rarity)}>${esc(rarityLabel(c.rarity))}${traits ? ` · ${esc(traits)}` : ''}</span>` : ''}
          ${stats ? `<span class="sub num">${stats}</span>` : ''}
          ${enOnly && L.enOnly ? `<span class="sub">${L.enOnly}</span>` : ''}
          <div class="big-price num"><small>${L.trend}${p.foil ? ` · <span class="foil">${L.foil}</span>` : ''}</small>${p.trend != null ? eur(p.trend) : `<span style="font-size:18px;color:var(--muted)">${L.noPrice}</span>`}</div>
          ${ch != null ? `<span class="delta num ${ch >= 0 ? 'up' : 'down'}">${pct(ch)} ${L.over30}</span>` : ''}
          ${p.trendFoil ? `<span class="sub num">${esc(L.foilPrice(eur(p.trendFoil)))}</span>` : ''}
          <div class="detail-actions">
            <div class="stepper" role="group" aria-label="${L.copies}">
              <button data-qty="-1" aria-label="${L.removeCopy}">−</button>
              <output class="num" aria-live="polite">${q}</output>
              <button data-qty="1" aria-label="${L.addCopy}">+</button>
            </div>
            <button class="mini-btn heart" style="width:42px;height:42px" data-wish="${esc(id)}" aria-pressed="${wish.has(id)}" aria-label="${L.wishBtn}">${I.heart}</button>
          </div>
        </div>
      </div>
      ${p.trend != null ? `<div class="stats">
        <div class="stat"><small>${L.from}</small><b class="num">${eur(p.low)}</b></div>
        <div class="stat"><small>${L.avg7}</small><b class="num">${eur(p.avg7)}</b></div>
        <div class="stat"><small>${L.avg30}</small><b class="num">${eur(p.avg30)}</b></div>
      </div>` : ''}
      <section class="panel">
        <h3>${L.curve} <small>Cardmarket${priceFile.updatedAt ? ` · ${fmt.date.format(parseDay(priceFile.updatedAt))}` : ''}</small></h3>
        <div class="ranges" id="cardRanges"></div>
        <div class="chart" id="cardChart"></div>
        ${p.seeded && (p.history?.length ?? 0) > 1 ? `<p class="note">${L.seeded}</p>` : ''}
      </section>
      <a class="cta" href="${esc(cm.url)}" target="_blank" rel="noopener">${cm.label} ${I.ext}</a>
      ${cm.all ? `<a class="link-btn cm-all" href="${esc(cm.all)}" target="_blank" rel="noopener">${L.cmAll}</a>` : ''}
      ${q > 0 && p.trend ? `<p class="note num" style="text-align:center">${L.worth(q, eur(q * p.trend))}</p>` : ''}
      ${artNote ? `<p class="note" style="text-align:center">${esc(artNote)}</p>` : ''}
      ${c.artist ? `<p class="note" style="text-align:center">${esc(L.art(c.artist))}</p>` : ''}
    </div>`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
  const ni = navList.indexOf(id);
  for (const [sel, ok] of [['[data-action="prev"]', ni > 0], ['[data-action="next"]', ni >= 0 && ni < navList.length - 1]]) { const b = sheetPanel.querySelector(sel); if (b) b.disabled = !ok; }
  mountRangedChart(document.getElementById('cardRanges'), document.getElementById('cardChart'), p.history ?? [], 'cardRange', p.trend != null);
  sheetPanel.querySelector('.stepper button')?.focus({ preventScroll: true });
}
function closeCard() {
  sheet.hidden = true; openId = null; sheetMode = null;
  document.body.style.overflow = '';
  lastFocus?.focus?.({ preventScroll: true });
}

// ---------- Réglages ----------
function openSettings() {
  openId = null; sheetMode = null;
  sheetPanel.innerHTML = `${sheetTop()}<div class="stack">
    <h2 id="sheetTitle" style="margin:0;font:700 22px var(--font-display)">${L.settings}</h2>
    ${cloud.enabled ? `<button class="btn-ghost acct-row" data-action="account">${I.person}<span>${cloud.user ? esc(L.signedAs(cloud.user.email ?? cloud.user.name ?? '')) : L.account}</span></button>` : ''}
    <div class="panel"><h3>${L.language}</h3>${seg('ui', ui, [['fr', 'Français'], ['en', 'English'], ['zh', '中文']])}<p class="note" style="margin:0">${L.editionHint}</p></div>
    <p class="note">${L.storage(Object.keys(C.owned).length, wish.size, lang)}</p>
    <div class="menu">
      <button class="btn-ghost" data-action="export">${L.export}</button>
      <label class="btn-ghost" for="importFile">${L.import}</label>
      <input id="importFile" type="file" accept="application/json,.json" hidden>
      <textarea id="exportBox" class="search" rows="4" hidden readonly></textarea>
    </div>
    <p class="note">${L.dataLine(editionCards().length, visibleSets().length, priceFile.updatedAt ? fmt.date.format(parseDay(priceFile.updatedAt)) : '—')}</p>
    ${canInstall() ? `<div class="panel"><h3>${L.inst.title}</h3><p class="note" style="margin:0">${installEvt ? L.inst.pitch : L.inst.ios}</p>${installEvt ? `<button class="cta" data-action="install">${L.inst.btn}</button>` : ''}</div>` : ''}
    ${supportUrl() ? `<div class="support-row">${supportLink()}<span class="note">${L.supportHint}</span></div>` : ''}
    <p class="note">${L.disclaimer}</p>
    <button class="btn-ghost" data-action="close">${L.close}</button>
  </div>`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}

// ---------- Compte (Firebase) : collections synchronisées entre appareils ----------
// Activé seulement si data/firebase.json contient la configuration du projet Firebase (voir README).
// Les collections restent enregistrées sur le téléphone (utilisable hors ligne) et la copie du compte est tenue à jour.
// Document users/<uid> : { col: { fr: {owned, wish, fav}, en: {…}, zh: {…} }, app, v, updatedAt }.
const FIREBASE = 'https://www.gstatic.com/firebasejs/12.19.0';
const cloud = { enabled: false, user: null, status: 'off', lastSync: null, dirty: false, timer: null, api: null, unsub: null, error: '', busy: false, confirmDelete: false };
let sheetMode = null; // 'account' quand le panneau du compte est ouvert

async function initCloud() {
  let cfg = null;
  try { const r = await fetch('data/firebase.json', { cache: 'no-cache' }); if (r.ok) cfg = await r.json(); } catch { /* pas de compte */ }
  if (!cfg?.apiKey) return;
  try {
    const [appM, authM, fsM] = await Promise.all(['app', 'auth', 'firestore'].map((m) => import(`${FIREBASE}/firebase-${m}.js`)));
    const app = appM.initializeApp(cfg);
    const auth = authM.getAuth(app);
    auth.languageCode = ui === 'zh' ? 'zh-CN' : ui;
    cloud.api = { app, authM, fsM, auth, db: fsM.getFirestore(app) };
    cloud.enabled = true;
    authM.getRedirectResult(auth).catch((e) => { cloud.error = e.code; refreshAccount(); });
    authM.onAuthStateChanged(auth, onCloudUser);
    refreshAccount();
    if (currentRender === renderCollection || currentRender === renderFriends) currentRender();
  } catch (e) { console.warn('Compte indisponible', e); }
}

const cloudRef = () => cloud.api.fsM.doc(cloud.api.db, 'users', cloud.user.uid);
const cleanCol = (c) => ({ owned: Object.fromEntries(Object.entries(c?.owned ?? {}).filter(([, q]) => q > 0)), wish: [...(c?.wish ?? [])], fav: [...(c?.fav ?? [])] });
function cloudData() { C.wish = [...wish]; C.fav = [...fav]; return { col: Object.fromEntries(LANGS.map((l) => [l, cleanCol(user.col[l])])) }; }
// fusion au premier passage d'un appareil sur un compte : on réunit (quantité max, souhaits et favoris réunis), édition par édition
function unionData(a, b) {
  const col = {};
  for (const l of LANGS) {
    const x = a?.col?.[l] ?? {}, y = b?.col?.[l] ?? {};
    const owned = { ...(x.owned ?? {}) };
    for (const [id, q] of Object.entries(y.owned ?? {})) owned[id] = Math.max(owned[id] ?? 0, q);
    col[l] = { owned, wish: [...new Set([...(x.wish ?? []), ...(y.wish ?? [])])], fav: [...new Set([...(x.fav ?? []), ...(y.fav ?? [])])] };
  }
  return { col };
}
function applyCloudData(d) {
  for (const l of LANGS) user.col[l] = { ...emptyCol(), ...cleanCol(d.col?.[l]) };
  useCollection();
  lastSig = colCanon(user.col);
  try { localStorage.setItem(KEY, JSON.stringify(user)); } catch { /* stockage indisponible */ }
  if (sheet.hidden) currentRender();
  else if (openId) { currentRender(); openCard(openId, true); }
  else { currentRender(); refreshAccount(); }
}
async function pushCloud() {
  if (!cloud.user) return;
  clearTimeout(cloud.timer);
  cloud.status = 'syncing'; refreshAccount();
  try {
    await cloud.api.fsM.setDoc(cloudRef(), { ...cloudData(), app: 'RiftDex', v: 1, updatedAt: cloud.api.fsM.serverTimestamp() });
    cloud.dirty = false; user.pending = false; save();
    cloud.status = 'ok'; cloud.lastSync = new Date(); cloud.error = '';
  } catch (e) { cloud.status = 'error'; cloud.error = e.code ?? ''; }
  refreshAccount();
}
function cloudChanged() {
  if (!cloud.enabled) return;
  user.pending = true;
  if (!cloud.user) return;
  cloud.dirty = true;
  clearTimeout(cloud.timer);
  cloud.timer = setTimeout(pushCloud, 1200);
}
function onCloudUser(u) {
  cloud.unsub?.(); cloud.unsub = null;
  cloud.user = u ? { uid: u.uid, email: u.email, name: u.displayName } : null;
  cloud.confirmDelete = false;
  cloud.supporter = false; cloud.avatar = null;
  if (!u) { cloud.status = 'off'; friendsStop(); renderChromeBadges(); refreshAccount(); if (currentRender === renderFriends || currentRender === renderFriendCurrent) currentRender(); return; }
  cloud.status = 'syncing'; refreshAccount();
  const { fsM } = cloud.api;
  loadProfile(u.uid);
  friendsInit(u.uid);
  let first = true;
  cloud.unsub = fsM.onSnapshot(cloudRef(), async (snap) => {
    if (snap.metadata.hasPendingWrites) return;
    const remote = snap.exists() ? snap.data() : null;
    if (first) {
      first = false;
      const firstTimeHere = user.syncedUid !== u.uid;
      let next;
      if (!remote) next = cloudData();                          // compte neuf : on envoie les collections du téléphone
      else if (firstTimeHere) next = unionData(remote, cloudData()); // nouvel appareil : on réunit les deux
      else if (user.pending) next = cloudData();               // changements faits hors ligne : le téléphone est à jour
      else next = remote;                                       // sinon le compte fait foi
      user.syncedUid = u.uid;
      applyCloudData(next);
      if (!remote || colCanon(next.col) !== colCanon(remote.col)) await pushCloud();
      else { user.pending = false; save(); cloud.status = 'ok'; cloud.lastSync = new Date(); refreshAccount(); }
      return;
    }
    if (cloud.dirty || !remote) return;                        // nos propres changements partent juste après
    applyCloudData(remote);                                     // changement fait sur un autre appareil
    cloud.status = 'ok'; cloud.lastSync = new Date(); refreshAccount();
  }, (e) => { cloud.status = 'error'; cloud.error = e.code ?? ''; refreshAccount(); });
}

const accountBtn = () => (cloud.enabled ? `<button class="icon-btn acct-btn ${cloud.user ? `signed on-${cloud.status}` : ''} ${cloud.supporter ? 'is-supporter' : ''}" data-action="account" aria-label="${L.account}">${cloud.user && cloud.avatar ? `<img class="acct-avatar" src="${esc(cloud.avatar)}" alt="">` : I.person}</button>` : '');

// ---------- Soutien : statut (activé par un administrateur) et photo de profil ----------
// supporters/<uid> { active: true } : lisible par le compte, modifiable seulement par un administrateur (règles Firestore).
// profiles/<uid> { avatar } : petite image (160 px) réservée aux soutiens actifs.
const supportUrl = () => config.support?.url || '';
// Administrateurs : liste dans data/config.json (affichage du panneau) ; la vraie protection est dans firestore.rules
const isAdmin = () => !!cloud.user && (config.admins ?? []).includes(cloud.user.uid);
const admin = { list: null, busy: false, msg: '' };
async function adminLoad() {
  try {
    const snap = await fsx().getDocs(cref('supporters'));
    admin.list = await Promise.all(snap.docs.filter((d) => d.data().active === true).map(async (d) => ({ uid: d.id, pseudo: (await friendName(d.id)).pseudo })));
  } catch (e) { admin.list = []; admin.msg = e?.code === 'permission-denied' ? L.adm.denied : L.fr.error; }
  if (sheetMode === 'account' && !sheet.hidden) openAccount(true);
}
async function adminSet(uid, on) {
  uid = String(uid ?? '').trim();
  if (!/^[A-Za-z0-9]{20,40}$/.test(uid)) { admin.msg = L.adm.badId; openAccount(true); return; }
  admin.busy = true; admin.msg = ''; openAccount(true);
  try {
    if (on) await fsx().setDoc(dref('supporters', uid), { active: true, since: fsx().serverTimestamp() });
    else await fsx().deleteDoc(dref('supporters', uid));
    toast(on ? L.adm.on : L.adm.off);
    if (uid === cloud.user.uid) { cloud.supporter = on; refreshAccount(); }
  } catch (e) { admin.msg = e?.code === 'permission-denied' ? L.adm.denied : L.fr.error; }
  admin.busy = false;
  await adminLoad();
}
function adminPanel() {
  if (!isAdmin()) return '';
  if (admin.list === null) { admin.list = []; adminLoad(); }
  return `<div class="panel admin-panel">
    <h3>${L.adm.title}<small>${L.adm.role}</small></h3>
    <form class="inline-form" id="adminForm"><input class="search" id="adminId" autocomplete="off" placeholder="${L.adm.idPh}"><button class="cta" ${admin.busy ? 'disabled' : ''}>${L.adm.activate}</button></form>
    ${admin.msg ? `<p class="form-err">${esc(admin.msg)}</p>` : ''}
    <span class="note">${L.adm.listTitle} (${admin.list.length})</span>
    ${admin.list.map((a) => `<div class="id-row"><b>${a.pseudo !== '?' ? '@' + esc(a.pseudo) : '—'}</b><code>${esc(a.uid)}</code><button class="chip" data-admin-off="${esc(a.uid)}">${L.adm.remove}</button></div>`).join('') || `<span class="note">${L.adm.none}</span>`}
  </div>`;
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'adminForm') return;
  e.preventDefault();
  adminSet(document.getElementById('adminId').value, true);
});
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-admin-off]');
  if (b) adminSet(b.dataset.adminOff, false);
});
async function loadProfile(uid) {
  const { fsM, db } = cloud.api;
  try { const s = await fsM.getDoc(fsM.doc(db, 'supporters', uid)); if (cloud.user?.uid === uid) cloud.supporter = s.exists() && s.data().active === true; } catch { /* pas de statut */ }
  try { const p = await fsM.getDoc(fsM.doc(db, 'profiles', uid)); if (cloud.user?.uid === uid) cloud.avatar = p.exists() ? p.data().avatar ?? null : null; } catch { /* pas de photo */ }
  refreshAccount();
}
function resizeAvatar(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 160, c = document.createElement('canvas');
      c.width = size; c.height = size;
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      c.getContext('2d').drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      let url = c.toDataURL('image/webp', 0.82);
      if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/jpeg', 0.82);
      resolve(url);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
async function saveAvatar(file) {
  const { fsM, db } = cloud.api;
  try {
    const url = await resizeAvatar(file);
    await fsM.setDoc(fsM.doc(db, 'profiles', cloud.user.uid), { avatar: url, updatedAt: fsM.serverTimestamp() });
    cloud.avatar = url; toast(L.avatarSaved);
  } catch (e) { toast(e?.code === 'permission-denied' ? L.avatarDenied : L.avatarErr); }
  refreshAccount();
}
const supportLink = (cls = 'support-link') => (supportUrl() ? `<a class="${cls}" href="${esc(supportUrl())}" target="_blank" rel="noopener">${I.heartSmall}<span>${L.support}</span></a>` : '');
function refreshAccount() {
  if (cloud.enabled) for (const b of document.querySelectorAll('.acct-btn')) b.outerHTML = accountBtn();
  if (cloud.enabled && !topbar.querySelector('.acct-btn') && topbar.querySelector('[data-action="settings"]')) currentRender();
  if (sheetMode === 'account' && !sheet.hidden) openAccount(true);
}
function authError(code) { return L.authErr[code] ?? L.authErr.default; }
function openAccount(keep) {
  openId = null; sheetMode = 'account';
  const em = keep ? document.getElementById('acctEmail')?.value ?? '' : '';
  const u = cloud.user;
  const time = cloud.lastSync ? new Intl.DateTimeFormat(fmt.loc, { hour: '2-digit', minute: '2-digit' }).format(cloud.lastSync) : '';
  const status = cloud.status === 'ok' ? `<span class="sync ok">● ${L.syncOk(time)}</span>` : cloud.status === 'syncing' ? `<span class="sync wait">● ${L.syncing}</span>` : cloud.status === 'error' ? `<span class="sync err">● ${L.syncErr}</span>` : '';
  const ownedAll = LANGS.reduce((a, l) => a + Object.values(user.col[l].owned).filter((q) => q > 0).length, 0);
  const wishAll = LANGS.reduce((a, l) => a + (l === lang ? wish.size : user.col[l].wish.length), 0);
  sheetPanel.innerHTML = `${sheetTop()}<div class="stack account">
    <h2 id="sheetTitle" style="margin:0;font:700 22px var(--font-display)">${L.account}</h2>
    ${u ? `
      <div class="panel">
        <strong>${esc(L.signedAs(u.email ?? u.name ?? ''))}</strong>
        ${status}
        <span class="note">${L.syncInfo(ownedAll, wishAll)}</span>
      </div>
      <div class="panel profile-panel ${cloud.supporter ? 'is-supporter' : ''}">
        <div class="profile-row">
          <span class="profile-avatar">${cloud.avatar ? `<img src="${esc(cloud.avatar)}" alt="">` : I.person}</span>
          <div class="profile-text">
            <strong>${L.avatar}${cloud.supporter ? ` <span class="supporter-badge">♥ ${L.supporter}</span>` : ''}</strong>
            <span class="note">${cloud.supporter ? L.supporterThanks : L.avatarLocked}</span>
          </div>
        </div>
        ${cloud.supporter ? `<div class="profile-actions">
          <label class="btn-ghost" for="avatarFile">${cloud.avatar ? L.avatarChange : L.avatarAdd}</label>
          <input id="avatarFile" type="file" accept="image/*" hidden>
          ${cloud.avatar ? `<button class="btn-ghost" data-action="avatar-remove">${L.avatarRemove}</button>` : ''}
        </div>` : supportLink('btn-ghost support-btn')}
        <div class="id-row"><span class="note">${L.myId} :</span><code id="myId">${esc(u.uid)}</code><button class="chip" data-action="copy-id">${L.copy}</button></div>
        ${cloud.supporter ? '' : `<span class="note">${L.myIdHint}</span>`}
      </div>
      ${adminPanel()}
      <a class="btn-ghost" style="text-align:center;text-decoration:none" href="#friends" data-close>${L.fr.mine}${fr.requests.length ? ` · ${L.fr.requests} (${fr.requests.length})` : ''}</a>
      <button class="btn-ghost" data-action="signout">${L.signOut}</button>
      <div class="panel danger-zone">
        <span class="note">${L.deleteNote}</span>
        <button class="btn-ghost btn-danger" data-action="delete-account">${cloud.confirmDelete ? L.deleteConfirm : L.deleteAcc}</button>
      </div>` : `
      <p class="note">${L.accountPitch}</p>
      <button class="btn-ghost btn-google" data-action="google" ${cloud.busy ? 'disabled' : ''}><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>${L.google}</button>
      <div class="divider"><span>${L.or}</span></div>
      <form class="stack" id="acctForm" style="gap:10px">
        <input class="search" id="acctEmail" type="email" autocomplete="email" placeholder="${L.email}" value="${esc(em)}" required>
        <input class="search" id="acctPass" type="password" autocomplete="current-password" placeholder="${L.password}" minlength="6">
        <div class="acct-actions">
          <button class="cta" type="submit" data-mode="in" ${cloud.busy ? 'disabled' : ''}>${L.signIn}</button>
          <button class="btn-ghost" type="submit" data-mode="up" ${cloud.busy ? 'disabled' : ''}>${L.signUp}</button>
        </div>
        <button class="link-btn" type="button" data-action="forgot">${L.forgot}</button>
      </form>`}
    ${cloud.error && !u ? `<p class="form-err" role="alert">${esc(authError(cloud.error))}</p>` : ''}
    ${supportUrl() && !u ? `<div class="support-row">${supportLink()}<span class="note">${L.supportHint}</span></div>` : ''}
    <button class="btn-ghost" data-action="close">${L.close}</button>
  </div>`;
  sheet.hidden = false;
  document.body.style.overflow = 'hidden';
}
async function cloudAction(fn, okMsg) {
  cloud.busy = true; cloud.error = ''; refreshAccount();
  try { await fn(); if (okMsg) toast(okMsg); } catch (e) { cloud.error = e.code ?? 'default'; }
  cloud.busy = false; refreshAccount();
}
function signInGoogle() {
  const { authM, auth } = cloud.api;
  auth.languageCode = ui === 'zh' ? 'zh-CN' : ui;
  const provider = new authM.GoogleAuthProvider();
  return cloudAction(async () => {
    try { await authM.signInWithPopup(auth, provider); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) await authM.signInWithRedirect(auth, provider);
      else if (e.code !== 'auth/popup-closed-by-user') throw e;
    }
  }, null);
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'acctForm') return;
  e.preventDefault();
  const { authM, auth } = cloud.api;
  const email = document.getElementById('acctEmail').value.trim();
  const pass = document.getElementById('acctPass').value;
  const up = e.submitter?.dataset.mode === 'up';
  cloudAction(() => (up ? authM.createUserWithEmailAndPassword(auth, email, pass) : authM.signInWithEmailAndPassword(auth, email, pass)), L.welcome);
});

let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 1800);
}

// ---------- Amis : pseudo, demandes, liste d'amis et collection d'un ami ----------
// Firestore : handles/<pseudo> {uid} (pseudo unique), publicProfiles/<uid> {pseudo},
// friendRequests/<destinataire>/from/<expéditeur> {pseudo, at}, friends/<uid>/list/<ami> {since}.
// Les règles Firestore n'autorisent la lecture d'une collection qu'aux amis acceptés.
const PSEUDO_RE = /^[a-z0-9_.-]{3,20}$/;
const fr = { me: null, list: [], requests: [], unsub: [], names: new Map(), view: null, filter: 'all', busy: false, msg: '', confirmRemove: null };
const fsx = () => cloud.api.fsM;
const dref = (...p) => fsx().doc(cloud.api.db, ...p);
const cref = (...p) => fsx().collection(cloud.api.db, ...p);
async function friendName(uid) {
  if (fr.names.has(uid)) return fr.names.get(uid);
  let info = { pseudo: '?', avatar: null };
  try { const s = await fsx().getDoc(dref('publicProfiles', uid)); if (s.exists()) info.pseudo = s.data().pseudo; } catch { /* inconnu */ }
  fr.names.set(uid, info);
  return info;
}
function friendsStop() { fr.unsub.forEach((f) => f?.()); fr.unsub = []; fr.me = null; fr.list = []; fr.requests = []; fr.view = null; }
async function friendsInit(uid) {
  friendsStop();
  try { const s = await fsx().getDoc(dref('publicProfiles', uid)); fr.me = s.exists() ? s.data() : null; } catch { fr.me = null; }
  const refresh = () => { renderChromeBadges(); if (currentRender === renderFriends) renderFriends(); };
  fr.unsub.push(fsx().onSnapshot(cref('friends', uid, 'list'), async (snap) => {
    fr.list = await Promise.all(snap.docs.map(async (d) => ({ uid: d.id, ...(await friendName(d.id)) })));
    fr.list.sort((a, b) => a.pseudo.localeCompare(b.pseudo));
    refresh();
  }, () => {}));
  fr.unsub.push(fsx().onSnapshot(cref('friendRequests', uid, 'from'), (snap) => {
    fr.requests = snap.docs.map((d) => ({ uid: d.id, pseudo: d.data().pseudo ?? '?' }));
    refresh();
  }, () => {}));
  refresh();
}
function renderChromeBadges() {
  const n = fr.requests.length;
  for (const el of document.querySelectorAll('[data-friends-badge]')) { el.textContent = n || ''; el.hidden = !n; }
}
async function friendsAction(fn, okMsg) {
  fr.busy = true; fr.msg = ''; if (currentRender === renderFriends) renderFriends();
  try { await fn(); if (okMsg) toast(okMsg); } catch (e) { fr.msg = e.userMsg ?? (e?.code === 'permission-denied' ? L.fr.denied : L.fr.error); }
  fr.busy = false; if (currentRender === renderFriends) renderFriends();
}
const userErr = (msg) => Object.assign(new Error(msg), { userMsg: msg });
function setPseudo(raw) {
  return friendsAction(async () => {
    const p = String(raw ?? '').trim().toLowerCase();
    if (!PSEUDO_RE.test(p)) throw userErr(L.fr.pseudoRule);
    const taken = await fsx().getDoc(dref('handles', p));
    if (taken.exists() && taken.data().uid !== cloud.user.uid) throw userErr(L.fr.pseudoTaken);
    const b = fsx().writeBatch(cloud.api.db);
    if (fr.me?.pseudo && fr.me.pseudo !== p) b.delete(dref('handles', fr.me.pseudo));
    b.set(dref('handles', p), { uid: cloud.user.uid });
    b.set(dref('publicProfiles', cloud.user.uid), { pseudo: p });
    await b.commit();
    fr.me = { pseudo: p };
  }, L.fr.pseudoSaved);
}
function sendRequest(raw) {
  return friendsAction(async () => {
    const p = String(raw ?? '').trim().toLowerCase().replace(/^@/, '');
    if (!PSEUDO_RE.test(p)) throw userErr(L.fr.pseudoRule);
    const h = await fsx().getDoc(dref('handles', p));
    if (!h.exists()) throw userErr(L.fr.notFound(p));
    const to = h.data().uid;
    if (to === cloud.user.uid) throw userErr(L.fr.self);
    if (fr.list.some((f) => f.uid === to)) throw userErr(L.fr.already(p));
    // s'il m'a déjà envoyé une demande, on accepte directement
    if (fr.requests.some((r) => r.uid === to)) { await acceptRaw(to); return; }
    await fsx().setDoc(dref('friendRequests', to, 'from', cloud.user.uid), { pseudo: fr.me.pseudo, at: fsx().serverTimestamp() });
  }, L.fr.sent);
}
async function acceptRaw(other) {
  const me = cloud.user.uid, b = fsx().writeBatch(cloud.api.db), since = fsx().serverTimestamp();
  b.set(dref('friends', me, 'list', other), { since });
  b.set(dref('friends', other, 'list', me), { since });
  b.delete(dref('friendRequests', me, 'from', other));
  await b.commit();
}
const acceptRequest = (other) => friendsAction(() => acceptRaw(other), L.fr.accepted);
const declineRequest = (other) => friendsAction(() => fsx().deleteDoc(dref('friendRequests', cloud.user.uid, 'from', other)), null);
function removeFriend(other) {
  return friendsAction(async () => {
    const me = cloud.user.uid, b = fsx().writeBatch(cloud.api.db);
    b.delete(dref('friends', me, 'list', other));
    b.delete(dref('friends', other, 'list', me));
    await b.commit();
    fr.confirmRemove = null;
  }, L.fr.removed);
}
// à la suppression du compte : on retire pseudo, profil public et amitiés (au mieux)
async function friendsCleanup(uid) {
  try {
    const b = fsx().writeBatch(cloud.api.db);
    if (fr.me?.pseudo) b.delete(dref('handles', fr.me.pseudo));
    b.delete(dref('publicProfiles', uid));
    for (const f of fr.list) { b.delete(dref('friends', uid, 'list', f.uid)); b.delete(dref('friends', f.uid, 'list', uid)); }
    await b.commit();
  } catch { /* au mieux */ }
}

function renderFriends() {
  setTopbar(`<h1>${L.fr.title}</h1>`);
  if (!cloud.enabled) { view.innerHTML = `<div class="empty"><strong>${L.fr.title}</strong>${L.fr.noCloud}</div>`; return; }
  if (!cloud.user) { view.innerHTML = `<div class="empty"><strong>${L.fr.title}</strong>${L.fr.gate}<button class="cta" style="width:auto;padding:14px 28px" data-action="account">${L.signIn}</button></div>`; return; }
  const err = fr.msg ? `<p class="form-err" role="alert">${esc(fr.msg)}</p>` : '';
  if (!fr.me?.pseudo) {
    view.innerHTML = `<div class="stack friends">
      <section class="panel"><h3>${L.fr.choose}</h3><p class="note" style="margin:0">${L.fr.chooseHint}</p>
        <form class="inline-form" id="pseudoForm"><input class="search" id="pseudoInput" maxlength="20" autocomplete="off" placeholder="${L.fr.pseudoPh}"><button class="cta" ${fr.busy ? 'disabled' : ''}>${L.fr.save}</button></form>${err}</section>
    </div>`;
    return;
  }
  view.innerHTML = `<div class="stack friends">
    <section class="panel">
      <h3>${L.fr.add}<small>${L.fr.yourPseudo} <b class="pseudo">@${esc(fr.me.pseudo)}</b></small></h3>
      <form class="inline-form" id="addFriendForm"><input class="search" id="friendInput" maxlength="21" autocomplete="off" placeholder="${L.fr.addPh}"><button class="cta" ${fr.busy ? 'disabled' : ''}>${L.fr.send}</button></form>
      ${err}<p class="note" style="margin:0">${L.fr.privacy}</p>
    </section>
    ${fr.requests.length ? `<h2 class="section-title">${L.fr.requests} (${fr.requests.length})</h2>
    <div class="rows">${fr.requests.map((r) => `<div class="row friend-row"><span class="f-avatar">${esc(r.pseudo[0]?.toUpperCase() ?? '?')}</span><div class="meta"><strong>@${esc(r.pseudo)}</strong><span>${L.fr.wants}</span></div>
      <button class="chip" data-fr="accept" data-uid="${esc(r.uid)}">${L.fr.accept}</button><button class="chip" data-fr="decline" data-uid="${esc(r.uid)}">${L.fr.decline}</button></div>`).join('')}</div>` : ''}
    <h2 class="section-title">${L.fr.mine} (${fr.list.length})</h2>
    ${fr.list.length ? `<div class="rows">${fr.list.map((f) => `<div class="row friend-row"><span class="f-avatar">${esc(f.pseudo[0]?.toUpperCase() ?? '?')}</span>
      <a class="meta" href="#friend-${esc(f.uid)}"><strong>@${esc(f.pseudo)}</strong><span>${L.fr.see}</span></a>
      <a class="chip" href="#friend-${esc(f.uid)}">${L.fr.open}</a>
      <button class="chip ${fr.confirmRemove === f.uid ? 'danger' : ''}" data-fr="remove" data-uid="${esc(f.uid)}">${fr.confirmRemove === f.uid ? L.fr.confirm : L.fr.remove}</button></div>`).join('')}</div>`
    : `<div class="empty" style="padding:24px 12px"><strong>${L.fr.none}</strong>${L.fr.noneHint}</div>`}
  </div>`;
}

async function renderFriend(uid) {
  setTopbar(`<a class="icon-btn" href="#friends" aria-label="${L.back}">${I.back}</a><h1 class="small">${L.fr.title}</h1>`);
  if (!cloud.user) { renderFriends(); return; }
  if (fr.view?.uid !== uid) {
    view.innerHTML = `<div class="empty"><strong>${L.fr.loading}</strong></div>`;
    try {
      const [snap, name] = await Promise.all([fsx().getDoc(dref('users', uid)), friendName(uid)]);
      let avatar = null;
      try { const p = await fsx().getDoc(dref('profiles', uid)); avatar = p.exists() ? p.data().avatar : null; } catch { /* pas de photo */ }
      fr.view = { uid, pseudo: name.pseudo, avatar, col: snap.exists() ? snap.data().col ?? {} : {} };
    } catch (e) {
      view.innerHTML = `<div class="empty"><strong>${L.fr.cantSee}</strong>${L.fr.cantSeeHint}<a class="btn-ghost" href="#friends" style="text-decoration:none">${L.back}</a></div>`;
      return;
    }
    if (currentRender !== renderFriendCurrent) return;
  }
  const v = fr.view;
  const theirCol = { owned: v.col[lang]?.owned ?? {}, wish: v.col[lang]?.wish ?? [] }; // même édition que celle affichée
  const theirs = allItems().filter((c) => (theirCol.owned[c.id] ?? 0) > 0);
  const value = theirs.reduce((a, c) => a + (theirCol.owned[c.id] ?? 0) * (price(c.id) ?? 0), 0);
  const total = theirs.reduce((a, c) => a + (theirCol.owned[c.id] ?? 0), 0);
  const wishCards = theirCol.wish.map((id) => cardsById.get(id)).filter((c) => c && inEdition(c));
  const lists = {
    all: theirs,
    trade: theirs.filter((c) => !qty(c.id)),                 // il l'a, pas moi
    give: wishCards.filter((c) => qty(c.id) > 0),             // il la cherche, je l'ai
    wish: wishCards,
  };
  const shown = sortCards(lists[fr.filter] ?? theirs, 'price-desc');
  setTopbar(`<a class="icon-btn" href="#friends" aria-label="${L.back}">${I.back}</a>
    <h1 class="small friend-title">${v.avatar ? `<img src="${esc(v.avatar)}" alt="">` : `<span class="f-avatar">${esc(v.pseudo[0]?.toUpperCase() ?? '?')}</span>`}@${esc(v.pseudo)}</h1>`);
  view.innerHTML = `<div class="stack">
    <div class="kpis">
      <div class="stat"><small>${L.kCards}</small><b class="num">${total}</b></div>
      <div class="stat"><small>${L.kUnique}</small><b class="num">${theirs.length}</b></div>
      <div class="stat"><small>${L.kValue}</small><b class="num">${eur(value)}</b></div>
    </div>
    <div class="chips">${[['all', L.fr.fAll(lang)], ['trade', L.fr.fTrade], ['give', L.fr.fGive], ['wish', L.fr.fWish]].map(([k, l]) => `<button class="chip" data-frf="${k}" aria-pressed="${fr.filter === k}">${l} · ${lists[k].length}</button>`).join('')}</div>
    ${shown.length ? `<div class="cards">${shown.map((c) => friendTile(c, theirCol)).join('')}</div>` : `<div class="empty"><strong>${L.noCards}</strong>${L.fr.emptyFilter}</div>`}
  </div>`;
}
let renderFriendCurrent = null;
function friendTile(c, v) {
  const q = v.owned[c.id] ?? 0, mine = qty(c.id);
  const tag = mine ? `<span class="ftag own">${L.fr.tagMine}</span>` : (wish.has(c.id) ? `<span class="ftag want">${L.fr.tagWant}</span>` : '');
  return `<div class="card ${q ? 'owned' : 'missing'} ftile" data-cid="${esc(c.id)}">
    <button class="${isSealed(c) ? 'sealed-img' : 'card-img'}" data-open="${esc(c.id)}" aria-label="${esc(cardName(c))}">${cardImg(c)}</button>
    ${price(c.id) != null ? `<span class="price num">${eur(price(c.id))}</span>` : ''}
    <div class="fmeta">${q > 1 ? `<span class="ftag">×${q}</span>` : ''}${tag}</div>
  </div>`;
}
document.addEventListener('submit', (e) => {
  if (e.target.id === 'pseudoForm') { e.preventDefault(); setPseudo(document.getElementById('pseudoInput').value); }
  else if (e.target.id === 'addFriendForm') { e.preventDefault(); sendRequest(document.getElementById('friendInput').value); }
});
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-fr],[data-frf]');
  if (!a) return;
  if (a.dataset.frf) { fr.filter = a.dataset.frf; currentRender(); return; }
  const uid = a.dataset.uid;
  if (a.dataset.fr === 'accept') acceptRequest(uid);
  else if (a.dataset.fr === 'decline') declineRequest(uid);
  else if (a.dataset.fr === 'remove') { if (fr.confirmRemove !== uid) { fr.confirmRemove = uid; renderFriends(); } else removeFriend(uid); }
});

// ---------- Installation comme une vraie appli (plein écran, icône, hors ligne) ----------
let installEvt = null;
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canInstall = () => !isStandalone() && (!!installEvt || isIOS());
const installDismissed = () => { try { return localStorage.getItem('riftdex:installDismissed') === '1'; } catch { return false; } };
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; if (currentRender === renderHome) currentRender(); });
addEventListener('appinstalled', () => { installEvt = null; document.getElementById('installBanner')?.remove(); toast(L.inst.done); });
function installBanner() {
  if (!canInstall() || installDismissed()) return '';
  return `<div class="install-banner" id="installBanner">
    <img src="icons/icon-192.png" alt="" width="44" height="44">
    <div class="install-text"><strong>${L.inst.title}</strong><span>${installEvt ? L.inst.pitch : L.inst.ios}</span></div>
    ${installEvt ? `<button class="cta install-go" data-action="install">${L.inst.btn}</button>` : ''}
    <button class="icon-btn install-x" data-action="install-dismiss" aria-label="${L.close}">${I.x}</button>
  </div>`;
}
async function doInstall() {
  if (!installEvt) { toast(L.inst.ios); return; }
  installEvt.prompt();
  try { const r = await installEvt.userChoice; if (r.outcome === 'accepted') toast(L.inst.done); } catch { /* fermé */ }
  installEvt = null;
  document.getElementById('installBanner')?.remove();
  if (sheetMode === null && !sheet.hidden) openSettings();
}

// ---------- Scanner de cartes : caméra + reconnaissance sur le téléphone (aucune photo envoyée) ----------
// Chaque image de carte a une empreinte 9 × 12 (data/scan-index.json, faite par scripts/make_scan_index.py).
// L'image du cadre-guide est réduite à 90 × 120, puis comparée sous 7 cadrages légèrement décalés.
const SCAN = { RW: 90, RH: 120, GW: 9, GH: 12, MIN: 0.66, VARIANTS: [[0, 0, 0], [-3, 0, 0], [3, 0, 0], [0, -4, 0], [0, 4, 0], [0, 0, 3], [0, 0, 6]] };
const scan = { index: null, stream: null, timer: 0, last: null, paused: false, track: null, torch: false, res: null, pick: null };
function scanNorm(b) {
  const v = new Float32Array(b.length);
  for (let c = 0; c < 3; c++) { let m = 0; for (let i = c; i < b.length; i += 3) m += b[i]; m /= b.length / 3; for (let i = c; i < b.length; i += 3) v[i] = b[i] - m; }
  let s = 0; for (const x of v) s += x * x; s = Math.sqrt(s) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= s;
  return v;
}
// moyenne de chaque case d'une grille 9 × 12 sur un rectangle de l'image 90 × 120 (pixels RVBA du canvas)
function scanFeature(px, x, y, w, h) {
  const { GW, GH, RW } = SCAN, out = new Float32Array(GW * GH * 3);
  for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
    const x0 = Math.floor(x + (gx * w) / GW), x1 = Math.max(x0 + 1, Math.floor(x + ((gx + 1) * w) / GW));
    const y0 = Math.floor(y + (gy * h) / GH), y1 = Math.max(y0 + 1, Math.floor(y + ((gy + 1) * h) / GH));
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { const i = (yy * RW + xx) * 4; r += px[i]; g += px[i + 1]; b += px[i + 2]; n++; }
    const o = (gy * GW + gx) * 3; out[o] = Math.floor(r / n); out[o + 1] = Math.floor(g / n); out[o + 2] = Math.floor(b / n);
  }
  return scanNorm(out);
}
async function scanLoadIndex() {
  if (scan.index) return;
  const j = await fetch('data/scan-index.json').then((r) => r.json());
  // seulement les cartes de l'édition affichée
  scan.index = j.items.filter(([id]) => { const c = cardsById.get(id); return c && inEdition(c); }).map(([id, b64]) => [id, scanNorm(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)))]);
}
function scanMatch(px) {
  const best = new Map();
  for (const [dx, dy, z] of SCAN.VARIANTS) {
    const x = Math.max(0, dx + z), y = Math.max(0, dy + Math.round((z * 4) / 3));
    const w = Math.min(SCAN.RW - x, SCAN.RW - 2 * z), h = Math.min(SCAN.RH - y, SCAN.RH - Math.round((2 * z * 4) / 3));
    const v = scanFeature(px, x, y, w, h);
    for (const [id, iv] of scan.index) {
      let d = 0; for (let i = 0; i < v.length; i++) d += v[i] * iv[i];
      if (!best.has(id) || d > best.get(id)) best.set(id, d);
    }
  }
  return [...best].sort((a, b) => b[1] - a[1]);
}
const scanCanvas = () => { const c = document.createElement('canvas'); c.width = SCAN.RW; c.height = SCAN.RH; return c; };

function openScanner() {
  closeScanner();
  const el = document.createElement('div');
  el.className = 'scanner'; el.id = 'scanner';
  el.innerHTML = `<video id="scanVideo" playsinline muted autoplay></video>
    <div class="scan-shade"></div>
    <div class="scan-guide" id="scanGuide"><i></i><i></i><i></i><i></i></div>
    <div class="scan-top">
      <button class="icon-btn" data-scan="close" aria-label="${L.close}">${I.x}</button>
      <strong>${L.scan.title}</strong>
      <button class="icon-btn" data-scan="torch" id="scanTorch" hidden aria-label="${L.scan.torch}">${I.bolt}</button>
    </div>
    <div class="scan-panel" id="scanPanel"><p class="scan-status">${L.scan.starting}</p></div>
    <input id="scanFile" type="file" accept="image/*" hidden>`;
  document.body.appendChild(el);
  document.body.style.overflow = 'hidden';
  scan.paused = false; scan.last = null; scan.res = null; scan.pick = null;
  scanStart();
}
async function scanStart() {
  const panel = () => document.getElementById('scanPanel');
  try { await scanLoadIndex(); } catch { if (panel()) panel().innerHTML = `<p class="scan-status">${L.scan.indexErr}</p>`; return; }
  if (!navigator.mediaDevices?.getUserMedia) { scanNoCamera(L.scan.noCamera); return; }
  try {
    scan.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (e) { scanNoCamera(e?.name === 'NotAllowedError' ? L.scan.denied : L.scan.noCamera); return; }
  const video = document.getElementById('scanVideo');
  if (!video) { scanStopStream(); return; }
  video.srcObject = scan.stream;
  scan.track = scan.stream.getVideoTracks()[0];
  try { if (scan.track.getCapabilities?.().torch) document.getElementById('scanTorch').hidden = false; } catch { /* pas de lampe */ }
  if (panel()) panel().innerHTML = `<p class="scan-status">${L.scan.aim}</p><button class="btn-ghost scan-photo" data-scan="photo">${L.scan.photo}</button>`;
  const canvas = scanCanvas(), ctx = canvas.getContext('2d', { willReadFrequently: true });
  scan.timer = setInterval(() => {
    if (scan.paused || !video.videoWidth) return;
    const g = document.getElementById('scanGuide').getBoundingClientRect(), vr = video.getBoundingClientRect();
    // la vidéo est affichée en « cover » : on retrouve la zone du guide dans l'image de la caméra
    const k = Math.max(vr.width / video.videoWidth, vr.height / video.videoHeight);
    const ox = (video.videoWidth * k - vr.width) / 2, oy = (video.videoHeight * k - vr.height) / 2;
    const sx = (g.left - vr.left + ox) / k, sy = (g.top - vr.top + oy) / k, sw = g.width / k, sh = g.height / k;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SCAN.RW, SCAN.RH);
    const res = scanMatch(ctx.getImageData(0, 0, SCAN.RW, SCAN.RH).data);
    const [id, score] = res[0];
    const name = cardsById.get(id)?.name;
    const status = document.querySelector('#scanPanel .scan-status');
    if (score >= SCAN.MIN) {
      if (scan.last === name) { scanFound(res, false); return; }
      scan.last = name;
      if (status) status.textContent = L.scan.holding;
    } else { scan.last = null; if (status) status.textContent = L.scan.aim; }
  }, 350);
}
function scanNoCamera(msg) {
  const p = document.getElementById('scanPanel');
  if (p) p.innerHTML = `<p class="scan-status">${msg}</p><button class="cta scan-photo" data-scan="photo">${L.scan.photo}</button>`;
}
function scanFromFile(file) {
  const img = new Image();
  img.onload = () => {
    const c = scanCanvas(), ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, SCAN.RW, SCAN.RH);
    URL.revokeObjectURL(img.src);
    scanFound(scanMatch(ctx.getImageData(0, 0, SCAN.RW, SCAN.RH).data), true);
  };
  img.src = URL.createObjectURL(file);
}
function scanFound(res, fromPhoto) {
  scan.paused = true; scan.res = res; scan.pick = res[0][0];
  navigator.vibrate?.(40);
  scanRenderResult(fromPhoto && res[0][1] < SCAN.MIN);
}
function scanRenderResult(unsure) {
  const p = document.getElementById('scanPanel');
  if (!p || !scan.res) return;
  const c = cardsById.get(scan.pick);
  const scores = new Map(scan.res);
  // autres versions de la même carte (illustrations alternatives, hors-séries, promos) puis autres cartes proches
  const versions = editionCards().filter((x) => x.name === c.name && x.id !== c.id).sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0)).slice(0, 8);
  const others = [];
  for (const [id] of scan.res) { const x = cardsById.get(id); if (x && x.name !== c.name && !others.some((o) => o.name === x.name)) others.push(x); if (others.length >= 2) break; }
  const q = qty(c.id);
  const chip = (x) => `<button class="chip" data-scan-pick="${esc(x.id)}">${esc(itemCode(x))} · ${esc(numLabel(x))}</button>`;
  p.innerHTML = `<div class="scan-result">
      <button class="scan-thumb" data-scan="open">${cardImg(c, true)}</button>
      <div class="scan-info">
        <strong>${esc(cardName(c))}</strong>
        <span class="num"><b class="print">${esc(itemCode(c))}</b> · ${esc(numLabel(c))}${c.rarity ? ` · ${esc(rarityLabel(c.rarity))}` : ''}</span>
        <span class="num scan-price">${price(c.id) != null ? eur(price(c.id)) : L.noPrice}</span>
        ${unsure ? `<span class="note">${L.scan.unsure}</span>` : ''}
        ${q ? `<span class="note">${L.scan.owned(q)}</span>` : ''}
      </div>
    </div>
    ${versions.length ? `<div class="scan-alt"><span class="note">${L.scan.versions}</span><div class="chips">${versions.map(chip).join('')}</div></div>` : ''}
    ${others.length ? `<div class="scan-alt"><span class="note">${L.scan.notIt}</span><div class="chips">${others.map((x) => `<button class="chip" data-scan-pick="${esc(x.id)}">${esc(cardName(x))}</button>`).join('')}</div></div>` : ''}
    <div class="scan-actions">
      <button class="cta" data-scan="add">${L.scan.add}</button>
      <button class="btn-ghost" data-scan="open">${L.scan.open}</button>
      <button class="btn-ghost" data-scan="wish" aria-pressed="${wish.has(c.id)}">${wish.has(c.id) ? '♥' : '♡'}</button>
      <button class="btn-ghost" data-scan="again">${L.scan.again}</button>
    </div>`;
}
function scanStopStream() {
  clearInterval(scan.timer); scan.timer = 0;
  scan.stream?.getTracks().forEach((t) => t.stop());
  scan.stream = null; scan.track = null; scan.torch = false;
}
function closeScanner() {
  scanStopStream();
  const el = document.getElementById('scanner');
  if (el) { el.remove(); document.body.style.overflow = ''; }
}
document.addEventListener('click', async (e) => {
  const pick = e.target.closest('[data-scan-pick]');
  if (pick) { scan.pick = pick.dataset.scanPick; scanRenderResult(false); return; }
  const a = e.target.closest('[data-scan]');
  if (!a) return;
  const act = a.dataset.scan, id = scan.pick;
  if (act === 'close') closeScanner();
  else if (act === 'photo') document.getElementById('scanFile')?.click();
  else if (act === 'again') { scan.paused = false; scan.last = null; scan.res = null; const p = document.getElementById('scanPanel'); if (p) p.innerHTML = `<p class="scan-status">${L.scan.aim}</p><button class="btn-ghost scan-photo" data-scan="photo">${L.scan.photo}</button>`; }
  else if (act === 'add' && id) { C.owned[id] = qty(id) + 1; save(); refreshCard(id); toast(L.scan.added(qty(id))); scanRenderResult(false); }
  else if (act === 'wish' && id) { wish.has(id) ? wish.delete(id) : wish.add(id); save(); refreshCard(id); scanRenderResult(false); }
  else if (act === 'open' && id) { closeScanner(); openCard(id, true); }
  else if (act === 'torch' && scan.track) { scan.torch = !scan.torch; try { await scan.track.applyConstraints({ advanced: [{ torch: scan.torch }] }); } catch { /* lampe indisponible */ } a.classList.toggle('on', scan.torch); }
});
document.addEventListener('change', (e) => { if (e.target.id === 'scanFile' && e.target.files?.[0]) scanFromFile(e.target.files[0]); });
document.addEventListener('visibilitychange', () => { if (document.hidden && document.getElementById('scanner')) closeScanner(); });
addEventListener('hashchange', () => closeScanner());
addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('scanner')) closeScanner(); });

// ---------- Onglets de langue, barre d'onglets ----------
function renderSupportSide() {
  const nav = document.querySelector('.tabbar');
  nav.querySelector('.support-side')?.remove();
  if (supportUrl()) nav.insertAdjacentHTML('beforeend', supportLink('support-side pc-only'));
}
function renderChrome() {
  document.documentElement.lang = ui === 'zh' ? 'zh-CN' : ui;
  for (const b of document.querySelectorAll('#langtabs [data-lang]')) b.setAttribute('aria-selected', b.dataset.lang === lang);
  const labels = { friends: L.fr.title, home: L.home, sealed: L.sealed, collection: L.collection, search: L.search, values: L.market, wishlist: L.wishlist };
  for (const a of document.querySelectorAll('.tabbar a')) {
    const span = a.querySelector('span');
    if (span && labels[a.dataset.tab]) span.textContent = labels[a.dataset.tab];
    if (a.dataset.tab === 'search') a.setAttribute('aria-label', L.searchCard);
  }
}
// onglets FR · EN · 中文 : édition des cartes (séries, images, collection) ; la langue du site ne change pas
function setLang(next) {
  if (!LANGS.includes(next) || next === lang) return;
  lang = next;
  user.prefs.lang = lang;
  useCollection(); save();
  renderChrome();
  scan.index = null; colSet = '';
  const wasSettings = !sheet.hidden && !openId;
  const card = openId;
  if (location.hash.startsWith('#set-') && !editionSet(setOf(location.hash.slice(5)))) { location.hash = '#home'; toast(L.editionToast(lang)); return; }
  currentRender();
  if (card && inEdition(cardsById.get(card))) openCard(card, true); else if (card) closeCard();
  else if (wasSettings && sheetMode === 'account') openAccount(true); else if (wasSettings) openSettings();
  toast(L.editionToast(lang));
}
// Réglages : langue du site (textes, dates, prix), indépendante de l'édition affichée
function setUi(next) {
  if (!LANGS.includes(next) || next === ui) return;
  ui = next;
  L = TEXT[ui];
  user.prefs.ui = ui; save();
  setFormats(); renderChrome(); renderSupportSide();
  if (cloud.api) cloud.api.auth.languageCode = ui === 'zh' ? 'zh-CN' : ui;
  const wasAccount = sheetMode === 'account';
  currentRender();
  if (wasAccount) openAccount(true); else openSettings();
  toast(L.langToast);
}

// ---------- Actions ----------
function toggleOwn(id) {
  C.owned[id] = qty(id) > 0 ? 0 : 1;
  if (!C.owned[id]) delete C.owned[id];
  save(); refreshCard(id);
  toast(qty(id) ? L.addedCol : L.removedCol);
}
function toggleWish(id) {
  wish.has(id) ? wish.delete(id) : wish.add(id);
  save(); refreshCard(id);
  for (const b of sheetPanel.querySelectorAll(`[data-wish="${CSS.escape(id)}"]`)) b.setAttribute('aria-pressed', wish.has(id));
  toast(wish.has(id) ? L.addedWish : L.removedWish);
}

document.addEventListener('click', async (e) => {
  const tab = e.target.closest('#langtabs [data-lang]');
  if (tab) { setLang(tab.dataset.lang); return; }
  const nav = e.target.closest('[data-nav]');
  if (nav) { location.hash = `#${nav.dataset.nav}`; return; }
  const t = e.target.closest('[data-open],[data-own],[data-wish],[data-seg],[data-pref],[data-fav],[data-action],[data-qty],[data-colset],[data-close]');
  if (!t) return;
  const d = t.dataset;
  if (d.open) openCard(d.open);
  else if (d.own) toggleOwn(d.own);
  else if (d.wish) toggleWish(d.wish);
  else if (d.seg === 'lang') setLang(d.value);
  else if (d.seg === 'ui') setUi(d.value);
  else if (d.seg) { user.prefs[d.seg] = d.value; save(); currentRender(); }
  else if (d.pref) { user.prefs[d.pref] = d.value || null; if (d.pref === 'own' && !d.value) user.prefs.own = 'all'; save(); currentRender(); }
  else if (d.fav) { fav.has(d.fav) ? fav.delete(d.fav) : fav.add(d.fav); save(); currentRender(); toast(fav.has(d.fav) ? L.favOn : L.favOff); }
  else if (d.colset !== undefined) { colSet = d.colset; currentRender(); }
  else if (d.qty && openId) {
    const id = openId;
    const n = Math.max(0, qty(id) + Number(d.qty));
    if (n) C.owned[id] = n; else delete C.owned[id];
    save(); refreshCard(id); openCard(id, true);
  } else if (d.close !== undefined) closeCard();
  else if (d.action === 'home-mode') { user.prefs.homeMode = user.prefs.homeMode === 'grid' ? 'list' : 'grid'; save(); currentRender(); }
  else if (d.action === 'cycle-sort') {
    const i = SORTS.indexOf(user.prefs.sort);
    user.prefs.sort = SORTS[(i + 1) % SORTS.length]; save(); currentRender();
    toast(L.sortToast(L.sorts[user.prefs.sort]));
  } else if (d.action === 'filters') { showFilters = !showFilters; currentRender(); }
  else if (d.action === 'settings') openSettings();
  else if (d.action === 'account') openAccount();
  else if (d.action === 'prev') navStep(-1);
  else if (d.action === 'next') navStep(1);
  else if (d.action === 'scan') openScanner();
  else if (d.action === 'install') doInstall();
  else if (d.action === 'install-dismiss') { try { localStorage.setItem('riftdex:installDismissed', '1'); } catch { /* */ } document.getElementById('installBanner')?.remove(); }
  else if (d.action === 'copy-id') {
    const id = cloud.user?.uid ?? '';
    try { await navigator.clipboard.writeText(id); toast(L.copiedId); }
    catch { const el = document.getElementById('myId'); if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }
  } else if (d.action === 'avatar-remove') {
    try { await cloud.api.fsM.deleteDoc(cloud.api.fsM.doc(cloud.api.db, 'profiles', cloud.user.uid)); cloud.avatar = null; toast(L.avatarRemoved); } catch { toast(L.avatarErr); }
    refreshAccount();
  }
  else if (d.action === 'google') signInGoogle();
  else if (d.action === 'forgot') {
    const email = document.getElementById('acctEmail')?.value.trim();
    cloudAction(() => cloud.api.authM.sendPasswordResetEmail(cloud.api.auth, email), L.resetSent);
  } else if (d.action === 'signout') {
    cloudAction(async () => { cloud.unsub?.(); cloud.unsub = null; await cloud.api.authM.signOut(cloud.api.auth); }, L.signedOut);
  } else if (d.action === 'delete-account') {
    if (!cloud.confirmDelete) { cloud.confirmDelete = true; refreshAccount(); return; }
    cloudAction(async () => {
      const cu = cloud.api.auth.currentUser;
      cloud.unsub?.(); cloud.unsub = null;
      await cloud.api.fsM.deleteDoc(cloudRef());
      await cloud.api.fsM.deleteDoc(cloud.api.fsM.doc(cloud.api.db, 'profiles', cu.uid)).catch(() => {});
      await friendsCleanup(cu.uid);
      await cloud.api.authM.deleteUser(cu);
      user.syncedUid = null; save();
    }, L.deleted);
    cloud.confirmDelete = false;
  }
  else if (d.action === 'close') closeCard();
  else if (d.action === 'export') {
    C.wish = [...wish]; C.fav = [...fav];
    const data = JSON.stringify({ app: 'RiftDex', version: 1, exportedAt: new Date().toISOString(), col: user.col });
    const box = document.getElementById('exportBox');
    box.hidden = false; box.value = data;
    try { await navigator.clipboard.writeText(data); toast(L.copied); } catch { box.select(); toast(L.selectCopy); }
  }
});
document.addEventListener('change', (e) => {
  if (e.target.id === 'avatarFile' && e.target.files?.[0] && cloud.user) saveAvatar(e.target.files[0]);
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'importFile') return;
  const f = e.target.files?.[0];
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (data.app !== 'RiftDex' || !data.col) throw new Error();
    for (const l of LANGS) user.col[l] = { ...emptyCol(), ...(data.col[l] ?? {}) };
    useCollection(); save(); closeCard(); currentRender(); toast(L.imported);
  } catch { toast(L.badFile); }
});
document.addEventListener('input', (e) => {
  const map = { setSearch: [(v) => { homeQuery = v; }, renderHome], cardSearch: [(v) => { searchQuery = v; }, renderSearch], setCardSearch: [(v) => { setQuery = v; }, () => currentRender()] };
  const m = map[e.target.id];
  if (!m) return;
  m[0](e.target.value);
  const pos = e.target.selectionStart;
  m[1]();
  const el = document.getElementById(e.target.id); el.focus(); el.setSelectionRange(pos, pos);
});
document.addEventListener('keydown', (e) => {
  if (sheet.hidden) return;
  if (e.key === 'Escape') closeCard();
  else if (openId && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('input, textarea')) { e.preventDefault(); navStep(e.key === 'ArrowRight' ? 1 : -1); }
});
sheet.addEventListener('click', (e) => { if (e.target.matches('.sheet-backdrop')) closeCard(); });

// ---------- Navigation ----------
let currentTab = 'home';
function markTabs() {
  const pc = isPC();
  for (const a of document.querySelectorAll('.tabbar a')) {
    const on = a.dataset.tab === currentTab || (!pc && currentTab === 'sealed' && a.dataset.tab === 'home');
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
}
function route() {
  const h = location.hash.slice(1) || 'home';
  if (!sheet.hidden) closeCard();
  let tab = h;
  if (h.startsWith('set-')) { tab = 'home'; currentRender = () => renderSet(h.slice(4)); }
  else if (h === 'collection') currentRender = renderCollection;
  else if (h === 'wishlist') currentRender = renderWishlist;
  else if (h === 'search') currentRender = renderSearch;
  else if (h === 'values') currentRender = renderValues;
  else if (h === 'sealed') { tab = 'sealed'; currentRender = renderSealed; }
  else if (h === 'friends') { fr.view = null; fr.msg = ''; currentRender = renderFriends; }
  else if (h.startsWith('friend-')) { tab = 'friends'; const uid = h.slice(7); if (fr.view?.uid !== uid) fr.filter = 'all'; renderFriendCurrent = () => renderFriend(uid); currentRender = renderFriendCurrent; }
  else { tab = 'home'; currentRender = renderHome; }
  currentTab = tab;
  markTabs();
  currentRender();
  window.scrollTo(0, 0);
  if (h === 'search') document.getElementById('cardSearch')?.focus();
}
window.addEventListener('hashchange', route);

// ---------- Démarrage ----------
pcQuery.addEventListener('change', () => {
  applyDevice(); markTabs(); currentRender();
  if (openId) openCard(openId, true);
});
renderChrome();
try {
  await loadData();
  route();
  initCloud();
} catch (err) {
  view.innerHTML = `<div class="empty"><strong>${L.loadError}</strong>${L.loadErrorHint}</div>`;
  console.error(err);
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
