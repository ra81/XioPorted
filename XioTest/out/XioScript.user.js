// ==UserScript==
// @name           XioScript
// @namespace      https://github.com/XiozZe/XioScript
// @description    XioScript with XioMaintenance
// @version        12.0.84
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
// словарь в виде одной строки через ;
function dict2String(dict) {
    if (dictIsEmpty(dict))
        return "";
    var newItems = [];
    for (var key in dict)
        newItems.push(key + ":" + dict[key].toString());
    return newItems.join(";");
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
    return "x" + realm + subid;
}
// загружаем из хранилища сразу все опции для данного юнита и реалма. выдаем стандартный словарь или {}
function loadOptions(realm, subid) {
    var storageKey = makeStorageKey(realm, subid);
    var savedPolicyStrings = localStorage[storageKey] ? localStorage[storageKey].split(";") : [];
    var parsedDict = {};
    for (var n = 0; n < savedPolicyStrings.length; n++) {
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
var ls = localStorage;
var $realm = getRealm();
var getUrls = [];
var finUrls = [];
var xcallback = [];
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
var xsup = [];
var xsupcheck = {};
var urlUnitlist = "";
var blackmail = [];
var _m = $(".dashboard a").attr("href").match(/\d+/);
var companyid = numberfy(_m ? _m[0] : "0");
var equipfilter = [];
function getRealm() {
    var r = xpCookie('last_realm');
    if (r == null)
        throw new Error("неведомая хуйня но реалм == null");
    return r;
}
function logDebug(msg) {
    if ($xioDebug)
        console.log(msg);
}
// возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо 0 если не получилось преобразовать.
function numberfy(variable) {
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
// из аргументов функции вытаскивает само имя функции. для лога чисто
function getFuncName(args) {
    var items = args.callee.toString().split("(");
    return items[0] ? items[0] + "()" : "";
}
function XioMaintenance(subidList, policyNames) {
    console.log(getFuncName(arguments));
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
            var loaded = loadOptions($realm, subid.toString()); // {} если пусто
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
            storeOptions($realm, subid.toString(), loaded);
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
    console.log(getFuncName(arguments));
}
;
// переписать построение селектов и их инициализацию
function XioOverview() {
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
        var unitOptions = loadOptions($realm, subid.toString()); // {} если не нашли опции
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
        var subid = container.attr("unit-id");
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
// убрал содержимое, нафиг не нужно
function topManagerStats() {
    var fName = arguments.callee.toString();
    console.log(fName);
}
// когда мы находимся внутри юнита, загружает и отображает policies, то есть тока то что задано.
function preference(policies) {
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
    var parsedDict = loadOptions($realm, subid.toString());
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
        var subid = container.attr("unit-id");
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
// по урлу страницы возвращает policyKey который к ней относится
// переписано. можно оптимизировать запросы к дом.
function preferencePages(html, url) {
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
function salePrice() {
    throw new Error("Not implemented");
}
;
function salePolicy() {
    throw new Error("Not implemented");
}
;
function servicePrice() {
    throw new Error("Not implemented");
}
;
function serviceWithoutStockPrice() {
    throw new Error("Not implemented");
}
;
function incineratorPrice() {
    throw new Error("Not implemented");
}
;
function retailPrice() {
    throw new Error("Not implemented");
}
;
function prodSupply() {
    throw new Error("Not implemented");
}
;
function storeSupply() {
    throw new Error("Not implemented");
}
;
function wareSupply() {
    throw new Error("Not implemented");
}
;
function advertisement() {
    throw new Error("Not implemented");
}
;
function salary() {
    throw new Error("Not implemented");
}
;
function holiday() {
    throw new Error("Not implemented");
}
;
function training() {
    throw new Error("Not implemented");
}
;
function equipment() {
    throw new Error("Not implemented");
}
;
function technology() {
    throw new Error("Not implemented");
}
;
function research() {
    throw new Error("Not implemented");
}
;
function prodBooster() {
    throw new Error("Not implemented");
}
;
function politicAgitation() {
    throw new Error("Not implemented");
}
;
function wareSize() {
    throw new Error("Not implemented");
}
;
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
// стартовая функция
function XioScript() {
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