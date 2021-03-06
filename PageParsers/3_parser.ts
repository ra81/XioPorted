﻿
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

let urlTemplates: IDictionary<[RegExp, (html: any) => boolean, (data: any, url: string) => any]> = {

    // вирта глобальные
    manager: [Url_rx.top_manager,
        (html: any) => true,
        parseManager],
    TM: [Url_rx.v_tm_info,
    (html: any) => true,
        parseTM],
    
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
    countryDuties: [Url_rx.v_country_duties,
    (html: any) => true,
        parseCountryDuties],
    energyprices: [Url_rx.v_energy_price,
        (html: any) => true,
        parseEnergyPrices],
    productSizes: [Url_rx.v_products_size,
        (html: any) => true,
        parseProductsSize],
    reportsSpec: [Url_rx.v_media_rep_spec,
        (html: any) => $(html).find("select").length > 0 || $(html).filter("select").length > 0,
        parseReportSpec],
    allProducts: [Url_rx.v_products,
        (html: any) => true,
        parseProducts],
    tradeProducts: [Url_rx.v_trade_products,
        (html: any) => true,
        parseProducts],
    productSuppliers: [Url_rx.v_product_suppliers,
        (html: any) => true,
        parseProductSuppliers],



    // компания
    unitlist: [Url_rx.comp_unit_list,
    (html: any) => true,
        parseUnitList],
    reportAds: [Url_rx.comp_ads_rep,
        (html: any) => true,
        parseCompAdsReport],
    finRepByUnits: [Url_rx.comp_fin_rep_byunit,
        (html: any) => true,
        parseFinanceRepByUnits],
    manageSalary: [Url_rx.comp_manage_salary,
        (html: any) => true,
        parseManageEmployees],


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
    unitFinRep: [Url_rx.unit_finrep,
        (html: any) => true,
        parseUnitFinRep],
    unitFinRepByProd: [Url_rx.unit_finrep_by_prod,
        (html: any) => true,
        parseUnitFinRepByProd],
    unitAds: [Url_rx.unit_ads,
    (html: any) => true,
        parseUnitAds],
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
        (html: any) => parseUnitType($(html)) === UnitTypes.warehouse,
        parseWareSupply],
    wareSale: [Url_rx.unit_sale,
    (html: any) => parseUnitType($(html)) === UnitTypes.warehouse,
        parseWareSaleNew],
    workshopSupply: [Url_rx.unit_supply,
        (html: any) => parseUnitType($(html)) === UnitTypes.workshop,
        parseWorkshopSupply],
    workshopSale: [Url_rx.unit_sale,
    (html: any) => parseUnitType($(html)) === UnitTypes.workshop,
        parseWorkshopSale],
};

let urlAPI: IDictionary<[RegExp, (data: any, url: string) => any]> = {

    // API
    saleContracts: [Url_rx.api_unit_sale_contracts, parseSaleContractsAPI],
    supplyContracts: [Url_rx.api_unit_supply_contracts, parseSupplyContractsAPI],
    tradeProducts: [Url_rx.api_trade_products, parseProductsAPI],
    cities: [Url_rx.api_cities, parseCityAPI],
    regions: [Url_rx.api_regions, parseRegionAPI],
}

$(document).ready(() => parseStart());

function parseStart() {
    let href = window.location.href;
    let url = window.location.pathname;
    logDebug("url: ", href);

    let realm = getRealm();
    logDebug("realm: ", realm);
    if (realm == null)
        throw new Error("realm не найден.");

    // обычные страницы
    for (let key in urlTemplates) {
        let html = $("html").html();
        if (urlTemplates[key][0].test(url) && urlTemplates[key][1](html)) {
            let obj = urlTemplates[key][2](html, url);
            logDebug(`parsed ${key}: `, obj);
        }
    }

    // API
    for (let key in urlAPI) {
        let jsonStr = $("pre").text();
        if (urlAPI[key][0].test(url)) {
            let jsonObj = JSON.parse(jsonStr, (k, v) => {
                return (typeof v === "object" || isNaN(v)) ? v : parseFloat(v);
            });

            let obj = urlAPI[key][1](jsonObj, url);
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
