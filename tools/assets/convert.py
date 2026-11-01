#!/usr/bin/env python3
"""Перегоняет картинки игры в WebP по manifest.csv.

Положи исходники в папку sources/ с именем = id из манифеста
(расширение любое: png, jpg, jpeg, webp). Пример: sources/dolly_trust.png

    pip install pillow
    python3 convert.py            # конвертировать всё, что найдено
    python3 convert.py --check    # только показать, чего не хватает

Результат: assets/<category>/<id>.<hash>.webp и assets/assets.json (корень репо) (id -> путь),
чтобы фронт брал картинки по id, а кеш браузера жил вечно.
"""
import csv, hashlib, json, sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
SRC, OUT = ROOT / "sources", ROOT.parent.parent / "assets"
EXTS = (".png", ".jpg", ".jpeg", ".webp")
QUALITY = {"ui": 88, "evidence": 85, "envelopes": 85}  # остальное 80
NO_HASH = {"paper_light", "paper_dark"}  # плитки CSS удобнее с постоянным именем


def find(id_):
    for ext in EXTS:
        for p in (SRC / f"{id_}{ext}", SRC / f"{id_}{ext.upper()}"):
            if p.exists():
                return p
    return None


def fit(img, aspect, width):
    a, b = (int(x) for x in aspect.split(":"))
    height = round(width * b / a)
    img = ImageOps.exif_transpose(img).convert("RGB")
    # центрируем по ширине, по высоте чуть выше центра: лица обычно в верхней трети
    return ImageOps.fit(img, (width, height), Image.LANCZOS, centering=(0.5, 0.45))


def main():
    check_only = "--check" in sys.argv
    rows = list(csv.DictReader(open(ROOT / "manifest.csv", encoding="utf-8")))
    known = {r["id"] for r in rows}
    missing, assets, total = [], {}, 0
    for r in rows:
        src = find(r["id"])
        if not src:
            missing.append(r)
            continue
        if check_only:
            continue
        img = fit(Image.open(src), r["aspect"], int(r["width"]))
        dst_dir = OUT / r["category"]
        dst_dir.mkdir(parents=True, exist_ok=True)
        tmp = dst_dir / f"{r['id']}.tmp.webp"
        img.save(tmp, "WEBP", quality=QUALITY.get(r["category"], 80), method=6)
        digest = hashlib.sha1(tmp.read_bytes()).hexdigest()[:8]
        name = f"{r['id']}.webp" if r["id"] in NO_HASH else f"{r['id']}.{digest}.webp"
        dst = dst_dir / name
        for old in dst_dir.glob(f"{r['id']}.*.webp"):
            if old != tmp:
                old.unlink()
        tmp.replace(dst)
        size = dst.stat().st_size
        total += size
        assets[r["id"]] = {"src": f"{r['category']}/{name}", "w": img.width, "h": img.height}
        print(f"ok   {r['id']:<24} {img.width}x{img.height}  {size // 1024} КБ")

    extra = sorted(p.stem for p in SRC.iterdir() if p.suffix.lower() in EXTS and p.stem not in known) if SRC.exists() else []
    if not check_only and assets:
        OUT.mkdir(exist_ok=True)
        (OUT / "assets.json").write_text(json.dumps(assets, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"\nГотово: {len(assets)} файлов, {total / 1024 / 1024:.1f} МБ -> {OUT}")
    if missing:
        print(f"\nНе хватает {len(missing)}:")
        for r in missing:
            print(f"  sources/{r['id']}.png   — {r['description']}")
    if extra:
        print("\nЛишние файлы (имени нет в манифесте, опечатка?):", ", ".join(extra))


if __name__ == "__main__":
    main()
