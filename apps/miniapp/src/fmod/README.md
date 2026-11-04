# Вендорный FMOD

Файлы отсюда не редактируются, это поставка FMOD Studio API for HTML5 от Firelight Technologies.

- `fmodstudio.js`, `fmodstudio.wasm` — рантайм, версия 2.03.12 (константа `VERSION` в `fmod.d.ts`).
- `fmod.d.ts`, `fmodstudio.d.ts` — типы к нему.

Как обновить: взять из одного и того же пакета FMOD все четыре файла и заменить вместе. Банки в `../banks/` собираются в FMOD Studio под платформу HTML5, версии не новее рантайма.
Подключение и список событий — в `../audio.ts` и `docs/decisions/0005-fmod-adapter.md`.
