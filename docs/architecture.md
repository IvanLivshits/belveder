# Архитектура

Монорепо на Bun workspaces. Игра = чистый движок, который исполняет мир-как-данные; всё остальное — тонкие адаптеры.

## Слои

```
apps/miniapp ─┐
apps/bot     ─┼─▶ packages/ui-kit ─▶ packages/engine ─▶ packages/content-schema
packages/validator ───────────────▶ engine + content-schema
content/belvedere  (данные: YAML → build/world.json, загружается как JSON)
assets/            (WebP + assets.json, картинки только по id)
```

Стрелка = «может импортировать». Обратно нельзя. Подробно: `.claude/skills/architecture-guardrails`.

## Движок (`packages/engine`)

Чистые функции над неизменяемым состоянием. Ни I/O, ни DOM, ни Telegram, ни знания о мире.

```
GameState { seed, rng, phase: scene|report, location, storyletId, run{}, profile{}, log[], report{} }

newNight(profile, world, seed)  → state   # run сброшен, выбран первый сторилет в rules.start
choose(state, world, index)     → state   # эффекты выбора → rules.onChoice (если не free)
                                          # → nightEndWhen или endNight ? отчёт : выбор сторилета в goto
currentScene(state, world)      → { storylet, choices[{index, available}] }
currentReport(state, world)     → [{ slot, label, fragment }]
```

- **Качества** — целые числа в двух мешках: `run` (сбрасывается каждую ночь) и `profile` (живёт между ночами). Флаги и множества — тоже качества 0/1 с составным id (`visited.floor2.tenant`), объявленные через namespace `visited.*`. Значение, равное default, не хранится.
- **Выбор сторилета**: все сторилеты локации с истинными `when`, берутся с максимальным `priority`, ничья решается seed-RNG (mulberry32, состояние в `state.rng`).
- **Глобальные правила** из `world.rules`: `onChoice` (эффекты на каждый выбор, например `turn += 1`), `nightEndWhen` (условие конца ночи), `onNightEnd` (эффекты на профиль). Движок исполняет их, не зная смысла.
- **Отчёт**: для каждого слота берётся фрагмент с истинными `when` и максимальным приоритетом; ничья через RNG. Считается до сброса run, поэтому может ссылаться на run-качества.
- **Детерминизм**: одинаковый seed + действия → байт-в-байт одинаковое состояние. Проверяется golden digest = sha256 от канонического JSON.

## Контент (`content/belvedere`)

`world.yaml` (качества, локации, правила, слоты отчёта) + `storylets/*.yaml` + `report-fragments/*.yaml`. Условия и эффекты — строки `quality op int`, валидируются regex-ом в zod и парсятся движком. Формат: `.claude/skills/storylet-authoring`.

Сборка `bun run content:build` → `build/world.json` (не коммитится). Валидируется дважды: validator при сборке (CI) и zod при загрузке в приложении.

## Сохранение

Кодек в `engine/storage.ts` (чистый, тестируется без браузера): компактный текст `b1;q.<id>=<n>;…`, только ненулевые качества, разбиение на чанки ≤ 4000 символов с заголовком `<version>:<count>|`. Транспорт в `apps/miniapp/src/storage.ts`: Telegram CloudStorage (ключи `profile_N`, `run_N`), в браузере localStorage.

После каждого выбора сохраняются и run (seed, позиция RNG, локация, лог), и profile. После отчёта run удаляется. На титуле при наличии run — «Продолжить ночь».

## Mini App (`apps/miniapp`)

`telegram.ts` — единственное место с `window.Telegram.WebApp`. `content.ts` — загрузка и zod-валидация `world.json` и `assets.json`. `App.tsx` — экраны title / night (scene или report), вызовы engine, сохранение. Рендер — компоненты `ui-kit`. Фон 9:16 через `Backdrop` (портрет персонажа — тоже полная сцена, он заменяет фон), нижняя треть — `SceneCard` с `ChoiceList` или `DoorPicker`.

## Бот (`apps/bot`)

grammY на вебхуке через `Bun.serve`. `/start` → кнопка `web_app`. `set-webhook.ts` ставит вебхук с секретом.

## Проверки

- `bun test` — сценарные прогоны с golden digest (engine на мини-мире, validator на реальном мире), тесты кодека и правил.
- `bun run validate` — правила контента + симуляция случайных ночей (тупики = ошибка).
- `bun run typecheck` — `tsc -b` по project references.

## Что архитектура допускает, но MVP не делает

Другой рендер того же мира (сайт, устройство): нужен только новый адаптер уровня `apps/*`. Чужие миры (UGC): `world.json` самодостаточен, схема в `content-schema`. См. `docs/backlog.md`.
