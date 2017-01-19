
$ = jQuery = jQuery.noConflict(true);
let $xioDebug = true;

let urlTemplates: IDictionary<[RegExp, (html: any) => boolean, (html: any, url: string) => any]> = {
    manager: [/\/\w+\/main\/user\/privat\/persondata\/knowledge\/?$/ig,
        (html: any) => true,
        parseManager],
    main: [/\/\w+\/main\/unit\/view\/\d+\/?$/gi,
        (html: any) => true,
        parseUnitMain],
    ads: [/\/\w+\/main\/unit\/view\/\d+\/virtasement\/?$/ig,
        (html: any) => true,
        parseAds],
    salary: [/\/\w+\/window\/unit\/employees\/engage\/\d+\/?$/ig,
        (html: any) => true,
        parseSalary],
    unitlist: [/\/\w+\/main\/company\/view\/\d+\/unit_list\/?$/ig,
        (html: any) => true,
        parseUnitList],
    sale: [/\/\w+\/main\/unit\/view\/\d+\/sale$\/?/ig,
        (html: any) => true,
        parseSale],
    saleNew: [/\/\w+\/main\/unit\/view\/\d+\/sale$\/?/ig,
        (html: any) => true,
        parseSaleNew],
    salecontract: [/zzz/gi,
        (html: any) => true,
        parseX],
    prodsupply: [/zzz/gi,
        (html: any) => $(html).find(".add_contract").length === 0 && $(html).find("[name=productCategory]").length === 0,
        parseX],
    consume: [/zzz/gi,
        (html: any) => true,
        parseX],
    storesupply: [/\/\w+\/main\/unit\/view\/\d+\/supply\/?$/gi,
        (html: any) => $(html).find("#unitImage img").attr("src").indexOf("/shop_") >= 0,
        parseStoreSupply],
    tradehall: [/\/\w+\/main\/unit\/view\/\d+\/trading_hall\/?$/gi,
        (html: any) => true,
        parseTradeHall],
    service: [/zzz/gi,
        (html: any) => true,
        parseX],
    servicepricehistory: [/zzz/gi,
        (html: any) => true,
        parseX],
    retailreport: [/zzz/gi,
        (html: any) => true,
        parseX],
    pricehistory: [/zzz/gi,
        (html: any) => true,
        parseX],
    TM: [/zzz/gi,
        (html: any) => true,
        parseX],
    IP: [/zzz/gi,
        (html: any) => true,
        parseX],
    transport: [/zzz/gi,
        (html: any) => true,
        parseX],
    CTIE: [/zzz/gi,
        (html: any) => true,
        parseX],
    training: [/zzz/gi,
        (html: any) => true,
        parseX],
    equipment: [/zzz/gi,
        (html: any) => true,
        parseX],
    tech: [/zzz/gi,
        (html: any) => true,
        parseX],
    products: [/zzz/gi,
        (html: any) => true,
        parseX],
    waresupply: [/zzz/gi,
        (html: any) => true,
        parseX],
    contract: [/zzz/gi,
        (html: any) => true,
        parseX],
    research: [/zzz/gi,
        (html: any) => true,
        parseX],
    experimentalunit: [/zzz/gi,
        (html: any) => true,
        parseX],
    financeitem: [/zzz/gi,
        (html: any) => true,
        parseX],
    machines: [/zzz/gi,
        (html: any) => true,
        parseX],
    animals: [/zzz/gi,
        (html: any) => true,
        parseX],
    size: [/\/\w+\/window\/unit\/upgrade\/\d+\/?$/ig,
        (html: any) => true,
        parseWareSize],
    waremain: [/\/\w+\/main\/unit\/view\/\d+\/?$/,
        (html: any) => true,
        parseWareMain],
    productreport: [/\/\w+\/main\/globalreport\/marketing\/by_products\/\d+\/?$/ig,
        (html: any) => true,
        parseProductReport],
    employees: [/\/\w+\/main\/company\/view\/\w+\/unit_list\/employee\/salary\/?$/ig,
        (html: any) => true,
        parseEmployees],
};

$(document).ready(() => parseStart());

function parseStart() {
    let href = window.location.href;
    let url = window.location.pathname;
    logDebug("url: ", href);

    let realm = getRealm();
    logDebug("realm: ", realm);
    if (realm == null)
        throw new Error("realm не найден.");

    for (let key in urlTemplates) {
        let html = $("html").html();
        if (urlTemplates[key][0].test(url) && urlTemplates[key][1](html)) {
            let obj = urlTemplates[key][2](html, url);
            logDebug(`parsed ${key}: `, obj);
        }
    }
}

function logDebug(msg: string, ...args: any[]) {
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
function isOneOf<T>(item: T, arr: T[]) {
    return arr.indexOf(item) >= 0;
}

/**
 * Оцифровывает строку. Возвращает всегда либо Number.POSITIVE_INFINITY либо 0
 * @param variable любая строка.
 */
function numberfy(str: string): number {
    // возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо -1 если не получилось преобразовать.

    if (String(str) === 'Не огр.' ||
        String(str) === 'Unlim.' ||
        String(str) === 'Не обм.' ||
        String(str) === 'N’est pas limité' ||
        String(str) === 'No limitado' ||
        String(str) === '无限' ||
        String(str) === 'Nicht beschr.') {
        return Number.POSITIVE_INFINITY;
    } else {
        // если str будет undef null или что то страшное, то String() превратит в строку после чего парсинг даст NaN
        // не будет эксепшнов
        let n = parseFloat(String(str).replace(/[\s\$\%\©]/g, ""));
        return isNaN(n) ? -1 : n;
    }
}

function zipAndMin(napArr1: number[], napArr2: number[]) {
    // адская функция. так и не понял нафиг она

    if (napArr1.length > napArr2.length) {
        return napArr1;
    } else if (napArr2.length > napArr1.length) {
        return napArr2;
    } else {
        var zipped = napArr1.map((e, i) => [napArr1[i], napArr2[i]]);
        var res = zipped.map(function (e, i) {
            if (e[0] == 0) {
                return e[1];
            } else if (e[1] == 0) {
                return e[0];
            } else {
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
function getRealm(): string | null {
    // https://*virtonomic*.*/*/main/globalreport/marketing/by_trade_at_cities/*
    // https://*virtonomic*.*/*/window/globalreport/marketing/by_trade_at_cities/*
    let fileRx = new RegExp(/^file.*$/ig);
    let rx = new RegExp(/https:\/\/virtonomic[A-Za-z]+\.[a-zA-Z]+\/([a-zA-Z]+)\/.+/ig);

    // если мы локально, то реалм фейканем и не бум добывать
    if (fileRx.test(document.location.href))
        return "localfile";

    let m = rx.exec(document.location.href);
    if (m == null)
        return null;

    return m[1];
}