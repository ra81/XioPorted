
var $ = jQuery = jQuery.noConflict(true);

var ls = localStorage;
var realm = xpCookie('last_realm');
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

function XioGenerator(subidList: number[]) {
    console.log(getFuncName(arguments));
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

function XioOverview() {
    let unitsTable = $(".unit-list-2014");

    // скрыть все колонки кроме Город, Подразделение
    unitsTable.find("td, th").filter(":not(:nth-child(2)):not(:nth-child(3)):not(:nth-child(8))").addClass("XioHide").hide();
    unitsTable.find("tr.odd").css("backgroundColor", "lightgoldenrodyellow");
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

    // отрисовка кнопок в хедере таблицы с поколоночными операциями и Общими на группу юнитов
    var policyString: string[][] = [];
    var groupString: string[] = [];
    var thstring = `<th class=XOhtml style="padding-right:5px">
                      <input type=button id=XioGeneratorPRO class='XioGo' value='Gen ALL' style='width:50%'>
                      <input type=button id=XioFirePRO class='XioGo' value='FIRE ALL' style='width:50%' >
                    </th>`;

    var tdstring = "";
    for (var key in policyJSON) {
        let policy = policyJSON[key];
        if (groupString.indexOf(policy.group) < 0) {
            groupString.push(policy.group);
            policyString.push([policy.name]);
            thstring += `<th class=XOhtml style='padding-right:5px'>
                           <input type=button class='XioGo XioGroup' value=${policy.group} style='width:100%'>
                         </th>`;
            tdstring += "<td class=XOhtml></td>";
        }
        else {
            policyString[groupString.indexOf(policy.group)].push(policy.name);
        }
    }

    unitsTable.find("th:nth-child(7)").after(thstring);


    // далее отработка каждого юнита
    //
    let subids = unitsTable.find("tr:not(.unit_comment) td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];

    // вставляем кнопки в каждую строку. generate/fire. для отработки конкретного юнита
    let $td = unitsTable.find("tr:not(.unit_comment) td:nth-child(8)");
    for (var i = 0; i < subids.length; i++) {
        $td.eq(i).after(`<td class=XOhtml>
                           <input type=button data-id=${subids[i]} class='XioGo XioGenerator' value=Generate>
                           <input type=button class='XioGo XioSub' value=${subids[i]}>
                         </td>` + tdstring
        );
    }

    // для всех юнитов в списке выводим селекты политик и проставляем значения политик взятые из лок хранилища
    for (var i = 0; i < subids.length; i++) {
        var savedPolicyStrings: string[] = ls["x" + realm + subids[i]] ? ls["x" + realm + subids[i]].split(";") : [];
        for (var j = 0; j < savedPolicyStrings.length; j++) {
            var name = savedPolicyStrings[j].substring(0, 2);
            var policy = policyJSON[name];
            if (policy == null)
                continue;

            var choices = savedPolicyStrings[j].substring(2).split("-");

            // в каждую строку юнита добавляем селекты для выбора политик.
            var htmlstring = "";
            for (var k = 0; k < policy.order.length; k++) {
                if (k >= 1)
                    htmlstring += "<br>";

                htmlstring += "<select data-id=" + subids[i] + " data-name=" + name + " data-choice=" + k + " class=XioChoice>";
                for (var l = 0; l < policy.order[k].length; l++)
                    htmlstring += "<option value=" + l + ">" + policy.order[k][l] + "</option>";

                htmlstring += "</select>";
            }

            // для всех селектов которые добавили проставляем значения политик из лок стораджа
            let $selects = unitsTable.find("tr:not(.unit_comment)").eq(i + 1).find("td").eq(groupString.indexOf(policy.group) + 9).html(htmlstring).find("select");
            for (var k = 0; k < policy.order.length; k++) {
                let ch = parseInt(choices[k]);
                var policyChoice = policy.order[k].indexOf(policy.save[k][ch]);
                policyChoice = Math.max(policyChoice, 0);
                $selects.eq(k).val(policyChoice);
            }
        }
    }

    // чета удаляем не понял чо
    var j = 0;
    for (var i = 0; i < policyString.length; i++) {
        if (unitsTable.find("td:nth-child(" + (10 + i - j) + ")").find("select").length === 0) {
            $(".unit-list-2014 th:nth-child(" + (9 + i - j) + "), .unit-list-2014  td:nth-child(" + (10 + i - j) + ")").remove();
            j++;
        }
    }

    // проставляем ширину кнопок ксио и селектов
    var ths = $("th.XOhtml[style]");
    for (var i = 0; i < ths.length; i++) {
        let $selects = $("td.XOhtml:nth-child(" + (10 + i) + ") select");
        let $inputs = $("th.XOhtml:nth-child(" + (9 + i) + ") input");
        let wa = $selects.map(function (i, e) { return $(e).width(); }).get() as any as number[];
        let width = wa.concat([$inputs.width() + 16]).reduce(function (p, c) { return Math.max(p, c); });
        $selects.width(width);
        $inputs.width(width - 16);
    }

    // расширяем дивы чобы влазила широкая таблица когда дофига селектов
    $("#wrapper").width(unitsTable.width() + 80);
    $("#mainContent").width(unitsTable.width());

    // всем селектам вешаем доп свойство open.
    $(".XioChoice").data("open", false);

    let $tron: JQuery;  // TODO: тут я решил избавиться от глобальной переменной ибо нахера она? функции захватывают локальный скоуп
    let $mousedown = false;
    let $this: JQuery;

    // по нажатию кнопки выделяем строку юнита и запомним tr на котором собсна это произошло
    $(document).on("mousedown.XO", ".wborder",
        function (this: HTMLElement, e: JQueryEventObject) {
            if (!$(e.target).is('.XioChoice') && !$(e.target).is('.XioChoice option')) {
                $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
                $(".trXIO").removeClass("trXIO");
                $(this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
                $mousedown = true;
                $tron = $(e.target).is("tr") ? $(e.target) : $(e.target).parents("tr");
            }
    });

    // при наведении мышкой на строку юнитам
    unitsTable.on("mouseover.XO", ".wborder",
        function (this: HTMLElement, e: JQueryEventObject) {
            if ($mousedown) {
                $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
                $(".trXIO").removeClass("trXIO");
                $this = $(this);

                // ваще не понял этой магии
                if ($this.index() < $tron.index()) {
                    $this.nextUntil($tron).addBack().add($tron).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
                }
                else if ($this.index() > $tron.index()) {
                    $tron.nextUntil($this).addBack().add($this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
                }
                $this.addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
        });

    $(document).on("mouseup.XO", ".wborder", function () {
        $mousedown = false;
    });

    // при наведении мышкой на строку юнитам
    $(document).on("mouseover.XO", ".wborder",
        function (this: HTMLElement, e: JQueryEventObject) {
            if ($mousedown) {
                $(".trXIO").css("backgroundColor", "").filter(".odd").css("backgroundColor", "lightgoldenrodyellow");
                $(".trXIO").removeClass("trXIO");
                $this = $(this);

                // ваще не понял этой магии
                if ($this.index() < $tron.index()) {
                    $this.nextUntil($tron).addBack().add($tron).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
                }
                else if ($this.index() > $tron.index()) {
                    $tron.nextUntil($this).addBack().add($this).addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
                }
                $this.addClass("trXIO").css("backgroundColor", "rgb(255, 210, 170)");
            }
    });

    var detector = navigator.userAgent.indexOf('Safari') != -1 && navigator.userAgent.indexOf('Chrome') == -1 ? 'mousedown.XO' : 'click.XO';

    $(document).on(detector, ".XioChoice",
        function (this: HTMLElement, e: JQueryEventObject) {
            $this = $(this);

            // меняем повешанные на селект данные open при клике по нему
            if ($(this).data("open") === false) {
                //open
                $(this).data("open", true);
                $(document).on("mouseup.XO.XIN", "", execute);
            }
            else {
                //not open
                $(this).data("open", false);
            }

            function execute() {
                //close
                $(document).off(".XIN");

                setTimeout(function () {
                    $this.data('open', false);
                }, 1);

                var thisname = $this.attr("data-name");
                var thischoice = numberfy($this.attr("data-choice"));
                var thisvalue = policyJSON[thisname].order[thischoice][$this.val()];
                var column = $this.parent().index();

                var $arr = $(".trXIO td:nth-child(" + (column + 1) + ") .XioChoice");
                //if row not selected
                if ($arr.length === 0) {
                    $arr = $("tr:nth-child(" + ($this.parent().parent().index() + 1) + ") td:nth-child(" + (column + 1) + ") .XioChoice");
                }

                for (var i = 0; i < $arr.length; i++) {

                    var name = $arr.eq(i).attr("data-name");
                    var subid = $arr.eq(i).attr("data-id");
                    var choice = numberfy($arr.eq(i).attr("data-choice"));
                    var index = policyJSON[name].save[choice].indexOf(thisvalue);
                    var value = policyJSON[name].order[choice].indexOf(thisvalue);

                    if (index >= 0) {

                        $arr.eq(i).val(value);
                        var savedPolicyStrings:string[] = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
                        var savedPolicies: string[] = [];
                        var savedPolicyChoices: string[] = [];
                        for (var j = 0; j < savedPolicyStrings.length; j++) {
                            savedPolicies[j] = savedPolicyStrings[j].substring(0, 2);
                            savedPolicyChoices[j] = savedPolicyStrings[j].substring(2);
                        }

                        var option = savedPolicies.indexOf(name);
                        var split = savedPolicyChoices[option].split("-");
                        split[choice] = index.toString();
                        savedPolicyChoices[option] = split.join("-");

                        let newPolicyString = "";
                        for (var j = 0; j < savedPolicies.length; j++) {
                            newPolicyString += ";" + savedPolicies[j] + savedPolicyChoices[j];
                        }
                        ls["x" + realm + subid] = newPolicyString.substring(1);
                    }
                }
            }
        });

    // жмак по кнопке GenerateAll
    $(document).on('click.XO', "#XioGeneratorPRO", function () {
        XioGenerator(subids);
    });

    // жмак по кнопке FireAll
    $(document).on('click.XO', "#XioFirePRO", function () {
        XioMaintenance(subids, []);
    });

    // generate отдельного юнита
    $(document).on('click.XO', ".XioGenerator",
        function (this: HTMLElement) {
        var subid = numberfy($(this).attr("data-id"));
        XioGenerator([subid]);
    });

    // жмак по кнопке в хедере колонки
    $(document).on('click.XO', ".XioGroup",
        function (this: HTMLElement) {
        var allowedPolicies = $(this).val();
        XioMaintenance(subids, [allowedPolicies]);
    });

    // fire/subid кнопка юнита
    $(document).on('click.XO', ".XioSub",
        function (this: HTMLElement, e: JQueryEventObject) {
        var subid = numberfy($(this).val());
        XioMaintenance([subid], []);
    });
}


function topManagerStats() {
    let fName = arguments.callee.toString();
    console.log(fName);
}

function preference(policies: string[]) : boolean {
    
    // работать будем с конкретным юнитом в котором находимся
    let subidRx = document.URL.match(/(view\/?)\d+/);
    if (subidRx == null)
        return false;

    let subid = numberfy(subidRx[0].split("/")[1]);

    // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
    let savedPolicyStrings: string[] = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
    let savedPolicies: string[] = [];
    let savedPolicyChoices: string[][] = [];
    for (var i = 0; i < savedPolicyStrings.length; i++) {
        savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
        savedPolicyChoices[i] = savedPolicyStrings[i].substring(2).split("-");
    }
    
    // место под комбобоксы настроек
    let $topblock = $("div.metro_header");
    $topblock.append("<table id=XMoptions style='font-size: 14px; color:gold;'><tr id=XMHead></tr><tr id=XMOpt></tr></table>");

    let policyNames: string[] = [];
    let headstring = "";
    let htmlstring = "";
    let setpolicies: any = [];

    for (var i = 0; i < policies.length; i++) {
        let policy = policyJSON[policies[i]];

        // вдруг такой политики не описано. чудо как бы
        if (!policy)
            continue;

        policyNames.push(policy.group);
        headstring += `<td>${policy.group}</td>`;
        htmlstring += `<td id=${policies[i]}>`;     // id=pp/ps/pw и так далее

        // наполняем комбобоксы списками политик в том порядке в каком они должны отображаться
        for (var j = 0; j < policy.order.length; j++) {
            if (j >= 1)
                htmlstring += "<br>";

            htmlstring += "<select class=XioPolicy data-index=" + j + ">";

            for (var k = 0; k < policy.order[j].length; k++)
                htmlstring += "<option>" + policy.order[j][k] + "</option>";

            htmlstring += "</select>";

            // если есть сохраненные данные для данной политики у юнита
            // кладем все функции установщиков в массив чтобы потом разом вызвать. ебанутое решение имхо
            let index = savedPolicies.indexOf(policies[i]);
            if (index >= 0) {
                let savedChoice = numberfy(savedPolicyChoices[index][j]);
                let policyChoice = policy.order[j].indexOf(policy.save[j][savedChoice]);

                // хитрый ход конем чтобы сохранить контекст. переменные нужно запомнить.
                // здесь был bind но он жопа. Анонимная функция лучше
                let setter = () => {
                    var _policyStr = policies[i]; // запоминаем в скоупе функции переменные которые нам надо
                    var _ind = j;
                    var _choice = policyChoice;

                    // вернем анонимную функцию которая выполнится в скоупе где переменные запомнены
                    return () => $(`#${_policyStr} select:eq(${_ind}) option`).eq(_choice).attr("selected", "true");
                }
                setpolicies.push(setter());
            }
        }
        htmlstring += "</td>";
    }

    $("#XMHead").html(headstring);
    $("#XMOpt").html(htmlstring);
    for (var i = 0; i < setpolicies.length; i++)
        setpolicies[i]();

    if (policies.length) {
        let $selects = $("#XMoptions select");
        let wa = $selects.map((i, e) => $(e).width()).get() as any as number[];
        let width = wa.concat([0]).reduce((p, c) => Math.max(p, c));    // находим макс ширину из всех элементов селектов
        $selects.width(width);      // и ставим ее всем
        // TODO: нахуа ставить всем селектам одну ширину? Тока для одной группы надо а не всем группам. Брееед
        $("#XMoptions").before("<input type=button id=XioFire value=FIRE!>");
    }

    $("#XioFire").click(() => XioMaintenance([subid], policyNames));

    $(".XioPolicy").change(function (this: HTMLElement) {
        let $thistd = $(this).parent();
        let thisid = $thistd.attr("id");

        // загружаем из лок хранилища настройки политик для текущего юнита xolga6384820 : es3-1;eh0;et0;qm2-2
        let savedPolicyStrings: string[] = ls["x" + realm + subid] ? ls["x" + realm + subid].split(";") : [];
        let savedPolicies: string[] = [];
        let savedPolicyChoices: string[] = [];
        for (var i = 0; i < savedPolicyStrings.length; i++) {
            savedPolicies[i] = savedPolicyStrings[i].substring(0, 2);
            savedPolicyChoices[i] = savedPolicyStrings[i].substring(2);
        }

        // формируем строку для записи в лок хранилище
        let thischoice = "";
        for (var i = 0; i < policyJSON[thisid].order.length; i++) {
            if (i >= 1)
                thischoice += "-";

            let selected = $thistd.find("option:selected").eq(i).text();
            thischoice += policyJSON[thisid].save[i].indexOf(selected);
        }

        let ind = savedPolicies.indexOf(thisid);
        if (ind >= 0) {
            savedPolicyChoices[ind] = thischoice;
        }
        else {
            savedPolicies.push(thisid);
            savedPolicyChoices.push(thischoice);
        }

        let newPolicyString = "";
        for (var i = 0; i < savedPolicies.length; i++)
            newPolicyString += ";" + savedPolicies[i] + savedPolicyChoices[i];
        
        ls["x" + realm + subid] = newPolicyString.substring(1);
    })
        .each(function (this: HTMLElement) { $(this).trigger("change"); });

    return true;
}
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
            if ($html.find(".fa-users").length) {
                policyArray.push("en");
            }
            else {
                policyArray.push("es");
            }
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
document.onreadystatechange = () => {
    if (document.readyState === "complete") {
        XioScript();
    }
};
document.onreadystatechange(new ProgressEvent("XioLoad"));