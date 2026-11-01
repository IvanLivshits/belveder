---
name: content-validation
description: Что проверяет validator, как добавить новое правило и как читать отчёт симуляции. Применять при ошибках `bun run validate` и при изменении схемы контента.
---

# Валидация контента

`bun run validate` = сборка YAML → `build/world.json` (zod-парсинг, падает на ошибке схемы) → правила → симуляция.
Падает с кодом 1 при любой ошибке. Предупреждения не роняют.

## Правила (`packages/validator/src/rules/`)

| Правило | Что ловит | Уровень |
|---|---|---|
| `qualities` | условие или эффект на необъявленное качество; `rules.onChoice` / `nightEndWhen` ссылаются на необъявленное; `rules.start` указывает на несуществующую локацию | error |
| `references` | `goto` на несуществующую локацию; `background`/`portrait` нет в `assets.json` | error |
| `dead-ends` | локация без сторилетов (error); сторилет, у которого все choices условные (warning) | error / warning |
| `reachability` | локация, недостижимая из `rules.start` по графу `goto` (условия игнорируются) | warning |
| `report-slots` | слот отчёта без фрагментов или без фолбэка (фрагмента без условий) | error |
| `doors` | `layout: doors` не с тремя choices или дверь без `goto` | error |

Тупики по состоянию (нет подходящего сторилета, нет доступных выборов) ловит симуляция, а не статическое правило: условия вида `seen.x == 0` / `seen.x == 1` дополняют друг друга, и статически это не видно.

Каждое правило — функция `(world, assets) => Issue[]`, `Issue = { level, where, message }`.

## Добавить правило

1. Файл `rules/<name>.ts`, экспорт `check(world, assets): Issue[]`.
2. Добавь в список в `rules/index.ts`.
3. Тест в `packages/validator/test/<name>.test.ts` на мини-мире из трёх сторилетов: один проходит, один ломает.
4. Строка в таблицу выше.

## Симуляция

`simulate.ts` прогоняет N ночей (по умолчанию 200) со случайным выбором через engine; профиль тянется через 5 ночей подряд, потом сбрасывается. Печатает:

```
simulated 200 nights
  ended by rule: 14, by endNight choice: 186, stuck: 0, errors: 0
  turns per night: min 1, avg 4.8, max 16
  storylets never shown (2): service_04_archive, ...
  choices never taken (9): floor_04_doors#1, ...
```

Как читать:
- `stuck > 0` или `errors > 0` — состояние без доступных выборов или исключение движка. CLI выходит с кодом 1.
- `never shown` / `never taken` — сторилет или выбор недостижим для случайного игрока. Либо условия слишком строгие, либо путь длинный. Решай по смыслу: случайный игрок часто уходит из башни рано.
- `turns per night` — случайный игрок выбирает «уйти» так же охотно, как остальное, поэтому среднее ниже, чем у живого игрока. Смотри на `max` и на `ended by rule`.

Запуск с другими параметрами: `bun run packages/validator/src/cli.ts <world.json> <assets.json> --nights 1000 --seed 7`.
