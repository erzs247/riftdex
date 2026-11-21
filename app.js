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
    v3d: { open: 'Voir la carte en 3D', flip: 'Retourner', reset: 'Remettre de face', tip: 'Glisse pour tourner la carte · double-touche pour la retourner' },
    listsTab: 'Listes', listsIntro: 'Listes thématiques : les cartes d\'une région, d\'un peuple, d\'un champion ou d\'un type, toutes séries confondues.', listFavOn: 'Liste ajoutée aux favoris', listFavOff: 'Liste retirée des favoris', favList: 'Liste favorite',
    listGroups: { fav: 'Favoris', artist: 'Artistes', music: 'Groupes de musique', collection: 'Collection', region: 'Régions', people: 'Peuples et créatures', champion: 'Champions' },
    sealed: 'Scellé', setsTab: 'Séries', toggleView: 'Changer l\'affichage', extraTab: 'Extra',
    extraIntro: 'Versions vendues sur Cardmarket mais absentes de la galerie officielle de Riot : versions signées, runes et jetons à part, hors-séries pas encore publiés… Leur visuel est souvent celui d\'une autre version, et leur prix repose parfois sur très peu d\'offres.',
    extraOne: 'Version vendue sur Cardmarket, absente de la galerie officielle de Riot (rangée dans l\'onglet Extra de l\'accueil).',
    cats: { booster: 'Boosters', box: 'Booster Box', case: 'Cases de 6 Booster Box', deck: 'Decks', kit: 'Coffrets & kits', set: 'Sets complets' },
    catOne: { booster: 'Booster', box: 'Booster Box', case: 'Case de 6 Booster Box', deck: 'Deck', kit: 'Coffret', set: 'Set complet' },
    sealedNote: (d, e) => `Prix tendance Cardmarket des produits scellés de l'édition ${TEXT.fr.ed[e]}${d ? ` · mis à jour le ${d}` : ''}. Les produits sans prix n'ont pas encore de ventes.`,
    sealedCount: (n) => `${n} ${plural(n, 'produit scellé', 'produits scellés')}`, noSealed: 'Aucun produit scellé dans cette langue pour l\'instant.',
    home: 'Accueil', collection: 'Collection', market: 'Cotes', wishlist: 'Souhaits', search: 'Recherche', searchCard: 'Rechercher une carte',
    settings: 'Réglages', list: 'Liste', grid: 'Grille', cards: 'Cartes', searchSet: 'Rechercher une série', noSet: 'Aucune série trouvée', favorites: 'Favoris',
    blocks: { main: 'Séries', promo: 'Promos & produits spéciaux', new: 'Nouvelles séries', cn: 'Exclusivités chinoises' },
    ed: { fr: 'française', en: 'anglaise', zh: 'chinoise' }, edShort: { fr: 'FR', en: 'EN', zh: 'chinoise' }, langNote: (e) => (e === 'fr' ? '<b>Édition française.</b> Séries sorties en VF, avec une collection et des souhaits propres. Riot ne publie pas encore les scans VF : les visuels sont ceux de la version anglaise.' : e === 'zh' ? '<b>Édition chinoise.</b> Les cartes imprimées en chinois, avec leurs scans chinois officiels et les exclusivités chinoises, et une collection et des souhaits propres.' : ''),
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
    cmSearch: 'Rechercher sur Cardmarket', cmView: 'Voir sur Cardmarket', cmVersions: 'Voir les versions sur Cardmarket', cmAll: 'Pas la bonne version ? Toutes les versions sur Cardmarket', art: (a) => `Illustration : ${a}`, artApprox: 'Visuel de la version standard (pas d\'image officielle de cette version).', enArt: 'Visuel de la version anglaise.', sealedEnArt: 'Visuel de la version anglaise du produit.', sealedArt: 'Pas de photo de ce produit : montage de cartes de la série.', enOnly: 'Carte imprimée en anglais.',
    worth: (q, v) => (q > 1 ? `Vos ${q} exemplaires valent ${v}` : `Votre exemplaire vaut ${v}`),
    paidLabel: 'Prix d\'achat / ex.', paidHint: 'Plus-value par rapport à la cote', paidVs: 'Plus-value :', boughtFor: (v) => `achetés ${v}`,
    paidSum: (n, v) => `Prix d'achat noté pour ${n} carte${n > 1 ? 's' : ''} ou produit${n > 1 ? 's' : ''} : ${v}`, paidPrivate: 'Gardé seulement sur cet appareil (et dans l\'export).',
    energy: 'Énergie', might: 'Puissance', power: 'Rune', dayShort: 'j',
    chartWait: 'Pas encore assez d\'historique pour tracer une courbe. Le prix est relevé chaque jour.', chartNone: 'Pas de prix Cardmarket pour cette carte pour l\'instant.',
    ranges: ['7 J', '1 M', '3 M', '1 A', 'Tout'], chartAria: (a, b, c, d) => `Courbe du prix du ${a} au ${b}, de ${c} à ${d}`,
    language: 'Langue du site', hiddenSets: (n, e) => `${n} série${n > 1 ? 's' : ''} (promos, coffrets…) n'${n > 1 ? 'existent' : 'existe'} pas en édition ${TEXT.fr.ed[e]}.`, showEdition: (e) => `Voir l'édition ${TEXT.fr.edShort[e]}`, editionToast: (e) => `Édition ${TEXT.fr.ed[e]}`, langToast: 'Site en français',
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
    variant: { alt: 'Illustration alternative', star: 'Hors-série', sig: 'Signature', extra: 'Variante', cn: 'Exclusivité chinoise' },
  },
  en: {
    v3d: { open: 'View the card in 3D', flip: 'Flip', reset: 'Face front', tip: 'Drag to rotate the card · double-tap to flip it' },
    listsTab: 'Lists', listsIntro: 'Themed lists: the cards of a region, a people, a champion or a type, across all sets.', listFavOn: 'List added to favourites', listFavOff: 'List removed from favourites', favList: 'Favourite list',
    listGroups: { fav: 'Favourites', artist: 'Artists', music: 'Music bands', collection: 'Collection', region: 'Regions', people: 'Peoples and creatures', champion: 'Champions' },
    sealed: 'Sealed', setsTab: 'Sets', toggleView: 'Change view', extraTab: 'Extra',
    extraIntro: 'Versions sold on Cardmarket but missing from Riot\'s official gallery: signed versions, separate runes and tokens, overnumbered cards not published yet… Their picture is often that of another version, and their price sometimes rests on very few offers.',
    extraOne: 'Version sold on Cardmarket, missing from Riot\'s official gallery (listed in the Extra tab of the home screen).',
    cats: { booster: 'Boosters', box: 'Booster boxes', case: 'Cases of 6 booster boxes', deck: 'Decks', kit: 'Box sets & kits', set: 'Complete sets' },
    catOne: { booster: 'Booster', box: 'Booster box', case: 'Case of 6 booster boxes', deck: 'Deck', kit: 'Box set', set: 'Complete set' },
    sealedNote: (d, e) => `Cardmarket trend prices for ${TEXT.en.ed[e]} sealed products${d ? ` · updated ${d}` : ''}. Products without a price have no sales yet.`,
    sealedCount: (n) => `${n} sealed ${plural(n, 'product', 'products')}`, noSealed: 'No sealed products in this language yet.',
    home: 'Home', collection: 'Collection', market: 'Market', wishlist: 'Wishlist', search: 'Search', searchCard: 'Search a card',
    settings: 'Settings', list: 'List', grid: 'Grid', cards: 'Cards', searchSet: 'Search a set', noSet: 'No set found', favorites: 'Favourites',
    blocks: { main: 'Sets', promo: 'Promos & special products', new: 'New sets', cn: 'China exclusives' },
    ed: { fr: 'French', en: 'English', zh: 'Chinese' }, edShort: { fr: 'French', en: 'English', zh: 'Chinese' }, langNote: (e) => (e === 'fr' ? '<b>French edition.</b> Sets released in French, with their own collection and wishlist. Riot does not publish French scans yet: the pictures are the English ones.' : e === 'zh' ? '<b>Chinese edition.</b> The cards printed in Chinese, with their official Chinese scans and the China exclusives, and their own collection and wishlist.' : ''),
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
    cmSearch: 'Search on Cardmarket', cmView: 'View on Cardmarket', cmVersions: 'See the versions on Cardmarket', cmAll: 'Not the right version? All versions on Cardmarket', art: (a) => `Art: ${a}`, artApprox: 'Standard version artwork (no official image of this version).', enArt: '', sealedEnArt: '', sealedArt: 'No picture of this product: collage of cards from the set.', enOnly: '',
    worth: (q, v) => (q > 1 ? `Your ${q} copies are worth ${v}` : `Your copy is worth ${v}`),
    paidLabel: 'Bought at / copy', paidHint: 'Gain compared with the price', paidVs: 'Gain:', boughtFor: (v) => `bought for ${v}`,
    paidSum: (n, v) => `Purchase price logged for ${n} card${n > 1 ? 's' : ''} or product${n > 1 ? 's' : ''}: ${v}`, paidPrivate: 'Kept on this device only (and in the export).',
    energy: 'Energy', might: 'Might', power: 'Power', dayShort: 'd',
    chartWait: 'Not enough history to draw a curve yet. Prices are recorded every day.', chartNone: 'No Cardmarket price for this card yet.',
    ranges: ['7D', '1M', '3M', '1Y', 'All'], chartAria: (a, b, c, d) => `Price from ${a} to ${b}, from ${c} to ${d}`,
    language: 'Site language', hiddenSets: (n, e) => `${n} set${n > 1 ? 's' : ''} (promos, boxes…) ${n > 1 ? 'are' : 'is'} not in the ${TEXT.en.ed[e]} edition.`, showEdition: (e) => `See the ${TEXT.en.edShort[e]} edition`, editionToast: (e) => `${TEXT.en.ed[e]} edition`, langToast: 'Site in English',
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
    variant: { alt: 'Alternate art', star: 'Overnumbered', sig: 'Signature', extra: 'Variant', cn: 'China exclusive' },
  },
  zh: {
    v3d: { open: '3D 查看卡牌', flip: '翻面', reset: '回到正面', tip: '拖动旋转卡牌 · 双击翻面' },
    listsTab: '列表', listsIntro: '主题列表：同一地区、种族、英雄或类型的卡牌，跨越所有系列。', listFavOn: '已收藏列表', listFavOff: '已取消收藏列表', favList: '收藏列表',
    listGroups: { fav: '收藏', artist: '画师', music: '音乐组合', collection: '收藏类别', region: '地区', people: '种族与生物', champion: '英雄' },
    sealed: '未拆封', setsTab: '系列', toggleView: '切换显示', extraTab: '其他',
    extraIntro: 'Cardmarket 上有售但 Riot 官方卡牌库中没有的版本：签名版、单独的符文和衍生物、尚未公布的超编号卡等。卡图常常是其他版本的，价格有时只基于极少的报价。',
    extraOne: 'Cardmarket 上有售、Riot 官方卡牌库中没有的版本（在首页的“其他”标签中）。',
    cats: { booster: '补充包', box: '补充包盒', case: '整箱', deck: '套牌', kit: '礼盒', set: '全套' },
    catOne: { booster: '补充包', box: '补充包盒', case: '整箱（6 盒）', deck: '套牌', kit: '礼盒', set: '全套' },
    sealedNote: (d, e) => `${TEXT.zh.ed[e]}版未拆封商品的 Cardmarket 趋势价${d ? ` · 更新于 ${d}` : ''}。没有价格的商品暂无成交。`,
    sealedCount: (n) => `${n} 件未拆封商品`, noSealed: '该语言暂无未拆封商品。',
    home: '首页', collection: '收藏', market: '行情', wishlist: '心愿单', search: '搜索', searchCard: '搜索卡牌',
    settings: '设置', list: '列表', grid: '网格', cards: '卡牌', searchSet: '搜索系列', noSet: '未找到系列', favorites: '收藏的系列',
    blocks: { main: '系列', promo: '宣传卡与特别商品', new: '新系列', cn: '国服限定' },
    ed: { fr: '法语', en: '英语', zh: '中文' }, edShort: { fr: '法语', en: '英语', zh: '中文' }, langNote: (e) => (e === 'fr' ? '<b>法语版。</b>已发行法语版的系列，收藏与心愿单独立。Riot 尚未公布法语卡图，显示英文版卡图。' : e === 'zh' ? '<b>中文版。</b>中文印刷的卡牌，使用官方中文卡图，包括国服限定卡，收藏与心愿单独立。' : ''),
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
    cmSearch: '在 Cardmarket 上搜索', cmView: '在 Cardmarket 上查看', cmVersions: '在 Cardmarket 上查看所有版本', cmAll: '版本不对？查看 Cardmarket 上的所有版本', art: (a) => `画师：${a}`, artApprox: '显示的是标准版卡图（该版本暂无官方图片）。', enArt: '暂无中文卡图，显示英文版。', sealedEnArt: '显示的是英文版商品图片。', sealedArt: '暂无该商品图片：显示该系列的卡牌拼图。', enOnly: '该卡仅有英文版。',
    worth: (q, v) => (q > 1 ? `你的 ${q} 张价值 ${v}` : `你的这张价值 ${v}`),
    paidLabel: '买入价 / 张', paidHint: '与行情价相比的盈亏', paidVs: '盈亏：', boughtFor: (v) => `买入 ${v}`,
    paidSum: (n, v) => `已记录 ${n} 张卡牌或商品的买入价：${v}`, paidPrivate: '仅保存在此设备上（以及导出文件中）。',
    energy: '能量', might: '战力', power: '符能', dayShort: '天',
    chartWait: '历史数据不足，暂时无法绘制走势。价格每天记录一次。', chartNone: '这张卡暂无 Cardmarket 价格。',
    ranges: ['7天', '1月', '3月', '1年', '全部'], chartAria: (a, b, c, d) => `${a} 至 ${b} 的价格，从 ${c} 到 ${d}`,
    language: '网站语言', hiddenSets: (n, e) => `${n} 个系列（宣传卡、礼盒等）没有${TEXT.zh.ed[e]}版。`, showEdition: (e) => `查看${TEXT.zh.ed[e]}版`, editionToast: (e) => `${TEXT.zh.ed[e]}版`, langToast: '网站语言：中文',
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
    variant: { alt: '异画', star: '超编号', sig: '签名', extra: '变体', cn: '国服限定' },
  },
};

