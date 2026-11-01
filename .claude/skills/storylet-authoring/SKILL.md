---
name: storylet-authoring
description: Формат сторилета и фрагмента отчёта, условия, эффекты, ссылки на картинки по id, как добавить карточку и прогнать validator. Применять при написании или правке content/.
---

# Как писать сторилеты

Контент лежит в `content/belvedere/`. Источник правды по сюжету — `docs/world-bible.md`. Не выдумывай факты мира, которых там нет.

## Файлы

- `world.yaml` — качества, локации, глобальные правила (`rules.onChoice`, `rules.nightEndWhen`, `rules.start`).
- `storylets/*.yaml` — список сторилетов. Один файл на локацию или тему.
- `report-fragments/*.yaml` — фрагменты отчёта по слотам.

Сборка: `bun run content:build` → `content/belvedere/build/world.json`. Проверка: `bun run validate`.

## Сторилет

```yaml
- id: lobby_dolly_first          # уникальный, snake_case
  location: lobby                # из world.yaml locations
  priority: 10                   # выше = важнее; при равенстве выбирает seed-RNG
  when:                          # все условия должны быть истинны (И)
    - visited.lobby == 0
    - dolly_trust < 3
  layout: scene                  # scene (по умолчанию) | doors
  background: lobby              # id из assets/assets.json
  portrait: dolly_suspicion      # необязательно; портреты — полные сцены 9:16, портрет заменяет фон на экране
  title: Вестибюль
  text: |
    Долли смотрит на вас так, будто уже знает, зачем вы пришли.
  choices:
    - text: Показать квитанцию
      when: [has.pawn_ticket == 1]   # необязательно; невыполненный выбор скрыт
      effects:
        - dolly_trust += 1
        - suspicion -= 1
      goto: floor_01                   # локация; без goto остаёмся в текущей
    - text: Промолчать и пройти к лестнице
      effects: [suspicion += 1]
      goto: floor_01
    - text: Закончить ночь
      endNight: true                   # вызывает сборку отчёта и сброс run
```

Условие: `<quality> <op> <int>`, op ∈ `== != < <= > >=`. Эффект: `<quality> <op> <int>`, op ∈ `+= -= =`.
Это не выражения языка: строка проверяется регулярным выражением в `content-schema/expressions.ts` при сборке (`bun run content:build` падает с путём до поля) и разбирается тем же regex-ом в движке. Никакого eval нет и не будет: миры могут писать чужие люди.
Качество должно быть объявлено в `world.yaml` (точно или через namespace `visited.*`). Значения только целые.

Экран трёх дверей — сторилет с `layout: doors` и ровно тремя choices, каждый с `goto`. Порядок: дверь жильца, служебная дверь, лестница.

`rules.onChoice` из `world.yaml` применяется после эффектов каждого выбора (например `turn += 1`). Если выбор не должен тратить ход, укажи `free: true`.

## Фрагмент отчёта

```yaml
- id: client_vivian_default
  slot: client          # id слота из world.yaml report.slots
  priority: 0
  when: [nights >= 1]
  text: Клиентка не назвала имени. Это уже кое-что.
```

Слоты объявляются в `world.yaml`: `report.slots: [{ id: client, label: Клиентка }, …]`. Отчёт считается до сброса run, поэтому условия могут смотреть на run-качества (`clues`, `seen.*`).

Для каждого слота в любой ситуации должен подходить хотя бы один фрагмент: делай фрагмент с `priority: -100` без условий.

## Добавить карточку

1. Открой файл локации в `storylets/` или создай новый.
2. Убедись, что качества есть в `world.yaml`, картинки — в `assets/assets.json`.
3. `bun run validate`. Исправь ошибки: битые id, тупики, недостижимость.
4. `bun test`. Если golden изменился — объясни в коммите (см. `engine-change`).
