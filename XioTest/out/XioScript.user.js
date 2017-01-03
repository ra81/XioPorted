//
// Сюда совать все функции для расчета чего либо. Чисто математика. Которая не лезет никуда в глобал и на страницу
//
function calcSalary(sn, sc, kn, kc, kr) {
    // s = salary, k = skill, n = now, c = city, r = required
    // из за ошибок округления double 8.62 станет вдруг 8.61. Добавим дельту это избавит.
    kr = Math.floor(kr * 100 + 1e-10) / 100;
    var calc = sn > sc ? kn - kc * Math.log(1 + sn / sc) / Math.log(2) : Math.pow(sc / sn, 2) * kn - kc;
    return kr > (calc + kc) ? sc * (Math.pow(2, (kr - calc) / kc) - 1) : sc * Math.sqrt(kr / (kc + calc));
}
function calcEmployees(skill, factor, manager) {
    return Math.pow(5, 1 + skill) * Math.pow(7, 1 - skill) * factor * Math.pow(manager, 2);
}
function calcSkill(employees, factor, manager) {
    return -Math.log(employees / (35 * factor * Math.pow(manager, 2))) / Math.log(7 / 5);
}
function calcEquip(skill) {
    return Math.pow(skill, 1.5);
}
function calcTechLevel(manager) {
    return Math.pow(manager * 156.25, 1 / 3);
}
function calcTopTech(tech) {
    return Math.pow(tech, 3) / 156.25;
}
function calcAllEmployees(factor, manager) {
    return 25 * factor * manager * (manager + 3);
}
function calcTop1(empl, qual, factor) {
    return Math.pow(5, 1 / 2 * (-1 - qual)) * Math.pow(7, 1 / 2 * (-1 + qual)) * Math.sqrt(empl / factor);
}
function calcTop3(empl, factor) {
    return (-15 * factor + Math.sqrt(225 * factor * factor + 4 * factor * empl)) / (10 * factor);
}
function calcEfficiency(employees, allEmployees, manager, factor1, factor3, qualification, techLevel) {
    var effi = [];
    effi[0] = 100;
    effi[1] = manager / calcTop1(employees, qualification, factor1) * calcAllEmployees(factor3, manager) / allEmployees * 100;
    effi[2] = manager / calcTop1(employees, qualification, factor1) * 6 / 5 * 100;
    effi[3] = calcAllEmployees(factor3, manager) / allEmployees * 6 / 5 * 100;
    effi[4] = manager / calcTopTech(techLevel) * calcAllEmployees(factor3, manager) / allEmployees * 100;
    effi[5] = manager / calcTopTech(techLevel) * 6 / 5 * 100;
    logDebug("calcEfficiency: ", effi);
    return (Math.round(Math.min.apply(null, effi) * 10) / 10).toFixed(2) + "%";
}
function calcOverflowTop1(allEmployees, factor3, manager) {
    logDebug("calcOverflowTop1: ", calcAllEmployees(factor3, manager) / allEmployees);
    return Math.max(Math.min(6 / 5, calcAllEmployees(factor3, manager) / allEmployees), 5 / 6);
}
function calcOverflowTop3(employees, qualification, techLevel, factor1, manager) {
    logDebug("calcOverflowTop3: ", manager / calcTopTech(techLevel), manager / calcTop1(employees, qualification, factor1));
    return Math.max(Math.min(6 / 5, manager / calcTopTech(techLevel), manager / calcTop1(employees, qualification, factor1)), 5 / 6);
}
// ==UserScript==
// @name           XioScript
// @namespace      https://github.com/XiozZe/XioScript
// @description    XioScript with XioMaintenance
// @version        12.1.1
// @author		   XiozZe. Ported to TypeScript by RA81
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// @include        http*://*virtonomic*.*/*/*
// @exclude        http*://virtonomics.wikia.com*
// ==/UserScript==
// включены опции стриктНулл.
// запрет неявных Эни, ретурнов, this
var version = "12.0.84";
// проверяет есть ли ключи в словаре
function dictIsEmpty(dict) {
    return Object.keys(dict).length === 0;
}
// словарь в виде одной строки через ,
function dict2String(dict) {
    if (dictIsEmpty(dict))
        return "";
    var newItems = [];
    for (var key in dict)
        newItems.push(key + ":" + dict[key].toString());
    return newItems.join(", ");
}
// настройки одной политики для одного юнита
var PolicyOptions = (function () {
    function PolicyOptions(key, choices) {
        var _this = this;
        // конвертит в стандартную строку для хранения вида pp0-1-0.  Метод this безопасен
        this.toString = function () {
            return _this.key + _this.choices.join("-");
        };
        this.key = key;
        this.choices = choices;
    }
    //  из строки хранения вида pp0-1-0 собирает объект.
    PolicyOptions.fromString = function (str) {
        if (str.length < 3)
            throw new Error("str:" + str + " \u0434\u043E\u043B\u0436\u043D\u0430 \u0438\u043C\u0435\u0442\u044C \u0434\u043B\u0438\u043D\u0443 \u043E\u0442 3 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432.");
        var key = str.substring(0, 2);
        var choices = str.substring(2).split("-").map(function (item, index, arr) { return numberfy(item); });
        return new PolicyOptions(key, choices);
    };
    return PolicyOptions;
}());
// берет контейнер селектов и собирает данные с аттрибутами data-name, data-choice и value
// сразу их нормализуя в save формат
function parseOptions(container, policyDict) {
    var td = $(container);
    var selects = td.find("select.XioChoice");
    if (selects.length === 0)
        throw new Error("Нельзя ничего спарсить если нет элементов.");
    var opts = [];
    var policyKey = td.attr("policy-key");
    var policy = policyDict[policyKey];
    for (var i = 0; i < selects.length; i++) {
        var el = selects.eq(i);
        var optionNumber = numberfy(el.attr("option-number")); // даже если аттрибута нет, нумерификация вернет 0 жопа.
        var optionValueIndex = parseInt(el.val()); // NaN будет если хуня в значении
        if (isNaN(optionValueIndex))
            throw new Error("Элементы в поле value должны содержать численное значение опции.");
        opts[optionNumber] = optionValueIndex;
    }
    opts = show2Save(policy, opts); // переводим из отображаемой в сохраняемую нотацию
    var newPolicyStr = policyKey + opts.join("-");
    return PolicyOptions.fromString(newPolicyStr);
}
// формирует ключик для хранилища. сделано так чтобы в случае чего разом везде поменять и все.
function makeStorageKey(realm, subid) {
    if (realm == null)
        throw new Error("realm должен быть задан");
    if (subid == null)
        throw new Error("subid должен быть задан");
    return "x" + realm + subid;
}
// загружаем из хранилища сразу все опции для данного юнита и реалма. выдаем стандартный словарь или {}
function loadOptions(realm, subid) {
    var parsedDict = {};
    var storageKey = makeStorageKey(realm, subid);
    var data = localStorage.getItem(storageKey);
    if (data == null)
        return parsedDict;
    var savedPolicyStrings = data.split(";");
    for (var n = 0; n < savedPolicyStrings.length; n++) {
        if (savedPolicyStrings[n].length < 3)
            throw new Error("\u041D\u0435\u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u0430\u044F \u0437\u0430\u043F\u0438\u0441\u044C \u043F\u043E\u043B\u0438\u0442\u0438\u043A\u0438 \u0432 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435: " + savedPolicyStrings[n]);
        var key = savedPolicyStrings[n].substring(0, 2);
        var choices = savedPolicyStrings[n].substring(2).split("-").map(function (item, index, arr) { return numberfy(item); });
        parsedDict[key] = new PolicyOptions(key, choices);
        logDebug("parsed policy:" + parsedDict[key].toString());
    }
    return parsedDict;
}
// записывает в хранилище все опции всех политик для указанного юнита в указанном реалме. 
// подразумеваем что опции уже в save формате
function storeOptions(realm, subid, options) {
    if (dictIsEmpty(options))
        throw new Error("Попытка записать в лок. хранилище пустой набор опций. Аларм.");
    var storageKey = makeStorageKey(realm, subid);
    var newItems = [];
    var keys = Object.keys(options).sort(); // сортирнем ключики
    for (var i = 0; i < keys.length; i++)
        newItems.push(options[keys[i]].toString());
    var newSaveString = newItems.join(";");
    logDebug("newSaveString:" + newSaveString);
    localStorage[storageKey] = newSaveString;
}
// удаляет заданные ключи. вернет числ реально удаленных элементов
function removeOptions(realm, subids) {
    var counter = 0;
    for (var i = 0; i < subids.length; i++) {
        var key = makeStorageKey(realm, subids[i]);
        if (localStorage.getItem(key) == null)
            continue;
        localStorage.removeItem(key);
        counter++;
    }
    return counter;
}
// обновляет запись с политиками в хранилище. если чет делалось то вернет полный список опций юнита уже обновленный или {}
function updateOptions(realm, subid, options) {
    if (dictIsEmpty(options))
        return {};
    var loaded = loadOptions(realm, subid); // будет {} если опций нет
    logDebug("oldOptions:" + dict2String(loaded));
    for (var key in options)
        loaded[key] = options[key];
    logDebug("newOptions:" + dict2String(loaded));
    storeOptions(realm, subid, loaded);
    return loaded;
}
// формирует готовый контейнер с опциями который можно тупо вставлять куда надо
function buildContainerHtml(subid, policyKey, policy, empty) {
    if (policy == null)
        throw new Error("policy должен быть задан.");
    if (empty)
        return "<td policy-group=" + policy.group + " class='XioContainer XioEmpty'></td>";
    // если не пустой надо сделать
    if (subid == null || subid.length === 0)
        throw new Error("subid должен быть задан.");
    if (policyKey == null || policyKey.length === 0)
        throw new Error("policyKey должен быть задан.");
    var uniqueId = subid + "-" + policyKey;
    var htmlstring = "<td unit-id=" + subid + " policy-group=" + policy.group + " policy-key=" + policyKey + " id=" + uniqueId + " class=XioContainer>\n                         " + buildOptionsHtml(policy) + "\n                       </td>";
    return htmlstring;
}
function buildOptionsHtml(policy) {
    // в каждую строку юнита добавляем селекты для выбора политик. пока без установки значений.
    var htmlstring = "";
    for (var optionNumber = 0; optionNumber < policy.order.length; optionNumber++) {
        if (optionNumber >= 1)
            htmlstring += "<br>";
        htmlstring += "<select option-number=" + optionNumber + " class=XioChoice>";
        for (var ind = 0; ind < policy.order[optionNumber].length; ind++) {
            var optionValue = policy.order[optionNumber][ind];
            htmlstring += "<option value=" + ind + ">" + optionValue + "</option>";
        }
        htmlstring += "</select>";
    }
    return htmlstring;
}
// опции в режиме отображения подаем
function setOptions(container, options, showMode, policy) {
    if (options == null)
        throw new Error("options должны быть заданы.");
    var $selects = $(container).find("select.XioChoice");
    var showChoices = showMode ? options.choices : save2Show(policy, options.choices);
    // проставляем теперь значения для этих селектов
    for (var optionNumber = 0; optionNumber < policy.order.length; optionNumber++)
        $selects.filter("[option-number=" + optionNumber + "]").val(Math.max(showChoices[optionNumber], 0));
}
// в будущем будут фильтры, эта шняга понадобится. да и пусть будет централизованно
function parseSubid(trList) {
    var rows = $(trList);
    return rows.find("td.unit_id").map(function (i, e) { return numberfy($(e).text()); }).get();
}
// берет локальное хранилище и тащит оттуда все записи по юнитам. выделяет subid
function parseAllSavedSubid(realm) {
    if (!realm || realm.length === 0)
        throw new Error("realm должен быть задан.");
    var subids = [];
    var rx = new RegExp("x" + realm + "\\d+");
    for (var key in localStorage) {
        if (!rx.test(key))
            continue;
        var m = key.match(/\d+/);
        if (m != null)
            subids.push(numberfy(m[0]));
    }
    return subids;
}
// парсит id компании со страницы
function getCompanyId() {
    var m = $(".dashboard a").attr("href").match(/\d+/);
    return numberfy(m == null ? "0" : m[0]);
}
//
// сюда кладем все функции которые собсна выполняют политики
//
function salePrice(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function salePolicy(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function servicePrice(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function serviceWithoutStockPrice(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function incineratorPrice(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function retailPrice(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function prodSupply(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function storeSupply(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function wareSupply(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function advertisement(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function salary(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function holiday(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function training(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function equipment(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function technology(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function research(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function prodBooster(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function politicAgitation(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
function wareSize(policyName, subid, choices) {
    var fn = getFuncName(arguments);
    logDebug("started: ", fn);
}
// из сохраненных значений опций, получаем отображаемые значения
function save2Show(policy, choices) {
    if (policy == null)
        throw new Error("policy is null");
    if (choices == null || choices.length === 0)
        throw new Error("choices не заданы.");
    var res = [];
    for (var optionNumber = 0; optionNumber < choices.length; optionNumber++) {
        var saveIndex = choices[optionNumber];
        var saveValue = policy.save[optionNumber][saveIndex];
        var showIndex = policy.order[optionNumber].indexOf(saveValue);
        if (showIndex < 0)
            throw new Error("\u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u0442\u044C. saveIndex:" + saveIndex + ", saveValue: " + saveValue + ", showIndex:" + showIndex);
        res[optionNumber] = showIndex;
    }
    return res;
}
// из отображаемых опций получаем их сохраняемые значения
function show2Save(policy, choices) {
    if (policy == null)
        throw new Error("policy is null");
    if (choices == null || choices.length === 0)
        throw new Error("choices не заданы.");
    var res = [];
    for (var optionNumber = 0; optionNumber < choices.length; optionNumber++) {
        var showIndex = choices[optionNumber];
        var showValue = policy.order[optionNumber][showIndex];
        var saveIndex = policy.save[optionNumber].indexOf(showValue);
        if (saveIndex < 0)
            throw new Error("\u043D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u0442\u044C. showIndex:" + showIndex + ", showValue: " + showValue + ", saveIndex:" + saveIndex);
        res[optionNumber] = saveIndex;
    }
    return res;
}
var policyJSON = {
    pp: {
        func: salePrice,
        save: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock", "Output"], ["Keep", "Reject"]],
        order: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock", "Output"], ["Keep", "Reject"]],
        name: "priceProd",
        group: "Price",
        wait: []
    },
    pw: {
        func: salePrice,
        save: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock"], ["Keep", "Reject"]],
        order: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock"], ["Keep", "Reject"]],
        name: "priceWare",
        group: "Price",
        wait: []
    },
    ps: {
        func: salePolicy,
        save: [["-", "No sale", "Any", "Company", "Corp."], ["All", "Output"]],
        order: [["-", "No sale", "Any", "Company", "Corp."], ["All", "Output"]],
        name: "policy",
        group: "Policy",
        wait: []
    },
    pn: {
        func: salePolicy,
        save: [["-", "No sale", "Any", "Company", "Corp."]],
        order: [["-", "No sale", "Any", "Company", "Corp."]],
        name: "policy",
        group: "Policy",
        wait: []
    },
    sc: {
        func: servicePrice,
        save: [["-", "Sales", "Turnover", "Profit"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
        order: [["-", "Sales", "Turnover", "Profit"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
        name: "priceService",
        group: "Price",
        wait: []
    },
    sl: {
        func: serviceWithoutStockPrice,
        save: [["-", "Sales", "Turnover"]],
        order: [["-", "Sales", "Turnover"]],
        name: "priceService",
        group: "Price",
        wait: []
    },
    ee: {
        func: incineratorPrice,
        save: [["-", "Max"]],
        order: [["-", "Max"]],
        name: "priceService",
        group: "Price",
        wait: []
    },
    pt: {
        func: retailPrice,
        save: [["-", "Zero", "Market 10%", "Turnover", "Stock", "Local", "City", "Sales", "Market 6%"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
        order: [["-", "Zero", "Market 6%", "Market 10%", "Sales", "Turnover", "Stock", "Local", "City"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
        name: "priceRetail",
        group: "Price",
        wait: []
    },
    sp: {
        func: prodSupply,
        save: [["-", "Zero", "Required", "Stock", "Remove"]],
        order: [["-", "Zero", "Required", "Stock", "Remove"]],
        name: "supplyProd",
        group: "Supply",
        wait: ["priceProd", "policy", "tech", "equip"]
    },
    sr: {
        func: storeSupply,
        save: [["-", "Zero", "Sold", "Amplify", "Stock", "Enhance"], ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], ["Any Q", "Local Q", "City Q"]],
        order: [["-", "Zero", "Sold", "Stock", "Amplify", "Enhance"], ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], ["Any Q", "Local Q", "City Q"]],
        name: "supplyRetail",
        group: "Supply",
        wait: ["priceProd", "policy"]
    },
    sh: {
        func: wareSupply,
        save: [["-", "Zero", "Required", "Stock", "Enhance", "Nuance", "Maximum"], ["None", "Mine", "All", "Other"], ["Remove", "Zeros", "Ones"], ["Any available volume", "1k", "10k", "100k", "1m", "10m", "100m", "1b", "10b", "100b"]],
        order: [["-", "Zero", "Required", "Stock", "Enhance", "Nuance", "Maximum"], ["None", "Mine", "All", "Other"], ["Remove", "Zeros", "Ones"], ["Any available volume", "1k", "10k", "100k", "1m", "10m", "100m", "1b", "10b", "100b"]],
        name: "supplyWare",
        group: "Supply",
        wait: ["supplyProd", "supplyRetail"]
    },
    ad: {
        func: advertisement,
        save: [["-", "Zero", "Min TV", "Max", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Req"]],
        order: [["-", "Zero", "Min TV", "Req", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Max"]],
        name: "ads",
        group: "Ads",
        wait: []
    },
    es: {
        func: salary,
        save: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
        order: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "130%top1", "139%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
        name: "salaryOldInterface",
        group: "Salary",
        wait: ["equip"]
    },
    en: {
        func: salary,
        save: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
        order: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "130%top1", "139%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
        name: "salaryNewInterface",
        group: "Salary",
        wait: ["equip"]
    },
    eh: {
        func: holiday,
        save: [["-", "Holiday", "Working"]],
        order: [["-", "Holiday", "Working"]],
        name: "holidayElse",
        group: "Holiday",
        wait: []
    },
    ep: {
        func: holiday,
        save: [["-", "Holiday", "Working", "Stock"]],
        order: [["-", "Holiday", "Working", "Stock"]],
        name: "holidayProd",
        group: "Holiday",
        wait: ["priceProd"]
    },
    et: {
        func: training,
        save: [["-", "Always", "City Salary", "1 Year"]],
        order: [["-", "Always", "City Salary", "1 Year"]],
        name: "training",
        group: "Training",
        wait: ["salaryNewInterface", "salaryOldInterface"]
    },
    qm: {
        func: equipment,
        save: [["-", "Required", "Maximal", "Q2.00"], ["Black", "Full", "Perc"]],
        order: [["-", "Required", "Maximal", "Q2.00"], ["Black", "Full", "Perc"]],
        name: "equip",
        group: "Equipment",
        wait: ["tech", "research"]
    },
    tc: {
        func: technology,
        save: [["-", "Research"]],
        order: [["-", "Research"]],
        name: "tech",
        group: "Technology",
        wait: []
    },
    rs: {
        func: research,
        save: [["-", "Continue"]],
        order: [["-", "Continue"]],
        name: "research",
        group: "Research",
        wait: []
    },
    pb: {
        func: prodBooster,
        save: [["-", "Always", "Profitable"]],
        order: [["-", "Always", "Profitable"]],
        name: "solars",
        group: "Solars",
        wait: []
    },
    pa: {
        func: politicAgitation,
        save: [["-", "Continuous agitation"]],
        order: [["-", "Continuous agitation"]],
        name: "politics",
        group: "Politics",
        wait: []
    },
    wz: {
        func: wareSize,
        save: [["-", "Packed", "Full"]],
        order: [["-", "Packed", "Full"]],
        name: "size",
        group: "Size",
        wait: []
    }
};
//namespace Shops {
//    export class TradingHall {
//        name: string[];
//        price: number[];
//        quality: number[];
//        purch: number[];
//        cityprice: number[];
//        cityquality: number[];
//        deliver: number[];
//        stock: number[];
//        share: number[];
//        report: string[];       // ссыли на розничные отчеты для всех товаров магаз
//        history: string[];      // ссыли на отчет по продажам
//        img: string[];          // ссыли на картинку товара
//    }
//    export class SalesHistory {
//        price: number[];
//        quantity: number[];
//    }
//    export class RetailReport {
//        marketsize: number;
//        localprice: number;
//        localquality: number;
//        cityprice: number;
//        cityquality: number;
//    }
//    function market6Ex(url: string, i: number): number {
//        //debugger;
//        // в расчетах предполагаем, что парсер нам гарантирует 0 или число, если элемент есть в массиве.
//        // не паримся с undefined
//        var unit = mapped[url] as Shops.TradingHall;
//        if (!unit) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has unit == null`);
//            return 0;
//        }
//        //console.log(unit);
//        var salesHistory = mapped[unit.history[i]] as Shops.SalesHistory; // {price:[], quantity:[]}
//        if (!salesHistory) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has salesHistory == null`);
//            return 0;
//        }
//        // в истории продаж всегда должна быть хотя бы одна строка. Пусть с 0, но должна быть
//        if (salesHistory.price.length < 1) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has salesHistory.price.length < 1`);
//            return 0;
//        }
//        // мое качество сегодня и цена стоящая в окне цены, кач и цена локальных магазов сегодня
//        var myQuality = unit.quality[i];
//        var myPrice = unit.price[i];
//        var cityPrice = unit.cityprice[i];
//        var cityQuality = unit.cityquality[i];
//        // продажи сегодня и цена для тех продаж.
//        var priceOld = salesHistory.price[0];
//        var saleOld = salesHistory.quantity[0];
//        var priceOlder = salesHistory.price[1] || 0; // более старых цен может и не быть вовсе если продаж раньше не было
//        var saleOlder = salesHistory.quantity[1] || 0;
//        // закупка и склад сегодня
//        var deliver = unit.deliver[i];
//        var stock = unit.stock[i];
//        // доля рынка которую занимаем сегодня. если продаж не было то будет 0
//        var share = unit.share[i];
//        // если продаж вообще не было, история будет содержать 1 стру с нулями.
//        var isNewProduct = Math.max.apply(null, salesHistory.price) === 0;
//        var stockNotSold = stock > deliver;
//        let price = 0;
//        if (isNewProduct) {
//            //debugger;
//            // если продукт новый, и склад был, но явно продаж не было, ТО
//            // если цена проставлена, снижаем ее. Иначе считаем базовую
//            // если товара не было, то оставляем ту цену что вписана, либо ставим базовую. Вдруг я руками вписал сам.
//            if (stockNotSold) {
//                //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                if (myPrice === 0)
//                    calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                else
//                    postMessage(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${unit.img[i]}></img> with Price:${myPrice}. Correct prices!`);
//            } else
//                price = myPrice > 0 ? myPrice : calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//        }
//        // если на складе пусто, нужно все равно менять цену если продажи были.
//        // просто потому что на след раз когда на складе будет товар но не будет продаж, мы долю рынка не увидим.
//        if (!isNewProduct) {
//            if (saleOld === 0) {
//                // Если товар был и не продавался Что то не так, снижаем цену резко на 5%
//                // если saleOld === 0, то всегда и priceOld будет 0. Так уж работает
//                // пробуем взять ту цену что стоит сейчас и снизить ее, если цены нет, то ставим базовую
//                if (stockNotSold) {
//                    //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                    // TODO: как то подумать чтобы если продаж не было не снижать от установленной а привязаться к прошлым продажам если кач подходит
//                    if (myPrice === 0)
//                        calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                    else
//                        postMessage(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${unit.img[i]}></img> with Price:${myPrice}. Correct prices!`);
//                }
//                // если продаж не было и товара не было, то фигли менять что либо. Стоит как есть.
//            }
//            if (saleOld > 0) {
//                // рынок не занят и не все продаем? Снижаем цену. Если продали все то цену чуть повысим
//                if (share < 4.5)
//                    price = stockNotSold ? priceOld * (1 - 0.03) : priceOld * (1 + 0.01);
//                // рынок занят и продали не все? Цену чуть снижаем. Если все продаем то повышаем цену, иначе продаваться будет больше
//                if (share > 4.5 && share < 6)
//                    price = stockNotSold ? priceOld * (1 - 0.01) : priceOld * (1 + 0.03);
//                if (share > 6 && share < 7.5)
//                    price = stockNotSold ? priceOld * (1 + 0.01) : priceOld * (1 + 0.03);
//                if (share > 7.5)
//                    price = stockNotSold ? priceOld * (1 + 0.03) : priceOld * (1 + 0.05);
//            }
//        }
//        // если цена уже минимальна а продажи 0, алармить об этом
//        return price;
//    }
//    function calcBaseRetailPrice(myQuality: number, localPrice: number, localQuality: number): number {
//        if (myQuality === 0 || localPrice === 0 || localQuality === 0)
//            throw new Error("Аргументы должны быть > 0!");
//        return Math.max(localPrice * (1 + Math.log(myQuality / localQuality)), 0, 4);
//    }
//} 
var $ = jQuery = jQuery.noConflict(true);
var $xioDebug = true;
//var ls = localStorage;
var $realm = getRealm();
var getUrls = [];
var finUrls = [];
var xcallback = []; // массив of tuple
var mapped = {};
var xcount = {};
var xmax = {};
var typedone = [];
var xwait = [];
var xequip = [];
var fireequip = false;
var servergetcount = 0;
var serverpostcount = 0;
var suppliercount = 0;
var processingtime = 0;
var timeinterval = 0;
//var mousedown = false;
//var $tron: HTMLElement;
var XMreload = false;
var xsup = []; // TODO: как то гемор этот разгрести и типизировать
var xsupcheck = {};
var urlUnitlist = "";
var blackmail = [];
var companyid = getCompanyId();
var equipfilter = [];
function getRealm() {
    var r = xpCookie('last_realm');
    if (r == null)
        throw new Error("неведомая хуйня но реалм == null");
    return r;
}
function getFuncName(args) {
    // из аргументов функции вытаскивает само имя функции. для лога чисто
    var items = args.callee.toString().split("(");
    return items[0] ? items[0] + "()" : "";
}
function logDebug(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if ($xioDebug)
        console.log(msg, args);
}
function numberfy(variable) {
    // возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо 0 если не получилось преобразовать.
    if (String(variable) === 'Не огр.' ||
        String(variable) === 'Unlim.' ||
        String(variable) === 'Не обм.' ||
        String(variable) === 'N’est pas limité' ||
        String(variable) === 'No limitado' ||
        String(variable) === '无限' ||
        String(variable) === 'Nicht beschr.') {
        return Number.POSITIVE_INFINITY;
    }
    else {
        return parseFloat(variable.replace(/[\s\$\%\©]/g, "")) || 0;
    }
}
;
function zipAndMin(napArr1, napArr2) {
    // адская функция. так и не понял нафиг она
    if (napArr1.length > napArr2.length) {
        return napArr1;
    }
    else if (napArr2.length > napArr1.length) {
        return napArr2;
    }
    else {
        var zipped = napArr1.map(function (e, i) { return [napArr1[i], napArr2[i]]; });
        var res = zipped.map(function (e, i) {
            if (e[0] == 0) {
                return e[1];
            }
            else if (e[1] == 0) {
                return e[0];
            }
            else {
                return Math.min(e[0], e[1]);
            }
        });
        return res;
    }
}
function buildingShortener() {
    $(document).ajaxSuccess(function (event, xhr, settings) {
        var newUrl = $(xhr.responseText).find("#mainContent form").attr("action");
        var $form = $("form:eq(1)");
        if (new RegExp("\/.*\/main\/unit\/create\/[0-9]+").test(newUrl)) {
            $("#mainContent").html($(xhr.responseText).find("#mainContent").html());
            $(":submit:not([name=next])").remove();
            $form.submit(function (event) {
                event.preventDefault();
                $.post(newUrl, $form.serialize());
            });
        }
        else {
            $form.off("submit");
            newUrl && window.location.replace(newUrl);
        }
    });
    var $form = $("form:eq(1)");
    $(":submit:not([name=next])").remove();
    $form.submit(function (event) {
        event.preventDefault();
        $.post(document.URL, $form.serialize());
    });
}
function xpCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function map(html, url, page) {
    if (page === "ajax") {
        mapped[url] = JSON.parse(html);
        return false;
    }
    else if (page === "none") {
        return false;
    }
    // TODO: запилить классы для каждого типа страницы. чтобы потом можно было с этим типизированно воркать
    var $html = $(html);
    if (page === "unitlist") {
        mapped[url] = {
            subids: $html.find(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            type: $html.find(".unit-list-2014 td:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[1]; }).get()
        };
    }
    else if (page === "sale") {
        mapped[url] = {
            form: $html.find("[name=storageForm]"),
            policy: $html.find("select:even").map(function (i, e) { return $(e).find("[selected]").index(); }).get(),
            price: $html.find("input.money:even").map(function (i, e) { return numberfy($(e).val()); }).get(),
            incineratorMaxPrice: $html.find('span[style="COLOR: green;"]').map(function (i, e) { return numberfy($(e).text()); }).get(),
            outqual: $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            outprime: $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            stockqual: $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            stockprime: $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            product: $html.find(".grid a:not([onclick])").map(function (i, e) { return $(e).text(); }).get(),
            productId: $html.find(".grid a:not([onclick])").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+/);
                return numberfy(m == null ? "0" : m[0]);
            }).get(),
            region: $html.find(".officePlace a:eq(-2)").text(),
            contractpage: !!$html.find(".tabsub").length,
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e); })
        };
    }
    else if (page === "salecontract") {
        mapped[url] = {
            category: $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get(),
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e); })
        };
    }
    else if (page === "prodsupply") {
        mapped[url] = $html.find(".inner_table").length ? {} : {};
    }
    else if (page === "consume") {
        mapped[url] = {
            consump: zipAndMin($html.find(".list td:nth-last-child(1) div:nth-child(2)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get(), $html.find(".list td:nth-last-child(1) div:nth-child(1)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get()),
            purch: $html.find('#mainContent > form > table.list > tbody > tr:last > td.nowrap').map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "storesupply") {
        mapped[url] = {
            parcel: $html.find("input:text[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_mark_up: $html.find("select[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_type: $html.find("select[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get(),
            quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            purchase: $html.find("td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quantity: $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            sold: $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(5) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            reprice: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return !!$(e).find("div").length; }).get(),
            quality: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            available: $html.find("td:nth-child(10) table:nth-child(1) tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            img: $html.find(".noborder td > img").map(function (i, e) { return $(e).attr("src"); }).get()
        };
    }
    else if (page === "tradehall") {
        mapped[url] = {
            stock: $html.find(".nowrap:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            deliver: $html.find(".nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text().split("[")[1]); }).get(),
            report: $html.find(".grid a:has(img):not(:has(img[alt]))").map(function (i, e) { return $(e).attr("href"); }).get(),
            img: $html.find(".grid a img:not([alt])").map(function (i, e) { return $(e).attr("src"); }).get(),
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            purch: $html.find("td:nth-child(9)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            price: $html.find(":text").map(function (i, e) { return numberfy($(e).val()); }).get(),
            name: $html.find(":text").map(function (i, e) { return $(e).attr("name"); }).get(),
            share: $html.find(".nowrap:nth-child(11)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            cityprice: $html.find("td:nth-child(12)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            cityquality: $html.find("td:nth-child(13)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            history: $html.find("a.popup").map(function (i, e) { return $(e).attr("href"); }).get()
        };
    }
    else if (page === "service") {
        mapped[url] = {
            price: $html.find("a.popup[href$='service_history']").map(function (i, e) { return numberfy($(e).text().split('(')[0].trim()); }).get(),
            history: $html.find("a.popup[href$='service_history']").map(function (i, e) { return $(e).attr("href"); }).get(),
            incineratorPrice: $html.find("a.popup[href$='power_history']").map(function (i, e) { return numberfy($(e).text()); }).get(),
            //not used
            stock: $html.find(".nowrap:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            deliver: $html.find(".nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text().split("[")[1]); }).get(),
            report: $html.find(".grid a:has(img):not(:has(img[alt]))").map(function (i, e) { return $(e).attr("href"); }).get(),
            img: $html.find(".grid a img:not([alt])").map(function (i, e) { return $(e).attr("src"); }).get(),
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            name: $html.find(":text").map(function (i, e) { return $(e).attr("name"); }).get(),
            share: $html.find(".nowrap:nth-child(11)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            cityprice: $html.find("td:nth-child(12)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            cityquality: $html.find("td:nth-child(13)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "servicepricehistory") {
        mapped[url] = {
            price: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quantity: $html.find(".list td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "retailreport") {
        mapped[url] = {
            marketsize: numberfy($html.find("b:eq(1)").text()),
            localprice: numberfy($html.find(".grid .even td:eq(0)").text()),
            localquality: numberfy($html.find(".grid .odd td:eq(0)").text()),
            cityprice: numberfy($html.find(".grid .even td:eq(1)").text()),
            cityquality: numberfy($html.find(".grid .odd td:eq(1)").text())
        };
    }
    else if (page === "pricehistory") {
        // если продаж на неделе не было вообще => игра не запоминает в историю продаж такие дни вообще.
        // такие дни просто вылетают из списка.
        // сегодняшний день ВСЕГДА есть в списке.
        // если продаж сегодня не было, то в строке будут тока бренд 0 а остальное пусто.
        // если сегодня продажи были, то там будут числа и данная строка запомнится как история продаж.
        // причина по которой продаж не было пофиг. Не было товара, цена стояла 0 или стояла очень большая. Похер!
        // numberfy возвращает 0, если была пустота или неадекват. Поэтому у нас всегда будет 1 число в массиве.
        mapped[url] = {
            quantity: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            price: $html.find(".list td:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "TM") {
        mapped[url] = {
            product: $html.find(".grid td:odd").map(function (i, e) { return $(e).clone().children().remove().end().text().trim(); }).get(),
            franchise: $html.find(".grid b").map(function (i, e) { return $(e).text(); }).get()
        };
    }
    else if (page === "IP") {
        mapped[url] = {
            product: $html.find(".list td:nth-child(5n-3)").map(function (i, e) { return $(e).text(); }).get(),
            IP: $html.find(".list td:nth-child(5n)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "transport") {
        mapped[url] = {
            countryName: $html.find("select:eq(0) option").map(function (i, e) { return $(e).text(); }).get(),
            countryId: $html.find("select:eq(0) option").map(function (i, e) { return numberfy($(e).val().split("/")[1]); }).get(),
            regionName: $html.find("select:eq(1) option").map(function (i, e) { return $(e).text(); }).get(),
            regionId: $html.find("select:eq(1) option").map(function (i, e) { return numberfy($(e).val().split("/")[2]); }).get(),
            cityName: $html.find("select:eq(2) option").map(function (i, e) { return $(e).text(); }).get(),
            cityId: $html.find("select:eq(2) option").map(function (i, e) { return numberfy($(e).val().split("/")[3]); }).get()
        };
    }
    else if (page === "CTIE") {
        mapped[url] = {
            product: $html.find(".list td:nth-child(3n-1)").map(function (i, e) { return $(e).text(); }).get(),
            profitTax: numberfy($html.find(".region_data td:eq(3)").text()),
            CTIE: $html.find(".list td:nth-child(3n)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "main") {
        mapped[url] = {
            employees: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(0) td:eq(1)").text()),
            salaryNow: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(2) td:eq(1)").text()),
            salaryCity: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(3) td:eq(1)").text()),
            skillNow: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(4) td:eq(1)").text()),
            skillReq: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(5) td:eq(1)").text()),
            equipNum: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(0) td:eq(1)").text()),
            equipMax: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(1) td:eq(1)").text()),
            equipQual: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(2) td:eq(1)").text()),
            equipReq: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(3) td:eq(1)").text()),
            equipWearBlack: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1)").text().split("(")[1]),
            equipWearRed: $html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1) span").length === 1,
            managerPic: $html.find(".unit_box:has(.fa-user) ul img").attr("src"),
            qual: numberfy($html.find(".unit_box:has(.fa-user) tr:eq(1) td:eq(1)").text()),
            techLevel: numberfy($html.find(".unit_box:has(.fa-industry) tr:eq(3) td:eq(1)").text()),
            maxEmployees: numberfy($html.find(".unit_box:has(.fa-user) tr:eq(2) td:eq(1)").text()),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0],
            size: numberfy($html.find("#unitImage img").attr("src").split("_")[1]),
            hasBooster: !$html.find("[src='/img/artefact/icons/color/production.gif']").length,
            hasAgitation: !$html.find("[src='/img/artefact/icons/color/politics.gif']").length,
            onHoliday: !!$html.find("[href$=unset]").length,
            isStore: !!$html.find("[href$=trading_hall]").length,
            departments: numberfy($html.find("tr:contains('Number of departments') td:eq(1)").text()),
            visitors: numberfy($html.find("tr:contains('Number of visitors') td:eq(1)").text())
        };
    }
    else if (page === "salary") {
        mapped[url] = {
            employees: numberfy($html.find("#quantity").val()),
            form: $html.filter("form"),
            salaryNow: numberfy($html.find("#salary").val()),
            salaryCity: numberfy($html.find("tr:nth-child(3) > td").text().split("$")[1]),
            skillNow: numberfy($html.find("#apprisedEmployeeLevel").text()),
            skillCity: (function () {
                var m = $html.find("div span[id]:eq(1)").text().match(/[0-9]+(\.[0-9]+)?/);
                return numberfy(m == null ? "0" : m[0]);
            })(),
            skillReq: (function () {
                var m = $html.find("div span[id]:eq(1)").text().split(",")[1].match(/(\d|\.)+/);
                return numberfy(m == null ? "0" : m[0]);
            })()
        };
    }
    else if (page === "training") {
        mapped[url] = {
            form: $html.filter("form"),
            salaryNow: numberfy($html.find(".list td:eq(8)").text()),
            salaryCity: numberfy($html.find(".list td:eq(9)").text().split("$")[1]),
            weekcost: numberfy($html.find("#educationCost").text()),
            employees: numberfy($html.find("#unitEmployeesData_employees").val()),
            skillNow: numberfy($html.find(".list span:eq(0)").text()),
            skillCity: numberfy($html.find(".list span:eq(1)").text())
        };
    }
    else if (page === "equipment") {
        mapped[url] = {
            qualNow: numberfy($html.find("#top_right_quality").text()),
            qualReq: numberfy($html.find(".recommended_quality span:not([id])").text()),
            equipNum: numberfy($html.find("#quantity_corner").text()),
            equipMax: (function () {
                var m = $html.find(".contract:eq(1)").text().split("(")[1].match(/(\d| )+/);
                return numberfy(m == null ? "0" : m[0]);
            })(),
            equipPerc: numberfy($html.find("#wear").text()),
            price: $html.find(".digits:contains($):odd:odd").map(function (i, e) { return numberfy($(e).text()); }).get(),
            qualOffer: $html.find(".digits:not(:contains($)):odd").map(function (i, e) { return numberfy($(e).text()); }).get(),
            available: $html.find(".digits:not(:contains($)):even").map(function (i, e) { return numberfy($(e).text()); }).get(),
            offer: $html.find(".choose span").map(function (i, e) { return numberfy($(e).attr("id")); }).get(),
            img: $html.find(".rightImg").attr("src"),
            filtername: (function () {
                var m = $html.find("[name=doFilterForm]").attr("action").match(/db.*?\//);
                return numberfy(m == null ? "0" : m[0].slice(2, -1));
            })(),
        };
    }
    else if (page === "manager") {
        mapped[url] = {
            base: $html.find(".qual_item .mainValue").map(function (i, e) { return numberfy($(e).text()); }).get(),
            bonus: $html.find(".qual_item .bonusValue").map(function (i, e) { return numberfy($(e).text()); }).get(),
            pic: $html.find(".qual_item img").map(function (i, e) { return $(e).attr("src"); }).get()
        };
    }
    else if (page === "tech") {
        mapped[url] = {
            price: $html.find("tr td.nowrap:nth-child(2)").map(function (i, e) { return $(e).text().trim(); }).get(),
            tech: $html.find("tr:has([src='/img/v.gif'])").index(),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        };
    }
    else if (page === "products") {
        mapped[url] = {
            name: $html.find(".list td:nth-child(2n):has(a)").map(function (i, e) { return $(e).text(); }).get(),
            id: $html.find(".list td:nth-child(2n) a:nth-child(1)").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+/);
                return numberfy(m == null ? "0" : m[0]);
            }).get()
        };
    }
    else if (page === "waresupply") {
        mapped[url] = {};
    }
    else if (page === "contract") {
        mapped[url] = {};
    }
    else if (page === "research") {
        mapped[url] = {
            isFree: !$html.find(".cancel").length,
            isHypothesis: !!$html.find("#selectIt").length,
            isBusy: !!numberfy($html.find(".grid .progress_static_bar").text()),
            hypId: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get(),
            curIndex: $html.find("tr:has([src='/img/v.gif'])").index() - 1,
            chance: $html.find(".grid td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            time: $html.find(".grid td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            isAbsent: !!$html.find("b[style='color: red']").length,
            isFactory: !!$html.find("span[style='COLOR: red']").length,
            unittype: $html.find(":button:eq(2)").attr("onclick") && numberfy($html.find(":button:eq(2)").attr("onclick").split(",")[1]),
            industry: $html.find(":button:eq(2)").attr("onclick") && numberfy($html.find(":button:eq(2)").attr("onclick").split("(")[1]),
            level: numberfy($html.find(".list tr td[style]:eq(0)").text())
        };
    }
    else if (page === "experimentalunit") {
        mapped[url] = {
            id: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get()
        };
    }
    else if (page === "productreport") {
        mapped[url] = {};
    }
    else if (page === "financeitem") {
        mapped[url] = {
            energy: numberfy($html.find(".list tr:has(span[style]) td:eq(1)").text())
        };
    }
    else if (page === "size") {
        mapped[url] = {};
    }
    else if (page === "waremain") {
        mapped[url] = {};
    }
    else if (page === "ads") {
        mapped[url] = {};
    }
    else if (page === "employees") {
        mapped[url] = {
            id: $html.find(".list tr:gt(2) :checkbox").map(function (i, e) { return numberfy($(e).attr("id").substring(5)); }).get(),
            salaryWrk: $html.find(".list td:nth-child(7)").map(function (i, e) { return numberfy($(e).find("span").remove().end().text()); }).get(),
            salaryCity: $html.find(".list td:nth-child(8)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            skillWrk: $html.find(".list td:nth-child(9)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            skillCity: $html.find(".list td:nth-child(10)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            onHoliday: $html.find(".list td:nth-child(11)").map(function (i, e) { return !!$(e).find(".in-holiday").length; }).get(),
            efficiency: $html.find(".list td:nth-child(11)").map(function (i, e) { return $(e).text().trim(); }).get()
        };
    }
    else if (page === "promotion") {
        mapped[url] = {};
    }
    else if (page === "machines") {
        mapped[url] = {};
    }
    else if (page === "animals") {
        mapped[url] = {};
    }
    return true;
}
function time() {
    // обновляет время на странице в логе выполнения
    var time = new Date().getTime();
    var minutes = (time - processingtime) / 1000 / 60;
    $("#XioMinutes").text(Math.floor(minutes));
    $("#XioSeconds").text(Math.round((minutes - Math.floor(minutes)) * 60));
}
// TODO: конфликтует со штатной функцией. переименовать!!!
function postMessage(html) {
    $("#XMproblem").append("<div>" + html + "</div>");
}
function xGet(url, page, force, callback) {
    // запрашивает урл. При успехе, обновляет время, увеличивает счетчик запросов, маппит урл, выполняет коллбэк и вызывает урлДан.
    // при ошибке перезапрашивает через 3 секунды
    if (getUrls.indexOf(url) < 0 || force) {
        if (getUrls.indexOf(url) < 0)
            getUrls.push(url);
        $.ajax({
            url: url,
            type: "GET",
            success: function (html, status, xhr) {
                time();
                servergetcount++;
                $("#XioGetCalls").text(servergetcount);
                $("#XioServerCalls").text(servergetcount + serverpostcount);
                map(html, url, page);
                callback();
                xUrlDone(url);
            },
            error: function (xhr, status, error) {
                time();
                servergetcount++;
                $("#XioGetCalls").text(servergetcount);
                $("#XioServerCalls").text(servergetcount + serverpostcount);
                //Resend ajax
                var _this = this;
                setTimeout(function () {
                    $.ajax(_this);
                }, 3000);
            }
        });
    }
    else {
        xcallback.push([url, function () { return callback(); }]); // тут видимо this сохраняется. просто функцию вкатить будет ошибкой
    }
}
function xPost(url, form, callback) {
    // отправляет данные на сервек.  Если успех то выполняет колбэк. иначе переотправляет через 3 секунды
    $.ajax({
        url: url,
        data: form,
        type: "POST",
        success: function (html, status, xhr) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            callback(html);
        },
        error: function (xhr, status, error) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            //Resend ajax
            var _this = this;
            setTimeout(function () {
                $.ajax(_this);
            }, 3000);
        }
    });
}
function xContract(url, data, callback) {
    // тоже самое что xPost тока формат данных другой. 
    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: "JSON",
        success: function (data, status, xhr) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            callback(data);
        },
        error: function (xhr, status, error) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            //Resend ajax
            var _this = this;
            setTimeout(function () {
                $.ajax(_this);
            }, 3000);
        }
    });
}
function xUrlDone(url) {
    // добавляет ссылку в список, затем находит для нее коллбэк и выполняет его. удаляет колбэк для функции.
    finUrls.push(url);
    for (var i = 0; i < xcallback.length; i++) {
        if (finUrls.indexOf(xcallback[i][0]) >= 0) {
            xcallback[i][1]();
            xcallback.splice(i, 1);
            i--;
        }
    }
}
function xTypeDone(policyName) {
    // если политика отработана полностью по всем юнитам, то помещает policy.name в typedone[]
    // находим группу для указанного типа операции Для "priceRetail" group == Price
    var group = "";
    for (var key_1 in policyJSON) {
        if (policyJSON[key_1].name === policyName) {
            group = policyJSON[key_1].group;
            break;
        }
    }
    if (group === "")
        throw new Error("\u043D\u0435 \u043D\u0430\u0448\u043B\u0438 \u0433\u0440\u0443\u043F\u043F\u0443 \u0434\u043B\u044F policyName:" + policyName);
    // Все имена политик с такой же группой выпишем в массив
    var typeArray = [];
    for (var key_2 in policyJSON) {
        var policy = policyJSON[key_2];
        if (policy.group === group && typeArray.indexOf(policy.name) < 0)
            typeArray.push(policy.name);
    }
    xcount[policyName]--; // хз чего это
    var groupcount = 0;
    var maxcount = 0;
    for (var i = 0; i < typeArray.length; i++) {
        groupcount += xcount[typeArray[i]];
        maxcount += xmax[typeArray[i]];
    }
    // похоже обновляем текст в окне лога исполнения
    $("[id='x" + group + "']").text(maxcount - groupcount);
    if (!xcount[policyName]) {
        if (!groupcount) {
            $("[id='x" + group + "done']").text("Done!");
            $("[id='x" + group + "current']").text("");
        }
        typedone.push(policyName);
        for (var i = 0; i < xwait.length; i++) {
            var index = xwait[i][0].indexOf(policyName);
            if (index >= 0) {
                xwait[i][0].splice(index, 1);
                if (xwait[i][0].length === 0) {
                    xwait[i][1]();
                    xwait.splice(i, 1);
                    i--;
                }
            }
        }
    }
    var sum = 0;
    for (var key in xcount)
        sum += xcount[key];
    // походу когда все исполнилось включает кнопки скрипта
    if (sum === 0 && $("#xDone").css("visibility") === "hidden") {
        $("#xDone").css("visibility", "");
        console.log("mapped: ", mapped); // валит все отпарсенные ссылки за время обработки
        $(".XioGo").prop("disabled", false);
        clearInterval(timeinterval);
    }
}
function xsupGo(subid, type) {
    // без понятия че тут делает эта херь
    if (subid)
        xsupcheck[subid] = false;
    if (type)
        xsupcheck[type] = false;
    for (var i = 0; i < xsup.length; i++) {
        if (!xsupcheck[xsup[i][0]] && !xsupcheck[xsup[i][1]]) {
            xsupcheck[xsup[i][0]] = true;
            xsupcheck[xsup[i][1]] = true;
            xsup.splice(i, 1)[0][2]();
            i--;
        }
    }
}
function XioMaintenance(subids, policyGroups) {
    console.log("XM!");
    var processingtime = new Date().getTime();
    var timeinterval = setInterval(time, 1000);
    // дизаблим кнопки убираем старые логи
    $(".XioGo").prop("disabled", true);
    $(".XioProperty").remove();
    // апдейтим глобальные переменные
    getUrls = [];
    finUrls = [];
    xcallback = [];
    xcount = {};
    xmax = {};
    mapped = {};
    servergetcount = 0;
    serverpostcount = 0;
    suppliercount = 0;
    blackmail = [];
    equipfilter = [];
    console.log(mapped);
    if (!subids || subids.length === 0)
        subids = parseAllSavedSubid($realm);
    if (!policyGroups || subids.length === 0) {
        policyGroups = [];
        for (var key in policyJSON)
            policyGroups.push(policyJSON[key].group);
    }
    // шляпа что рисуется сверху и показывает результаты
    var tablestring = ""
        + "<div id=XMtabletitle class=XioProperty style='font-size: 24px; color:gold; margin-bottom: 5px; margin-top: 15px;'>XS 12 Maintenance Log</div>"
        + "<table id=XMtable class=XioProperty style='font-size: 18px; color:gold; border-spacing: 10px 0; margin-bottom: 18px'>"
        + "<tr id=XSplit></tr>"
        + "<tr>"
        + "<td>New suppliers: </td>"
        + "<td id=XioSuppliers>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Get calls: </td>"
        + "<td id=XioGetCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Post calls: </td>"
        + "<td id=XioPostCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Total server calls: </td>"
        + "<td id=XioServerCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Time: </td>"
        + "<td id=XioMinutes>0</td>"
        + "<td>min</td>"
        + "<td id=XioSeconds>0</td>"
        + "<td>sec</td>"
        + "</tr>"
        + "<tr>"
        + "<td id=xDone colspan=4 style='visibility: hidden; color: lightgoldenrodyellow'>All Done!</td>"
        + "</tr>"
        + "</table>"
        + "<div id=XMproblem class=XioProperty style='font-size: 18px; color:gold;'></div>";
    $("div.metro_header").append(tablestring);
    // вообще без понятия что это за херня, но походу парсит главную страницу юнитов.
    // походу убираем фильтры по типам, ставим 20000 страниц и тока потом чето парсим
    urlUnitlist = "/" + $realm + "/main/company/view/" + companyid + "/unit_list";
    var filtersetting = $(".u-s").attr("href") || "/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithProduction/class=0/size=0/type=" + $(".unittype").val();
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithProduction/20000", "none", false, function () {
        xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithProduction/class=0/type=0", "none", false, function () {
            xGet(urlUnitlist, "unitlist", false, function () {
                xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithProduction/400", "none", false, function () {
                    xGet(filtersetting, "none", false, function () {
                        further(mapped[urlUnitlist].subids);
                    });
                });
            });
        });
    });
    function further(realsubids) {
        var startedPolicies = [];
        var xgroup = {};
        // TODO: с этим надо чет сделать. кнопку какую чтобы чистило тока по кнопке. а то косячит и удаляет само если подвисло чего
        var _loop_1 = function(i) {
            // если в базе запись про юнита есть, а он не спарсился со страницы, удалить запись о нем.
            if (realsubids.indexOf(subids[i]) < 0) {
                var urlSubid = "/" + $realm + "/main/unit/view/" + subids[i];
                postMessage("Subdivision <a href=" + urlSubid + ">" + subids[i] + "</a> is missing from the company. Options have been erased from the Local Storage.");
                removeOptions($realm, [subids[i]]);
                return "continue";
            }
            // загружаем политики юнита. часть отработаем сразу, часть пихаем в кэш и отработаем когда wait позволит уже
            var loaded = loadOptions($realm, subids[i]);
            var _loop_2 = function(policyKey) {
                var policy = policyJSON[policyKey];
                if (policy == null || policyGroups.indexOf(policy.group) < 0)
                    return "continue";
                if (startedPolicies.indexOf(policy.name) < 0)
                    startedPolicies.push(policy.name);
                // такой хитровыебанный способ просто увеличить счетчик или инициализировать. 
                xmax[policy.name] = ++xmax[policy.name] || 1;
                xcount[policy.name] = ++xcount[policy.name] || 1;
                xgroup[policy.group] = ++xgroup[policy.group] || 1;
                policy.wait.slice();
                // если данная политика не нуждается в ожидании других, фигачим на выполнение сразу
                if (policy.wait.length === 0) {
                    policy.func(policy.name, subids[i], loaded[policyKey].choices);
                }
                else {
                    // хитрожопый способ привязать скоуп
                    var f = function () {
                        var _policy = policy;
                        var _options = loaded[policyKey];
                        var _subid = subids[i];
                        return function () { return policy.func(_policy.name, _subid, _options.choices); }; // TODO: возможно тут надо еще this вязать
                    };
                    xwait.push([policy.wait.slice(), f()]);
                }
            };
            for (var policyKey in loaded) {
                _loop_2(policyKey);
            }
        };
        for (var i = 0; i < subids.length; i++) {
            _loop_1(i);
        }
        for (var key_3 in policyJSON) {
            var name_1 = policyJSON[key_3].name;
            if (startedPolicies.indexOf(name_1) < 0) {
                xcount[name_1] = 1;
                xmax[name_1] = 0;
                xTypeDone(name_1);
            }
        }
        // рисует шляпу по обрабатываемым политикам на странице
        var displayedPolicies = [];
        for (var key_4 in policyJSON) {
            var name_2 = policyJSON[key_4].name;
            var group = policyJSON[key_4].group;
            if (startedPolicies.indexOf(name_2) >= 0 && displayedPolicies.indexOf(group) < 0) {
                displayedPolicies.push(group);
                $("#XSplit").before("<tr>"
                    + "<td>" + group + "</td>"
                    + "<td id='x" + group + "'>0</td>"
                    + "<td>of</td>"
                    + "<td>" + xgroup[group] + "</td>"
                    + "<td id='x" + group + "done' style='color: lightgoldenrodyellow'></td>"
                    + "<td id='x" + group + "current' style='color: lightgoldenrodyellow'></td>"
                    + "</tr>");
            }
        }
    }
}
;
function XioGenerator(subids) {
    // морозим кнопки. убираем старый лог
    $(".XioGo").prop("disabled", true);
    $(".XioProperty").remove();
    // формируем новый лог
    $("div.metro_header").append(""
        + "<table id=XMtable class=XioProperty style='font-size: 18px; color:gold; border-spacing: 10px 0; margin-top: 10px;'>"
        + "<tr>"
        + "<td>Total server calls: </td>"
        + "<td id=XioServerCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td id=xDone colspan=4 style='visibility: hidden; color: lightgoldenrodyellow'>All Done!</td>"
        + "</tr>"
        + "</table>");
    servergetcount = 0;
    var getcount = 0;
    var data = {};
    for (var j = 0; j < subids.length; j++) {
        var subid = subids[j];
        data[subid] = [];
        var url = "/" + $realm + "/main/unit/view/" + subid;
        getcount++;
        (function (url, subid) {
            $.get(url, function (htmlmain) {
                servergetcount++;
                $("#XioServerCalls").text(servergetcount);
                data[subid].push({
                    html: htmlmain,
                    url: url
                });
                var links = $(htmlmain).find(".tabu > li > a:gt(2)").map(function (i, el) { return $(el).attr("href"); }).get();
                logDebug("links: " + links.join(" | "));
                getcount += links.length;
                !--getcount && checkpreference();
                for (var i = 0; i < links.length; i++) {
                    (function (url, subid) {
                        $.get(url, function (html) {
                            servergetcount++;
                            $("#XioServerCalls").text(servergetcount);
                            data[subid].push({
                                html: html,
                                url: url
                            });
                            !--getcount && checkpreference();
                        });
                    })(links[i], subid);
                }
            });
        })(url, subid);
    }
    function checkpreference() {
        var refresh = false;
        for (var j = 0; j < subids.length; j++) {
            var subid = subids[j];
            // получаем полный список policyKey для данного subid
            var policies = [];
            for (var i = 0; i < data[subid].length; i++) {
                var prePages = preferencePages(data[subid][i].html, data[subid][i].url);
                var xPages = xPrefPages(data[subid][i].html, data[subid][i].url);
                policies.push.apply(policies, prePages.concat(xPages));
            }
            logDebug("subid policies:" + policies.join(", "));
            var loaded = loadOptions($realm, subid); // {} если пусто
            logDebug("loaded options:" + dict2String(loaded));
            // сначала проверим чтобы в опциях не было неположенных политик
            for (var key in loaded) {
                if (policies.indexOf(key) < 0)
                    delete loaded[key];
            }
            logDebug("options cleaned:" + dict2String(loaded));
            // теперь добавим те ключи которых нет в опциях или сбросим те которые криво записаны
            var keys = Object.keys(loaded);
            for (var i = 0; i < policies.length; i++) {
                var key = policies[i];
                var policy = policyJSON[key];
                if (keys.indexOf(key) >= 0 && loaded[key].choices.length === policy.save.length)
                    continue;
                // ну нет бля быстрого способа заполнить массив нулями. 
                var choices = new Array(policy.save.length);
                for (var i_1 = 0; i_1 < choices.length; i_1++)
                    choices[i_1] = 0;
                loaded[key] = new PolicyOptions(key, choices);
                refresh = true;
            }
            storeOptions($realm, subid, loaded);
        }
        if (refresh) {
            $(".XioHide").removeClass("XioHide").show(); // показать скрытые ранее колонки
            $(".XOhtml").remove(); // всякие заголовки и прочая херь
            $(".XioContainer").remove(); // все контейнеры с селектами
            $(".unit-list-2014").off(".XO"); // скинуть события
            XioOverview();
        }
        $("#xDone").css("visibility", "");
        $(".XioGo").prop("disabled", false);
    }
}
;
function XioExport() {
    $(".XioProperty").remove();
    $("div.metro_header").append("<br class=XioProperty>\n                                  <textarea id=XEarea class=XioProperty style='width: 900px'></textarea>");
    var string = "";
    var rx = new RegExp("x" + $realm + "\\d+");
    for (var key in localStorage) {
        if (rx.test(key))
            string += key.substring(1) + "=" + localStorage[key] + ",";
    }
    $("#XEarea").text(string).height($("#XEarea")[0].scrollHeight);
}
function XioImport() {
    $(".XioProperty").remove();
    $("div.metro_header").append("<br class=XioProperty>\n                                  <textarea id=XIarea class=XioProperty style='width: 900px'></textarea>\n                                  <br class=XioProperty>\n                                  <input type=button id=XioSave class=XioProperty value=Save!>");
    // TODO: импорт не работает. хз почему.
    $(document).on('input propertychange', "#XIarea", function () {
        $("#XIarea").height($("#XIarea")[0].scrollHeight);
    });
    // TODO: данную херь переписать. сделать через штатные способы записи опций
    $("#XioSave").click(function () {
        var string = $("#XIarea").val();
        string = string.replace(/=/g, "']='").replace(/,/g, "';localStorage['x");
        try {
            eval("localStorage['x" + string.slice(0, -15));
            document.location.reload();
        }
        catch (e) {
            console.log("import not successful");
        }
    });
}
;
function XioHoliday() {
    // выводит на страницу с юнитами инфу по эффективности рабов. берет со страницы управление - персонал.
    var url = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/employee/salary";
    var getcount = 2;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithHoliday/20000", "none", false, function () {
        !--getcount && phase();
    });
    var m = $('table.unit-top > tbody > tr > td > a.u-s').first().attr('href').match(/\/class=(\d+)\//);
    var nvClass = m == null ? 0 : numberfy(m[1]);
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithHoliday/class=" + nvClass + "/type=0", "none", false, function () {
        !--getcount && phase();
    });
    function phase() {
        xGet(url, "employees", false, function () {
            logDebug("XioHoliday: ", mapped);
            var employees = mapped[url];
            // TODO: общую ффункцию запилить для парсинга и везде вставить!
            var subids = $(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get();
            var $tds = $(".unit-list-2014 tr:gt(0) td:nth-child(2)");
            // проставляет эффективность рабочих на страницу юнитов
            for (var i = 0; i < employees.id.length; i++) {
                var index = subids.indexOf(employees.id[i]);
                if (index < 0)
                    continue;
                var eff = employees.efficiency[i];
                var text = eff === "" ? "Holiday" : eff;
                var color = text === "Holiday" ? "blue" : eff === "100.00 %" ? "green" : "red";
                $tds.eq(index).append("<br><span style='color:" + color + ";'>" + text + "</span>");
            }
        });
    }
}
function XioOverview() {
    // TODO: переписать построение селектов и их инициализацию
    var unitsTable = $(".unit-list-2014");
    //  задаем стили для строк
    var trOddCss = { backgroundColor: "lightgoldenrodyellow" }; // четная
    var trEvenCss = { backgroundColor: "" }; // нечетная
    var trSelectedCss = { backgroundColor: "rgb(255, 210, 170)" }; // тыкнули мышкой
    // скрыть все колонки кроме Город, Подразделение
    unitsTable.find("td, th").filter(":not(:nth-child(2)):not(:nth-child(3)):not(:nth-child(8))").addClass("XioHide").hide();
    unitsTable.find("tr.odd").css(trOddCss);
    // удалить размер подразделения под названием юнита
    unitsTable.find("td:nth-child(3) span").remove();
    unitsTable.css("white-space", "nowrap").css("user-select", "none");
    // переносим сами комментарии в тот же ряд где и имя юнита в тот же див. и удаляем лишние tr нафиг
    var $comments = unitsTable.find("tr.unit_comment");
    for (var i = 0; i < $comments.length; i++) {
        var notetext = $comments.eq(i).find("span").text();
        $comments.eq(i).prev().addClass("wborder").find("td:nth-child(3)").append("<div class=st><span style='max-width:300px;'>" + notetext + "</span></div>");
    }
    $comments.remove();
    // формируем список всех груп для политик. надо ниже
    var groups = [];
    for (var key in policyJSON) {
        if (groups.indexOf(policyJSON[key].group) < 0)
            groups.push(policyJSON[key].group);
    }
    // кнопки FIRE ALL / Gen ALL
    var policyString = [];
    var groupString = [];
    var thstring = "<th class=XOhtml style=\"padding-right:5px\">\n                      <input type=button id=XioGeneratorPRO class='XioGo' value='Gen ALL' style='width:50%'>\n                      <input type=button id=XioFirePRO class='XioGo' value='FIRE ALL' style='width:50%' >\n                    </th>";
    // для каждой группы формируем кнопки в хедере
    for (var i = 0; i < groups.length; i++) {
        thstring += "<th policy-group=" + groups[i] + " class=XOhtml style='padding-right:5px'>\n                        <input type=button class='XioGo XioGroup' value=" + groups[i] + " style='width:100%'>\n                     </th>";
    }
    unitsTable.find("th:nth-child(7)").after(thstring);
    // сюда сложим все группы которые реально есть, остальное потом захайдим чтобы не засоряло эфир
    var existingGroups = [];
    // вставляем кнопки в каждую строку. generate/fire. и вставляем опции уже с настройками
    var unitRows = unitsTable.find("tr").not(".unit_comment");
    var subids = parseSubid(unitRows.get());
    var $td = unitRows.find("td.alerts");
    for (var i = 0; i < subids.length; i++) {
        var subid = subids[i];
        // словарь поможет быстро найти нужную политику для группы
        var unitOptions = loadOptions($realm, subid); // {} если не нашли опции
        var groupDict = {};
        for (var key in unitOptions) {
            var policy = policyJSON[key];
            if (groupDict[policy.group])
                throw new Error("неведомая хуйня но в одном юните две политики с одной группы политик.");
            groupDict[policy.group] = key;
            if (existingGroups.indexOf(policy.group) < 0)
                existingGroups.push(policy.group);
        }
        // кнопки файр и гер для юнита
        var tdStr = "<td class=XOhtml>\n                        <input type=button unit-id=" + subids[i] + " class='XioGo XioGenerator' value=Generate>\n                        <input type=button unit-id=" + subids[i] + " class='XioGo XioSub' value=" + subids[i] + ">\n                     </td>";
        // для сохраненных настроек юнита, выводим опции
        var emptyPolicy = { func: function () { }, save: [], order: [], name: "", group: "", wait: [] };
        for (var n = 0; n < groups.length; n++) {
            var policyKey = groupDict[groups[n]];
            if (policyKey)
                tdStr += buildContainerHtml(subid.toString(), policyKey, policyJSON[policyKey], false);
            else {
                emptyPolicy.group = groups[n];
                tdStr += buildContainerHtml("", "", emptyPolicy, true);
            }
        }
        $td.eq(i).after(tdStr);
        // проставляем сразу настройки политик
        for (var key in unitOptions) {
            var containerKey = subid + "-" + key;
            var container = unitsTable.find("td#" + containerKey);
            if (container.length !== 1)
                throw new Error("неведомая хуйня но два контейнера с одинаковым ключом.");
            else if (container.length === 0)
                throw new Error("неведомая хуйня но контейнер не нашли.");
            setOptions(container.get(0), unitOptions[key], false, policyJSON[key]);
        }
    }
    // хайдим колонки где нет селектов
    for (var i = 0; i < groups.length; i++) {
        if (existingGroups.indexOf(groups[i]) >= 0)
            continue;
        // не стал делать через index() ибо в таблице td != th. если чет поменялось все поедет.
        // td ищу тока XioEmpty намеренно. Ибо если он криво будет скрывать мы увидим, иначе скроет нужное
        unitsTable.find("th[policy-group=" + groups[i] + "]").hide();
        unitsTable.find("td.XioEmpty[policy-group=" + groups[i] + "]").hide();
    }
    // проставляем ширину кнопок ксио и селектов
    var ths = $("th.XOhtml[style]");
    for (var i = 0; i < ths.length; i++) {
        var $selects = unitsTable.find("td.XioContainer:nth-child(" + (10 + i) + ")").find(".XioChoice");
        var $inputs = unitsTable.find("th.XOhtml:nth-child(" + (9 + i) + ")").find("input");
        var wa = $selects.map(function (i, e) { return $(e).width(); }).get();
        var width = wa.concat([$inputs.width() + 16]).reduce(function (p, c) { return Math.max(p, c); });
        $selects.width(width);
        $inputs.width(width - 16);
    }
    // расширяем дивы чобы влазила широкая таблица когда дофига селектов
    $("#wrapper").width(unitsTable.width() + 80);
    $("#mainContent").width(unitsTable.width());
    // развешиваем события на элементы
    //
    // по нажатию левой кнопкой выделяем строку цветом и классом
    unitsTable.on("mousedown.XO", "tr.wborder", function (e) {
        // обрабатывать только левую кнопку
        if (e.which !== 1)
            return;
        var tron = $(this);
        var oldTron = unitsTable.find("tr.trXIO");
        // со старой строки убираем класс, и возвращаем назад стили
        if (oldTron.length) {
            oldTron.removeClass("trXIO");
            if (oldTron.hasClass("odd"))
                oldTron.css(trOddCss);
            else
                oldTron.css(trEvenCss);
        }
        // задаем цвет строки БЕЗ класса. Иначе при выделении строки штатные классы будут преобладать и будет херь
        tron.addClass("trXIO").css(trSelectedCss);
    });
    // смена значения в селекте
    unitsTable.on("change.XO", "select.XioChoice", function (e) {
        logDebug("select changed");
        var select = $(e.target);
        var container = select.closest("td.XioContainer");
        var policyKey = container.attr("policy-key");
        var subid = numberfy(container.attr("unit-id"));
        // формируем новые данные для политики на основании выбранных опций
        var newOptions = parseOptions(container.get(0), policyJSON);
        if (newOptions == null)
            throw new Error("неведомая хуйня но политика не спарсилась.");
        var dict = {};
        dict[policyKey] = newOptions;
        updateOptions($realm, subid, dict);
    });
    // жмак по кнопке GenerateAll
    unitsTable.on('click.XO', "#XioGeneratorPRO", function () { XioGenerator(subids); });
    // жмак по кнопке FireAll
    unitsTable.on('click.XO', "#XioFirePRO", function () { XioMaintenance(subids, []); });
    // generate отдельного юнита
    unitsTable.on('click.XO', ".XioGenerator", function () {
        var subid = numberfy($(this).attr("unit-id"));
        XioGenerator([subid]);
    });
    // жмак по кнопке в хедере колонки
    unitsTable.on('click.XO', ".XioGroup", function () {
        var allowedPolicies = $(this).val();
        XioMaintenance(subids, [allowedPolicies]);
    });
    // fire/subid кнопка юнита
    unitsTable.on('click.XO', ".XioSub", function (e) {
        var subid = numberfy($(this).attr("unit-id"));
        XioMaintenance([subid], []);
    });
}
function topManagerStats() {
    // убрал содержимое, нафиг не нужно
    var fName = arguments.callee.toString();
    logDebug("отключена: ", fName);
}
function preference(policies) {
    // когда мы находимся внутри юнита, загружает и отображает policies, то есть тока то что задано.
    // не задали ничего для простановки, и не будем ничо делать
    if (policies.length === 0)
        return false;
    // работать будем с конкретным юнитом в котором находимся
    var subidRx = document.URL.match(/(view\/?)\d+/);
    if (subidRx == null)
        return false;
    var subid = numberfy(subidRx[0].split("/")[1]);
    if (subid === 0)
        throw new Error("\u043D\u0435 \u0448\u043C\u0430\u0433\u043B\u0430 \u0438\u0437\u0432\u043B\u0435\u0447\u044C subid \u0438\u0437 url:" + document.URL);
    // место под комбобоксы настроек
    var $topblock = $("div.metro_header");
    $topblock.append("<table id=XMoptions style='font-size: 14px; color:gold;'>\n                        <tr id=XMHead></tr>\n                        <tr id=XMOpt></tr>\n                      </table>");
    var headstring = "";
    var htmlstring = "";
    // формируем селекты под опции
    for (var i = 0; i < policies.length; i++) {
        var policyKey = policies[i];
        var policy = policyJSON[policyKey];
        headstring += "<td>" + policy.group + "</td>";
        htmlstring += buildContainerHtml(subid.toString(), policyKey, policy);
    }
    $("#XMHead").html(headstring);
    $("#XMOpt").html(htmlstring);
    // проставляем настройки политик
    var parsedDict = loadOptions($realm, subid);
    for (var i = 0; i < policies.length; i++) {
        var policyKey = policies[i];
        var policy = policyJSON[policyKey];
        var containerKey = subid + "-" + policyKey;
        var container = $topblock.find("td#" + containerKey);
        if (container.length === 0)
            throw new Error("неведомая хуйня но не нашли контейнер для политики");
        // если для данной политики нет опций - не делаем ничо.
        if (parsedDict[policyKey] != null)
            setOptions(container.get(0), parsedDict[policyKey], false, policy);
    }
    ;
    if (policies.length) {
        var $selects = $("#XMoptions select");
        var wa = $selects.map(function (i, e) { return $(e).width(); }).get();
        var width = wa.concat([0]).reduce(function (p, c) { return Math.max(p, c); }); // находим макс ширину из всех элементов селектов
        $selects.width(width); // и ставим ее всем
        // TODO: нахуа ставить всем селектам одну ширину? Тока для одной группы надо а не всем группам. Брееед
        $("#XMoptions").before("<input type=button id=XioFire value=FIRE!>");
    }
    // TODO: тут не понимаю почему группы, но дальше будет видно когда буду браться за метод майнтаненс
    var policyNames = policies.map(function (item, i, arr) { return policyJSON[item].group; });
    $("#XioFire").click(function () { return XioMaintenance([subid], policyNames); });
    $("#XMoptions").on("change.XO", "select.XioChoice", function (e) {
        logDebug("select changed");
        var select = $(e.target);
        var container = select.closest("td.XioContainer");
        var policyKey = container.attr("policy-key");
        var subid = numberfy(container.attr("unit-id"));
        // формируем новые данные для политики на основании выбранных опций
        var newOptions = parseOptions(container.get(0), policyJSON);
        if (newOptions == null)
            throw new Error("неведомая хуйня но политика не спарсилась.");
        var dict = {};
        dict[policyKey] = newOptions;
        updateOptions($realm, subid, dict);
    });
    return true;
}
function preferencePages(html, url) {
    // по урлу страницы возвращает policyKey который к ней относится
    // TODO: можно оптимизировать запросы к дом.
    var $html = $(html);
    var saleRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/sale$");
    var supplyRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/supply$");
    var tradingHallRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/trading_hall$");
    var unitMainRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+$");
    var adRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/virtasement$");
    var technologyRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/technology$");
    var reseachRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/investigation$");
    //Production Sale page
    if (saleRx.test(url) &&
        $html.find(".list_sublink").length === 0 &&
        $html.find("[href$=delivery]").length === 0) {
        return ["pp", "ps"];
    }
    else if (saleRx.test(url) &&
        $html.find(".list_sublink").length === 0) {
        return ["pw", "pn"];
    }
    else if (supplyRx.test(url) &&
        $html.find(".add_contract").length === 0 &&
        $html.find("[name=productCategory]").length === 0) {
        return ["sp"];
    }
    else if (supplyRx.test(url) &&
        $html.find(".add_contract").length === 0) {
        return ["sr"];
    }
    else if (supplyRx.test(url)) {
        return ["sh"];
    }
    else if (tradingHallRx.test(url)) {
        return ["pt"];
    }
    else if (unitMainRx.test(url) &&
        $("[name=unit_cancel_build]").length === 0 &&
        $html.find("[href$=delivery]").length === 0) {
        var policyArray = [];
        //salary
        if ($html.find("a[href*='/window/unit/employees/engage/']").length) {
            //New Interface
            // TODO: нах убрал новый интерфейс какой то. оставляем только один. иначе глючит потом. 
            policyArray.push("es");
            //if ($html.find(".fa-users").length) {
            //    policyArray.push("en");
            //}
            //else {
            //    policyArray.push("es");
            //}
            //training
            policyArray.push("et");
        }
        if ($html.find("a[href$='/holiday_set']").length || $html.find("a[href$='/holiday_unset']").length) {
            //Has stock holiday
            if ($html.find("a[href$=supply]").length) {
                policyArray.push("ep");
            }
            else {
                policyArray.push("eh");
            }
        }
        //Has Equipment
        if ($html.find(".fa-cogs").length || $html.find("[href*='/window/unit/equipment/']").length) {
            policyArray.push("qm");
        }
        //Has Solar Panels
        if (/workshop/.test($html.find("#unitImage img").attr("src"))) {
            policyArray.push("pb");
        }
        //has politic agitation
        if (/villa/.test($html.find("#unitImage img").attr("src"))) {
            policyArray.push("pa");
        }
        if ($html.find("form[name='servicePriceForm']") && $html.find("a[href$='/consume']").length) {
            //service with stock
            policyArray.push("sc");
        }
        else if ($html.find("form[name='servicePriceForm']") &&
            $html.find("a[href$='/virtasement']").length &&
            !$html.find("a[href$='/supply']").length &&
            !$html.find("a[href$='/sale']").length &&
            !$html.find("a[href$='/units']").length) {
            //service without stock
            policyArray.push("sl");
        }
        else if ($html.find("form[name='servicePriceForm']") &&
            $html.find("a[href$='/sale']").length &&
            $html.find("a[href$='/technology']").length &&
            !$html.find("a[href$='/supply']").length &&
            !$html.find("a[href$='/units']").length) {
            //Incinerator
            policyArray.push("ee");
        }
        return policyArray;
    }
    else if (unitMainRx.test(url) &&
        !$("[name=unit_cancel_build]").length &&
        $html.find("[href$=delivery]").length) {
        return ["wz"];
    }
    else if (adRx.test(url) && !$html.find("#productAdvert").length) {
        return ["ad"];
    }
    else if (technologyRx.test(url)) {
        return ["tc"];
    }
    else if (new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/investigation$").test(url)) {
        return ["rs"];
    }
    else {
        return [];
    }
}
// вообще не пойму нахер это надо. какой то атавизм
//let XJSON: any;
var xPrefPages = function () { return []; };
//if (typeof XJSON === "undefined") {
//    XJSON = {};
//    xPrefPages = function () { return [] };
//}
//else {
//    for (var key in XJSON) {
//        policyJSON[key] = XJSON[key];
//    }
//}
function XioScript() {
    // стартовая функция
    //determines which functions to run;
    console.log("XioScript 12 is running!");
    //page options
    if ($(".pager_options").length > 0) {
        $(".pager_options").append($(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "1000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "2000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "4000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "10000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "20000"));
    }
    // проверяем что мы на странице предприятий вообще
    if ($(".tabu > .sel > a").length === 0) {
        console.log("Находимся не на странице с юнитами. Конец.");
        return false;
    }
    //Not user company
    //unit list
    if ($(".tabu > .sel > a").attr("href").replace("/unit_list", "/dashboard") !== $(".dashboard a").attr("href")) {
        //unit page
        if ($(".officePlace a").attr("href") + "/dashboard" !== $(".dashboard a").attr("href")) {
            console.log("Not user company");
            return false;
        }
    }
    //Building
    if (new RegExp("\/.*\/main\/unit\/create\/[0-9]+").test(document.URL)) {
        console.log("Вкладка строительства. Конец.");
        buildingShortener();
    }
    //Unit list	
    var unitsRx = new RegExp("\/.*\/main\/company\/view\/[0-9]+\/unit_list(\/xiooverview)?$");
    var xoRx = new RegExp("\/.*\/main\/company\/view\/[0-9]+\/unit_list\/xiooverview$");
    if (unitsRx.test(document.URL)) {
        console.log("Unit list");
        $("div.metro_header").append("<div style='font-size: 24px; color:gold; margin-bottom: 5px;'>XioScript " + version + "</div>"
            + "<input type=button id=XM class=XioGo value=XioMaintenance>"
            + "<input type=button id=XO value=XioOverview>"
            + "<input type=button id=XE class=XioGo value=Export>"
            + "<input type=button id=XI class=XioGo value=Import>");
        $("#XM").click(function () { return XioMaintenance([], []); });
        $("#XO").click(function () {
            if (xoRx.test(document.URL))
                window.location.href = window.location.href.slice(0, -12);
            else
                window.location.href = window.location.href + "/xiooverview";
        });
        $("#XE").click(function () { return XioExport(); });
        $("#XI").click(function () { return XioImport(); });
        if (xoRx.test(document.URL)) {
            XioHoliday();
            XioOverview();
        }
    }
    //Top Manager
    //if (new RegExp("\/.*\/main\/unit\/view\/[0-9]+$").test(document.URL) &&
    //    (!$(".fa-users").length || !$("[href*='/window/unit/employees/engage/']").length)) {
    //    console.log("Top Manager");
    //    topManagerStats();
    //}
    //Preferences выводим для юнита если мы в юните
    var policies = preferencePages($(document), document.URL).concat(xPrefPages($(document), document.URL));
    preference(policies);
    return true;
}
// запуск вешаем на событие
$(document).ready(function () { return XioScript(); });
//document.onreadystatechange(new ProgressEvent("XioLoad")); 
//# sourceMappingURL=XioScript.user.js.map