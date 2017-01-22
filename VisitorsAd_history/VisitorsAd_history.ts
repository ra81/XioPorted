
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />
/// <reference path= "../PageParsers/2_IDictionary.ts" />
/// <reference path= "../PageParsers/7_PageParserFunctions.ts" />
/// <reference path= "../PageParsers/1_Exceptions.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;

function Start() {
    if (isMyUnitList())
        unitList();

    if (isUnitMain())
        unitMain();

    //if (isVisitorsHistory())
    //    showHistory();

    logDebug("visitors: закончили");
}

function unitList() {

    let $header = $("div.metro_header");
    let $parseBtn = $("<input type='button' id='parseVisitors' value='parse visitors'>");
    $parseBtn.on("click", (event) => parseVisitors());

    $header.append($parseBtn.wrapAll("<div></div>").closest("div"));

    function parseVisitors() {
        // вытащим текущую дату, потому как сохранять данные будем используя ее
        let $date = $("div.date_time");
        if ($date.length !== 1)
            throw new Error("Не получилось получить текущую игровую дату");

        let currentGameDate = extractDate(getOnlyText($date)[0].trim());
        if (currentGameDate == null)
            throw new Error("Не получилось получить текущую игровую дату");

        // читаем весь список юнитов вычленяем магазины
        let units = parseUnitList(document.body, document.location.pathname);
        let shopIds: number[] = [];
        for (let i = 0; i < units.subids.length; i++) {
            if (units.type[i] === "shop")
                shopIds.push(units.subids[i]);
        }

        // для полученного списка парсим инфу по посетителям, известности, рекламному бюджету
        let realm = getRealm();

        interface IVisitorsInfo {
            date: Date;
            visitors: number;
            celebrity: number;
            budget: number;
            population: number;
        }
        let parsedInfo: IDictionaryN<IVisitorsInfo> = {};
        let getCount = shopIds.length * 2;
        shopIds.forEach((val, i, arr) => {
            let urlMain = `/${realm}/main/unit/view/${val}`;
            let urlAdv = `/${realm}/main/unit/view/${val}/virtasement`;

            $.ajax({
                url: urlMain,
                type: "GET",

                success: function (html, status, xhr) {

                    let parsedData = parseUnitMain(html, urlMain);
                    if (parsedInfo[val] == null) {
                        parsedInfo[val] = {
                            date: currentGameDate as Date,
                            visitors: parsedData.visitors,
                            budget: 0,
                            celebrity: 0,
                            population: 0
                        };
                    }
                    else {
                        parsedInfo[val].visitors = parsedData.visitors;
                    }

                    getCount--;
                    if (getCount === 0)
                        saveInfo();
                    //time();
                    //servergetcount++;
                    //$("#XioGetCalls").text(servergetcount);
                    //$("#XioServerCalls").text(servergetcount + serverpostcount);
                    //map(html, url, page);
                    //logDebug(`visitors of ${val}: `, parsedData);
                    //callback();
                    //xUrlDone(url);
                },

                error: function (this: any, xhr: any, status: any, error: any) {
                    logDebug(`error on ${val}: `, error);
                    //time();
                    //servergetcount++;
                    //$("#XioGetCalls").text(servergetcount);
                    //$("#XioServerCalls").text(servergetcount + serverpostcount);

                    //Resend ajax
                    var tthis = this;
                    setTimeout(function () {
                        $.ajax(tthis);
                    }, 3000);
                }
            });

            $.ajax({
                url: urlAdv,
                type: "GET",

                success: function (html, status, xhr) {

                    let parsedData = parseAds(html, urlAdv);
                    if (parsedInfo[val] == null) {
                        parsedInfo[val] = {
                            date: currentGameDate as Date,
                            visitors: 0,
                            budget: parsedData.budget,
                            celebrity: parsedData.celebrity,
                            population: parsedData.pop
                        };
                    }
                    else {
                        parsedInfo[val].budget = parsedData.budget;
                        parsedInfo[val].celebrity = parsedData.celebrity;
                        parsedInfo[val].population = parsedData.pop;
                    }

                    getCount--;
                    if (getCount === 0)
                        saveInfo();
                    //time();
                    //servergetcount++;
                    //$("#XioGetCalls").text(servergetcount);
                    //$("#XioServerCalls").text(servergetcount + serverpostcount);
                    //map(html, url, page);
                    //logDebug(`adv of ${val}: `, parsedData);
                    //callback();
                    //xUrlDone(url);
                },

                error: function (this: any, xhr: any, status: any, error: any) {
                    logDebug(`error on ${val}: `, error);
                    //time();
                    //servergetcount++;
                    //$("#XioGetCalls").text(servergetcount);
                    //$("#XioServerCalls").text(servergetcount + serverpostcount);

                    //Resend ajax
                    var tthis = this;
                    setTimeout(function () {
                        $.ajax(tthis);
                    }, 3000);
                }
            });
        });

        function saveInfo() {
            for (let subid in parsedInfo) {
                let info = parsedInfo[subid];

                let storeKey = "vh" + realm + subid;
                let dateKey = dateToShort(info.date);

                // если записи о юните еще нет, сформируем иначе считаем данные
                let storedInfo: IDictionary<IVisitorsInfo>;
                if (localStorage[storeKey] == null) {
                    storedInfo = {};
                    storedInfo[dateKey] = { budget: 0, celebrity: 0, date: new Date(), population: 0, visitors: 0 };
                }
                else {
                    storedInfo = JSON.parse(localStorage[storeKey], function (this: any, key: any, val: any) {
                        if (key === "date")
                            return new Date(val);

                        return val;
                    });
                }

                // обновим данные и сохраним назад
                storedInfo[dateKey] = info;
                localStorage[storeKey] = JSON.stringify(storedInfo, function (this: any, key: any, val: any) {
                    // когда парсер вызывает данный метод, он val для даты выдает уже в виде строки,
                    // нам нужно взять исходные объект из this и конвертнуть его дату
                    if (key === "date")
                        return (this as IVisitorsInfo).date.toISOString();

                    return val;
                });
            }

            logDebug("visitors: ", parsedInfo);
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

    var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
            datasets: [{
                label: '# of Votes',
                data: [12, 19, 3, 5, 2, 3],
                backgroundColor: [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)',
                    'rgba(255, 159, 64, 0.2)'
                ],
                borderColor: [
                    'rgba(255,99,132,1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(255, 159, 64, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        display: true
                    }
                }]
            }
        }
    });

    // как то оно сразу херачит шибко большой график на всю страницу. контейнер может ограничить его размер.
    $html.find("#chartContainer").width(500);
    $html.find("#chartContainer").height(500);

    logDebug("showed");
}



$(document).ready(() => Start());