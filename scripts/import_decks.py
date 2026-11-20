"""Relève les decks de tournoi récents publiés par Riftbound France (riftboundfrance.fr/decks, listes reprises de
riftdecks.com). Lancé chaque lundi par la GitHub Action. Chaque deck garde le lien vers sa page et sa source.

Écrit data/decks.json : { updatedAt, items: [{ id, legend, event, place, date, url, source, cards: {main, rune, battlefield, legend, side} }] }
les cartes sont rangées par nom anglais avec leur quantité.
Usage : python scripts/import_decks.py
"""
import json
import re
import time
from datetime import date

from common import DATA, get, write_json

SITE = 'https://riftboundfrance.fr'
MAX = 24


def flight(h):
    return ''.join(json.loads('"' + c + '"') for c in re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)', h, re.S))


def deck(path):
    s = flight(get(SITE + path, timeout=60))
    cards = {}
    for m in re.finditer(r'\{"cardId":"[^"]+","name":"([^"]+)","artUrl":"[^"]*","type":"[^"]*".*?"quantity":(\d+),"section":"([a-z]+)"\}', s):
        name, q, sec = m.group(1), int(m.group(2)), m.group(3)
        cards.setdefault(sec, {})
        cards[sec][name] = cards[sec].get(name, 0) + q
    title = re.search(r'<title>(.*?)</title>', s) or re.search(r'"children":"(Deck [^"]+)"', s)
    event = re.search(r'"href":"/tournois/[^"]+","className":"[^"]*","children":\[\[\["\$","\$L\w+",null,\{"code":"\w+"\}\]," "\],"([^"]+)"\]', s)
    place = re.search(r'"children":\["(\d+(?:er|e))",null\]', s)
    source = re.search(r'"href":"(https://riftdecks\.com/[^"]+)"', s)
    day = re.search(r'\((\d{4}-\d{2}-\d{2})\)', s)
    return cards, (event.group(1) if event else ''), (place.group(1) if place else ''), (source.group(1) if source else ''), (day.group(1) if day else '')


def main():
    h = get(f'{SITE}/decks', timeout=60)
    paths = list(dict.fromkeys(re.findall(r'href="(/decks/deck-[^"?#]+)"', h)))[:MAX]
    items = []
    for p in paths:
        try:
            cards, event, place, source, day = deck(p)
        except Exception as e:
            print('  deck indisponible', p, e)
            continue
        legend = next(iter(cards.get('legend', {})), '')
        if not cards.get('main') or not legend:
            continue
        items.append({'id': p.rsplit('-', 1)[-1], 'legend': legend, 'event': event, 'place': place, 'date': day,
                      'url': SITE + p, 'source': source, 'cards': cards})
        time.sleep(0.6)
    if items:
        write_json(DATA / 'decks.json', {'updatedAt': date.today().isoformat(), 'items': items})
    print(f'{len(items)} decks de tournoi')


if __name__ == '__main__':
    main()
