# Golden changelog

Правило: каждое изменение хеша в `packages/*/test/golden/*.json` получает здесь одну строку в том же коммите. Коммит остаётся однострочным, объяснение живёт тут. Формат: `дата · коммит (тема, потому что хеш до коммита неизвестен) · golden · почему`. Новые строки сверху.

- 2026-11-02 · feat(content): rough player pass, morning notes · `night-ring-2024`, `night-first-5` · движок ставит run-флаг `returned_tonight = 1` при возврате воспоминания (нужен строке-итогу утра).
- 2026-11-02 · feat(content): rough player pass, morning notes · `night-dawn-11` · на четвёртом этаже лестница стала карточкой `stairs_top` («Ремонт. Владелец»), в логе другие id при том же маршруте.
- 2026-11-02 · feat(content): newcomer pass, conditional footer · `night-ring-2024`, `night-first-5` · игра открывается карточкой `office_morning` («Открыть», бесплатно): в логе на шаг больше, в run `seen.office_morning`, в профиле `met.dolly` после `lobby_rules`; в первой ночи слот «Вход» стал `entry_hint` после подсказки Долли.
- 2026-11-02 · feat(content): newcomer pass, conditional footer · `night-dawn-11` · в профиле появились `met.dolly` и `met.office_ring` (одноразовый `office_ring`), маршрут тот же.
- 2026-11-02 · 4cc61ba · `night-first-5` · новый: обучающий маршрут первой ночи, seed 5, залог кольца на `pledge_first_night`.
- 2026-11-02 · 4cc61ba · `night-dawn-11` · рассвет теперь играется второй ночью после кольца (первой ночью приоритет у `pledge_first_night`): профиль с `nights 1`, семь конвертов, конец на `pledge_dawn`.
- 2026-11-02 · 4cc61ba · `night-ring-2024` · первая ночь стала обучением: в лог добавился `lobby_rules` («Кивнуть»), залог идёт через `pledge_first_night` вместо `pledge_exit`.
- 2026-11-01 · 8d56205 · `night-ring-2024`, `night-dawn-11` · новые на контенте этажей 1–4; `night-limit-2024` и `night-pledge-2024` удалены вместе с заглушечным контентом.
- 2026-11-01 · e593264 · `mini-night-42` · `nightEndWhen` заменён на `rules.interrupts`: ночь мини-мира кончается залогом в хранилище, а не обрывом по правилу; в состоянии появились `pledged.*`.
- 2026-11-01 · 0fe0c30 · `night-limit-2024`, `night-pledge-2024` · локация `exit` переименована в `pledge`, появились пары воспоминаний и экран залога.
- 2026-11-01 · e70008b · `mini-night-42` · в `GameState` добавлено поле `pendingChoice` (экран последствия), снимок сменил форму.
- 2026-11-01 · 750f166 · `night-limit-2024`, `night-pledge-2024` · первые golden на реальном мире.
- 2026-11-01 · a0fb878 · `mini-night-42` · первый golden движка.
