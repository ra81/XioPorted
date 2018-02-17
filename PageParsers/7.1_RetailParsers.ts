
// названия инноваций
let InnovationNames = {
    Parking: "Автомобильная парковка",
    PRAgent: "Партнёрский договор с рекламным агентством"
};

interface IRetailStock extends IStock {
    sold: number;
    deliver: number;
    ordered: number;
}


interface IMainShop {
    place: string;  // район расположения
    rent: number;
    departments: number;    // число отделов

    employees: IUnitEmployees;

    visitors: number;
    service: ServiceLevels;

    haveParking: boolean;
    havePR: boolean;
}
function shopMain($html: JQuery, base: IMainBase): IMainShop {
    let $info = $html.find("table.infoblock"); // Район города  Расходы на аренду

    // общая инфа
    let place = $info.find("td.title:contains(Район города)").next("td").text().split(/\s+/)[0].trim();
    let rent = numberfyOrError($info.find("td.title:contains(Расходы на аренду)").next("td").text());
    let depts = numberfyOrError($info.find("td.title:contains(Количество отделов)").next("td").text(), -1);

    // число рабов и требования
    let str = $info.find("td.title:contains(Количество сотрудников)").next("td").text();
    let employees = numberfyOrError(str.split("(")[0], -1);     //0 может быть но всегда есть число
    let employeesReq = numberfyOrError(str.split("~")[1], -1);

    str = $info.find("td.title:contains(Эффективность персонала)").next("td").text();
    let inHoliday = $info.find("img[src='/img/icon/holiday.gif']").length > 0;
    let employeesEff = inHoliday ? 0 : numberfyOrError(str, -1);

    // число посов может вообще отсутствовать как и сервис
    let visitors = 0;
    let service: ServiceLevels = ServiceLevels.none;

    let $td = $info.find("td.title:contains(Количество посетителей)").next("td");
    if ($td.length > 0) {
        visitors = numberfyOrError($td.text(), -1);

        let $hint = $td.closest("tr").next("tr").find("div.productivity_hint div.title");
        if ($hint.length <= 0)
            throw new Error("не нашли уровень сервиса");

        service = serviceFromStrOrError($hint.text());
    }

    return {
        place: place,
        rent: rent,
        departments: depts,
        employees: { employees: employees, required: employeesReq, efficiency: employeesEff, holidays: inHoliday },
        service: service,
        visitors: visitors,
        haveParking: isOneOf(InnovationNames.Parking, base.innovations),
        havePR: isOneOf(InnovationNames.PRAgent, base.innovations)
    };
}


interface IMainFuel {
    rent: number;

    employees: IUnitEmployees;
    equipment: IUnitEquipment;

