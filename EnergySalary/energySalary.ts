
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />
/// <reference path= "../PageParsers/2_IDictionary.ts" />
/// <reference path= "../PageParsers/7_PageParserFunctions.ts" />
/// <reference path= "../PageParsers/1_Exceptions.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

function Start() {
    if (isMyUnitList())
        unitList();

    logDebug("energy: закончили");
}

function unitList() {

    let $header = $("div.metro_header");
    let $parseBtn = $("<input type='button' id='energyPrices' value='parse energy prices'>");
    $parseBtn.on("click", (event) => parseEnergy());

    $header.append($parseBtn.wrapAll("<div></div>").closest("div"));

    function parseEnergy() {

        let $currentReg = $("<span id='currentRegion'></span>");
        $header.append($currentReg);


        //if (document.location.pathname)
        //    return;

        // вытащим текущую дату, потому как сохранять данные будем используя ее
        let $date = $("div.date_time");
        if ($date.length !== 1)
            throw new Error("Не получилось получить текущую игровую дату");

        let currentGameDate = extractDate(getOnlyText($date)[0].trim());
        if (currentGameDate == null)
            throw new Error("Не получилось получить текущую игровую дату");

        // парсим регионы
        let realm = getRealm();
        let urlRegions = `/${realm}/main/common/main_page/game_info/bonuses/region`;
        let regions: IRegion[] = [];

        $.ajax({
            url: urlRegions,
            type: "GET",

            success: function (this: any, html:any, status:any, xhr:any) {
                let $html = $(html);

                let tthis = this;

                // если много страниц то установим макс число на страницу и перезагрузимся
                let $pages = $html.find('ul.pager_list li');
                if ($pages.length > 2) {
                    //let $pager = $('ul.pager_options li').last();
                    //let num = $pager.text().trim();
                    //let pagerUrl = $pager.find('a').attr('href').replace(num, "10000");
                    let pagerUrl = `/${realm}/main/common/util/setpaging/report/regionBonus/1000`;
                    $.get(pagerUrl, (data, status, jqXHR) => $.ajax(tthis));
                    return;
                }

                // когда уже пейджеры вставили отпарсим регионы
                regions = parseRegions(html, urlRegions);
                let getCount = regions.length;
                for (let i = 0; i < regions.length; i++) {
                    let url = `/${realm}/main/geo/tariff/${regions[i].id}`;
                    $currentReg.text(regions[i].name);

                    // замкнем переменные
                    let f = () => {

                        let _i = i;
                        let _url = url;

                        $.ajax({
                            url: _url,
                            type: "GET",

                            success: function (html, status, xhr) {

                                let energy = parseEnergyPrices(html, _url);
                                regions[_i].energy = energy;

                                getCount--;
                                if (getCount === 0)
                                    showInfo();
                            },

                            error: function (this: any, xhr: any, status: any, error: any) {
                                logDebug(`error on ${regions[_i].name}: `, error);

                                //Resend ajax
                                var tthis = this;
                                setTimeout(function () {
                                    $.ajax(tthis);
                                }, 3000);
                            }
                        });
                    };
                    f();
                }
            },

            error: function (this: any, xhr: any, status: any, error: any) {
                logDebug(`error parsing regions. retry`, error);

                //Resend ajax
                var tthis = this;
                setTimeout(function () {
                    $.ajax(tthis);
                }, 3000);
            }
        });
 
        function showInfo() {
            logDebug("energy: ", regions);

            let wnd = window.open("", "_blank");
            let $html = $(wnd.document.body);
            let $content = $('<div id="content"></div>');
            $html.append($content);

            function buildOptions(items: string[]) {
                let optionsHtml = '';

                // собственно элементы
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let lbl = `label="${item}"`;
                    let val = `value="${item}"`;
                    let txt = item;

                    let html = `<option ${lbl} ${val}>${txt}</option>`;
                    optionsHtml += html;
                }

                return optionsHtml;
            }

            // если панели еще нет, то добавить её
            // фильтры
            //
            let $sectorSelector = $("<select id='sector' class='option' style='min-width: 100px; max-width:160px;'>");
            let sectors = Object.keys(regions[0].energy);
            sectors.sort();
            $sectorSelector.append(buildOptions(sectors));
            $sectorSelector.on("change", function (this: Element, event: JQueryEventObject) {
                let sector = $sectorSelector.val();

                // отсортируем полученные данные по регионам по цене энергии по возрастанию
                regions.sort((a, b) => {
                    if (a.energy[sector].price > b.energy[sector].price)
                        return 1;

                    if (a.energy[sector].price < b.energy[sector].price)
                        return -1;

                    return 0;
                });

                $content.children().not($sectorSelector).remove();
                for (let i = 0; i < regions.length; i++) {
                    let reg = regions[i];
                    $content.append(`<br/><span>Регион: ${reg.name}    Энергия: ${reg.energy[sector].price}</span>`);
                }
            });

            $content.append($sectorSelector);
        }
    }
}

function unitMain() {
    if (!isShop()) {
        logDebug("не магазин.");
        return;
    }

    // подставляем линк на график истории посетосов и рекламы
    let $td = $('tr:contains("Количество посетителей") td:eq(1)');
    let $a = $("<a class='popup'>история</a>").css("cursor", "pointer");
    $a.on("click", (event) => {
        let myWindow = window.open("", "_blank");
        showHistory(myWindow);
    });

    $td.append("<br/>").append($a);
}

function showHistory(wnd: Window) {

    let $html = $(wnd.document.body);
    $html.append('<div id="chartContainer"><canvas id="myChart" width="400" height="400"></canvas></div>');

    // послед версия чартов не работает. 2.0.2 работает
    let ctx = ($html.find("#myChart")[0] as HTMLCanvasElement).getContext("2d");
    if (ctx == null)
        throw new Error("канваса нет");


    // как то оно сразу херачит шибко большой график на всю страницу. контейнер может ограничить его размер.
    $html.find("#chartContainer").width(500);
    $html.find("#chartContainer").height(500);

    logDebug("showed");
}


interface TNameValueCount {
    Name: string;
    Value: string;
    Count: number
}
function makeKeyValCount<T>(items: T[], keySelector: (el: T) => string, valueSelector?: (el: T) => string) {

    let res: IDictionary<TNameValueCount> = {};
    for (let i = 0; i < items.length; i++) {
        let key = keySelector(items[i]);
        let val = valueSelector ? valueSelector(items[i]) : key;

        if (res[key] != null)
            res[key].Count++;
        else
            res[key] = { Name: key, Value: val, Count: 1 };
    }

    let resArray: TNameValueCount[] = [];
    for (let key in res)
        resArray.push(res[key]);

    resArray.sort(function (a, b) {
        if (a.Name > b.Name)
            return 1;

        if (a.Name < b.Name)
            return -1;

        return 0;
    });

    return resArray;
}


$(document).ready(() => Start());