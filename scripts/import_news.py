"""Relève les actualités officielles de Riftbound (playriftbound.com) en français, anglais et chinois.

Lancé chaque jour par la GitHub Action avec le relevé des prix. Écrit data/news.json :
{ updatedAt, items: { fr: [...], en: [...], zh: [...] } }, chaque article { id, date, title, desc, url, image, category }.
Usage : python scripts/import_news.py
"""
import html
import json
import re
from datetime import date

from common import DATA, get, write_json

SITE = 'https://playriftbound.com'
LOCALES = {'fr': 'fr-fr', 'en': 'en-us', 'zh': 'zh-cn'}
KEEP = 60  # articles gardés par langue


def text(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s or '')).strip()


def news(loc):
    h = get(f'{SITE}/{loc}/news/', timeout=60)
    j = json.loads(re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>', h, re.S).group(1))
    grid = next(b for b in j['props']['pageProps']['page']['blades'] if b.get('type') == 'articleCardGrid')
    out = []
    for x in grid['items']:
        action = x.get('action') or {}
        url = (action.get('payload') or {}).get('url') or action.get('url') or ''
        if url.startswith('/'):
            url = SITE + url
        img = ((x.get('media') or {}).get('url') or '').split('?')[0]
        out.append({
            'id': ((x.get('analytics') or {}).get('contentId') or url).split('.')[0],
            'date': (x.get('publishedAt') or '')[:10],
            'title': x.get('title') or '',
            'desc': text((x.get('description') or {}).get('body')),
            'url': url,
            'image': f'{img}?accountingTag=RB&w=640&fm=webp&q=70' if 'cmsassets.rgpub.io' in img else img or None,
            'category': (x.get('category') or {}).get('title') or '',
        })
    out.sort(key=lambda a: a['date'], reverse=True)
    return out[:KEEP]


def main():
    old = json.loads((DATA / 'news.json').read_text(encoding='utf8')) if (DATA / 'news.json').exists() else {'items': {}}
    items = {}
    for k, loc in LOCALES.items():
        try:
            items[k] = news(loc)
        except Exception as e:  # une langue indisponible : on garde la copie précédente
            print(f'  actualités {loc} indisponibles :', e)
            items[k] = old.get('items', {}).get(k, [])
    write_json(DATA / 'news.json', {'updatedAt': date.today().isoformat(), 'items': items})
    print('Actualités :', ', '.join(f'{k} {len(v)}' for k, v in items.items()))


if __name__ == '__main__':
    main()
