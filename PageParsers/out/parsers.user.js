var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
// ==UserScript==
// @name           parsers
// @namespace      
// @description    parsers
// @version        12.1.1
// @include        https://virtonomica.ru/*/*
// ==/UserScript== 
//
// Свои исключения
// 
var ArgumentError = (function (_super) {
    __extends(ArgumentError, _super);
    function ArgumentError(argument, message) {
        var msg = argument + ". " + message;
        _super.call(this, msg);
    }
    return ArgumentError;
}(Error));
var ArgumentNullError = (function (_super) {
    __extends(ArgumentNullError, _super);
    function ArgumentNullError(argument) {
        var msg = argument + " is null";
        _super.call(this, msg);
    }
    return ArgumentNullError;
}(Error));
var ParseError = (function (_super) {
    __extends(ParseError, _super);
    function ParseError(dataName, url, innerError) {
        var msg = "Error parsing " + dataName;
        if (url)
            msg += "from " + url;
        // TODO: как то плохо работает. не выводит нихрена сообщений.
        msg += ".";
        if (innerError)
            msg += "\n" + innerError.message + ".";
        _super.call(this, msg);
    }
    return ParseError;
}(Error));
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
$ = jQuery = jQuery.noConflict(true);
var $xioDebug = true;
var urlTemplates = {
    manager: [/\/\w+\/main\/user\/privat\/persondata\/knowledge\/?$/ig, parseManager],
    unitMain: [/\/\w+\/main\/unit\/view\/\d+\/?$/gi, parseUnitMain],
    ads: [/\/\w+\/main\/unit\/view\/\d+\/virtasement\/?$/ig, parseAds],
    salary: [/\/\w+\/window\/unit\/employees\/engage\/\d+\/?$/ig, parseSalary],
    unitList: [/\/\w+\/main\/company\/view\/\d+\/unit_list\/?$/ig, parseUnitList],
    sale: [/\/\w+\/main\/unit\/view\/\d+\/sale$\/?/ig, parseSale],
    wareSize: [/\/\w+\/window\/unit\/upgrade\/\d+\/?$/ig, parseWareSize],
    wareMain: [/\/\w+\/main\/unit\/view\/\d+\/?$/, parseWareMain],
    productReport: [/\/\w+\/main\/globalreport\/marketing\/by_products\/\d+\/?$/ig, parseProductReport],
    employees: [/\/\w+\/main\/company\/view\/\w+\/unit_list\/employee\/salary\/?$/ig, parseEmployees],
};
$(document).ready(function () { return parseStart(); });
function parseStart() {
    var href = window.location.href;
    var url = window.location.pathname;
    logDebug("url: ", href);
    var realm = getRealm(href);
    logDebug("realm: ", realm);
    if (realm == null)
        throw new Error("realm не найден.");
    for (var key in urlTemplates) {
        if (urlTemplates[key][0].test(url)) {
            var obj = urlTemplates[key][1]($("html").html(), url);
            logDebug("parsed " + key + ": ", obj);
        }
    }
}
function logDebug(msg) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    if (!$xioDebug)
        return;
    if (args.length === 0)
        console.log(msg);
    else
        console.log(msg, args);
}
/**
 * Проверяет что элемент есть в массиве.
 * @param item
 * @param arr массив НЕ null
 */
function isOneOf(item, arr) {
    return arr.indexOf(item) >= 0;
}
/**
 * Оцифровывает строку. Возвращает всегда либо Number.POSITIVE_INFINITY либо 0
 * @param variable любая строка.
 */
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
/**
 * из урла  извлекает имя риалма.
 * @param url
 */
function getRealm(url) {
    // https://*virtonomic*.*/*/main/globalreport/marketing/by_trade_at_cities/*
    // https://*virtonomic*.*/*/window/globalreport/marketing/by_trade_at_cities/*
    var rx = new RegExp(/https:\/\/virtonomica\.ru\/([a-zA-Z]+)\/.+/ig);
    var m = rx.exec(url);
    if (m == null)
        return null;
    return m[1];
}
//
// Сюда все функции которые парсят данные со страниц
//
/**
 * Пробуем оцифровать данные но если они выходят как Number.POSITIVE_INFINITY или 0, валит ошибку
 * @param value строка являющая собой число больше 0
 */
