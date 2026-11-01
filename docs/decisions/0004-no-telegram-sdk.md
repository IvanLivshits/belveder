# ADR 0004. Чистый `window.Telegram.WebApp` вместо SDK-пакета

**Статус:** принято, 2026-11-01.

**Решение.** Скрипт `telegram-web-app.js` в `index.html`, типы и обёртки в `apps/miniapp/src/telegram.ts`. Пакет `@telegram-apps/sdk` не подключаем.

**Почему.** В MVP нужны ready/expand, цвета, BackButton, CloudStorage, haptic — это пять вызовов. SDK добавил бы зависимость и слой абстракций ради того же. Всё, что трогает Telegram, и так изолировано в одном файле, так что заменить позже дёшево.
