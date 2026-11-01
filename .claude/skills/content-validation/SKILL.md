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
| `dead-ends` | локация, для которой ни один сторилет не может подойти; сторилет без choices, не являющийся концом ночи | error |
| `reachability` | сторилет, недостижимый ни при каком наборе качеств (грубая оценка по графу `goto`) | warning |
| `report-slots` | слот отчёта без фрагмента-фолбэка (без условий) | error |
| `doors` | `layout: doors` не с тремя choices или без `goto` | error |

Каждое правило — функция `(world, assets) => Issue[]`, `Issue = { level, where, message }`.

## Добавить правило

1. Файл `rules/<name>.ts`, экспорт `check(world, assets): Issue[]`.
2. Добавь в список в `rules/index.ts`.
3. Тест в `packages/validator/test/<name>.test.ts` на мини-мире из трёх сторилетов: один проходит, один ломает.
4. Строка в таблицу выше.

## Симуляция

`cli.ts` прогоняет N ночей (по умолчанию 200) на случайных seed-ах со случайным выбором через engine и печатает:

```
simulated 200 nights, seeds 1..200
  nights ended by rule: 183, by endNight choice: 17, stuck: 0
  storylets never shown (12): office_cigarettes_empty, ...
  choices never taken (3): lobby_dolly_first#2, ...
  turns per night: min 9, avg 15.2, max 16
```

Как читать:
- `stuck > 0` — есть состояние без доступных выборов. Это error.
- `never shown` — сторилет либо недостижим, либо условия слишком строгие. Предупреждение; решай по смыслу.
- `turns per night` далёк от 16 — проверь, не слишком ли рано срабатывает `nightEndWhen` или не слишком ли много `free` выборов.

Запуск с другими параметрами: `bun run packages/validator/src/cli.ts <world.json> <assets.json> --nights 1000 --seed 7`.
