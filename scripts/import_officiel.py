"""Importe les cartes Riftbound et leurs images (lancé chaque lundi par la GitHub Action).

Sources :
- galerie officielle (riftbound.leagueoflegends.com) en anglais et en chinois simplifié : noms, raretés, images ;
- Riftcodex (api.riftcodex.com) : signatures et promos absentes de la galerie ;
- liste des cartes Cardmarket (jeu n° 22) : rattachement de chaque carte à son produit, promos, nouvelles extensions.

Chaque carte déjà présente garde son identifiant et son produit Cardmarket : rien ne bouge pour la collection
des utilisateurs. Les nouvelles cartes, séries et images sont ajoutées ; une nouvelle extension Cardmarket est
rattachée automatiquement à sa série (comparaison des noms des cartes).

Usage : python scripts/import_officiel.py [--riftcodex] [--rematch]
  --riftcodex : retélécharger Riftcodex (lent) ; --rematch : refaire le rattachement de toutes les cartes à Cardmarket
"""
import base64
import io
import re
import sys
import unicodedata
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor

from common import (CACHE, CM, CM_GAME, DATA, ROOT, get, get_json, image_file, norm, num_key, read_json, write_json)

GALLERY = 'https://riftbound.leagueoflegends.com/{loc}/card-gallery/'
TIER = {'common': 0, 'uncommon': 1, 'rare': 2, 'epic': 3, 'showcase': 4, 'promo': 4}
IMG_W = 300


# ---------- sources ----------
def gallery(loc):
    h = get(GALLERY.format(loc=loc), timeout=90)
    j = __import__('json').loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S).group(1))
    return next(b for b in j['props']['pageProps']['page']['blades'] if 'cards' in b)


def riftcodex():
    path = CACHE / 'riftcodex.json'
    if path.exists() and '--riftcodex' not in sys.argv:
        return read_json(path)
    try:
        items, page = [], 1
        while True:
            o = get_json(f'https://api.riftcodex.com/cards?size=100&page={page}', timeout=40)
            items += o['items']
            if page >= o['pages']:
                break
            page += 1
        write_json(path, items)
        return items
    except Exception as e:
        print('  Riftcodex indisponible, copie précédente utilisée :', e)
        return read_json(path, [])


# ---------- noms ----------
def full_name(x, champions):
    """Nom façon Cardmarket : « Jinx, Demolitionist » (unité), « Kai'Sa, Daughter of the Void » (légende).
    Pour les sorts et équipements de champion, le sous-titre est le nom du champion : on ne l'ajoute pas."""
    name, sub = x['name'], x.get('subtitle')
    types = [t['id'] for t in x['cardType']['type']]
    if 'legend' in types:
        champ = champions.get((x['set']['value']['id'], norm(name)))
        tags = x.get('tags', {}).get('tags', [])
        return f'{champ or (tags[0] if tags else sub)}, {name}' if champ or tags or sub else name
    if sub and 'unit' in types:
        return f'{name}, {sub}'
    return name


def zh_name(x):
    types = [t['id'] for t in x['cardType']['type']]
    return f"{x['name']}·{x['subtitle']}" if x.get('subtitle') and 'unit' in types else x['name']


# ---------- images ----------
def fetch_image(url, landscape):
    from PIL import Image  # les champs de bataille (paysage) sont tournés en portrait pour la grille
    b = get(f"{url}{'&' if '?' in url else '?'}w={420 if landscape else IMG_W}&fm=webp&q=72", binary=True)
    if landscape:
        im = Image.open(io.BytesIO(b)).convert('RGB').rotate(90, expand=True)
        out = io.BytesIO()
        im.save(out, 'WEBP', quality=72)
        b = out.getvalue()
    return b


