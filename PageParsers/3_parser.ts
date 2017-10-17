
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

let urlTemplates: IDictionary<[RegExp, (html: any) => boolean, (html: any, url: string) => any]> = {
    manager: [Url_rx.top_manager,
        (html: any) => true,
        parseManager],
    unitMainNew: [Url_rx.unit_main,
        (html: any) => true,
        parseUnitMainNew],
    unitAds: [Url_rx.unit_ads,
        (html: any) => true,
        parseUnitAds],
    reportAds: [Url_rx.comp_ads_rep,
        (html: any) => true,
        parseCompAdsReport],
    unitSalary: [Url_rx.unit_salary,
        (html: any) => true,
        parseUnitSalary],
    unitlist: [Url_rx.comp_unit_list,
        (html: any) => true,
        parseUnitList],
    unitSale: [Url_rx.unit_sale,
        (html: any) => true,
        parseUnitSaleNew],
    retailSupplyNew: [Url_rx.unit_supply,
        (html: any) => { return $(html).find("#productsHereDiv").length > 0; },
        parseRetailSupplyNew],
    supplyCreate: [Url_rx.unit_supply_create,
        (html: any) => true,
        parseSupplyCreate],
    wareSupply: [Url_rx.unit_supply,
        (html: any) => isWarehouse($(html)),
        parseWareSupply],
    tradehallOld: [/\/\w+\/main\/unit\/view\/\d+\/trading_hall\/?$/gi,
        (html: any) => true,
        parseTradeHallOld],
    tradehall: [/\/\w+\/main\/unit\/view\/\d+\/trading_hall\/?$/gi,
        (html: any) => true,
        parseTradeHall],
    service: [/zzz/gi,
        (html: any) => true,
        parseX],
    servicepricehistory: [/zzz/gi,
        (html: any) => true,
        parseX],
    cityRetailReport: [url_city_retail_report_rx,
        (html: any) => true,
        parseCityRetailReport],
    pricehistory: [url_price_history_rx,
        (html: any) => true,
        parseRetailPriceHistory],
    TM: [url_tm_info_rx,
        (html: any) => true,
        parseTM],
    countryDuties: [url_country_duties_rx,
        (html: any) => true,
        parseCountryDuties],
    transport: [/zzz/gi,
        (html: any) => true,
        parseX],
    CTIE: [/zzz/gi,
        (html: any) => true,
        parseX],
    training: [url_education_rx,
        (html: any) => true,
        parseEducation],
    equipment: [/zzz/gi,
        (html: any) => true,
        parseX],
    tech: [/zzz/gi,
        (html: any) => true,
        parseX],
    products: [/zzz/gi,
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
    wareResize: [/\/\w+\/window\/unit\/upgrade\/\d+\/?$/ig,
        (html: any) => true,
        parseWareResize],
    wareMain: [/\/\w+\/main\/unit\/view\/\d+\/?$/,
        (html: any) => isWarehouse($(html)),
        parseWareMain],
    wareChangeCpec: [/\/\w+\/window\/unit\/speciality_change\/\d+\/?$/,
        (html: any) => true,
        parseWareChangeSpec],
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
    tradeProducts: [url_trade_products_rx,
        (html: any) => true,
        parseProducts],
    financeRepByUnits: [url_rep_finance_byunit,
        (html: any) => true,
        parseFinanceRepByUnits],
    unitFinRep: [url_unit_finrep_rx,
        (html: any) => true,
        parseUnitFinRep],
    unitRetailFinRepByProd: [url_unit_finrep_by_prod_rx,
        (html: any) => true,
        parseRetailFinRepByProd],
    productSizes: [url_products_size_rx,
        (html: any) => true,
        parseProductsSize],
    reportsSpec: [/\/[a-z]+\/main\/mediareport\/\d+/i,
        (html: any) => $(html).find("select").length > 0,
        parseReportSpec],
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