// ---------- Icônes ----------
const I = {
  back: '<svg viewBox="0 0 24 24"><path d="M19 12H5"/><path d="m11 6-6 6 6 6"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/></svg>',
  sort: '<svg viewBox="0 0 24 24"><path d="M8 4v16"/><path d="m4 8 4-4 4 4"/><path d="M16 20V4"/><path d="m12 16 4 4 4-4"/></svg>',
  filter: '<svg viewBox="0 0 24 24"><path d="M4 7h10"/><path d="M18 7h2"/><circle cx="16" cy="7" r="2"/><path d="M4 17h2"/><path d="M10 17h10"/><circle cx="8" cy="17" r="2"/></svg>',
  globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/></svg>',
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
  flip: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8.5"/><path d="M20 4v4.5h-4.5"/><path d="M20 12a8 8 0 0 1-13.7 5.7L4 15.5"/><path d="M4 20v-4.5h4.5"/></svg>',
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
// ---------- Déménagement depuis l'ancienne adresse (erzs247.github.io/riftdex) ----------
// l'ancienne adresse renvoie ici avec la collection de l'appareil dans « #migrate=… » (gzip puis base64url) :
// elle est reprise si cet appareil n'a encore aucune carte ici, puis le paramètre est retiré de l'adresse
await (async () => {
  const m = location.hash.match(/^#migrate=([A-Za-z0-9_-]+)(?:&(.*))?$/);
  if (!m) return;
  history.replaceState(null, '', location.pathname + location.search + (m[2] ? '#' + m[2] : ''));
  try {
    const bin = Uint8Array.from(atob(m[1].replace(/-/g, '+').replace(/_/g, '/')), (ch) => ch.charCodeAt(0));
    const text = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
    JSON.parse(text);
    const hasCards = (raw) => { try { return Object.values(JSON.parse(raw)?.col ?? {}).some((c) => Object.keys(c?.owned ?? {}).length || c?.wish?.length); } catch { return false; } };
    const here = localStorage.getItem(KEY);
    if (!here || !hasCards(here)) localStorage.setItem(KEY, text);
  } catch (e) { console.warn('Reprise de la collection', e); }
})();
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
// prix d'achat unitaire par édition : paid[édition][id] = prix. Gardé sur l'appareil seulement (la collection en ligne
// est lisible par les amis) ; compris dans l'export.
if (!user.paid || typeof user.paid !== 'object') user.paid = {};
for (const l of LANGS) if (!user.paid[l] || typeof user.paid[l] !== 'object') user.paid[l] = {};
const paidOf = (id) => user.paid[lang][id] ?? null;
// plus-value de tous les exemplaires par rapport à la tendance Cardmarket (null sans prix d'achat ou sans cote)
function paidDiff(id) {
  const pp = paidOf(id), t = price(id), q = qty(id);
  if (pp == null || t == null || !q) return null;
  return { diff: (t - pp) * q, pct: pp ? (t - pp) / pp : null };
}
const diffHtml = (r) => (r ? `<b class="${r.diff >= 0 ? 'up' : 'down'}">${r.diff >= 0 ? '+' : '−'}${eur(Math.abs(r.diff))}${r.pct != null ? ` (${pct(r.pct)})` : ''}</b>` : '');
const paidDiffHtml = (id) => (paidOf(id) != null ? (price(id) != null ? `${L.paidVs} ${diffHtml(paidDiff(id))}` : L.noPrice) : `<span class="muted">${L.paidHint}</span>`);
// signature de ce qui est synchronisé avec le compte (les trois éditions ; pas les préférences d'affichage)
const colCanon = (col) => JSON.stringify(LANGS.map((l) => [Object.entries(col?.[l]?.owned ?? {}).filter(([, q]) => q > 0).sort(), [...(col?.[l]?.wish ?? [])].sort(), [...(col?.[l]?.fav ?? [])].sort()]));
let lastSig = colCanon(user.col);
function save() {
  C.wish = [...wish]; C.fav = [...fav];
  const sig = colCanon(user.col);
  if (sig !== lastSig) { lastSig = sig; cloudChanged(); if (catalog.cards.length) { badgeCheck(); if (user.prefs.lbWorld) lbPush(); } }
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
// nom de la série dans la langue de l'édition affichée (comme NightDex : « Armes spirituelles » en FR, « 铸魂淬炼 » en 中文)
const setName = (s) => (lang === 'zh' ? s.nameZh ?? s.nameEn : lang === 'en' ? s.nameEn ?? s.name : s.name);
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

// carte qui a changé d'identifiant (catalog.renamed, ex. variante Cardmarket publiée ensuite par Riot) :
// exemplaires, souhaits et favoris reportés sur le nouvel identifiant, dans les trois éditions
function migrateIds() {
  const ren = catalog.renamed ?? {};
  let changed = false;
  for (const l of LANGS) {
    const col = user.col[l];
    for (const [from, to] of Object.entries(ren)) {
      if (col.owned[from]) { col.owned[to] = Math.max(col.owned[to] ?? 0, col.owned[from]); delete col.owned[from]; changed = true; }
      if (col.wish.includes(from)) { col.wish = [...new Set(col.wish.map((x) => (x === from ? to : x)))]; changed = true; }
    }
  }
  if (changed) { useCollection(); save(); }
}

// Ce que montre chaque édition : ses séries, ses cartes, son scellé
// - édition chinoise : seulement les cartes dont Riot publie la version chinoise (image chinoise)
// - promos et coffrets : imprimés en anglais, donc seulement dans l'édition anglaise (langues de la série dans catalog.json)
// carte de l'édition : série imprimée dans cette langue (chinois : seulement les cartes avec leur scan chinois) ;
// « only » = carte imprimée seulement dans ces langues (exclusivités chinoises)
const inEdition = (c) => (isSealed(c) ? c.lang === lang : !!setOf(c.set)?.langs.includes(lang) && (!c.only || c.only.includes(lang)) && (lang !== 'zh' || !!c.imageZh));
// versions vendues seulement sur Cardmarket (sans numéro officiel) : à part, dans l'onglet Extra de l'accueil
const isExtraCard = (c) => c?.variant === 'extra';
const setCards = (code) => (cardsBySet.get(code) ?? []).filter((c) => inEdition(c) && !isExtraCard(c));
const extraCards = () => catalog.cards.filter((c) => isExtraCard(c) && inEdition(c));
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
// Lien Cardmarket : page exacte du produit d'après son numéro dans le catalogue Cardmarket (Products?idProduct=…,
// redirection officielle de Cardmarket : jamais d'adresse devinée), filtrée sur la langue de l'édition pour les cartes ;
// sans numéro de produit : recherche sur le nom.
function cmLinks(card) {
  const site = `https://www.cardmarket.com/${ui === 'fr' ? 'fr' : 'en'}/${config.cardmarket?.gameSlug ?? 'Riftbound'}`;
  const langId = config.cardmarket?.languageIds?.[lang];
  const id = card.cardmarket?.idProduct;
  if (id) return { url: `${site}/Products?idProduct=${id}${!isSealed(card) && langId ? `&language=${langId}` : ''}`, label: L.cmView, all: null };
  if (card.only) return null; // exclusivité chinoise : pas vendue sur Cardmarket
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
// illustration d'une série : sa carte la plus prestigieuse (illustration alternative ou showcase, sinon épique), la plus chère
const artCacheSet = new Map();
function setArt(code) {
  const k = `${code}|${lang}`;
  if (artCacheSet.has(k)) return artCacheSet.get(k);
  const rank = (c) => (c.variant === 'alt' ? 3 : c.rarity === 'showcase' ? 2 : c.rarity === 'epic' || c.type === 'legend' ? 1 : 0);
  const best = setCards(code).filter((c) => imageOf(c) && !c.landscape && c.variant !== 'star' && c.variant !== 'sig')
    .sort((a, b) => rank(b) - rank(a) || (price(b.id) ?? 0) - (price(a.id) ?? 0))[0];
  const url = best ? imageOf(best) : null;
  artCacheSet.set(k, url);
  return url;
}
const artStyle = (code) => { const u = setArt(code); return u ? `style="--art:url('${esc(u)}')"` : ''; };
function setHero(s) {
  const total = setTotal(s); const own = ownedIn(s.code);
  const p = total ? own / total : 0;
  return `<div class="set-hero" ${artStyle(s.code)}>
    <div class="set-hero-text">
      <span class="set-code">${esc(s.code)}</span>
      <h2>${esc(setName(s))}</h2>
      ${s.releaseDate ? `<small>${fmt.date.format(parseDay(s.releaseDate))}</small>` : ''}
    </div>
    <div class="set-hero-prog num"><b>${Math.floor(p * 100)} %</b><span>${own}/${total}</span></div>
    <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
  </div>`;
}
function progressRow(s) {
  const total = setTotal(s); const own = ownedIn(s.code);
  const p = total ? own / total : 0;
  return `<a class="set-row ${p >= 1 ? 'done' : ''}" href="#set-${esc(s.code)}" ${artStyle(s.code)}>
    <div class="set-head"><span class="set-code">${esc(s.code)}</span><span class="set-name">${esc(setName(s))}</span>
    <span class="set-count num">${own}<small>/${total}</small><b>${Math.floor(p * 100)} %</b></span></div>
    <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
  </a>`;
}
function progressTile(s) {
  const total = setTotal(s); const own = ownedIn(s.code);
  const p = total ? own / total : 0;
  return `<a class="set-tile ${p >= 1 ? 'done' : ''}" href="#set-${esc(s.code)}" ${artStyle(s.code)}>
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
  setTopbar(`<h1>${L.home}</h1>${withMode ? `<button class="icon-btn" data-action="home-mode" aria-label="${L.toggleView}">${mode === 'grid' ? I.listIcon : I.gridIcon}</button>` : ''}${newsBtn()}${globeBtn()}${accountBtn()}<button class="icon-btn" data-action="settings" aria-label="${L.settings}">${I.gear}</button>`);
}
// Bouton globe : langue du site (comme NightDex) : ouvre les Réglages sur le choix de la langue, sans toucher à l'édition des cartes
const globeBtn = () => `<button class="icon-btn" data-action="language" aria-label="${L.language}" title="${L.language}">${I.globe}</button>`;
const homeTabs = (active) => `<div class="seg" role="tablist">${[['home', L.setsTab], ['sealed', L.sealed], ['lists', L.listsTab], ['decks', T().dk.tab], ...(extraCards().length ? [['extra', L.extraTab]] : [])].map(([h, l]) => `<button data-nav="${h}" aria-pressed="${active === h}">${l}</button>`).join('')}</div>`;
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
function renderExtra() {
  homeTopbar(false);
  const list = extraCards();
  const bySet = new Map();
  for (const c of list) { if (!bySet.has(c.set)) bySet.set(c.set, []); bySet.get(c.set).push(c); }
  const order = (code) => setOf(code)?.order ?? 999;
  view.innerHTML = `<div class="stack">
    ${homeTabs('extra')}
    <p class="note">${L.extraIntro}</p>
    ${[...bySet].sort((a, b) => order(a[0]) - order(b[0])).map(([code, cards]) => `<h2 class="section-title"><b class="print">${esc(code)}</b> ${esc(setOf(code) ? setName(setOf(code)) : code)}</h2><div class="cards">${sortCards(cards, 'name').map(cardTile).join('')}</div>`).join('') || `<div class="empty"><strong>${L.noSet}</strong></div>`}
  </div>`;
}
// ---------- Listes thématiques (comme les « Listes » de Pokécardex) : cartes d'une région, d'un peuple, d'un champion… ----------
// Les régions, peuples et champions viennent des étiquettes de la galerie officielle (tags du catalogue).
const REGIONS = [
  ['Bandle City', 'Bandle', 'Bandle City', '班德尔城', 'de Bandle, la ville des Yordles'], ['Bilgewater', 'Bilgewater', 'Bilgewater', '比尔吉沃特', 'de Bilgewater'],
  ['Demacia', 'Demacia', 'Demacia', '德玛西亚', 'de Demacia'], ['Freljord', 'Freljord', 'Freljord', '弗雷尔卓德', 'du Freljord'], ['Icathia', 'Icathia', 'Icathia', '艾卡西亚', 'd\'Icathia'],
  ['Ionia', 'Ionia', 'Ionia', '艾欧尼亚', 'd\'Ionia'], ['Ixtal', 'Ixtal', 'Ixtal', '以绪塔尔', 'd\'Ixtal'], ['Mount Targon', 'Mont Targon', 'Mount Targon', '巨神峰', 'du Mont Targon'],
  ['Noxus', 'Noxus', 'Noxus', '诺克萨斯', 'de Noxus'], ['Piltover', 'Piltover', 'Piltover', '皮尔特沃夫', 'de Piltover'], ['Shadow Isles', 'Îles obscures', 'Shadow Isles', '暗影岛', 'des Îles obscures'],
  ['Shurima', 'Shurima', 'Shurima', '恕瑞玛', 'de Shurima'], ['The Void', 'Le Néant', 'The Void', '虚空', 'du Néant'], ['Zaun', 'Zaun', 'Zaun', '祖安', 'de Zaun'],
];
const PEOPLES = [
  ['Yordle', 'Yordles', 'Yordles', '约德尔人'], ['Poro', 'Poros', 'Poros', '魄罗'], ['Dragon', 'Dragons', 'Dragons', '龙'], ['Mech', 'Mécas', 'Mechs', '机械'],
  ['Fae', 'Fées', 'Fae', '精灵'], ['Spirit', 'Esprits', 'Spirits', '灵体'], ['Demon', 'Démons', 'Demons', '恶魔'], ['Pirate', 'Pirates', 'Pirates', '海盗'],
  ['Dog', 'Chiens', 'Dogs', '犬'], ['Cat', 'Chats', 'Cats', '猫'], ['Bird', 'Oiseaux', 'Birds', '鸟'], ['Spider', 'Araignées', 'Spiders', '蜘蛛'],
  ['Trifarian', 'Trifariens', 'Trifarians', '三相'], ['Sentinel', 'Sentinelles', 'Sentinels', '哨兵'],
];
const T3 = (fr, en, zh) => ({ fr, en, zh });
// cartes des groupes de musique (identifiants du catalogue ; une variante renommée ensuite suit catalog.renamed)
const MUSIC_CARDS = {
  kda: ['RAD-SP1', 'RAD-SP2', 'RAD-SP3', 'RAD-SP4', 'RAD-SP5'],
  heartsteel: ['RAD-X917660', 'RAD-X917661', 'RAD-X917662', 'RAD-X917663', 'RAD-X917664', 'RAD-X917665'],
};
let musicSets = null;
function inMusic(k, c) {
  if (!musicSets) musicSets = Object.fromEntries(Object.entries(MUSIC_CARDS).map(([g, ids]) => [g, new Set(ids.map((id) => catalog.renamed?.[id] ?? id))]));
  return musicSets[k].has(c.id);
}
const hasTag = (t) => (c) => !!c.tags?.includes(t);
const LISTS = [
  // groupes de musique de Riot : cartes reconnues à leur illustration (liste à compléter dans MUSIC_CARDS)
  { id: 'kda', group: 'music', title: T3('K/DA', 'K/DA', 'K/DA'), desc: T3('Le groupe pop K/DA : Ahri, Akali, Evelynn, Kai\'Sa et Seraphine, du coffret Couture Collection aux cartes spéciales de Radiance.', 'The K/DA pop group: Ahri, Akali, Evelynn, Kai\'Sa and Seraphine, from the Couture Collection box to the Radiance specials.', 'K/DA 女团：阿狸、阿卡丽、伊芙琳、卡莎和萨勒芬妮。'), test: (c) => c.set === 'KDA' || inMusic('kda', c), extras: true },
  { id: 'heartsteel', group: 'music', title: T3('HEARTSTEEL', 'HEARTSTEEL', 'HEARTSTEEL'), desc: T3('Le boys band HEARTSTEEL : K\'Sante, Aphelios, Ezreal, Yone, Kayn et Sett, en hors-séries de Radiance.', 'The HEARTSTEEL boy band: K\'Sante, Aphelios, Ezreal, Yone, Kayn and Sett, as Radiance overnumbered cards.', 'HEARTSTEEL 男团：奎桑提、厄斐琉斯、伊泽瑞尔、永恩、凯隐和瑟提。'), test: (c) => inMusic('heartsteel', c), extras: true },
  { id: 'alt', group: 'collection', title: T3('Illustrations alternatives', 'Alternate arts', '异画'), desc: T3('Les versions showcase avec une autre illustration (skins), foil et symbole hexagonal.', 'Showcase versions with another artwork (skins), foil with a hexagonal gem.', '采用其他插画（皮肤）的闪卡版本。'), test: (c) => c.variant === 'alt' },
  { id: 'star', group: 'collection', title: T3('Hors-séries', 'Overnumbered', '超编'), desc: T3('Les cartes numérotées au-delà de la série (ex. 303/298), dessinées par les artistes de Riot.', 'Cards numbered beyond the set (e.g. 303/298), drawn by Riot artists.', '编号超出系列总数的卡牌（如 303/298）。'), test: (c) => c.variant === 'star' },
  { id: 'sig', group: 'collection', title: T3('Signatures', 'Signatures', '签名'), desc: T3('Les hors-séries signés par l\'artiste, environ un sur dix.', 'Overnumbered cards signed by the artist, about one in ten.', '带有画师签名的超编卡，约十张中一张。'), test: (c) => c.variant === 'sig' || c.rarity === 'signature' },
  { id: 'legend', group: 'collection', title: T3('Légendes', 'Legends', '传奇'), desc: T3('Les cartes Légende, qui définissent les couleurs d\'un deck.', 'Legend cards, which set the colours of a deck.', '决定卡组颜色的传奇卡。'), test: (c) => c.type === 'legend' },
  { id: 'battlefield', group: 'collection', title: T3('Champs de bataille', 'Battlefields', '战场'), desc: T3('Les lieux où se déroulent les combats.', 'The places where the fights happen.', '战斗发生的地点。'), test: (c) => c.type === 'battlefield' },
  { id: 'rune', group: 'collection', title: T3('Runes', 'Runes', '符文'), desc: T3('Les runes de chaque domaine et leurs versions alternatives.', 'The runes of each domain and their alternate versions.', '各特性的符文及其异画。'), test: (c) => c.type === 'rune' },
  { id: 'token', group: 'collection', title: T3('Jetons', 'Tokens', '衍生物'), desc: T3('Les jetons et marqueurs (Mécas, Recrues, Bombes…).', 'Tokens and markers (Mechs, Recruits, Bombs…).', '衍生物与指示物。'), test: (c) => c.type === 'token' || /^T\d/.test(c.number ?? '') },
  { id: 'banned', group: 'collection', title: T3('Cartes interdites', 'Banned cards', '禁卡'), desc: T3('Les cartes interdites en tournoi par Riot (Standard et 2v2).', 'Cards banned from tournaments by Riot (Standard and 2v2).', 'Riot 在赛事中禁用的卡牌。'), test: (c) => !!banInfo(c) },
  { id: 'promo', group: 'collection', title: T3('Promos', 'Promos', '宣传卡'), desc: T3('Les cartes promotionnelles : Nexus Nights, tournois, avant-premières…', 'Promotional cards: Nexus Nights, tournaments, pre-rifts…', '宣传卡：符文之夜、赛事、售前活动等。'), test: (c) => c.rarity === 'promo' },
  ...REGIONS.map(([tag, fr, en, zh, frOf]) => ({ id: `r-${tag.toLowerCase().replace(/\W+/g, '-')}`, group: 'region', title: T3(fr, en, zh), desc: T3(`Les cartes ${frOf}.`, `The cards of ${en}.`, `${zh}的卡牌。`), test: hasTag(tag) })),
  ...PEOPLES.map(([tag, fr, en, zh]) => ({ id: `p-${tag.toLowerCase()}`, group: 'people', title: T3(fr, en, zh), desc: T3(`Toutes les cartes ${fr}.`, `All the ${en} cards.`, `所有${zh}卡牌。`), test: hasTag(tag) })),
];
// titres et descriptions des listes : textes de l'appli, dans la langue du site
const listTitle = (d) => d.title[ui] ?? d.title.en;
const listDesc = (d) => d.desc[ui] ?? d.desc.en;
// listes de champions : un champion avec au moins 6 cartes dans l'édition (étiquette au nom du champion)
let championLists = null;
let artistLists = null;
function allLists() {
  if (!championLists) {
    const known = new Set([...REGIONS, ...PEOPLES].map(([t]) => t).concat(['Equipment', 'Device', 'Elite', 'Recruit']));
    const count = new Map();
    for (const c of catalog.cards) for (const t of c.tags ?? []) if (!known.has(t)) count.set(t, (count.get(t) ?? 0) + 1);
    championLists = [...count].filter(([, n]) => n >= 6).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([t]) => ({ id: `c-${t.toLowerCase().replace(/\W+/g, '-')}`, group: 'champion', title: T3(t, t, t), desc: T3(`Toutes les cartes de ${t}.`, `All the ${t} cards.`, `${t} 的所有卡牌。`), test: hasTag(t) }));
  }
  if (!artistLists) {
    const count = new Map();
    for (const c of catalog.cards) for (const a of String(c.artist ?? '').split(/,\s*/)) if (a && a !== '-') count.set(a, (count.get(a) ?? 0) + 1);
    artistLists = [...count].filter(([, n]) => n >= 8).sort((a, b) => a[0].localeCompare(b[0]))
      .map(([a]) => ({ id: `a-${a.toLowerCase().replace(/\W+/g, '-')}`, group: 'artist', title: T3(a, a, a), desc: T3(`Les cartes illustrées par ${a}.`, `Cards illustrated by ${a}.`, `${a} 绘制的卡牌。`), test: (c) => String(c.artist ?? '').split(/,\s*/).includes(a) }));
  }
  return [...LISTS, ...championLists, ...artistLists];
}
const setOrder = (c) => setOf(c.set)?.order ?? 999;
const listCards = (d) => editionCards().filter((c) => (d.extras || !isExtraCard(c)) && d.test(c))
  .sort((a, b) => setOrder(a) - setOrder(b) || String(a.number).localeCompare(String(b.number), 'en', { numeric: true }));
function bestArt(cards) {
  const rank = (c) => (c.variant === 'alt' ? 3 : c.rarity === 'showcase' ? 2 : c.rarity === 'epic' || c.type === 'legend' ? 1 : 0);
  const best = cards.filter((c) => imageOf(c) && !c.landscape && c.variant !== 'star' && c.variant !== 'sig')
    .sort((a, b) => rank(b) - rank(a) || (price(b.id) ?? 0) - (price(a.id) ?? 0))[0] ?? cards.find((c) => imageOf(c));
  return best ? imageOf(best) : null;
}
function listCard(d, cards) {
  const own = cards.filter((c) => qty(c.id) > 0).length, total = cards.length, p = total ? own / total : 0;
  const art = bestArt(cards);
  const key = `list:${d.id}`;
  return `<div class="list-card ${p >= 1 ? 'done' : ''}" ${art ? `style="--art:url('${esc(art)}')"` : ''}>
    <a class="list-link" href="#list-${esc(d.id)}" aria-label="${esc(listTitle(d))}"></a>
    <div class="list-top"><h3>${esc(listTitle(d))}</h3>
      <button class="icon-btn list-star ${fav.has(key) ? 'on' : ''}" data-fav="${esc(key)}" aria-pressed="${fav.has(key)}" aria-label="${L.favList}">${I.star}</button></div>
    <p class="list-desc">${esc(listDesc(d))}</p>
    <div class="list-prog num"><b>${own}</b><small>/${total}</small><span>${Math.floor(p * 100)} %</span></div>
    <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
  </div>`;
}
function renderLists() {
  homeTopbar(false);
  const withCards = allLists().map((d) => [d, listCards(d)]).filter(([, cards]) => cards.length);
  const groups = [['fav', withCards.filter(([d]) => fav.has(`list:${d.id}`))], ...['music', 'collection', 'region', 'people', 'champion', 'artist'].map((g) => [g, withCards.filter(([d]) => d.group === g)])];
  view.innerHTML = `<div class="stack">
    ${homeTabs('lists')}
    <p class="note">${L.listsIntro}</p>
    ${groups.filter(([, l]) => l.length).map(([g, l]) => `<details class="block lists-block" ${g === 'champion' || g === 'artist' ? '' : 'open'}>
      <summary>${esc(L.listGroups[g])} <small class="num">${l.length}</small>${I.chevron}</summary>
      <div class="list-grid">${l.map(([d, cards]) => listCard(d, cards)).join('')}</div>
    </details>`).join('')}
  </div>`;
}
function renderList(id) {
  const d = allLists().find((x) => x.id === id);
  if (!d) { location.hash = '#lists'; return; }
  const all = listCards(d);
  const list = sortCards(filterCards(all), user.prefs.sort === 'num' ? 'num' : user.prefs.sort);
  const own = all.filter((c) => qty(c.id) > 0).length, p = all.length ? own / all.length : 0;
  const value = all.reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const art = bestArt(all);
  const key = `list:${d.id}`;
  setTopbar(`<a class="icon-btn" href="#lists" aria-label="${L.back}">${I.back}</a>
    <h1 class="small">${esc(listTitle(d))}</h1>
    <button class="icon-btn ${fav.has(key) ? 'on' : ''}" data-fav="${esc(key)}" aria-pressed="${fav.has(key)}" aria-label="${L.favList}">${I.star}</button>
    <button class="icon-btn" data-action="cycle-sort" aria-label="${L.changeSort}">${I.sort}</button>`);
  view.innerHTML = `<div class="stack">
    <div class="set-hero" ${art ? `style="--art:url('${esc(art)}')"` : ''}>
      <div class="set-hero-text"><span class="set-code">${esc(L.listGroups[d.group])}</span><h2>${esc(listTitle(d))}</h2><small>${esc(listDesc(d))}</small></div>
      <div class="set-hero-prog num"><b>${Math.floor(p * 100)} %</b><span>${own}/${all.length}</span></div>
      <div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
    </div>
    ${seg('setMode', user.prefs.setMode, [['cards', L.cards], ['list', L.list], ['grid', L.grid]])}
    <div class="toolbar num"><span>${L.owned(own, all.length)}</span><span class="grow"></span>${hasPrices() ? `<span>${L.myValue} : <b style="color:var(--fg)">${eur(value)}</b></span>` : ''}</div>
    ${cardsBlock(list, user.prefs.setMode)}
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
    ${hiddenNote()}
  </div>`;
}
// séries absentes de l'édition affichée (promos et coffrets imprimés en anglais…), avec un lien vers l'édition anglaise
function hiddenNote() {
  const n = catalog.sets.filter((s) => !s.langs.includes(lang)).length;
  const other = lang === 'en' ? null : 'en';
  return n && other && !homeQuery ? `<p class="note lang-note">${L.hiddenSets(n, lang)} <button class="link-btn" data-action="edition" data-value="${other}">${L.showEdition(other)}</button></p>` : '';
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
    ${setHero(s)}
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
  const colTab = colTabs().includes(user.prefs.colTab) ? user.prefs.colTab : 'cards';
  if (colTab !== 'cards') { view.innerHTML = `<div class="stack">${colTabsSeg(colTab)}${colTabHtml(colTab)}</div>`; colTabMounted(colTab); return; }
  if (!owned.length && !ownedSealed.length) {
    view.innerHTML = `<div class="stack">${colTabsSeg(colTab)}<div class="empty"><strong>${L.emptyCol(lang)}</strong>${L.emptyColHint}<a class="btn-ghost" href="#home" style="text-decoration:none">${L.browseSets}</a></div></div>`;
    return;
  }
  const total = owned.reduce((a, c) => a + qty(c.id), 0);
  const value = [...owned, ...ownedSealed].reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const sealedQty = ownedSealed.reduce((a, s) => a + qty(s.id), 0);
  const withPaid = [...owned, ...ownedSealed].filter((c) => paidOf(c.id) != null);
  const paidTot = withPaid.reduce((a, c) => a + qty(c.id) * paidOf(c.id), 0);
  const diffTot = withPaid.reduce((a, c) => a + (paidDiff(c.id)?.diff ?? 0), 0);
  const sets = visibleSets().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).filter((s) => ownedIn(s.code) > 0);
  const dups = dupCards();
  if (colSet === '__dup' && !dups.length) colSet = '';
  const shown = colSet === '__sealed' ? [] : colSet === '__dup' ? sortCards(dups, 'price-desc') : sortCards(owned.filter((c) => !colSet || c.set === colSet), 'price-desc');
  const sealedShown = !colSet || colSet === '__sealed' ? ownedSealed : [];
  view.innerHTML = `<div class="stack">
    ${colTabsSeg(colTab)}
    <div class="kpis">
      <div class="stat"><small>${L.kCards}</small><b class="num">${total}</b></div>
      <div class="stat"><small>${L.kUnique}</small><b class="num">${owned.length}</b></div>
      <div class="stat"><small>${L.kValue}</small><b class="num">${eur(value)}</b></div>
    </div>
    ${withPaid.length ? `<p class="note num paid-sum">${L.paidSum(withPaid.length, eur(paidTot))} · ${diffHtml({ diff: diffTot, pct: paidTot ? diffTot / paidTot : null })}</p>` : ''}
    <div class="chips"><button class="chip" data-colset="" aria-pressed="${!colSet}">${L.all}</button>${dups.length ? `<button class="chip" data-colset="__dup" aria-pressed="${colSet === '__dup'}">${T().dupChip} · ${dups.length}</button>` : ''}${ownedSealed.length ? `<button class="chip" data-colset="__sealed" aria-pressed="${colSet === '__sealed'}">${L.sealed} · ${sealedQty}</button>` : ''}${sets.map((s) => `<button class="chip" data-colset="${esc(s.code)}" aria-pressed="${colSet === s.code}">${esc(s.code)} · ${ownedIn(s.code)}</button>`).join('')}</div>
    ${colSet === '__dup' ? `<p class="note">${T().dupHint(dups.reduce((a, c) => a + qty(c.id) - 1, 0))}</p>` : ''}
    ${shown.length ? `${seg('setMode', user.prefs.setMode, [['cards', L.cards], ['list', L.list], ['grid', L.grid]])}${cardsBlock(shown, user.prefs.setMode)}` : ''}
    ${sealedShown.length ? `<h2 class="section-title">${L.sealed} · ${L.sealedCount(sealedQty)}</h2><div class="sealed-grid">${sealedShown.map(sealedTile).join('')}</div>` : ''}
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
  // dates de l'axe : début, fin et le point le plus proche du milieu dans le temps, sans chevauchement (≥ 80 px d'écart)
  const mid = xs.reduce((best, t, i) => (Math.abs(t - (t0 + t1) / 2) < Math.abs(xs[best] - (t0 + t1) / 2) ? i : best), 0);
  const xLabels = [0, mid, pts.length - 1].filter((v, i, a) => a.indexOf(v) === i)
    .filter((v, k, a) => k === 0 || k === a.length - 1 || (X(xs[v]) - X(xs[a[0]]) >= 80 && X(xs[a[a.length - 1]]) - X(xs[v]) >= 80));
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
function navStep(dir, slide = false) {
  const i = navList.indexOf(openId);
  const next = navList[i + dir];
  if (i < 0 || !next) return false;
  openCard(next, true);
  if (slide) sheetPanel.querySelector('.detail')?.classList.add(dir > 0 ? 'slide-from-right' : 'slide-from-left');
  return true;
}
const sheetPanel = document.getElementById('sheetPanel');
let openId = null;
let lastFocus = null;
// Fiche carte : glisser à gauche / à droite pour passer à la carte suivante / précédente de la page
const swipe = { x: 0, y: 0, t: 0, on: false, active: false };
const noSwipe = '.chart, input, textarea, select, .ranges, .stepper, .paid-line, .sheet-tools';
sheetPanel.addEventListener('touchstart', (e) => {
  swipe.on = !!openId && e.touches.length === 1 && navList.length > 1 && !e.target.closest(noSwipe);
  swipe.active = false;
  if (!swipe.on) return;
  swipe.x = e.touches[0].clientX; swipe.y = e.touches[0].clientY; swipe.t = performance.now();
}, { passive: true });
sheetPanel.addEventListener('touchmove', (e) => {
  if (!swipe.on) return;
  const dx = e.touches[0].clientX - swipe.x, dy = e.touches[0].clientY - swipe.y;
  if (!swipe.active) {
    if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { swipe.on = false; return; } // défilement vertical : on laisse faire
    if (Math.abs(dx) < 14) return;
    swipe.active = true;
  }
  const i = navList.indexOf(openId);
  const edge = (dx > 0 && i <= 0) || (dx < 0 && i >= navList.length - 1); // première / dernière carte : résistance
  const el = sheetPanel.querySelector('.detail');
  if (el) { el.style.transition = 'none'; el.style.transform = `translateX(${edge ? dx * 0.25 : dx}px)`; el.style.opacity = String(1 - Math.min(0.5, Math.abs(dx) / 600)); }
}, { passive: true });
function swipeEnd(e) {
  if (!swipe.on || !swipe.active) { swipe.on = false; return; }
  swipe.on = false;
  const t = e.changedTouches?.[0];
  const dx = t ? t.clientX - swipe.x : 0;
  const fast = Math.abs(dx) / Math.max(1, performance.now() - swipe.t) > 0.5;
  const el = sheetPanel.querySelector('.detail');
  const reset = () => { if (el) { el.style.transition = 'transform .2s ease, opacity .2s ease'; el.style.transform = ''; el.style.opacity = ''; } };
  if (Math.abs(dx) > 70 || (fast && Math.abs(dx) > 30)) {
    if (!navStep(dx < 0 ? 1 : -1, true)) reset();
  } else reset();
}
sheetPanel.addEventListener('touchend', swipeEnd);
sheetPanel.addEventListener('touchcancel', swipeEnd);

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
  const artNote = sealedItem ? (c.imageArt ? L.sealedArt : c.imageApprox ? L.sealedEnArt : '') : isExtraCard(c) ? `${L.extraOne}${c.artApprox ? ` ${L.artApprox}` : ''}` : c.artApprox ? L.artApprox : !enOnly && (lang === 'fr' || (lang === 'zh' && !c.imageZh)) && c.image ? L.enArt : '';
  const traits = [c.type ? typeLabel(c.type) : '', ...(c.domains ?? []).map(domainLabel)].filter(Boolean).join(' · ');
  sheetPanel.innerHTML = `${sheetTop(navList.length > 1)}
    <div class="stack detail">
      <div class="detail-top ${sealedItem ? 'is-sealed' : ''}" ${rarityStyle(c.rarity)}>
        <button class="card-img" data-zoom aria-label="${esc(L.v3d.open)}" title="${esc(L.v3d.open)}">${cardImg(c, true)}<span class="zoom-hint" aria-hidden="true">3D</span></button>
        <div class="detail-info">
          <h2 id="sheetTitle">${esc(cardName(c))}</h2>
          ${sealedItem
            ? `<div class="sub">${esc(L.catOne[c.category] ?? '')}${s ? `<br><b class="print">${esc(s.code)}</b> · ${esc(setName(s))}` : ''}</div>`
            : `<div class="sub">${esc(s ? setName(s) : c.set)}<br><span class="num"><b class="print">${esc(c.set)}</b> · ${esc(numLabel(c))}${s?.total && c.variant !== 'extra' ? `/${s.total}` : ''}</span>${c.variant && c.variant !== 'extra' ? ` <span class="variant">${esc(L.variant[c.variant] ?? c.variant)}</span>` : ''}</div>`}
          ${c.rarity ? `<span class="rarity" ${rarityStyle(c.rarity)}>${esc(rarityLabel(c.rarity))}${traits ? ` · ${esc(traits)}` : ''}</span>` : ''}
          ${stats ? `<span class="sub num">${stats}</span>` : ''}
          ${banHtml(c)}
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
      ${q > 0 ? `<div class="paid-line">
        <label for="cardPaid">${L.paidLabel}</label>
        <input id="cardPaid" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0,00" value="${paidOf(id) ?? ''}" data-paid-id="${esc(id)}" title="${esc(L.paidPrivate)}">
        <span class="paid-diff num" id="paidDiff">${paidDiffHtml(id)}</span>
      </div>` : ''}
      ${copiesHtml(c)}
      ${wlDetailHtml(c)}
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
      ${cm ? `<a class="cta" href="${esc(cm.url)}" target="_blank" rel="noopener">${cm.label} ${I.ext}</a>` : ''}
      ${gradedDetailBtn(c)}
      ${cm?.all ? `<a class="link-btn cm-all" href="${esc(cm.all)}" target="_blank" rel="noopener">${L.cmAll}</a>` : ''}
      ${q > 0 && p.trend ? `<p class="note num" style="text-align:center">${L.worth(q, eur(q * p.trend))}${paidOf(id) != null ? ` · ${L.boughtFor(eur(q * paidOf(id)))}` : ''}</p>` : ''}
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
    <div class="panel" id="langPanel"><h3>${L.language}</h3>${seg('ui', ui, [['fr', 'Français'], ['en', 'English'], ['zh', '中文']])}<p class="note" style="margin:0">${L.editionHint}</p></div>
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
    const { googleClientId, ...fbCfg } = cfg;
    const app = appM.initializeApp(fbCfg);
    const auth = authM.getAuth(app);
    auth.languageCode = ui === 'zh' ? 'zh-CN' : ui;
    cloud.api = { app, authM, fsM, auth, db: fsM.getFirestore(app) };
    cloud.enabled = true;
    // retour de la connexion Google dans la même fenêtre (appli installée) : succès ou erreur visibles tout de suite
    authM.getRedirectResult(auth).then((r) => { if (r?.user) toast(L.welcome); })
      .catch((e) => { cloud.error = e.code || String(e.message || e); toast(authError(cloud.error)); openAccount(); });
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
  xOnUser(u);
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
// erreur inconnue : on affiche aussi son code Firebase, pour pouvoir la diagnostiquer
function authError(code) { return L.authErr[code] ?? `${L.authErr.default} (${code || '?'})`; }
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
  // connexion par redirection, partout : le site et la page de connexion Firebase sont sur le même domaine
  // (riftdex-7e181.firebaseapp.com), le retour est donc fiable, alors que la fenêtre à part (popup) peut perdre
  // le lien avec la page Google et finir « fermée » sans connecter
  return cloudAction(() => authM.signInWithRedirect(auth, new authM.GoogleAuthProvider()), null);
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
    <a class="cta lb-cta" href="#ranking">${ic('trophy')}${T().lb.btn}</a>
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
    hisDup: theirs.filter((c) => (theirCol.owned[c.id] ?? 0) >= 2 && !qty(c.id)),               // ses doubles qui me manquent
    myDup: editionCards().filter((c) => qty(c.id) >= 2 && !(theirCol.owned[c.id] ?? 0)),       // mes doubles qui lui manquent
  };
  const tradeVal = (l) => eur(l.reduce((a, c) => a + (price(c.id) ?? 0), 0));
  const shown = sortCards(lists[fr.filter] ?? theirs, 'price-desc');
  setTopbar(`<a class="icon-btn" href="#friends" aria-label="${L.back}">${I.back}</a>
    <h1 class="small friend-title">${v.avatar ? `<img src="${esc(v.avatar)}" alt="">` : `<span class="f-avatar">${esc(v.pseudo[0]?.toUpperCase() ?? '?')}</span>`}@${esc(v.pseudo)}</h1>`);
  view.innerHTML = `<div class="stack">
    <div class="kpis">
      <div class="stat"><small>${L.kCards}</small><b class="num">${total}</b></div>
      <div class="stat"><small>${L.kUnique}</small><b class="num">${theirs.length}</b></div>
      <div class="stat"><small>${L.kValue}</small><b class="num">${eur(value)}</b></div>
    </div>
    ${lists.hisDup.length && lists.myDup.length ? `<p class="note trade-box">${T().trade(lists.hisDup.length, tradeVal(lists.hisDup), lists.myDup.length, tradeVal(lists.myDup))}</p>` : ''}
    <div class="chips">${[['all', L.fr.fAll(lang)], ['trade', L.fr.fTrade], ['give', L.fr.fGive], ['wish', L.fr.fWish], ['hisDup', T().fHisDup], ['myDup', T().fMyDup]].map(([k, l]) => `<button class="chip" data-frf="${k}" aria-pressed="${fr.filter === k}">${l} · ${lists[k].length}</button>`).join('')}</div>
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
  else if (d.fav) { fav.has(d.fav) ? fav.delete(d.fav) : fav.add(d.fav); save(); currentRender(); const isList = d.fav.startsWith('list:'); toast(fav.has(d.fav) ? (isList ? L.listFavOn : L.favOn) : (isList ? L.listFavOff : L.favOff)); }
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
  else if (d.action === 'language') { openSettings(); requestAnimationFrame(() => document.getElementById('langPanel')?.scrollIntoView({ block: 'center' })); }
  else if (d.action === 'edition') setLang(d.value);
  else if (d.action === 'account') openAccount();
  else if (d.action === 'prev') navStep(-1, true);
  else if (d.action === 'next') navStep(1, true);
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
    const data = JSON.stringify({ app: 'RiftDex', version: 1, exportedAt: new Date().toISOString(), col: user.col, paid: user.paid, x: user.x });
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
    if (data.paid && typeof data.paid === 'object') for (const l of LANGS) user.paid[l] = { ...(data.paid[l] ?? {}) };
    if (data.x && typeof data.x === 'object') { user.x = { ...XDEF(), ...data.x }; user.xAt = Date.now(); xCloudChanged(); }
    useCollection(); save(); closeCard(); currentRender(); toast(L.imported);
  } catch { toast(L.badFile); }
});
function paidInput(el, commit) {
  const id = el.dataset.paidId;
  const v = el.value.trim() === '' ? null : Math.round(Number(el.value) * 100) / 100;
  if (v != null && !(v >= 0)) return;
  if (v == null) delete user.paid[lang][id]; else user.paid[lang][id] = v;
  const box = document.getElementById('paidDiff');
  if (box) box.innerHTML = paidDiffHtml(id);
  if (commit) { save(); if (currentRender === renderCollection) currentRender(); }
}
document.addEventListener('input', (e) => { if (e.target.id === 'cardPaid') paidInput(e.target, false); });
document.addEventListener('change', (e) => { if (e.target.id === 'cardPaid') paidInput(e.target, true); });
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
  if (v3d && !v3d.hidden) { if (e.key === 'Escape') zoomClose(); return; }
  if (sheet.hidden) return;
  if (e.key === 'Escape') closeCard();
  else if (openId && (e.key === 'ArrowRight' || e.key === 'ArrowLeft') && !e.target.closest('input, textarea')) { e.preventDefault(); navStep(e.key === 'ArrowRight' ? 1 : -1, true); }
});
sheet.addEventListener('click', (e) => { if (e.target.matches('.sheet-backdrop')) closeCard(); });
// ---------- Vue 3D d'une carte (comme NightDex) : la tourner dans tous les sens, la retourner, reflet holographique ----------
let v3d = null;
const v3 = { rx: 0, ry: 0, vx: 0, vy: 0, drag: null, raf: 0, lastTap: 0, idle: 0, spin: null };
// cartes imprimées en foil (Riot : « every Rare and Epic will always be foil », showcase, hors-séries et signées aussi ;
// Proving Grounds est entièrement non foil) : seules elles brillent en 3D, les autres n'ont aucun reflet
const isShiny = (c) => !!c && !isSealed(c) && c.set !== 'OGS' && (['rare', 'epic', 'showcase', 'signature'].includes(c.rarity) || ['alt', 'star', 'sig'].includes(c.variant));
// dos des cartes : bleu (deck principal), blanc (runes), noir (légendes et champs de bataille) ; photos dans config.cardBacks
const backKind = (c) => (c.type === 'rune' ? 'rune' : c.type === 'legend' || c.type === 'battlefield' ? 'legend' : 'main');
function v3dRender() {
  const card = v3d.querySelector('.c3d');
  card.style.transform = `rotateX(${v3.rx.toFixed(2)}deg) rotateY(${v3.ry.toFixed(2)}deg)`;
  const ny = ((v3.ry % 360) + 540) % 360 - 180, nx = ((v3.rx % 360) + 540) % 360 - 180;
  const gx = 50 + Math.sin((ny * Math.PI) / 180) * 45, gy = 50 - Math.sin((nx * Math.PI) / 180) * 45;
  const hx = 50 + ny * 0.9, hy = 50 + nx * 0.9;
  const ga = Math.min(1, (Math.abs(Math.sin((ny * Math.PI) / 180)) + Math.abs(Math.sin((nx * Math.PI) / 180))) * 0.9 + 0.15);
  for (const g of v3d.querySelectorAll('.c3d-glare')) { g.style.setProperty('--hx', `${hx}%`); g.style.setProperty('--hy', `${hy}%`); g.style.setProperty('--gx', `${gx}%`); g.style.setProperty('--gy', `${gy}%`); g.style.setProperty('--ga', String(ga)); }
}
function v3dLoop() {
  cancelAnimationFrame(v3.raf);
  const step = () => {
    if (v3d.hidden) return;
    if (v3.spin) {
      const t = Math.min(1, (performance.now() - v3.spin.t0) / v3.spin.ms), e = 1 - (1 - t) ** 3;
      v3.rx = v3.spin.fx + (v3.spin.tx - v3.spin.fx) * e; v3.ry = v3.spin.fy + (v3.spin.ty - v3.spin.fy) * e;
      if (t >= 1) v3.spin = null;
    } else if (!v3.drag) {
      if (Math.abs(v3.vx) + Math.abs(v3.vy) > 0.02) { v3.rx += v3.vx; v3.ry += v3.vy; v3.vx *= 0.95; v3.vy *= 0.95; v3.idle = performance.now(); }
      else if (performance.now() - v3.idle > 2500 && !matchMedia('(prefers-reduced-motion: reduce)').matches) { // au repos : léger flottement
        const k = (performance.now() - v3.idle - 2500) / 1000;
        v3.rx += (Math.sin(k * 0.9) * 6 - (v3.rx - Math.round(v3.rx / 180) * 180)) * 0.02;
        v3.ry += (Math.sin(k * 0.6) * 10 - (v3.ry - Math.round(v3.ry / 180) * 180)) * 0.02;
      }
    }
    v3dRender();
    v3.raf = requestAnimationFrame(step);
  };
  v3.raf = requestAnimationFrame(step);
}
const v3dSpinTo = (tx, ty, ms = 650) => { v3.spin = { fx: v3.rx, fy: v3.ry, tx, ty, ms, t0: performance.now() }; v3.vx = 0; v3.vy = 0; v3.idle = performance.now(); };
const v3dFlip = () => v3dSpinTo(Math.round(v3.rx / 180) * 180, Math.round((v3.ry + 180) / 180) * 180);
function zoomOpen(c) {
  if (!v3d) {
    v3d = document.createElement('div');
    v3d.className = 'v3d'; v3d.hidden = true;
    v3d.setAttribute('role', 'dialog'); v3d.setAttribute('aria-modal', 'true');
    document.body.append(v3d);
    v3d.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      v3d.setPointerCapture?.(e.pointerId);
      v3.drag = { x: e.clientX, y: e.clientY, t: performance.now(), moved: false };
      v3.spin = null; v3.vx = 0; v3.vy = 0;
    });
    v3d.addEventListener('pointermove', (e) => {
      if (!v3.drag) return;
      const dx = e.clientX - v3.drag.x, dy = e.clientY - v3.drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) v3.drag.moved = true;
      const k = 0.45;
      v3.ry += dx * k; v3.rx -= dy * k;
      const dt = Math.max(8, performance.now() - v3.drag.t);
      v3.vy = (dx * k * 16) / dt; v3.vx = (-dy * k * 16) / dt;
      Object.assign(v3.drag, { x: e.clientX, y: e.clientY, t: performance.now() });
      v3.idle = performance.now();
    });
    const up = (e) => {
      if (!v3.drag) return;
      const tap = !v3.drag.moved;
      v3.drag = null; v3.idle = performance.now();
      if (!tap || e.type !== 'pointerup') return;
      const now = Date.now();
      if (now - v3.lastTap < 320) { v3.lastTap = 0; v3dFlip(); return; } // double-touche : retourner
      v3.lastTap = now;
      if (!e.target.closest('.c3d')) setTimeout(() => { if (v3.lastTap === now) zoomClose(); }, 320); // toucher à côté : fermer
    };
    for (const t of ['pointerup', 'pointercancel']) v3d.addEventListener(t, up);
    v3d.addEventListener('click', (e) => { const b = e.target.closest('[data-v3d]'); if (!b) return; if (b.dataset.v3d === 'close') zoomClose(); else if (b.dataset.v3d === 'flip') v3dFlip(); else if (b.dataset.v3d === 'reset') v3dSpinTo(0, 0); });
  }
  const src = imageOf(c) || placeholderArt(c);
  const sealedItem = isSealed(c);
  const glare = isShiny(c) ? '<span class="c3d-glare c3d-holo"></span><span class="c3d-glare c3d-sparkle"></span><span class="c3d-glare c3d-shine"></span>' : '';
  const kind = backKind(c);
  const backImg = config.cardBacks?.[kind];
  v3d.innerHTML = `<div class="v3d-stage">
      <div class="c3d ${sealedItem ? 'is-sealed' : ''} back-${kind}" style="--rc:${RARITY_HEX[c.rarity] ?? 'var(--accent)'}">
        <div class="c3d-face c3d-front"><img src="${esc(src)}" alt="${esc(cardName(c))}" draggable="false">${sealedItem ? '' : glare}</div>
        <div class="c3d-face c3d-back">${sealedItem ? '' : backImg ? `<img src="${esc(backImg)}" alt="" draggable="false">` : `<span class="c3d-back-default"><svg viewBox="0 0 512 512" aria-hidden="true"><path d="M262 74 L238 168 L276 214 L230 300 L268 344 L246 446 L300 330 L262 290 L306 206 L270 160 Z"/></svg><b>RIFT<i>DEX</i></b></span>`}</div>
      </div>
    </div>
    <div class="v3d-bar">
      ${sealedItem ? '' : `<button class="chip" data-v3d="flip">${I.flip}<span>${L.v3d.flip}</span></button>`}
      <button class="chip" data-v3d="reset">${L.v3d.reset}</button>
    </div>
    <p class="v3d-tip">${L.v3d.tip}</p>
    <button class="icon-btn v3d-close" data-v3d="close" aria-label="${L.close}">${I.x}</button>`;
  v3d.hidden = false;
  Object.assign(v3, { rx: -12, ry: -200, vx: 0, vy: 0, drag: null, idle: performance.now() });
  v3dSpinTo(0, 0, 900); // entrée : la carte arrive en tournoyant
  v3dLoop();
  v3d.querySelector('.v3d-close').focus({ preventScroll: true });
}
function zoomClose() { if (v3d) { v3d.hidden = true; cancelAnimationFrame(v3.raf); sheet.querySelector('[data-zoom]')?.focus({ preventScroll: true }); } }
document.addEventListener('click', (e) => {
  if (!e.target.closest('[data-zoom]')) return;
  const c = openId ? cardsById.get(openId) : null;
  if (c) zoomOpen(c);
});

