"""Fabrique l'index du scanner : une « empreinte » de 9 × 12 points de couleur pour chaque image de carte
(anglaise et chinoise). L'appli compare l'image de la caméra à ces empreintes, sur le téléphone, sans serveur.
Le calcul (moyenne par case sur une image ramenée à 90 × 120) est le même que dans app.js (scanFeature).
Usage : python scripts/make_scan_index.py   (relancé chaque lundi après l'import des nouveautés)
"""
import base64
from datetime import datetime, timezone

from PIL import Image

from common import DATA, ROOT, read_json, write_json

GW, GH, RW, RH = 9, 12, 90, 120


def raw90(path):
    im = Image.open(path).convert('RGBA')
    bg = Image.new('RGBA', im.size, (16, 16, 20, 255))  # fond sombre sous les coins transparents
    return Image.alpha_composite(bg, im).convert('RGB').resize((RW, RH), Image.BILINEAR).tobytes()


def box_feature(px):
    out = bytearray(GW * GH * 3)
    for gy in range(GH):
        for gx in range(GW):
            x0, x1 = gx * RW // GW, max(gx * RW // GW + 1, (gx + 1) * RW // GW)
            y0, y1 = gy * RH // GH, max(gy * RH // GH + 1, (gy + 1) * RH // GH)
            s, n = [0, 0, 0], 0
            for yy in range(y0, y1):
                for xx in range(x0, x1):
                    i = (yy * RW + xx) * 3
                    s[0] += px[i]; s[1] += px[i + 1]; s[2] += px[i + 2]; n += 1
            o = (gy * GW + gx) * 3
            out[o:o + 3] = bytes(v // n for v in s)
    return bytes(out)


def main():
    catalog = read_json(DATA / 'catalog.json')
    items = []
    for c in catalog['cards']:
        for img in (c.get('image'), c.get('imageZh')):
            if img and (ROOT / img).exists():
                items.append([c['id'], base64.b64encode(box_feature(raw90(ROOT / img))).decode()])
    old = read_json(DATA / 'scan-index.json')
    same = old is not None and old.get('items') == items
    if not same:  # réécrit seulement si ça change
        write_json(DATA / 'scan-index.json', {'w': GW, 'h': GH, 'generatedAt': datetime.now(timezone.utc).isoformat(), 'items': items})
    print(f"Index du scanner : {len(items)} empreintes pour {len(catalog['cards'])} cartes{' (inchangé)' if same else ''}.")


if __name__ == '__main__':
    main()
