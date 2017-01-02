﻿[Работа с опциями]
Когда идет отрисовка опций то всегда используется след схема:
- формируется контейнер <td unit-id=${subid} policy-group=${policy.group} policy-key=${policyKey} id=${uniqueId} class=XioContainer>
  где uniqueId = "subid-policyKey"

- далее в него забиваем селекты в любом виде. главное чтобы они удовлетворяли правилу.
  <select option-number=${optionNumber} class=XioChoice>

- заполняем селект опциями по правилу
  <option value=${ind}>${optionValue}</option> то есть value есть индекс опции в policy.order[]-массив для отображения

Следовательно когда нам нужно считать текущий набор настроек для юнита и политики то
- targetTd = $("td.XioContainer").filter(`[unit-id=${subid}]`).filter(`[policy-key=${key}]`);
  selects = targetTd.find("select.XioChoice");