// ---------- Navigation ----------
let currentTab = 'home';
// ======================================================================================================
// Fonctions « collectionneur » : données perso synchronisées, doubles et échanges, statistiques, badges,
// cartes interdites, actualités officielles et calendrier des sorties.
// ======================================================================================================
const TX = {
  fr: {
    colTabs: { cards: 'Cartes', binders: 'Classeurs', stats: 'Stats', graded: 'Gradées' },
    dupChip: 'Doubles', dupHint: (n) => `${n} carte${n > 1 ? 's' : ''} en double : de quoi échanger avec tes amis.`,
    fHisDup: 'Ses doubles qui te manquent', fMyDup: 'Tes doubles qui lui manquent',
    trade: (a, va, b, vb) => `Échange possible : tu reçois <b>${a}</b> carte${a > 1 ? 's' : ''} (≈ ${va}), tu donnes <b>${b}</b> carte${b > 1 ? 's' : ''} (≈ ${vb}).`,
    stats: { title: 'Statistiques', pct: 'Complétion', rarity: 'Par rareté', domain: 'Par domaine', sets: 'Par série', best: 'Tes plus belles cartes', risers: 'Ta plus forte hausse (30 j)', complete: 'Séries complètes', badges: 'Badges', none: 'Ajoute des cartes à ta collection pour voir tes statistiques.' },
    badgeNew: (n) => `Badge débloqué${n ? ` : ${n}` : ''}`, badgesOf: (a, b) => `${a} / ${b} débloqués`,
    banned: (d, f, future) => `${future ? 'Interdite à partir du' : 'Interdite depuis le'} ${d} en ${f}`, banFormats: { standard: 'Standard', '2v2': '2v2' }, banSource: 'Annonce de Riot',
    news: 'Actualités', newsTitle: 'Actualités officielles', newsNone: 'Pas encore d\'actualités : elles sont relevées chaque jour.', newsRead: 'Lire sur le site de Riot',
    cal: 'Calendrier des sorties', calIn: (n) => (n === 0 ? 'aujourd\'hui' : n === 1 ? 'demain' : `dans ${n} jours`), calOut: 'sortie', calNext: 'Prochaine sortie',
    rulesNeeded: 'Tes classeurs, decks et alertes restent sur cet appareil : publie les nouvelles règles Firestore (README) pour les synchroniser.',
  },
  en: {
    colTabs: { cards: 'Cards', binders: 'Binders', stats: 'Stats', graded: 'Graded' },
    dupChip: 'Duplicates', dupHint: (n) => `${n} duplicate card${n > 1 ? 's' : ''}: something to trade with your friends.`,
    fHisDup: 'Their duplicates you lack', fMyDup: 'Your duplicates they lack',
    trade: (a, va, b, vb) => `Possible trade: you get <b>${a}</b> card${a > 1 ? 's' : ''} (≈ ${va}), you give <b>${b}</b> card${b > 1 ? 's' : ''} (≈ ${vb}).`,
    stats: { title: 'Statistics', pct: 'Completion', rarity: 'By rarity', domain: 'By domain', sets: 'By set', best: 'Your finest cards', risers: 'Your biggest risers (30 d)', complete: 'Complete sets', badges: 'Badges', none: 'Add cards to your collection to see your statistics.' },
    badgeNew: (n) => `Badge unlocked${n ? `: ${n}` : ''}`, badgesOf: (a, b) => `${a} / ${b} unlocked`,
    banned: (d, f, future) => `${future ? 'Banned from' : 'Banned since'} ${d} in ${f}`, banFormats: { standard: 'Standard', '2v2': '2v2' }, banSource: 'Riot announcement',
    news: 'News', newsTitle: 'Official news', newsNone: 'No news yet: it is collected every day.', newsRead: 'Read on Riot\'s website',
    cal: 'Release calendar', calIn: (n) => (n === 0 ? 'today' : n === 1 ? 'tomorrow' : `in ${n} days`), calOut: 'released', calNext: 'Next release',
    rulesNeeded: 'Your binders, decks and alerts stay on this device: publish the new Firestore rules (README) to sync them.',
  },
  zh: {
    colTabs: { cards: '卡牌', binders: '卡册', stats: '统计', graded: '评级卡' },
    dupChip: '重复', dupHint: (n) => `${n} 张重复卡牌：可以和好友交换。`,
    fHisDup: '他的重复卡（你缺少）', fMyDup: '你的重复卡（他缺少）',
    trade: (a, va, b, vb) => `可以交换：你得到 <b>${a}</b> 张（≈ ${va}），你给出 <b>${b}</b> 张（≈ ${vb}）。`,
    stats: { title: '统计', pct: '完成度', rarity: '按稀有度', domain: '按特性', sets: '按系列', best: '你最珍贵的卡牌', risers: '涨幅最大（30 天）', complete: '已集齐系列', badges: '徽章', none: '添加卡牌后即可查看统计。' },
    badgeNew: (n) => `解锁徽章${n ? `：${n}` : ''}`, badgesOf: (a, b) => `已解锁 ${a} / ${b}`,
    banned: (d, f, future) => `${future ? '自' : '自'} ${d} 起在 ${f} 中禁用`, banFormats: { standard: '标准', '2v2': '2v2' }, banSource: 'Riot 公告',
    news: '资讯', newsTitle: '官方资讯', newsNone: '暂无资讯：每天更新。', newsRead: '在 Riot 官网阅读',
    cal: '发售日历', calIn: (n) => (n === 0 ? '今天' : n === 1 ? '明天' : `${n} 天后`), calOut: '已发售', calNext: '下一次发售',
    rulesNeeded: '卡册、卡组和提醒仅保存在此设备上：发布新的 Firestore 规则（见 README）即可同步。',
  },
};
const T = () => TX[ui] ?? TX.en;
const I2 = {
  news: '<svg viewBox="0 0 24 24"><path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M19 6.5a8 8 0 0 1 0 11"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M9 20h6"/></svg>',
  ban: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/></svg>',
  slab: '<svg viewBox="0 0 24 24"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 7.5h14"/><rect x="8" y="10" width="8" height="9" rx="1"/></svg>',
  rules: '<svg viewBox="0 0 24 24"><path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20z"/><path d="M15 3.5V8h4M9 12h7M9 15.5h7"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.4 11h10.2L20 8H6.2"/><circle cx="9.5" cy="19.5" r="1.5"/><circle cx="17" cy="19.5" r="1.5"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  book: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3"/></svg>',
  cards: '<svg viewBox="0 0 24 24"><rect x="8" y="3.5" width="11.5" height="16.5" rx="2"/><path d="M5 7v11.5a2 2 0 0 0 2 2h8"/></svg>',
  coin: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="6.5" rx="7" ry="3"/><path d="M5 6.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/><path d="M5 11.5v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/></svg>',
  palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.6-1 1-2-.7-1.2.1-2.5 1.5-2.5H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10.5" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8z"/><path d="M18.5 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></svg>',
  pen: '<svg viewBox="0 0 24 24"><path d="M3.5 20c3-1 5-4 8-4 2 0 2 2 4 2s3-1 5-2.5"/><path d="M15 4l3 3-8.5 8.5-4 1 1-4z"/></svg>',
  frame: '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="m4 17 5-5 4 4 3-3 4 4"/><circle cx="15.5" cy="9" r="1.5"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/></svg>',
  crown: '<svg viewBox="0 0 24 24"><path d="M4 8l4 4 4-6 4 6 4-4-2 10H6z"/><path d="M6 21h12"/></svg>',
  rune: '<svg viewBox="0 0 24 24"><path d="M12 3l7 9-7 9-7-9z"/><path d="M12 8v8M9 12h6"/></svg>',
  friends: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="9.5" r="2.6"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M14.5 18.5a4.5 4.5 0 0 1 6.5-2"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  cross: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
};
// icône en ligne (même trait que les icônes de l'appli, comme NightDex)
const ic = (k) => `<span class="ic">${I2[k] ?? I[k] ?? ''}</span>`;
// fiche officielle de la carte (texte et règles à jour, errata compris) dans la galerie de Riot
const officialUrl = (c) => (c?.gid ? `https://playriftbound.com/${{ fr: 'fr-fr', en: 'en-us', zh: 'zh-cn' }[ui] ?? 'en-us'}/card-gallery/#card-gallery--${encodeURIComponent(c.gid)}` : null);

