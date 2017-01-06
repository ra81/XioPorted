
var $ = jQuery = jQuery.noConflict(true);

let $xioDebug = true;
//var ls = localStorage;
let $realm = getRealm();
let getUrls:string[] = [];
let finUrls: string[] = [];
let xcallback: [string, () => void][] = []; // массив of tuple
let $mapped: IDictionary<MappedPage> = {};
var xcount: IDictionary<number> = {};
var xmax: IDictionary<number> = {};
let typedone: string[] = [];
let xwait: [string[], IAction0][] = [];
let xequip:any[] = [];
var fireequip = false;
let servergetcount = 0;
var serverpostcount = 0;
var suppliercount = 0;
let processingtime = 0;
let timeinterval = 0;
//var mousedown = false;
//var $tron: HTMLElement;
var XMreload = false;
var xsup: any = []; // TODO: как то гемор этот разгрести и типизировать
let xsupcheck: IDictionary<boolean> = {};
let urlUnitlist = "";
let blackmail:string[] = [];
let companyid = getCompanyId();
let equipfilter: string[] = [];
let subType: IDictionary<[number, number, string]> = {
    mine: [8, 8, "/img/qualification/mining.png"],
    power: [6, 6, "/img/qualification/power.png"],
    workshop: [4, 4, "/img/qualification/manufacture.png"],
    sawmill: [4, 4, "/img/qualification/manufacture.png"],
    farm: [1.6, 1.6, "/img/qualification/farming.png"],
    orchard: [1.2, 1.2, "/img/qualification/farming.png"],
    medicine: [1, 1, "/img/qualification/medicine.png"],
    fishingbase: [1, 1, "/img/qualification/fishing.png"],
    animalfarm: [0.6, 0.6, "/img/qualification/animal.png"],
    lab: [0.4, 0.4, "/img/qualification/research.png"],
    mill: [0.4, 4, "/img/qualification/manufacture.png"],
    restaurant: [0.4, 0.4, "/img/qualification/restaurant.png"],
    shop: [0.4, 0.4, "/img/qualification/trade.png"],
    repair: [0.2, 0.2, "/img/qualification/car.png"],
    fuel: [0.2, 0.2, "/img/qualification/car.png"],
    service: [0.12, 0.12, "/img/qualification/service.png"],
    service_light: [0.12, 0.12, "/img/qualification/service.png"],
    office: [0.08, 0.08, "/img/qualification/management.png"],
    it: [0.08, 0.08, "/img/qualification/it.png"],
    educational: [0.12, 0.12, "/img/qualification/educational.png"]
};


function getRealm(): string {
    let r = xpCookie('last_realm');
    if (r == null)
        throw new Error("неведомая хуйня но реалм == null")

    return r;
}

function getFuncName(args: IArguments): string {
    // из аргументов функции вытаскивает само имя функции. для лога чисто

    let items = args.callee.toString().split("(");
    return items[0] ? items[0] + "()" : "";
}

function logDebug(msg: string, ...args: any[]) {
    if (!$xioDebug)
        return;

    if (args.length === 0)
        console.log(msg);
    else
        console.log(msg, args);
}

/**
 * Оцифровывает строку. Возвращает всегда либо Number.POSITIVE_INFINITY либо 0
 * @param variable любая строка.
 */