function numberfyOrError(value) {
    var n = numberfy(value);
    if (n === Number.POSITIVE_INFINITY || n === 0)
        throw new RangeError("Должны получить число > 0");
    return n;
}
/**
 * Возвращает ТОЛЬКО текст элемента БЕЗ его наследников
 * @param el
 */
function getInnerText(el) {
    return $(el).clone().children().remove().end().text();
}
/**
 * Из набора HTML элементов представляющих собой tr парсит subid. Ряды должны быть стандартного формата.
 */
function parseSubid(trList) {
    if (trList == null)
        throw new ArgumentNullError("trList");
    var f = function (i, e) { return numberfyOrError($(e).text()); };
    return $(trList).find("td.unit_id").map(f).get();
}
/**
 * Берет локальное хранилище и тащит оттуда все записи по юнитам. возвращает subid
 */
function parseAllSavedSubid(realm) {
    if (!realm || realm.length === 0)
        throw new ArgumentNullError("realm");
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
/**
 * Парсит id компании со страницы
 */
function getCompanyId() {
    var m = $(".dashboard a").attr("href").match(/\d+/);
    if (m == null)
        throw new ParseError("company id");
    return numberfy(m[0]);
}
/**
 * Парсинг главной страницы с юнитами.
 * @param html
* @param url
 */
function parseUnitList(html, url) {
    var $html = $(html);
    try {
        var $rows = $html.find(".unit-list-2014").find("tr").not(".unit_comment");
        //let _subids = $unitList.find("td:nth-child(1)").not(".unit_comment").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
        var _subids = $rows.find("td:nth-child(1)").map(function (i, e) { return numberfyOrError($(e).text()); }).get();
        var _type = $rows.find("td:nth-child(3)").map(function (i, e) {
            var s = $(e).attr("class").split("-")[1];
            if (s == null)
                throw new RangeError("class attribute doesn't contains type part.");
            return s;
        }).get();
        return { subids: _subids, type: _type };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}
/**
 * Парсит "/main/unit/view/ + subid + /sale" урлы
 * @param html
 * @param url
 */
function parseSale(html, url) {
    var $html = $(html);
    try {
        var $rows = $html.find("table.grid").find("tr.even, tr.odd");
        // помним что на складах есть позиции без товаров и они как бы не видны по дефолту в продаже, но там цена 0 и есть политика сбыта.
        var _form = $html.find("[name=storageForm]");
        // может быть -1 если вдруг ничего не выбрано в селекте, что маовероятно
        var _policy = $rows.find("select:nth-child(3)").map(function (i, e) { return $(e).find("[selected]").index(); }).get();
        var _price = $rows.find("input.money:nth-child(1)").map(function (i, e) { return numberfy($(e).val()); }).get();
        var _incineratorMaxPrice = $html.find('span[style="COLOR: green;"]').map(function (i, e) { return numberfy($(e).text()); }).get();
        var stockIndex = $html.find("table.grid").find("th:contains('На складе')").index();
        var $stockTd = $rows.children("td:nth-child(" + (stockIndex + 1) + ")");
        var _stockamount = $stockTd.find("tr:nth-child(1)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        var _stockqual = $stockTd.find("tr:nth-child(2)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        var _stockprime = $stockTd.find("tr:nth-child(3)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        // относится к производству. для складов тупо редиректим на ячейку со складом. Будет одно и то же для склада и для выхода.
        var outIndex = $html.find("table.grid").find("th:contains('Выпуск')").index();
        var $outTd = outIndex >= 0 ? $rows.children("td:nth-child(" + (outIndex + 1) + ")") : $stockTd;
        var _outamount = $outTd.find("tr:nth-child(1)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        var _outqual = $outTd.find("tr:nth-child(2)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        var _outprime = $outTd.find("tr:nth-child(3)").find("td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        // название продукта Спортивное питание, Маточное молочко и так далее
        var _product = $rows.find("a:not([onclick])").map(function (i, e) {
            var t = $(e).text();
            if (t.trim() === "")
                throw new Error("product name is empty");
            return t;
        }).get();
        // номер продукта
        var _productId = $rows.find("a:not([onclick])").map(function (i, e) {
            var m = $(e).attr("href").match(/\d+/);
            if (m == null)
                throw new Error("product id not found.");
            return numberfyOrError(m[0]);
        }).get();
        // "Аттика, Македония, Эпир и Фессалия"
        var _region = $html.find(".officePlace a:eq(-2)").text();
        if (_region.trim() === "")
            throw new Error("region not found");
        // если покупцов много то появляется доп ссылка на страницу с контрактами. эта херь и говорит есть она или нет
        var _contractpage = !!$html.find(".tabsub").length;
        // TODO: сделать чтобы контракты были вида [товар, [линк на юнит, цена контракта]]. Тогда тупо словарь удобный для работы а не текущая хуйня
        // данное поле существует только если НЕТ ссылки на контракты то есть в простом случае и здесь может быть такой хуйня
        // ["Молоко", "$1.41", "$1.41", "$1.41", "Мясо", "$5.62"]
        // идет категория, потом цены покупателей, потом снова категория и цены. И как бы здесь нет порядка
        // Если покупателей нет, гарантируется пустой массив!
        var _contractprice = ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) {
            return e[0] === "[" ? e.slice(13, -1) : numberfy(e);
        });
        return {
            form: _form,
            policy: _policy,
            price: _price,
            incineratorMaxPrice: _incineratorMaxPrice,
            outamount: _outamount,
            outqual: _outqual,
            outprime: _outprime,
            stockamount: _stockamount,
            stockqual: _stockqual,
            stockprime: _stockprime,
            product: _product,
            productId: _productId,
            region: _region,
            contractpage: _contractpage,
            contractprice: _contractprice
        };
    }
    catch (err) {
        throw new ParseError("sale", url, err);
    }
}
/**
 * Парсит страницы вида "/main/unit/view/ + subid + /sale/product", а так же
 * "/main/unit/view/" + subid + "/sale/product/ + productId"
 * @param html
 * @param url
 */
function parseSaleContracts(html, url) {
    var $html = $(html);
    // слегка дибильный подход. В объекте мы имеем цены покупцов для одной категории по url, но список категорий 
    // каждый раз забираем весь.
    // TODO: перепилить. Сделать контракт как {url:string, ИмяТовара:string, prices: number[]} 
    // итоговая структура будет выглядеть так 
    /* $mapped[subid/sale/product] = {
            categories: string[];  - список урлов категорий
        }
        а далее
        $mapped[subid/sale/product/prodId] = {
            prodName: string; - строковое имя продукта
            buyerPrices: number[]; - массив цен покупцов данного товара
        }

        аналогично делать ISale. Вместо хуйни с string|number вставить туда сразу свойство
        contracts: IDictionary<ISaleContract> содержащее инфу по всем товарам. ключом будет productId или его урл
    */
    try {
        // каждая категория представляет товар который продается со склада или производства. По факту берем ссыль через которую
        // попадаем на список покупателей товара.
        // если покупцов товара НЕТ, тогда данной категории не будет. То есть не может быть пустая категория
        var _categorys = $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get();
        // здесь уже есть четкая гарантия что резалт будет вида 
        // ["Медицинский инструментарий", 534.46, 534.46, 534.46, 534.46]
        // то есть первым идет название а потом цены покупателей
        var _contractprices = ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e); });
        return { category: _categorys, contractprice: _contractprices };
    }
    catch (err) {
        throw new ParseError("sale contracts", url, err);
    }
}
/**
 * Парсинг данных по страницы /main/unit/view/8004742/virtasement
 * @param html
 * @param url
 */
function parseAds(html, url) {
    var $html = $(html);
    try {
        // известность
        var _celebrity = numberfy($html.find(".infoblock tr:eq(0) td:eq(1)").text());
        // население города
        var _pop = (function () {
            var m = $html.find("script").text().match(/params\['population'\] = \d+/);
            if (m == null)
                throw new Error("population number not found.");
            return numberfy(m[0].substring(23));
        })();
        // текущий бюджет, он может быть и 0
        var _budget = numberfy($html.find(":text:not([readonly])").val());
        // бюжет на поддержание известности
        // ["не менее ©110.25  в неделю для ТВ-рекламы"] здесь может быть и $110.25
        // данный бюжет тоже может быть 0 если известность 0
        var _requiredBudget = numberfy($html.find(".infoblock tr:eq(1) td:eq(1)").text().split(/[$©]/g)[1]);
        //if (_celebrity > 0 && _requiredBudget === 0)  такое может быть при хреновой известности
        //    throw new Error("required budget can't be 0 for celebrity" + _celebrity);
        return {
            celebrity: _celebrity,
            pop: _pop,
            budget: _budget,
            requiredBudget: _requiredBudget
        };
    }
    catch (err) {
        throw new ParseError("ads", url, err);
    }
}
/**
 * Парсим данные  с формы зарплаты /window/unit/employees/engage/" + subid
 * @param html
 * @param url
 */
function parseSalary(html, url) {
    var $html = $(html);
    try {
        var _form = $html.filter("form");
        var _employees = numberfy($html.find("#quantity").val());
        var _maxEmployees = numberfy($html.find("tr.even:contains('Максимальное количество')").find("td.text_to_left").text());
        if (_maxEmployees <= 0)
            throw new RangeError("Макс число рабов не может быть 0.");
        var _salaryNow = numberfy($html.find("#salary").val());
        var _salaryCity = numberfyOrError($html.find("tr:nth-child(3) > td").text().split(/[$©]/g)[1]);
        var _skillNow = numberfy($html.find("#apprisedEmployeeLevel").text());
        var _skillCity = (function () {
            var m = $html.find("div span[id]:eq(1)").text().match(/[0-9]+(\.[0-9]+)?/);
            if (m == null)
                throw new Error("city skill not found.");
            return numberfyOrError(m[0]);
        })();
        var _skillReq = (function () {
            var m = $html.find("div span[id]:eq(1)").text().split(",")[1].match(/(\d|\.)+/);
            if (m == null)
                throw new Error("skill req not found.");
            return numberfy(m[0]);
        })();
        return {
            form: _form,
            employees: _employees,
            maxEmployees: _maxEmployees,
            salaryNow: _salaryNow,
            salaryCity: _salaryCity,
            skillNow: _skillNow,
            skillCity: _skillCity,
            skillReq: _skillReq
        };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}
/**
 * /main/user/privat/persondata/knowledge
 * @param html
 * @param url
 */
function parseManager(html, url) {
    var $html = $(html);
    try {
        // бонусной херни не всегда может быть поэтому надо заполнять руками
        var stats = (function () {
            var jq = $html.find("tr.qual_item").find("span.mainValue");
            if (jq.length === 0)
                throw new Error("top stats not found");
            // не может быть 0
            var main = jq.map(function (i, e) { return numberfyOrError($(e).text()); }).get();
            // может быть 0. иногда бонусного спана совсем нет
            var bonus = jq.map(function (i, e) {
                var bonusSpan = $(e).next("span.bonusValue");
                if (bonusSpan.length === 0)
                    return 0;
                return numberfy(bonusSpan.text());
            }).get();
            return [main, bonus];
        })();
        var _base = stats[0];
        var _bonus = stats[1];
        var _pic = $html.find(".qual_item img").map(function (i, e) { return $(e).attr("src"); }).get();
        if (_base.length !== _bonus.length || _base.length !== _pic.length)
            throw new Error("что то пошло не так. массивы разной длины");
        return {
            base: _base,
            bonus: _bonus,
            pic: _pic
        };
    }
    catch (err) {
        throw new ParseError("top manager", url, err);
    }
}
/**
 * /main/unit/view/ + subid
 * @param html
 * @param url
 */
function parseUnitMain(html, url) {
    var $html = $(html);
    try {
        var newInterf = $html.find(".unit_box").length > 0;
        if (newInterf) {
            var _employees = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(0) td:eq(1)").text());
            var _salaryNow = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(2) td:eq(1)").text());
            var _salaryCity = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(3) td:eq(1)").text());
            var _skillNow = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(4) td:eq(1)").text());
            var _skillReq = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(5) td:eq(1)").text());
            // TODO: в новом интерфейсе не все гладко. проверить как оборудование ищет
            var _equipNum = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(0) td:eq(1)").text());
            var _equipMax = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(1) td:eq(1)").text());
            var _equipQual = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(2) td:eq(1)").text());
            var _equipReq = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(3) td:eq(1)").text());
            var _equipWearBlack = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1)").text().split("(")[1]);
            var _equipWearRed = $html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1) span").length === 1;
            var _managerPic = $html.find(".unit_box:has(.fa-user) ul img").attr("src");
            var _qual = numberfy($html.find(".unit_box:has(.fa-user) tr:eq(1) td:eq(1)").text());
            var _techLevel = numberfy($html.find(".unit_box:has(.fa-industry) tr:eq(3) td:eq(1)").text());
            // общее число подчиненных по профилю
            var _totalEmployees = numberfy($html.find(".unit_box:has(.fa-user) tr:eq(2) td:eq(1)").text());
            var _img = $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0];
            var _size = numberfy($html.find("#unitImage img").attr("src").split("_")[1]);
            var _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;
            var _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;
            var _onHoliday = !!$html.find("[href$=unset]").length;
            var _isStore = !!$html.find("[href$=trading_hall]").length;
            var _departments = numberfy($html.find("tr:contains('Количество отделов') td:eq(1)").text());
            var _visitors = numberfy($html.find("tr:contains('Количество посетителей') td:eq(1)").text());
            return {
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesReq: -1,
                salaryNow: _salaryNow,
                salaryCity: _salaryCity,
                skillNow: _skillNow,
                skillCity: -1,
                skillReq: _skillReq,
                equipNum: _equipNum,
                equipMax: _equipMax,
                equipQual: _equipQual,
                equipReq: _equipReq,
                equipBroken: -1,
                equipWearBlack: _equipWearBlack,
                equipWearRed: _equipWearRed,
                managerPic: _managerPic,
                qual: _qual,
                techLevel: _techLevel,
                img: _img,
                size: _size,
                hasBooster: _hasBooster,
                hasAgitation: _hasAgitation,
                onHoliday: _onHoliday,
                isStore: _isStore,
                departments: _departments,
                visitors: _visitors
            };
        }
        else {
            var rxFloat_1 = new RegExp(/\d+\.\d+/g);
            var rxInt_1 = new RegExp(/\d+/g);
            var $block_1 = $html.find("table.infoblock");
            // Количество рабочих. может быть 0 для складов.
            var empl = (function () {
                // Возможные варианты для рабочих будут
                // 10(требуется ~ 1)
                // 10(максимум:1)
                // 10 ед. (максимум:1) это уже не включать
                // 1 000 (максимум:10 000) пробелы в числах!!
                var types = ["сотрудников", "работников", "учёных", "рабочих"];
                var res = [-1, -1];
                //let emplRx = new RegExp(/\d+\s*\(.+\d+.*\)/g);
                //let td = jq.next("td").filter((i, el) => emplRx.test($(el).text()));
                var jq = $block_1.find("td.title:contains('Количество')").filter(function (i, el) {
                    return types.some(function (t, i, arr) { return $(el).text().indexOf(t) >= 0; });
                });
                if (jq.length !== 1)
                    return res;
                // например в лаборатории будет находить вместо требований, так как их нет, макс число рабов в здании
                var m = jq.next("td").text().replace(/\s*/g, "").match(rxInt_1);
                if (!m || m.length !== 2)
                    return res;
                return [parseFloat(m[0]), parseFloat(m[1])];
            })();
            var _employees = empl[0];
            var _employeesReq = empl[1];
            // общее число подчиненных по профилю
            var _totalEmployees = numberfy($block_1.find("td:contains('Суммарное количество подчинённых')").next("td").text());
            var salary = (function () {
                //let rx = new RegExp(/\d+\.\d+.+в неделю\s*\(в среднем по городу.+?\d+\.\d+\)/ig);
                var jq = $block_1.find("td.title:contains('Зарплата')").next("td");
                if (jq.length !== 1)
                    return ["-1", "-1"];
                var m = jq.text().replace(/\s*/g, "").match(rxFloat_1);
                if (!m || m.length !== 2)
                    return ["-1", "-1"];
                return m;
            })();
            var _salaryNow = numberfy(salary[0]);
            var _salaryCity = numberfy(salary[1]);
            var skill = (function () {
                var jq = $block_1.find("td.title:contains('Уровень квалификации')").next("td");
                if (jq.length !== 1)
                    return ["-1", "-1", "-1"];
                // возможные варианты результата
                // 10.63 (в среднем по городу 9.39, требуется по технологии 6.74)
                // 9.30(в среднем по городу 16.62 )
                var m = jq.text().match(rxFloat_1);
                if (!m || m.length < 2)
                    return ["-1", "-1", "-1"];
                return [m[0], m[1], m[2] || "-1"];
            })();
            var _skillNow = numberfy(skill[0]);
            var _skillCity = numberfy(skill[1]);
            var _skillReq = numberfy(skill[2]); // для лаб требования может и не быть
            var equip = (function () {
                var res = [-1, -1, -1, -1, -1, -1, -1];
                // число оборудования тупо не ищем. гемор  не надо
                // качество оборудования и треб по технологии
                var jq = $block_1.find("td.title:contains('Качество')").next("td");
                if (jq.length === 1) {
                    // 8.40 (требуется по технологии 1.00)
                    // или просто 8.40 если нет требований
                    var m = jq.text().match(rxFloat_1);
                    if (m && m.length > 0) {
                        res[2] = parseFloat(m[0]) || -1;
                        res[3] = parseFloat(m[1]) || -1;
                    }
                }
                // красный и черный и % износа
                // 1.28 % (25+1 ед.)
                // 0.00 % (0 ед.)
                var types = ["Износ", "Здоровье"];
                jq = $block_1.find("td.title").filter(function (i, el) {
                    return types.some(function (t, i, arr) { return $(el).text().indexOf(t) >= 0; });
                });
                if (jq.length === 1) {
                    var rx = new RegExp(/(\d+\.\d+)\s*%\s*\((\d+)(?:\+(\d+))*.*\)/ig);
                    var m = rx.exec(jq.next("td").text());
                    if (m) {
                        // первым идет сама исходная строка
                        res[4] = parseFloat(m[1]); // 0  или float.
                        res[5] = parseInt(m[2]); // 0 или целое
                        res[6] = parseInt(m[3]) || -1; // красного может не быть будет undefined
                    }
                }
                return res;
            })();
            var _equipNum = equip[0];
            var _equipMax = equip[1];
            var _equipQual = equip[2];
            var _equipReq = equip[3];
            // % износа или здоровье животных для ферм.
            var _equipBroken = equip[4];
            // кол-во черного оборудования
            var _equipWearBlack = equip[5];
            // есть ли красное оборудование или нет
            var _equipWearRed = equip[6] > 0;
            var _managerPic = "";
            var _qual = (function () {
                var jq = $block_1.find("td.title:contains('Квалификация игрока')").next("td");
                if (jq.length !== 1)
                    return -1;
                return numberfy(jq.text());
            })();
            var _techLevel = (function () {
                var jq = $block_1.find("td.title:contains('Уровень технологии')").next("td");
                if (jq.length !== 1)
                    return -1;
                return numberfy(jq.text());
            })();
            var _img = $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0];
            var _size = numberfy($html.find("#unitImage img").attr("src").split("_")[1]);
            //  есть ли возможность вкорячить бустер производства типо солнечных панелей или нет. если не занято то втыкает
            var _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;
            // хз что это вообще
            var _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;
            var _onHoliday = !!$html.find("[href$=unset]").length;
            var _isStore = !!$html.find("[href$=trading_hall]").length;
            var _departments = numberfy($html.find("tr:contains('Количество отделов') td:eq(1)").text()) || -1;
            var _visitors = numberfy($html.find("tr:contains('Количество посетителей') td:eq(1)").text()) || -1;
            return {
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesReq: _employeesReq,
                salaryNow: _salaryNow,
                salaryCity: _salaryCity,
                skillNow: _skillNow,
                skillCity: _skillCity,
                skillReq: _skillReq,
                equipNum: _equipNum,
                equipMax: _equipMax,
                equipQual: _equipQual,
                equipReq: _equipReq,
                equipBroken: _equipBroken,
                equipWearBlack: _equipWearBlack,
                equipWearRed: _equipWearRed,
                managerPic: _managerPic,
                qual: _qual,
                techLevel: _techLevel,
                img: _img,
                size: _size,
                hasBooster: _hasBooster,
                hasAgitation: _hasAgitation,
                onHoliday: _onHoliday,
                isStore: _isStore,
                departments: _departments,
                visitors: _visitors
            };
        }
    }
    catch (err) {
        throw new ParseError("unit main page", url, err);
    }
}
/**
 * Чисто размер складов вида https://virtonomica.ru/fast/window/unit/upgrade/8006972
 * @param html
 * @param url
 */