// ---------- Données perso des nouvelles fonctions : sur l'appareil, et sur le compte (document private/<uid>) ----------
const XDEF = () => ({ binders: [], wl: [], alerts: {}, copies: {}, graded: [], decks: [], badges: [], badgesInit: false, newsSeen: '' });
user.x = { ...XDEF(), ...(user.x && typeof user.x === 'object' ? user.x : {}) };
const xc = { unsub: null, timer: 0, denied: false };
function xSave() { user.xAt = Date.now(); save(); xCloudChanged(); }
const xRef = () => cloud.api.fsM.doc(cloud.api.db, 'private', cloud.user.uid);
function xCloudChanged() {
  if (!cloud.user || xc.denied) return;
  clearTimeout(xc.timer);
  xc.timer = setTimeout(async () => {
    try { await cloud.api.fsM.setDoc(xRef(), { blob: JSON.stringify({ x: user.x, at: user.xAt ?? 0 }), updatedAt: cloud.api.fsM.serverTimestamp() }); }
    catch (e) { if (e?.code === 'permission-denied') xc.denied = true; }
  }, 1500);
}
function xOnUser(u) {
  xc.unsub?.(); xc.unsub = null; xc.denied = false;
  if (!u) return;
  let first = true;
  xc.unsub = cloud.api.fsM.onSnapshot(xRef(), (snap) => {
    if (snap.metadata.hasPendingWrites) return;
    let remote = null;
    try { remote = snap.exists() ? JSON.parse(snap.data().blob) : null; } catch { remote = null; }
    if (remote && (remote.at ?? 0) > (user.xAt ?? 0)) {     // changement fait sur un autre appareil : il fait foi
      user.x = { ...XDEF(), ...remote.x }; user.xAt = remote.at;
      try { localStorage.setItem(KEY, JSON.stringify(user)); } catch { /* */ }
      if (sheet.hidden) currentRender();
    } else if (first && (user.xAt ?? 0) > (remote?.at ?? 0)) xCloudChanged(); // l'appareil est plus récent : on envoie
    first = false;
  }, (e) => { if (e?.code === 'permission-denied') xc.denied = true; });
}

// ---------- Doubles ----------
const dupCards = () => editionCards().filter((c) => qty(c.id) >= 2);

