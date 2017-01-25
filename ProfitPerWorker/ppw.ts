
/// <reference path= "../../_jsHelper/jsHelper/jsHelper.ts" />
/// <reference path= "../PageParsers/2_IDictionary.ts" />
/// <reference path= "../PageParsers/7_PageParserFunctions.ts" />
/// <reference path= "../PageParsers/1_Exceptions.ts" />

$ = jQuery = jQuery.noConflict(true);
$xioDebug = true;
let realm = getRealm();
let keyCode = "udt";        // доп ключик для создания уникального идентификатора для хранилища
let storageKey = buildStoreKey(realm, keyCode, getSubid());
let gameDate = parseGameDate(document, document.location.pathname);
interface IUnitData {
    dt: string;
    wk: number;
}
interface ISortData {
    place: number;      // исходный номер строки в таблице
    subid: number;        // id юнита
    profit: number;       // прибыль юнита
    ppw: number;        // profit per worker
    $r: JQuery;         // ссыль на строку
}
enum Sort { none, asc, desc };

function Start() {

    logDebug("ppw: начали");

    if (isUnitMain())
        unitMain();

    if (isUnitFinanceReport())
        showProfitPerWorker();

    if (isCompanyRepByUnit())
        showPPWForAll()

    logDebug("ppw: закончили");
}

function unitMain() {
    // сохраним в лок хранилище инфу по числу рабочих
    let parsedMain = parseUnitMain(document, document.location.pathname);
    let udt: IUnitData = {
        dt: dateToShort(gameDate),
        wk: parsedMain.employees
    };
    localStorage[storageKey] = JSON.stringify(udt);
}

function showProfitPerWorker() {
    // читаем данные с хранилища, если они там есть конечно
    let data = tryLoadPpw(storageKey);
    if (data == null) {
        logDebug("Дата данных устарела или данных нет.");
        return;
    }

    let $rows = $("table.treport").find("tr");
    let $turnoverRow = $rows.eq(1);
    let $profitRow = $rows.eq(3);
    $turnoverRow.add($profitRow).find("td").not(":first-child").each((i, e) => {
        let money = numberfy($(e).text());
        let str = sayMoney(Math.round(money / (<IUnitData>data).wk), "$");
        $(`<br/><span>  (${str})</span>`).appendTo(e).css({ color: "gray" });
    });
}

function showPPWForAll() {
    let $grid = $("table.grid");
    let $th = $grid.find("th:contains('Прибыль')");
    let profitInd = $th.index();
    let $clone = $th.clone();

    $clone.css("cursor", "pointer");
    $clone.find("td.title-ordertool").text("ppw");
    let $asc = $clone.find("a[href*=asc]").prop("id", "ppwasc").attr("href", "#");
    let $desc = $clone.find("a[href*=desc]").prop("id", "ppwdesc").attr("href", "#");
    $clone.on("click", (event) => {

        let el = $(event.target);
        if ($clone.hasClass("asc")) {
            $clone.removeClass("asc");
            sort_table(Sort.none);
        }
        else if ($clone.hasClass("desc")) {
            $clone.removeClass("desc");
            $clone.addClass("asc");
            sort_table(Sort.asc);
        }
        else {
            $clone.addClass("desc");
            sort_table(Sort.desc);
        }

        console.log("clicked");
        return false;
    });

    $clone.insertAfter($th);

    // сначала мы как бы спарсим данные по каждой строке то есть по юнитам
    let $rows = closestByTagName($grid.find("img[src*='unit_types']"), "tr");
    let subInd = $grid.find("th:contains('Предприятие')").index();
    let data = parseRows($rows,
        ($r) => {
            let $a = $r.children("td").eq(subInd).find("a");
            let n = extractIntPositive($a.attr("href"));
            if (n == null)
                throw new Error("не смог определить subid для $a.attr('href')");

            return n[0];
        },
        ($r) => numberfy($r.children("td").eq(profitInd).text())
    );

    if (data.length != $rows.length)
        throw new Error("не знаю что но что то пошло не так. число данных не равно числу строк");

    // теперь нам бы надо считать по всем юнитам дату что хранится в локальном хранилище
    // и вывести все
    data.forEach((val, i, arr) => {
        let storeKey = buildStoreKey(realm, keyCode, val.subid);
        let ppw = tryLoadPpw(storeKey);
        debugger;
        if (ppw != null)
            arr[i].ppw = Math.round(arr[i].profit / ppw.wk);

        // ячейки добавим
        let str = sayMoney(arr[i].ppw, "$");
        $(`<td align='right'>${str}</td>`).insertAfter(arr[i].$r.children("td").eq(profitInd));
    });

    function sort_table(type: Sort) {

        let $start = $grid.find("tbody tr").first();
        let sorted = sortData(data, type);  // исходные тоже меняется

        // вставлять будем задом наперед. Просто начиная с шапки таблицы вставляем в самый верх
        // сначала идут последние постепенно дойдем до первых. Самый быстрый способ вышел
        let odd = false;
        for (let i = sorted.length - 1; i >= 0; i--) {
            let $r0 = sorted[i].$r;
            $r0.removeClass('even odd').addClass(odd ? 'odd' : 'even');
            $r0.insertAfter($start);

            odd = odd ? false : true;
        }
    }
}

function tryLoadPpw(key: string): IUnitData | null {
    // читаем данные с хранилища, если они там есть конечно
    let rawData = localStorage.getItem(key);
    if (rawData == null)
        return null;

    let data = JSON.parse(<string>rawData) as IUnitData;
    if (data.dt != dateToShort(gameDate))
        return null;

    return data;
}

function getSubid() {
    let numbers = extractIntPositive(document.location.pathname);
    if (numbers == null || numbers.length < 1)
        throw new Error("Не смогли спарсить subid юнита со ссылки");

    return numbers[0];
}

function parseRows($rows: JQuery, subidSelector: ($r: JQuery) => number, profitSelector: ($r: JQuery) => number): ISortData[] {

    let res: ISortData[] = [];

    for (let i = 0; i < $rows.length; i++) {
        let $r = $rows.eq(i);

        let subid = subidSelector($r); 
        let profit = profitSelector($r);

        res.push({
            place: i,
            subid: subid,
            profit: profit,
            ppw: 0,
            $r: $r
        });
    }

    return res;
}

function sortData(items: ISortData[], type: Sort): ISortData[] {
    switch (type) {
        case Sort.asc:
            items.sort((a, b) => {
                if (a.ppw > b.ppw)
                    return 1;

                if (a.ppw < b.ppw)
                    return -1;

                return 0;
            });
            break;

        case Sort.desc:
            items.sort((a, b) => {
                if (a.ppw > b.ppw)
                    return -1;

                if (a.ppw < b.ppw)
                    return 1;

                return 0;
            });
            break;

        case Sort.none:
            items.sort((a, b) => {
                if (a.place > b.place)
                    return 1;

                if (a.place < b.place)
                    return -1;

                return 0;
            });
    }

    return items;
}

$(document).ready(() => Start());