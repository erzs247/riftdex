"""Importe les produits scellés Riftbound depuis la liste publique de Cardmarket (lancé chaque lundi).

Chaque produit est classé par langue : « (French) » -> édition française, « (Chinese …) » -> édition chinoise,
sinon édition anglaise. Les produits déjà présents gardent leur identifiant (S-<idProduct>).

Images (images/sealed/) : visuel du même produit sur TCGplayer (copie publique tcgcsv.com) ; les produits français et
chinois prennent celui de la version anglaise (« imageApprox »). Sans visuel (sets de cartes, decks d'essai…) : montage
de cartes de la série (« imageArt »).
Usage : python scripts/import_scelle.py
"""
import io
import re

from common import CACHE, CM, CM_GAME, DATA, ROOT, get, get_json, norm, read_json, write_json

TCG = 'https://tcgcsv.com/tcgplayer/89'
# produits Cardmarket sans équivalent de même nom sur TCGplayer
TCG_NAMES = {'Proving Grounds': 'Origins Proving Grounds Box Set', 'Arcane Box Set': 'Riftbound League of Legends Arcane Box Set',
             'Worlds Bundle 2025': 'Riftbound Worlds Bundle 2025', 'Secret Garden Box Set': 'Secret Garden Box',
             'Riftbound x T1 2025 Worlds Champion Signature Edition': 'T1 Worlds Champion Signature Edition Bundle',
             'Riftbound x T1 Worlds 2025 Champion Player Bundle': 'T1 Worlds Champion Player Bundle',
             'K/DA Couture Collection Box': 'Riftbound x K/DA Couture Collection Sealed Promotional Bundle',
             'Bulk Runes Box': 'Riftbound Bulk Runes'}
RARITY_SET = {'Common Set': ['common'], 'Uncommon Set': ['uncommon'], 'Rare Set': ['rare'], 'Epic Set': ['epic'], 'Full Set': ['epic', 'showcase', 'rare']}
IMG_MAX = 480


def tcg_key(base, set_en):
    """Nom Cardmarket -> nom TCGplayer comparable (« Origins Booster Box » -> « origins booster display »)."""
    n = TCG_NAMES.get(base, base)
    m = re.fullmatch(r'(.+) Champion Deck', n)
    if m and set_en:
        n = f'{set_en} Champion Deck ({m.group(1)})'
    m = re.fullmatch(r'(.+ vs .+) Showdown Decks', n)
    if m and set_en:
        n = f'{set_en} Showdown Decks {m.group(1)}'
    n = re.sub(r'Case \(6x Booster Box\)$|(?<!Booster Display) Case$', 'Booster Display Case', n)
    n = re.sub(r'Booster Box$', 'Booster Display', n)
    n = re.sub(r'(Promo )?Booster$', lambda x: 'Promo Pack' if x.group(1) else 'Booster Pack', n)
    n = re.sub(r'Vault$', 'Vault Bundle', n)
    return norm(n.replace('Booster Display Case', ' Booster Display Case'))


def tcg_sealed():
    try:
        out = {}
        for g in get_json(f'{TCG}/groups')['results']:
            for p in get_json(f"{TCG}/{g['groupId']}/products")['results']:
                if p.get('imageCount') and not any(e['name'] == 'Number' for e in p.get('extendedData', [])):
                    out.setdefault(norm(p['name']), p['productId'])
        return out
    except Exception as e:
        print('  TCGplayer indisponible :', e)
        return None


def to_webp(b):
    from PIL import Image
    from PIL import ImageDraw
    im = Image.open(io.BytesIO(b)).convert('RGBA')
    # fond blanc des photos TCGplayer rendu transparent (remplissage depuis les bords) : le produit se détache sur le thème sombre
    w, h = im.size
    for xy in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if min(im.getpixel(xy)[:3]) > 242:
            ImageDraw.floodfill(im, xy, (255, 255, 255, 0), thresh=14)
    im = im.crop(im.getbbox() or (0, 0, w, h))
    im.thumbnail((IMG_MAX, IMG_MAX))
    out = io.BytesIO()
    im.save(out, 'WEBP', quality=78)
    return out.getvalue()