// ---------- Cartes interdites (annonces officielles, data/config.json → banlist) ----------
let banMap = null;
function banInfo(c) {
  if (!banMap) {
    banMap = new Map();
    for (const b of config.banlist?.items ?? []) banMap.set(fold(b.name).replace(/[’']/g, "'"), b);
  }
  return isSealed(c) ? null : banMap.get(fold(c.nameEn ?? c.name).replace(/[’']/g, "'")) ?? null;
}
function banHtml(c) {
  const b = banInfo(c);
  if (!b) return '';
  const future = b.from > new Date().toISOString().slice(0, 10);
  const f = b.formats.map((x) => T().banFormats[x] ?? x).join(' / ');
  return `<a class="ban-badge" href="${esc(b.url)}" target="_blank" rel="noopener" title="${esc(T().banSource)}">${I2.ban}<span>${esc(T().banned(fmt.date.format(parseDay(b.from)), f, future))}</span></a>`;
}

// ---------- Statistiques et badges (Collection → Stats) ----------
function statBars(rows) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return `<div class="sbars">${rows.map((r) => `<div class="sbar"><span class="sbar-label">${r.label}</span>
    <span class="sbar-track"><i style="width:${((r.own / max) * 100).toFixed(1)}%;--c:${r.color ?? 'var(--accent)'}"></i><s style="width:${((r.total / max) * 100).toFixed(1)}%"></s></span>
    <span class="sbar-num num">${r.own}<small>/${r.total}</small></span></div>`).join('')}</div>`;
}
// badges : seuils de cartes et de valeur, séries complètes, listes complètes, raretés
function badgeDefs() {
  const cards = editionCards().filter((c) => !isExtraCard(c));
  const owned = cards.filter((c) => qty(c.id) > 0);
  const copies = cards.reduce((a, c) => a + qty(c.id), 0);
  const value = allItems().reduce((a, c) => a + qty(c.id) * (price(c.id) ?? 0), 0);
  const B = (id, icon, name, desc, got, prog) => ({ id, icon, name, desc, got, prog });
  const tr = (fr, en, zh) => ({ fr, en, zh })[ui] ?? en;
  const defs = [];
  for (const n of [1, 10, 50, 100, 250, 500, 1000]) defs.push(B(`cards-${n}`, 'cards', tr(`${n} carte${n > 1 ? 's' : ''}`, `${n} card${n > 1 ? 's' : ''}`, `${n} 张卡牌`), tr(`Posséder ${n} carte${n > 1 ? 's' : ''}`, `Own ${n} card${n > 1 ? 's' : ''}`, `拥有 ${n} 张卡牌`), copies >= n, Math.min(1, copies / n)));
  for (const n of [10, 100, 500, 1000, 5000]) defs.push(B(`value-${n}`, 'coin', tr(`${n} € de cartes`, `€${n} of cards`, `${n} € 收藏`), tr(`Une collection qui vaut ${n} €`, `A collection worth €${n}`, `收藏价值达到 ${n} €`), value >= n, Math.min(1, value / n)));
  const has = (f) => owned.some(f);
  defs.push(B('first-alt', 'palette', tr('Première alternative', 'First alternate art', '首张异画'), tr('Posséder une illustration alternative', 'Own an alternate art', '拥有一张异画卡'), has((c) => c.variant === 'alt'), has((c) => c.variant === 'alt') ? 1 : 0));
  defs.push(B('first-star', 'sparkle', tr('Premier hors-série', 'First overnumbered', '首张超编'), tr('Posséder un hors-série', 'Own an overnumbered card', '拥有一张超编卡'), has((c) => c.variant === 'star'), has((c) => c.variant === 'star') ? 1 : 0));
  defs.push(B('first-sig', 'pen', tr('Signature', 'Signature', '签名卡'), tr('Posséder une carte signée', 'Own a signed card', '拥有一张签名卡'), has((c) => c.variant === 'sig' || c.rarity === 'signature'), has((c) => c.variant === 'sig' || c.rarity === 'signature') ? 1 : 0));
  const altN = owned.filter((c) => c.variant === 'alt').length;
  defs.push(B('alt-10', 'frame', tr('Galerie d\'art', 'Art gallery', '画廊'), tr('10 illustrations alternatives', '10 alternate arts', '10 张异画'), altN >= 10, Math.min(1, altN / 10)));
  for (const s of visibleSets().filter((x) => x.block === 'main')) {
    const tot = setTotal(s), own = ownedIn(s.code);
    defs.push(B(`set-${s.code}`, 'trophy', tr(`${setName(s)} complète`, `${setName(s)} complete`, `集齐${setName(s)}`), tr(`Toutes les cartes de ${setName(s)}`, `Every card of ${setName(s)}`, `${setName(s)} 的所有卡牌`), tot > 0 && own >= tot, tot ? own / tot : 0));
  }
  for (const id of ['kda', 'heartsteel', 'legend', 'rune']) {
    const d = allLists().find((x) => x.id === id);
    const lc = d ? listCards(d) : [];
    if (!lc.length) continue;
    const own = lc.filter((c) => qty(c.id) > 0).length;
    defs.push(B(`list-${id}`, id === 'kda' || id === 'heartsteel' ? 'mic' : id === 'rune' ? 'rune' : 'crown', listTitle(d), listDesc(d), own >= lc.length, own / lc.length));
  }
  defs.push(B('friend', 'friends', tr('Entre amis', 'With friends', '好友'), tr('Avoir un ami sur RiftDex', 'Have a friend on RiftDex', '在 RiftDex 上有一位好友'), fr.list.length > 0, fr.list.length ? 1 : 0));
  defs.push(B('polyglot', 'globe', tr('Polyglotte', 'Polyglot', '多语言'), tr('Des cartes dans les trois éditions', 'Cards in all three editions', '三个版本都有卡牌'), LANGS.every((l) => Object.values(user.col[l].owned).some((q) => q > 0)), LANGS.filter((l) => Object.values(user.col[l].owned).some((q) => q > 0)).length / 3));
  return defs;
}
// nouveau badge gagné : petite célébration (une fois par badge et par édition)
let badgeTimer = 0;
function badgeCheck() {
  clearTimeout(badgeTimer);
  badgeTimer = setTimeout(() => {
    if (!catalog.cards.length) return;
    const got = badgeDefs().filter((b) => b.got).map((b) => [`${lang}:${b.id}`, b]);
    const seen = new Set(user.x.badges);
    const fresh = got.filter(([k]) => !seen.has(k));
    if (!fresh.length) return;
    user.x.badges = [...seen, ...fresh.map(([k]) => k)];
    const init = !user.x.badgesInit;
    user.x.badgesInit = true;
    xSave();
    if (!init) celebrate(fresh[0][1]);
  }, 400);
}
function celebrate(b) {
  const el = document.createElement('div');
  el.className = 'badge-pop';
  el.innerHTML = `<span class="bp-icon">${ic(b.icon)}</span><span><small>${esc(T().badgeNew(''))}</small><b>${esc(b.name)}</b></span>${'<i></i>'.repeat(14)}`;
  document.body.append(el);
  setTimeout(() => el.remove(), 3600);
}
function renderStats() {
  const cards = editionCards().filter((c) => !isExtraCard(c));
  const owned = cards.filter((c) => qty(c.id) > 0);
  if (!owned.length) return `<div class="empty"><strong>${T().stats.title}</strong>${T().stats.none}</div>`;
  const rarRows = RARITIES.map((r) => ({ label: `<span class="rarity" ${rarityStyle(r)}>${esc(rarityLabel(r))}</span>`, own: owned.filter((c) => c.rarity === r).length, total: cards.filter((c) => c.rarity === r).length, color: `var(--r-${r})` })).filter((r) => r.total);
  const doms = Object.keys(DOMAIN_HEX).map((d) => ({ label: esc(domainLabel(d)), own: owned.filter((c) => c.domains?.includes(d)).length, total: cards.filter((c) => c.domains?.includes(d)).length, color: DOMAIN_HEX[d] })).filter((r) => r.total);
  const sets = visibleSets().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map((s) => ({ label: `<b class="print">${esc(s.code)}</b>`, own: ownedIn(s.code), total: setTotal(s) }));
  const complete = sets.filter((s) => s.total && s.own >= s.total).length;
  const best = sortCards(owned.filter((c) => price(c.id) != null), 'price-desc').slice(0, 6);
  const risers = owned.map((c) => [c, change(c.id, 30)]).filter(([, v]) => v != null && v > 0).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const defs = badgeDefs();
  const gotN = defs.filter((b) => b.got).length;
  return `<div class="kpis">
      <div class="stat"><small>${L.kUnique}</small><b class="num">${owned.length}<small>/${cards.length}</small></b></div>
      <div class="stat"><small>${T().stats.pct}</small><b class="num">${Math.floor((owned.length / Math.max(1, cards.length)) * 100)} %</b></div>
      <div class="stat"><small>${T().stats.complete}</small><b class="num">${complete}</b></div>
    </div>
    <section class="panel"><h3>${T().stats.rarity}</h3>${statBars(rarRows)}</section>
    <section class="panel"><h3>${T().stats.domain}</h3>${statBars(doms)}</section>
    <section class="panel"><h3>${T().stats.sets}</h3>${statBars(sets)}</section>
    ${best.length ? `<h2 class="section-title">${T().stats.best}</h2><div class="cards">${best.map(cardTile).join('')}</div>` : ''}
    ${risers.length ? `<h2 class="section-title">${T().stats.risers}</h2><div class="rows">${risers.map(([c]) => cardRow(c, 30)).join('')}</div>` : ''}
    <h2 class="section-title">${T().stats.badges} <small class="num">${T().badgesOf(gotN, defs.length)}</small></h2>
    <div class="badges">${defs.map((b) => `<div class="badge ${b.got ? 'got' : ''}" title="${esc(b.desc)}"><span class="b-icon">${ic(b.icon)}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small>${b.got ? '' : `<span class="b-prog"><i style="width:${(b.prog * 100).toFixed(0)}%"></i></span>`}</div>`).join('')}</div>`;
}

// ---------- Actualités officielles et calendrier des sorties ----------
let newsFile = null;
async function newsLoad() {
  if (newsFile) return newsFile;
  try { newsFile = await fetch('data/news.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)); } catch { newsFile = null; }
  return newsFile;
}
const newsItems = () => newsFile?.items?.[ui] ?? newsFile?.items?.en ?? [];
const newsUnread = () => newsItems().filter((n) => n.date > (user.x.newsSeen || '')).length;
const newsBtn = () => `<a class="icon-btn news-btn" href="#news" aria-label="${T().news}" title="${T().news}">${I2.news}${newsFile && user.x.newsSeen && newsUnread() ? `<span class="fbadge">${newsUnread()}</span>` : ''}</a>`;
function calendarHtml() {
  const today = new Date().toISOString().slice(0, 10);
  const sets = catalog.sets.filter((s) => s.releaseDate && s.block !== 'cn').sort((a, b) => (a.releaseDate < b.releaseDate ? 1 : -1));
  const next = [...sets].reverse().find((s) => s.releaseDate >= today);
  const days = (d) => Math.round((parseDay(d) - parseDay(today)) / 864e5);
  return `<section class="panel calendar"><h3>${T().cal}</h3>
    ${next ? `<div class="cal-next" ${artStyle(next.code)}><small>${T().calNext}</small><b>${esc(setName(next))}</b><span class="num">${fmt.date.format(parseDay(next.releaseDate))} · ${T().calIn(days(next.releaseDate))}</span></div>` : ''}
    <ol class="cal-list">${sets.map((s) => `<li class="${s.releaseDate > today ? 'future' : ''}"><span class="num">${fmt.date.format(parseDay(s.releaseDate))}</span><a href="#set-${esc(s.code)}"><b class="print">${esc(s.code)}</b> ${esc(setName(s))}</a><small>${s.releaseDate > today ? T().calIn(days(s.releaseDate)) : T().calOut}</small></li>`).join('')}</ol>
  </section>`;
}
async function renderNews() {
  setTopbar(`<a class="icon-btn" href="#home" aria-label="${L.back}">${I.back}</a><h1 class="small">${T().newsTitle}</h1>`);
  view.innerHTML = `<div class="stack">${calendarHtml()}<div class="empty"><strong>…</strong></div></div>`;
  await newsLoad();
  if (currentRender !== renderNews) return;
  const items = newsItems();
  const seen = user.x.newsSeen || '';
  view.innerHTML = `<div class="stack">
    ${calendarHtml()}
    <h2 class="section-title">${T().newsTitle}</h2>
    ${items.length ? `<div class="news-list">${items.map((n) => `<a class="news-item ${n.date > seen && seen ? 'unread' : ''}" href="${esc(n.url)}" target="_blank" rel="noopener">
      ${n.image ? `<img src="${esc(n.image)}" alt="" loading="lazy">` : '<span class="news-noimg"></span>'}
      <span class="news-text"><small>${esc(n.category)} · ${n.date ? fmt.date.format(parseDay(n.date)) : ''}</small><b>${esc(n.title)}</b>${n.desc ? `<span>${esc(n.desc)}</span>` : ''}</span></a>`).join('')}</div>`
      : `<div class="empty"><strong>${T().newsTitle}</strong>${T().newsNone}</div>`}
  </div>`;
  if (items[0]?.date && items[0].date > seen) { user.x.newsSeen = items[0].date; xSave(); }
}

// ---------- Collection : onglets Cartes, Classeurs, Stats, Gradées ----------
const COL_TAB_RENDER = { stats: renderStats };   // les autres onglets s'ajoutent plus bas (classeurs, cartes gradées)
const COL_TAB_MOUNT = {};
const colTabs = () => ['cards', 'binders', 'stats', 'graded'].filter((t) => t === 'cards' || COL_TAB_RENDER[t]);
const colTabsSeg = (tab) => seg('colTab', tab, colTabs().map((t) => [t, T().colTabs[t]]));
const colTabHtml = (tab) => (COL_TAB_RENDER[tab] ? COL_TAB_RENDER[tab]() : '');
const colTabMounted = (tab) => COL_TAB_MOUNT[tab]?.();

// ---------- Classeurs virtuels (comme les « Classeurs » de Pokécardex) ----------
// Classeurs perso : pages de 9 (3×3) ou 12 (4×3) cases, couverture de couleur, cartes placées case par case.
// Classeurs « Master Set » : une série entière dans l'ordre des numéros, les cartes manquantes en gris (lecture seule).
Object.assign(TX.fr, { bd: {
  layout: 'Format des pages', limit: 'Un classeur perso en version gratuite. Classeurs illimités avec le statut Soutien.', plusTitle: 'RiftDex Soutien', plusUnlimited: 'Classeurs illimités', plusMore: '… et d\'autres avantages (photo de profil, cadre doré)', plusBtn: 'Soutenir RiftDex', plusHint: 'Après ton don, ton statut Soutien est activé sur ton compte (mets ton ID RiftDex dans le message).', value: (a, b) => `~${a} / ~${b}`, owned: (a, b) => `${a}/${b} carte${b > 1 ? 's' : ''} possédée${b > 1 ? 's' : ''}`, settings: 'Réglages du classeur',
  mine: 'Mes classeurs', master: 'Master Set des séries', new: 'Nouveau classeur', name: 'Nom du classeur', namePh: 'Mes Légendes, Mon classeur Zaun…', size: 'Cases par page',
  color: 'Couverture', create: 'Créer', pages: (n) => `${n} page${n > 1 ? 's' : ''}`, cards: (a, b) => `${a}/${b} cartes`, page: (a, b) => `Page ${a} / ${b}`,
  edit: 'Modifier', done: 'Terminé', fill: 'Remplir avec…', fillSet: 'une série', fillList: 'une liste', fillOwned: 'mes cartes possédées', addPage: 'Ajouter une page',
  rename: 'Renommer', del: 'Supprimer le classeur', delConfirm: 'Toucher encore pour supprimer', pick: 'Choisir une carte', pickPh: 'Nom ou numéro de carte', remove: 'Retirer',
  none: 'Crée ton premier classeur pour ranger tes cartes comme dans un vrai classeur.', readOnly: 'Classeur automatique : la série dans l\'ordre, les cartes manquantes en gris.', created: 'Classeur créé', deleted: 'Classeur supprimé',
} });
Object.assign(TX.en, { bd: {
  layout: 'Page layout', limit: 'One custom binder in the free version. Unlimited binders with the Supporter status.', plusTitle: 'RiftDex Supporter', plusUnlimited: 'Unlimited binders', plusMore: '… and other perks (profile picture, gold frame)', plusBtn: 'Support RiftDex', plusHint: 'After your donation, the Supporter status is turned on for your account (put your RiftDex ID in the message).', value: (a, b) => `~${a} / ~${b}`, owned: (a, b) => `${a}/${b} card${b > 1 ? 's' : ''} owned`, settings: 'Binder settings',
  mine: 'My binders', master: 'Master Set binders', new: 'New binder', name: 'Binder name', namePh: 'My Legends, Zaun binder…', size: 'Pockets per page',
  color: 'Cover', create: 'Create', pages: (n) => `${n} page${n > 1 ? 's' : ''}`, cards: (a, b) => `${a}/${b} cards`, page: (a, b) => `Page ${a} / ${b}`,
  edit: 'Edit', done: 'Done', fill: 'Fill with…', fillSet: 'a set', fillList: 'a list', fillOwned: 'my owned cards', addPage: 'Add a page',
  rename: 'Rename', del: 'Delete binder', delConfirm: 'Tap again to delete', pick: 'Choose a card', pickPh: 'Card name or number', remove: 'Remove',
  none: 'Create your first binder to store your cards like in a real binder.', readOnly: 'Automatic binder: the set in order, missing cards in grey.', created: 'Binder created', deleted: 'Binder deleted',
} });
Object.assign(TX.zh, { bd: {
  layout: '页面格式', limit: '免费版可创建一本自定义卡册。支持者无限制。', plusTitle: 'RiftDex 支持者', plusUnlimited: '无限卡册', plusMore: '…以及其他特权（头像、金色边框）', plusBtn: '支持 RiftDex', plusHint: '捐赠后，你的账号将开通支持者身份（请在留言中写上你的 RiftDex ID）。', value: (a, b) => `~${a} / ~${b}`, owned: (a, b) => `已拥有 ${a}/${b} 张`, settings: '卡册设置',
  mine: '我的卡册', master: '系列大师卡册', new: '新建卡册', name: '卡册名称', namePh: '我的传奇、祖安卡册…', size: '每页格数',
  color: '封面', create: '创建', pages: (n) => `${n} 页`, cards: (a, b) => `${a}/${b} 张`, page: (a, b) => `第 ${a} / ${b} 页`,
  edit: '编辑', done: '完成', fill: '填充…', fillSet: '一个系列', fillList: '一个列表', fillOwned: '我拥有的卡牌', addPage: '添加一页',
  rename: '重命名', del: '删除卡册', delConfirm: '再点一次删除', pick: '选择卡牌', pickPh: '卡牌名称或编号', remove: '移除',
  none: '创建你的第一本卡册，像真正的卡册一样整理卡牌。', readOnly: '自动卡册：按编号排列整个系列，缺少的卡牌显示为灰色。', created: '已创建卡册', deleted: '已删除卡册',
} });
const BD_COLORS = ['#7a1f2b', '#1f3a7a', '#1f6b4a', '#5b2a86', '#8a6a1f', '#1b1b1f', '#b0475f', '#2a7d8c'];
const bd = { page: 0, edit: false, confirmDel: false, pickSlot: null, pickQ: '' };
const myBinders = () => user.x.binders.filter((b) => b.lang === lang);
// formats de page (colonnes × lignes) ; anciens classeurs : 9 cases = 3×3, 12 cases = 4×3
const BD_LAYOUTS = [['2x2', '2×2'], ['3x3', '3×3'], ['3x4', '3×4'], ['4x3', '4×3'], ['4x4', '4×4']];
const bdDims = (b) => { if (!b.cols) { b.cols = b.size === 12 ? 4 : 3; b.rows = b.size === 12 ? 3 : 3; } return [b.cols, b.rows]; };
// gratuit : un seul classeur perso (toutes éditions) ; illimité avec le statut Soutien
const BD_FREE = 1;
const canAddBinder = () => !!cloud.supporter || user.x.binders.length < BD_FREE;
function binderOf(id) {
  if (id.startsWith('set-')) {   // Master Set d'une série
    const s = setOf(id.slice(4));
    if (!s || !editionSet(s)) return null;
    return { id, name: setName(s), size: 9, cols: 3, rows: 3, color: '#0f1625', auto: true, set: s, slots: setCards(s.code).map((c) => c.id) };
  }
  const b = myBinders().find((x) => x.id === id) ?? null;
  if (b) bdDims(b);
  return b;
}
const binderPages = (b) => Math.max(1, Math.ceil(b.slots.length / b.size));
function binderCover(b) {
  bdDims(b);
  const cards = b.slots.map((id) => cardsById.get(id)).filter(Boolean);
  const ownedCards = cards.filter((c) => qty(c.id) > 0);
  const vOwn = ownedCards.reduce((a, c) => a + (price(c.id) ?? 0), 0), vAll = cards.reduce((a, c) => a + (price(c.id) ?? 0), 0);
  const art = bestArt(cards);
  return `<a class="binder-card ${b.auto ? 'auto' : ''}" href="#binder-${esc(b.id)}" style="--bc:${esc(b.color)}">
    <span class="bk-art">${art ? `<img src="${esc(art)}" alt="" loading="lazy">` : ''}</span>
    <span class="bk-text">${b.auto ? `<b class="print">${esc(b.set.code)}</b>` : ''}<strong>${esc(b.name)}</strong>
      <span>${T().bd.owned(ownedCards.length, cards.length)}</span><span>${T().bd.pages(binderPages(b))} · ${b.cols}×${b.rows}</span>
      <em class="num">${T().bd.value(eur(vOwn), eur(vAll))}</em></span>
  </a>`;
}
function renderBinders() {
  const mine = myBinders();
  const form = canAddBinder() ? `<section class="panel binder-new">
      <h3>${T().bd.new}</h3>
      <form id="binderForm" class="binder-form">
        <input class="search" id="binderName" maxlength="40" placeholder="${esc(T().bd.namePh)}" aria-label="${esc(T().bd.name)}" autocomplete="off">
        <div class="bf-row"><span>${T().bd.layout}</span>${seg('bdLayout', user.prefs.bdLayout ?? '3x3', BD_LAYOUTS)}</div>
        <div class="bf-row"><span>${T().bd.color}</span><div class="bd-colors">${BD_COLORS.map((c, i) => `<label style="--c:${c}"><input type="radio" name="bdColor" value="${c}" ${i === 0 ? 'checked' : ''}><i></i></label>`).join('')}</div></div>
        <button class="cta">${T().bd.create}</button>
      </form>
      ${cloud.supporter ? '' : `<p class="note" style="margin:0">${T().bd.limit}</p>`}
    </section>` : `<section class="plus-card">
      <strong class="plus-logo">RIFT<i>DEX</i><span>+</span></strong>
      <p><span class="plus-ic">${ic('book')}</span>${T().bd.plusUnlimited}</p>
      <p><span class="plus-ic">${ic('star')}</span>${T().bd.plusMore}</p>
      ${supportUrl() ? `<a class="plus-btn" href="${esc(supportUrl())}" target="_blank" rel="noopener">${ic('heart')}${T().bd.plusBtn}</a>` : ''}
      <small>${T().bd.plusHint}</small>
    </section>`;
  return `<h2 class="section-title">${T().bd.mine} <small class="num">${mine.length}</small></h2>
    ${mine.length ? `<div class="binder-list">${mine.map(binderCover).join('')}</div>` : `<p class="note">${T().bd.none}</p>`}
    ${form}
    <h2 class="section-title">${T().bd.master}</h2>
    <div class="binder-list">${visibleSets().sort((a, b) => (a.order ?? 999) - (b.order ?? 999)).map((s) => binderCover(binderOf(`set-${s.code}`))).join('')}</div>`;
}
COL_TAB_RENDER.binders = renderBinders;
function slotHtml(b, i) {
  const id = b.slots[i];
  const c = id ? cardsById.get(id) : null;
  if (!c) return `<button class="slot empty" ${b.auto ? 'disabled' : `data-bslot="${i}"`} aria-label="${T().bd.pick}">${b.auto ? '' : '+'}</button>`;
  const q = qty(c.id), p = price(c.id);
  return `<div class="slot ${q ? 'owned' : 'missing'}">
    <button class="slot-card" data-open="${esc(c.id)}" aria-label="${esc(cardName(c))}">${cardImg(c)}</button>
    ${p != null && user.prefs.bdPrices !== 'off' ? `<span class="slot-price num">${eur(p)}</span>` : ''}
    ${bd.edit && !b.auto ? `<button class="slot-x" data-bremove="${i}" aria-label="${T().bd.remove}">${I.x}</button>` : ''}
    ${q > 1 ? `<span class="slot-q num">×${q}</span>` : ''}
  </div>`;
}
function renderBinder(id) {
  const b = binderOf(id);
  if (!b) { location.hash = '#collection'; return; }
  const pages = binderPages(b);
  bd.page = Math.min(bd.page, pages - 1);
  const spread = isPC() ? 2 : 1;
  const first = Math.floor(bd.page / spread) * spread;
  const cards = b.slots.map((x) => cardsById.get(x)).filter(Boolean);
  const own = cards.filter((c) => qty(c.id) > 0).length;
  setTopbar(`<a class="icon-btn" href="#collection" aria-label="${L.back}">${I.back}</a><h1 class="small">${b.auto ? `<span class="title-code">${esc(b.set.code)}</span>` : ''}${esc(b.name)}</h1>
    <button class="icon-btn ${user.prefs.bdPrices === 'off' ? '' : 'on'}" data-bd="prices" aria-label="€" title="€">€</button>`);
  const page = (p) => `<div class="bpage" style="--bc:${esc(b.color)};--cols:${b.cols}">${Array.from({ length: b.size }, (_, k) => slotHtml(b, p * b.size + k)).join('')}<span class="bpage-num num">${p + 1}</span></div>`;
  view.innerHTML = `<div class="stack">
    <div class="toolbar num"><span>${T().bd.owned(own, cards.length)}</span><span class="grow"></span><span>${T().bd.value(eur(cards.filter((c) => qty(c.id) > 0).reduce((a, c) => a + (price(c.id) ?? 0), 0)), eur(cards.reduce((a, c) => a + (price(c.id) ?? 0), 0)))}</span></div>
    <div class="binder-view" id="binderView">${Array.from({ length: spread }, (_, k) => first + k).filter((p) => p < pages).map(page).join('')}</div>
    <div class="binder-nav">
      <button class="bn-btn" data-bd="prev" ${first <= 0 ? 'disabled' : ''} aria-label="${L.prev}">${I.back}</button>
      <span class="bn-page num">${first + 1} / ${pages}</span>
      <button class="bn-btn primary flip-x" data-bd="next" ${first + spread >= pages ? 'disabled' : ''} aria-label="${L.next}">${I.back}</button>
      ${b.auto ? '' : `<button class="bn-btn primary ${bd.edit ? 'on' : ''}" data-bd="edit" aria-label="${T().bd.settings}" title="${T().bd.settings}">${I.gear}</button>`}
    </div>
    ${b.auto ? `<p class="note">${T().bd.readOnly}</p>` : bd.edit ? `<section class="panel">
      <h3>${T().bd.fill}</h3>
      <div class="chips">${visibleSets().map((s) => `<button class="chip" data-bfill="set:${esc(s.code)}">${esc(s.code)}</button>`).join('')}<button class="chip" data-bfill="owned">${T().bd.fillOwned}</button></div>
      <select class="search" id="bdFillList"><option value="">${T().bd.fillList}…</option>${allLists().filter((d) => d.group !== 'artist').map((d) => `<option value="${esc(d.id)}">${esc(listTitle(d))}</option>`).join('')}</select>
      <div class="bf-row"><span>${T().bd.layout}</span>${BD_LAYOUTS.map(([k, l]) => `<button class="chip" data-bdlayout="${k}" aria-pressed="${`${b.cols}x${b.rows}` === k}">${l}</button>`).join('')}</div>
      <div class="chips"><button class="chip" data-bd="addpage">${T().bd.addPage}</button><button class="chip" data-bd="rename">${T().bd.rename}</button>
      <button class="chip ${bd.confirmDel ? 'danger' : ''}" data-bd="delete">${bd.confirmDel ? T().bd.delConfirm : T().bd.del}</button></div>
    </section>` : ''}
  </div>`;
}
// choix d'une carte pour une case vide : recherche dans l'édition (cartes possédées d'abord)
// choix d'une carte (classeurs, cartes gradées…) : onPick(id) est appelé avec la carte choisie
let pickCb = null;
let pickOpts = {};
function openPicker(slot, onPick = null, opts = {}) {
  bd.pickSlot = slot; bd.pickQ = ''; pickCb = onPick; pickOpts = opts;
  let el = document.getElementById('picker');
  if (!el) { el = document.createElement('div'); el.id = 'picker'; el.className = 'picker'; document.body.append(el); }
  el.hidden = false;
  el.innerHTML = `<div class="picker-panel" role="dialog" aria-modal="true" aria-label="${T().bd.pick}">
    <div class="picker-head"><input class="search" id="pickerQ" placeholder="${esc(T().bd.pickPh)}" autocomplete="off"><button class="icon-btn" data-pick="close" aria-label="${L.close}">${I.x}</button></div>
    <div class="cards compact" id="pickerRes"></div></div>`;
  pickerResults();
  el.querySelector('#pickerQ').focus();
}
function pickerResults() {
  const q = fold(bd.pickQ.trim());
  // options : filter (cartes permises), unique (une seule version par nom, ex. créateur de decks)
  const seen = new Set();
  const res = editionCards().filter((c) => (!pickOpts.filter || pickOpts.filter(c)) && (!q || fold([c.name, c.nameEn, c.nameZh, `${c.set} ${c.number}`, `${c.set}-${c.number}`].join(' ')).includes(q)))
    .filter((c) => !pickOpts.unique || (!seen.has(c.name) && seen.add(c.name)))
    .sort((a, b) => (qty(b.id) > 0) - (qty(a.id) > 0) || setOrder(a) - setOrder(b) || String(a.number).localeCompare(String(b.number), 'en', { numeric: true })).slice(0, 60);
  document.getElementById('pickerRes').innerHTML = res.map((c) => `<button class="card ${qty(c.id) ? 'owned' : 'missing'} pick-card" data-pick="${esc(c.id)}"><span class="card-img">${cardImg(c)}<span class="num-badge num">${esc(c.set)} ${esc(numLabel(c))}</span></span></button>`).join('');
}
function closePicker() { const el = document.getElementById('picker'); if (el) el.hidden = true; bd.pickSlot = null; pickCb = null; }
function binderEdit(fn) {
  const id = location.hash.slice(8);
  const b = user.x.binders.find((x) => x.id === id);
  if (!b) return;
  bdDims(b);
  fn(b);
  xSave(); currentRender();
}
function binderFill(b, ids) {
  // remplit les cases vides à partir de la première, puis ajoute des pages
  let i = 0;
  for (const id of ids) {
    if (b.slots.includes(id)) continue;
    while (b.slots[i] != null) i++;
    b.slots[i] = id; i++;
  }
  const pages = Math.ceil(b.slots.length / b.size);
  for (let k = 0; k < pages * b.size; k++) if (b.slots[k] === undefined) b.slots[k] = null;
}
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'binderForm') return;
  e.preventDefault();
  const name = document.getElementById('binderName').value.trim() || T().bd.new;
  const color = e.target.querySelector('input[name="bdColor"]:checked')?.value ?? BD_COLORS[0];
  if (!canAddBinder()) { currentRender(); return; }
  const [cols, rows] = String(user.prefs.bdLayout ?? '3x3').split('x').map(Number);
  const size = cols * rows;
  const b = { id: `b${Date.now().toString(36)}`, name: name.slice(0, 40), size, cols, rows, color, lang, slots: Array(size).fill(null) };
  user.x.binders.push(b); xSave(); toast(T().bd.created);
  Object.assign(bd, { id: b.id, edit: true, page: 0, confirmDel: false }); location.hash = `#binder-${b.id}`;
});
document.addEventListener('click', (e) => {
  const lay = e.target.closest('[data-bdlayout]');
  if (lay) {   // changement de format : les cartes gardent leur ordre, les pages sont recalculées
    const [cols, rows] = lay.dataset.bdlayout.split('x').map(Number);
    binderEdit((b) => { const cards = b.slots; Object.assign(b, { cols, rows, size: cols * rows }); const n = Math.max(1, Math.ceil(cards.length / b.size)) * b.size; b.slots = Array.from({ length: n }, (_, k) => cards[k] ?? null); bd.page = 0; });
    return;
  }
  const t = e.target.closest('[data-bd],[data-bslot],[data-bremove],[data-bfill],[data-pick]');
  if (!t) return;
  const d = t.dataset;
  if (d.pick === 'close' || (e.target.id === 'picker')) { closePicker(); return; }
  if (d.pick) { const slot = bd.pickSlot, cb = pickCb; closePicker(); if (cb) cb(d.pick); else binderEdit((b) => { b.slots[slot] = d.pick; }); return; }
  if (d.bslot !== undefined) { openPicker(Number(d.bslot)); return; }
  if (d.bremove !== undefined) { binderEdit((b) => { b.slots[Number(d.bremove)] = null; }); return; }
  if (d.bfill) {
    const ids = d.bfill === 'owned' ? editionCards().filter((c) => qty(c.id) > 0).sort((a, b) => setOrder(a) - setOrder(b) || String(a.number).localeCompare(String(b.number), 'en', { numeric: true })).map((c) => c.id)
      : setCards(d.bfill.slice(4)).map((c) => c.id);
    binderEdit((b) => binderFill(b, ids)); return;
  }
  const act = d.bd;
  if (act === 'prices') { user.prefs.bdPrices = user.prefs.bdPrices === 'off' ? 'on' : 'off'; save(); currentRender(); return; }
  if (act === 'edit') { bd.edit = !bd.edit; bd.confirmDel = false; currentRender(); }
  else if (act === 'prev' || act === 'next') { const spread = isPC() ? 2 : 1; bd.page = Math.max(0, bd.page + (act === 'next' ? spread : -spread)); currentRender(); }
  else if (act === 'addpage') binderEdit((b) => { for (let k = 0; k < b.size; k++) b.slots.push(null); bd.page = binderPages(b) - 1; });
  else if (act === 'rename') { const id = location.hash.slice(8); const b = user.x.binders.find((x) => x.id === id); const n = b && prompt(T().bd.name, b.name); if (n && n.trim()) binderEdit((x) => { x.name = n.trim().slice(0, 40); }); }
  else if (act === 'delete') {
    if (!bd.confirmDel) { bd.confirmDel = true; currentRender(); return; }
    const id = location.hash.slice(8);
    user.x.binders = user.x.binders.filter((b) => b.id !== id); bd.confirmDel = false; xSave(); toast(T().bd.deleted); location.hash = '#collection';
  }
});
document.addEventListener('click', (e) => { if (e.target.id === 'picker') closePicker(); });
document.addEventListener('input', (e) => { if (e.target.id === 'pickerQ') { bd.pickQ = e.target.value; pickerResults(); } });
document.addEventListener('change', (e) => {
  if (e.target.id !== 'bdFillList' || !e.target.value) return;
  const d = allLists().find((x) => x.id === e.target.value);
  if (d) binderEdit((b) => binderFill(b, listCards(d).map((c) => c.id)));
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.getElementById('picker') && !document.getElementById('picker').hidden) closePicker(); });
// glisser pour tourner les pages d'un classeur
let bdSwipe = null;
document.addEventListener('touchstart', (e) => { if (e.target.closest('#binderView') && e.touches.length === 1) bdSwipe = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
document.addEventListener('touchend', (e) => {
  if (!bdSwipe) return;
  const t = e.changedTouches[0], dx = t.clientX - bdSwipe.x, dy = t.clientY - bdSwipe.y;
  bdSwipe = null;
  if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;
  document.querySelector(`[data-bd="${dx < 0 ? 'next' : 'prev'}"]:not([disabled])`)?.click();
}, { passive: true });

// ---------- Souhaits : sous-listes avec budget, alertes de prix, liste d'achat Cardmarket (comme NightDex) ----------
Object.assign(TX.fr, { wl: {
  all: 'Tous', new: 'Nouvelle liste', namePh: 'Nom de la liste (ex. Deck Jinx, Cadeaux)', budget: 'Budget (€, facultatif)', create: 'Créer',
  inLists: 'Dans mes listes de souhaits', budgetLeft: (a, b) => `${a} sur ${b} de budget`, over: (v) => `Dépassement : ${v}`, del: 'Supprimer cette liste', delConfirm: 'Toucher encore pour supprimer',
  buy: 'Liste d\'achat Cardmarket', buyTitle: 'Liste d\'achat', buyHint: 'Les cartes de la liste qui te manquent, de la moins chère à la plus chère. Le bouton copie la liste au format « 1 Nom (Série) » pour l\'importer dans une liste de souhaits Cardmarket (Wants).',
  copy: 'Copier la liste', copied: 'Liste copiée', total: 'Total au prix tendance',
  alert: 'Alerte de prix', alertPh: 'Prix en €', alertHint: 'Te prévenir quand la carte passe sous ce prix.', alertOn: (v) => `Alerte sous ${v}`, alertSet: 'Alerte enregistrée', alertDel: 'Supprimer l\'alerte',
  alerts: 'Alertes de prix', fired: 'Sous ton prix d\'alerte !', waiting: 'En attente', notif: 'Activer les notifications', notifOn: 'Notifications activées', notifNo: 'Notifications refusées par le navigateur',
  notifTitle: 'RiftDex : alerte de prix', notifBody: (n, p, t) => `${n} est à ${p} (alerte : ${t})`,
} });
Object.assign(TX.en, { wl: {
  all: 'All', new: 'New list', namePh: 'List name (e.g. Jinx deck, Gifts)', budget: 'Budget (€, optional)', create: 'Create',
  inLists: 'In my wishlists', budgetLeft: (a, b) => `${a} out of ${b} budget`, over: (v) => `Over budget: ${v}`, del: 'Delete this list', delConfirm: 'Tap again to delete',
  buy: 'Cardmarket shopping list', buyTitle: 'Shopping list', buyHint: 'The cards of the list you are missing, cheapest first. The button copies the list as “1 Name (Set)” to import it into a Cardmarket wants list.',
  copy: 'Copy the list', copied: 'List copied', total: 'Total at trend price',
  alert: 'Price alert', alertPh: 'Price in €', alertHint: 'Tell me when the card drops below this price.', alertOn: (v) => `Alert below ${v}`, alertSet: 'Alert saved', alertDel: 'Delete the alert',
  alerts: 'Price alerts', fired: 'Below your alert price!', waiting: 'Waiting', notif: 'Turn on notifications', notifOn: 'Notifications on', notifNo: 'Notifications blocked by the browser',
  notifTitle: 'RiftDex: price alert', notifBody: (n, p, t) => `${n} is at ${p} (alert: ${t})`,
} });
Object.assign(TX.zh, { wl: {
  all: '全部', new: '新建列表', namePh: '列表名称（如 金克丝卡组、礼物）', budget: '预算（€，可选）', create: '创建',
  inLists: '在我的心愿列表中', budgetLeft: (a, b) => `${a} / 预算 ${b}`, over: (v) => `超出预算：${v}`, del: '删除此列表', delConfirm: '再点一次删除',
  buy: 'Cardmarket 购物清单', buyTitle: '购物清单', buyHint: '列表中你缺少的卡牌，从便宜到贵排列。按钮会以“1 名称 (系列)”格式复制清单，可导入 Cardmarket 心愿单。',
  copy: '复制清单', copied: '已复制清单', total: '按趋势价合计',
  alert: '价格提醒', alertPh: '价格（€）', alertHint: '当卡牌价格低于此价时提醒我。', alertOn: (v) => `低于 ${v} 时提醒`, alertSet: '已保存提醒', alertDel: '删除提醒',
  alerts: '价格提醒', fired: '已低于提醒价！', waiting: '等待中', notif: '开启通知', notifOn: '已开启通知', notifNo: '浏览器已阻止通知',
  notifTitle: 'RiftDex：价格提醒', notifBody: (n, p, t) => `${n} 现价 ${p}（提醒价：${t}）`,
} });
const wl = { filter: '', confirmDel: false, buy: false };
const myWl = () => user.x.wl.filter((l) => l.lang === lang);
// alertes de l'édition affichée : alerts[`${lang}:${id}`] = { target, notified }
const alertKey = (id) => `${lang}:${id}`;
const alertOf = (id) => user.x.alerts[alertKey(id)] ?? null;
const alertFired = (id) => { const a = alertOf(id), p = price(id); return !!a && p != null && p <= a.target; };
const firedAlerts = () => Object.keys(user.x.alerts).filter((k) => k.startsWith(`${lang}:`)).map((k) => k.slice(lang.length + 1)).filter((id) => cardsById.has(id) && alertFired(id));
function alertsBadge() {
  const n = firedAlerts().length;
  const a = document.querySelector('.tabbar a[data-tab="wishlist"]');
  if (!a) return;
  let b = a.querySelector('.alert-dot');
  if (!n) { b?.remove(); return; }
  if (!b) { b = document.createElement('span'); b.className = 'alert-dot'; a.append(b); }
  b.textContent = n;
}
// notification du navigateur pour chaque alerte déclenchée, une fois par relevé de prix
function alertsNotify() {
  const day = priceFile.updatedAt ?? '';
  let changed = false;
  for (const l of LANGS) {
    for (const [k, a] of Object.entries(user.x.alerts)) {
      if (!k.startsWith(`${l}:`) || a.notified === day) continue;
      const id = k.slice(l.length + 1), c = cardsById.get(id), p = price(id);
      if (!c || p == null || p > a.target) continue;
      a.notified = day; changed = true;
      if ('Notification' in window && Notification.permission === 'granted') {
        try { new Notification(T().wl.notifTitle, { body: T().wl.notifBody(c.nameEn ?? c.name, eur(p), eur(a.target)), icon: 'icons/icon-192.png', tag: k }); } catch { /* */ }
      }
    }
  }
  if (changed) xSave();
  alertsBadge();
}
function wlFilterItems(list) {
  if (!wl.filter) return list;
  const l = myWl().find((x) => x.id === wl.filter);
  return l ? list.filter((c) => l.ids.includes(c.id)) : list;
}
function renderWishlistX() {
  setTopbar(`<h1>${L.wishlist}</h1>`);
  const fired = firedAlerts().map((id) => cardsById.get(id));
  const alertIds = Object.keys(user.x.alerts).filter((k) => k.startsWith(`${lang}:`)).map((k) => k.slice(lang.length + 1)).filter((id) => cardsById.has(id));
  const all = sortCards([...wish].map((id) => cardsById.get(id)).filter((c) => c && inEdition(c)), 'price-desc');
  if (wl.filter && !myWl().some((l) => l.id === wl.filter)) wl.filter = '';
  const list = wlFilterItems(all);
  const cur = myWl().find((x) => x.id === wl.filter);
  const missing = list.filter((c) => !qty(c.id));
  const cost = missing.reduce((a, c) => a + (price(c.id) ?? 0), 0);
  const budgetHtml = cur?.budget ? `<div class="wl-budget ${cost > cur.budget ? 'over' : ''}"><div class="bar"><i style="width:${Math.min(100, (cost / cur.budget) * 100).toFixed(1)}%"></i></div>
    <span class="num">${cost > cur.budget ? T().wl.over(eur(cost - cur.budget)) : T().wl.budgetLeft(eur(cost), eur(cur.budget))}</span></div>` : '';
  const notifBtn = 'Notification' in window && Notification.permission === 'default' && alertIds.length ? `<button class="chip" data-wl="notif">${T().wl.notif}</button>` : '';
  view.innerHTML = `<div class="stack">
    ${fired.length ? `<section class="panel alerts-fired"><h3>${ic('bell')}${T().wl.fired}</h3><div class="rows">${fired.map((c) => cardRow(c, 7)).join('')}</div></section>` : ''}
    <div class="chips wl-chips"><button class="chip" data-wlf="" aria-pressed="${!wl.filter}">${T().wl.all} · ${all.length}</button>
      ${myWl().map((l) => `<button class="chip" data-wlf="${esc(l.id)}" aria-pressed="${wl.filter === l.id}">${esc(l.name)} · ${l.ids.filter((id) => wish.has(id)).length}</button>`).join('')}
      <button class="chip" data-wl="new">+ ${T().wl.new}</button></div>
    <form id="wlForm" class="wl-form" hidden><input class="search" id="wlName" maxlength="30" placeholder="${esc(T().wl.namePh)}" autocomplete="off"><input class="search" id="wlBudget" type="number" inputmode="decimal" min="0" step="1" placeholder="${esc(T().wl.budget)}"><button class="cta">${T().wl.create}</button></form>
    ${list.length ? `<div class="hero-value"><small>${L.wishBudget}</small><strong class="num">${eur(cost)}</strong><span class="note">${L.wishNote(missing.length, list.length)}</span>${budgetHtml}</div>
      <div class="chips">${missing.length ? `<button class="chip" data-wl="buy">${ic('cart')}${T().wl.buy}</button>` : ''}${notifBtn}${cur ? `<button class="chip ${wl.confirmDel ? 'danger' : ''}" data-wl="del">${wl.confirmDel ? T().wl.delConfirm : T().wl.del}</button>` : ''}</div>
      ${wl.buy ? buyListHtml(missing) : ''}
      <div class="rows">${list.map((c) => cardRow(c)).join('')}</div>`
    : `<div class="empty"><strong>${L.emptyWish}</strong>${L.emptyWishHint}</div>`}
    ${alertIds.length ? `<h2 class="section-title">${T().wl.alerts}</h2><div class="rows">${alertIds.map((id) => { const c = cardsById.get(id); const a = alertOf(id); return `<div class="alert-item">${cardRow(c, 7)}<span class="alert-tag ${alertFired(id) ? 'fired' : ''}">${alertFired(id) ? ic('bell') : ''}${T().wl.alertOn(eur(a.target))}</span></div>`; }).join('')}</div>` : ''}
  </div>`;
}
function buyListHtml(missing) {
  const l = [...missing].sort((a, b) => (price(a.id) ?? 1e9) - (price(b.id) ?? 1e9));
  const total = l.reduce((a, c) => a + (price(c.id) ?? 0), 0);
  return `<section class="panel buy-list"><h3>${T().wl.buyTitle} <small class="num">${l.length} · ${T().wl.total} ${eur(total)}</small></h3>
    <p class="note" style="margin:0">${T().wl.buyHint}</p>
    <ol>${l.map((c) => { const cm = cmLinks(c); return `<li><span class="num">${eur(price(c.id))}</span><a href="${esc(cm?.url ?? '#')}" target="_blank" rel="noopener">${esc(c.nameEn ?? c.name)} <small>${esc(c.set)} ${esc(numLabel(c))}</small></a></li>`; }).join('')}</ol>
    <button class="cta" data-wl="copy">${T().wl.copy}</button></section>`;
}
// fiche carte : sous-listes de souhaits et alerte de prix
function wlDetailHtml(c) {
  if (isSealed(c)) return '';
  const a = alertOf(c.id);
  const lists = myWl();
  return `<section class="panel wl-detail">
    ${wish.has(c.id) && lists.length ? `<div><small class="muted-label">${T().wl.inLists}</small><div class="chips">${lists.map((l) => `<button class="chip" data-wladd="${esc(l.id)}" aria-pressed="${l.ids.includes(c.id)}">${esc(l.name)}</button>`).join('')}</div></div>` : ''}
    <div class="alert-line"><label for="alertInput">${ic('bell')}${T().wl.alert}</label>
      <input id="alertInput" type="number" inputmode="decimal" min="0" step="0.01" placeholder="${esc(T().wl.alertPh)}" value="${a ? a.target : ''}" data-alert-id="${esc(c.id)}">
      ${a ? `<button class="chip" data-wl="alertdel" data-id="${esc(c.id)}">${T().wl.alertDel}</button>` : `<small class="muted">${T().wl.alertHint}</small>`}</div>
  </section>`;
}
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-wl],[data-wlf],[data-wladd]');
  if (!t) return;
  const d = t.dataset;
  if (d.wlf !== undefined) { wl.filter = d.wlf; wl.confirmDel = false; wl.buy = false; currentRender(); return; }
  if (d.wladd) {
    const l = user.x.wl.find((x) => x.id === d.wladd);
    if (!l || !openId) return;
    l.ids = l.ids.includes(openId) ? l.ids.filter((x) => x !== openId) : [...l.ids, openId];
    xSave(); t.setAttribute('aria-pressed', l.ids.includes(openId)); return;
  }
  if (d.wl === 'new') { const f = document.getElementById('wlForm'); f.hidden = !f.hidden; if (!f.hidden) f.querySelector('#wlName').focus(); }
  else if (d.wl === 'buy') { wl.buy = !wl.buy; currentRender(); }
  else if (d.wl === 'del') {
    if (!wl.confirmDel) { wl.confirmDel = true; currentRender(); return; }
    user.x.wl = user.x.wl.filter((l) => l.id !== wl.filter); wl.filter = ''; wl.confirmDel = false; xSave(); currentRender();
  } else if (d.wl === 'copy') {
    const all = wlFilterItems(sortCards([...wish].map((id) => cardsById.get(id)).filter((c) => c && inEdition(c)), 'price-asc')).filter((c) => !qty(c.id));
    const text = all.map((c) => `1 ${c.nameEn ?? c.name} (${setOf(c.set)?.nameEn ?? c.set})`).join('\n');
    try { await navigator.clipboard.writeText(text); toast(T().wl.copied); } catch { prompt(T().wl.copy, text); }
  } else if (d.wl === 'notif') {
    const r = await Notification.requestPermission().catch(() => 'denied');
    toast(r === 'granted' ? T().wl.notifOn : T().wl.notifNo); if (r === 'granted') alertsNotify(); currentRender();
  } else if (d.wl === 'alertdel') {
    delete user.x.alerts[alertKey(d.id)]; xSave(); alertsBadge(); openCard(d.id, true);
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'wlForm') return;
  e.preventDefault();
  const name = document.getElementById('wlName').value.trim();
  if (!name) return;
  const budget = Number(document.getElementById('wlBudget').value) || null;
  const l = { id: `w${Date.now().toString(36)}`, name: name.slice(0, 30), budget, lang, ids: [] };
  user.x.wl.push(l); wl.filter = l.id; xSave(); currentRender();
});
document.addEventListener('change', (e) => {
  if (e.target.id !== 'alertInput') return;
  const id = e.target.dataset.alertId;
  const v = e.target.value.trim() === '' ? null : Math.round(Number(e.target.value) * 100) / 100;
  if (v == null || !(v > 0)) delete user.x.alerts[alertKey(id)];
  else { user.x.alerts[alertKey(id)] = { target: v, notified: null }; toast(T().wl.alertSet); }
  xSave(); alertsNotify(); openCard(id, true);
});

// ---------- État et foil de chaque exemplaire (comme NightDex) ----------
Object.assign(TX.fr, { cp: {
  title: 'Mes exemplaires', cond: 'État', foil: 'Foil', copy: (n) => `Ex. ${n}`, value: (v) => `Valeur de tes exemplaires, état et foil compris : ${v}`,
  conds: { MT: 'Mint', NM: 'Near Mint', EX: 'Excellent', GD: 'Good', LP: 'Light Played', PL: 'Played', PO: 'Poor' },
  hint: 'Décote Cardmarket approximative selon l\'état ; le foil utilise le prix foil quand il existe.',
} });
Object.assign(TX.en, { cp: {
  title: 'My copies', cond: 'Condition', foil: 'Foil', copy: (n) => `Copy ${n}`, value: (v) => `Value of your copies, condition and foil included: ${v}`,
  conds: { MT: 'Mint', NM: 'Near Mint', EX: 'Excellent', GD: 'Good', LP: 'Light Played', PL: 'Played', PO: 'Poor' },
  hint: 'Approximate Cardmarket discount by condition; foil uses the foil price when there is one.',
} });
Object.assign(TX.zh, { cp: {
  title: '我的卡牌', cond: '品相', foil: '闪卡', copy: (n) => `第 ${n} 张`, value: (v) => `按品相和闪卡计算的价值：${v}`,
  conds: { MT: '全新', NM: '近全新', EX: '极好', GD: '良好', LP: '轻微使用', PL: '使用过', PO: '差' },
  hint: '按品相的 Cardmarket 大致折扣；闪卡使用闪卡价格（如有）。',
} });
const CONDS = ['MT', 'NM', 'EX', 'GD', 'LP', 'PL', 'PO'];
const COND_K = { MT: 1.1, NM: 1, EX: 0.85, GD: 0.72, LP: 0.62, PL: 0.48, PO: 0.3 };
const cpKey = (id) => `${lang}:${id}`;
// exemplaires d'une carte : autant que la quantité possédée ; état Near Mint et foil d'origine par défaut
function copiesOf(id) {
  const c = cardsById.get(id), q = qty(id);
  const saved = user.x.copies[cpKey(id)] ?? [];
  return Array.from({ length: q }, (_, i) => saved[i] ?? { c: 'NM', f: isShiny(c) });
}
function copyValue(id) {
  const p = P(id); if (!p?.trend) return null;
  return copiesOf(id).reduce((a, cp) => a + (cp.f && !p.foil && p.trendFoil ? p.trendFoil : p.trend) * (COND_K[cp.c] ?? 1), 0);
}
function copiesHtml(c) {
  if (isSealed(c)) return '';
  const list = copiesOf(c.id);
  if (!list.length) return '';
  const v = copyValue(c.id);
  return `<section class="panel copies"><h3>${T().cp.title}</h3>
    ${list.map((cp, i) => `<div class="copy-row"><span>${T().cp.copy(i + 1)}</span>
      <select data-cpc="${i}" aria-label="${T().cp.cond}">${CONDS.map((k) => `<option value="${k}" ${cp.c === k ? 'selected' : ''}>${k} · ${esc(T().cp.conds[k])}</option>`).join('')}</select>
      <label class="foil-toggle"><input type="checkbox" data-cpf="${i}" ${cp.f ? 'checked' : ''}><span>${T().cp.foil}</span></label></div>`).join('')}
    ${v != null ? `<p class="note num" style="margin:0">${T().cp.value(eur(v))}</p>` : ''}<p class="note" style="margin:0;font-size:12px">${T().cp.hint}</p>
  </section>`;
}
document.addEventListener('change', (e) => {
  const el = e.target.closest('[data-cpc],[data-cpf]');
  if (!el || !openId) return;
  const list = copiesOf(openId);
  const i = Number(el.dataset.cpc ?? el.dataset.cpf);
  if (el.dataset.cpc !== undefined) list[i].c = el.value; else list[i].f = el.checked;
  user.x.copies[cpKey(openId)] = list;
  xSave(); openCard(openId, true);
});

// ---------- Cartes gradées : slabs PSA, BGS, CGC… avec photo, note, ventes relevées (comme NightDex) ----------
Object.assign(TX.fr, { gr: {
  title: 'Mes cartes gradées', add: 'Ajouter une carte gradée', addThis: 'Ajouter une version gradée', youHave: (n) => `${n} gradée${n > 1 ? 's' : ''}`,
  card: 'Carte', chooseCard: 'Choisir la carte', company: 'Société', grade: 'Note', cert: 'N° de certification', paid: 'Prix payé (€)', value: 'Valeur estimée',
  photo: 'Photo du slab', photoAdd: 'Ajouter une photo', save: 'Enregistrer', del: 'Supprimer', delConfirm: 'Toucher encore pour supprimer',
  sales: 'Ventes relevées', saleAdd: 'Ajouter une vente', saleDate: 'Date', salePrice: 'Prix (€)', noSales: 'Ajoute les ventes réussies que tu vois (eBay, Cardmarket…) : la valeur estimée est la médiane des 3 dernières.',
  ebay: 'Voir les ventes réussies sur eBay', none: 'Aucune carte gradée pour l\'instant. Ajoute tes slabs PSA, BGS, CGC… pour suivre leur valeur.', total: (n, v) => `${n} slab${n > 1 ? 's' : ''} · ${v}`,
  photoLocal: 'Les photos restent sur cet appareil.', official: 'Fiche officielle (texte et règles)',
} });
Object.assign(TX.en, { gr: {
  title: 'My graded cards', add: 'Add a graded card', addThis: 'Add a graded copy', youHave: (n) => `${n} graded`,
  card: 'Card', chooseCard: 'Choose the card', company: 'Company', grade: 'Grade', cert: 'Certification no.', paid: 'Price paid (€)', value: 'Estimated value',
  photo: 'Slab photo', photoAdd: 'Add a photo', save: 'Save', del: 'Delete', delConfirm: 'Tap again to delete',
  sales: 'Recorded sales', saleAdd: 'Add a sale', saleDate: 'Date', salePrice: 'Price (€)', noSales: 'Add the sold listings you see (eBay, Cardmarket…): the estimated value is the median of the last 3.',
  ebay: 'See sold listings on eBay', none: 'No graded card yet. Add your PSA, BGS, CGC… slabs to track their value.', total: (n, v) => `${n} slab${n > 1 ? 's' : ''} · ${v}`,
  photoLocal: 'Photos stay on this device.', official: 'Official card page (text and rules)',
} });
Object.assign(TX.zh, { gr: {
  title: '我的评级卡', add: '添加评级卡', addThis: '添加评级版本', youHave: (n) => `${n} 张评级卡`,
  card: '卡牌', chooseCard: '选择卡牌', company: '评级公司', grade: '分数', cert: '证书编号', paid: '买入价（€）', value: '估值',
  photo: '评级卡照片', photoAdd: '添加照片', save: '保存', del: '删除', delConfirm: '再点一次删除',
  sales: '成交记录', saleAdd: '添加成交', saleDate: '日期', salePrice: '价格（€）', noSales: '添加你看到的成交价（eBay、Cardmarket…）：估值为最近 3 次的中位数。',
  ebay: '在 eBay 查看成交记录', none: '暂无评级卡。添加你的 PSA、BGS、CGC 评级卡以跟踪价值。', total: (n, v) => `${n} 张 · ${v}`,
  photoLocal: '照片仅保存在此设备上。', official: '官方卡牌页面（文本与规则）',
} });
const GRADERS = ['PSA', 'BGS', 'CGC', 'PCA', 'Collect Aura', 'SGC', 'TAG', 'ACE'];
const GRADES = ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6', '5', '4', '3', '2', '1'];
const gr = { form: null, confirmDel: false, photos: new Map() };
const myGraded = () => user.x.graded.filter((g) => g.lang === lang && cardsById.has(g.id));
function gValue(g) {
  const s = [...(g.sales ?? [])].sort((a, b) => (a[0] < b[0] ? -1 : 1)).slice(-3).map(([, p]) => p).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}
// photos : IndexedDB de l'appareil (trop lourdes pour le compte)
function gIdb(mode, fn) {
  return new Promise((res, rej) => {
    const r = indexedDB.open('riftdex', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('slabs');
    r.onerror = () => rej(r.error);
    r.onsuccess = () => { const tx = r.result.transaction('slabs', mode); const q = fn(tx.objectStore('slabs')); tx.oncomplete = () => res(q?.result); tx.onerror = () => rej(tx.error); };
  });
}
async function gPhoto(gid) {
  if (gr.photos.has(gid)) return gr.photos.get(gid);
  let url = null;
  try { url = (await gIdb('readonly', (s) => s.get(gid))) ?? null; } catch { /* */ }
  gr.photos.set(gid, url);
  return url;
}
function gHydrate() {
  for (const img of document.querySelectorAll('img[data-gphoto]')) gPhoto(img.dataset.gphoto).then((u) => { if (u) { img.src = u; img.closest('.slab')?.classList.add('has-photo'); } });
}
function resizePhoto(file, max = 900) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
      res(cv.toDataURL('image/webp', 0.82)); URL.revokeObjectURL(img.src);
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}
function slabHtml(g, big = false) {
  const c = cardsById.get(g.id);
  const v = gValue(g);
  return `<a class="slab ${big ? 'big' : ''}" href="#graded-${esc(g.gid)}">
    <span class="slab-label"><b>${esc(g.co)}</b><span>${esc(cardName(c))}</span><strong class="num">${esc(g.grade)}</strong></span>
    <span class="slab-card"><img src="${esc(imageOf(c) || placeholderArt(c))}" alt="${esc(cardName(c))}" data-gphoto="${esc(g.gid)}"></span>
    ${big ? '' : `<span class="slab-val num">${v != null ? eur(v) : g.paid ? eur(g.paid) : '—'}</span>`}
  </a>`;
}
function renderGraded() {
  const list = myGraded();
  const total = list.reduce((a, g) => a + (gValue(g) ?? g.paid ?? 0), 0);
  return `<div class="toolbar num"><span>${T().gr.total(list.length, eur(total))}</span><span class="grow"></span><button class="chip" data-gr="new">+ ${T().gr.add}</button></div>
    ${gr.form ? gFormHtml() : ''}
    ${list.length ? `<div class="slab-grid">${list.map((g) => slabHtml(g)).join('')}</div>` : gr.form ? '' : `<div class="empty"><strong>${T().gr.title}</strong>${T().gr.none}<button class="cta" style="width:auto;padding:14px 26px" data-gr="new">${ic('slab')}${T().gr.add}</button></div>`}`;
}
COL_TAB_RENDER.graded = renderGraded;
COL_TAB_MOUNT.graded = gHydrate;
function gFormHtml() {
  const f = gr.form, c = f.id ? cardsById.get(f.id) : null;
  return `<section class="panel gform"><h3>${T().gr.add}</h3>
    <button class="btn-ghost gpick" data-gr="pick">${c ? `<img src="${esc(imageOf(c) || placeholderArt(c))}" alt=""><span><b>${esc(cardName(c))}</b><small>${esc(c.set)} · ${esc(numLabel(c))}</small></span>` : `<span>${T().gr.chooseCard}</span>`}</button>
    <div class="gform-row"><label>${T().gr.company}<select id="gCo">${GRADERS.map((x) => `<option ${f.co === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label>${T().gr.grade}<select id="gGrade">${GRADES.map((x) => `<option ${f.grade === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div>
    <div class="gform-row"><label>${T().gr.cert}<input id="gCert" class="search" maxlength="20" value="${esc(f.cert ?? '')}" autocomplete="off"></label>
      <label>${T().gr.paid}<input id="gPaid" class="search" type="number" inputmode="decimal" min="0" step="0.01" value="${f.paid ?? ''}"></label></div>
    <label class="btn-ghost g-photo">${I.camera}<span id="gFormPhotoLabel">${f.photo ? ic('check') : ''}${T().gr.photoAdd}</span><input type="file" accept="image/*" id="gFormPhoto" hidden></label>
    <button class="cta" data-gr="save" ${c ? '' : 'disabled'}>${T().gr.save}</button>
  </section>`;
}
function gFormRead() {
  Object.assign(gr.form, { co: document.getElementById('gCo')?.value ?? gr.form.co, grade: document.getElementById('gGrade')?.value ?? gr.form.grade,
    cert: document.getElementById('gCert')?.value.trim() ?? '', paid: Number(document.getElementById('gPaid')?.value) || null });
}
function gEbayUrl(g) {
  const c = cardsById.get(g.id);
  return `https://www.ebay.fr/sch/i.html?LH_Sold=1&LH_Complete=1&_nkw=${encodeURIComponent(`Riftbound ${c.nameEn ?? c.name} ${g.co} ${g.grade}`)}`;
}
async function renderGradedOne(gid) {
  const g = user.x.graded.find((x) => x.gid === gid);
  if (!g || !cardsById.has(g.id)) { location.hash = '#collection'; return; }
  const c = cardsById.get(g.id), v = gValue(g);
  const sales = [...(g.sales ?? [])].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  setTopbar(`<a class="icon-btn" href="#collection" aria-label="${L.back}">${I.back}</a><h1 class="small">${esc(g.co)} ${esc(g.grade)} · ${esc(cardName(c))}</h1>`);
  view.innerHTML = `<div class="stack graded-one">
    <div class="g-top">${slabHtml(g, true)}
      <div class="g-info">
        <div class="big-price num"><small>${T().gr.value}</small>${v != null ? eur(v) : '—'}</div>
        ${g.paid ? `<span class="sub num">${T().gr.paid} : ${eur(g.paid)}${v != null ? ` · ${diffHtml({ diff: v - g.paid, pct: (v - g.paid) / g.paid })}` : ''}</span>` : ''}
        ${g.cert ? `<span class="sub num">${T().gr.cert} : ${esc(g.cert)}</span>` : ''}
        <span class="sub">${esc(c.set)} · ${esc(numLabel(c))} · ${esc(L.trend)} ${eur(price(c.id))}</span>
        <label class="btn-ghost g-photo">${I.camera}<span>${T().gr.photoAdd}</span><input type="file" accept="image/*" id="gPhotoInput" hidden></label>
        <small class="note">${T().gr.photoLocal}</small>
      </div>
    </div>
    <section class="panel"><h3>${T().gr.sales}</h3>
      ${sales.length > 1 ? '<div class="chart" id="gChart"></div>' : ''}
      ${sales.length ? `<div class="g-sales">${sales.map(([d, p], i) => `<div><span class="num">${fmt.date.format(parseDay(d))}</span><b class="num">${eur(p)}</b><button class="icon-btn" data-gsdel="${i}" aria-label="${T().gr.del}">${I.x}</button></div>`).join('')}</div>` : `<p class="note" style="margin:0">${T().gr.noSales}</p>`}
      <form id="gSaleForm" class="g-sale-form"><input class="search" type="date" id="gSaleDate" value="${new Date().toISOString().slice(0, 10)}" aria-label="${T().gr.saleDate}"><input class="search" type="number" inputmode="decimal" min="0" step="0.01" id="gSalePrice" placeholder="${T().gr.salePrice}"><button class="cta">${T().gr.saleAdd}</button></form>
      <a class="btn-ghost" style="text-align:center;text-decoration:none" href="${esc(gEbayUrl(g))}" target="_blank" rel="noopener">${T().gr.ebay}</a>
    </section>
    <button class="btn-ghost" data-open="${esc(c.id)}">${esc(cardName(c))}</button>
    <button class="btn-ghost ${gr.confirmDel ? 'danger' : ''}" data-gr="del" data-gid="${esc(g.gid)}">${gr.confirmDel ? T().gr.delConfirm : T().gr.del}</button>
  </div>`;
  gHydrate();
  const ch = document.getElementById('gChart');
  if (ch) drawChart(ch, [...sales].reverse(), true);
}
document.addEventListener('click', (e) => {
  const t = e.target.closest('[data-gr],[data-gsdel]');
  if (!t) return;
  const d = t.dataset;
  if (d.gsdel !== undefined) {
    const g = user.x.graded.find((x) => x.gid === location.hash.slice(8));
    const sorted = [...(g.sales ?? [])].sort((a, b) => (a[0] < b[0] ? 1 : -1));
    sorted.splice(Number(d.gsdel), 1); g.sales = sorted; xSave(); currentRender(); return;
  }
  if (d.gr === 'new') { gr.form = { id: openId && !isSealed(cardsById.get(openId) ?? {}) ? openId : null, co: 'PSA', grade: '10' }; user.prefs.colTab = 'graded'; if (!sheet.hidden) closeCard(); if (location.hash !== '#collection') location.hash = '#collection'; else currentRender(); }
  else if (d.gr === 'pick') { gFormRead(); openPicker(null, (id) => { gr.form.id = id; currentRender(); }); }
  else if (d.gr === 'save') {
    gFormRead();
    const f = gr.form;
    if (!f?.id) return;
    const gid = `g${Date.now().toString(36)}`;
    user.x.graded.push({ gid, id: f.id, lang, co: f.co, grade: f.grade, cert: f.cert, paid: f.paid, sales: [] });
    if (f.photo) { gr.photos.set(gid, f.photo); gIdb('readwrite', (st) => st.put(f.photo, gid)).catch(() => {}); }
    gr.form = null; xSave(); currentRender();
  } else if (d.gr === 'del') {
    if (!gr.confirmDel) { gr.confirmDel = true; currentRender(); return; }
    user.x.graded = user.x.graded.filter((g) => g.gid !== d.gid); gr.confirmDel = false;
    gIdb('readwrite', (s) => s.delete(d.gid)).catch(() => {});
    xSave(); location.hash = '#collection';
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id !== 'gSaleForm') return;
  e.preventDefault();
  const p = Number(document.getElementById('gSalePrice').value), d = document.getElementById('gSaleDate').value;
  if (!(p > 0) || !d) return;
  const g = user.x.graded.find((x) => x.gid === location.hash.slice(8));
  (g.sales ??= []).push([d, Math.round(p * 100) / 100]); xSave(); currentRender();
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'gFormPhoto' || !e.target.files?.[0] || !gr.form) return;
  try { gFormRead(); gr.form.photo = await resizePhoto(e.target.files[0]); currentRender(); } catch { toast(L.badFile ?? 'Photo'); }
});
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'gPhotoInput' || !e.target.files?.[0]) return;
  const gid = location.hash.slice(8);
  try {
    const url = await resizePhoto(e.target.files[0]);
    await gIdb('readwrite', (s) => s.put(url, gid));
    gr.photos.set(gid, url); currentRender();
  } catch { toast(L.badFile ?? 'Photo illisible'); }
});
function gradedDetailBtn(c) {
  if (isSealed(c)) return '';
  const n = myGraded().filter((g) => g.id === c.id).length;
  const off = officialUrl(c);
  return `<button class="btn-ghost g-add" data-gr="new">${I2.slab}<span>${T().gr.addThis}${n ? ` · ${T().gr.youHave(n)}` : ''}</span></button>
    ${off ? `<a class="btn-ghost g-add official-link" href="${esc(off)}" target="_blank" rel="noopener">${I2.rules}<span>${T().gr.official}</span></a>` : ''}`;
}

// ---------- Créateur de decks (règles Riftbound) et decks de tournoi ----------
// Deck : 1 Légende, 1 champion choisi (unité du champion de la Légende), 40 cartes au deck principal champion compris,
// 12 runes, 3 champs de bataille, réserve facultative ; 3 exemplaires maximum par nom ; couleurs de la Légende.
Object.assign(TX.fr, { dk: {
  rulesTitle: 'Règles de construction', rules: ['<b>1 Légende</b> : elle fixe les deux couleurs (domaines) du deck.', '<b>1 champion choisi</b> : une unité du champion de ta Légende (touche l\'étoile).', '<b>40 cartes</b> au deck principal, champion compris, toutes des couleurs de la Légende.', '<b>3 exemplaires maximum</b> d\'une même carte, toutes versions confondues.', '<b>12 runes</b> des couleurs de la Légende et <b>3 champs de bataille</b> différents.', 'En tournoi : une <b>réserve</b> et la liste des cartes interdites.'],
  tab: 'Decks', mine: 'Mes decks', new: 'Nouveau deck', newName: 'Nouveau deck', tourney: 'Decks de tournoi', tourneyHint: 'Listes gagnantes des derniers tournois, relevées chaque lundi sur Riftbound France (source riftdecks.com).',
  legend: 'Légende', champion: 'Champion choisi', main: 'Deck principal', rune: 'Runes', battlefield: 'Champs de bataille', side: 'Réserve',
  add: 'Ajouter une carte', chooseLegend: 'Choisir la Légende', setChamp: 'Champion choisi', copyDeck: 'Copier dans mes decks', copied: 'Deck copié dans tes decks',
  missing: (n, v) => (n ? `Il te manque ${n} carte${n > 1 ? 's' : ''} (≈ ${v})` : 'Tu as toutes les cartes !'), price: (v) => `Prix du deck ≈ ${v}`, owned: (a, b) => `${a}/${b}`,
  copyList: 'Copier la liste', listCopied: 'Liste copiée', toWish: 'Manquantes → souhaits', wished: (n) => `${n} carte${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''} aux souhaits`,
  rename: 'Renommer', del: 'Supprimer le deck', delConfirm: 'Toucher encore pour supprimer', none: 'Crée un deck ou copie un deck de tournoi pour voir ce qu\'il te manque.',
  ok: 'Deck valide', warn: {
    legend: 'Choisis une Légende.', champ: 'Choisis ton champion (une unité de ton champion, touche l\'étoile).', main: (n) => `Deck principal : ${n}/40 cartes (champion compris).`,
    rune: (n) => `Runes : ${n}/12.`, bf: (n) => `Champs de bataille : ${n}/3.`, copies: (x) => `Plus de 3 exemplaires : ${x}.`, domain: (x) => `Hors des couleurs de la Légende : ${x}.`, banned: (x) => `Interdites en Standard : ${x}.`,
  },
  event: (e, p, d) => [p, String(e ?? '').replace(/\s*\(\d{4}-\d{2}-\d{2}\)/, ''), d].filter(Boolean).join(' · '), source: 'Voir le deck sur Riftbound France',
} });
Object.assign(TX.en, { dk: {
  rulesTitle: 'Deck-building rules', rules: ['<b>1 Legend</b>: it sets the deck\'s two colours (domains).', '<b>1 chosen champion</b>: a unit of your Legend\'s champion (tap the star).', '<b>40 cards</b> in the main deck, champion included, all in the Legend\'s colours.', '<b>Max 3 copies</b> of the same card, all printings combined.', '<b>12 runes</b> in the Legend\'s colours and <b>3 different battlefields</b>.', 'In tournaments: a <b>sideboard</b> and the banned list.'],
  tab: 'Decks', mine: 'My decks', new: 'New deck', newName: 'New deck', tourney: 'Tournament decks', tourneyHint: 'Winning lists from recent tournaments, collected every Monday from Riftbound France (source riftdecks.com).',
  legend: 'Legend', champion: 'Chosen champion', main: 'Main deck', rune: 'Runes', battlefield: 'Battlefields', side: 'Sideboard',
  add: 'Add a card', chooseLegend: 'Choose the Legend', setChamp: 'Chosen champion', copyDeck: 'Copy to my decks', copied: 'Deck copied to your decks',
  missing: (n, v) => (n ? `You are missing ${n} card${n > 1 ? 's' : ''} (≈ ${v})` : 'You have every card!'), price: (v) => `Deck price ≈ ${v}`, owned: (a, b) => `${a}/${b}`,
  copyList: 'Copy the list', listCopied: 'List copied', toWish: 'Missing → wishlist', wished: (n) => `${n} card${n > 1 ? 's' : ''} added to the wishlist`,
  rename: 'Rename', del: 'Delete the deck', delConfirm: 'Tap again to delete', none: 'Create a deck or copy a tournament deck to see what you are missing.',
  ok: 'Valid deck', warn: {
    legend: 'Choose a Legend.', champ: 'Choose your champion (a unit of your champion, tap the star).', main: (n) => `Main deck: ${n}/40 cards (champion included).`,
    rune: (n) => `Runes: ${n}/12.`, bf: (n) => `Battlefields: ${n}/3.`, copies: (x) => `More than 3 copies: ${x}.`, domain: (x) => `Outside the Legend's colours: ${x}.`, banned: (x) => `Banned in Standard: ${x}.`,
  },
  event: (e, p, d) => [p, String(e ?? '').replace(/\s*\(\d{4}-\d{2}-\d{2}\)/, ''), d].filter(Boolean).join(' · '), source: 'See the deck on Riftbound France',
} });
Object.assign(TX.zh, { dk: {
  rulesTitle: '构筑规则', rules: ['<b>1 张传奇</b>：决定卡组的两种颜色（特性）。', '<b>1 个选定英雄</b>：你的传奇英雄的单位卡（点星标）。', '主卡组 <b>40 张</b>，含英雄，均为传奇的颜色。', '同名卡<b>最多 3 张</b>，所有版本合计。', '<b>12 张符文</b>（传奇的颜色）和 <b>3 张不同战场</b>。', '赛事中：<b>备牌</b>和禁卡表。'],
  tab: '卡组', mine: '我的卡组', new: '新建卡组', newName: '新卡组', tourney: '赛事卡组', tourneyHint: '近期赛事的获胜卡组，每周一从 Riftbound France 收集（来源 riftdecks.com）。',
  legend: '传奇', champion: '选定英雄', main: '主卡组', rune: '符文', battlefield: '战场', side: '备牌',
  add: '添加卡牌', chooseLegend: '选择传奇', setChamp: '选定英雄', copyDeck: '复制到我的卡组', copied: '已复制到你的卡组',
  missing: (n, v) => (n ? `还缺 ${n} 张（≈ ${v}）` : '你拥有所有卡牌！'), price: (v) => `卡组价格 ≈ ${v}`, owned: (a, b) => `${a}/${b}`,
  copyList: '复制清单', listCopied: '已复制清单', toWish: '缺少的 → 心愿单', wished: (n) => `已将 ${n} 张加入心愿单`,
  rename: '重命名', del: '删除卡组', delConfirm: '再点一次删除', none: '新建卡组或复制赛事卡组，查看你还缺哪些卡牌。',
  ok: '卡组合法', warn: {
    legend: '请选择传奇。', champ: '请选择英雄（你的英雄的单位卡，点星标）。', main: (n) => `主卡组：${n}/40 张（含英雄）。`,
    rune: (n) => `符文：${n}/12。`, bf: (n) => `战场：${n}/3。`, copies: (x) => `超过 3 张：${x}。`, domain: (x) => `不属于传奇的颜色：${x}。`, banned: (x) => `标准赛制禁用：${x}。`,
  },
  event: (e, p, d) => [p, String(e ?? '').replace(/\s*\(\d{4}-\d{2}-\d{2}\)/, ''), d].filter(Boolean).join(' · '), source: '在 Riftbound France 查看卡组',
} });
const dk = { confirmDel: false };
let deckFile = null;
async function decksLoad() {
  if (!deckFile) { try { deckFile = await fetch('data/decks.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : { items: [] })); } catch { deckFile = { items: [] }; } }
  return deckFile;
}
// une carte par nom : la version de base la plus ancienne de l'édition (image et prix) ; possédés = toutes versions confondues
let byName = null;
function nameIndex() {
  if (byName && byName.lang === lang) return byName;
  const m = new Map();
  for (const c of editionCards()) {
    if (isExtraCard(c) || c.only) continue;
    const k = fold(c.name).replace(/[’']/g, "'");
    const e = m.get(k) ?? { card: null, all: [] };
    e.all.push(c);
    const rk = (x) => (x.variant ? 10 : 0) + (RARITIES.indexOf(x.rarity) + 1);
    const better = !e.card || rk(c) < rk(e.card) || (rk(c) === rk(e.card) && setOrder(c) < setOrder(e.card));
    if (better && c.rarity !== 'promo') e.card = c;
    if (!e.card) e.card = c;
    m.set(k, e);
  }
  byName = { lang, m };
  return byName;
}
const nk = (n) => fold(n).replace(/[’']/g, "'");
const cardByName = (n) => nameIndex().m.get(nk(n))?.card ?? null;
const ownedByName = (n) => (nameIndex().m.get(nk(n))?.all ?? []).reduce((a, c) => a + qty(c.id), 0);
const priceByName = (n) => { const ps = (nameIndex().m.get(nk(n))?.all ?? []).map((c) => price(c.id)).filter((p) => p != null); return ps.length ? Math.min(...ps) : null; };
const champOf = (legendName) => String(legendName ?? '').split(',')[0].trim();
const SECTIONS = ['main', 'rune', 'battlefield', 'side'];
function deckCounts(d) {
  const sum = (o) => Object.values(o ?? {}).reduce((a, q) => a + q, 0);
  return { main: sum(d.main) + (d.champion ? 1 : 0), rune: sum(d.rune), battlefield: sum(d.battlefield), side: sum(d.side) };
}
// toutes les cartes du deck (nom → quantité), champion et Légende compris
function deckNeeds(d) {
  const need = new Map();
  const add = (n, q) => need.set(n, (need.get(n) ?? 0) + q);
  if (d.legend) add(d.legend, 1);
  if (d.champion) add(d.champion, 1);
  for (const s of SECTIONS) for (const [n, q] of Object.entries(d[s] ?? {})) add(n, q);
  return need;
}
function deckMissing(d) {
  let n = 0, v = 0, total = 0;
  const list = [];
  for (const [name, q] of deckNeeds(d)) {
    const p = priceByName(name) ?? 0;
    total += p * q;
    const miss = Math.max(0, q - ownedByName(name));
    if (miss) { n += miss; v += miss * p; list.push([name, miss]); }
  }
  return { n, v, total, list };
}
function deckWarnings(d) {
  const w = T().dk.warn, out = [];
  const leg = d.legend ? cardByName(d.legend) : null;
  if (!leg) out.push(w.legend);
  else if (!d.champion) out.push(w.champ);
  const c = deckCounts(d);
  if (c.main !== 40) out.push(w.main(c.main));
  if (c.rune !== 12) out.push(w.rune(c.rune));
  if (c.battlefield !== 3) out.push(w.bf(c.battlefield));
  const copies = new Map();
  for (const s of ['main']) for (const [n, q] of Object.entries(d[s] ?? {})) copies.set(n, (copies.get(n) ?? 0) + q);
  if (d.champion) copies.set(d.champion, (copies.get(d.champion) ?? 0) + 1);
  const over = [...copies].filter(([, q]) => q > 3).map(([n]) => n);
  if (over.length) out.push(w.copies(over.join(', ')));
  if (leg) {
    const doms = new Set(leg.domains ?? []);
    // couleurs vérifiées sur le champion, le deck principal et les runes (pas la réserve)
    const inDeck = [d.champion, ...Object.keys(d.main ?? {}), ...Object.keys(d.rune ?? {})].filter(Boolean);
    const bad = [...new Set(inDeck)].filter((n) => { const x = cardByName(n); return x && x.type !== 'battlefield' && (x.domains ?? []).some((dm) => dm !== 'colorless' && !doms.has(dm)); });
    if (bad.length) out.push(w.domain(bad.join(', ')));
  }
  const banned = [...deckNeeds(d).keys()].filter((n) => { const x = cardByName(n); const b = x && banInfo(x); return b && b.formats.includes('standard') && b.from <= new Date().toISOString().slice(0, 10); });
  if (banned.length) out.push(w.banned(banned.join(', ')));
  return out;
}
const myDecks = () => user.x.decks.filter((d) => d.lang === lang);
function deckTile(d, href, extra = '') {
  const leg = d.legend ? cardByName(d.legend) : null;
  const m = deckMissing(d);
  return `<a class="deck-tile" href="${href}" ${leg && imageOf(leg) ? `style="--art:url('${esc(imageOf(leg))}')"` : ''}>
    <span class="dt-text"><strong>${esc(d.name || d.legend || T().dk.newName)}</strong>${extra}
      <span class="num">${T().dk.price(eur(m.total))}</span>
      <em class="${m.n ? '' : 'ok'} num">${T().dk.missing(m.n, eur(m.v))}</em></span>
  </a>`;
}
async function renderDecks() {
  homeTopbar(false);
  await decksLoad();
  if (currentRender !== renderDecks) return;
  const t = deckFile?.items ?? [];
  view.innerHTML = `<div class="stack">
    ${homeTabs('decks')}
    <div class="toolbar"><h2 class="section-title" style="margin:0;flex:1">${T().dk.mine}</h2><button class="chip" data-dk="new">+ ${T().dk.new}</button></div>
    ${myDecks().length ? `<div class="deck-grid">${myDecks().map((d) => deckTile(d, `#deck-${esc(d.id)}`)).join('')}</div>` : `<p class="note">${T().dk.none}</p>`}
    ${t.length ? `<h2 class="section-title">${T().dk.tourney}</h2><p class="note">${T().dk.tourneyHint}</p>
    <div class="deck-grid">${t.map((x) => deckTile(tourneyDeck(x), `#tdeck-${esc(x.id)}`, `<span class="dt-event">${esc(T().dk.event(x.event, x.place, x.date ? fmt.date.format(parseDay(x.date)) : ''))}</span>`)).join('')}</div>` : ''}
  </div>`;
}
// deck de tournoi → même forme qu'un deck perso
function tourneyDeck(x) {
  const leg = Object.keys(x.cards.legend ?? {});
  const legend = leg.find((n) => cardByName(n)?.type === 'legend') ?? leg[0];
  const champion = leg.find((n) => n !== legend) ?? null;
  return { id: `t${x.id}`, name: legend, lang, legend, champion, main: { ...(x.cards.main ?? {}) }, rune: { ...(x.cards.rune ?? {}) }, battlefield: { ...(x.cards.battlefield ?? {}) }, side: { ...(x.cards.side ?? {}) }, tourney: x };
}
function deckRow(d, name, q, sec, ro) {
  const c = cardByName(name);
  const own = ownedByName(name);
  const isChampCand = sec === 'main' && c?.type === 'unit' && d.legend && champOf(c.name) === champOf(d.legend) && d.champion !== name;
  return `<div class="deck-row ${own >= q ? 'have' : 'need'}">
    ${c ? `<button class="dr-img" data-open="${esc(c.id)}">${cardImg(c)}</button>` : '<span class="dr-img"></span>'}
    <span class="dr-name"><b>${esc(c ? cardName(c) : name)}</b><small class="num">${own >= q ? ic('check') : ic('cross')}${T().dk.owned(Math.min(own, q), q)} · ${eur(priceByName(name))}</small></span>
    ${ro ? `<span class="dr-q num">×${q}</span>` : `<span class="dr-ctl">${isChampCand ? `<button class="icon-btn" data-dkchamp="${esc(name)}" title="${T().dk.setChamp}" aria-label="${T().dk.setChamp}">${I.star}</button>` : ''}<button data-dkq="-1" data-sec="${sec}" data-name="${esc(name)}">−</button><output class="num">${q}</output><button data-dkq="1" data-sec="${sec}" data-name="${esc(name)}">+</button></span>`}
  </div>`;
}
function deckSection(d, sec, ro) {
  const entries = Object.entries(d[sec] ?? {}).sort((a, b) => (cardByName(a[0])?.energy ?? 99) - (cardByName(b[0])?.energy ?? 99) || a[0].localeCompare(b[0]));
  if (!entries.length && (ro || sec === 'side')) return '';
  const c = deckCounts(d)[sec];
  const target = { main: 40, rune: 12, battlefield: 3 }[sec];
  return `<section class="panel deck-sec"><h3>${T().dk[sec]} <small class="num ${target && c !== target ? 'bad' : ''}">${c}${target ? `/${target}` : ''}</small></h3>
    ${entries.map(([n, q]) => deckRow(d, n, q, sec, ro)).join('')}</section>`;
}
async function renderDeck(id) {
  const tourney = id.startsWith('t');
  if (tourney) await decksLoad();
  const d = tourney ? (deckFile?.items ?? []).map(tourneyDeck).find((x) => x.id === id) : myDecks().find((x) => x.id === id);
  if (!d) { location.hash = '#decks'; return; }
  const ro = tourney;
  const leg = d.legend ? cardByName(d.legend) : null, champ = d.champion ? cardByName(d.champion) : null;
  const m = deckMissing(d), warns = deckWarnings(d);
  setTopbar(`<a class="icon-btn" href="#decks" aria-label="${L.back}">${I.back}</a><h1 class="small">${esc(d.name || d.legend || T().dk.newName)}</h1>`);
  view.innerHTML = `<div class="stack">
    <div class="deck-head" ${leg && imageOf(leg) ? `style="--art:url('${esc(imageOf(leg))}')"` : ''}>
      <div class="dh-cards">
        ${leg ? `<button class="dh-card" data-open="${esc(leg.id)}"><small>${T().dk.legend}</small>${cardImg(leg)}</button>` : `<button class="dh-card empty" data-dk="legend">+ ${T().dk.chooseLegend}</button>`}
        ${champ ? `<button class="dh-card" data-open="${esc(champ.id)}"><small>${T().dk.champion}</small>${cardImg(champ)}</button>` : leg ? `<span class="dh-card empty">${T().dk.champion}${I.star}</span>` : ''}
      </div>
      <div class="dh-info">
        ${tourney ? `<span class="dt-event">${esc(T().dk.event(d.tourney.event, d.tourney.place, d.tourney.date ? fmt.date.format(parseDay(d.tourney.date)) : ''))}</span>` : ''}
        <b class="num">${T().dk.price(eur(m.total))}</b>
        <span class="${m.n ? 'need' : 'ok'} num">${T().dk.missing(m.n, eur(m.v))}</span>
        ${leg ? `<span class="dh-doms">${(leg.domains ?? []).map((x) => `<i style="--c:${DOMAIN_HEX[x] ?? '#888'}">${esc(domainLabel(x))}</i>`).join('')}</span>` : ''}
      </div>
    </div>
    ${warns.length ? `<ul class="deck-warn">${warns.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="deck-ok">${ic('check')}${T().dk.ok}</p>`}
    <details class="panel deck-rules"><summary><h3>${T().dk.rulesTitle}</h3>${I.chevron}</summary><ul>${T().dk.rules.map((r) => `<li>${r}</li>`).join('')}</ul></details>
    <div class="chips">
      ${ro ? `<button class="chip" data-dk="copy">${T().dk.copyDeck}</button>` : `<button class="chip" data-dk="add">+ ${T().dk.add}</button>${!leg ? '' : `<button class="chip" data-dk="legend">${T().dk.legend}</button>`}`}
      <button class="chip" data-dk="list">${T().dk.copyList}</button>
      ${m.n ? `<button class="chip" data-dk="wish">${T().dk.toWish}</button>` : ''}
      ${ro ? '' : `<button class="chip" data-dk="rename">${T().dk.rename}</button><button class="chip ${dk.confirmDel ? 'danger' : ''}" data-dk="del">${dk.confirmDel ? T().dk.delConfirm : T().dk.del}</button>`}
    </div>
    ${SECTIONS.map((s) => deckSection(d, s, ro)).join('')}
    ${tourney ? `<a class="btn-ghost" style="text-align:center;text-decoration:none" href="${esc(d.tourney.url)}" target="_blank" rel="noopener">${T().dk.source}</a>` : ''}
  </div>`;
  dk.current = d;
}
function deckEdit(fn) {
  const d = user.x.decks.find((x) => x.id === location.hash.slice(6));
  if (!d) return;
  fn(d);
  for (const s of SECTIONS) for (const [n, q] of Object.entries(d[s] ?? {})) if (q <= 0) delete d[s][n];
  xSave(); currentRender();
}
const sectionFor = (c) => (c.type === 'rune' ? 'rune' : c.type === 'battlefield' ? 'battlefield' : 'main');
function deckLegal(d) {
  const leg = d.legend ? cardByName(d.legend) : null;
  if (!leg) return (c) => c.type === 'legend';
  const doms = new Set(leg.domains ?? []);
  return (c) => c.type !== 'legend' && c.type !== 'token' && (c.type === 'battlefield' || !(c.domains ?? []).some((x) => x !== 'colorless' && !doms.has(x)));
}
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-dk],[data-dkq],[data-dkchamp]');
  if (!t) return;
  const a = t.dataset;
  if (a.dkq) { deckEdit((d) => { d[a.sec] ??= {}; d[a.sec][a.name] = Math.max(0, (d[a.sec][a.name] ?? 0) + Number(a.dkq)); }); return; }
  if (a.dkchamp) { deckEdit((d) => { if (d.champion) d.main[d.champion] = (d.main[d.champion] ?? 0) + 1; d.champion = a.dkchamp; d.main[a.dkchamp] -= 1; }); return; }
  const act = a.dk;
  if (act === 'new') {
    const d = { id: `d${Date.now().toString(36)}`, name: '', lang, legend: null, champion: null, main: {}, rune: {}, battlefield: {}, side: {} };
    user.x.decks.push(d); xSave(); location.hash = `#deck-${d.id}`;
  } else if (act === 'legend' || (act === 'add' && !dk.current?.legend)) {
    openPicker(null, (id) => deckEdit((d) => { const c = cardsById.get(id); d.legend = c.name; if (!d.name) d.name = c.name; d.champion = null; }), { filter: (c) => c.type === 'legend', unique: true });
  } else if (act === 'add') {
    const d = dk.current; if (!d) return;
    openPicker(null, (id) => deckEdit((x) => { const c = cardsById.get(id); const s = sectionFor(c); x[s] ??= {}; x[s][c.name] = (x[s][c.name] ?? 0) + 1; }), { filter: deckLegal(d), unique: true });
  } else if (act === 'copy') {
    const src = dk.current; if (!src) return;
    const d = { ...JSON.parse(JSON.stringify(src)), id: `d${Date.now().toString(36)}`, name: `${src.legend} (${src.tourney.event || 'Top'})`.slice(0, 50), lang };
    delete d.tourney; user.x.decks.push(d); xSave(); toast(T().dk.copied); location.hash = `#deck-${d.id}`;
  } else if (act === 'list') {
    const d = dk.current; if (!d) return;
    const line = (n, q) => `${q} ${n}`;
    const text = [d.legend && `# ${T().dk.legend}\n${line(d.legend, 1)}${d.champion ? `\n${line(d.champion, 1)}` : ''}`,
      ...SECTIONS.map((s) => Object.keys(d[s] ?? {}).length ? `# ${T().dk[s]}\n${Object.entries(d[s]).map(([n, q]) => line(n, q)).join('\n')}` : '')].filter(Boolean).join('\n\n');
    try { await navigator.clipboard.writeText(text); toast(T().dk.listCopied); } catch { prompt(T().dk.copyList, text); }
  } else if (act === 'wish') {
    const d = dk.current; if (!d) return;
    const ids = deckMissing(d).list.map(([n]) => cardByName(n)?.id).filter(Boolean);
    ids.forEach((id) => wish.add(id));
    let l = user.x.wl.find((x) => x.lang === lang && x.name === (d.name || d.legend));
    if (!l) { l = { id: `w${Date.now().toString(36)}`, name: (d.name || d.legend || T().dk.tab).slice(0, 30), budget: null, lang, ids: [] }; user.x.wl.push(l); }
    l.ids = [...new Set([...l.ids, ...ids])];
    save(); xSave(); toast(T().dk.wished(ids.length));
  } else if (act === 'rename') {
    const d = user.x.decks.find((x) => x.id === location.hash.slice(6)); const n = d && prompt(T().dk.rename, d.name || d.legend || '');
    if (n && n.trim()) deckEdit((x) => { x.name = n.trim().slice(0, 50); });
  } else if (act === 'del') {
    if (!dk.confirmDel) { dk.confirmDel = true; currentRender(); return; }
    user.x.decks = user.x.decks.filter((x) => x.id !== location.hash.slice(6)); dk.confirmDel = false; xSave(); location.hash = '#decks';
  }
});

// ---------- Classement amis / monde (comme NightDex) ----------
// Amis : calculé à partir des collections que les amis partagent déjà (users/<uid>).
// Monde : sur inscription, document leaderboard/<uid> { pseudo, value, cards, unique, sets } (totaux seulement).
Object.assign(TX.fr, { lb: {
  title: 'Classement', btn: 'Classement', friends: 'Amis', world: 'Monde', value: 'Valeur', cards: 'Cartes', sets: 'Séries complètes',
  you: 'toi', join: 'Apparaître dans le classement mondial', joinHint: 'Seuls ton pseudo et tes totaux (valeur, cartes, séries complètes) sont publiés.', leave: 'Quitter le classement mondial',
  gate: 'Connecte-toi et choisis un pseudo (onglet Amis) pour voir le classement.', loading: 'Chargement du classement…', empty: 'Personne dans ce classement pour l\'instant.',
  rules: 'Classement mondial indisponible : publie les nouvelles règles Firestore (README).', all: 'toutes éditions',
} });
Object.assign(TX.en, { lb: {
  title: 'Leaderboard', btn: 'Leaderboard', friends: 'Friends', world: 'World', value: 'Value', cards: 'Cards', sets: 'Complete sets',
  you: 'you', join: 'Appear in the world leaderboard', joinHint: 'Only your username and totals (value, cards, complete sets) are published.', leave: 'Leave the world leaderboard',
  gate: 'Sign in and choose a username (Friends tab) to see the leaderboard.', loading: 'Loading the leaderboard…', empty: 'Nobody in this leaderboard yet.',
  rules: 'World leaderboard unavailable: publish the new Firestore rules (README).', all: 'all editions',
} });
Object.assign(TX.zh, { lb: {
  title: '排行榜', btn: '排行榜', friends: '好友', world: '全球', value: '价值', cards: '卡牌', sets: '集齐系列',
  you: '你', join: '加入全球排行榜', joinHint: '仅公开你的昵称和总数（价值、卡牌数、集齐系列数）。', leave: '退出全球排行榜',
  gate: '登录并设置昵称（好友页）即可查看排行榜。', loading: '正在加载排行榜…', empty: '此排行榜暂无数据。',
  rules: '全球排行榜不可用：请发布新的 Firestore 规则（见 README）。', all: '所有版本',
} });
const lb = { scope: 'friends', metric: 'value', rows: null, err: '', timer: 0 };
// cartes de chaque série par édition (séries principales, sans les variantes Cardmarket)
let setByEd = null;
function inEditionL(c, l) { return !!setOf(c.set)?.langs.includes(l) && (!c.only || c.only.includes(l)) && (l !== 'zh' || !!c.imageZh); }
function colStats(col) {
  if (!setByEd) {
    setByEd = {};
    for (const l of LANGS) for (const s of catalog.sets.filter((x) => x.block === 'main' && x.langs.includes(l))) setByEd[`${l}:${s.code}`] = catalog.cards.filter((c) => c.set === s.code && !isExtraCard(c) && inEditionL(c, l)).map((c) => c.id);
  }
  let value = 0, cards = 0, unique = 0, sets = 0;
  for (const l of LANGS) {
    const owned = col?.[l]?.owned ?? {};
    for (const [id, q] of Object.entries(owned)) { if (!(q > 0)) continue; cards += q; unique++; value += q * (price(id) ?? 0); }
    for (const [k, ids] of Object.entries(setByEd)) if (k.startsWith(`${l}:`) && ids.length && ids.every((id) => (owned[id] ?? 0) > 0)) sets++;
  }
  return { value: Math.round(value * 100) / 100, cards, unique, sets };
}
const lbRef = (uid) => dref('leaderboard', uid);
// envoi de mes totaux (si inscrit), au plus une fois toutes les 5 s
function lbPush() {
  if (!cloud.user || !user.prefs.lbWorld || !fr.me?.pseudo) return;
  clearTimeout(lb.timer);
  lb.timer = setTimeout(async () => {
    try { await fsx().setDoc(lbRef(cloud.user.uid), { pseudo: fr.me.pseudo, ...colStats(user.col), updatedAt: fsx().serverTimestamp() }); }
    catch (e) { if (e?.code === 'permission-denied') lb.err = T().lb.rules; }
  }, 5000);
}
async function lbLoad() {
  lb.rows = null; lb.err = '';
  const me = { uid: cloud.user.uid, pseudo: fr.me?.pseudo ?? T().lb.you, me: true, ...colStats(user.col) };
  try {
    if (lb.scope === 'friends') {
      const rows = await Promise.all(fr.list.map(async (f) => {
        try { const s = await fsx().getDoc(dref('users', f.uid)); return { uid: f.uid, pseudo: f.pseudo, ...colStats(s.exists() ? s.data().col : {}) }; } catch { return null; }
      }));
      lb.rows = [me, ...rows.filter(Boolean)];
    } else {
      const { query, collection, orderBy, limit, getDocs } = fsx();
      const snap = await getDocs(query(collection(cloud.api.db, 'leaderboard'), orderBy(lb.metric, 'desc'), limit(50)));
      lb.rows = snap.docs.map((d) => ({ uid: d.id, ...d.data(), me: d.id === cloud.user.uid }));
      if (!lb.rows.some((r) => r.me) && user.prefs.lbWorld) lb.rows.push(me);
    }
  } catch (e) { lb.rows = []; lb.err = e?.code === 'permission-denied' ? T().lb.rules : String(e?.message ?? e); }
  if (currentRender === renderRanking) renderRanking(true);
}
function renderRanking(loaded) {
  setTopbar(`<a class="icon-btn" href="#friends" aria-label="${L.back}">${I.back}</a><h1 class="small">${T().lb.title}</h1>`);
  if (!cloud.user || !fr.me?.pseudo) { view.innerHTML = `<div class="empty"><strong>${T().lb.title}</strong>${T().lb.gate}<a class="btn-ghost" href="#friends" style="text-decoration:none">${L.fr.title}</a></div>`; return; }
  if (!loaded) { view.innerHTML = `<div class="stack">${lbControls()}<div class="empty"><strong>${T().lb.loading}</strong></div></div>`; lbLoad(); return; }
  const fmtM = (r) => (lb.metric === 'value' ? eur(r.value) : lb.metric === 'cards' ? String(r.cards) : String(r.sets));
  const rows = [...(lb.rows ?? [])].sort((a, b) => (b[lb.metric] ?? 0) - (a[lb.metric] ?? 0));
  view.innerHTML = `<div class="stack">
    ${lbControls()}
    ${lb.err ? `<p class="form-err">${esc(lb.err)}</p>` : ''}
    ${rows.length ? `<ol class="lb-list">${rows.map((r, i) => `<li class="${r.me ? 'me' : ''} ${i < 3 ? `top top${i + 1}` : ''}">
      <span class="lb-rank num">${i + 1}</span>
      ${r.me ? `<span class="lb-name">@${esc(r.pseudo)} <small>(${T().lb.you})</small></span>` : r.uid && lb.scope === 'friends' ? `<a class="lb-name" href="#friend-${esc(r.uid)}">@${esc(r.pseudo)}</a>` : `<span class="lb-name">@${esc(r.pseudo)}</span>`}
      <span class="lb-sub num">${r.cards} ${T().lb.cards.toLowerCase()} · ${r.sets} ${T().lb.sets.toLowerCase()}</span>
      <b class="lb-val num">${fmtM(r)}</b></li>`).join('')}</ol>` : `<div class="empty"><strong>${T().lb.empty}</strong></div>`}
    ${lb.scope === 'world' ? `<section class="panel"><label class="lb-join"><input type="checkbox" id="lbJoin" ${user.prefs.lbWorld ? 'checked' : ''}><span>${T().lb.join}</span></label><p class="note" style="margin:0">${T().lb.joinHint}</p></section>` : ''}
    <p class="note">${T().lb.value} : ${T().lb.all}.</p>
  </div>`;
}
const lbControls = () => `${seg('lbScope', lb.scope, [['friends', T().lb.friends], ['world', T().lb.world]])}${seg('lbMetric', lb.metric, [['value', T().lb.value], ['cards', T().lb.cards], ['sets', T().lb.sets]])}`;
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-seg="lbScope"],[data-seg="lbMetric"]');
  if (!b) return;
  e.stopPropagation();
  if (b.dataset.seg === 'lbScope') { lb.scope = b.dataset.value; renderRanking(false); } else { lb.metric = b.dataset.value; if (lb.scope === 'world') renderRanking(false); else renderRanking(true); }
}, true);
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'lbJoin') return;
  user.prefs.lbWorld = e.target.checked; save();
  if (user.prefs.lbWorld) { lbPush(); setTimeout(() => renderRanking(false), 5600); }
  else { try { await fsx().deleteDoc(lbRef(cloud.user.uid)); } catch { /* */ } renderRanking(false); }
});

