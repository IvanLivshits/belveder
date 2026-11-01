---
name: asset-pipeline
description: Как добавить или заменить картинку: tools/assets/sources → convert.py → assets/ + assets.json, именование id, кеширование. Применять при любой работе с изображениями.
---

# Пайплайн картинок

## Поток

```
tools/assets/sources/<id>.png   (НЕ коммитить, в .gitignore)
        │  python3 -I tools/assets/convert.py   (bun run assets)
        ▼
assets/<category>/<id>.<hash>.webp  +  assets/assets.json   (коммитить)
```

`assets.json`: `{ "<id>": { "src": "portraits/dolly.5df9b350.webp", "w": 900, "h": 1600 } }`.
Mini App берёт картинку только по id: `assets[id].src`. Контент тоже ссылается только на id.

## Манифест

`tools/assets/manifest.csv`: `id,category,aspect,width,description`. Каждая картинка игры должна быть там.
Категории: `portraits`, `backgrounds`, `evidence`, `envelopes`, `endings`, `ui`.
`python3 -I tools/assets/convert.py --check` показывает, чего не хватает в `sources/`.

## Именование id

- `snake_case`, латиница.
- Портреты: `<персонаж>` для базового, `<персонаж>_<эмоция>` для вариантов (`dolly`, `dolly_trust`). Эмоции и база — из исходников одного размера, иначе портрет «прыгнет».
- Фоны: `<место>` или `landing_<NN>` для площадок.
- Улики и предметы: `ev_*`, конверты воспоминаний: `mem_*`, `env_sealed`.

## Добавить или заменить

1. Строка в `manifest.csv` (если новая картинка).
2. Файл в `tools/assets/sources/<id>.png`.
3. `bun run assets`. Скрипт перепишет `assets/assets.json`; у заменённой картинки изменится хеш в имени.
4. `bun run validate` проверит, что все id из контента есть в `assets.json`.
5. Закоммить `assets/` и `manifest.csv`. Исходники — нет.

## Кеширование

Имя файла содержит хеш содержимого, поэтому статику отдаём с `Cache-Control: public, max-age=31536000, immutable`.
Исключение: `ui/paper_light.webp`, `ui/paper_dark.webp` — без хеша, они нужны CSS по постоянному имени.
Новая версия картинки = новое имя, кеш инвалидируется сам.
