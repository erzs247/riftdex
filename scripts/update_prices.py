"""Relève les prix Cardmarket du jour (lancé chaque matin par la GitHub Action).

Cardmarket publie chaque nuit le guide des prix de chaque jeu (Riftbound = jeu n° 22).
Chaque exécution ajoute le prix « tendance » du jour à l'historique de chaque carte et produit scellé :
une exécution par jour = un point de plus sur la courbe. Au premier relevé d'une carte, la courbe démarre
avec les moyennes 30 j, 7 j et 1 j de Cardmarket.
Les raretés imprimées uniquement en foil (rares et plus chez Riftbound) n'ont qu'un prix foil : il est utilisé.
Usage : python scripts/update_prices.py
"""
from datetime import date, timedelta

from common import CM, CM_GAME, DATA, get_json, read_json, write_json


def num(v):
    return round(v, 2) if isinstance(v, (int, float)) and v > 0 else None


def main():
    guide_file = get_json(f'{CM}/priceGuide/price_guide_{CM_GAME}.json')
    guide = {g['idProduct']: g for g in guide_file['priceGuides']}
    today = date.fromisoformat(guide_file['createdAt'][:10])
    ago = lambda n: (today - timedelta(days=n)).isoformat()
    catalog = read_json(DATA / 'catalog.json')
    sealed = read_json(DATA / 'sealed.json', {'items': []})['items']
    prices = read_json(DATA / 'prices.json', {'prices': {}})['prices']

    priced = 0
    for it in catalog['cards'] + sealed:
        g = guide.get((it.get('cardmarket') or {}).get('idProduct'))
        if not g:
            continue
        foil = not (num(g.get('trend')) or num(g.get('avg')) or num(g.get('low'))) and bool(num(g.get('trend-foil')))
        f = lambda k: num(g.get(f'{k}-foil' if foil else k))
        trend = f('trend') or f('avg') or f('low')
        if trend is None:
            continue
        priced += 1
        e = prices.get(it['id']) or {'history': []}
        e.update({'trend': trend, 'low': f('low'), 'avg': f('avg'), 'avg1': f('avg1'), 'avg7': f('avg7'), 'avg30': f('avg30'),
                  'foil': foil or None, 'trendFoil': None if foil else num(g.get('trend-foil'))})
        if not e['history']:
            e['seeded'] = True
            for days, k in ((30, 'avg30'), (7, 'avg7'), (1, 'avg1')):
                if e[k]:
                    e['history'].append([ago(days), e[k]])
        e['history'] = [h for h in e['history'] if h[0] != today.isoformat()] + [[today.isoformat(), trend]]
        prices[it['id']] = {k: v for k, v in e.items() if v is not None}

    known = {it['id'] for it in catalog['cards'] + sealed}
    prices = {k: v for k, v in prices.items() if k in known}
    write_json(DATA / 'prices.json', {'source': 'Cardmarket', 'currency': 'EUR', 'updatedAt': today.isoformat(),
                                      'cardmarketCreatedAt': guide_file.get('createdAt'), 'prices': prices})
    print(f"{priced} cartes et produits avec un prix au {today} (guide Cardmarket du {guide_file.get('createdAt')}).")


if __name__ == '__main__':
    main()
