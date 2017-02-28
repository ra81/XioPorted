
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

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
    reportAds: [url_rep_ad,
        (html: any) => true,
        parseReportAdvertising],
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
    pricehistory: [url_price_history_rx,
        (html: any) => true,
        parseRetailPriceHistory],
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
    manageEmployees: [url_manag_empl_rx,
        (html: any) => true,
        parseManageEmployees],
    energyprices: [/\/[a-z]+\/main\/geo\/tariff\/\d+/i,
        (html: any) => true,
        parseEnergyPrices],
    regions: [/\/[a-z]+\/main\/common\/main_page\/game_info\/bonuses\/region$/i,
        (html: any) => true,
        parseRegions],
    countries: [/\/[a-z]+\/main\/common\/main_page\/game_info\/bonuses\/country$/i,
        (html: any) => true,
        parseCountries],
    cities: [/\/[a-z]+\/main\/common\/main_page\/game_info\/bonuses\/city$/i,
        (html: any) => true,
        parseCities],
    allProducts: [url_products_rx,
        (html: any) => true,
        parseProducts],
    financeRepByUnits: [url_rep_finance_byunit,
        (html: any) => true,
        parseFinanceRepByUnits],
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