def montage(paths):
    """Éventail de 3 cartes sur fond transparent (visuel des sets de cartes et des produits sans image)."""
    from PIL import Image
    W, H = 480, 400
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    cards = [Image.open(ROOT / p).convert('RGBA') for p in paths[:3]]
    n = len(cards)
    for i, im in enumerate(cards):
        im = im.resize((200, int(200 * im.height / im.width)))
        angle = (i - (n - 1) / 2) * -14
        r = im.rotate(angle, expand=True, resample=Image.BICUBIC)
        x = W // 2 - r.width // 2 + int((i - (n - 1) / 2) * 120)
        y = H // 2 - r.height // 2 + int(abs(i - (n - 1) / 2) * 18)
        canvas.alpha_composite(r, (x, y))
    out = io.BytesIO()
    canvas.save(out, 'WEBP', quality=80)
    return out.getvalue()


def add_images(items, catalog, sets_cfg):
    manifest_file = CACHE / 'images.json'
    manifest = read_json(manifest_file, {})
    tcg = tcg_sealed()
    cards = [c for c in catalog['cards'] if c.get('image') and c.get('variant') != 'extra' and not c.get('only')]
    en_image = {}
    found = art = 0
    for it in sorted(items, key=lambda i: i['lang'] != 'en'):  # les produits anglais d'abord : leur visuel sert aux autres
        rel = f"images/sealed/{it['id']}.webp"
        base = re.sub(r'\s*\((Slim|Jumbo)\)$', '', it['nameEn'])
        set_en = (sets_cfg.get(it['set']) or {}).get('en')
        pid = (tcg or {}).get(tcg_key(base, set_en))
        if pid:
            url = f'https://tcgplayer-cdn.tcgplayer.com/product/{pid}_in_1000x1000.jpg'
            if manifest.get(rel) != url or not (ROOT / rel).exists():
                try:
                    b = to_webp(get(url, binary=True))
                    (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
                    (ROOT / rel).write_bytes(b)
                    manifest[rel] = url
                except Exception as e:
                    print('  image KO', it['id'], e)
            if (ROOT / rel).exists():
                it['image'] = rel
                if it['lang'] != 'en':
                    it['imageApprox'] = True
                en_image[(it['set'], tcg_key(base, set_en))] = rel
                found += 1
                continue
        if (it['set'], tcg_key(base, set_en)) in en_image:  # produit français ou chinois : visuel de la version anglaise
            it['image'], it['imageApprox'] = en_image[(it['set'], tcg_key(base, set_en))], True
            found += 1
            continue
        # pas de visuel : montage de cartes de la série (rareté du set de cartes, champion du deck, sinon les plus rares)
        code = it['set'] or ('LGC' if 'Legacy' in base else None)
        pool = [c for c in cards if c['set'] == code]
        rar = next((v for k, v in RARITY_SET.items() if base.endswith(k)), None)
        champ = re.match(r'(.+?) (Trial|Champion) Deck', base)
        pick = []
        if rar:
            for r in rar:
                pick += [c for c in pool if c['rarity'] == r and c['type'] != 'battlefield'][:3 if len(rar) == 1 else 1]
        elif champ:
            pick = [c for c in catalog['cards'] if c.get('image') and c['type'] == 'legend' and c['name'].startswith(champ.group(1) + ',') and c.get('variant') is None][:1]
            pick += [c for c in pool if c['name'].startswith(champ.group(1)) and c['type'] == 'unit' and c.get('variant') is None][:2]
        if not pick:
            order = ['showcase', 'epic', 'rare', 'promo']
            pick = sorted((c for c in pool if c['type'] in ('unit', 'legend') and c.get('variant') is None),
                          key=lambda c: order.index(c['rarity']) if c['rarity'] in order else 9)[:3]
        if not pick:
            continue
        key = 'montage:' + ','.join(c['id'] for c in pick)
        if manifest.get(rel) != key or not (ROOT / rel).exists():
            (ROOT / rel).parent.mkdir(parents=True, exist_ok=True)
            (ROOT / rel).write_bytes(montage([c['image'] for c in pick]))
            manifest[rel] = key
        it['image'], it['imageArt'] = rel, True
        art += 1
    write_json(manifest_file, dict(sorted(manifest.items())))
    print(f'  images du scellé : {found} visuels de produit, {art} montages de cartes')

CAT_ZH = {'booster': '补充包', 'box': '补充包盒', 'case': '整箱', 'deck': '套牌', 'kit': '礼盒', 'set': '全套'}
FR_WORDS = [('Sleeved Booster', 'Booster sous blister'), ('Champion Deck', 'Deck de champion'), ('Trial Deck', 'Deck d\'essai'),
            ('Pre-Rift Event Kit', 'kit d\'avant-première'), ('Common Set', 'set des communes'), ('Uncommon Set', 'set des peu communes'),
            ('Rare Set', 'set des rares'), ('Epic Set', 'set des épiques'), ('Full Set', 'set complet'),
            ('Case (6x Booster Box)', 'case de 6 Booster Box'), ('Showdown Decks', 'decks Showdown')]
ORDER = ['booster', 'box', 'case', 'deck', 'kit', 'set']


def main():
    config = read_json(DATA / 'config.json')
    sets_cfg = {k: v for k, v in config['sets'].items() if not k.startswith('_')}
    by_exp = {v['idExpansion']: (k, v) for k, v in sets_cfg.items() if v.get('idExpansion')}
    catalog = read_json(DATA / 'catalog.json', {'sets': []})
    zh_names = {s['code']: s['nameZh'] for s in catalog['sets']}
    old = {it['id'] for it in read_json(DATA / 'sealed.json', {'items': []})['items']}

    items = []
    for p in get_json(f'{CM}/productList/products_nonsingles_{CM_GAME}.json')['products']:
        n, cat = p['name'].strip(), p['categoryName']
        lang = 'fr' if '(French)' in n else 'zh' if '(Chinese' in n else 'en'
        kind = ('case' if 'Case' in n else 'box') if 'Display' in cat else 'booster' if 'Booster' in cat else \
            'deck' if 'Champion Decks' in cat else 'set' if cat.startswith('RB Set') else 'kit'
        size = re.search(r'Chinese, (Slim|Jumbo)', n)
        base = re.sub(r'\s*\((French|Chinese[^)]*)\)', '', n).strip()
        code, sv = by_exp.get(p['idExpansion'], (None, None))
        fr = base
        for v in sets_cfg.values():
            if v.get('block') == 'main' and v['en'] != v['fr']:
                fr = fr.replace(v['en'], v['fr'])
        for en_w, fr_w in FR_WORDS:
            fr = fr.replace(en_w, fr_w)
        zh = f"{zh_names.get(code, '')} {CAT_ZH[kind]}".strip() if lang == 'zh' else base
        if size:
            zh += f"（{'小' if size.group(1) == 'Slim' else '大'}盒）"
        items.append({'id': f"S-{p['idProduct']}", 'kind': 'sealed', 'category': kind, 'lang': lang,
                      'name': fr, 'nameEn': base + (f' ({size.group(1)})' if size else ''), 'nameZh': zh, 'set': code,
                      'cardmarket': {'idProduct': p['idProduct']}, '_o': (ORDER.index(kind), (sv or {}).get('order', 99), p['idProduct'])})
    items.sort(key=lambda i: i['_o'])
    for i, it in enumerate(items):
        it.pop('_o')
        it['order'] = i
    add_images(items, catalog, sets_cfg)
    write_json(DATA / 'sealed.json', {'items': items})
    new = [it['id'] for it in items if it['id'] not in old]
    print(f'{len(items)} produits scellés ; {len(new)} nouveaux{(" : " + ", ".join(new)) if new else ""}')


if __name__ == '__main__':
    main()
