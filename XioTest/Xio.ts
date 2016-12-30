// ==UserScript==
// @name           XioScript
// @namespace      https://github.com/XiozZe/XioScript
// @description    XioScript with XioMaintenance
// @version        12.0.80
// @author		   XiozZe
// @require        https://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js
// @include        http*://*virtonomic*.*/*/*
// @exclude        http*://virtonomics.wikia.com*
// ==/UserScript==
// включены опции стриктНулл.
// запрет неявных Эни, ретурнов, this

var version = "12.0.83";

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
var mousedown = false;
var $tron: HTMLElement;
var XMreload = false;
var xsup = [];
var xsupcheck = {};
var urlUnitlist = "";
var blackmail = [];
let _m = $(".dashboard a").attr("href").match(/\d+/) as string[];
var companyid = numberfy(_m ? _m[0] : "0");
var equipfilter = [];

interface IDictionary<T> {
    [index: string]: T;
}

interface IPolicy {
    func: () => void;
    save: string[][];
    order: string[][];
    name: string;
    group: string;
    wait: string[];
}

let policyJSON: IDictionary<IPolicy> = {
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
        save: [["-", "Required", "Maximal", "Q2.00"], ["Black", "Full", "Perc"]],  //Fill
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


// возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо 0 если не получилось преобразовать.
function numberfy(variable: string): number {
    if (String(variable) === 'Не огр.' ||
        String(variable) === 'Unlim.' ||
        String(variable) === 'Не обм.' ||
        String(variable) === 'N’est pas limité' ||
        String(variable) === 'No limitado' ||
        String(variable) === '无限' ||
        String(variable) === 'Nicht beschr.') {
        return Number.POSITIVE_INFINITY;
    } else {
        return parseFloat(variable.replace(/[\s\$\%\©]/g, "")) || 0;
        //return parseFloat(String(variable).replace(/[\s\$\%\©]/g, "")) || 0;
    }
};

function buildingShortener() : void {
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

function xpCookie(name: string): string | null {
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


function XioMaintenance(subidList:number[], policyNames:string[]) {
     throw new Error("Not implemented");
};

function XioExport() {
    throw new Error("Not implemented");
};

function XioImport() {
    throw new Error("Not implemented");
};

function XioHoliday() {
    throw new Error("Not implemented");
};

function XioOverview() {
    throw new Error("Not implemented");
};

function topManagerStats() {
    throw new Error("Not implemented");
}

function preference(policies: string[]) : boolean {
    
    // работать будем с конкретным юнитом в котором находимся
    let subidRx = document.URL.match(/(view\/?)\d+/);
    if (subidRx == null)
        return false;

    let subid = numberfy(subidRx[0].split("/")[1]);

    // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
    let savedPolicyStrings: string[] = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
    let savedPolicies: string[] = [];
    let savedPolicyChoices: string[][] = [];
    for (var i = 0; i < savedPolicyStrings.length; i++) {
        savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
        savedPolicyChoices[i] = savedPolicyStrings[i].substring(2).split("-");
    }
    
    // место под комбобоксы настроек
    let $topblock = $("div.metro_header");
    $topblock.append("<table id=XMoptions style='font-size: 14px; color:gold;'><tr id=XMHead></tr><tr id=XMOpt></tr></table>");

    let policyNames: string[] = [];
    let headstring = "";
    let htmlstring = "";
    let setpolicies: any = [];

    for (var i = 0; i < policies.length; i++) {
        let policy = policyJSON[policies[i]];

        // вдруг такой политики не описано. чудо как бы
        if (!policy)
            continue;

        policyNames.push(policy.group);
        headstring += `<td>${policy.group}</td>`;
        htmlstring += `<td id=${policies[i]}>`;     // id=pp/ps/pw и так далее

        // наполняем комбобоксы списками политик в том порядке в каком они должны отображаться
        for (var j = 0; j < policy.order.length; j++) {
            if (j >= 1)
                htmlstring += "<br>";

            htmlstring += "<select class=XioPolicy data-index=" + j + ">";

            for (var k = 0; k < policy.order[j].length; k++)
                htmlstring += "<option>" + policy.order[j][k] + "</option>";

            htmlstring += "</select>";

            // если есть сохраненные данные для данной политики у юнита
            // кладем все функции установщиков в массив чтобы потом разом вызвать. ебанутое решение имхо
            let index = savedPolicies.indexOf(policies[i]);
            if (index >= 0) {
                let savedChoice = numberfy(savedPolicyChoices[index][j]);
                let policyChoice = policy.order[j].indexOf(policy.save[j][savedChoice]);

                // хитрый ход конем чтобы сохранить контекст. переменные нужно запомнить.
                // здесь был bind но он жопа. Анонимная функция лучше
                let setter = () => {
                    var _policyStr = policies[i]; // запоминаем в скоупе функции переменные которые нам надо
                    var _ind = j;
                    var _choice = policyChoice;

                    // вернем анонимную функцию которая выполнится в скоупе где переменные запомнены
                    return () => $(`#${_policyStr} select:eq(${_ind}) option`).eq(_choice).attr("selected", "true");
                }
                setpolicies.push(setter());
            }
        }
        htmlstring += "</td>";
    }

    $("#XMHead").html(headstring);
    $("#XMOpt").html(htmlstring);
    for (var i = 0; i < setpolicies.length; i++)
        setpolicies[i]();

    if (policies.length) {
        let $selects = $("#XMoptions select");
        let wa = $selects.map((i, e) => $(e).width()).get() as any as number[];
        let width = wa.concat([0]).reduce((p, c) => Math.max(p, c));    // находим макс ширину из всех элементов селектов
        $selects.width(width);      // и ставим ее всем
        // TODO: нахуа ставить всем селектам одну ширину? Тока для одной группы надо а не всем группам. Брееед
        $("#XMoptions").before("<input type=button id=XioFire value=FIRE!>");
    }

    $("#XioFire").click(() => XioMaintenance([subid], policyNames));

    $(".XioPolicy").change(function (this: HTMLElement) {
        let $thistd = $(this).parent();
        let thisid = $thistd.attr("id");

        // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
        let savedPolicyStrings: string[] = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
        let savedPolicies: string[] = [];
        let savedPolicyChoices: string[] = [];
        for (var i = 0; i < savedPolicyStrings.length; i++) {
            savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
            savedPolicyChoices[i] = savedPolicyStrings[i].substring(2);
        }

        // формируем строку для записи в лок хранилище
        let thischoice = "";
        for (var i = 0; i < policyJSON[thisid].order.length; i++) {
            if (i >= 1)
                thischoice += "-";

            let selected = $thistd.find("option:selected").eq(i).text();
            thischoice += policyJSON[thisid].save[i].indexOf(selected);
        }

        let ind = savedPolicies.indexOf(thisid);
        if (ind >= 0) {
            savedPolicyChoices[ind] = thischoice;
        }
        else {
            savedPolicies.push(thisid);
            savedPolicyChoices.push(thischoice);
        }

        let newPolicyString = "";
        for (var i = 0; i < savedPolicies.length; i++)
            newPolicyString += ";" + savedPolicies[i] + savedPolicyChoices[i];
        
        ls["x" + realm + subid] = newPolicyString.substring(1);
    })
        .each(function (this: HTMLElement) { $(this).trigger("change"); });

    return true;
}
function preferencePages(html: JQuery, url: string): string[] {

    let $html = $(html);

    let saleRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/sale$");
    let supplyRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/supply$");
    let tradingHallRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/trading_hall$");
    let unitMainRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+$");
    let adRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/virtasement$");
    let technologyRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/technology$");
    let reseachRx = new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/investigation$");

    //Production Sale page
    if (saleRx.test(url) &&
        $html.find(".list_sublink").length === 0 &&
        $html.find("[href$=delivery]").length === 0) {
        return ["pp", "ps"];
    }

    //Warehouse Sale page
    else if (saleRx.test(url) &&
        $html.find(".list_sublink").length === 0) {
        return ["pw", "pn"];
    }

    //Production and Service Supply page
    else if (supplyRx.test(url) &&
        $html.find(".add_contract").length === 0 &&
        $html.find("[name=productCategory]").length === 0) {
        return ["sp"];
    }

    //Store Supply page
    else if (supplyRx.test(url) &&
        $html.find(".add_contract").length === 0) {
        return ["sr"];
    }

    //Warehouse Supply page
    else if (supplyRx.test(url)) {
        return ["sh"];
    }

    //Store Trading Hall
    else if (tradingHallRx.test(url)) {
        return ["pt"];
    }

    //Main unit page excluding warehouses
    else if (unitMainRx.test(url) &&
        $("[name=unit_cancel_build]").length === 0 &&
        $html.find("[href$=delivery]").length === 0) {

        let policyArray: string[] = [];

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
        } else if ($html.find("form[name='servicePriceForm']") &&
            $html.find("a[href$='/virtasement']").length &&
            !$html.find("a[href$='/supply']").length &&
            !$html.find("a[href$='/sale']").length &&
            !$html.find("a[href$='/units']").length) {
            //service without stock
            policyArray.push("sl");
        } else if ($html.find("form[name='servicePriceForm']") &&
            $html.find("a[href$='/sale']").length &&
            $html.find("a[href$='/technology']").length &&
            !$html.find("a[href$='/supply']").length &&
            !$html.find("a[href$='/units']").length) {
            //Incinerator
            policyArray.push("ee");
        }

        return policyArray;
    }

    //Warehouse main page
    else if (unitMainRx.test(url) &&
        !$("[name=unit_cancel_build]").length &&
        $html.find("[href$=delivery]").length) {
        return ["wz"];
    }

    //Advertisment Page excluding offices
    else if (adRx.test(url) && !$html.find("#productAdvert").length) {
        return ["ad"];
    }

    //Technology page
    else if (technologyRx.test(url)) {
        return ["tc"];
    }

    //Research page
    else if (new RegExp("\/.*\/main\/unit\/view\/[0-9]+\/investigation$").test(url)) {
        return ["rs"];
    }

    //Pages with no preference
    else {
        return [];
    }
}

function salePrice() {
    throw new Error("Not implemented");
};
function salePolicy() {
    throw new Error("Not implemented");
};
function servicePrice() {
    throw new Error("Not implemented");
};
function serviceWithoutStockPrice() {
    throw new Error("Not implemented");
};
function incineratorPrice() {
    throw new Error("Not implemented");
};
function retailPrice() {
    throw new Error("Not implemented");
};
function prodSupply() {
    throw new Error("Not implemented");
};
function storeSupply() {
    throw new Error("Not implemented");
};
function wareSupply() {
    throw new Error("Not implemented");
};
function advertisement() {
    throw new Error("Not implemented");
};
function salary() {
    throw new Error("Not implemented");
};
function holiday() {
    throw new Error("Not implemented");
};
function training() {
    throw new Error("Not implemented");
};
function equipment() {
    throw new Error("Not implemented");
};
function technology() {
    throw new Error("Not implemented");
};
function research() {
    throw new Error("Not implemented");
};
function prodBooster() {
    throw new Error("Not implemented");
};
function politicAgitation() {
    throw new Error("Not implemented");
};
function wareSize() {
    throw new Error("Not implemented");
};



// вообще не пойму нахер это надо. какой то атавизм
//let XJSON: any;
let xPrefPages: (jq: JQuery, url: string) => any[] = () => { return []};
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
function XioScript() : boolean {
    //determines which functions to run;

    
    console.log("XioScript 12 is running!");

    //page options
    if ($(".pager_options").length > 0) {
        $(".pager_options").append($(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "1000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "2000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "4000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "10000")
            + $(".pager_options :eq(1)")[0].outerHTML.replace(/10/g, "20000")
        );
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
    let unitsRx = new RegExp("\/.*\/main\/company\/view\/[0-9]+\/unit_list(\/xiooverview)?$");
    let xoRx = new RegExp("\/.*\/main\/company\/view\/[0-9]+\/unit_list\/xiooverview$");
    if (unitsRx.test(document.URL)) {
        console.log("Unit list");
        $("div.metro_header").append("<div style='font-size: 24px; color:gold; margin-bottom: 5px;'>XioScript " + version + "</div>"
            + "<input type=button id=XM class=XioGo value=XioMaintenance>"
            + "<input type=button id=XO value=XioOverview>"
            + "<input type=button id=XE class=XioGo value=Export>"
            + "<input type=button id=XI class=XioGo value=Import>");

        $("#XM").click(() => XioMaintenance([], []));
        $("#XO").click(() => {
            if (xoRx.test(document.URL))
                window.location.href = window.location.href.slice(0, -12);
            else
                window.location.href = window.location.href + "/xiooverview";
        });
        $("#XE").click(() => XioExport());
        $("#XI").click(() => XioImport());

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
    let policies = preferencePages($(document), document.URL).concat(xPrefPages($(document), document.URL));
    preference(policies);

    return true;
}

// запуск вешаем на событие
document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        XioScript();
    }
};
document.onreadystatechange(new ProgressEvent("XioLoad"));