def download_images(cards, sources):
    todo = []
    for c in cards:
        for lang in ('en', 'zh'):
            url = sources.get(c['id'], {}).get(lang)
            if not url:
                continue
            rel = image_file(c['set'], c['id'], lang)
            if not (ROOT / rel).exists():
                todo.append((c, lang, url, rel))
    print(f'Images à télécharger : {len(todo)}')

    def job(t):
        c, lang, url, rel = t
        try:
            b = fetch_image(url, c.get('landscape'))
            (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
            (ROOT / rel).write_bytes(b)
            return True
        except Exception as e:
            print('  image KO', c['id'], lang, e)
            return False
    with ThreadPoolExecutor(12) as pool:
        ok = sum(pool.map(job, todo))
    print(f'  {ok} images ajoutées')
    for c in cards:
        en, zh = image_file(c['set'], c['id'], 'en'), image_file(c['set'], c['id'], 'zh')
        c['image'] = en if (ROOT / en).exists() else None
        c['imageZh'] = zh if (ROOT / zh).exists() else None


# ---------- liens Cardmarket ----------
def cm_slug(s):
    """« Kai'Sa, Daughter of the Void » -> « KaiSa-Daughter-of-the-Void » (forme des adresses Cardmarket)."""
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().replace("'", '').replace('’', '')
    return re.sub(r'[^A-Za-z0-9]+', '-', s).strip('-')


# suffixe des versions multiples : Cardmarket écrit « Nom-V2-Showcase », « Nom-V1-Rare », « Nom-V3-Overnumbered »…
VERSION_SUFFIX = {'common': 'Common', 'uncommon': 'Uncommon', 'rare': 'Rare', 'epic': 'Epic', 'showcase': 'Showcase'}


def add_cardmarket_paths(cards, singles, sets_cfg):
    """Adresse de la page Cardmarket de chaque carte.
    Carte unique dans son extension : Products/Singles/<extension>/<Nom> (exacte).
    Plusieurs versions : Products/Singles/<extension>/<Nom>-V<n>-<rareté>, n = rang du produit Cardmarket
    (identifiants croissants) ; la rareté écrite par Cardmarket ne se déduit pas toujours, l'appli propose donc
    aussi la page de toutes les versions (Cards/<Nom>/Versions)."""
    exp_slug = {v['idExpansion']: v.get('cmSlug') for v in sets_cfg.values() if isinstance(v, dict) and v.get('idExpansion')}
    by_id = {p['idProduct']: p for p in singles}
    groups = defaultdict(list)
    for p in singles:
        groups[(p['idExpansion'], p['name'])].append(p['idProduct'])
    for ids in groups.values():
        ids.sort()
    for c in cards:
        link = c.get('cardmarket')
        p = by_id.get((link or {}).get('idProduct'))
        if not p:
            continue
        name = cm_slug(p['name'])
        out = {'idProduct': p['idProduct'], 'versions': f'Cards/{name}/Versions'}
        exp = exp_slug.get(p['idExpansion'])
        ids = groups[(p['idExpansion'], p['name'])]
        if exp and len(ids) == 1:
            out['path'] = f'Products/Singles/{exp}/{name}'
        elif exp:
            suffix = 'Signed-Showcase' if c.get('variant') == 'sig' else 'Overnumbered' if c.get('variant') == 'star' else VERSION_SUFFIX.get(c.get('rarity'))
            if suffix and c.get('variant') != 'extra':
                out['path'] = f'Products/Singles/{exp}/{name}-V{ids.index(p["idProduct"]) + 1}-{suffix}'
                out['guess'] = True
        c['cardmarket'] = out


# ---------- import ----------
def main():
    config = read_json(DATA / 'config.json')
    sets_cfg = {k: v for k, v in config['sets'].items() if not k.startswith('_')}
    old = read_json(DATA / 'catalog.json', {'sets': [], 'cards': []})
    old_cards = {c['id']: c for c in old['cards']}

    print('Galerie officielle (anglais, chinois)…')
    gal_en, gal_zh = gallery('en-us'), gallery('zh-cn')
    zh = {x['id']: x for x in gal_zh['cards']['items']}
    zh_sets = {s['id']: s['name'] for s in gal_zh['sets']['items']}
    totals = {s['id']: s['collectorNumberMax'] for s in gal_en['sets']['items']}
    en_sets = {s['id']: s['name'] for s in gal_en['sets']['items']}
    rc = riftcodex()
    print('Cardmarket…')
    singles = get_json(f'{CM}/productList/products_singles_{CM_GAME}.json')['products']
    nonsingles = get_json(f'{CM}/productList/products_nonsingles_{CM_GAME}.json')['products']
    product_ids = {p['idProduct'] for p in singles}

    # nouvelles séries de la galerie officielle
    order_next = max([v.get('order', 0) for v in sets_cfg.values() if v.get('block') == 'main'] + [0]) + 1
    for code, name in en_sets.items():
        if code not in sets_cfg:
            sets_cfg[code] = {'fr': name, 'en': name, 'order': order_next, 'releaseDate': None, 'idExpansion': None, 'block': 'main', 'new': True, 'cmSlug': cm_slug(name)}
            order_next += 1
            print(f'  Nouvelle série {code} « {name} »')

    # rattachement des séries principales à une extension Cardmarket (noms des cartes en commun)
    taken = {v.get('idExpansion') for v in sets_cfg.values() if v.get('idExpansion')}
    by_exp = defaultdict(set)
    for p in singles:
        if p['idExpansion'] not in taken:
            by_exp[p['idExpansion']].add(norm(p['name']))
    for code, v in sets_cfg.items():
        if v.get('block') != 'main' or v.get('idExpansion'):
            continue
        names = {norm(x['name']) for x in gal_en['cards']['items'] if x['set']['value']['id'] == code}
        scored = sorted(((len(names & n) / max(1, len(names)), e) for e, n in by_exp.items()), reverse=True)
        if scored and scored[0][0] >= 0.4:
            v['idExpansion'] = scored[0][1]
            by_exp.pop(scored[0][1])
            print(f'  Série {code} rattachée à l\'extension Cardmarket {v["idExpansion"]}')
    # extensions Cardmarket restantes (promos, coffrets) : nouvelle série « promo »
    order_promo = max([v.get('order', 0) for v in sets_cfg.values()] + [20]) + 1
    for e in sorted(by_exp):
        code = f'CM{e}'
        if code in sets_cfg:
            continue
        label = next((re.sub(r'\s*\(.*?\)$', '', p['name']) for p in nonsingles if p['idExpansion'] == e), f'Promos {e}')
        sets_cfg[code] = {'fr': label, 'en': label, 'order': order_promo, 'idExpansion': e, 'block': 'promo', 'new': True}
        order_promo += 1
        print(f'  Nouvelle extension Cardmarket {e} : série {code} « {label} »')
    main_exp = {v['idExpansion']: k for k, v in sets_cfg.items() if v.get('block') == 'main' and v.get('idExpansion')}

    champions = {}
    for p in singles:
        if p['idExpansion'] in main_exp and ', ' in p['name']:
            champ, title = p['name'].split(', ', 1)
            champions[(main_exp[p['idExpansion']], norm(title))] = champ

    # --- cartes de la galerie ---
    cards, sources = [], {}
    for x in gal_en['cards']['items']:
        s = x['set']['value']['id']
        z = zh.get(x['id'])
        number = x['publicCode'].split('-', 1)[1].split('/')[0]
        variant = 'star' if '*' in number else 'alt' if re.search(r'\d[a-z]$', number) else None
        cid = f'{s}-{number}'
        if cid in sources:  # la galerie liste parfois deux fois la même carte
            continue
        img_en = x['cardImage']['url']
        sources[cid] = {'en': img_en, 'zh': z['cardImage']['url'] if z and z['cardImage']['url'] != img_en else None}
        cards.append({
            'id': cid, 'set': s, 'number': number, 'name': full_name(x, champions), 'nameZh': zh_name(z) if z else None,
            'rarity': x['rarity']['value']['id'], 'type': next((t['id'] for t in x['cardType']['type']), None),
            'domains': [v['id'] for v in x.get('domain', {}).get('values', [])],
            'energy': x.get('energy', {}).get('value', {}).get('id'), 'might': x.get('might', {}).get('value', {}).get('id'),
            'power': x.get('power', {}).get('value', {}).get('id'),
            'artist': ', '.join(v['label'] for v in x.get('illustrator', {}).get('values', [])) or None,
            'variant': variant, 'landscape': x.get('orientation') == 'landscape',
            '_tier': TIER.get(x['rarity']['value']['id'], 2) + (2 if variant == 'star' else 0),
        })
    known = {c['id'] for c in cards}
    # signatures (Riftcodex), sauf celles déjà dans la galerie en hors-série
    for r in rc:
        s = r['set']['set_id']
        if s not in sets_cfg or sets_cfg[s].get('block') != 'main' or not r['metadata'].get('signature'):
            continue
        cid = f"{s}-{r['collector_number']:03d}s"
        if cid in known or f"{s}-{r['collector_number']:03d}*" in known:
            continue
        known.add(cid)
        sources[cid] = {'en': r['media'].get('image_url'), 'zh': None}
        cards.append({
            'id': cid, 'set': s, 'number': f"{r['collector_number']:03d}s", 'name': re.sub(r'\s*\(Signature\)', '', r['name']).replace(' - ', ', '),
            'nameZh': None, 'rarity': 'signature', 'type': (r['classification']['type'] or 'unit').lower(),
            'domains': [d.lower() for d in r['classification'].get('domain') or []],
            'energy': r['attributes'].get('energy'), 'might': r['attributes'].get('might'), 'power': r['attributes'].get('power'),
            'artist': r['media'].get('artist'), 'variant': 'sig', 'landscape': r.get('orientation') == 'landscape', '_tier': 7,
        })

    # une carte déjà dans l'appli n'est jamais retirée (la galerie officielle varie parfois d'un jour à l'autre) :
    # elle garde son identifiant et son produit Cardmarket, donc sa place dans les collections
    for oc in old['cards']:
        # (les « variantes » sans numéro sont recréées à chaque passage, avec le même identifiant, à partir des produits restants)
        if oc['id'] not in known and oc['set'] in sets_cfg and sets_cfg[oc['set']].get('block') != 'promo' and oc.get('variant') != 'extra':
            known.add(oc['id'])
            sources[oc['id']] = {}
            cards.append({**oc, '_tier': 9})

    # --- rattachement à Cardmarket : on garde les liens existants, on apparie le reste ---
    used = set()
    for c in cards:
        link = old_cards.get(c['id'], {}).get('cardmarket')
        if link and link.get('idProduct') in product_ids and '--rematch' not in sys.argv:
            c['cardmarket'] = link
            used.add(link['idProduct'])

    by_name = defaultdict(list)
    for c in cards:
        by_name[(c['set'], norm(c['name']))].append(c)
    cm_main = defaultdict(list)
    for p in singles:
        if p['idExpansion'] in main_exp and p['idProduct'] not in used:
            cm_main[(main_exp[p['idExpansion']], norm(p['name']))].append(p)
    leftovers = []
    for key, prods in cm_main.items():
        # versions d'une même carte, dans l'ordre où Cardmarket les numérote (V1, V2, V3… = identifiants croissants) :
        # normale, illustration alternative, hors-série, signature, puis les versions ajoutées plus tard
        group = sorted((c for c in by_name.get(key, []) if 'cardmarket' not in c), key=lambda c: (c['_tier'], num_key(c['number'])))
        prods = sorted(prods, key=lambda p: p['idProduct'])
        for c, p in zip(group, prods):
            c['cardmarket'] = {'idProduct': p['idProduct']}
        leftovers += [(key, p) for p in prods[len(group):]]
    free = defaultdict(list)
    for c in cards:
        if 'cardmarket' not in c:
            free[norm(c['name'])].append(c)
    best_art = {}
    for c in sorted(cards, key=lambda c: c['_tier']):
        if sources.get(c['id'], {}).get('en'):
            best_art.setdefault(norm(c['name']), c)
    for (s, k), p in leftovers:
        if free.get(k):  # jeton rangé dans une autre série chez Cardmarket
            free[k].pop(0)['cardmarket'] = {'idProduct': p['idProduct']}
            continue
        base = max(by_name.get((s, k), []), key=lambda c: c['_tier'], default=None) or best_art.get(k)
        cid = f"{s}-X{p['idProduct']}"
        sources[cid] = dict(sources.get(base['id'], {})) if base else {}
        cards.append({
            'id': cid, 'set': s, 'number': 'var.', 'name': p['name'], 'nameZh': base['nameZh'] if base else None,
            'rarity': base['rarity'] if base else None, 'type': base['type'] if base else None,
            'domains': base['domains'] if base else [], 'energy': None, 'might': None, 'power': None, 'artist': None,
            'variant': 'extra', 'landscape': base['landscape'] if base else False, 'artApprox': bool(base), '_tier': 9,
            'cardmarket': {'idProduct': p['idProduct']},
        })

    # --- promos et coffrets (Cardmarket uniquement) ---
    rc_promo = defaultdict(list)
    for r in rc:
        if r['set']['set_id'] in ('PR', 'OPP', 'JDG') and r['media'].get('image_url'):
            rc_promo[norm(r['name'])].append(r)
    old_by_product = {c['cardmarket']['idProduct']: c for c in old['cards'] if c.get('cardmarket')}
    for code, v in sets_cfg.items():
        if v.get('block') != 'promo':
            continue
        prods = sorted((p for p in singles if p['idExpansion'] == v['idExpansion']), key=lambda p: p['idProduct'])
        seen = defaultdict(int)
        n_old = sum(1 for c in old['cards'] if c['set'] == code)
        for i, p in enumerate(prods, 1):
            k = norm(p['name'])
            prev = old_by_product.get(p['idProduct'])
            cid = prev['id'] if prev and prev['set'] == code else f'{code}-{i:03d}'
            if not prev and any(c['id'] == cid for c in old['cards']):
                n_old += 1
                cid = f'{code}-{n_old:03d}'
            base = best_art.get(k)
            art, approx = None, False
            if rc_promo.get(k):
                art = rc_promo[k][min(seen[k], len(rc_promo[k]) - 1)]['media']['image_url']
            elif base:
                art, approx = sources[base['id']]['en'], True
            seen[k] += 1
            sources[cid] = {'en': art, 'zh': None}
            cards.append({
                'id': cid, 'set': code, 'number': cid.rsplit('-', 1)[1], 'name': p['name'],
                'nameZh': base['nameZh'] if base else None, 'rarity': 'promo',
                'type': base['type'] if base else None, 'domains': base['domains'] if base else [],
                'energy': base['energy'] if base else None, 'might': base['might'] if base else None, 'power': base['power'] if base else None,
                'artist': None, 'variant': None, 'landscape': base['landscape'] if base else False, 'artApprox': approx, '_tier': 4,
                'cardmarket': {'idProduct': p['idProduct']},
            })

    # --- langues imprimées : français et chinois quand Cardmarket vend du scellé dans cette langue ---
    fr_exp = {p['idExpansion'] for p in nonsingles if '(French)' in p['name']}
    zh_exp = {p['idExpansion'] for p in nonsingles if '(Chinese' in p['name']}
    zh_art = {c['set'] for c in cards if sources.get(c['id'], {}).get('zh')}
    sets = []
    for code, v in sets_cfg.items():
        langs = ['en']
        if v.get('block') == 'main' and v.get('idExpansion') in fr_exp:
            langs.append('fr')
        if v.get('block') == 'main' and (v.get('idExpansion') in zh_exp or code in zh_art):
            langs.append('zh')
        count = sum(1 for c in cards if c['set'] == code)
        if not count:
            continue
        sets.append({'code': code, 'name': v['fr'], 'nameEn': v['en'], 'nameZh': v.get('zh') or zh_sets.get(code) or v['en'],
                     'block': 'new' if v.get('new') else v.get('block', 'main'), 'order': v.get('order', 99), 'releaseDate': v.get('releaseDate'),
                     'langs': langs, 'total': totals.get(code), 'cardmarket': {'idExpansion': v.get('idExpansion')}})

    add_cardmarket_paths(cards, singles, sets_cfg)
    download_images(cards, sources)
    for c in cards:
        c.pop('_tier', None)
        if not c.get('artApprox'):
            c.pop('artApprox', None)
    added = [c['id'] for c in cards if c['id'] not in old_cards]
    config['sets'] = {'_aide': config['sets'].get('_aide', '')} | {k: v for k, v in sets_cfg.items()}
    (DATA / 'config.json').write_text(__import__('json').dumps(config, ensure_ascii=False, indent=2), encoding='utf8')
    write_json(DATA / 'catalog.json', {'source': 'riftbound.leagueoflegends.com + Riftcodex + Cardmarket', 'sets': sets, 'cards': cards})
    print(f'{len(cards)} cartes dans {len(sets)} séries ; {len(added)} nouvelles{(" : " + ", ".join(added[:20])) if added else ""}{" …" if len(added) > 20 else ""}')


if __name__ == '__main__':
    main()