    visitors: number;
    service: ServiceLevels;
}
function fuelMain($html: JQuery): IMainFuel {
    let $info = $html.find("table.infoblock"); // Район города  Расходы на аренду

    // общая инфа
    let rent = numberfyOrError($info.find("td.title:contains(Расходы на аренду)").next("td").text());

    // число рабов и требования
    let str = $info.find("td.title:contains(Количество сотрудников)").next("td").text();
    let employees = numberfyOrError(str.split("(")[0], -1);     //0 может быть но всегда есть число
    let employeesReq = numberfyOrError(str.split("требуется")[1], -1);

    str = $info.find("td.title:contains(Эффективность персонала)").next("td").text();
    let inHoliday = $info.find("img[src='/img/icon/holiday.gif']").length > 0;
    let employeesEff = inHoliday ? 0 : numberfyOrError(str, -1);

    // число посов может вообще отсутствовать как и сервис
    let visitors = 0;
    let service: ServiceLevels = ServiceLevels.none;

    let $td = $info.find("td.title:contains(Количество посетителей)").next("td");
    if ($td.length > 0)
        visitors = numberfyOrError($td.text(), -1);

    $td = $info.find("td.title:contains(Уровень сервиса)").next("td");
    if ($td.length > 0)
        service = serviceFromStrOrError($td.text());

    return {
        employees: { employees: employees, required: employeesReq, efficiency: employeesEff, holidays: inHoliday },
        rent: rent,
        visitors: visitors,
        service: service,
        equipment: equipment()
    };

    function equipment(): IUnitEquipment {

        let $info = $html.find("table.infoblock"); // Район города  Расходы на аренду

        // Количество оборудования
        let str = $info.find("td.title:contains(Количество оборудования)").next("td").text();
        let n = extractIntPositive(str);
        if (n == null || n.length < 2)
            throw new Error("не нашли оборудование");

        let equipment = n[0];
        let equipmentMax = n.length > 1 ? n[1] : 0;

        // если оборудования нет, то ничего не будет кроме числа 0
        if (equipment === 0)
            return {
                equipment: equipment,
                equipmentMax: equipmentMax,
                quality: 0,
                qualityRequired: 0,
                brokenPct: 0,
                brokenBlack: 0,
                brokenRed: 0,
                efficiency: 0
            }

        // Качество оборудования
        // 8.40 (требуется по технологии 1.00)
        // или просто 8.40 если нет требований
        str = $info.find("td.title:contains(Качество оборудования)").next("td").text();
        n = extractFloatPositive(str);
        if (n == null)
            throw new Error("не нашли кач оборудование");

        let quality = n[0];
        let qualityReq = n.length > 1 ? n[1] : 0;

        // Износ оборудования
        // красный и черный и % износа
        // 1.28 % (25+1 ед.)
        // 0.00 % (0 ед.)
        str = $info.find("td.title:contains(Износ оборудования)").next("td").text();
        let items = str.split("%");
        let brokenPct = numberfyOrError(items[0], -1);
        n = extractIntPositive(items[1]);
        if (n == null)
            throw new Error("не нашли износ оборудования");

        let brokenBlack = n[0];     // черный есть всегда 
        let brokenRed = n.length > 1 ? n[1] : 0;  // красный не всегда

        // Эффективность оборудования
        str = $info.find("td.title:contains(Эффективность оборудования)").next("td").text();
        let equipEff = numberfyOrError(str, -1);

        return {
            equipment: equipment,
            equipmentMax: equipmentMax,
            quality: quality,
            qualityRequired: qualityReq,
            brokenPct: brokenPct,
            brokenBlack: brokenBlack,
            brokenRed: brokenRed,
            efficiency: equipEff
        }
    }
}


interface ITradeHallItem {
    product: IProduct;
    stock: IRetailStock;

    reportUrl: string;
    historyUrl: string;

    dontSale: boolean;  // флаг говорящий что товар НЕ продается
    name: string;    // это name аттрибут текстбокса с ценой, чтобы удобно обновлять цены запросом
    share: number;
    price: number;  // текущая цена продажи
    city: IProductProperties;
}
/**
 * \/.*\/main\/unit\/view\/[0-9]+\/trading_hall$
   сначала заполнение склада, потом товары
 * @param html
 * @param url
 */
