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
GameState { seed, rng, phase: scene|outcome|report, location, storyletId, pendingChoice, run{}, profile{}, log[], report{} }

newNight(profile, world, seed)  → state   # run сброшен, выбран первый сторилет в rules.start
choose(state, world, index)     → state   # эффекты выбора → rules.onChoice (если не free)
                                          # → есть outcome ? фаза outcome : resolve
continueOutcome(state, world)   → state   # resolve: endNight ? отчёт : первый interrupt.goto ?? goto выбора
pledge(state, world, pairId)    → state   # fake = 0, pledged.<id> = 1; returnWhen ? real = 1, returned.<id> = 1, memories_returned += 1; отчёт
currentScene(state, world)      → { storylet, text, choices[{index, text, available}], memories[{index, label}] }
currentOutcome(state, world)    → { storylet, text }
currentReport(state, world)     → [{ slot, label, fragment, text }]
currentNotes(state, world)      → string[]   # report.notes с истинными when
pledgeOptions(state, world)     → [{ id, label, canReturn }]   # canReturn: returnWhen выполнено прямо сейчас
choiceCost(state, world, choice)→ number     # прирост «часов» (качество из rules.onChoice) от эффектов + onChoice; free → 0
changedQualities(prev, next)    → string[]   # что изменилось между состояниями; приложение показывает hint при первом изменении
notebookView(state, world)      → { pages[], locked, life{lines[{pair, status: fake|empty|real, text}]} }
```

Тексты проходят через `renderText`: `{quality_id}` заменяется значением из состояния.

- **Качества** — целые числа в двух мешках: `run` (сбрасывается каждую ночь) и `profile` (живёт между ночами). Флаги и множества — тоже качества 0/1 с составным id (`visited.floor2.tenant`), объявленные через namespace `visited.*`. Значение, равное default, не хранится.
- **Выбор сторилета**: все сторилеты локации с истинными `when`, берутся с максимальным `priority`, ничья решается seed-RNG (mulberry32, состояние в `state.rng`).
- **Глобальные правила** из `world.rules`: `onChoice` (эффекты на каждый выбор, например `turn += 1`), `interrupts` (список `{when, goto}`, первый подходящий после каждого выбора переносит игрока), `onNightEnd` (эффекты на профиль). Ночь заканчивается только `endNight`-выбором или залогом воспоминания, поэтому рассвет и поимка — перехваты в локацию залога. Движок исполняет всё это, не зная смысла.
- **Воспоминания**: `world.memories` — список пар `{id, fake, real, returnWhen}`. Флаги для движка непрозрачные id качеств. При залоге пары движок пишет run-флаги `pledged.<id>`, `returned.<id>` и профильный `memories_returned` (константы `RESERVED_QUALITIES`), чтобы отчёт знал, что случилось этой ночью. Сторилет `layout: pledge` показывает ложные воспоминания со значением 1; залог ночи целиком — обычный выбор с эффектом из контента.
- **Отчёт**: для каждого слота берётся фрагмент с истинными `when` и максимальным приоритетом; ничья через RNG. Считается до сброса run, поэтому может ссылаться на run-качества.
- **Детерминизм**: одинаковый seed + действия → байт-в-байт одинаковое состояние. Проверяется golden digest = sha256 от канонического JSON.

## Контент (`content/belvedere`)

`world.yaml` (качества с необязательным `hint`, локации, правила, слоты и `notes` отчёта) + `storylets/*.yaml` + `report-fragments/*.yaml` + `notebook.yaml` (страницы-справочник с `when` только по profile-качествам и шаблоны страницы «Что я о себе знаю»). Первая ночь (`nights == 0`) — обучение: правила объясняют персонажи в карточках `storylets/00-first-night.yaml`. Условия и эффекты — строки `quality op int`, валидируются regex-ом в zod и парсятся движком. Формат: `.claude/skills/storylet-authoring`.

Сборка `bun run content:build` → `build/world.json` (не коммитится). Валидируется дважды: validator при сборке (CI) и zod при загрузке в приложении.

## Сохранение

Кодек в `engine/storage.ts` (чистый, тестируется без браузера): компактный текст `b1;q.<id>=<n>;…`, только ненулевые качества, разбиение на чанки ≤ 4000 символов с заголовком `<version>:<count>|`.

Транспорт в `apps/miniapp/src/storage.ts`: два хранилища, localStorage всегда и Telegram CloudStorage внутри Telegram (ключи `profile_N`, `run_N`, `ui_N`). Документ `ui` — что интерфейс уже показал: подсказки качеств (`hintsShown`) и прочитанные страницы блокнота (`pagesRead`); это не качества мира, движок о них не знает. Его множества только растут, поэтому две копии не ранжируются по `rev`, а объединяются (G-Set, `rev = max + 1`): так чтения с телефона и десктопа не теряют друг друга. Документ обёрнут в конверт `rev=<n>;at=<ms>|…`, где `rev` монотонно растёт при каждой записи. Запись fire-and-forget: локально сразу, в облако через очередь с одной записью в полёте и схлопыванием до последней версии. Ошибки облака глотаются, интерфейс их не ждёт. Чтение берёт копию с бóльшим `rev` (при равенстве облачную) и досинхронизирует отставшую сторону, если та читалась. Удаление run — tombstone с пустым телом.

После каждого выбора сохраняются и run (seed, позиция RNG, локация, лог), и profile. После отчёта run удаляется. На титуле при наличии run — «Продолжить ночь».

## Mini App (`apps/miniapp`)

`telegram.ts` — единственное место с `window.Telegram.WebApp`. `content.ts` — загрузка и zod-валидация `world.json` и `assets.json`. `App.tsx` — экраны title / night (scene или report), вызовы engine, сохранение. Рендер — компоненты `ui-kit`. Фон 9:16 через `Backdrop`: портрет-сцена (h > w в `assets.json`) заменяет фон, квадратная улика ложится вставкой-фотокарточкой поверх фона. Нижняя треть — `SceneCard` с `ChoiceList`, `DoorPicker` или `PledgePicker`.

## Бот (`apps/bot`)

grammY на вебхуке через `Bun.serve`. `/start` → кнопка `web_app`. `set-webhook.ts` ставит вебхук с секретом.

## Проверки

- `bun test` — сценарные прогоны с golden digest (engine на мини-мире, validator на реальном мире), тесты кодека и правил. Каждое изменение хеша — строка в `docs/golden-changelog.md`.
- `bun run validate` — правила контента + симуляция случайных ночей (тупики = ошибка).
- `bun run typecheck` — `tsc -b` по project references.

## Что архитектура допускает, но MVP не делает

Другой рендер того же мира (сайт, устройство): нужен только новый адаптер уровня `apps/*`. Чужие миры (UGC): `world.json` самодостаточен, схема в `content-schema`. См. `docs/backlog.md`.
