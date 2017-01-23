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
    var $header = $("div.metro_header");
    var $parseBtn = $("<input type='button' id='parseVisitors' value='parse visitors'>");
    $parseBtn.on("click", function (event) { return parseVisitors(); });
    $header.append($parseBtn.wrapAll("<div></div>").closest("div"));
    function parseVisitors() {
        // вытащим текущую дату, потому как сохранять данные будем используя ее
        var $date = $("div.date_time");
        if ($date.length !== 1)
            throw new Error("Не получилось получить текущую игровую дату");
        var currentGameDate = extractDate(getOnlyText($date)[0].trim());
        if (currentGameDate == null)
            throw new Error("Не получилось получить текущую игровую дату");
        // читаем весь список юнитов вычленяем магазины
        var units = parseUnitList(document.body, document.location.pathname);
        var shopIds = [];
        for (var i = 0; i < units.subids.length; i++) {
            if (units.type[i] === "shop")
                shopIds.push(units.subids[i]);
        }
        // для полученного списка парсим инфу по посетителям, известности, рекламному бюджету
        var realm = getRealm();
        var parsedInfo = {};
        var getCount = shopIds.length * 2;
        shopIds.forEach(function (val, i, arr) {
            var urlMain = "/" + realm + "/main/unit/view/" + val;
            var urlAdv = "/" + realm + "/main/unit/view/" + val + "/virtasement";
            $.ajax({
                url: urlMain,
                type: "GET",
                success: function (html, status, xhr) {
                    var parsedData = parseUnitMain(html, urlMain);
                    if (parsedInfo[val] == null) {
                        parsedInfo[val] = {
                            date: currentGameDate,
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
                error: function (xhr, status, error) {
                    logDebug("error on " + val + ": ", error);
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
                    var parsedData = parseAds(html, urlAdv);
                    if (parsedInfo[val] == null) {
                        parsedInfo[val] = {
                            date: currentGameDate,
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
                error: function (xhr, status, error) {
                    logDebug("error on " + val + ": ", error);
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
            for (var subid in parsedInfo) {
                var info = parsedInfo[subid];
                var storeKey = "vh" + realm + subid;
                var dateKey = dateToShort(info.date);
                // если записи о юните еще нет, сформируем иначе считаем данные
                var storedInfo = void 0;
                if (localStorage[storeKey] == null) {
                    storedInfo = {};
                    storedInfo[dateKey] = { budget: 0, celebrity: 0, date: new Date(), population: 0, visitors: 0 };
                }
                else {
                    storedInfo = JSON.parse(localStorage[storeKey], function (key, val) {
                        if (key === "date")
                            return new Date(val);
                        return val;
                    });
                }
                // обновим данные и сохраним назад
                storedInfo[dateKey] = info;
                localStorage[storeKey] = JSON.stringify(storedInfo, function (key, val) {
                    // когда парсер вызывает данный метод, он val для даты выдает уже в виде строки,
                    // нам нужно взять исходные объект из this и конвертнуть его дату
                    if (key === "date")
                        return this.date.toISOString();
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
    var $td = $('tr:contains("Количество посетителей") td:eq(1)');
    var $a = $("<a class='popup'>история</a>").css("cursor", "pointer");
    $a.on("click", function (event) {
        var myWindow = window.open("", "_blank");
        showHistory(myWindow);
    });
    $td.append("<br/>").append($a);
}
function showHistory(wnd) {
    var $html = $(wnd.document.body);
    $html.append('<div id="chartContainer"><canvas id="myChart" width="400" height="400"></canvas></div>');
    // послед версия чартов не работает. 2.0.2 работает
    var ctx = $html.find("#myChart")[0].getContext("2d");
    if (ctx == null)
        throw new Error("канваса нет");
    // как то оно сразу херачит шибко большой график на всю страницу. контейнер может ограничить его размер.
    $html.find("#chartContainer").width(500);
    $html.find("#chartContainer").height(500);
    logDebug("showed");
}
$(document).ready(function () { return Start(); });
//# sourceMappingURL=energySalary.js.map