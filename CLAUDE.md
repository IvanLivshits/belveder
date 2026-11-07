# Ломбард на последнем этаже — Telegram Mini App

Текстовая нуар-игра на сторилетах. Монорепо на Bun workspaces + TypeScript strict.
Детектив Ник поднимается по башне Белведер: ночь = 16 ходов, сцены выбираются по условиям на «качества».

## Команды

- `bun install` — зависимости.
- `bun dev` — Mini App локально (Vite). Контент собирается из YAML автоматически.
- `bun test` — сценарные прогоны с golden digest + тесты storage.
- `bun run validate` — сборка контента в `content/belvedere/build/world.json` и проверка (битые ссылки, тупики, симуляция).
- `bun run typecheck` — `tsc -b` по всем пакетам.
- `bun run assets` — `tools/assets/convert.py`: `tools/assets/sources/*.png` → `assets/*.webp` + `assets/assets.json`.
- `bun run bot` / `bun run bot:webhook` — бот grammY на вебхуке; секреты в `.env` (см. `.env.example`).

## Где что лежит

- `packages/content-schema` — zod-схемы мира, единственный источник типов контента.
- `packages/engine` — чистое ядро `(state, action, world) -> state`. Без I/O, DOM, Telegram, имён персонажей.
- `packages/validator` — сборка YAML → JSON и CLI проверок + симуляция.
- `packages/ui-kit` — Preact-компоненты без логики игры.
- `apps/miniapp` — тонкий адаптер: рендер, ввод, Telegram API, сохранение.
- `apps/bot` — `/start` с кнопкой открытия Mini App.
- `content/belvedere` — мир как данные (`world.yaml`, `storylets/*.yaml`, `report-fragments/*.yaml`, `notebook.yaml` — блокнот Ника с зацепками, `evidence.yaml` — папка улик, `endings.yaml` — концовки и рассказ «Дело Хейла», `rumors.yaml` — слухи дня).
- `assets/` — WebP по id из `assets.json`. В контенте только id, никаких путей.
- `docs/architecture.md` — архитектура, `docs/world-bible.md` — библия мира, `docs/backlog.md` — всё, что вне MVP, `docs/golden-changelog.md` — строка на каждое изменение golden-хеша.

## Правила (подробно в `.claude/skills/`)

Направление зависимостей: `apps → ui-kit → engine → content-schema`; `validator → engine + content-schema`. Обратно нельзя.
Перед любым изменением: `architecture-guardrails`, `reuse-first`, `mvp-scope`.
Меняешь движок — `engine-change`. Пишешь сцены — `storylet-authoring`, `content-validation`.
Картинки — `asset-pipeline`. Telegram — `telegram-miniapp`.

Код и идентификаторы на английском, тексты игры и документация на русском.
Коммиты маленькие и однострочные (до 50 символов, без трейлеров): `feat:`, `fix:`, `chore:`, `test:`, `docs:`. Изменил golden — добавь строку в `docs/golden-changelog.md` в том же коммите.
