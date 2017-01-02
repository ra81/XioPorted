
var $ = jQuery = jQuery.noConflict(true);

let $xioDebug = true;
var ls = localStorage;
let $realm = getRealm();
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
//var mousedown = false;
//var $tron: HTMLElement;
var XMreload = false;
var xsup = [];
var xsupcheck = {};
var urlUnitlist = "";
var blackmail = [];
let _m = $(".dashboard a").attr("href").match(/\d+/) as string[];
var companyid = numberfy(_m ? _m[0] : "0");
var equipfilter = [];

function getRealm(): string {
    let r = xpCookie('last_realm');
    if (r == null)
        throw new Error("неведомая хуйня но реалм == null")

    return r;
}

function logDebug(msg: string) {
    if ($xioDebug)
        console.log(msg);
}

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

// из аргументов функции вытаскивает само имя функции. для лога чисто
function getFuncName(args: IArguments) :string {
    let items = args.callee.toString().split("(");
    return items[0] ? items[0] + "()" : "";
}

function XioMaintenance(subidList:number[], policyNames:string[]) {
    console.log(getFuncName(arguments));
};

function XioGenerator(subids: number[]) {

    // морозим кнопки. убираем старый лог
    $(".XioGo").prop("disabled", true);
    $(".XioProperty").remove();

    // формируем новый лог
    $("div.metro_header").append(""
        + "<table id=XMtable class=XioProperty style='font-size: 18px; color:gold; border-spacing: 10px 0; margin-top: 10px;'>"
        + "<tr>"
        + "<td>Total server calls: </td>"
        + "<td id=XioServerCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td id=xDone colspan=4 style='visibility: hidden; color: lightgoldenrodyellow'>All Done!</td>"
        + "</tr>"
        + "</table>"
    );

    servergetcount = 0;
    let getcount = 0;
    let data: any = {};

    for (let j = 0; j < subids.length; j++) {

        let subid = subids[j];
        data[subid] = [];

        let url = "/" + $realm + "/main/unit/view/" + subid;

        getcount++;
        (function (url, subid) {
            $.get(url, function (htmlmain) {

                servergetcount++;
                $("#XioServerCalls").text(servergetcount);

                data[subid].push({
                    html: htmlmain,
                    url: url
                });


                let links = $(htmlmain).find(".tabu > li > a:gt(2)").map( (i, el) => $(el).attr("href") ).get() as any as string[];
                logDebug(`links: ${links.join(" | ")}`);

                getcount += links.length;
                !--getcount && checkpreference();
                for (let i = 0; i < links.length; i++) {
                    (function (url, subid) {
                        $.get(url, function (html) {

                            servergetcount++;
                            $("#XioServerCalls").text(servergetcount);

                            data[subid].push({
                                html: html,
                                url: url
                            });

                            !--getcount && checkpreference();
                        });
                    })(links[i], subid);
                }
            });
        })(url, subid);
    }

    function checkpreference() {

        let refresh = false;
        for (var j = 0; j < subids.length; j++) {

            var subid = subids[j];

            // получаем полный список policyKey для данного subid
            let policies:string[] = [];
            for (let i = 0; i < data[subid].length; i++) {
                let prePages = preferencePages(data[subid][i].html, data[subid][i].url);
                let xPages = xPrefPages(data[subid][i].html, data[subid][i].url);
                policies.push.apply(policies, prePages.concat(xPages));
            }

            logDebug(`subid policies:${policies.join(", ")}`);
            let loaded = loadOptions($realm, subid.toString()); // {} если пусто
            logDebug(`loaded options:${dict2String(loaded)}`);

            // сначала проверим чтобы в опциях не было неположенных политик
            for (let key in loaded) {
                if (policies.indexOf(key) < 0)
                    delete loaded[key];
            }
            logDebug(`options cleaned:${dict2String(loaded)}`);

            // теперь добавим те ключи которых нет в опциях или сбросим те которые криво записаны
            let keys = Object.keys(loaded);
            for (let i = 0; i < policies.length; i++) {
                let key = policies[i];
                let policy = policyJSON[key];
                if (keys.indexOf(key) >= 0 && loaded[key].choices.length === policy.save.length)
                    continue;

                // ну нет бля быстрого способа заполнить массив нулями. 
                let choices: number[] = new Array(policy.save.length);
                for (let i = 0; i < choices.length; i++)
                    choices[i] = 0;

                loaded[key] = new PolicyOptions(key, choices);
                refresh = true;
            }

            storeOptions($realm, subid.toString(), loaded);
        }

        if (refresh) {
            $(".XioHide").removeClass("XioHide").show(); // показать скрытые ранее колонки
            $(".XOhtml").remove();          // всякие заголовки и прочая херь
            $(".XioContainer").remove();    // все контейнеры с селектами
            $(".unit-list-2014").off(".XO");// скинуть события
            XioOverview();
        }

        $("#xDone").css("visibility", "");
        $(".XioGo").prop("disabled", false);
    }
};