// @@NEXT-FEATURES@@

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
  else if (h === 'wishlist') { wl.buy = false; wl.confirmDel = false; currentRender = renderWishlistX; }
  else if (h === 'search') currentRender = renderSearch;
  else if (h === 'values') currentRender = renderValues;
  else if (h === 'sealed') { tab = 'sealed'; currentRender = renderSealed; }
  else if (h === 'extra') { tab = 'home'; currentRender = renderExtra; }
  else if (h === 'lists') { tab = 'home'; currentRender = renderLists; }
  else if (h === 'news') { tab = 'home'; currentRender = renderNews; }
  else if (h === 'ranking') { tab = 'friends'; currentRender = () => renderRanking(false); }
  else if (h === 'decks') { tab = 'home'; currentRender = renderDecks; }
  else if (h.startsWith('tdeck-')) { tab = 'home'; const id = `t${h.slice(6)}`; currentRender = () => renderDeck(id); }
  else if (h.startsWith('deck-')) { tab = 'home'; dk.confirmDel = false; const id = h.slice(5); currentRender = () => renderDeck(id); }
  else if (h.startsWith('graded-')) { tab = 'collection'; gr.confirmDel = false; const gid = h.slice(7); currentRender = () => renderGradedOne(gid); }
  else if (h.startsWith('binder-')) { tab = 'collection'; const id = h.slice(7); if (bd.id !== id) Object.assign(bd, { id, page: 0, edit: false, confirmDel: false }); currentRender = () => renderBinder(id); }
  else if (h.startsWith('list-')) { tab = 'home'; currentRender = () => renderList(h.slice(5)); }
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
  migrateIds();
  route();
  initCloud();
  badgeCheck();
  alertsNotify();
  newsLoad().then(() => {
    if (!user.x.newsSeen && newsItems()[0]) { user.x.newsSeen = newsItems()[0].date; save(); } // premier passage : pas de pastille
    if (currentRender === renderHome || currentRender === renderSealed || currentRender === renderLists) currentRender();
  });
} catch (err) {
  view.innerHTML = `<div class="empty"><strong>${L.loadError}</strong>${L.loadErrorHint}</div>`;
  console.error(err);
}
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
}
