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
var version = "12.1.1";
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
var $ = jQuery = jQuery.noConflict(true);
var $xioDebug = true;
//var ls = localStorage;
var $realm = getRealm();
var getUrls = [];
var finUrls = [];
var xcallback = []; // массив of tuple
var $mapped = {};
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
var subType = {
    mine: [8, 8, "/img/qualification/mining.png"],
    power: [6, 6, "/img/qualification/power.png"],
    workshop: [4, 4, "/img/qualification/manufacture.png"],
    sawmill: [4, 4, "/img/qualification/manufacture.png"],
    farm: [1.6, 1.6, "/img/qualification/farming.png"],
    orchard: [1.2, 1.2, "/img/qualification/farming.png"],
    medicine: [1, 1, "/img/qualification/medicine.png"],
    fishingbase: [1, 1, "/img/qualification/fishing.png"],
    animalfarm: [0.6, 0.6, "/img/qualification/animal.png"],
    lab: [0.4, 0.4, "/img/qualification/research.png"],
    mill: [0.4, 4, "/img/qualification/manufacture.png"],
    restaurant: [0.4, 0.4, "/img/qualification/restaurant.png"],
    shop: [0.4, 0.4, "/img/qualification/trade.png"],
    repair: [0.2, 0.2, "/img/qualification/car.png"],
    fuel: [0.2, 0.2, "/img/qualification/car.png"],
    service: [0.12, 0.12, "/img/qualification/service.png"],
    service_light: [0.12, 0.12, "/img/qualification/service.png"],
    office: [0.08, 0.08, "/img/qualification/management.png"],
    it: [0.08, 0.08, "/img/qualification/it.png"],
    educational: [0.12, 0.12, "/img/qualification/educational.png"]
};
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
    if (!$xioDebug)
        return;
    if (args.length === 0)
        console.log(msg);
    else
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
        $mapped[url] = JSON.parse(html);
        return false;
    }
    else if (page === "none") {
        return false;
    }
    // TODO: запилить классы для каждого типа страницы. чтобы потом можно было с этим типизированно воркать
    var $html = $(html);
    if (page === "unitlist") {
        $mapped[url] = {
            subids: $html.find(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            type: $html.find(".unit-list-2014 td:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[1]; }).get()
        };
    }
    else if (page === "sale") {
        $mapped[url] = {
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
                return numberfy(m ? m[0] : "0");
            }).get(),
            region: $html.find(".officePlace a:eq(-2)").text(),
            contractpage: !!$html.find(".tabsub").length,
            // ["Мука", "$0.78", "$0.78"] вот такая хуйня выпадает.
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e); })
        };
    }
    else if (page === "salecontract") {
        $mapped[url] = {
            category: $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get(),
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e); })
        };
    }
    else if (page === "prodsupply") {
        $mapped[url] = $html.find(".inner_table").length ? {
            isProd: !$html.find(".sel").next().attr("class"),
            parcel: $html.find(".quickchange").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_mark_up: [],
            price_constraint_max: [],
            price_constraint_type: [],
            quality_constraint_min: [],
            required: $html.find(".list td:nth-child(3).inner_table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            stock: $html.find(".list td:nth-child(4).inner_table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            basequality: $html.find(".list td:nth-child(4).inner_table tr:nth-child(2) td:nth-child(2)[align]").map(function (i, e) { return numberfy($(e).text()); }).get(),
            prodid: $html.find(".list tr:has([src='/img/supplier_add.gif']) > td:nth-child(1) a").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(2) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quality: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(3) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            available: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(4) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            maximum: $html.find(".list td:has(.quicksave)").map(function (i, e) {
                var m = $(e).find("[style='color: red;']").text().match(/(\d|\s)+/);
                return $(e).find("[style='color: red;']").length ? numberfy(m ? m[0] : "0") : Infinity;
            }).get(),
            reprice: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(2)").map(function (i, e) { return !!$(e).filter(".ordered_red, .ordered_green").length; }).get(),
            mainrow: $html.find(".list tr[onmouseover]").map(function (i, e) { return !!$(e).find("[alt='Select supplier']").length; }).get(),
            nosupplier: $html.find(".list tr[onmouseover]").map(function (i, e) { return !$(e).find("[src='/img/smallX.gif']").length; }).get(),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        } : {
            isProd: !$html.find(".sel").next().attr("class"),
            parcel: $html.find("input[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_mark_up: $html.find("select[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_type: $html.find("select[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get(),
            quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            required: $html.find(".list td:nth-child(2) table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            stock: $html.find(".list td:nth-child(3) table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            basequality: $html.find(".list td:nth-child(3) table tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            prodid: $html.find(".list a:has(img)[title]").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price: $html.find("[id^=totalPrice] tr:nth-child(1) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quality: $html.find("[id^=totalPrice] tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            available: $html.find("[id^=quantity] tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            maximum: $html.find(".list td:has([type=type])").map(function (i, e) {
                var m = $(e).find("[style='color:red']").text().match(/(\d|\s)+/);
                return $(e).find("[style='color:red']").length ? numberfy(m ? m[0] : "0") : Infinity;
            }).get(),
            reprice: $html.find("[id^=totalPrice] tr:nth-child(1)").map(function (i, e) { return !!$(e).filter("[style]").length; }).get(),
            mainrow: $html.find(".list tr[id]").map(function (i, e) { return !/sub/.test($(e).attr("id")); }).get(),
            nosupplier: $html.find(".list tr[id]").map(function (i, e) { return !$(e).find("[src='/img/smallX.gif']").length; }).get(),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        };
    }
    else if (page === "consume") {
        $mapped[url] = {
            consump: zipAndMin($html.find(".list td:nth-last-child(1) div:nth-child(2)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get(), $html.find(".list td:nth-last-child(1) div:nth-child(1)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get()),
            purch: $html.find('#mainContent > form > table.list > tbody > tr:last > td.nowrap').map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "storesupply") {
        $mapped[url] = {
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
        $mapped[url] = {
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
        $mapped[url] = {
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
        $mapped[url] = {
            price: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quantity: $html.find(".list td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "retailreport") {
        $mapped[url] = {
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
        $mapped[url] = {
            quantity: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            price: $html.find(".list td:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "TM") {
        $mapped[url] = {
            product: $html.find(".grid td:odd").map(function (i, e) { return $(e).clone().children().remove().end().text().trim(); }).get(),
            franchise: $html.find(".grid b").map(function (i, e) { return $(e).text(); }).get()
        };
    }
    else if (page === "IP") {
        $mapped[url] = {
            product: $html.find(".list td:nth-child(5n-3)").map(function (i, e) { return $(e).text(); }).get(),
            IP: $html.find(".list td:nth-child(5n)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "transport") {
        $mapped[url] = {
            countryName: $html.find("select:eq(0) option").map(function (i, e) { return $(e).text(); }).get(),
            countryId: $html.find("select:eq(0) option").map(function (i, e) { return numberfy($(e).val().split("/")[1]); }).get(),
            regionName: $html.find("select:eq(1) option").map(function (i, e) { return $(e).text(); }).get(),
            regionId: $html.find("select:eq(1) option").map(function (i, e) { return numberfy($(e).val().split("/")[2]); }).get(),
            cityName: $html.find("select:eq(2) option").map(function (i, e) { return $(e).text(); }).get(),
            cityId: $html.find("select:eq(2) option").map(function (i, e) { return numberfy($(e).val().split("/")[3]); }).get()
        };
    }
    else if (page === "CTIE") {
        $mapped[url] = {
            product: $html.find(".list td:nth-child(3n-1)").map(function (i, e) { return $(e).text(); }).get(),
            profitTax: numberfy($html.find(".region_data td:eq(3)").text()),
            CTIE: $html.find(".list td:nth-child(3n)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "main") {
        $mapped[url] = {
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
        $mapped[url] = {
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
        $mapped[url] = {
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
        $mapped[url] = {
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
                return m == null ? "" : m[0].slice(2, -1);
            })()
        };
    }
    else if (page === "manager") {
        $mapped[url] = {
            base: $html.find(".qual_item .mainValue").map(function (i, e) { return numberfy($(e).text()); }).get(),
            bonus: $html.find(".qual_item .bonusValue").map(function (i, e) { return numberfy($(e).text()); }).get(),
            pic: $html.find(".qual_item img").map(function (i, e) { return $(e).attr("src"); }).get()
        };
    }
    else if (page === "tech") {
        $mapped[url] = {
            price: $html.find("tr td.nowrap:nth-child(2)").map(function (i, e) { return $(e).text().trim(); }).get(),
            tech: $html.find("tr:has([src='/img/v.gif'])").index(),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        };
    }
    else if (page === "products") {
    }
    else if (page === "waresupply") {
        $mapped[url] = {
            form: $html.find("[name=supplyContractForm]"),
            contract: $html.find(".p_title").map(function (i, e) { return $(e).find("a:eq(1)").attr("href"); }).get(),
            id: $html.find(".p_title").map(function (i, e) {
                var m = $(e).find("a:eq(1)").attr("href").match(/\d+$/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            type: $html.find(".p_title").map(function (i, e) { return $(e).find("strong:eq(0)").text(); }).get(),
            stock: $html.find(".p_title table").map(function (i, e) { return $(e).find("strong").length >= 2 ? numberfy($(e).find("strong:eq(0)").text()) : 0; }).get(),
            shipments: $html.find(".p_title table").map(function (i, e) { return $(e).find("strong").length === 1 ? numberfy($(e).find("strong:eq(0)").text()) : numberfy($(e).find("strong:eq(2)").text()); }).get(),
            parcel: $html.find("input:text[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_mark_up: $html.find("input[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            price_constraint_type: $html.find("input[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get(),
            quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get(),
            product: $html.find("tr:has(input:text[name])").map(function (i, e) { return $(e).prevAll(".p_title:first").find("strong:eq(0)").text(); }).get(),
            price: $html.find("tr:has(input) td:nth-child(4)").map(function (i, e) {
                var m = $(e).text().match(/(\d|\.|\s)+$/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            reprice: $html.find("tr:has(input) td:nth-child(4)").map(function (i, e) { return !!$(e).find("span").length; }).get(),
            quality: $html.find("tr:has(input) td:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            offer: $html.find("tr input:checkbox").map(function (i, e) { return numberfy($(e).val()); }).get(),
            available: $html.find("tr:has(input) td:nth-child(9)").map(function (i, e) {
                return $(e).text().split(/\s[a-zA-Zа-яА-ЯёЁ]+\s/).reduce(function (a, b) {
                    var m = b.match(/(\d| )+/);
                    return Math.min(a, b.match(/\d+/) === null ? Infinity : numberfy(m ? m[0] : "0"));
                }, Infinity);
            }).get(),
            myself: $html.find("tr:has(input)[class]").map(function (i, e) { return !!$(e).find("strong").length; }).get(),
            contractAdd: $html.find(".add_contract a:has(img)").map(function (i, e) { return $(e).attr("href"); }).get(),
            idAdd: $html.find(".add_contract a:has(img)").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+$/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            typeAdd: $html.find(".add_contract img").map(function (i, e) { return $(e).attr("alt"); }).get()
        };
    }
    else if (page === "contract") {
        $mapped[url] = {
            available: $html.find(".price_w_tooltip:nth-child(4)").map(function (i, e) { return numberfy($(e).find("i").remove().end().text()); }).get(),
            offer: $html.find(".unit-list-2014 tr[id]").map(function (i, e) {
                var m = $(e).attr("id").match(/\d+/);
                return numberfy(m ? m[0] : "0");
            }).get(),
            price: $html.find(".price_w_tooltip:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            tm: $html.find(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return $(e).find("img").length ? $(e).find("img").attr("title") : ""; }).get(),
            company: $html.find("td:has(i):not([class])").map(function (i, e) { return $(e).find("b").text(); }).get(),
            myself: $html.find(".unit-list-2014 tr[id]").map(function (i, e) { return !!$(e).filter(".myself").length; }).get(),
            product: $html.find("img:eq(0)").attr("title")
        };
    }
    else if (page === "research") {
        $mapped[url] = {
            isFree: !$html.find(".cancel").length,
            isHypothesis: !!$html.find("#selectIt").length,
            isBusy: !!numberfy($html.find(".grid .progress_static_bar").text()),
            hypId: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get(),
            curIndex: $html.find("tr:has([src='/img/v.gif'])").index() - 1,
            chance: $html.find(".grid td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            time: $html.find(".grid td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            isAbsent: !!$html.find("b[style='color: red']").length,
            isFactory: !!$html.find("span[style='COLOR: red']").length,
            unittype: $html.find(":button:eq(2)").attr("onclick") ? numberfy($html.find(":button:eq(2)").attr("onclick").split(",")[1]) : 0,
            industry: $html.find(":button:eq(2)").attr("onclick") ? numberfy($html.find(":button:eq(2)").attr("onclick").split("(")[1]) : 0,
            level: numberfy($html.find(".list tr td[style]:eq(0)").text())
        };
    }
    else if (page === "experimentalunit") {
        $mapped[url] = {
            id: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get()
        };
    }
    else if (page === "productreport") {
        $mapped[url] = {
            max: $html.find(".grid td.nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get(),
            total: $html.find(".grid td.nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            available: $html.find(".grid td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            quality: $html.find(".grid td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            price: $html.find(".grid td.nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            subid: $html.find(".grid td:nth-child(1) td:nth-child(1) a").map(function (i, e) {
                var m = $(e).attr("href").match(/\d+/);
                return numberfy(m ? m[0] : "0");
            }).get()
        };
    }
    else if (page === "financeitem") {
        $mapped[url] = {
            energy: numberfy($html.find(".list tr:has(span[style]) td:eq(1)").text())
        };
    }
    else if (page === "size") {
        $mapped[url] = {
            size: $html.find(".nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            rent: $html.find(".nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            id: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get()
        };
    }
    else if (page === "waremain") {
        $mapped[url] = {
            size: numberfy($html.find(".infoblock td:eq(1)").text()),
            full: numberfy($html.find("[nowrap]:eq(0)").text()),
            product: $html.find(".grid td:nth-child(1)").map(function (i, e) { return $(e).text(); }).get(),
            stock: $html.find(".grid td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            shipments: $html.find(".grid td:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "ads") {
        $mapped[url] = {
            pop: (function () {
                var m = $html.find("script").text().match(/params\['population'\] = \d+/);
                return numberfy(m == null ? "0" : m[0].substring(23));
            })(),
            budget: numberfy($html.find(":text:not([readonly])").val()),
            requiredBudget: numberfy($html.find(".infoblock tr:eq(1) td:eq(1)").text().split("$")[1])
        };
    }
    else if (page === "employees") {
        $mapped[url] = {
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
    }
    else if (page === "machines") {
        $mapped[url] = {
            id: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).val()); }).get(),
            subid: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).attr("id").split("_")[1]); }).get(),
            type: $html.find(".list td[class]:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[2]; }).get(),
            num: $html.find(".list td[class]:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            perc: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            black: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text().split("(")[1]); }).get(),
            red: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text().split("+")[1]); }).get(),
            quality: $html.find("td:nth-child(6).nowrap").map(function (i, e) { return numberfy($(e).text()); }).get(),
            required: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get()
        };
    }
    else if (page === "animals") {
        $mapped[url] = {
            id: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).val()); }).get(),
            subid: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).attr("id").split("_")[1]); }).get(),
            type: $html.find(".list td[class]:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[2]; }).get(),
            num: $html.find(".list td[class]:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            perc: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get(),
            black: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text().split("(")[1]); }).get(),
            red: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text().split("+")[1]); }).get()
        };
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
function postMessage0(html) {
    // НЕ называть postMessage ибо конфликтует со штатными функциями
    $("#XMproblem").append("<div>" + html + "</div>");
}
function xGet(url, page, force, callback) {
    // запрашивает урл если он не запрашивался еще. либо если указан флаг форсировки
    // При успехе, обновляет время, увеличивает счетчик запросов, маппит урл, выполняет коллбэк и вызывает урлДан.
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
        logDebug("mapped: ", $mapped); // валит все отпарсенные ссылки за время обработки
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
    logDebug("subids: ", subids);
    logDebug("policyGroups: ", policyGroups);
    processingtime = new Date().getTime();
    timeinterval = setInterval(time, 1000);
    // дизаблим кнопки убираем старые логи
    $(".XioGo").prop("disabled", true);
    $(".XioProperty").remove();
    // апдейтим глобальные переменные
    getUrls = [];
    finUrls = [];
    xcallback = [];
    xcount = {};
    xmax = {};
    $mapped = {};
    servergetcount = 0;
    serverpostcount = 0;
    suppliercount = 0;
    blackmail = [];
    equipfilter = [];
    logDebug("mapped: ", $mapped);
    if (!subids || subids.length === 0)
        subids = parseAllSavedSubid($realm);
    if (!policyGroups || policyGroups.length === 0) {
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
                        further($mapped[urlUnitlist].subids);
                    });
                });
            });
        });
    });
    function further(realsubids) {
        var startedPolicies = [];
        var xgroup = {};
        // TODO: с этим надо чет сделать. кнопку какую чтобы чистило тока по кнопке. а то косячит и удаляет само если подвисло чего
        var _loop_1 = function() {
            // если в базе запись про юнита есть, а он не спарсился со страницы, удалить запись о нем.
            if (realsubids.indexOf(subids[i]) < 0) {
                var urlSubid = "/" + $realm + "/main/unit/view/" + subids[i];
                postMessage0("Subdivision <a href=" + urlSubid + ">" + subids[i] + "</a> is missing from the company. Options have been erased from the Local Storage.");
                removeOptions($realm, [subids[i]]);
                return "continue";
            }
            // загружаем политики юнита. часть отработаем сразу, часть пихаем в кэш и отработаем когда wait позволит уже
            var loaded = loadOptions($realm, subids[i]);
            var _loop_2 = function() {
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
            for (policyKey in loaded) {
                _loop_2();
            }
        };
        var policyKey;
        for (var i = 0; i < subids.length; i++) {
            _loop_1();
        }
        for (var key in policyJSON) {
            var name_1 = policyJSON[key].name;
            if (startedPolicies.indexOf(name_1) < 0) {
                xcount[name_1] = 1;
                xmax[name_1] = 0;
                xTypeDone(name_1);
            }
        }
        // рисует шляпу по обрабатываемым политикам на странице
        var displayedPolicies = [];
        for (var key in policyJSON) {
            var name_2 = policyJSON[key].name;
            var group = policyJSON[key].group;
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
    logDebug("XM finished: ", $mapped);
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
                logDebug("links: ", links);
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
            logDebug(subid + " policies:" + policies.join(", "));
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
            logDebug("XioHoliday: ", $mapped);
            var employees = $mapped[url];
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
    }
    logDebug(subid + " parsed policies: ", parsedDict);
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
    logDebug(subid + " newSaveString: ", newSaveString);
    // TODO: а нафига так париться когда есть JSON.stringify и он сразу может объекты фигачить в хранилище. поработать с этим
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
    logDebug(subid + " oldOptions: ", loaded);
    for (var key in options)
        loaded[key] = options[key];
    logDebug(subid + " newOptions: ", loaded);
    for (var key in options)
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
//
// сюда кладем все функции которые собсна выполняют политики
//
function advertisement(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/virtasement";
    var urlFame = "/" + $realm + "/ajax/unit/virtasement/" + subid + "/fame";
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var pccost = 0;
    var getcount = 0;
    if (choices[0] >= 3 && choices[0] <= 9) {
        getcount++;
        xGet(urlManager, "manager", false, function () {
            !--getcount && post();
        });
    }
    if (choices[0] >= 4 && choices[0] <= 9) {
        getcount++;
        xPost(urlFame, "moneyCost=0&type%5B0%5D=2264", function (data) {
            pccost = numberfy(JSON.parse(data).contactCost);
            !--getcount && post();
        });
    }
    if (choices[0] >= 4) {
        getcount++;
        xGet(url, "ads", false, function () { return !--getcount && post(); });
    }
    if (choices[0] <= 2)
        post();
    function post() {
        $("[id='x" + "Ads" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var data = "";
        var budget = 0;
        var top = $mapped[urlManager];
        var ads = $mapped[url];
        if (choices[0] === 1) {
            data = "cancel=Stop+advertising";
        }
        else if (choices[0] === 2) {
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=0";
        }
        else if (choices[0] === 3) {
            var managerIndex = top.pic.indexOf("/img/qualification/advert.png");
            var manager = top.base[managerIndex] + top.bonus[managerIndex];
            budget = 200010 * Math.pow(manager, 1.4);
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
        }
        else if (choices[0] >= 4 && choices[0] <= 9) {
            var managerIndex = top.pic.indexOf("/img/qualification/advert.png");
            var manager = top.base[managerIndex] + top.bonus[managerIndex];
            var multiplier = [1, 2, 5, 10, 20, 50];
            budget = Math.round(ads.pop * pccost * multiplier[choices[0] - 4]);
            var maxbudget = Math.floor(200010 * Math.pow(manager, 1.4));
            budget = Math.min(budget, maxbudget);
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
        }
        else if (choices[0] === 10) {
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + ads.requiredBudget;
        }
        if (choices[0] <= 3 || budget !== ads.budget)
            xPost(url, data, function () { return xTypeDone(policyName); });
        else
            xTypeDone(policyName);
    }
}
// TODO: доделать
function equipment(policyName, subid, choices) {
    var url = "/" + $realm + "/window/unit/equipment/" + subid;
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlSalary = "/" + $realm + "/window/unit/employees/engage/" + subid;
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var urlEquipment = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/equipment";
    var urlAnimals = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/animals";
    var getcount = 0;
    var equip = {};
    getcount += 4;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithEquipment/20000", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithEquipment/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithAnimals/20000", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithAnimals/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });
    function phase() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        getcount += 2;
        xGet(urlEquipment, "machines", false, function () {
            !--getcount && phase2();
        });
        xGet(urlAnimals, "animals", false, function () {
            !--getcount && phase2();
        });
    }
    function phase2() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _machines = $mapped[urlEquipment];
        var _animals = $mapped[urlAnimals];
        for (var i = 0; i < _machines.subid.length; i++) {
            if (_machines.subid[i] === subid) {
                for (var key in _machines)
                    equip[key] = _machines[key][i];
                break;
            }
        }
        for (var i = 0; i < _animals.subid.length; i++) {
            if (_animals.subid[i] === subid) {
                for (var key in _animals)
                    equip[key] = _animals[key][i];
                equip["perc"] = 100 - _animals.perc[i];
                break;
            }
        }
        // console.log('phase2 equip.black = ' + equip.black);
        if (equip.black > 0
            || choices[1] === 1 && equip.red > 0
            || choices[1] === 2 && equip.perc >= 1
            || choices[0] === 1 && equip.required > equip.quality) {
            getcount++;
            xsup.push([subid, equip.id,
                (function () {
                    xGet(url, "equipment", true, function () {
                        var _equip = $mapped[url];
                        if (equipfilter.indexOf(_equip.filtername) === -1) {
                            equipfilter.push(_equip.filtername);
                            getcount += 3;
                            xGet("/" + $realm + "/window/common/util/setpaging/db" + _equip.filtername + "/equipmentSupplierListByUnit/40000", "none", false, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            var data = "total_price%5Bfrom%5D=&total_price%5Bto%5D=&quality%5Bfrom%5D=&quality%5Bto%5D=&quantity%5Bisset%5D=1&quantity%5Bfrom%5D=1&total_price%5Bfrom%5D=0&total_price%5Bto%5D=0&total_price_isset=0&quality%5Bfrom%5D=0&quality%5Bto%5D=0&quality_isset=0&quantity_isset=1";
                            xPost("/" + $realm + "/window/common/util/setfiltering/db" + _equip.filtername + "/equipmentSupplierListByUnit", data, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            xGet("/" + $realm + "/window/common/util/setfiltering/db" + _equip.filtername + "/equipmentSupplierListByUnit/supplierType=all", "none", false, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            xsup.push([subid, equip.id, (function () {
                                    xGet(url, "equipment", true, function () {
                                        !--getcount && post();
                                    });
                                })]);
                        }
                        else {
                            !--getcount && post();
                        }
                    });
                })
            ]);
            xsupGo();
            if (choices[0] === 2) {
                getcount += 2;
                xGet(urlSalary, "salary", false, function () {
                    !--getcount && post();
                });
                xGet(urlManager, "manager", false, function () {
                    !--getcount && post();
                });
            }
        }
        else {
            xTypeDone(policyName);
        }
    }
    function post() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _equip = $mapped[url];
        var equipWear = 0;
        // console.log('choices[1] = ' + choices[1]);
        // console.log('equip.black = ' + equip.black);
        // console.log('equip.red = ' + equip.red);
        // console.log('equip.perc = ' + equip.perc);
        // console.log('equip.required = ' + equip.required);
        // console.log('equip.quality = ' + equip.quality);
        // console.log('equip.type = ' + equip.type);
        if (equip.required < equip.quality * 0.9) {
            equip.required = equip.quality;
        }
        if (choices[1] === 0) {
            equipWear = equip.black;
        }
        else if (choices[1] === 1) {
            equipWear = equip.black + equip.red;
        }
        else if (choices[1] === 2) {
            equipWear = equip.perc >= 1 ? 1 : 0;
        }
        var change = [];
        if (choices[0] === 1) {
            var offer = {
                low: [],
                high: [],
                inc: []
            };
            var qualReq = (equip.required || 0) + 0.005;
            var qualNow = equip.quality - 0.005;
            // console.log('qualReq = ' + qualReq);
            // console.log('qualNow = ' + qualNow);
            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / _equip.qualOffer[i],
                    quality: _equip.qualOffer[i],
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                // console.log('data.quality = ' + data.quality );
                if (data.quality < qualReq) {
                    offer.low.push(data);
                }
                else {
                    offer.high.push(data);
                }
            }
            for (var key in offer) {
                offer[key].sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
            }
            var l = 0;
            var h = 0;
            var qualEst = 0;
            var qualNew = qualNow;
            // console.log('offer.low.length = ' + offer.low.length);
            // console.log('offer.high.length = ' + offer.high.length);
            while (equipWear > 0 && h < offer.high.length) {
                // console.log('l = ' + l);
                // console.log('h = ' + h);
                if (offer.low[l] && offer.low[l].length > l && offer.low[l].available - offer.low[l].buy === 0) {
                    l++;
                    // console.log('continue l');
                    continue;
                }
                if (offer.high[h] && offer.high[h].length > h && offer.high[h].available - offer.high[h].buy === 0) {
                    h++;
                    // console.log('continue h');
                    continue;
                }
                // console.log(subid, l, offer.low[l].available - offer.low[l].buy, offer.low[l]);
                // console.log(subid, h, offer.high[h].available - offer.high[h].buy, offer.high[h]);
                qualEst = qualNew;
                l < offer.low.length && offer.low[l].buy++;
                for (var key in offer) {
                    for (var i = 0; i < offer[key].length; i++) {
                        if (offer[key][i].buy) {
                            qualEst = ((equip.num - offer[key][i].buy) * qualEst + offer[key][i].buy * offer[key][i].quality) / equip.num;
                        }
                    }
                }
                l < offer.low.length && offer.low[l].buy--;
                if (l < offer.low.length && qualEst > qualReq && offer.low[l].PQR < offer.high[h].PQR) {
                    offer.low[l].buy++;
                }
                else {
                    offer.high[h].buy++;
                }
                equipWear--;
            }
            for (var key in offer) {
                for (var i = 0; i < offer[key].length; i++) {
                    if (offer[key][i].buy) {
                        change.push({
                            op: "repair",
                            offer: offer[key][i].offer,
                            amount: offer[key][i].buy
                        });
                        qualNew = ((equip.num - offer[key][i].buy) * qualNew + offer[key][i].buy * offer[key][i].quality) / equip.num;
                    }
                }
            }
            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / (_equip.qualOffer[i] - qualReq),
                    quality: _equip.qualOffer[i] - 0.005,
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                if (data.quality > qualReq) {
                    offer.inc.push(data);
                }
            }
            offer.inc.sort(function (a, b) {
                return a.PQR - b.PQR;
            });
            var n = 0;
            qualEst = 0;
            var torepair = 0;
            for (var i = 0; i < offer.inc.length; i++) {
                if (offer.inc[i].buy) {
                    torepair += offer.inc[i].buy;
                    qualEst += offer.inc[i].buy * offer.inc[i].quality;
                }
            }
            qualEst = (qualEst + (equip.num - torepair) * qualNow) / equip.num;
            while (qualEst < qualReq && n < offer.inc.length) {
                if (offer.inc[n] && offer.inc[n].length > n && offer.inc[n].available - offer.inc[n].buy === 0) {
                    n++;
                    continue;
                }
                offer.inc[n].buy++;
                qualEst = 0;
                torepair = 0;
                for (var i = 0; i < offer.inc.length; i++) {
                    if (offer.inc[i].buy) {
                        torepair += offer.inc[i].buy;
                        qualEst += offer.inc[i].buy * offer.inc[i].quality;
                    }
                }
                qualEst = (qualEst + (equip.num - torepair) * qualNow) / equip.num;
            }
            if (torepair) {
                change.push({
                    op: "terminate",
                    amount: torepair
                });
            }
            for (var i = 0; i < offer.inc.length; i++) {
                if (offer.inc[i].buy) {
                    change.push({
                        op: "buy",
                        offer: offer.inc[i].offer,
                        amount: offer.inc[i].buy
                    });
                }
            }
            if (equipWear > 0 && (h < offer.high.length || n < offer.inc.length)) {
                postMessage0("No equipment on the market with a quality higher than required. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
        }
        else if (choices[0] === 2 && equipWear !== 0) {
            var _top = $mapped[urlManager];
            var _salary = $mapped[urlSalary];
            var managerIndex = _top.pic.indexOf(subType[equip.type][2]);
            var equipMax = calcEquip(calcSkill(_salary.employees, subType[equip.type][0], _top.base[managerIndex] + _top.bonus[managerIndex]));
            var offer_1 = {
                low: [],
                mid: [],
                high: []
            };
            var qualNow_1 = equip.quality + 0.005;
            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / _equip.qualOffer[i],
                    quality: _equip.qualOffer[i] + 0.005,
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                if (data.quality < qualNow_1) {
                    offer_1.low.push(data);
                }
                else if (data.quality < equipMax) {
                    offer_1.mid.push(data);
                }
                else {
                    offer_1.high.push(data);
                }
            }
            for (var key in offer_1) {
                offer_1[key].sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
            }
            var l = 0;
            var m = 0;
            var h = 0;
            var qualEst = 0;
            var qualNew_1 = qualNow_1;
            while (equipWear > 0 && l + m < offer_1.low.length + offer_1.mid.length && m + h < offer_1.mid.length + offer_1.high.length) {
                if (offer_1.low[l] && offer_1.low[l].length > l && offer_1.low[l].available - offer_1.low[l].buy === 0) {
                    l++;
                    continue;
                }
                if (offer_1.mid[m] && offer_1.mid[m].length > m && offer_1.mid[m].available - offer_1.mid[m].buy === 0) {
                    m++;
                    continue;
                }
                if (offer_1.high[h] && offer_1.high[h].length > h && offer_1.high[h].available - offer_1.high[h].buy === 0) {
                    h++;
                    continue;
                }
                qualEst = qualNew_1;
                h < offer_1.high.length && offer_1.high[h].buy++;
                for (var key in offer_1) {
                    for (var i = 0; i < offer_1[key].length; i++) {
                        if (offer_1[key][i].buy) {
                            qualEst = ((equip.num - offer_1[key][i].buy) * qualEst + offer_1[key][i].buy * offer_1[key][i].quality) / equip.num;
                        }
                    }
                }
                h < offer_1.high.length && offer_1.high[h].buy--;
                if (h < offer_1.high.length && qualEst < equipMax && (m === offer_1.mid.length || offer_1.high[h].PQR < offer_1.mid[m].PQR)) {
                    offer_1.high[h].buy++;
                }
                else if (l < offer_1.low.length && qualEst > equipMax && (m === offer_1.mid.length || offer_1.low[l].PQR < offer_1.mid[m].PQR)) {
                    offer_1.low[l].buy++;
                }
                else {
                    offer_1.mid[m].buy++;
                }
                equipWear--;
            }
            for (var key in offer_1) {
                for (var i = 0; i < offer_1[key].length; i++) {
                    if (offer_1[key][i].buy) {
                        change.push({
                            op: "repair",
                            offer: offer_1[key][i].offer,
                            amount: offer_1[key][i].buy
                        });
                        qualNew_1 = ((equip.num - offer_1[key][i].buy) * qualNew_1 + offer_1[key][i].buy * offer_1[key][i].quality) / equip.num;
                    }
                }
            }
            if (equipWear > 0 && l + m < offer_1.low.length + offer_1.mid.length) {
                postMessage0("No equipment on the market with a quality lower than the maximum quality defined by the Top1. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
            else if (equipWear > 0 && m + h < offer_1.mid.length + offer_1.high.length) {
                postMessage0("No equipment on the market with a quality higher than the current quality. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
        }
        else if (choices[0] === 3 && equipWear !== 0) {
            var offer_2 = [];
            for (var i = 0; i < _equip.offer.length; i++) {
                offer_2.push({
                    price: _equip.price[i],
                    quality: _equip.qualOffer[i],
                    available: _equip.available[i],
                    offer: _equip.offer[i],
                    index: i
                });
            }
            offer_2.sort(function (a, b) {
                return a.price - b.price;
            });
            var i = 0;
            while (equipWear > 0 && i < offer_2.length) {
                var tobuy = 0;
                if (offer_2[i].quality === 2.00) {
                    tobuy = Math.min(equipWear, offer_2[i].available);
                    equipWear -= tobuy;
                    change.push({
                        op: "repair",
                        offer: offer_2[i].offer,
                        amount: tobuy
                    });
                }
                i++;
            }
            if (i === offer_2.length) {
                postMessage0("No equipment on the market with a quality of 2.00. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
        }
        var equipcount = change.length;
        change.length && console.log(subid, change);
        for (var i = 0; i < change.length; i++) {
            xequip.push((function (i) {
                xContract("/" + $realm + "/ajax/unit/supply/equipment", {
                    'operation': change[i].op,
                    'offer': change[i].offer,
                    'unit': subid,
                    'supplier': change[i].offer,
                    'amount': change[i].amount
                }, function (data) {
                    if (xequip.length) {
                        xequip.shift()();
                    }
                    else {
                        fireequip = false;
                    }
                    !--equipcount && xTypeDone(policyName);
                    !equipcount && xsupGo(subid, equip.id);
                });
            }.bind(this, i)));
        }
        if (xequip.length && !fireequip) {
            fireequip = true;
            xequip.shift()();
        }
        else if (equipcount === 0) {
            xTypeDone(policyName);
            xsupGo(subid, equip.id);
        }
    }
}
function holiday(policyName, subid, choices) {
    var url = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/employee/salary";
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlSupply = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlTrade = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";
    var getcount = 2;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithHoliday/20000", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithHoliday/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });
    if (choices[0] === 3) {
        getcount++;
        xGet(urlMain, "main", false, function () {
            !--getcount && phase();
        });
    }
    function phase() {
        $("[id='x" + "Holiday" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        getcount++;
        xGet(url, "employees", false, function () {
            !--getcount && post();
        });
        var _main = $mapped[urlMain];
        if (choices[0] === 3 && _main.isStore) {
            getcount++;
            xGet(urlTrade, "tradehall", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 3 && !_main.isStore) {
            getcount++;
            xGet(urlSupply, "prodsupply", false, function () {
                !--getcount && post();
            });
        }
    }
    function post() {
        $("[id='x" + "Holiday" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var holiday = true;
        var _main = $mapped[urlMain];
        var _employees = $mapped[url];
        var _tradeHall = $mapped[urlTrade];
        var _prodSupply = $mapped[urlSupply];
        if (choices[0] === 2) {
            holiday = false;
        }
        else if (choices[0] === 3) {
            if (_main.isStore) {
                holiday = true;
                for (var i = 0; i < _tradeHall.stock.length; i++) {
                    if (_tradeHall.stock[i])
                        holiday = false;
                }
                if (!_tradeHall.stock.length)
                    holiday = true;
            }
            else {
                holiday = false;
                for (var i = 0; i < _prodSupply.stock.length; i++) {
                    if (!_prodSupply.stock[i])
                        holiday = true;
                }
                if (_prodSupply.stock.length !== _prodSupply.required.length)
                    holiday = true;
            }
        }
        var index = _employees.id.indexOf(subid);
        var onHoliday = _employees.onHoliday[index];
        if (holiday && !onHoliday) {
            xGet("/" + $realm + "/main/unit/view/" + subid + "/holiday_set", "none", false, function () {
                xTypeDone(policyName);
            });
        }
        else if (!holiday && onHoliday) {
            xGet("/" + $realm + "/main/unit/view/" + subid + "/holiday_unset", "none", false, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function incineratorPrice(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/sale";
    xGet(url, "service", false, function () {
        xGet(url2, "sale", false, function () {
            post();
        });
    });
    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _service = $mapped[url];
        var _sale = $mapped[url2];
        var change = false;
        var data = "setprice=1";
        for (var i = 0; i < _service.incineratorPrice.length; i++) {
            var price = 0;
            if (choices[0] === 1)
                price = _sale.incineratorMaxPrice[i];
            price = numberfy(price.toPrecision(4)); // TODO: тут как бы поправил, хз что он имел ввиду. явно привел к числу
            if (_service.incineratorPrice[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }
        }
        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function politicAgitation(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlFinance = "/" + $realm + "/main/unit/view/" + subid + "/finans_report/by_item";
    var urlAjax = "/" + $realm + "/ajax/unit/artefact/list/?unit_id=" + subid + "&slot_id=368592";
    xGet(url, "main", false, function () {
        phase();
    });
    function phase() {
        $("[id='x" + "Politics" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var getcount = 0;
        var _main = $mapped[url];
        if (!_main.hasAgitation && choices[0] === 1) {
            getcount += 1;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
    function post() {
        $("[id='x" + "Politics" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _main = $mapped[url];
        var _ajax = $mapped[urlAjax];
        for (var artid in $mapped[urlAjax]) {
            if (_ajax[artid].symbol === "agitation_1.gif" && numberfy(_ajax[artid].size) === _main.size) {
                xGet("/" + $realm + "/ajax/unit/artefact/attach/?unit_id=" + subid + "&artefact_id=" + artid + "&slot_id=368592", "none", false, function () {
                    xTypeDone(policyName);
                });
                break;
            }
        }
    }
}
function prodBooster(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlFinance = "/" + $realm + "/main/unit/view/" + subid + "/finans_report/by_item";
    var urlAjax = "/" + $realm + "/ajax/unit/artefact/list/?unit_id=" + subid + "&slot_id=300139";
    xGet(url, "main", false, function () {
        phase();
    });
    function phase() {
        $("[id='x" + "Solars" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var getcount = 0;
        var _main = $mapped[url];
        if (!_main.hasBooster && choices[0] === 1) {
            getcount += 1;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
        }
        else if (!_main.hasBooster && choices[0] === 2) {
            getcount += 2;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
            xGet(urlFinance, "financeitem", false, function () {
                !--getcount && post();
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
    function post() {
        $("[id='x" + "Solars" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _main = $mapped[url];
        var _ajax = $mapped[urlAjax];
        var _financeItem = $mapped[urlFinance];
        for (var artid in _ajax) {
            if (_ajax[artid].symbol === "20221659.gif" && numberfy(_ajax[artid].size) === _main.size) {
                if (choices[0] === 2) {
                    var costs = numberfy(_ajax[artid].initial_cost) / numberfy(_ajax[artid].ttl) + numberfy(_ajax[artid].cost_per_turn);
                    var savings = _financeItem.energy / 2;
                    if (costs >= savings) {
                        xTypeDone(policyName);
                        return false;
                    }
                }
                xGet("/" + $realm + "/ajax/unit/artefact/attach/?unit_id=" + subid + "&artefact_id=" + artid + "&slot_id=300139", "none", false, function () {
                    xTypeDone(policyName);
                });
                break;
            }
        }
        return false;
    }
}
function prodSupply(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/consume";
    var urlContract = "/" + $realm + "/ajax/unit/supply/create";
    xGet(url, "prodsupply", false, function () {
        phase();
    });
    function phase() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _prodSupply = $mapped[url];
        if (choices[0] >= 2 && !_prodSupply.isProd && choices[0] !== 4) {
            xGet(url2, "consume", false, function () {
                post();
            });
        }
        else {
            post();
        }
    }
    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _prodSupply = $mapped[url];
        var _consume = $mapped[url2];
        if (choices[0] === 4) {
            var data = 'destroy=1';
            for (var i = 0; i < _prodSupply.offer.length; i++) {
                data += "&" + encodeURI("multipleDestroy[]=" + _prodSupply.offer[i]);
            }
            if (_prodSupply.offer.length > 0) {
                xPost(url, data, function () {
                    xTypeDone(policyName);
                });
            }
            else {
                xTypeDone(policyName);
            }
        }
        else {
            if (_prodSupply.parcel.length !== _prodSupply.required.length) {
                choices[0] = 1;
                postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> is missing a supplier, or has too many suppliers!");
            }
            for (var i = 0; i < _prodSupply.parcel.length; i++) {
                var newsupply = 0;
                if (choices[0] === 2 && _prodSupply.isProd) {
                    newsupply = _prodSupply.required[i];
                }
                else if (choices[0] === 2 && !_prodSupply.isProd) {
                    newsupply = _consume.consump[i];
                }
                else if (choices[0] === 3 && _prodSupply.isProd) {
                    newsupply = Math.min(2 * _prodSupply.required[i], Math.max(3 * _prodSupply.required[i] - _prodSupply.stock[i], 0));
                }
                else if (choices[0] === 3 && !_prodSupply.isProd) {
                    newsupply = Math.min(2 * _consume.consump[i], Math.max(3 * _consume.consump[i] - _prodSupply.stock[i], 0));
                }
                if (newsupply > 0 && _prodSupply.available[i] < newsupply) {
                    var prodText = (_prodSupply.isProd) ? "(production) " : "";
                    postMessage0("Subdivision " + prodText + "<a href=" + url + ">" + subid + "</a> has insufficient reserves at the supplier!");
                    break;
                }
            }
            var change = [];
            for (var i = 0; i < _prodSupply.parcel.length; i++) {
                var newsupply = 0;
                if (choices[0] === 1) {
                    newsupply = 0;
                }
                else if (choices[0] === 2 && _prodSupply.isProd) {
                    newsupply = _prodSupply.required[i];
                }
                else if (choices[0] === 2 && !_prodSupply.isProd) {
                    newsupply = _consume.consump[i];
                }
                else if (choices[0] === 3 && _prodSupply.isProd) {
                    newsupply = Math.min(2 * _prodSupply.required[i], Math.max(3 * _prodSupply.required[i] - _prodSupply.stock[i], 0));
                }
                else if (choices[0] === 3 && !_prodSupply.isProd) {
                    newsupply = Math.min(2 * _consume.consump[i], Math.max(3 * _consume.consump[i] - _prodSupply.stock[i], 0));
                }
                if (_prodSupply.parcel[i] !== newsupply || _prodSupply.reprice[i]) {
                    change.push({
                        amount: newsupply,
                        offer: _prodSupply.offer[i],
                        unit: subid,
                        priceMarkUp: _prodSupply.price_mark_up[i],
                        priceConstraint: _prodSupply.price_constraint_max[i],
                        constraintPriceType: _prodSupply.price_constraint_type[i],
                        qualityMin: _prodSupply.quality_constraint_min[i]
                    });
                }
            }
            // TODO: зачем каждый поставщик шлется отдельно? Разом все чтобы уменьшить число запросов
            var postcount = change.length;
            if (postcount) {
                for (var i = 0; i < change.length; i++) {
                    xContract(urlContract, change[i], function () {
                        !--postcount && xTypeDone(policyName);
                    });
                }
            }
            else {
                xTypeDone(policyName);
            }
        }
    }
}
function research(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/investigation";
    var urlProject = "/" + $realm + "/window/unit/view/" + subid + "/project_create";
    var urlUnit = "/" + $realm + "/window/unit/view/" + subid + "/set_experemental_unit";
    var urlForecast = "/" + $realm + "/ajax/unit/forecast";
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    xGet(url, "research", false, function () {
        $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _research = $mapped[url];
        if (choices[0] === 1 && _research.isFree) {
            xGet(urlManager, "manager", false, function () {
                var _top = $mapped[urlManager];
                var managerIndex = _top.pic.indexOf("/img/qualification/research.png");
                var manager = _top.base[managerIndex] + _top.bonus[managerIndex];
                if (_research.level + 1 < calcTechLevel(manager)) {
                    xPost(urlProject, "industry=" + _research.industry + "&unit_type=" + _research.unittype, function (data) {
                        $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                        var isContinue = !!$(data).find(":submit").length;
                        if (isContinue) {
                            var data_1 = "industry=" + _research.industry + "&unit_type=" + _research.unittype + "&level=" + (_research.level + 1) + "&create=Invent";
                            xPost("/" + $realm + "/window/unit/view/" + subid + "/project_create", data_1, function () {
                                $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                                xTypeDone(policyName);
                            });
                        }
                        else {
                            postMessage0("Laboratory <a href=" + url + ">" + subid + "</a> reached the maximum technology level for its size. Could not research the next level.");
                            xTypeDone(policyName);
                        }
                    });
                }
                else {
                    xTypeDone(policyName);
                }
            });
        }
        else if (choices[0] === 1 && _research.isHypothesis && !_research.isBusy) {
            function calcProduct(p, n) {
                var value = 1;
                for (var m = 1; m <= n - 1; m++)
                    value = value * (1 - (1 / 100 * (m - 1) + p));
                return value;
            }
            function calcStudyTime(p, k) {
                //p is possibility between 0 and 1
                //k is reference time between 0 and +infinite    
                var value = 0;
                for (var n = 0; n <= 100 * (1 - p); n++)
                    value += k * (n + 1) * (1 / 100 * n + p) * calcProduct(p, n + 1);
                return value;
            }
            var favid = -1;
            var favindex = -1;
            var lowtime = Infinity;
            for (var i = 0; i < _research.chance.length; i++) {
                var studytime = calcStudyTime(_research.chance[i] / 100, _research.time[i]);
                if (studytime < lowtime) {
                    lowtime = studytime;
                    favid = _research.hypId[i];
                    favindex = i;
                }
            }
            if (_research.curIndex !== favindex) {
                var data = "selectedHypotesis=" + favid + "&selectIt=Select+a+hypothesis";
                xPost(url, data, function () {
                    $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                    xTypeDone(policyName);
                });
            }
            else {
                xTypeDone(policyName);
            }
        }
        else if (choices[0] === 1 && (_research.isAbsent || _research.isFactory)) {
            xGet(urlUnit, "experimentalunit", false, function () {
                $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                var _expUnit = $mapped[urlUnit];
                var effi = [];
                var contractcount = _expUnit.id.length;
                for (var i = 0; i < _expUnit.id.length; i++) {
                    (function (i) {
                        xContract(urlForecast, { "unit_id": _expUnit.id[i] }, function (data) {
                            $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                            effi.push({
                                "id": _expUnit.id[i],
                                "efficiency": numberfy(data.productivity),
                                "load": numberfy(data.loading)
                            });
                            !--contractcount && post();
                        });
                    })(i);
                }
                if (!_expUnit.id.length) {
                    postMessage0("There is no factory available to support laboratory <a href=" + url + ">" + subid + "</a>");
                    xTypeDone(policyName);
                }
                function post() {
                    $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                    var efficient = 0;
                    var index = -1;
                    for (var i = 0; i < effi.length; i++) {
                        if (efficient < effi[i].efficiency * effi[i].load) {
                            efficient = effi[i].efficiency * effi[i].load;
                            index = i;
                        }
                    }
                    if (index === -1) {
                        postMessage0("There is no factory available to support laboratory <a href=" + url + ">" + subid + "</a>");
                        xTypeDone(policyName);
                    }
                    else {
                        var data = "unit=" + effi[index].id + "&next=Select";
                        xPost(urlUnit, data, function () {
                            $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                            xTypeDone(policyName);
                        });
                    }
                }
            });
        }
        else {
            xTypeDone(policyName);
        }
    });
}
function retailPrice(policyName, subid, choices) {
    //debugger;
    var url = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";
    xGet(url, "tradehall", false, function () { phase(); });
    function phase() {
        $("#xPricecurrent").html("<a href=/" + $realm + "/main/unit/view/" + subid + ">" + subid + "</a>");
        var _tradeHall = $mapped[url];
        // запрос нужных ссылок для отработки потом опций
        switch (choices[0]) {
            case 2: // Market 10%
            case 3: // Turnover
            case 4: // stock
            case 7: // Sales
            case 8:
                {
                    // запрашиваем историю цен
                    var getcount = _tradeHall.history.length;
                    for (var i = 0; i < _tradeHall.history.length; i++) {
                        xGet(_tradeHall.history[i], "pricehistory", false, function () { !--getcount && post(); });
                    }
                }
                break;
            case 5:
                {
                    // запрос отчета по Рознице для товара в городе
                    var getcount = _tradeHall.report.length;
                    for (var i = 0; i < _tradeHall.report.length; i++) {
                        xGet(_tradeHall.report[i], "retailreport", false, function () { !--getcount && post(); });
                    }
                }
                break;
            default:
                post();
        }
    }
    function post() {
        $("#xPricecurrent").html("<a href=/" + $realm + "/main/unit/view/" + subid + ">" + subid + "</a>");
        var _tradeHall = $mapped[url];
        var change = false;
        var data = "action=setprice";
        // пробегаем по каждому товару Торгового зала
        for (var i = 0; i < _tradeHall.price.length; i++) {
            var price = 0;
            // опция 1. Стратегия установки цены
            switch (choices[0]) {
                case 1:
                    price = zero(i);
                    break;
                case 2:
                    price = market10(i);
                    break;
                case 3:
                    price = turnover(i);
                    break;
                case 4:
                    price = stock(i);
                    break;
                case 5:
                    price = local(i);
                    break;
                case 6:
                    price = city(i);
                    break;
                case 7:
                    price = sales(i);
                    break;
                case 8:
                    price = market6Ex(i);
                    break;
                default:
                    price = 0;
            }
            price = numberfy(price.toPrecision(4));
            // опция 2. ограничение мин цены продажи
            var myPurchPrice = _tradeHall.purch[i]; // цена закупки товара
            var myPrice = _tradeHall.price[i];
            var multiplier = [0, 1, 1.1, 1.4, 2];
            var prime = Math.round(myPurchPrice * multiplier[choices[1]]);
            price = Math.max(price, prime);
            // если цена подлежит изменению, поднять флаг и добавить в общий список.
            if (myPrice !== price && price > 0) {
                change = true;
                data += "&" + encodeURI(_tradeHall.name[i] + "=" + price);
            }
        }
        // если есть изменения цен, отправим данные, иначе завершаем
        if (change) {
            xPost(url, data, function () { xTypeDone(policyName); });
        }
        else {
            xTypeDone(policyName);
        }
    }
    function zero(item) {
        return 0;
    }
    function market6(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        var priceOld = _history.price[0]; // цена последней продажи
        var share = _tradeHall.share[item]; // доля рынка которую занимаем
        var price = priceOld || 0;
        if (share < 4.5)
            price *= (1 - 0.03);
        if (share > 7.5)
            price *= (1 + 0.03);
        return price;
    }
    function market6Ex(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        //debugger;
        // в расчетах предполагаем, что парсер нам гарантирует 0 или число, если элемент есть в массиве.
        // не паримся с undefined
        if (!_tradeHall) {
            postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> has unit == null");
            return 0;
        }
        if (!_history) {
            postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> has salesHistory == null");
            return 0;
        }
        // в истории продаж всегда должна быть хотя бы одна строка. Пусть с 0, но должна быть
        if (_history.price.length < 1) {
            postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> has salesHistory.price.length < 1");
            return 0;
        }
        // мое качество сегодня и цена стоящая в окне цены, кач и цена локальных магазов сегодня
        var myQuality = _tradeHall.quality[item];
        var myPrice = _tradeHall.price[item];
        var cityPrice = _tradeHall.cityprice[item];
        var cityQuality = _tradeHall.cityquality[item];
        // продажи сегодня и цена для тех продаж.
        var priceOld = _history.price[0];
        var saleOld = _history.quantity[0];
        var priceOlder = _history.price[1] || 0; // более старых цен может и не быть вовсе если продаж раньше не было
        var saleOlder = _history.quantity[1] || 0;
        // закупка и склад сегодня
        var deliver = _tradeHall.deliver[item];
        var stock = _tradeHall.stock[item];
        // доля рынка которую занимаем сегодня. если продаж не было то будет 0
        var share = _tradeHall.share[item];
        // если продаж вообще не было, история будет содержать 1 стру с нулями.
        var isNewProduct = Math.max.apply(null, _history.price) === 0;
        //if (unit.img[i].endsWith("sportfood.gif"))
        //    debugger;
        var stockNotSold = stock > deliver;
        var price = myPrice; // если алго не изменит цену на выходе, то останется старая.
        if (isNewProduct) {
            //debugger;
            // когда пришла первая поставка товара, цена еще 0, ставим базовую цену
            if (stock > 0 && stock === deliver)
                if (myPrice === 0)
                    price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
            // если товар уже был и цена стояла а продаж еще не было, плохо это. если не стояло, ставим базовую
            if (stock > deliver)
                if (myPrice > 0)
                    postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> has 0 sales for <img src=" + _tradeHall.img[item] + "></img> with Price:" + myPrice + ". Correct prices!");
                else
                    price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
        }
        // если на складе пусто, нужно все равно менять цену если продажи были.
        // просто потому что на след раз когда на складе будет товар но не будет продаж, мы долю рынка не увидим.
        if (!isNewProduct) {
            if (saleOld === 0) {
                // товар тока пришел. был перерыв в поставках
                if (stock > 0 && stock === deliver) {
                    if (myPrice === 0)
                        price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                }
                // товар на складе был, но не продавался
                if (stock > deliver) {
                    // TODO: как то подумать чтобы если продаж не было не снижать от установленной а привязаться к прошлым продажам если кач подходит
                    if (myPrice === 0)
                        price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                    else
                        postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> has 0 sales for <img src=" + _tradeHall.img[item] + "></img> with Price:" + myPrice + ". Correct prices!");
                }
            }
            if (saleOld > 0) {
                // рынок не занят и не все продаем? Снижаем цену. Если продали все то цену чуть повысим
                if (share < 4.5)
                    price = stock > deliver ? priceOld * (1 - 0.03) : priceOld * (1 + 0.01);
                // рынок занят и продали не все? Цену чуть снижаем. Если все продаем то повышаем цену, иначе продаваться будет больше
                if (share > 4.5 && share < 6)
                    price = stock > deliver ? priceOld * (1 - 0.01) : priceOld * (1 + 0.03);
                if (share > 6 && share < 7.5)
                    price = stock > deliver ? priceOld * (1 + 0.01) : priceOld * (1 + 0.03);
                if (share > 7.5)
                    price = stock > deliver ? priceOld * (1 + 0.03) : priceOld * (1 + 0.05);
            }
        }
        // если цена уже минимальна а продажи 0, алармить об этом
        return price;
    }
    ;
    function market10(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        var priceOld = _history.price[0]; // цена последней продажи
        var share = _tradeHall.share[item]; // доля рынка которую занимаем
        // если продаж еще не было, то цену оставляем как есть.
        var price = priceOld || 0;
        if (share < 8)
            price *= (1 - 0.03);
        if (share > 12)
            price *= (1 + 0.03);
        return price;
    }
    function stock(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        var priceOld = _history.price[0]; // цена последней продажи
        var deliver = _tradeHall.deliver[item]; // текущая закупка
        var stock = _tradeHall.stock[item]; // сейчас на складе
        var price = priceOld || 0;
        if (stock > 0 && deliver === stock)
            price *= (0.97 + 0.06);
        return price;
    }
    function turnover(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        var priceOld = _history.price[0]; // цена последней продажи
        var priceOlder = _history.price[1]; // 
        var saleOld = _history.quantity[0];
        var saleOlder = _history.quantity[1];
        var turnOld = saleOld * priceOld;
        var turnOlder = saleOlder * priceOlder;
        var price = 0;
        if (!priceOld)
            price = 0;
        else if (!priceOlder)
            price = priceOld * 1.03;
        else if ((turnOld > turnOlder) === (priceOld > priceOlder))
            price = priceOld * (1 + 0.03);
        else
            price = priceOld * (1 - 0.03);
        return price;
    }
    function sales(item) {
        var _tradeHall = $mapped[url];
        var _history = $mapped[_tradeHall.history[item]];
        var myPrice = _tradeHall.price[item];
        var myQuality = _tradeHall.quality[item]; // мое текущее качество на складе
        var myPurchPrice = _tradeHall.purch[item]; // цена закупки товара
        var priceOld = _history.price[0]; // цена последней продажи
        var priceOlder = _history.price[1]; // 
        var saleOld = _history.quantity[0];
        var saleOlder = _history.quantity[1];
        var price = 0;
        if (!priceOld)
            price = 0;
        else if (!priceOlder)
            price = priceOld * 1.03;
        else if ((saleOld > saleOlder) === (priceOld > priceOlder))
            price = priceOld * (1 + 0.03);
        else
            price = priceOld * (1 - 0.03);
        return price;
    }
    function local(item) {
        var _tradeHall = $mapped[url];
        var _report = $mapped[_tradeHall.report[item]];
        var myQuality = _tradeHall.quality[item]; // мое текущее качество на складе
        var localPrice = _report.localprice; // местные поставщики цена и качество
        var localQuality = _report.localquality;
        return calcBaseRetailPrice(myQuality, localPrice, localQuality);
    }
    function city(item) {
        var _tradeHall = $mapped[url];
        var myQuality = _tradeHall.quality[item]; // мое текущее качество на складе
        var cityPrice = _tradeHall.cityprice[item]; // местные магазы цена и кач
        var cityQuality = _tradeHall.cityquality[item];
        return calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
    }
    // расчет стартовой цены продажи в маге исходя из цены и кача местных магов. Потолок в 4 раза выше.
    function calcBaseRetailPrice(myQuality, localPrice, localQuality) {
        if (myQuality === 0 || localPrice === 0 || localQuality === 0)
            throw new Error("Аргументы должны быть > 0!");
        return Math.max(localPrice * (1 + Math.log(myQuality / localQuality)), 0, 4);
    }
}
function salary(policyName, subid, choices) {
    var url = "/" + $realm + "/window/unit/employees/engage/" + subid;
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var getcount = 0;
    if (choices[0] === 1) {
        getcount++;
        xGet(url, "salary", true, function () {
            !--getcount && post();
        });
    }
    else if (choices[0] >= 2) {
        getcount += 3;
        xGet(urlMain, "main", true, function () {
            !--getcount && post();
        });
        xGet(urlManager, "manager", false, function () {
            !--getcount && post();
        });
        xGet(url, "salary", true, function () {
            !--getcount && post();
        });
    }
    //choices[1]: ["min 80% max 500%", "max 500%", "min 80%", "No bound"]
    function post() {
        $("[id='x" + "Salary" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var change = false;
        var _salary = $mapped[url];
        var _main = $mapped[urlMain];
        var _top = $mapped[urlManager];
        if (_salary.salaryNow === 0) {
            change = true;
            _salary.form.find("#salary").val(_salary.salaryCity);
        }
        else if (choices[0] === 1 && (_salary.skillNow !== _salary.skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8))) {
            //"Required"
            change = true;
            _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, _salary.skillReq);
            if (choices[1] !== 3 && choices[1] !== 1) {
                _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
            }
            if (choices[1] !== 3 && choices[1] !== 2) {
                _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
            }
            _salary.form.find("#salary").val(_salary.salaryNow);
        }
        else if (choices[0] === 2) {
            //"Target"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], _top.base[managerIndex]);
            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        else if (choices[0] === 3) {
            //"Maximum"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]);
            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        else if (choices[0] === 4) {
            //"Overflow"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var manager = _top.base[managerIndex] + _top.bonus[managerIndex];
            var factor3 = subType[_main.img][1];
            var managerNew = manager * calcOverflowTop1(_main.maxEmployees, factor3, manager);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], managerNew);
            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        else if (choices[0] >= 5 && choices[0] <= 13) {
            //"20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"
            var loadPercent = 20;
            if (choices[0] === 6) {
                loadPercent = 30;
            }
            else if (choices[0] === 7) {
                loadPercent = 39;
            }
            else if (choices[0] === 8) {
                loadPercent = 50;
            }
            else if (choices[0] === 9) {
                loadPercent = 60;
            }
            else if (choices[0] === 10) {
                loadPercent = 69;
            }
            else if (choices[0] === 11) {
                loadPercent = 119;
            }
            else if (choices[0] === 12) {
                loadPercent = 139;
            }
            else if (choices[0] === 13) {
                loadPercent = 130;
            }
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = _salary.skillReq;
            var load = _salary.employees / calcEmployees(skillReq, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]) * 100;
            while (load < loadPercent) {
                skillReq += 0.01;
                load = _salary.employees / calcEmployees(skillReq, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]) * 100;
            }
            skillReq -= 0.01;
            skillReq = Math.max(skillReq, _salary.skillReq);
            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        if (change) {
            xPost(url, _salary.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function salePolicy(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/sale";
    xGet(url, "sale", false, function () {
        post();
    });
    function post() {
        $("[id='x" + "Policy" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var change = false;
        var _sale = $mapped[url];
        for (var i = 0; i < _sale.price.length; i++) {
            if (choices[0] === 1) {
                var policy = 0;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 2) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 1;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 3) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 3;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 4) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 5;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
        }
        if (change) {
            xPost(url, _sale.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function salePrice(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/sale";
    var urlContract = "/" + $realm + "/main/unit/view/" + subid + "/sale/product";
    var urlIP = "/" + $realm + "/main/geo/countrydutylist/359837";
    var urlTM = "/" + $realm + "/main/globalreport/tm/info";
    var urlCTIE = "/" + $realm + "/main/geo/regionENVD/359838";
    var urlTrans = "/" + $realm + "/main/common/main_page/game_info/transport";
    var urlReport = [];
    var getcount = 1;
    xGet(url, "sale", false, function () {
        !--getcount && phase();
    });
    if (choices[0] >= 3) {
        getcount = getcount + 2;
        xGet(urlTM, "TM", false, function () {
            !--getcount && phase();
        });
        xGet(urlIP, "IP", false, function () {
            !--getcount && phase();
        });
    }
    if (choices[0] === 4 || choices[0] === 5) {
        getcount++;
        xGet(urlTrans, "transport", false, function () {
            !--getcount && phase();
        });
    }
    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _sale = $mapped[url];
        var _transport = $mapped[urlTrans];
        if (choices[0] === 4) {
            getcount++;
            xGet(urlCTIE, "CTIE", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 5) {
            getcount++;
            var indexRegion = _transport.regionName.indexOf(_sale.region);
            var regionId = _transport.regionId[indexRegion];
            urlCTIE = "/" + $realm + "/main/geo/regionENVD/" + regionId;
            xGet(urlCTIE, "CTIE", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 8) {
            getcount += _sale.price.length + 1;
            xGet("/" + $realm + "/main/common/util/setpaging/reportcompany/marketingProduct/40000", "none", false, function () {
                !--getcount && post();
            });
            for (var i = 0; i < _sale.price.length; i++) {
                urlReport.push("/" + $realm + "/main/globalreport/marketing/by_products/" + _sale.productId[i]);
                xGet(urlReport[i], "productreport", false, function () {
                    !--getcount && post();
                });
            }
            if (_sale.contractpage) {
                getcount++;
                xGet(urlContract, "salecontract", false, function () {
                    var _saleContract = $mapped[urlContract];
                    getcount += _saleContract.category.length;
                    for (var i = 0; i < _saleContract.category.length; i++) {
                        xGet(_saleContract.category[i], "salecontract", false, function () {
                            !--getcount && post();
                        });
                    }
                    !--getcount && post();
                });
            }
        }
        else {
            post();
        }
    }
    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _sale = $mapped[url];
        var _tm = $mapped[urlTM];
        var _ip = $mapped[urlIP];
        var _transport = $mapped[urlTrans];
        var _ctie = $mapped[urlCTIE];
        var _saleContract = $mapped[urlContract];
        var change = false;
        for (var i = 0; i < _sale.price.length; i++) {
            var _report = $mapped[urlReport[i]];
            var primecost = choices[1] ? _sale.outprime[i] : _sale.stockprime[i];
            var quality = choices[1] ? _sale.outqual[i] : _sale.stockqual[i];
            var price = 0;
            if (choices[0] === 2) {
                price = 0.01;
            }
            else if (choices[0] === 3) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = primecost + 0.01 < 30 * IP ? primecost + 0.01 : primecost;
                price = Math.round(price * 100) / 100;
            }
            else if (choices[0] === 4) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                var indexCTIE = _ctie.product.indexOf(product);
                var CTIE = _ctie.CTIE[indexCTIE];
                var priceCTIE = primecost * (1 + CTIE / 100);
                price = Math.round(priceCTIE * 100) / 100;
                price = price < 30 * IP ? price : primecost;
            }
            else if (choices[0] === 5) {
                var indexRegion = _transport.regionName.indexOf(_sale.region);
                var regionId = _transport.regionId[indexRegion];
                urlCTIE = "/" + $realm + "/main/geo/regionENVD/" + regionId;
                _ctie = $mapped[urlCTIE];
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                var indexCTIE = _ctie.product.indexOf(product);
                var CTIE = _ctie.CTIE[indexCTIE];
                var priceCTIE = primecost * (1 + CTIE / 100 * _ctie.profitTax / 100);
                price = Math.round(priceCTIE * 100) / 100;
                price = price < 30 * IP ? price : primecost;
            }
            else if (choices[0] === 6) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = IP;
            }
            else if (choices[0] === 7) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = 30 * IP;
            }
            else if (choices[0] === 8) {
                // TODO: нахуевертил хуй разберешь. запилить здесь иначе PQR не работает.
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                var favPQR = Infinity;
                for (var j = 0; j < _report.price.length; j++) {
                    var allowed = _report.max[j] === 0 || _report.max[j] * 3 > _report.total[j] - _report.available[j];
                    if (allowed && subid !== _report.subid[j]) {
                        var PQR = _report.price[j] / _report.quality[j];
                        if (PQR < favPQR) {
                            favPQR = PQR;
                        }
                    }
                }
                var thisproduct = false;
                var lowprice = Infinity;
                var highprice = 0;
                // TODO: тут могут быть косяки! возможно будет криво считать цены закупщиков и не будет работать. проверять.
                if (_sale.contractpage && _saleContract.category.length) {
                    var _contract = { contractprice: ["", 0, 0], category: [] };
                    for (var j = 0; j < _saleContract.category.length; j++) {
                        _contract = $mapped[_saleContract.category[j]];
                        if (_contract.contractprice[0] === _sale.product[i]) {
                            thisproduct = true;
                            break;
                        }
                    }
                    if (_contract.contractprice[0] === "")
                        throw new Error("Неведомая хуйня но что то не так с PQR salePrice");
                    var contractprices = thisproduct ? _contract.contractprice : [];
                    for (var j = 1; j < contractprices.length; j++) {
                        lowprice = Math.min(lowprice, contractprices[j]);
                        highprice = Math.max(highprice, contractprices[j]);
                    }
                }
                else {
                    var contractprices = _sale.contractpage && _saleContract ? _saleContract.contractprice : _sale.contractprice;
                    for (var j = 0; j < contractprices.length; j++) {
                        if (contractprices[j] === _sale.product[i]) {
                            thisproduct = true;
                        }
                        else if (typeof contractprices[j] === "string") {
                            thisproduct = false;
                        }
                        else if (thisproduct) {
                            lowprice = Math.min(lowprice, contractprices[j]);
                            highprice = Math.max(highprice, contractprices[j]);
                        }
                    }
                }
                price = Math.round(favPQR * quality * 100) / 100;
                if (highprice > 0) {
                    price = Math.max(Math.ceil(highprice * 0.91 * 100) / 100, price);
                    price = Math.min(Math.floor(lowprice * 1.09 * 100) / 100, price);
                }
                price = Math.min(price, 30 * IP);
                price = Math.max(price, primecost);
            }
            if (_sale.price[i] !== price && (primecost || choices[2] === 1)) {
                change = true;
                _sale.form.find("input.money:even").eq(i).val(price);
            }
        }
        if (change) {
            _sale.form.find("select[id] option").prop("selected", true);
            xPost(url, _sale.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function servicePrice(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/consume";
    xGet(url, "service", false, function () {
        phase();
    });
    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _service = $mapped[url];
        var getcount = _service.history.length * 2;
        for (var i = 0; i < _service.history.length; i++) {
            xGet(_service.history[i], "servicepricehistory", false, function () {
                !--getcount && post();
            });
            xGet(url2, "consume", false, function () {
                !--getcount && post();
            });
        }
    }
    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _service = $mapped[url];
        var _consume = $mapped[url2];
        var change = false;
        var data = "setprice=1";
        for (var i = 0; i < _service.price.length; i++) {
            var _serviceHistory = $mapped[_service.history[i]];
            var price = 0;
            if (choices[0] === 1) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];
                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (saleOld > saleOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            }
            else if (choices[0] === 2) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var turnOld = _serviceHistory.quantity[0] * priceOld;
                var turnOlder = _serviceHistory.quantity[1] * priceOlder;
                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (turnOld > turnOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            }
            else if (choices[0] === 3) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];
                var profitOld = (priceOld - _consume.purch[0]) * saleOld;
                var profitOlder = (priceOlder - _consume.purch[0]) * saleOlder;
                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (profitOld > profitOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            }
            price = numberfy(price.toPrecision(4));
            var multiplier = [0, 1, 1.1, 1.4, 2];
            var prime = Math.round(_consume.purch[0] * multiplier[choices[1]]);
            price = Math.max(price, prime);
            if (_service.price[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }
        }
        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function serviceWithoutStockPrice(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    xGet(url, "service", false, function () {
        phase();
    });
    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _service = $mapped[url];
        var getcount = _service.history.length;
        for (var i = 0; i < _service.history.length; i++) {
            xGet(_service.history[i], "servicepricehistory", false, function () {
                !--getcount && post();
            });
        }
    }
    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _service = $mapped[url];
        var change = false;
        var data = "setprice=1";
        for (var i = 0; i < _service.price.length; i++) {
            var _serviceHistory = $mapped[_service.history[i]];
            var price = 0;
            if (choices[0] === 1) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];
                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (saleOld > saleOlder) === (priceOld > priceOlder) ? 1.03 * priceOld : 0.97 * priceOld;
                }
            }
            else if (choices[0] === 2) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var turnOld = _serviceHistory.quantity[0] * priceOld;
                var turnOlder = _serviceHistory.quantity[1] * priceOlder;
                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (turnOld > turnOlder) === (priceOld > priceOlder) ? 1.03 * priceOld : 0.97 * priceOld;
                }
            }
            price = numberfy(price.toPrecision(4));
            if (_service.price[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }
        }
        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function storeSupply(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlContract = "/" + $realm + "/ajax/unit/supply/create";
    var urlTrade = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";
    //debugger;
    var getcount = 1;
    xGet(url, "storesupply", false, function () {
        !--getcount && phase();
    });
    if (choices[1] >= 1) {
        getcount++;
        xGet(urlTrade, "tradehall", false, function () {
            !--getcount && phase();
        });
    }
    var reports = [];
    function phase() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _storeSupply = $mapped[url];
        var _tradeHall = $mapped[urlTrade];
        if (choices[1] >= 4 || choices[2] >= 1) {
            getcount += _storeSupply.img.length;
            for (var i = 0; i < _storeSupply.img.length; i++) {
                var index = _tradeHall.img.indexOf(_storeSupply.img[i]);
                reports.push(_tradeHall.report[index]);
                xGet(reports[i], "retailreport", false, function () {
                    !--getcount && post();
                });
            }
        }
        else {
            post();
        }
    }
    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _storeSupply = $mapped[url];
        var _tradeHall = $mapped[urlTrade];
        var change = [];
        if (_storeSupply.parcel.length !== _storeSupply.sold.length) {
            choices[0] = 1;
            postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> is missing a supplier, or has too many suppliers!");
        }
        for (var i = 0; i < _storeSupply.parcel.length; i++) {
            var newsupply = 0;
            if (choices[0] === 2) {
                newsupply = _storeSupply.sold[i];
            }
            else if (choices[0] === 3) {
                newsupply = _storeSupply.quantity[i] === _storeSupply.purchase[i]
                    ? _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 1 * 0.25)
                    : _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 0 * 0.25);
            }
            else if (choices[0] === 4) {
                newsupply = Math.min(2 * _storeSupply.sold[i], 3 * _storeSupply.sold[i] - _storeSupply.quantity[i]);
            }
            else if (choices[0] === 5) {
                newsupply = (_storeSupply.sold[i] > _storeSupply.quantity[i] / 2)
                    ? _storeSupply.sold[i] * (0.4 * 1 + 0.8)
                    : _storeSupply.sold[i] * (0.4 * 0 + 0.8);
            }
            if (newsupply > 0 && _storeSupply.available[i] < newsupply) {
                postMessage0("Subdivision (store) <a href=" + url + ">" + subid + "</a> has insufficient reserves at the supplier!");
                break;
            }
        }
        for (var i = 0; i < _storeSupply.parcel.length; i++) {
            //[["-", "Zero", "Sold", "Amplify", "Stock", "Enhance"], 
            // ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], 
            // ["Any Q", "Local Q", "City Q"]],
            var newsupply = 0;
            if (choices[0] === 1) {
                newsupply = 0;
            }
            else if (choices[0] === 2) {
                newsupply = _storeSupply.sold[i];
            }
            else if (choices[0] === 3) {
                newsupply = _storeSupply.quantity[i] === _storeSupply.purchase[i]
                    ? _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 1 * 0.25)
                    : _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 0 * 0.25);
            }
            else if (choices[0] === 4) {
                newsupply = Math.min(2 * _storeSupply.sold[i], 3 * _storeSupply.sold[i] - _storeSupply.quantity[i]);
            }
            else if (choices[0] === 5) {
                newsupply = (_storeSupply.sold[i] > _storeSupply.quantity[i] / 2)
                    ? _storeSupply.sold[i] * (0.4 * 1 + 0.8)
                    : _storeSupply.sold[i] * (0.4 * 0 + 0.8);
            }
            var minsupply = 0;
            var _retailReport = $mapped[reports[i]];
            if (choices[1] === 1) {
                minsupply = 1;
            }
            else if (choices[1] === 2) {
                minsupply = Math.ceil(1000 / _storeSupply.price[i]);
            }
            else if (choices[1] === 3) {
                minsupply = Math.ceil(1000000 / _storeSupply.price[i]);
            }
            else if (choices[1] === 4) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.01);
            }
            else if (choices[1] === 5) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.05);
            }
            else if (choices[1] === 6) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.10);
            }
            newsupply = Math.max(newsupply, minsupply - _storeSupply.quantity[i] + _storeSupply.purchase[i]);
            var nosupply = false;
            if (choices[2] === 1) {
                nosupply = _storeSupply.quality[i] != null && _storeSupply.quality[i] < _retailReport.localquality;
            }
            else if (choices[2] === 2) {
                nosupply = _storeSupply.quality[i] != null && _storeSupply.quality[i] < _retailReport.cityquality;
            }
            if (nosupply) {
                newsupply = 0;
            }
            if (_storeSupply.parcel[i] !== newsupply || _storeSupply.reprice[i]) {
                change.push({
                    amount: newsupply,
                    offer: _storeSupply.offer[i],
                    unit: subid,
                    priceConstraint: _storeSupply.price_constraint_max[i],
                    priceMarkUp: _storeSupply.price_mark_up[i],
                    qualityMin: _storeSupply.quality_constraint_min[i],
                    constraintPriceType: _storeSupply.price_constraint_type[i]
                });
            }
        }
        // TODO: тут походу каждый товар шлется отдельно, есть смысл посылать одной кнопкой. так будет вернее.
        var postcount = change.length;
        if (postcount) {
            for (var i = 0; i < change.length; i++) {
                xContract(urlContract, change[i], function () {
                    !--postcount && xTypeDone(policyName);
                });
            }
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function technology(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/technology";
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var getcount = 2;
    xGet(url, "tech", false, function () {
        !--getcount && post();
    });
    xGet(urlManager, "manager", false, function () {
        !--getcount && post();
    });
    function post() {
        $("[id='x" + "Technology" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _top = $mapped[urlManager];
        var _tech = $mapped[url];
        var change = false;
        var newTech = -1;
        if (choices[0] === 1) {
            var managerIndex = _top.pic.indexOf(subType[_tech.img][2]);
            var managerQual = _top.base[managerIndex] + _top.bonus[managerIndex];
            var techLevel = calcTechLevel(managerQual);
            // если цена технологии нулевая, то купит которую можно.
            // TODO: неясно чего оно тут проверяет строку а не число. возможно тупняк или так надо
            for (var i = _tech.price.length - 1; i >= 0; i--) {
                if (_tech.price[i] === "$0.00" && (i + 1) <= techLevel && (i + 1) > _tech.tech && _tech.tech > 0) {
                    newTech = i + 1;
                    change = true;
                    break;
                }
            }
        }
        if (change) {
            xPost(url, "level=" + newTech + "&impelentit=Buy+a+technology", function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function training(policyName, subid, choices) {
    var url = "/" + $realm + "/window/unit/employees/education/" + subid;
    var urlValue = "/" + $realm + "/ajax/unit/employees/calc_new_lvl_after_train/" + subid;
    xGet(url, "training", false, function () {
        phase();
    });
    var expectedSkill = 0;
    function phase() {
        $("[id='x" + "Training" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _train = $mapped[url];
        if (choices[0] === 3 && _train.form.length) {
            xContract(urlValue, "employees=" + _train.employees + "&weeks=4", function (data) {
                expectedSkill = data.employees_level;
                post();
            });
        }
        else if (_train.form.length) {
            post();
        }
        else {
            xTypeDone(policyName);
        }
    }
    function post() {
        $("[id='x" + "Training" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _train = $mapped[url];
        var change = false;
        if (choices[0] === 1) {
            change = true;
            _train.form.find("#unitEmployeesData_timeCount").val(4);
        }
        else if (choices[0] === 2 && _train.salaryNow > _train.salaryCity) {
            change = true;
            _train.form.find("#unitEmployeesData_timeCount").val(4);
        }
        else if (choices[0] === 3) {
            var salaryNew = calcSalary(_train.salaryNow, _train.salaryCity, expectedSkill, _train.skillCity, _train.skillNow);
            salaryNew = Math.max(salaryNew, 0.8 * _train.salaryCity);
            var savings = (_train.salaryNow - salaryNew) * 365;
            var costs = _train.weekcost * 4 / _train.employees;
            if (savings > costs) {
                change = true;
                _train.form.find("#unitEmployeesData_timeCount").val(4);
            }
        }
        if (change) {
            xPost(url, _train.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}
function wareSize(policyName, subid, choices) {
    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlSize = "/" + $realm + "/window/unit/upgrade/" + subid;
    xGet(url, "waremain", false, function () {
        phase();
    });
    var min;
    var max;
    if (choices[0] === 1) {
        min = 69 / 5;
        max = 69.5;
    }
    else {
        min = 20;
        max = 200;
    }
    function phase() {
        $("[id='x" + "Size" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _ware = $mapped[url];
        if (_ware.full < min || _ware.full > max) {
            xGet(urlSize, "size", false, function () {
                post();
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
    function post() {
        $("[id='x" + "Size" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _ware = $mapped[url];
        var _wareSize = $mapped[urlSize];
        if (_ware.size < 10) {
            _ware.size = _ware.size * 1000;
        }
        for (var i = 0; i < _wareSize.rent.length; i++) {
            if (_wareSize.size[i] < 10) {
                _wareSize.size[i] = _wareSize.size[i] * 1000;
            }
            var coef = _wareSize.size[i] / _ware.size;
            var normal = _ware.full / coef > min && _ware.full / coef < max;
            var low = i === 0 && _wareSize.size[i] < _ware.size && _ware.full / coef < min;
            var high = i === _wareSize.rent.length && _wareSize.size[i] > _ware.size && _ware.full / coef > max;
            if (normal || low || high) {
                xPost("/" + $realm + "/window/unit/upgrade/" + subid, "upgrade%5Bbound%5D=" + _wareSize.id[i], function () {
                    xTypeDone(policyName);
                });
                return false;
            }
        }
        xTypeDone(policyName);
        return false;
    }
}
function wareSupply(policyName, subid, choices, good) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlContract = [];
    var getcount = 2;
    xGet(url, "waresupply", true, function () {
        !--getcount && phase();
    });
    xGet(urlMain, "waremain", true, function () {
        !--getcount && phase();
    });
    if (choices[1] >= 1) {
        var minFreeForBuy = 1;
        //"Any available volume"
        // , "1k", "10k", "100k"
        // , "1m", "10m", "100m"
        // , "1b", "10b", "100b"
        if (choices[3] > 0) {
            minFreeForBuy = 100 * Math.pow(10, choices[3]);
        }
        getcount += 3;
        xGet("/" + $realm + "/window/common/util/setpaging/dbwarehouse/supplyList/40000", "none", false, function () {
            !--getcount && phase();
        });
        var data = "total_price%5Bfrom%5D=&total_price%5Bto%5D=&quality%5Bfrom%5D=&quality%5Bto%5D=&quantity%5Bfrom%5D=&free_for_buy%5Bfrom%5D=" + minFreeForBuy + "&brand_value%5Bfrom%5D=&brand_value%5Bto%5D=";
        xPost("/" + $realm + "/window/common/util/setfiltering/dbwarehouse/supplyList", data, function () {
            !--getcount && phase();
        });
        xGet("/" + $realm + "/window/common/util/setfiltering/dbwarehouse/supplyList/supplierType=all/tm=all", "none", false, function () {
            !--getcount && phase();
        });
    }
    function phase() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _wareSupp = $mapped[url];
        var _ware = $mapped[urlMain];
        var contract = _wareSupp.contract.concat(_wareSupp.contractAdd);
        var id = _wareSupp.id.concat(_wareSupp.idAdd);
        var type = _wareSupp.type.concat(_wareSupp.typeAdd);
        if (choices[1] >= 1 && _wareSupp.type.length) {
            for (var i = 0; i < _ware.product.length; i++) {
                if (good && _ware.product[i] !== good)
                    continue;
                getcount++;
                var index = type.indexOf(_ware.product[i]);
                urlContract[i] = contract[index];
                xsup.push([subid, id[index],
                    (function (urlCon, type) {
                        xGet(urlCon, "contract", true, function () {
                            xsupGo(subid, type);
                            !--getcount && post();
                        });
                    }.bind(this, contract[index], id[index]))
                ]);
            }
            xsupGo();
        }
        else {
            post();
        }
    }
    var change = [];
    var deletechange = false;
    var deletestring = "contractDestroy=1";
    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        var _wareSupp = $mapped[url];
        var _ware = $mapped[urlMain];
        var supplier = [];
        var j = 0;
        var x = 0;
        for (var i = 0; i < _ware.product.length; i++) {
            var newsupply = 0;
            if (choices[0] === 2) {
                newsupply = _ware.shipments[i];
            }
            else if (choices[0] === 3) {
                newsupply = Math.min(2 * _ware.shipments[i], Math.max(3 * _ware.shipments[i] - _ware.stock[i], 0));
            }
            else if (choices[0] === 4) {
                newsupply = (_ware.shipments[i] > _ware.stock[i] / 2)
                    ? _ware.shipments[i] * (0.4 * 1 + 0.8)
                    : _ware.shipments[i] * (0.4 * 0 + 0.8);
            }
            else if (choices[0] === 5) {
                newsupply = Math.min(Math.sqrt(_ware.shipments[i] / _ware.stock[i] * 2), 2) * _ware.shipments[i];
            }
            else if (choices[0] === 6) {
                newsupply = Infinity;
            }
            newsupply = Math.ceil(newsupply);
            var set = newsupply;
            var jstart = j;
            supplier = [];
            while (_ware.product[i] === _wareSupp.product[j]) {
                supplier.push({
                    available: _wareSupp.available[j],
                    PQR: _wareSupp.price[j] / _wareSupp.quality[j],
                    offer: _wareSupp.offer[j],
                    myself: _wareSupp.myself[j],
                    index: j,
                    sup: j - jstart,
                    priceMarkUp: _wareSupp.price_mark_up[j],
                    priceConstraint: _wareSupp.price_constraint_max[j],
                    constraintPriceType: _wareSupp.price_constraint_type[j],
                    qualityMin: _wareSupp.quality_constraint_min[j]
                });
                j++;
            }
            if (good && _ware.product[i] !== good) {
                continue;
            }
            if (choices[1] === 0) {
                supplier.sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
                var toset = 0;
                for (var k = 0; k < supplier.length; k++) {
                    toset = Math.min(set, supplier[k].available);
                    set -= toset;
                    if (_wareSupp.parcel[supplier[k].index] !== toset || _wareSupp.reprice[supplier[k].index]) {
                        change.push({
                            'newsup': false,
                            'offer': supplier[k].offer,
                            'amount': toset,
                            'priceMarkUp': supplier[k].priceMarkUp,
                            'priceConstraint': supplier[k].priceConstraint,
                            'constraintPriceType': supplier[k].constraintPriceType,
                            'qualityMin': supplier[k].qualityMin
                        });
                    }
                }
                if (set > 0) {
                    postMessage0("Not enough suppliers for product " + _ware.product[i] + " in warehouse <a href=" + url + ">" + subid + "</a>");
                }
            }
            else if (choices[1] >= 1) {
                var product = _ware.product[i];
                var offers = supplier.map(function (contract) {
                    return contract.offer;
                });
                var mix = supplier.slice();
                var indexcount = mix.length;
                var _contract = $mapped[urlContract[i]];
                for (var k = 0; k < _contract.offer.length; k++) {
                    if (offers.indexOf(_contract.offer[k]) === -1 && (_contract.tm[k] === product || !_contract.tm[k] && _contract.product === product) && blackmail.indexOf(_contract.company[k]) === -1) {
                        mix.push({
                            available: _contract.available[k],
                            PQR: _contract.price[k] / _contract.quality[k],
                            offer: _contract.offer[k],
                            company: _contract.company[k],
                            myself: _contract.myself[k],
                            row: k
                        });
                    }
                }
                mix.sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
                if (choices[2] === 0) {
                    set = Math.max(set, 1);
                }
                for (var k = 0; k < mix.length; k++) {
                    var comp = mix[k].myself && choices[1] === 1 || !mix[k].myself && choices[1] === 3 || choices[1] === 2;
                    var toset = Math.min(set, mix[k].available) * comp;
                    set -= toset;
                    if (choices[2] === 2 && mix[k].index >= 0) {
                        toset = Math.max(toset, 1);
                    }
                    if (mix[k].available && (toset > 0 || choices[2] >= 1 && mix[k].index >= 0) && (mix[k].row >= 0 || mix[k].index >= 0 && (_wareSupp.parcel[mix[k].index] !== toset || _wareSupp.reprice[mix[k].index]))) {
                        change.push({
                            'newsup': mix[k].row >= 0,
                            'offer': mix[k].offer,
                            'amount': toset,
                            'company': mix[k].company,
                            'good': product,
                            'priceMarkUp': mix[k].priceMarkUp,
                            'priceConstraint': mix[k].priceConstraint,
                            'constraintPriceType': mix[k].constraintPriceType,
                            'qualityMin': mix[k].qualityMin
                        });
                        if (mix[k].row >= 0) {
                            _contract.available[mix[k].index] -= toset;
                        }
                    }
                    else if (mix[k].index >= 0 && toset === 0 && choices[2] === 0 || mix[k].index >= 0 && !mix[k].available) {
                        deletechange = true;
                        deletestring += "&supplyContractData%5Bselected%5D%5B%5D=" + mix[k].offer;
                        supplier.splice(mix[k].sup, 1);
                    }
                }
                if (set > 0) {
                    postMessage0("Not enough suppliers for product " + product + " in warehouse <a href=" + url + ">" + subid + "</a>");
                }
            }
        }
        var contractcount = change.length + (deletechange ? 1 : 0);
        if (deletechange) {
            xPost(url, deletestring, function () {
                contractcount--;
                further();
            });
        }
        else {
            further();
        }
        function further() {
            for (var i = 0; i < change.length; i++) {
                (function (steak) {
                    xContract("/" + $realm + "/ajax/unit/supply/create", {
                        'offer': steak.offer,
                        'unit': subid,
                        'amount': steak.amount,
                        'priceConstraint': steak.priceConstraint,
                        'priceMarkUp': steak.priceMarkUp,
                        'qualityMin': steak.qualityMin,
                        'constraintPriceType': steak.constraintPriceType
                    }, function (data) {
                        if (data.result === "-5" && blackmail.indexOf(steak.company) === -1) {
                            postMessage0("You are blackmailed by the company 「" + steak.company + "」!");
                            blackmail.push(steak.company);
                        }
                        if (data.result === "-5") {
                            wareSupply(policyName, subid, choices, steak.good);
                        }
                        if (data.result !== "-5" && steak.newsup) {
                            suppliercount++;
                            $("#XioSuppliers").text(suppliercount);
                        }
                        if (data.result !== "-5") {
                            !--contractcount && xTypeDone(policyName);
                        }
                    });
                })(change[i]);
            }
            if (contractcount === 0) {
                xTypeDone(policyName);
            }
            change = [];
        }
    }
}
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
//# sourceMappingURL=XioScript.user.js.map