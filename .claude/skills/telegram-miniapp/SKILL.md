---
name: telegram-miniapp
description: Telegram WebApp API в apps/miniapp и apps/bot: тема, viewport, BackButton, CloudStorage, initData, запуск из бота, отладка через ngrok. Применять при любой работе с Telegram.
---

# Telegram Mini App

Используем глобальный `window.Telegram.WebApp` через `<script src="https://telegram.org/js/telegram-web-app.js">` в `index.html`. SDK-пакет не подключаем. Вся работа с ним изолирована в `apps/miniapp/src/telegram.ts`; остальной код получает плоский объект-адаптер и не знает, Telegram это или браузер.

## Адаптер (`telegram.ts`)

- `isTelegram` — есть ли `WebApp.initData` (пустая строка в обычном браузере).
- `ready()` + `expand()` при старте, `setHeaderColor`, `setBackgroundColor` под тему.
- Тема: CSS-переменные `--tg-theme-*` Telegram ставит сам; в браузере задаём дефолты в `base.css`. Слушаем `themeChanged`.
- Viewport: высота через `var(--tg-viewport-stable-height, 100vh)`. Слушаем `viewportChanged`. Не используем `100vh` напрямую: на iOS прыгает.
- BackButton: показываем везде, кроме первого экрана; `onClick` → действие «назад» в приложении (в MVP — выход на титул с подтверждением, а не отмена хода: движок ходов назад не делает).
- MainButton в MVP не используем: выборы — свои кнопки в нижней трети.
- `HapticFeedback.impactOccurred('light')` на выбор, если доступно.

## CloudStorage

Лимиты: значение ≤ 4096 символов, ≤ 1024 ключа, ключи `A-Za-z0-9_-` длиной 1–128. Все операции callback-style, оборачиваем в Promise.
Кодек (компактная сериализация, разбиение на чанки, версия схемы) живёт в `packages/engine/src/storage.ts` и тестируется без браузера. Транспорт — `apps/miniapp/src/storage.ts` (чистый, тестируется на фейках в `apps/miniapp/test/`), подключение к реальным хранилищам — `saves.ts`.

Правила транспорта:
- `persist*` не возвращают промис и никогда не бросают. localStorage пишется всегда и первым, CloudStorage — следом в очереди: на один префикс одна запись в полёте, остальные схлопываются до последней версии.
- Ошибка облака глотается, очередь по этому префиксу останавливается до следующего `persist`. Локальная копия остаётся источником правды на этом устройстве.
- Загрузка: сначала облако, при ошибке или отсутствии — локальная копия. Если есть и то и другое, побеждает облако (оно могло прийти с другого устройства).
- После каждого выбора сохраняются оба документа (профиль меняется и посреди ночи), после отчёта run удаляется. Ключи `profile_N` / `run_N`.

Вне Telegram `isTelegram === false`: адаптер не трогает BackButton/haptic/цвета, иначе `telegram-web-app.js` засоряет консоль предупреждениями «not supported in version 6.0».

## initData

В MVP сервера нет, initData не проверяем. Когда появится сервер: проверять HMAC-SHA256 подпись `initData` секретом `sha256(bot_token)` с ключом `WebAppData`, отбрасывать `auth_date` старше 24 часов. Никогда не доверять `initDataUnsafe` на сервере.

## Бот

grammY на вебхуке, polling не используем. `/start` отвечает кнопкой `web_app: { url: WEBAPP_URL }`. Вебхук ставится скриптом `bun run bot:webhook` с `secret_token`, сервер проверяет заголовок `X-Telegram-Bot-Api-Secret-Token`.
Для кнопки меню: BotFather → Bot Settings → Menu Button → URL Mini App.

## Локальная отладка

1. `bun dev` → Vite на `http://localhost:5173` (если порт занят, Vite возьмёт следующий — смотри вывод).
2. `ngrok http 5173` → HTTPS-URL. Telegram открывает Mini App только по HTTPS. В `vite.config.ts` уже стоит `allowedHosts: true`.
3. `WEBAPP_URL=<ngrok-url>` в `.env`, перезапустить бота, `/start`.
4. Для бота на вебхуке — второй туннель на `PORT` и `bun run bot:webhook`.
5. В desktop-клиенте Telegram: Settings → Advanced → Experimental → Enable webview inspecting, чтобы открыть DevTools.
6. Без Telegram: открой Vite-URL в браузере, сохранения пойдут в localStorage (`blv_*`). Смоук без рук — headless Chrome через CDP (`--remote-debugging-port`), кликать `.title__actions button`, `.choices .choice`, `.door`.