function XioExport() {
    console.log(getFuncName(arguments));
};

function XioImport() {
    console.log(getFuncName(arguments));
};

function XioHoliday() {
    console.log(getFuncName(arguments));
};

// переписать построение селектов и их инициализацию
function XioOverview() {

    let unitsTable = $(".unit-list-2014");

    //  задаем стили для строк
    let trOddCss = { backgroundColor: "lightgoldenrodyellow" };     // четная
    let trEvenCss = { backgroundColor: "" };                        // нечетная
    let trSelectedCss = { backgroundColor: "rgb(255, 210, 170)" };  // тыкнули мышкой

    // скрыть все колонки кроме Город, Подразделение
    unitsTable.find("td, th").filter(":not(:nth-child(2)):not(:nth-child(3)):not(:nth-child(8))").addClass("XioHide").hide();
    unitsTable.find("tr.odd").css(trOddCss);

    // удалить размер подразделения под названием юнита
    unitsTable.find("td:nth-child(3) span").remove();
    unitsTable.css("white-space", "nowrap").css("user-select", "none");

    // переносим сами комментарии в тот же ряд где и имя юнита в тот же див. и удаляем лишние tr нафиг
    var $comments = unitsTable.find("tr.unit_comment");
    for (var i = 0; i < $comments.length; i++) {
        var notetext = $comments.eq(i).find("span").text();
        $comments.eq(i).prev().addClass("wborder").find("td:nth-child(3)").append("<div class=st><span style='max-width:300px;'>" + notetext + "</span></div>");
    }
    $comments.remove();

    // формируем список всех груп для политик. надо ниже
    let groups: string[] = [];
    for (var key in policyJSON) {
        if (groups.indexOf(policyJSON[key].group) < 0)
            groups.push(policyJSON[key].group);
    }

    // кнопки FIRE ALL / Gen ALL
    var policyString: string[][] = [];
    var groupString: string[] = [];
    var thstring = `<th class=XOhtml style="padding-right:5px">
                      <input type=button id=XioGeneratorPRO class='XioGo' value='Gen ALL' style='width:50%'>
                      <input type=button id=XioFirePRO class='XioGo' value='FIRE ALL' style='width:50%' >
                    </th>`;

    // для каждой группы формируем кнопки в хедере
    for (var i = 0; i < groups.length; i++) {
        thstring += `<th policy-group=${groups[i]} class=XOhtml style='padding-right:5px'>
                        <input type=button class='XioGo XioGroup' value=${groups[i]} style='width:100%'>
                     </th>`;
    }
    unitsTable.find("th:nth-child(7)").after(thstring);

    // сюда сложим все группы которые реально есть, остальное потом захайдим чтобы не засоряло эфир
    let existingGroups: string[] = [];

    // вставляем кнопки в каждую строку. generate/fire. и вставляем опции уже с настройками
    let unitRows = unitsTable.find("tr").not(".unit_comment");
    let subids = parseSubid(unitRows.get());
    let $td = unitRows.find("td.alerts");
    for (var i = 0; i < subids.length; i++) {
        let subid = subids[i];

        // словарь поможет быстро найти нужную политику для группы
        let unitOptions = loadOptions($realm, subid.toString()); // {} если не нашли опции
        let groupDict: IDictionary<string> = {};
        for (var key in unitOptions) {
            let policy = policyJSON[key];
            if (groupDict[policy.group])
                throw new Error("неведомая хуйня но в одном юните две политики с одной группы политик.");

            groupDict[policy.group] = key;

            if (existingGroups.indexOf(policy.group) < 0)
                existingGroups.push(policy.group);
        }

        // кнопки файр и гер для юнита
        let tdStr = `<td class=XOhtml>
                        <input type=button unit-id=${subids[i]} class='XioGo XioGenerator' value=Generate>
                        <input type=button unit-id=${subids[i]} class='XioGo XioSub' value=${subids[i]}>
                     </td>`;

        // для сохраненных настроек юнита, выводим опции
        let emptyPolicy = { func: () => { }, save: [], order: [], name: "", group: "", wait: [] }
        for (var n = 0; n < groups.length; n++) {
            let policyKey = groupDict[groups[n]];
            if (policyKey)
                tdStr += buildContainerHtml(subid.toString(), policyKey, policyJSON[policyKey], false);
            else {
                emptyPolicy.group = groups[n];
                tdStr += buildContainerHtml("", "", emptyPolicy, true);
            }
        }
        $td.eq(i).after(tdStr);

        // проставляем сразу настройки политик
        for (var key in unitOptions) {
            let containerKey = subid + "-" + key;
            let container = unitsTable.find(`td#${containerKey}`);
            if (container.length !== 1)
                throw new Error("неведомая хуйня но два контейнера с одинаковым ключом.");
            else if (container.length === 0)
                throw new Error("неведомая хуйня но контейнер не нашли.");

            setOptions(container.get(0), unitOptions[key], false, policyJSON[key]);
        }
    }

    // хайдим колонки где нет селектов
    for (var i = 0; i < groups.length; i++) {
        if (existingGroups.indexOf(groups[i]) >= 0)
            continue;

        // не стал делать через index() ибо в таблице td != th. если чет поменялось все поедет.
        // td ищу тока XioEmpty намеренно. Ибо если он криво будет скрывать мы увидим, иначе скроет нужное
        unitsTable.find(`th[policy-group=${groups[i]}]`).hide();
        unitsTable.find(`td.XioEmpty[policy-group=${groups[i]}]`).hide();
    }

    // проставляем ширину кнопок ксио и селектов
    var ths = $("th.XOhtml[style]");
    for (var i = 0; i < ths.length; i++) {
        let $selects = unitsTable.find("td.XioContainer:nth-child(" + (10 + i) + ")").find(".XioChoice");
        let $inputs = unitsTable.find("th.XOhtml:nth-child(" + (9 + i) + ")").find("input");
        let wa = $selects.map(function (i, e) { return $(e).width(); }).get() as any as number[];
        let width = wa.concat([$inputs.width() + 16]).reduce(function (p, c) { return Math.max(p, c); });
        $selects.width(width);
        $inputs.width(width - 16);
    }

    // расширяем дивы чобы влазила широкая таблица когда дофига селектов
    $("#wrapper").width(unitsTable.width() + 80);
    $("#mainContent").width(unitsTable.width());


    // развешиваем события на элементы
    //
    // по нажатию левой кнопкой выделяем строку цветом и классом
    unitsTable.on("mousedown.XO", "tr.wborder",
        function (this: HTMLElement, e: JQueryEventObject) {
            // обрабатывать только левую кнопку
            if (e.which !== 1)
                return;

            let tron = $(this);
            let oldTron = unitsTable.find("tr.trXIO");

            // со старой строки убираем класс, и возвращаем назад стили
            if (oldTron.length) {
                oldTron.removeClass("trXIO");
                if (oldTron.hasClass("odd"))
                    oldTron.css(trOddCss);
                else
                    oldTron.css(trEvenCss);
            }

            // задаем цвет строки БЕЗ класса. Иначе при выделении строки штатные классы будут преобладать и будет херь
            tron.addClass("trXIO").css(trSelectedCss);
        });
   
    // смена значения в селекте
    unitsTable.on("change.XO", "select.XioChoice",
        function (this: HTMLElement, e: JQueryEventObject) {
            logDebug("select changed");

            let select = $(e.target);
            let container = select.closest("td.XioContainer");
            let policyKey = container.attr("policy-key");
            let subid = container.attr("unit-id");

            // формируем новые данные для политики на основании выбранных опций
            let newOptions = parseOptions(container.get(0), policyJSON);
            if (newOptions == null)
                throw new Error("неведомая хуйня но политика не спарсилась.");

            let dict: IDictionary<PolicyOptions> = {};
            dict[policyKey] = newOptions;
            updateOptions($realm, subid, dict);
        });

    // жмак по кнопке GenerateAll
    unitsTable.on('click.XO', "#XioGeneratorPRO",
        function () { XioGenerator(subids); });

    // жмак по кнопке FireAll
    unitsTable.on('click.XO', "#XioFirePRO",
        function () { XioMaintenance(subids, []); });

    // generate отдельного юнита
    unitsTable.on('click.XO', ".XioGenerator",
        function (this: HTMLElement) {
            let subid = numberfy($(this).attr("unit-id"));
            XioGenerator([subid]);
        });

    // жмак по кнопке в хедере колонки
    unitsTable.on('click.XO', ".XioGroup",
        function (this: HTMLElement) {
            var allowedPolicies = $(this).val();
            XioMaintenance(subids, [allowedPolicies]);
        });

    // fire/subid кнопка юнита
    unitsTable.on('click.XO', ".XioSub",
        function (this: HTMLElement, e: JQueryEventObject) {
            let subid = numberfy($(this).attr("unit-id"));
            XioMaintenance([subid], []);
        });
}

