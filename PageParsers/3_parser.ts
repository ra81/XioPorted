
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

let urlTemplates: IDictionary<[RegExp, (html: any) => boolean, (html: any, url: string) => any]> = {
    // вирта глобальные
    manager: [Url_rx.top_manager,
        (html: any) => true,
        parseManager],
    TM: [Url_rx.v_tm_info,
    (html: any) => true,
        parseTM],
    countryDuties: [Url_rx.v_country_duties,
    (html: any) => true,
        parseCountryDuties],
    cityRetailReport: [Url_rx.v_city_retail_report,
    (html: any) => true,
        parseCityRetailReport],
    regions: [Url_rx.v_regions,
        (html: any) => true,
        parseRegions],
    countries: [Url_rx.v_countries,
        (html: any) => true,
        parseCountries],
    cities: [Url_rx.v_cities,
        (html: any) => true,
        parseCities],


    // компания
    unitlist: [Url_rx.comp_unit_list,
    (html: any) => true,
        parseUnitList],
    reportAds: [Url_rx.comp_ads_rep,
        (html: any) => true,
        parseCompAdsReport],

    // юнит
    unitMainNew: [Url_rx.unit_main,
        (html: any) => true,
        parseUnitMainNew],
    training: [Url_rx.unit_education,
    (html: any) => true,
        parseUnitEducation],
    unitSalary: [Url_rx.unit_salary,
        (html: any) => true,
        parseUnitSalary],
    unitAds: [Url_rx.unit_ads,
    (html: any) => true,
        parseUnitAds],
    unitSale: [Url_rx.unit_sale,
        (html: any) => true,
        parseUnitSaleNew],
    retailSupplyNew: [Url_rx.unit_supply,
        (html: any) => { return $(html).find("#productsHereDiv").length > 0; },
        parseRetailSupplyNew],
    supplyCreate: [Url_rx.unit_supply_create,
        (html: any) => true,
        parseSupplyCreate],
    tradehall: [Url_rx.unit_trade_hall,
        (html: any) => true,
        parseUnitTradeHall],
    retailPriceHistory: [Url_rx.unit_retail_price_history,
        (html: any) => true,
        parseUnitRetailPriceHistory],
    wareResize: [Url_rx.unit_ware_resize,
        (html: any) => true,
        parseWareResize],
    wareChangeCpec: [Url_rx.unit_ware_change_spec,
        (html: any) => true,
        parseWareChangeSpec],
    wareSupply: [Url_rx.unit_supply,
        (html: any) => $(html).text().indexOf("склад") > 0,
        parseWareSupply],






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
