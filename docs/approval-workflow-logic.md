# Процесс создания и одобрения заявки на закупку (Purchase Requisition)

## Статусы заявки (Workflow Stages)

```
Submitted → Pending Line Manager → Pending Purchasing Review → Pending Budget Owner → Pending Final Approval → Ready for Purchase → PO Created
                                                                                    ↘ (auto-approve) → Ready for Purchase
Любой этап может → Rejected
```

---

## 1. Создание заявки (Submitted)

**Кто:** Любой сотрудник с доступом к модулю Procurement.

**Поля заявки:**
- Название запроса, Отдел, Описание, Обоснование
- Оценочная стоимость (AED), Бюджетная линия, Бюджетирована ли
- Имя поставщика, Дата необходимости, Дата начала проекта
- Budget Owner (выбирается из справочника по cost center)
- Вложения (JPG, PNG, PDF до 10 МБ)

**Что происходит:** После создания заявка получает статус `Submitted`, система автоматически запускает workflow и создаёт первый шаг одобрения — `Pending Line Manager`.

---

## 2. Pending Line Manager — Прямой руководитель

**Кто одобряет:** Прямой руководитель создателя заявки.

**Как определяется:**
1. По Employee Directory — ищется запись сотрудника-создателя (по `employee_code` или `email`)
2. Из записи берётся `direct_manager_code`
3. По коду менеджера ищется пользователь в системе
4. **Fallback:** если менеджер не найден → назначается первый admin/superadmin

**Действия:** Approve (одобрить) или Reject (отклонить с обязательным комментарием).

**При одобрении →** статус меняется на `Pending Purchasing Review`.

---

## 3. Pending Purchasing Review — Отдел закупок

**Кто одобряет:** Любой сотрудник из Procurement Department (cost center `118001003`).

**Особенность:** Назначение идёт не на конкретного сотрудника, а на группу (`assignedToGroup = "118001003"`). Любой участник этой группы может взять шаг на себя.

**Действия на этом этапе:**
- Добавление котировок (Quotations) — название поставщика, сумма AED, файл (PDF/JPG/PNG)
- Рекомендация котировок (Star)
- Удаление котировок
- Approve / Reject

**При одобрении →** статус меняется на `Pending Budget Owner`.

---

## 4. Pending Budget Owner — Владелец бюджета

**Кто одобряет:** Budget Owner, указанный при создании заявки.

**Как определяется:**
1. По `budgetOwnerId` (employee code) → ищется пользователь в системе
2. Если не найден по коду → ищется по `budgetOwnerName`
3. **Fallback:** первый admin/superadmin

**Обязательные действия перед одобрением:**
- Budget Owner **обязан выбрать одну котировку** (`selectedQuotationId`). Без этого одобрение заблокировано.

**При одобрении** — маршрутизация по Approval Matrix (сумма выбранной котировки):

| Сумма (AED) | Результат |
|---|---|
| Попадает в правило с `isAutoApprove = true` | → Сразу `Ready for Purchase` (без Final Approval) |
| Попадает в правило с `approverEmployeeCode` | → `Pending Final Approval`, назначается указанный сотрудник |
| Нет подходящего правила | → `Pending Final Approval`, назначается первый admin |

---

## 5. Pending Final Approval — Финальное одобрение

**Кто одобряет:** Сотрудник, определённый через Approval Matrix по сумме выбранной котировки.

**Approval Matrix** (таблица `approval_matrix`):
- `from_amount` / `to_amount` — диапазон суммы
- `approver_employee_code` — код сотрудника-одобрителя
- `is_auto_approve` — автоматическое одобрение (без этого шага)

**При одобрении →** статус `Ready for Purchase`.

---

## 6. Ready for Purchase — Готово к закупке

**Статус:** Все одобрения получены. Ожидается создание Purchase Order.

**Кто действует:** Сотрудники Procurement Department (cost center `118001003`).

**Действие:** Нажатие "Mark PO Created" → статус `PO Created`.

---

## 7. PO Created — Заказ на закупку создан

**Финальный статус.** Процесс завершён.

---

## Отклонение (Rejected)

**На любом этапе** одобритель может отклонить заявку (обязательно с комментарием).

**Что происходит:**
- Текущий шаг помечается `rejected`
- Все оставшиеся pending-шаги автоматически отклоняются с пометкой "Auto-rejected"
- Статус заявки → `Rejected`
- Система добавляет автоматический комментарий от "Workflow System"

---

## Участники процесса (сводка)

| Роль | Этап | Как определяется |
|---|---|---|
| **Создатель заявки** | Создание | Любой сотрудник с доступом к Procurement |
| **Line Manager** | Pending Line Manager | Employee Directory → `direct_manager_code` |
| **Procurement Dept** | Pending Purchasing Review | Группа по cost center `118001003` |
| **Budget Owner** | Pending Budget Owner | Указан при создании заявки (из справочника) |
| **Final Approver** | Pending Final Approval | Approval Matrix по сумме котировки |
| **Procurement Dept** | Ready for Purchase | Создание PO (cost center `118001003`) |
| **Admin/Superadmin** | Любой этап (fallback) | При невозможности найти назначенного |

---

## Видимость заявок

- **Создатель** — видит свои заявки
- **Текущий одобритель** — видит заявки с pending-шагом для него
- **Прошлый одобритель** — видит заявки, которые он ранее одобрял/отклонял
- **Procurement Dept** — дополнительно видит все заявки в статусе `Ready for Purchase`
- **Admin/Superadmin** — видит все заявки