// убрал содержимое, нафиг не нужно
function topManagerStats() {
    let fName = arguments.callee.toString();
    console.log(fName);
}

// для текущего урла, находит загружает указанные политики с хранилища, рисует селекты
function preference(policies: string[]) : boolean {
    // не задали ничего для простановки, и не будем ничо делать
    if (policies.length === 0)
        return false;
    //  TODO: не сохраняет политики внутри юнита.
    // работать будем с конкретным юнитом в котором находимся
    let subidRx = document.URL.match(/(view\/?)\d+/);
    if (subidRx == null)
        return false;

    let subid = numberfy(subidRx[0].split("/")[1]);
    if (subid === 0)
        throw new Error(`не шмагла извлечь subid из url:${document.URL}`);

    // место под комбобоксы настроек
    let $topblock = $("div.metro_header");
    $topblock.append(`<table id=XMoptions style='font-size: 14px; color:gold;'>
                        <tr id=XMHead></tr>
                        <tr id=XMOpt></tr>
                      </table>`);

    let headstring = "";
    let htmlstring = "";

    // формируем селекты под опции
    for (var i = 0; i < policies.length; i++) {
        let policyKey = policies[i];
        let policy = policyJSON[policyKey];
        
        headstring += `<td>${policy.group}</td>`;
        htmlstring += buildContainerHtml(subid.toString(), policyKey, policy);
    }

    $("#XMHead").html(headstring);
    $("#XMOpt").html(htmlstring);

    // проставляем настройки политик
    let parsedDict = loadOptions($realm, subid.toString());
    //debugger;
    for (var i = 0; i < policies.length; i++) {
        let policyKey = policies[i];
        let policy = policyJSON[policyKey];

        let containerKey = subid + "-" + policyKey;
        let container = $topblock.find(`td#${containerKey}`);
        if (container.length === 0)
            throw new Error("неведомая хуйня но не нашли контейнер для политики");

        setOptions(container.get(0), parsedDict[policyKey], false, policy);
    };


    if (policies.length) {
        let $selects = $("#XMoptions select");
        let wa = $selects.map((i, e) => $(e).width()).get() as any as number[];
        let width = wa.concat([0]).reduce((p, c) => Math.max(p, c));    // находим макс ширину из всех элементов селектов
        $selects.width(width);      // и ставим ее всем
        // TODO: нахуа ставить всем селектам одну ширину? Тока для одной группы надо а не всем группам. Брееед
        $("#XMoptions").before("<input type=button id=XioFire value=FIRE!>");
    }

    // TODO: тут не понимаю почему группы, но дальше будет видно когда буду браться за метод майнтаненс
    let policyNames = policies.map((item, i, arr) => policyJSON[item].group);
    $("#XioFire").click(() => XioMaintenance([subid], policyNames));

    $("#XMoptions").on("change.XO", "select.XioChoice",
        function (this: HTMLElement, e: JQueryEventObject) {
            logDebug("select changed");

            let select = $(e.target);
            let container = select.closest("td.XioContainer");
            let policyKey = container.attr("policy-key");
            let subid = container.attr("unit-id");

            // формируем новые данные для политики на основании выбранных опций
            let newOptions = parseOptions(container.get(0), policyJSON);
            if (newOptions == null)
                throw new Error("неведомая хуйня но политика не спарсилась.");

            let dict: IDictionary<PolicyOptions> = {};
            dict[policyKey] = newOptions;
            updateOptions($realm, subid, dict);
        });

    return true;
}

// по урлу страницы возвращает policyKey который к ней относится
// переписано. можно оптимизировать запросы к дом.
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
            // TODO: нах убрал новый интерфейс какой то. оставляем только один. иначе глючит потом. 
            policyArray.push("es");
            //if ($html.find(".fa-users").length) {
            //    policyArray.push("en");
            //}
            //else {
            //    policyArray.push("es");
            //}
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
$(document).ready(() => XioScript());
//document.onreadystatechange(new ProgressEvent("XioLoad"));