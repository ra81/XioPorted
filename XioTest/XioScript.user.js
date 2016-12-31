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
// просто кусок кода которым я проверял работу с селектами
//$("#mainContent > table.unit-list-2014 > tbody > tr:nth-child(1) > td:nth-child(11) > select:nth-child(1)").change(
//    function () {
//        let id = $(this).attr("data-id");
//        let p = $(this).closest("tr");
//        p.css("background-color", "rgb(255, 210, 170)");
//        console.log(p.get());
//        console.log(id);
//    }); 
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
        name: "priceProd",
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
//interface IJsonPolicies {
//    pp: IPolicy;
//    pw: IPolicy;
//    ps: IPolicy;
//    pn: IPolicy;
//    sc: IPolicy;
//    sl: IPolicy;
//    ee: IPolicy;
//    pt: IPolicy;
//    sp: IPolicy;
//    sr: IPolicy;
//    sh: IPolicy;
//    ad: IPolicy;
//    es: IPolicy;
//    en: IPolicy;
//    eh: IPolicy;
//    ep: IPolicy;
//    et: IPolicy;
//    qm: IPolicy;
//    tc: IPolicy;
//    rs: IPolicy;
//    pb: IPolicy;
//    pa: IPolicy;
//    wz: IPolicy;
//} 
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
var ls = localStorage;
var realm = xpCookie('last_realm');
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
function XioGenerator(subidList) {
    console.log(getFuncName(arguments));
}
;
function XioExport() {
    console.log(getFuncName(arguments));
}
;
function XioImport() {
    console.log(getFuncName(arguments));
}
;
function XioHoliday() {
    console.log(getFuncName(arguments));
}
;
function XioOverview() {
    var unitsTable = $(".unit-list-2014");
    // скрыть все колонки кроме Город, Подразделение
    unitsTable.find("td, th").filter(":not(:nth-child(2)):not(:nth-child(3)):not(:nth-child(8))").addClass("XioHide").hide();
    unitsTable.find("tr.odd").css("backgroundColor", "lightgoldenrodyellow");
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
    // отрисовка кнопок в хедере таблицы с поколоночными операциями и Общими на группу юнитов
    var policyString = [];
    var groupString = [];
    var thstring = "<th class=XOhtml style=\"padding-right:5px\">\n                      <input type=button id=XioGeneratorPRO class='XioGo' value='Gen ALL' style='width:50%'>\n                      <input type=button id=XioFirePRO class='XioGo' value='FIRE ALL' style='width:50%' >\n                    </th>";
    var tdstring = "";
    for (var key in policyJSON) {
        var policy_1 = policyJSON[key];
        if (groupString.indexOf(policy_1.group) < 0) {
            groupString.push(policy_1.group);
            policyString.push([policy_1.name]);
            thstring += "<th class=XOhtml style='padding-right:5px'>\n                           <input type=button class='XioGo XioGroup' value=" + policy_1.group + " style='width:100%'>\n                         </th>";
            tdstring += "<td class=XOhtml></td>";
        }
        else {
            policyString[groupString.indexOf(policy_1.group)].push(policy_1.name);
        }
    }
    unitsTable.find("th:nth-child(7)").after(thstring);
    // далее отработка каждого юнита
    //
    var subids = unitsTable.find("tr:not(.unit_comment) td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get();
    // вставляем кнопки в каждую строку. generate/fire. для отработки конкретного юнита
    var $td = unitsTable.find("tr:not(.unit_comment) td:nth-child(8)");
    for (var i = 0; i < subids.length; i++) {
        $td.eq(i).after(("<td class=XOhtml>\n                           <input type=button data-id=" + subids[i] + " class='XioGo XioGenerator' value=Generate>\n                           <input type=button class='XioGo XioSub' value=" + subids[i] + ">\n                         </td>") + tdstring);
    }
    // для всех юнитов в списке выводим селекты политик и проставляем значения политик взятые из лок хранилища
    for (var i = 0; i < subids.length; i++) {
        var savedPolicyStrings = ls["x" + realm + subids[i]] ? ls["x" + realm + subids[i]].split(";") : [];
        for (var j = 0; j < savedPolicyStrings.length; j++) {
            var name = savedPolicyStrings[j].substring(0, 2);
            var policy = policyJSON[name];
            if (policy == null)
                continue;
            var choices = savedPolicyStrings[j].substring(2).split("-");
            // в каждую строку юнита добавляем селекты для выбора политик.
            var htmlstring = "";
            for (var k = 0; k < policy.order.length; k++) {
                if (k >= 1)
                    htmlstring += "<br>";
                htmlstring += "<select data-id=" + subids[i] + " data-name=" + name + " data-choice=" + k + " class=XioChoice>";
                for (var l = 0; l < policy.order[k].length; l++)
                    htmlstring += "<option value=" + l + ">" + policy.order[k][l] + "</option>";
                htmlstring += "</select>";
            }
            // для всех селектов которые добавили проставляем значения политик из лок стораджа
            var $selects = unitsTable.find("tr:not(.unit_comment)").eq(i + 1).find("td").eq(groupString.indexOf(policy.group) + 9).html(htmlstring).find("select");
            for (var k = 0; k < policy.order.length; k++) {
                var ch = parseInt(choices[k]);
                var policyChoice = policy.order[k].indexOf(policy.save[k][ch]);
                policyChoice = Math.max(policyChoice, 0);
                $selects.eq(k).val(policyChoice);
            }
        }
    }
    // чета удаляем не понял чо
    var j = 0;
    for (var i = 0; i < policyString.length; i++) {
        if (unitsTable.find("td:nth-child(" + (10 + i - j) + ")").find("select").length === 0) {
            $(".unit-list-2014 th:nth-child(" + (9 + i - j) + "), .unit-list-2014  td:nth-child(" + (10 + i - j) + ")").remove();
            j++;
        }
    }
    // проставляем ширину кнопок ксио и селектов
    var ths = $("th.XOhtml[style]");
    for (var i = 0; i < ths.length; i++) {
        var $selects = $("td.XOhtml:nth-child(" + (10 + i) + ") select");
        var $inputs = $("th.XOhtml:nth-child(" + (9 + i) + ") input");
        var wa = $selects.map(function (i, e) { return $(e).width(); }).get();
        var width = wa.concat([$inputs.width() + 16]).reduce(function (p, c) { return Math.max(p, c); });
        $selects.width(width);
        $inputs.width(width - 16);
    }
    // расширяем дивы чобы влазила широкая таблица когда дофига селектов
    $("#wrapper").width(unitsTable.width() + 80);
    $("#mainContent").width(unitsTable.width());
    // всем селектам вешаем доп свойство open.
    $(".XioChoice").data("open", false);
    var $tron; // TODO: тут я решил избавиться от глобальной переменной ибо нахера она? функции захватывают локальный скоуп
    var $mousedown = false;
    var $this;
    // по нажатию кнопки выделяем строку юнита и запомним tr на котором собсна это произошло
    $(document).on("mousedown.XO", ".wborder", function (e) {
        if (!$(e.target).is('.XioChoice') && !$(e.target).is('.XioChoice option')) {
            $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
            $(".trXIO").removeClass("trXIO");
            $(this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            $mousedown = true;
            $tron = $(e.target).is("tr") ? $(e.target) : $(e.target).parents("tr");
        }
    });
    // при наведении мышкой на строку юнитам
    unitsTable.on("mouseover.XO", ".wborder", function (e) {
        if ($mousedown) {
            $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
            $(".trXIO").removeClass("trXIO");
            $this = $(this);
            // ваще не понял этой магии
            if ($this.index() < $tron.index()) {
                $this.nextUntil($tron).addBack().add($tron).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
            else if ($this.index() > $tron.index()) {
                $tron.nextUntil($this).addBack().add($this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
            $this.addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
        }
    });
    $(document).on("mouseup.XO", ".wborder", function () {
        $mousedown = false;
    });
    // при наведении мышкой на строку юнитам
    $(document).on("mouseover.XO", ".wborder", function (e) {
        if ($mousedown) {
            $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
            $(".trXIO").removeClass("trXIO");
            $this = $(this);
            // ваще не понял этой магии
            if ($this.index() < $tron.index()) {
                $this.nextUntil($tron).addBack().add($tron).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
            else if ($this.index() > $tron.index()) {
                $tron.nextUntil($this).addBack().add($this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
            $this.addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
        }
    });
    var detector = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1 ? 'mousedown.XO' : 'click.XO';
    $(document).on(detector, ".XioChoice", function (e) {
        $this = $(this);
        // меняем повешанные на селект данные open при клике по нему
        if ($(this).data("open") === false) {
            //open
            $(this).data("open", true);
            $(document).on("mouseup.XO.XIN", "", execute);
        }
        else {
            //not open
            $(this).data("open", false);
        }
        function execute() {
            //close
            $(document).off(".XIN");
            setTimeout(function () {
                $this.data('open', false);
            }, 1);
            var thisname = $this.attr("data-name");
            var thischoice = numberfy($this.attr("data-choice"));
            var thisvalue = policyJSON[thisname].order[thischoice][$this.val()];
            var column = $this.parent().index();
            var $arr = $(".trXIO td:nth-child(" + (column + 1) + ") .XioChoice");
            //if row not selected
            if ($arr.length === 0) {
                $arr = $("tr:nth-child(" + ($this.parent().parent().index() + 1) + ") td:nth-child(" + (column + 1) + ") .XioChoice");
            }
            for (var i = 0; i < $arr.length; i++) {
                var name = $arr.eq(i).attr("data-name");
                var subid = $arr.eq(i).attr("data-id");
                var choice = numberfy($arr.eq(i).attr("data-choice"));
                var index = policyJSON[name].save[choice].indexOf(thisvalue);
                var value = policyJSON[name].order[choice].indexOf(thisvalue);
                if (index >= 0) {
                    $arr.eq(i).val(value);
                    var savedPolicyStrings = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
                    var savedPolicies = [];
                    var savedPolicyChoices = [];
                    for (var j = 0; j < savedPolicyStrings.length; j++) {
                        savedPolicies[j] = savedPolicyStrings[j].substring(0, 2);
                        savedPolicyChoices[j] = savedPolicyStrings[j].substring(2);
                    }
                    var option = savedPolicies.indexOf(name);
                    var split = savedPolicyChoices[option].split("-");
                    split[choice] = index.toString();
                    savedPolicyChoices[option] = split.join("-");
                    var newPolicyString = "";
                    for (var j = 0; j < savedPolicies.length; j++) {
                        newPolicyString += ";" + savedPolicies[j] + savedPolicyChoices[j];
                    }
                    ls["x" + realm + subid] = newPolicyString.substring(1);
                }
            }
        }
    });
    // жмак по кнопке GenerateAll
    $(document).on('click.XO', "#XioGeneratorPRO", function () {
        XioGenerator(subids);
    });
    // жмак по кнопке FireAll
    $(document).on('click.XO', "#XioFirePRO", function () {
        XioMaintenance(subids, []);
    });
    // generate отдельного юнита
    $(document).on('click.XO', ".XioGenerator", function () {
        var subid = numberfy($(this).attr("data-id"));
        XioGenerator([subid]);
    });
    // жмак по кнопке в хедере колонки
    $(document).on('click.XO', ".XioGroup", function () {
        var allowedPolicies = $(this).val();
        XioMaintenance(subids, [allowedPolicies]);
    });
    // fire/subid кнопка юнита
    $(document).on('click.XO', ".XioSub", function (e) {
        var subid = numberfy($(this).val());
        XioMaintenance([subid], []);
    });
}
function topManagerStats() {
    var fName = arguments.callee.toString();
    console.log(fName);
}
function preference(policies) {
    // работать будем с конкретным юнитом в котором находимся
    var subidRx = document.URL.match(/(view\/?)\d+/);
    if (subidRx == null)
        return false;
    var subid = numberfy(subidRx[0].split("/")[1]);
    // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
    var savedPolicyStrings = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
    var savedPolicies = [];
    var savedPolicyChoices = [];
    for (var i = 0; i < savedPolicyStrings.length; i++) {
        savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
        savedPolicyChoices[i] = savedPolicyStrings[i].substring(2).split("-");
    }
    // место под комбобоксы настроек
    var $topblock = $("div.metro_header");
    $topblock.append("<table id=XMoptions style='font-size: 14px; color:gold;'><tr id=XMHead></tr><tr id=XMOpt></tr></table>");
    var policyNames = [];
    var headstring = "";
    var htmlstring = "";
    var setpolicies = [];
    for (var i = 0; i < policies.length; i++) {
        var policy = policyJSON[policies[i]];
        // вдруг такой политики не описано. чудо как бы
        if (!policy)
            continue;
        policyNames.push(policy.group);
        headstring += "<td>" + policy.group + "</td>";
        htmlstring += "<td id=" + policies[i] + ">"; // id=pp/ps/pw и так далее
        // наполняем комбобоксы списками политик в том порядке в каком они должны отображаться
        var _loop_1 = function() {
            if (j >= 1)
                htmlstring += "<br>";
            htmlstring += "<select class=XioPolicy data-index=" + j + ">";
            for (k = 0; k < policy.order[j].length; k++)
                htmlstring += "<option>" + policy.order[j][k] + "</option>";
            htmlstring += "</select>";
            // если есть сохраненные данные для данной политики у юнита
            // кладем все функции установщиков в массив чтобы потом разом вызвать. ебанутое решение имхо
            var index = savedPolicies.indexOf(policies[i]);
            if (index >= 0) {
                var savedChoice = numberfy(savedPolicyChoices[index][j]);
                var policyChoice_1 = policy.order[j].indexOf(policy.save[j][savedChoice]);
                // хитрый ход конем чтобы сохранить контекст. переменные нужно запомнить.
                // здесь был bind но он жопа. Анонимная функция лучше
                var setter = function () {
                    var _policyStr = policies[i]; // запоминаем в скоупе функции переменные которые нам надо
                    var _ind = j;
                    var _choice = policyChoice_1;
                    // вернем анонимную функцию которая выполнится в скоупе где переменные запомнены
                    return function () { return $("#" + _policyStr + " select:eq(" + _ind + ") option").eq(_choice).attr("selected", "true"); };
                };
                setpolicies.push(setter());
            }
        };
        var k;
        for (var j = 0; j < policy.order.length; j++) {
            _loop_1();
        }
        htmlstring += "</td>";
    }
    $("#XMHead").html(headstring);
    $("#XMOpt").html(htmlstring);
    for (var i = 0; i < setpolicies.length; i++)
        setpolicies[i]();
    if (policies.length) {
        var $selects = $("#XMoptions select");
        var wa = $selects.map(function (i, e) { return $(e).width(); }).get();
        var width = wa.concat([0]).reduce(function (p, c) { return Math.max(p, c); }); // находим макс ширину из всех элементов селектов
        $selects.width(width); // и ставим ее всем
        // TODO: нахуа ставить всем селектам одну ширину? Тока для одной группы надо а не всем группам. Брееед
        $("#XMoptions").before("<input type=button id=XioFire value=FIRE!>");
    }
    $("#XioFire").click(function () { return XioMaintenance([subid], policyNames); });
    $(".XioPolicy").change(function () {
        var $thistd = $(this).parent();
        var thisid = $thistd.attr("id");
        // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
        var savedPolicyStrings = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
        var savedPolicies = [];
        var savedPolicyChoices = [];
        for (var i = 0; i < savedPolicyStrings.length; i++) {
            savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
            savedPolicyChoices[i] = savedPolicyStrings[i].substring(2);
        }
        // формируем строку для записи в лок хранилище
        var thischoice = "";
        for (var i = 0; i < policyJSON[thisid].order.length; i++) {
            if (i >= 1)
                thischoice += "-";
            var selected = $thistd.find("option:selected").eq(i).text();
            thischoice += policyJSON[thisid].save[i].indexOf(selected);
        }
        var ind = savedPolicies.indexOf(thisid);
        if (ind >= 0) {
            savedPolicyChoices[ind] = thischoice;
        }
        else {
            savedPolicies.push(thisid);
            savedPolicyChoices.push(thischoice);
        }
        var newPolicyString = "";
        for (var i = 0; i < savedPolicies.length; i++)
            newPolicyString += ";" + savedPolicies[i] + savedPolicyChoices[i];
        ls["x" + realm + subid] = newPolicyString.substring(1);
    })
        .each(function () { $(this).trigger("change"); });
    return true;
}
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
            if ($html.find(".fa-users").length) {
                policyArray.push("en");
            }
            else {
                policyArray.push("es");
            }
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
document.onreadystatechange = function () {
    if (document.readyState === "complete") {
        XioScript();
    }
};
document.onreadystatechange(new ProgressEvent("XioLoad"));
//# sourceMappingURL=XioScript.user.js.map