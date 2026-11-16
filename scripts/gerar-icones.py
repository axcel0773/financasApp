#!/usr/bin/env python3
"""Gera ícones e telas de abertura do PWA na paleta atual (preto + verde-limão). Uso: python3 scripts/gerar-icones.py"""
from pathlib import Path
from PIL import Image, ImageDraw

BG, LIMAO = (10, 10, 11), (197, 240, 74)
PUB = Path(__file__).resolve().parent.parent / 'public'

def marca(lado: int, ocupacao: float) -> Image.Image:
    """Três barras em pílula, crescentes. `ocupacao`: fração do lado usada pela marca (área segura do maskable)."""
    s = 4  # desenha maior e reduz, para bordas suaves
    L = lado * s
    img = Image.new('RGB', (L, L), BG)
    d = ImageDraw.Draw(img)
    area = L * ocupacao
    bw = area * 0.22
    gap = (area - 3 * bw) / 2
    x0 = (L - area) / 2
    base = (L + area) / 2
    for i, h in enumerate((0.42, 0.68, 1.0)):
        x = x0 + i * (bw + gap)
        d.rounded_rectangle([x, base - area * h, x + bw, base], radius=bw / 2, fill=LIMAO)
    return img.resize((lado, lado), Image.LANCZOS)

def abertura(w: int, h: int) -> Image.Image:
    img = Image.new('RGB', (w, h), BG)
    lado = int(min(w, h) * 0.22)
    m = marca(lado, 1.0)
    img.paste(m, ((w - lado) // 2, (h - lado) // 2))
    return img

marca(192, 0.46).save(PUB / 'icon-192.png')
marca(512, 0.46).save(PUB / 'icon-512.png')
marca(512, 0.36).save(PUB / 'icon-maskable-512.png')
marca(180, 0.46).save(PUB / 'apple-touch-icon.png')
for f in sorted((PUB / 'splash').glob('*.png')):
    w, h = map(int, f.stem.split('x'))
    abertura(w, h).save(f, optimize=True)
print('ok')