function parseUnitTradeHall(html: any, url: string): [number, ITradeHallItem[]] {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.list")
            : $html.find("table.list");

        let str = oneOrError($tbl, "div:first").text().trim();
        let filling = numberfyOrError(str, -1);

        let $rows = closestByTagName($html.find("a.popup"), "tr");
        let thItems: ITradeHallItem[] = [];
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            let cityRepUrl = oneOrError($tds.eq(2), "a").attr("href");
            let historyUrl = oneOrError($r, "a.popup").attr("href");

            // продукт
            // картинка может быть просто от /products/ так и ТМ /products/brand/ типа
            let img = oneOrError($tds.eq(2), "img").attr("src");

            let nums = extractIntPositive(cityRepUrl);
            if (nums == null)
                throw new Error("не получилось извлечь id продукта из ссылки " + cityRepUrl);

            let prodID = nums[0];
            let prodName = $tds.eq(2).attr("title").split("(")[0].trim();

            let product: IProduct = { id: prodID, img: img, name: prodName };

            // склад. может быть -- вместо цены, кач, бренд так что -1 допускается
            let stock: IRetailStock = {
                available: numberfyOrError($tds.eq(5).text(), -1), // 0 или больше всегда должно быть,
                deliver: numberfyOrError($tds.eq(4).text().split("[")[1], -1),
                sold: numberfyOrError(oneOrError($tds.eq(3), "a.popup").text(), -1),
                ordered: numberfyOrError(oneOrError($tds.eq(4), "a").text(), -1),
                product: {
                    price: numberfy($tds.eq(8).text()),
                    quality: numberfy($tds.eq(6).text()),
                    brand: numberfy($tds.eq(7).text())
                }
            };

            // прочее "productData[price][{37181683}]" а не то что вы подумали
            let $input = oneOrError($tds.eq(9), "input");
            let name = $input.attr("name");
            let currentPrice = numberfyOrError($input.val(), -1);
            let dontSale = $tds.eq(9).find("span").text().indexOf("продавать") >= 0;


            // среднегородские цены
            let share = numberfyOrError($tds.eq(10).text(), -1)
            let city: IProductProperties = {
                price: numberfyOrError($tds.eq(11).text()),
                quality: numberfyOrError($tds.eq(12).text()),
                brand: numberfyOrError($tds.eq(13).text(), -1)
            };

            thItems.push({
                product: product,
                stock: stock,
                price: currentPrice,
                city: city,
                share: share,
                historyUrl: historyUrl,
                reportUrl: cityRepUrl,
                name: name,
                dontSale: dontSale
            });
        });

        return [filling, thItems];
    }
    catch (err) {
        throw err;
    }
}

