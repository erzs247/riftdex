"""Importe les produits scellés Riftbound depuis la liste publique de Cardmarket (lancé chaque lundi).

Chaque produit est classé par langue : « (French) » -> édition française, « (Chinese …) » -> édition chinoise,
sinon édition anglaise. Les produits déjà présents gardent leur identifiant (S-<idProduct>).
Usage : python scripts/import_scelle.py
"""
import re

from common import CM, CM_GAME, DATA, get_json, read_json, write_json

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
    write_json(DATA / 'sealed.json', {'items': items})
    new = [it['id'] for it in items if it['id'] not in old]
    print(f'{len(items)} produits scellés ; {len(new)} nouveaux{(" : " + ", ".join(new)) if new else ""}')


if __name__ == '__main__':
    main()
