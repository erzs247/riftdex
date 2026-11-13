"""Outils partagés par les scripts de données de RiftDex (téléchargements, chemins, normalisation des noms)."""
import json
import re
import ssl
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data'
IMAGES = ROOT / 'images'
CACHE = ROOT / 'cache'          # copies des sources (Riftcodex est lent : on garde la dernière réponse)
UA = {'User-Agent': 'Mozilla/5.0 (RiftDex collection tracker; +https://github.com/erzs247/riftdex)'}

CM = 'https://downloads.s3.cardmarket.com/productCatalog'
CM_GAME = 22  # Riftbound sur Cardmarket


def _ctx():
    try:
        import certifi  # présent sur GitHub Actions ; sinon certificats du système
        return ssl.create_default_context(cafile=certifi.where())
    except ImportError:
        return ssl.create_default_context()


def get(url, binary=False, timeout=60):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout, context=_ctx()) as r:
        b = r.read()
    return b if binary else b.decode('utf-8')


def get_json(url, timeout=60):
    return json.loads(get(url, timeout=timeout))


def read_json(path, default=None):
    p = Path(path)
    return json.loads(p.read_text(encoding='utf8')) if p.exists() else default


def write_json(path, obj):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')), encoding='utf8')


def norm(s):
    """Nom comparable entre la galerie officielle, Riftcodex et Cardmarket."""
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = s.replace(' - ', ', ')
    s = re.sub(r'\((signature|metal|alternate art|overnumbered|[a-z]{2})\)', '', s)  # « Recruit (DE) » -> « recruit »
    return re.sub(r'[^a-z0-9]+', ' ', s).strip()


def num_key(n):
    m = re.match(r'(\d+)(.*)', str(n))
    return (int(m.group(1)), m.group(2)) if m else (9999, str(n))


def image_file(set_code, card_id, lang):
    """Chemin de l'image d'une carte : images/<série>/<id>.webp, images/<série>/zh/<id>.webp pour le chinois.
    Le « * » des hors-séries (OGN-299*) n'est pas permis dans les noms de fichiers Windows."""
    name = card_id.replace('*', '-star') + '.webp'
    return f'images/{set_code}/zh/{name}' if lang == 'zh' else f'images/{set_code}/{name}'


def cardmarket_files():
    singles = get_json(f'{CM}/productList/products_singles_{CM_GAME}.json')
    nonsingles = get_json(f'{CM}/productList/products_nonsingles_{CM_GAME}.json')
    guide = get_json(f'{CM}/priceGuide/price_guide_{CM_GAME}.json')
    return singles, nonsingles, guide