interface IRetailReport {
    marketsize: number;
    localprice: number;
    localquality: number;
    cityprice: number;
    cityquality: number;
}
interface ITradeHall {
    stock: number[];
    deliver: number[];
    reportUrl: string[];
    report: IRetailReport[];
    img: string[];
    quality: number[];
    purch: number[];
    price: number[];
    name: string[];
    share: number[];
    cityprice: number[];
    cityquality: number[];
    historyUrl: string[];
    history: (IPriceHistoryItem[])[];
}
function parseTradeHallOld(html: any, url: string): ITradeHall {
    let $html = $(html);

    try {
        let _history = $html.find("a.popup").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[];
        let _report = $html.find(".grid a:has(img):not(:has(img[alt]))").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[];
        let _img = $html.find(".grid a img:not([alt])").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[];

        // "productData[price][{37181683}]" а не то что вы подумали
        let _name = $html.find(":text").map((i, e) => {
            let nm = $(e).attr("name").trim();
            if (nm.length === 0)
                throw new Error("product name not found");

            return nm;
        }).get() as any as string[];
        let _stock = $html.find(".nowrap:nth-child(6)").map((i, e) => {
            return numberfy($(e).text());
        }).get() as any as number[];
        let _deliver = $html.find(".nowrap:nth-child(5)").map(function (i, e) { return numberfy($(e).text().split("[")[1]); }).get() as any as number[];
        let _quality = $html.find("td:nth-child(7)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _purch = $html.find("td:nth-child(9)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _price = $html.find(":text").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];
        let _share = $html.find(".nowrap:nth-child(11)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _cityprice = $html.find("td:nth-child(12)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _cityquality = $html.find("td:nth-child(13)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];

        if (_history.length !== _share.length)
            throw new Error("что то пошло не так. Количество данных различается");

        return {
            historyUrl: _history,
            reportUrl: _report,
            history: [],
            report: [],
            img: _img,
            name: _name,
            stock: _stock,
            deliver: _deliver,
            quality: _quality,
            purch: _purch,
            price: _price,
            share: _share,
            cityprice: _cityprice,
            cityquality: _cityquality
        };
    }
    catch (err) {
        throw new ParseError("trading hall", url, err);
    }
}


interface IStoreSupply {
    parcel: number[];
    price_mark_up: number[];
    price_constraint_max: number[];
    price_constraint_type: string[];
    quality_constraint_min: number[];

    deliver: number[];
    stock: number[];
    sold: number[];

    offer: number[];
    price: number[];
    reprice: boolean[];
    quality: number[];
    available: number[];

    img: string[];
}
/**
 * Снабжение магазина
 * @param html
 * @param url
 */
function parseRetailSupply(html: any, url: string): IStoreSupply {
    let $html = $(html);

    try {
        //  по идее на 1 товар может быть несколько поставщиков и следовательно парселов будет много а стока мало
        // парсить оно будет, но потом где при обработке данных будет жаловаться и не отработает

        // ячейка для ввода количества штук 
        let _parcel = $html.find("input:text[name^='supplyContractData[party_quantity]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];

        // тип ограничения заказа абс или процент
        let _price_constraint_type = $html.find("select[name^='supplyContractData[constraintPriceType]']").map(function (i, e) { return $(e).val(); }).get() as any as string[];
        // если задан процент то будет номер опции селекта. иначе 0
        let _price_mark_up = $html.find("select[name^='supplyContractData[price_mark_up]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];
        // макс ограничение по цене если задан абс вариант ограничения. будет 0 если в процентах
        let _price_constraint_max = $html.find("input[name^='supplyContractData[price_constraint_max]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];
        let _quality_constraint_min = $html.find("input[name^='supplyContractData[quality_constraint_min]']").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];

        let _deliver = $html.find("td.nowrap:nth-child(4)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _stock = $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _sold = $html.find("td:nth-child(2) table:nth-child(1) tr:nth-child(5) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];

        // чекбокс данного поставщика
        let _offer = $html.find(".destroy").map(function (i, e) { return numberfy($(e).val()); }).get() as any as number[];
        let _price = $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        // есть ли изменение цены
        let _reprice = $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(1) td:nth-child(2)").map((i, e) => {
            return !!$(e).find("div").length;
        }).get() as any as boolean[];
        let _quality = $html.find("td:nth-child(9) table:nth-child(1) tr:nth-child(2) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _available = $html.find("td:nth-child(10) table:nth-child(1) tr:nth-child(3) td:nth-child(2)").map(function (i, e) { return numberfy($(e).text()); }).get() as any as number[];
        let _img = $html.find(".noborder td > img").map(function (i, e) { return $(e).attr("src"); }).get() as any as string[];

        return {
            parcel: _parcel,
            price_constraint_type: _price_constraint_type,
            price_mark_up: _price_mark_up,
            price_constraint_max: _price_constraint_max,
            quality_constraint_min: _quality_constraint_min,

            deliver: _deliver,
            stock: _stock,
            sold: _sold,

            offer: _offer,
            price: _price,
            reprice: _reprice,
            quality: _quality,
            available: _available,

            img: _img
        };
    }
    catch (err) {
        throw new ParseError("store supply", url, err);
    }
}
function parseRetailSupplyNew(html: any, url: string): [IProduct, IRetailStock, IBuyContract[]][] {
    let $html = $(html);

    try {
        // для 1 товара может быть несколько поставщиков, поэтому к 1 продукту будет идти массив контрактов
        let $rows = $html.find("tr.product_row");
        let res: [IProduct, IRetailStock, IBuyContract[]][] = [];
        $rows.each((i, el) => {
            let $r = $(el);     // это основной ряд, но если контрактов несколько то будут еще субряды
            let $subs = $r.nextUntil("tr.product_row", "tr.sub_row");

            // собираем продукт
            let id = (() => {
                let items = ($r.prop("id") as string).split("_");  // product_row_422200-0
                items = items[2].split("-");                        // 422200-0
                let res = numberfyOrError(items[0]);

                return res;
            })();
            let img = oneOrError($r, "th img:eq(0)").attr("src");
            let product: IProduct = { id: id, img: img, name: "" };

            // для ТМ учитываем факт ТМности
            let tmImg = isTM(product) ? img : "";

            // собираем текущее состояние склада
            let stock = $r.children("td").eq(0).map((i, el): IRetailStock => {
                let $td = $(el);

                // если склад пуст, то количество будет 0, продано 0, а остальные показатели будут прочерки, то есть спарсит -1
                let quantity = numberfy($td.find("td:contains('Количество')").next("td").text());
                let price = numberfy($td.find("td:contains('Себестоимость')").next("td").text());
                let quality = numberfy($td.find("td:contains('Качество')").next("td").text());
                let brand = numberfy($td.find("td:contains('Бренд')").next("td").text());

                let sold = numberfyOrError($td.find("td:contains('Продано')").next("td").text(), -1);
                let deliver = numberfyOrError($td.next("td").next("td").text(), -1);
                let ordered = numberfyOrError($td.next("td").text(), -1);

                return {
                    available: quantity,
                    sold: sold,
                    deliver: deliver,
                    ordered: ordered,
                    product: { price: price, quality: quality, brand: brand }
                };
            }).get(0) as any as IRetailStock;

            // собираем контракты
            let contracts = $r.add($subs).map((i, el): IBuyContract => {
                let $r = $(el);

                // контракт, имя юнита и его айди
                //
                let offerID = numberfyOrError(oneOrError($r, "input.destroy").val());

                let $td = oneOrError($r, `td[id^=name_${product.id}]`);
                let url = oneOrError($td, "a[href*='/unit/']").attr("href");
                let numbers = extractIntPositive(url);
                if (!numbers || numbers.length !== 1)
                    throw new Error("не смог взять subid юнита из ссылки " + url);

                let subid = numbers[0];

                // если имя юнита короткое, оно сразу в <a> теге, иначе добавляется внутрь span с титлом
                // так же дело обстоит и с компанией
                let $a = oneOrError($td, "a[href*='/unit/']");
                let $span = $a.find("span");
                let unitName = $span.length ? $span.attr("title") : $a.text();
                if (unitName.length <= 0)
                    throw new Error(`имя поставщика юнит ${subid} не спарсилось`);

                // для чужих магов имя идет линком, а для своих выделено strong тегом
                let self = false;
                let companyName = "";
                $a = $td.find("a[href*='/company/']");
                if ($a.length === 1) {
                    $span = $a.find("span");
                    companyName = $span.length ? $span.attr("title") : $a.text();
                }
                else if ($a.length > 1)
                    throw new Error(`нашли ${$a.length} ссылок на компанию вместо 1`);
                else {
                    companyName = oneOrError($td, "strong").text();
                    self = true;
                }


                // ограничения контракта и заказ
                // 
                $td = oneOrError($r, `td[id^=quantityField_${product.id}]`);
                let ordered = numberfyOrError(oneOrError($td, "input").val(), -1);

                // ограничение по количеству
                let maxLimit = 0;
                $span = $td.find("span");
                if ($span.length) {
                    let n = extractIntPositive($span.text());
                    if (!n || !n[0])
                        throw new Error(`не смог извлеч ограничение по объему закупки из ячейки ${$td.html()}`);

                    maxLimit = n[0];
                }

                $td = oneOrError($r, `td[id^=constraint_${product.id}]`);
                let ctype: ConstraintTypes;
                let val = oneOrError($td, "select.contractConstraintPriceType").val() as string;
                switch (val) {
                    case "Rel":
                        ctype = ConstraintTypes.Rel;
                        break;

                    case "Abs":
                        ctype = ConstraintTypes.Abs;
                        break;

                    default:
                        throw new Error("неизвестный тип ограничения контракта " + val);
                }

                // должно быть 0 или больше
                let maxPrice = numberfyOrError(oneOrError($td, "input.contractConstraintPriceAbs").val(), -1);
                let relPriceMarkUp = numberfyOrError(oneOrError($td, "select.contractConstraintPriceRel").val(), -1);
                let $minQ = oneOrError($td, "input[name^='supplyContractData[quality_constraint_min]']");
                let cminQ = numberfyOrError($minQ.val(), -1);

                // разовый контракт
                let $nextdiv = $minQ.next("div");
                if ($nextdiv.length > 1)
                    throw new Error(`Найдено несколько потенциальных div под обозначение Разового контракта ${offerID}:${companyName} товара ${img}`);
                else if ($nextdiv.length == 1 && $nextdiv.text().trim().indexOf("Разовая") < 0)
                    throw new Error(`Проверка div под обозначение Разового контракта ${offerID}:${companyName} товара ${img} провалилась.`);

                let instant = $nextdiv.length > 0;

                // характеристики его товара
                //
                $td = oneOrError($r, `td[id^=totalPrice_${product.id}]`);

                // цена кач бренд могут быть пустыми если товара у поставщика нет
                let str = oneOrError($td, "td:contains('Цена')").next("td").text();
                let n = extractFloatPositive(str);
                if (n == null)
                    throw new Error("не найдена цена продажи у " + companyName);
                // если поставщик поднял цену, тогда новая цена будет второй и по факту это цена контракта.
                // нельзя заключать контракт по старой цене уже. и при обновлении поставок надо ориентироваться на новую цену
                let price = n.length > 1 ? n[1] : n[0];
                //let price = numberfy($td.find("td:contains('Цена')").next("td").text());
                let quality = numberfy($td.find("td:contains('Качество')").next("td").text());
                let brand = numberfy($td.find("td:contains('Бренд')").next("td").text());


                // состояние склада поставщика
                //
                // все цифры должны быть 0 или больше
                let purchased = numberfyOrError(oneOrError($r, `td[id^="dispatch_quantity_${product.id}"]`).text(), -1);
                let total = numberfyOrError(oneOrError($r, `td[id^="quantity_${product.id}"]`).text(), -1);
                let available = numberfyOrError(oneOrError($r, `td[id^="free_${product.id}"]`).text(), -1);

                return {
                    offer: {
                        id: offerID,
                        unit: { subid: subid, type: UnitTypes.unknown, typeStr: "unknown", name: unitName, size: 0, city: "" },
                        maxLimit: maxLimit > 0 ? maxLimit : null,
                        origPrice: null,
                        stock: {
                            available: available,
                            total: total,
                            purchased: purchased,
                            product: { price: price, quality: quality, brand: brand }
                        },
                        companyName: companyName,
                        isIndependend: false,
                        self: self,
                        tmImg: tmImg
                    },
                    ordered: ordered,
                    constraints: {
                        type: ctype,
                        minQuality: cminQ,
                        price: maxPrice,
                        priceMarkUp: relPriceMarkUp
                    },
                    instant: instant,
                };
            }).get() as any as IBuyContract[];

            // [IProduct, [IProductProperties, number], IBuyContract[]]
            res.push([product, stock, contracts]);
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}


interface IPriceHistoryItem {
    date: Date;
    quantity: number;
    quality: number;
    price: number;
    brand: number;
}
/**
 * история цен в рознице /lien/window/unit/view/4038828/product_history/15742/
 * элементы в массиве расположены так же как в таблице. самый новый в 0 ячейке, самый старый в последней.
   строка с 0 продажами последняя в рознице вырезается, а в заправках ее нет вообще  
 * @param html
 * @param url
 */
function parseUnitRetailPriceHistory(html: any, url: string): IPriceHistoryItem[] {
    // удалим динамические графики ибо жрут ресурсы в момент $(html) они всегда загружаются без кэша
    let $html = $(html.replace(/<img.*\/graph\/.*>/i, "<img>"));

    try {
        // если продаж на неделе не было вообще => игра не запоминает в историю продаж такие дни вообще.
        // такие дни просто вылетают из списка.
        // сегодняшний день ВСЕГДА есть в списке. КРОМЕ ЗАПРАВОК
        // если продаж сегодня не было, то в строке будут тока бренд 0 а остальное пусто.
        // если сегодня продажи были, то там будут числа и данная строка запомнится как история продаж.
        // причина по которой продаж не было пофиг. Не было товара, цена стояла 0 или стояла очень большая. Похер!

        // так же бывает что последний день задваивается. надо убирать дубли если они есть
        // поэтому кладем в словарь по дате. Потом перегоняем в массив сортируя по дате по убыванию. самая новая первая
        // продажи с 0, вырезаем нахуй чтобы и маги и заправки были идентичны. 
        // отсутствие продаж будем брать со страницы трейдхолла
        let $rows = $html.find("table.list").find("tr.even, tr.odd");
        let dict: IDictionary<IPriceHistoryItem> = {};
        $rows.each((i, el) => {
            let $td = $(el).children();

            let _date = extractDate($td.eq(0).text());
            if (!_date)
                throw new Error("не смог отпарсить дату " + $td.eq(0).text());

            // если количества нет, значит продаж не было строка тупо пустая
            // удаляем ее нахуй
            let _quant = numberfy($td.eq(1).text());
            if (_quant <= 0)
                return;

            let _qual = numberfyOrError($td.eq(2).text(), 0);
            let _price = numberfyOrError($td.eq(3).text(), 0);
            let _brand = numberfyOrError($td.eq(4).text(), -1); // бренд может быть и 0

            dict[dateToShort(_date)] = {
                date: _date,
                quantity: _quant,
                quality: _qual,
                price: _price,
                brand: _brand
            };
        });

        // переводим в массив и сортируем по дате. в 0, самое последнее
        let res: IPriceHistoryItem[] = [];
        for (let key in dict)
            res.push(dict[key]);

        let sorted = res.sort((a, b) => {
            if (a.date > b.date)
                return -1;

            if (a.date < b.date)
                return 1;

            return 0;
        });
        return sorted;
    }
    catch (err) {
        throw err;
    }
}


interface ICityRetailReport {
    product: IProduct;
    index: MarketIndex;
    size: number;
    sellerCount: number;
    companyCount: number;
    locals: IProductProperties;
    shops: IProductProperties;
}
function parseCityRetailReport(html: any, url: string): ICityRetailReport {
    // удалим динамические графики ибо жрут ресурсы в момент $(html) они всегда загружаются без кэша
    let $html = $(html.replace(/<img.*\/graph\/.*>/i, "<img>"));

    try {
        // какой то косяк верстки страниц и страница приходит кривая без второй таблицы, поэтому 
        // строку с индексом находим по слову Индекс
        let $r = oneOrError($html, "tr:contains('Индекс')");
        let $tds = $r.children("td");

        // продукт, индекс, объем рынка, число продавцов и компаний
        let $img = oneOrError($tds.eq(0), "img");
        let img = $img.attr("src");
        let name = $img.attr("alt");
        let nums = extractIntPositive(url);
        if (nums == null)
            throw new Error("Не получилось извлечь id товара из " + url);

        let id = nums[0];
        let indexStr = $tds.eq(2).text().trim();
        let index = mIndexFromString(indexStr);

        let quant = numberfyOrError($tds.eq(4).text(), -1);
        let sellersCnt = numberfyOrError($tds.eq(6).text(), -1);
        let companiesCnt = numberfyOrError($tds.eq(8).text(), -1);


        let $priceTbl = oneOrError($html, "table.grid");
        // местные
        let localPrice = numberfyOrError($priceTbl.find("tr").eq(1).children("td").eq(0).text());
        let localQual = numberfyOrError($priceTbl.find("tr").eq(2).children("td").eq(0).text());
        let localBrand = numberfy($priceTbl.find("tr").eq(3).children("td").eq(0).text());   // может быть равен -

        // магазины
        let shopPrice = numberfyOrError($priceTbl.find("tr").eq(1).children("td").eq(1).text());
        let shopQual = numberfyOrError($priceTbl.find("tr").eq(2).children("td").eq(1).text());
        let shopBrand = numberfy($priceTbl.find("tr").eq(3).children("td").eq(1).text());   // может быть равен -

        return {
            product: { id: id, img: img, name: name },
            index: index,
            size: quant,
            sellerCount: sellersCnt,
            companyCount: companiesCnt,
            locals: { price: localPrice, quality: localQual, brand: Math.max(localBrand, 0) },
            shops: { price: shopPrice, quality: shopQual, brand: Math.max(shopBrand, 0) },
        };
    }
    catch (err) {
        throw err;
    }
}