function parseWareSize(html, url) {
    var $html = $(html);
    try {
        var _size = $html.find(".nowrap:nth-child(2)").map(function (i, e) {
            var txt = $(e).text();
            var sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;
            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;
            return sz;
        }).get();
        var _rent = $html.find(".nowrap:nth-child(3)").map(function (i, e) { return numberfyOrError($(e).text()); }).get();
        var _id = $html.find(":radio").map(function (i, e) { return numberfyOrError($(e).val()); }).get();
        return {
            size: _size,
            rent: _rent,
            id: _id
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}
/**
 * Главная страница склада аналогично обычной главной юнита /main/unit/view/ + subid
 * @param html
 * @param url
 */
function parseWareMain(html, url) {
    var $html = $(html);
    try {
        if ($html.find("#unitImage img").attr("src").indexOf("warehouse") < 0)
            throw new Error("Это не склад!");
        var _size = $html.find(".infoblock td:eq(1)").map(function (i, e) {
            var txt = $(e).text();
            var sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;
            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;
            return sz;
        }).get();
        var _full = (function () {
            var f = $html.find("[nowrap]:eq(0)").text().trim();
            if (f === "")
                throw new Error("ware full not found");
            return numberfy(f);
        })();
        var _product = $html.find(".grid td:nth-child(1)").map(function (i, e) { return $(e).text(); }).get();
        var _stock = $html.find(".grid td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get();
        var _shipments = $html.find(".grid td:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get();
        return {
            size: _size,
            full: _full,
            product: _product,
            stock: _stock,
            shipments: _shipments
        };
    }
    catch (err) {
        throw new ParseError("ware main", url, err);
    }
}
/**
 * все продавцы данного продукта ВООБЩЕ /"+realm+"/main/globalreport/marketing/by_products/"+mapped[url].productId[i]
 * @param html
 * @param url
 */
function parseProductReport(html, url) {
    var $html = $(html);
    try {
        var $rows = $html.find(".grid").find("tr.odd, tr.even");
        // Макс ограничение на контракт. -1 если без.
        var _max = $rows.find("td.nowrap:nth-child(2)").map(function (i, e) {
            var $span = $(e).find("span");
            if ($span.length !== 1)
                return -1;
            return numberfy($span.text().split(":")[1]);
        }).get();
        // общее число на складе. может быть 0
        var _total = $rows.find("td.nowrap:nth-child(2)").map(function (i, e) {
            var txt = $(e).clone().children().remove().end().text().trim();
            if (txt.length === 0)
                throw new Error("total amount not found");
            return numberfy(txt);
        }).get();
        var _available = $rows.find("td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get();
        // не могут быть 0 по определению
        var _quality = $rows.find("td.nowrap:nth-child(4)").map(function (i, e) { return numberfyOrError($(e).text()); }).get();
        var _price = $rows.find("td.nowrap:nth-child(5)").map(function (i, e) { return numberfyOrError($(e).text()); }).get();
        // может быть независимый поставщик БЕЗ id. для таких будет -1 id
        var _subid = $rows.find("td:nth-child(1) td:nth-child(1)").map(function (i, e) {
            var jq = $(e).find("a");
            if (jq.length !== 1)
                return -1;
            var m = jq.attr("href").match(/\d+/);
            return numberfy(m ? m[0] : "-1");
        }).get();
        return {
            max: _max,
            total: _total,
            available: _available,
            quality: _quality,
            price: _price,
            subid: _subid
        };
    }
    catch (err) {
        throw new ParseError("product report", url, err);
    }
}
/**
 * "/"+realm+"/main/company/view/"+companyid+"/unit_list/employee/salary"
 * @param html
 * @param url
 */
function parseEmployees(html, url) {
    var $html = $(html);
    try {
        var $rows = $html.find("table.list").find(".u-c").map(function (i, e) { return $(e).closest("tr").get(); });
        var _id = $rows.find(":checkbox").map(function (i, e) { return numberfyOrError($(e).val()); }).get();
        // может быть 0 в принципе
        var _salary = $rows.find("td:nth-child(7)").map(function (i, e) {
            var txt = getInnerText(e).trim();
            if (txt.length === 0)
                throw new Error("salary not found");
            return numberfy(txt);
        }).get();
        // не может быть 0
        var _salaryCity = $rows.find("td:nth-child(8)").map(function (i, e) {
            var txt = getInnerText(e).trim(); // тут низя удалять ничо. внутри какой то инпут сраный и в нем текст
            if (txt.length === 0)
                throw new Error("salary city not found");
            return numberfyOrError(txt);
        }).get();
        // может быть 0
        var _skill = $rows.find("td:nth-child(9)").map(function (i, e) {
            var txt = $(e).text().trim(); // может быть a тег внутри. поэтому просто текст.
            if (txt.length === 0)
                throw new Error("skill not found");
            return numberfy(txt);
        }).get();
        var _skillRequired = $rows.find("td:nth-child(10)").map(function (i, e) {
            var txt = $(e).text().trim(); // может быть a тег внутри. поэтому просто текст.
            if (txt.length === 0)
                throw new Error("skill not found");
            return numberfy(txt);
        }).get();
        var _onHoliday = $rows.find("td:nth-child(11)").map(function (i, e) { return !!$(e).find(".in-holiday").length; }).get();
        // может отсутстовать если мы в отпуске -1 будет
        var _efficiency = $rows.find("td:nth-child(11)").map(function (i, e) {
            var txt = getInnerText(e).trim();
            return numberfy(txt || "-1");
        }).get();
        return {
            id: _id,
            salary: _salary,
            salaryCity: _salaryCity,
            skill: _skill,
            skillRequired: _skillRequired,
            onHoliday: _onHoliday,
            efficiency: _efficiency
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}
function parseX(html, url) {
    var $html = $(html);
    try {
        var _size = $html.find(".nowrap:nth-child(2)").map(function (i, e) {
            var txt = $(e).text();
            var sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;
            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;
            return sz;
        }).get();
        var _rent = $html.find(".nowrap:nth-child(3)").map(function (i, e) { return numberfyOrError($(e).text()); }).get();
        var _id = $html.find(":radio").map(function (i, e) { return numberfyOrError($(e).val()); }).get();
        return {
            size: _size,
            rent: _rent,
            id: _id
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}
//# sourceMappingURL=parsers.user.js.map