
//
// Сюда совать все функции для расчета чего либо. Чисто математика. Которая не лезет никуда в глобал и на страницу
//

function calcSalary(sn: number, sc: number, kn: number, kc: number, kr: number): number {
    // s = salary, k = skill, n = now, c = city, r = required
    // из за ошибок округления double 8.62 станет вдруг 8.61. Добавим дельту это избавит.
    kr = Math.floor(kr * 100 + 1e-10) / 100;
    var calc = sn > sc ? kn - kc * Math.log(1 + sn / sc) / Math.log(2) : Math.pow(sc / sn, 2) * kn - kc;
    return kr > (calc + kc) ? sc * (Math.pow(2, (kr - calc) / kc) - 1) : sc * Math.sqrt(kr / (kc + calc));
}

function calcEmployees(skill: number, factor: number, manager: number): number {
    return Math.pow(5, 1 + skill) * Math.pow(7, 1 - skill) * factor * Math.pow(manager, 2);
}

function calcSkill(employees: number, factor: number, manager: number): number {
    return -Math.log(employees / (35 * factor * Math.pow(manager, 2))) / Math.log(7 / 5);
}

function calcEquip(skill: number): number {
    return Math.pow(skill, 1.5);
}

function calcTechLevel(manager: number): number {
    return Math.pow(manager * 156.25, 1 / 3);
}

function calcTopTech(tech: number): number {
    return Math.pow(tech, 3) / 156.25;
}

function calcAllEmployees(factor: number, manager: number): number {
    return 25 * factor * manager * (manager + 3);
}

function calcTop1(empl: number, qual: number, factor: number) {
    return Math.pow(5, 1 / 2 * (-1 - qual)) * Math.pow(7, 1 / 2 * (-1 + qual)) * Math.sqrt(empl / factor);
}

function calcTop3(empl: number, factor: number): number {
    return (-15 * factor + Math.sqrt(225 * factor * factor + 4 * factor * empl)) / (10 * factor);
}

function calcEfficiency(employees: number, allEmployees: number, manager: number, factor1: number, factor3: number, qualification: number, techLevel: number): string {

    let effi: number[] = [];
    effi[0] = 100;
    effi[1] = manager / calcTop1(employees, qualification, factor1) * calcAllEmployees(factor3, manager) / allEmployees * 100;
    effi[2] = manager / calcTop1(employees, qualification, factor1) * 6 / 5 * 100;
    effi[3] = calcAllEmployees(factor3, manager) / allEmployees * 6 / 5 * 100;
    effi[4] = manager / calcTopTech(techLevel) * calcAllEmployees(factor3, manager) / allEmployees * 100;
    effi[5] = manager / calcTopTech(techLevel) * 6 / 5 * 100;

    logDebug("calcEfficiency: ", effi);
    return (Math.round(Math.min.apply(null, effi) * 10) / 10).toFixed(2) + "%";
}

function calcOverflowTop1(allEmployees: number, factor3: number, manager: number): number {
    logDebug("calcOverflowTop1: ", calcAllEmployees(factor3, manager) / allEmployees);
    return Math.max(Math.min(6 / 5, calcAllEmployees(factor3, manager) / allEmployees), 5 / 6);
}

function calcOverflowTop3(employees: number, qualification: number, techLevel: number, factor1: number, manager: number) {
    logDebug("calcOverflowTop3: ", manager / calcTopTech(techLevel), manager / calcTop1(employees, qualification, factor1));
    return Math.max(Math.min(6 / 5, manager / calcTopTech(techLevel), manager / calcTop1(employees, qualification, factor1)), 5 / 6);
}