function numberfy(variable: string): number {
    // возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо 0 если не получилось преобразовать.

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

function zipAndMin(napArr1: number[], napArr2: number[]) {
    // адская функция. так и не понял нафиг она

    if (napArr1.length > napArr2.length) {
        return napArr1;
    } else if (napArr2.length > napArr1.length) {
        return napArr2;
    } else {
        var zipped = napArr1.map( (e, i) => [napArr1[i], napArr2[i]]);
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

function map(html: any, url: string, page: string): boolean {

    if (page === "ajax") {
        $mapped[url] = JSON.parse(html);
        return false;
    }
    else if (page === "none") {
        return false;
    }
    // TODO: запилить классы для каждого типа страницы. чтобы потом можно было с этим типизированно воркать
    var $html = $(html);
    if (page === "unitlist") {
        $mapped[url] = parseUnitList(html, url);
    }
    else if (page === "sale") {
        $mapped[url] = {
            form: $html.find("[name=storageForm]"),
            policy: $html.find("select:even").map(function (i, e) { return $(e).find("[selected]").index(); }).get() as any as number[],
            price: $html.find("input.money:even").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            incineratorMaxPrice: $html.find('span[style="COLOR: green;"]').map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            outqual: $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            outprime: $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            stockqual: $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            stockprime: $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            product: $html.find(".grid a:not([onclick])").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            productId: $html.find(".grid a:not([onclick])").map(
                function (i, e) {
                    let m = $(e).attr("href").match(/\d+/);
                    return numberfy(m  ? m[0]: "0");
                }).get() as any as number[],
            region: $html.find(".officePlace a:eq(-2)").text(),
            contractpage: !!$html.find(".tabsub").length,
            // ["Мука", "$0.78", "$0.78"] вот такая хуйня выпадает.
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e) }) as any as [string, number, number]
        }
    }
    else if (page === "salecontract") {
        $mapped[url] = {
            category: $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[],
            contractprice: ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e) }) as any as [string, number, number]
        }
    }
    else if (page === "prodsupply") {
        $mapped[url] = $html.find(".inner_table").length ? {  //new interface
            isProd: !$html.find(".sel").next().attr("class"),
            parcel: $html.find(".quickchange").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_mark_up: [],
            price_constraint_max: [],
            price_constraint_type: [],
            quality_constraint_min: [],
            required: $html.find(".list td:nth-child(3).inner_table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            stock: $html.find(".list td:nth-child(4).inner_table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            basequality: $html.find(".list td:nth-child(4).inner_table tr:nth-child(2) td:nth-child(2)[align]").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            prodid: $html.find(".list tr:has([src='/img/supplier_add.gif']) > td:nth-child(1) a").map(
                function (i, e) {
                    let m = $(e).attr("href").match(/\d+/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
            offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(2) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            quality: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(3) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            available: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(4) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            maximum: $html.find(".list td:has(.quicksave)").map(
                function (i, e) {
                    let m = $(e).find("[style='color: red;']").text().match(/(\d|\s)+/);
                    return $(e).find("[style='color: red;']").length ? numberfy(m ? m[0] : "0") : Infinity;
                }).get() as any as number[],
            reprice: $html.find(".list tr[onmouseover] table:has(a) tr:nth-child(2)").map(function (i, e) { return !!$(e).filter(".ordered_red, .ordered_green").length; }).get() as any as boolean[],
            mainrow: $html.find(".list tr[onmouseover]").map(function (i, e) { return !!$(e).find("[alt='Select supplier']").length; }).get() as any as boolean[],
            nosupplier: $html.find(".list tr[onmouseover]").map(function (i, e) { return !$(e).find("[src='/img/smallX.gif']").length; }).get() as any as boolean[],
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        } : { //old interface
                isProd: !$html.find(".sel").next().attr("class"),
                parcel: $html.find("input[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
                price_mark_up: $html.find("select[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
                price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
                price_constraint_type: $html.find("select[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get() as any as string[],
                quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
                required: $html.find(".list td:nth-child(2) table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                stock: $html.find(".list td:nth-child(3) table tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                basequality: $html.find(".list td:nth-child(3) table tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                prodid: $html.find(".list a:has(img)[title]").map(
                    function (i, e) {
                        let m = $(e).attr("href").match(/\d+/);
                        return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
                offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
                price: $html.find("[id^=totalPrice] tr:nth-child(1) td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                quality: $html.find("[id^=totalPrice] tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                available: $html.find("[id^=quantity] tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
                maximum: $html.find(".list td:has([type=type])").map(
                    function (i, e) {
                        let m = $(e).find("[style='color:red']").text().match(/(\d|\s)+/);
                        return $(e).find("[style='color:red']").length ? numberfy(m ? m[0] : "0") : Infinity;
                    }).get() as any as number[],
                reprice: $html.find("[id^=totalPrice] tr:nth-child(1)").map(function (i, e) { return !!$(e).filter("[style]").length; }).get() as any as boolean[],
                mainrow: $html.find(".list tr[id]").map(function (i, e) { return !/sub/.test($(e).attr("id")); }).get() as any as boolean[],
                nosupplier: $html.find(".list tr[id]").map(function (i, e) { return !$(e).find("[src='/img/smallX.gif']").length; }).get() as any as boolean[],
                img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
            }
    }
    else if (page === "consume") {
        $mapped[url] = {
            consump: zipAndMin(
                $html.find(".list td:nth-last-child(1) div:nth-child(2)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get() as any as number[],
                $html.find(".list td:nth-last-child(1) div:nth-child(1)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get() as any as number[]
            ),
            purch: $html.find('#mainContent > form > table.list > tbody > tr:last > td.nowrap').map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "storesupply") {
        $mapped[url] = {
            parcel: $html.find("input:text[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_mark_up: $html.find("select[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_constraint_type: $html.find("select[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get() as any as string[],
            quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            purchase: $html.find("td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            quantity: $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            sold: $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(5) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            offer: $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            reprice: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return !!$(e).find("div").length; }).get() as any as boolean[],
            quality: $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            available: $html.find("td:nth-child(10) table:nth-child(1) tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            img: $html.find(".noborder td > img").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[]
        }
    }
    else if (page === "tradehall") {
        $mapped[url] = {
            stock: $html.find(".nowrap:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            deliver: $html.find(".nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text().split("[")[1]); }).get() as any as number[],
            report: $html.find(".grid a:has(img):not(:has(img[alt]))").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[],
            img: $html.find(".grid a img:not([alt])").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[],
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            purch: $html.find("td:nth-child(9)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            price: $html.find(":text").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            name: $html.find(":text").map(function (i, e) { return $(e).attr("name"); }).get() as any as string[],
            share: $html.find(".nowrap:nth-child(11)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            cityprice: $html.find("td:nth-child(12)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            cityquality: $html.find("td:nth-child(13)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            history: $html.find("a.popup").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[]
        }
    }
    else if (page === "service") {
        $mapped[url] = {
            price: $html.find("a.popup[href$='service_history']").map(function (i, e) { return numberfy($(e).text().split('(')[0].trim()); }).get() as any as number[],
            history: $html.find("a.popup[href$='service_history']").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[],
            incineratorPrice: $html.find("a.popup[href$='power_history']").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],

            //not used
            stock: $html.find(".nowrap:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            deliver: $html.find(".nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text().split("[")[1]); }).get() as any as number[],
            report: $html.find(".grid a:has(img):not(:has(img[alt]))").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[],
            img: $html.find(".grid a img:not([alt])").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[],
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            name: $html.find(":text").map(function (i, e) { return $(e).attr("name"); }).get() as any as string[],
            share: $html.find(".nowrap:nth-child(11)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            cityprice: $html.find("td:nth-child(12)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            cityquality: $html.find("td:nth-child(13)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "servicepricehistory") {
        $mapped[url] = {
            price: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            quantity: $html.find(".list td:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "retailreport") {
        $mapped[url] = {
            marketsize: numberfy($html.find("b:eq(1)").text()),
            localprice: numberfy($html.find(".grid .even td:eq(0)").text()),
            localquality: numberfy($html.find(".grid .odd td:eq(0)").text()),
            cityprice: numberfy($html.find(".grid .even td:eq(1)").text()),
            cityquality: numberfy($html.find(".grid .odd td:eq(1)").text())
        }
    }
    else if (page === "pricehistory") {
        // если продаж на неделе не было вообще => игра не запоминает в историю продаж такие дни вообще.
        // такие дни просто вылетают из списка.
        // сегодняшний день ВСЕГДА есть в списке.
        // если продаж сегодня не было, то в строке будут тока бренд 0 а остальное пусто.
        // если сегодня продажи были, то там будут числа и данная строка запомнится как история продаж.
        // причина по которой продаж не было пофиг. Не было товара, цена стояла 0 или стояла очень большая. Похер!

        // numberfy возвращает 0, если была пустота или неадекват. Поэтому у нас всегда будет 1 число в массиве.
        $mapped[url] = {
            quantity: $html.find(".list td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            price: $html.find(".list td:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "TM") {
        $mapped[url] = {
            product: $html.find(".grid td:odd").map(function (i, e) { return $(e).clone().children().remove().end().text().trim(); }).get() as any as string[],
            franchise: $html.find(".grid b").map(function (i, e) { return $(e).text(); }).get() as any as string[]
        }
    }
    else if (page === "IP") {
        $mapped[url] = {
            product: $html.find(".list td:nth-child(5n-3)").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            IP: $html.find(".list td:nth-child(5n)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "transport") {
        $mapped[url] = {
            countryName: $html.find("select:eq(0) option").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            countryId: $html.find("select:eq(0) option").map(function (i, e) { return numberfy($(e).val().split("/")[1]); }).get() as any as number[],
            regionName: $html.find("select:eq(1) option").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            regionId: $html.find("select:eq(1) option").map(function (i, e) { return numberfy($(e).val().split("/")[2]); }).get() as any as number[],
            cityName: $html.find("select:eq(2) option").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            cityId: $html.find("select:eq(2) option").map(function (i, e) { return numberfy($(e).val().split("/")[3]); }).get() as any as number[]
        }
    }
    else if (page === "CTIE") {
        $mapped[url] = {
            product: $html.find(".list td:nth-child(3n-1)").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            profitTax: numberfy($html.find(".region_data td:eq(3)").text()),
            CTIE: $html.find(".list td:nth-child(3n)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "main") {
        $mapped[url] = {
            employees: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(0) td:eq(1)").text()),
            salaryNow: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(2) td:eq(1)").text()),
            salaryCity: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(3) td:eq(1)").text()),
            skillNow: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(4) td:eq(1)").text()),
            skillReq: numberfy($html.find(".unit_box:has(.fa-users) tr:eq(5) td:eq(1)").text()),
            equipNum: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(0) td:eq(1)").text()),
            equipMax: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(1) td:eq(1)").text()),
            equipQual: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(2) td:eq(1)").text()),
            equipReq: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(3) td:eq(1)").text()),
            equipWearBlack: numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1)").text().split("(")[1]),
            equipWearRed: $html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1) span").length === 1,
            managerPic: $html.find(".unit_box:has(.fa-user) ul img").attr("src"),
            qual: numberfy($html.find(".unit_box:has(.fa-user) tr:eq(1) td:eq(1)").text()),
            techLevel: numberfy($html.find(".unit_box:has(.fa-industry) tr:eq(3) td:eq(1)").text()),
            maxEmployees: numberfy($html.find(".unit_box:has(.fa-user) tr:eq(2) td:eq(1)").text()),
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0],
            size: numberfy($html.find("#unitImage img").attr("src").split("_")[1]),
            hasBooster: !$html.find("[src='/img/artefact/icons/color/production.gif']").length,
            hasAgitation: !$html.find("[src='/img/artefact/icons/color/politics.gif']").length,
            onHoliday: !!$html.find("[href$=unset]").length,
            isStore: !!$html.find("[href$=trading_hall]").length,
            departments: numberfy($html.find("tr:contains('Number of departments') td:eq(1)").text()),
            visitors: numberfy($html.find("tr:contains('Number of visitors') td:eq(1)").text())
        }
    }
    else if (page === "salary") {
        $mapped[url] = {
            employees: numberfy($html.find("#quantity").val()),
            form: $html.filter("form"),
            salaryNow: numberfy($html.find("#salary").val()),
            salaryCity: numberfy($html.find("tr:nth-child(3) > td").text().split("$")[1]),
            skillNow: numberfy($html.find("#apprisedEmployeeLevel").text()),
            skillCity: (() => {
                let m = $html.find("div span[id]:eq(1)").text().match(/[0-9]+(\.[0-9]+)?/);
                return numberfy(m == null ? "0" : m[0]);
            })(),
            skillReq: (() => {
                let m = $html.find("div span[id]:eq(1)").text().split(",")[1].match(/(\d|\.)+/);
                return numberfy(m == null ? "0" : m[0]);
            })()
        }
    }
    else if (page === "training") {
        $mapped[url] = {
            form: $html.filter("form"),
            salaryNow: numberfy($html.find(".list td:eq(8)").text()),
            salaryCity: numberfy($html.find(".list td:eq(9)").text().split("$")[1]),
            weekcost: numberfy($html.find("#educationCost").text()),
            employees: numberfy($html.find("#unitEmployeesData_employees").val()),
            skillNow: numberfy($html.find(".list span:eq(0)").text()),
            skillCity: numberfy($html.find(".list span:eq(1)").text())
        }
    }
    else if (page === "equipment") {
        $mapped[url] = {
            qualNow: numberfy($html.find("#top_right_quality").text()),
            qualReq: numberfy($html.find(".recommended_quality span:not([id])").text()),
            equipNum: numberfy($html.find("#quantity_corner").text()),
            equipMax: (() => {
                let m = $html.find(".contract:eq(1)").text().split("(")[1].match(/(\d| )+/);
                return numberfy(m == null ? "0" : m[0]);
            })(),
            equipPerc: numberfy($html.find("#wear").text()),
            price: $html.find(".digits:contains($):odd:odd").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            qualOffer: $html.find(".digits:not(:contains($)):odd").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            available: $html.find(".digits:not(:contains($)):even").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            offer: $html.find(".choose span").map(function (i, e) { return numberfy($(e).attr("id")); }).get() as any as number[],
            img: $html.find(".rightImg").attr("src") as any as string[],
            filtername: (() => {
                let m = $html.find("[name=doFilterForm]").attr("action").match(/db.*?\//);
                return m == null ? "" : m[0].slice(2, -1);
            })()
        }
    }
    else if (page === "manager") {
        $mapped[url] = {
            base: $html.find(".qual_item .mainValue").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            bonus: $html.find(".qual_item .bonusValue").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            pic: $html.find(".qual_item img").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[]
        }
    }
    else if (page === "tech") {
        $mapped[url] = {
            price: $html.find("tr td.nowrap:nth-child(2)").map(function (i, e) { return $(e).text().trim(); }).get() as any as string[],
            tech: $html.find("tr:has([src='/img/v.gif'])").index() as number,
            img: $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0]
        }
    }
    else if (page === "products") {
        //mapped[url] = {
        //    name: $html.find(".list td:nth-child(2n):has(a)").map(function (i, e) { return $(e).text(); }).get() as any as string[],
        //    id: $html.find(".list td:nth-child(2n) a:nth-child(1)").map(
        //        function (i, e) {
        //            let m = $(e).attr("href").match(/\d+/);
        //            return numberfy(m == null ? "0": m[0]);
        //        }).get() as any as number[]
        //}
    }
    else if (page === "waresupply") {
        $mapped[url] = {
            form: $html.find("[name=supplyContractForm]"),
            contract: $html.find(".p_title").map(function (i, e) { return $(e).find("a:eq(1)").attr("href"); }).get() as any as string[],
            id: $html.find(".p_title").map(
                function (i, e) {
                    let m = $(e).find("a:eq(1)").attr("href").match(/\d+$/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
            type: $html.find(".p_title").map(function (i, e) { return $(e).find("strong:eq(0)").text(); }).get() as any as string[],
            stock: $html.find(".p_title table").map(function (i, e) { return $(e).find("strong").length >= 2 ? numberfy($(e).find("strong:eq(0)").text()) : 0; }).get() as any as number[],
            shipments: $html.find(".p_title table").map(function (i, e) { return $(e).find("strong").length === 1 ? numberfy($(e).find("strong:eq(0)").text()) : numberfy($(e).find("strong:eq(2)").text()); }).get() as any as number[],
            parcel: $html.find("input:text[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_mark_up: $html.find("input[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_constraint_max: $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            price_constraint_type: $html.find("input[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get() as any as string[],
            quality_constraint_min: $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            product: $html.find("tr:has(input:text[name])").map(function (i, e) { return $(e).prevAll(".p_title:first").find("strong:eq(0)").text(); }).get() as any as string[],
            price: $html.find("tr:has(input) td:nth-child(4)").map(
                function (i, e) {
                    let m = $(e).text().match(/(\d|\.|\s)+$/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
            reprice: $html.find("tr:has(input) td:nth-child(4)").map(function (i, e) { return !!$(e).find("span").length; }).get() as any as boolean[],
            quality: $html.find("tr:has(input) td:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            offer: $html.find("tr input:checkbox").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            available: $html.find("tr:has(input) td:nth-child(9)").map(
                function (i, e) {
                    return $(e).text().split(/\s[a-zA-Zа-яА-ЯёЁ]+\s/).reduce(
                        function (a, b) {
                            let m = b.match(/(\d| )+/);
                            return Math.min(a, b.match(/\d+/) === null ? Infinity : numberfy(m ? m[0] : "0"));
                        }, Infinity)
            }).get() as any as number[],
            myself: $html.find("tr:has(input)[class]").map(function (i, e) { return !!$(e).find("strong").length; }).get() as any as boolean[],
            contractAdd: $html.find(".add_contract a:has(img)").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[],
            idAdd: $html.find(".add_contract a:has(img)").map(
                function (i, e) {
                    let m = $(e).attr("href").match(/\d+$/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
            typeAdd: $html.find(".add_contract img").map(function (i, e) { return $(e).attr("alt"); }).get() as any as string[]
        }
    }
    else if (page === "contract") {
        $mapped[url] = {
            available: $html.find(".price_w_tooltip:nth-child(4)").map(function (i, e) { return numberfy($(e).find("i").remove().end().text()); }).get() as any as number[],
            offer: $html.find(".unit-list-2014 tr[id]").map(
                function (i, e) {
                    let m = $(e).attr("id").match(/\d+/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[],
            price: $html.find(".price_w_tooltip:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            quality: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            tm: $html.find(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return $(e).find("img").length ? $(e).find("img").attr("title") : ""; }).get() as any as string[],
            company: $html.find("td:has(i):not([class])").map(function (i, e) { return $(e).find("b").text(); }).get() as any as string[],
            myself: $html.find(".unit-list-2014 tr[id]").map(function (i, e) { return !!$(e).filter(".myself").length; }).get() as any as boolean[],
            product: $html.find("img:eq(0)").attr("title") as string
        }
    }
    else if (page === "research") {
        $mapped[url] = {
            isFree: !$html.find(".cancel").length,
            isHypothesis: !!$html.find("#selectIt").length,
            isBusy: !!numberfy($html.find(".grid .progress_static_bar").text()),
            hypId: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            curIndex: $html.find("tr:has([src='/img/v.gif'])").index() - 1,
            chance: $html.find(".grid td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            time: $html.find(".grid td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            isAbsent: !!$html.find("b[style='color: red']").length,
            isFactory: !!$html.find("span[style='COLOR: red']").length,
            unittype: $html.find(":button:eq(2)").attr("onclick") ? numberfy($html.find(":button:eq(2)").attr("onclick").split(",")[1]) : 0,
            industry: $html.find(":button:eq(2)").attr("onclick") ? numberfy($html.find(":button:eq(2)").attr("onclick").split("(")[1]) : 0,
            level: numberfy($html.find(".list tr td[style]:eq(0)").text())
        }
    }
    else if (page === "experimentalunit") {
        $mapped[url] = {
            id: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[]
        }
    }
    else if (page === "productreport") {
        $mapped[url] = {
            max: $html.find(".grid td.nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text().split(":")[1]); }).get() as any as number[],
            total: $html.find(".grid td.nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            available: $html.find(".grid td.nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            quality: $html.find(".grid td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            price: $html.find(".grid td.nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            subid: $html.find(".grid td:nth-child(1) td:nth-child(1) a").map(
                function (i, e) {
                    let m = $(e).attr("href").match(/\d+/);
                    return numberfy(m ? m[0] : "0");
                }).get() as any as number[]
        }
    }
    else if (page === "financeitem") {
        $mapped[url] = {
            energy: numberfy($html.find(".list tr:has(span[style]) td:eq(1)").text())
        }
    }
    else if (page === "size") {
        $mapped[url] = {
            size: $html.find(".nowrap:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            rent: $html.find(".nowrap:nth-child(3)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            id: $html.find(":radio").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[]
        }
    }
    else if (page === "waremain") {
        $mapped[url] = {
            size: numberfy($html.find(".infoblock td:eq(1)").text()),
            full: numberfy($html.find("[nowrap]:eq(0)").text()),
            product: $html.find(".grid td:nth-child(1)").map(function (i, e) { return $(e).text(); }).get() as any as string[],
            stock: $html.find(".grid td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get()as any as number[],
            shipments: $html.find(".grid td:nth-child(6)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "ads") {
        $mapped[url] = {
            pop: (() => {
                let m = $html.find("script").text().match(/params\['population'\] = \d+/);
                return numberfy(m == null ? "0" : m[0].substring(23));
            })(),
            budget: numberfy($html.find(":text:not([readonly])").val()),
            requiredBudget: numberfy($html.find(".infoblock tr:eq(1) td:eq(1)").text().split("$")[1])
        }
    }
    else if (page === "employees") {
        $mapped[url] = {
            id: $html.find(".list tr:gt(2) :checkbox").map(function (i, e) { return numberfy($(e).attr("id").substring(5)); }).get() as any as number[],
            salaryWrk: $html.find(".list td:nth-child(7)").map(function (i, e) { return numberfy($(e).find("span").remove().end().text()); }).get() as any as number[],
            salaryCity: $html.find(".list td:nth-child(8)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            skillWrk: $html.find(".list td:nth-child(9)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            skillCity: $html.find(".list td:nth-child(10)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            onHoliday: $html.find(".list td:nth-child(11)").map(function (i, e) { return !!$(e).find(".in-holiday").length; }).get() as any as boolean[],
            efficiency: $html.find(".list td:nth-child(11)").map(function (i, e) { return $(e).text().trim(); }).get() as any as string[]
        };
    }
    else if (page === "promotion") {
        //mapped[url] = {
        //    id: $html.find(".grid tr[onmouseover] a").map(function (i, e) { return numberfy($(e).attr("href").match(/\d+/)[0]); }).get(),
        //    buyers: $html.find(".grid .nowrap:nth-child(8)").map(function (i, e) { return numberfy($(e).text()); }).get(),
        //    delta: $html.find(".grid .nowrap:nth-child(8)").map(function (i, e) { return numberfy($(e).text().split("(")[1]); }).get()
        //}
    }
    else if (page === "machines") {
        $mapped[url] = {
            id: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            subid: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).attr("id").split("_")[1]); }).get() as any as number[],
            type: $html.find(".list td[class]:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[2]; }).get()as any as string[],
            num: $html.find(".list td[class]:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            perc: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            black: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text().split("(")[1]); }).get() as any as number[],
            red: $html.find("td:nth-child(8)").map(function (i, e) { return numberfy($(e).text().split("+")[1]); }).get() as any as number[],
            quality: $html.find("td:nth-child(6).nowrap").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            required: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[]
        }
    }
    else if (page === "animals") {
        $mapped[url] = {
            id: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[],
            subid: $html.find(":checkbox[name]").map(function (i, e) { return numberfy($(e).attr("id").split("_")[1]); }).get() as any as number[],
            type: $html.find(".list td[class]:nth-child(3)").map(function (i, e) { return $(e).attr("class").split("-")[2]; }).get() as any as string[],
            num: $html.find(".list td[class]:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            perc: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[],
            black: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text().split("(")[1]); }).get() as any as number[],
            red: $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text().split("+")[1]); }).get() as any as number[]
        }
    }

    return true;
}

function time() {
    // обновляет время на странице в логе выполнения

    let time = new Date().getTime();
    let minutes = (time - processingtime) / 1000 / 60;
    $("#XioMinutes").text(Math.floor(minutes));
    $("#XioSeconds").text(Math.round((minutes - Math.floor(minutes)) * 60));
}

function postMessage0(html: string) {
    // НЕ называть postMessage ибо конфликтует со штатными функциями

    $("#XMproblem").append("<div>" + html + "</div>");
}

function xGet(url: string, page: string, force: boolean, callback: IAction0) {
    // запрашивает урл если он не запрашивался еще. либо если указан флаг форсировки
    // При успехе, обновляет время, увеличивает счетчик запросов, маппит урл, выполняет коллбэк и вызывает урлДан.
    // при ошибке перезапрашивает через 3 секунды

    if (getUrls.indexOf(url) < 0 || force) {

        if (getUrls.indexOf(url) < 0)
            getUrls.push(url);

        $.ajax({
            url: url,
            type: "GET",

            success: function (html, status, xhr) {
                time();
                servergetcount++;
                $("#XioGetCalls").text(servergetcount);
                $("#XioServerCalls").text(servergetcount + serverpostcount);
                map(html, url, page);
                callback();
                xUrlDone(url);
            },

            error: function (this: any, xhr:any, status:any, error:any) {
                time();
                servergetcount++;
                $("#XioGetCalls").text(servergetcount);
                $("#XioServerCalls").text(servergetcount + serverpostcount);
                //Resend ajax
                var _this = this;
                setTimeout(function () {
                    $.ajax(_this);
                }, 3000);
            }
        });
    }
    else {
        xcallback.push([url, () => callback()]); // тут видимо this сохраняется. просто функцию вкатить будет ошибкой
    }
}

function xPost(url: string, form: any, callback: IAction1<any>) {
    // отправляет данные на сервек.  Если успех то выполняет колбэк. иначе переотправляет через 3 секунды

    $.ajax({
        url: url,
        data: form,
        type: "POST",

        success: function (html, status, xhr) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            callback(html);
        },

        error: function (this:any, xhr:any, status:any, error:any) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            //Resend ajax
            let _this = this;
            setTimeout(function () {
                $.ajax(_this);
            }, 3000);
        }
    });
}

function xContract(url: string, data:any, callback: IAction1<any>) {
    // тоже самое что xPost тока формат данных другой. 

    $.ajax({
        url: url,
        data: data,
        type: "POST",
        dataType: "JSON",

        success: function (data, status, xhr) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            callback(data);
        },

        error: function (this: any, xhr: any, status: any, error: any) {
            time();
            serverpostcount++;
            $("#XioPostCalls").text(serverpostcount);
            $("#XioServerCalls").text(servergetcount + serverpostcount);
            //Resend ajax
            var _this = this;
            setTimeout(function () {
                $.ajax(_this);
            }, 3000);
        }
    });
}

function xUrlDone(url: string) {
    // добавляет ссылку в список, затем находит для нее коллбэк и выполняет его. удаляет колбэк для функции.

    finUrls.push(url);
    for (var i = 0; i < xcallback.length; i++) {
        if (finUrls.indexOf(xcallback[i][0]) >= 0) {
            xcallback[i][1]();
            xcallback.splice(i, 1);
            i--;
        }
    }
}

function xTypeDone(policyName: string) {
    // если политика отработана полностью по всем юнитам, то помещает policy.name в typedone[]

    // находим группу для указанного типа операции Для "priceRetail" group == Price
    let group = "";
    for (let key in policyJSON) {
        if (policyJSON[key].name === policyName) {
            group = policyJSON[key].group;
            break;
        }
    }
    if (group === "")
        throw new Error(`не нашли группу для policyName:${policyName}`);

    // Все имена политик с такой же группой выпишем в массив
    let typeArray: string[] = [];
    for (let key in policyJSON) {
        let policy = policyJSON[key];
        if (policy.group === group && typeArray.indexOf(policy.name) < 0)
            typeArray.push(policy.name);
    }

    xcount[policyName]--;     // хз чего это

    let groupcount = 0;
    let maxcount = 0;
    for (let i = 0; i < typeArray.length; i++) {
        groupcount += xcount[typeArray[i]];
        maxcount += xmax[typeArray[i]];
    }

    // похоже обновляем текст в окне лога исполнения
    $("[id='x" + group + "']").text(maxcount - groupcount);
    if (!xcount[policyName]) {
        if (!groupcount) {
            $("[id='x" + group + "done']").text("Done!");
            $("[id='x" + group + "current']").text("");
        }
        typedone.push(policyName);

        for (let i = 0; i < xwait.length; i++) {
            let index = xwait[i][0].indexOf(policyName);
            if (index >= 0) {
                xwait[i][0].splice(index, 1);
                if (xwait[i][0].length === 0) {
                    xwait[i][1]();
                    xwait.splice(i, 1);
                    i--;
                }
            }
        }
    }

    var sum = 0;
    for (var key in xcount)
        sum += xcount[key];

    // походу когда все исполнилось включает кнопки скрипта
    if (sum === 0 && $("#xDone").css("visibility") === "hidden") {
        $("#xDone").css("visibility", "");
        logDebug("mapped: ", $mapped);        // валит все отпарсенные ссылки за время обработки
        $(".XioGo").prop("disabled", false);
        clearInterval(timeinterval);
    }
}

function xsupGo(subid?: number, type?: string) {
    // без понятия че тут делает эта херь

    if (subid)
        xsupcheck[subid] = false;

    if (type)
        xsupcheck[type] = false;

    for (var i = 0; i < xsup.length; i++) {
        if (!xsupcheck[xsup[i][0]] && !xsupcheck[xsup[i][1]]) {
            xsupcheck[xsup[i][0]] = true;
            xsupcheck[xsup[i][1]] = true;
            xsup.splice(i, 1)[0][2]();
            i--;
        }
    }
}


function XioMaintenance(subids:number[], policyGroups:string[]) {

    console.log("XM!");
    logDebug("subids: ", subids);
    logDebug("policyGroups: ", policyGroups);

    processingtime = new Date().getTime();
    timeinterval = setInterval(time, 1000);

    // дизаблим кнопки убираем старые логи
    $(".XioGo").prop("disabled", true);
    $(".XioProperty").remove();

    // апдейтим глобальные переменные
    getUrls = [];
    finUrls = [];
    xcallback = [];
    xcount = {};
    xmax = {};
    $mapped = {};
    servergetcount = 0;
    serverpostcount = 0;
    suppliercount = 0;
    blackmail = [];
    equipfilter = [];

    logDebug("mapped: ", $mapped);

    if (!subids || subids.length === 0)
        subids = parseAllSavedSubid($realm);

    if (!policyGroups || policyGroups.length === 0) {
        policyGroups = [];
        for (var key in policyJSON)
            policyGroups.push(policyJSON[key].group);
    }

    // шляпа что рисуется сверху и показывает результаты
    let tablestring = ""
        + "<div id=XMtabletitle class=XioProperty style='font-size: 24px; color:gold; margin-bottom: 5px; margin-top: 15px;'>XS 12 Maintenance Log</div>"
        + "<table id=XMtable class=XioProperty style='font-size: 18px; color:gold; border-spacing: 10px 0; margin-bottom: 18px'>"
        + "<tr id=XSplit></tr>"
        + "<tr>"
        + "<td>New suppliers: </td>"
        + "<td id=XioSuppliers>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Get calls: </td>"
        + "<td id=XioGetCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Post calls: </td>"
        + "<td id=XioPostCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Total server calls: </td>"
        + "<td id=XioServerCalls>0</td>"
        + "</tr>"
        + "<tr>"
        + "<td>Time: </td>"
        + "<td id=XioMinutes>0</td>"
        + "<td>min</td>"
        + "<td id=XioSeconds>0</td>"
        + "<td>sec</td>"
        + "</tr>"
        + "<tr>"
        + "<td id=xDone colspan=4 style='visibility: hidden; color: lightgoldenrodyellow'>All Done!</td>"
        + "</tr>"
        + "</table>"
        + "<div id=XMproblem class=XioProperty style='font-size: 18px; color:gold;'></div>";

    $("div.metro_header").append(tablestring);

    // вообще без понятия что это за херня, но походу парсит главную страницу юнитов.
    // походу убираем фильтры по типам, ставим 20000 страниц и тока потом чето парсим
    urlUnitlist = "/" + $realm + "/main/company/view/" + companyid + "/unit_list";
    let filtersetting = $(".u-s").attr("href") || "/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithProduction/class=0/size=0/type=" + $(".unittype").val();
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithProduction/20000", "none", false, function () {
        xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithProduction/class=0/type=0", "none", false, function () {
            xGet(urlUnitlist, "unitlist", false, function () {
                xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithProduction/400", "none", false, function () {
                    xGet(filtersetting, "none", false, function () {
                        further(($mapped[urlUnitlist] as IUnitList).subids);
                    });
                });
            });
        })
    });

    function further(realsubids: number[]) {

        let startedPolicies: string[] = [];
        let xgroup: IDictionary<number> = {};

        // TODO: с этим надо чет сделать. кнопку какую чтобы чистило тока по кнопке. а то косячит и удаляет само если подвисло чего
        for (var i = 0; i < subids.length; i++) {
            // если в базе запись про юнита есть, а он не спарсился со страницы, удалить запись о нем.
            if (realsubids.indexOf(subids[i]) < 0) {
                let urlSubid = "/" + $realm + "/main/unit/view/" + subids[i];
                postMessage0("Subdivision <a href=" + urlSubid + ">" + subids[i] + "</a> is missing from the company. Options have been erased from the Local Storage.");
                removeOptions($realm, [subids[i]]);
                continue;
            }

            // загружаем политики юнита. часть отработаем сразу, часть пихаем в кэш и отработаем когда wait позволит уже
            let loaded = loadOptions($realm, subids[i]);
            for (var policyKey in loaded) {
                let policy = policyJSON[policyKey];
                if (policy == null || policyGroups.indexOf(policy.group) < 0)
                    continue;

                if (startedPolicies.indexOf(policy.name) < 0)
                    startedPolicies.push(policy.name)
                
                // такой хитровыебанный способ просто увеличить счетчик или инициализировать. 
                xmax[policy.name] = ++xmax[policy.name] || 1;
                xcount[policy.name] = ++xcount[policy.name] || 1;
                xgroup[policy.group] = ++xgroup[policy.group] || 1;
                policy.wait.slice()
                // если данная политика не нуждается в ожидании других, фигачим на выполнение сразу
                if (policy.wait.length === 0) {
                    policy.func(policy.name, subids[i], loaded[policyKey].choices);
                }
                else {
                    // хитрожопый способ привязать скоуп
                    let f = (): IAction0 => {
                        let _policy = policy;
                        let _options = loaded[policyKey];
                        let _subid = subids[i];
                        return () => policy.func(_policy.name, _subid, _options.choices); // TODO: возможно тут надо еще this вязать
                    }
                    xwait.push([ policy.wait.slice(), f()]);
                }
            }
        }

        for (var key in policyJSON) {
            let name = policyJSON[key].name;
            if (startedPolicies.indexOf(name) < 0) {
                xcount[name] = 1;
                xmax[name] = 0;
                xTypeDone(name);
            }
        }

        // рисует шляпу по обрабатываемым политикам на странице
        var displayedPolicies: string[] = [];
        for (var key in policyJSON) {
            let name = policyJSON[key].name;
            let group = policyJSON[key].group;
            if (startedPolicies.indexOf(name) >= 0 && displayedPolicies.indexOf(group) < 0) {
                displayedPolicies.push(group);
                $("#XSplit").before("<tr>"
                    + "<td>" + group + "</td>"
                    + "<td id='x" + group + "'>0</td>"
                    + "<td>of</td>"
                    + "<td>" + xgroup[group] + "</td>"
                    + "<td id='x" + group + "done' style='color: lightgoldenrodyellow'></td>"
                    + "<td id='x" + group + "current' style='color: lightgoldenrodyellow'></td>"
                    + "</tr>"
                );
            }
        }
    }

    logDebug("XM finished: ", $mapped);
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
                logDebug("links: ", links);

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

            logDebug(`${subid} policies:${policies.join(", ")}`);
            let loaded = loadOptions($realm, subid); // {} если пусто
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

            storeOptions($realm, subid, loaded);
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
    $(".XioProperty").remove();
    $("div.metro_header").append(`<br class=XioProperty>
                                  <textarea id=XEarea class=XioProperty style='width: 900px'></textarea>`);

    var string = "";
    var rx = new RegExp("x" + $realm + "\\d+");
    for (var key in localStorage) {
        if (rx.test(key))
            string += key.substring(1) + "=" + localStorage[key] + ",";
    }

    $("#XEarea").text(string).height($("#XEarea")[0].scrollHeight);
}

function XioImport() {
    $(".XioProperty").remove();
    $("div.metro_header").append(`<br class=XioProperty>
                                  <textarea id=XIarea class=XioProperty style='width: 900px'></textarea>
                                  <br class=XioProperty>
                                  <input type=button id=XioSave class=XioProperty value=Save!>`);
    // TODO: импорт не работает. хз почему.
    $(document).on('input propertychange', "#XIarea", function () {
        $("#XIarea").height($("#XIarea")[0].scrollHeight);
    });

    // TODO: данную херь переписать. сделать через штатные способы записи опций
    $("#XioSave").click(function () {
        var string = $("#XIarea").val();
        string = string.replace(/=/g, "']='").replace(/,/g, "';localStorage['x");
        try {
            eval("localStorage['x" + string.slice(0, -15));
            document.location.reload();
        }
        catch (e) {
            console.log("import not successful");
        }
    });
};

function XioHoliday() {
    // выводит на страницу с юнитами инфу по эффективности рабов. берет со страницы управление - персонал.

    var url = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/employee/salary";

    var getcount = 2;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithHoliday/20000", "none", false, function () {
        !--getcount && phase();
    });

    let m = $('table.unit-top > tbody > tr > td > a.u-s').first().attr('href').match(/\/class=(\d+)\//);
    var nvClass = m == null ? 0 : numberfy(m[1]);
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithHoliday/class=" + nvClass + "/type=0", "none", false, function () {
        !--getcount && phase();
    });

    function phase() {
        xGet(url, "employees", false, function () {
            logDebug("XioHoliday: ", $mapped);
            let employees = $mapped[url] as IEmployees;
            // TODO: общую ффункцию запилить для парсинга и везде вставить!
            let subids = $(".unit-list-2014 td:nth-child(1)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
            var $tds = $(".unit-list-2014 tr:gt(0) td:nth-child(2)");

            // проставляет эффективность рабочих на страницу юнитов
            for (var i = 0; i < employees.id.length; i++) {
                var index = subids.indexOf(employees.id[i]);
                if (index < 0)
                    continue;

                var eff = employees.efficiency[i];

                var text = eff === "" ? "Holiday" : eff;
                var color = text === "Holiday" ? "blue" : eff === "100.00 %" ? "green" : "red";
                $tds.eq(index).append("<br><span style='color:" + color + ";'>" + text + "</span>");
            }
        });
    }
}

function XioOverview() {
    // TODO: переписать построение селектов и их инициализацию

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
    let subids = parseSubid(unitRows.get() as HTMLTableRowElement[]);
    let $td = unitRows.find("td.alerts");
    for (var i = 0; i < subids.length; i++) {
        let subid = subids[i];

        // словарь поможет быстро найти нужную политику для группы
        let unitOptions = loadOptions($realm, subid); // {} если не нашли опции
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
            let subid = numberfy(container.attr("unit-id"));

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

function topManagerStats() {
    // убрал содержимое, нафиг не нужно

    let fName = arguments.callee.toString();
    logDebug("отключена: ", fName);
}

function preference(policies: string[]) : boolean {
    // когда мы находимся внутри юнита, загружает и отображает policies, то есть тока то что задано.

    // не задали ничего для простановки, и не будем ничо делать
    if (policies.length === 0)
        return false;

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
    let parsedDict = loadOptions($realm, subid);
    for (var i = 0; i < policies.length; i++) {
        let policyKey = policies[i];
        let policy = policyJSON[policyKey];

        let containerKey = subid + "-" + policyKey;
        let container = $topblock.find(`td#${containerKey}`);
        if (container.length === 0)
            throw new Error("неведомая хуйня но не нашли контейнер для политики");

        // если для данной политики нет опций - не делаем ничо.
        if (parsedDict[policyKey] != null)
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
            let subid = numberfy(container.attr("unit-id"));

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

function preferencePages(html: JQuery, url: string): string[] {
    // по урлу страницы возвращает policyKey который к ней относится
    // TODO: можно оптимизировать запросы к дом.


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


function XioScript() : boolean {
    // стартовая функция
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