interface IWareDashboardItem {
    stock: IStock;      // что на складе сейчас
    sellPrice: number;  // цена продажи
    inOrdered: number;  // заказано получено на склад
    inDeliver: number;
    outOrdered: number; // заказано отгружено со склада
    outDeliver: number;
    filling: number;    // сколько занимает
}
interface IMainWare {
    specialization: string;
    filling: number;
    capacity: number;
    dashboard: IDictionary<IWareDashboardItem>;     // img = данные
}
function wareMain($html: JQuery, size: number): IMainWare {
    let $info = oneOrError($html, "table.infoblock");
    // строк со спецехой находит несколько по дефолту
    let spec = oneOrError($info, "tr:contains('Специализация'):last() td:last()").text().trim();

    let str = oneOrError($info, "tr:contains('Процент заполнения') td:last()").text();
    let filling = numberfyOrError(str, -1);

    let capacity = 10000;
    switch (size) {
        case 1:
            capacity = 10000;
            break;

        case 2:
            capacity = 50000;
            break;

        case 3:
            capacity = 100000;
            break;

        case 4:
            capacity = 500000;
            break;

        case 5:
            capacity = 1000000;
            break;

        case 6:
            capacity = 5 * 1000000;
            break;

        case 7:
            capacity = 50 * 1000000;
            break;

        case 8:
            capacity = 500 * 1000000;
            break;

        default:
            throw new Error("неизвестный размер склада " + size);
    }

    // спарсим строки с товаром на складе
    // товар которго нет на складе но есть заказ, будет отображаться на складе с прочерками или нулями
    let $tbl = oneOrError($html, "table.grid");
    let $rows = closestByTagName($tbl.find("img"), "tr");

    let dict: IDictionary<IWareDashboardItem> = {};
    $rows.each((i, el) => {
        let $r = $(el);
        let $tds = $r.children("td");

        let img = $tds.eq(0).find("img").attr("src");

        let awail = numberfyOrError($tds.eq(1).text(), -1);
        let quality = awail > 0 ? numberfyOrError($tds.eq(2).text()) : 0;
        let price = awail > 0 ? numberfyOrError($tds.eq(3).text()) : 0;

        let n = numberfy($tds.eq(4).text());
        let sellPrice = n > 0 ? n : 0;

        dict[img] = {
            stock: {
                available: awail,
                product: { quality: quality, price: price, brand: 0 },
            },
            sellPrice: sellPrice,
            inOrdered: numberfyOrError($tds.eq(6).text(), -1),
            inDeliver: numberfyOrError($tds.eq(7).text(), -1),
            outOrdered: numberfyOrError($tds.eq(5).text(), -1),
            outDeliver: numberfyOrError($tds.eq(8).text(), -1),
            filling: numberfyOrError($tds.eq(9).text(), -1)
        };
    });

    return {
        filling: filling,
        specialization: spec,
        capacity: capacity,
        dashboard: dict
    };
}


interface IWareResize {
    capacity: number[];
    rent: number[];
    id: number[];
}
/**
 * Чисто размер складов вида https://virtonomica.ru/fast/window/unit/upgrade/8006972
 * @param html
 * @param url
 */
function parseWareResize(html: any, url: string): IWareResize {
    let $html = $(html);

    try {

        let sz: number[] = [];
        let rent: number[] = [];
        let id: number[] = [];
        $html.find(":radio").closest("tr").each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            let txt = $tds.eq(1).text();
            if (txt.indexOf("тыс") >= 0)
                sz.push(numberfyOrError(txt) * 1000);
            else if (txt.indexOf("млн") >= 0)
                sz.push(numberfyOrError(txt) * 1000000);
            else if (txt.indexOf("терминал") >= 0)
                sz.push(500 * 1000000);

            rent.push(numberfyOrError($tds.eq(2).text()));
            id.push(numberfyOrError($tds.eq(0).find(":radio").val()));
        });

        return {
            capacity: sz,
            rent: rent,
            id: id
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}


/**
 * Снабжение склада
   [[товар, контракты[]], товары внизу страницы без контрактов]
   возможно что будут дубли id товара ведь малиновый пиджак и простой имеют общий id
 * @param html
 * @param url
 */
function parseWareSupply(html: any, url: string): [[IProduct, IBuyContract[]][], IProduct[]] {
    let $html = $(html);

    try {
        // для 1 товара может быть несколько поставщиков, поэтому к 1 продукту будет идти массив контрактов
        let $rows = $html.find("tr.p_title");

        // парсинг товаров на которые есть заказы
        let res: [IProduct, IBuyContract[]][] = [];
        $rows.each((i, el) => {
            let $r = $(el);     // это основной ряд, после него еще будут ряды до следующего это контракты
            let $subs = $r.nextUntil("tr.p_title").has("div.del_contract");
            if ($subs.length <= 0)
                throw new Error("есть строка с товаром но нет поставщиков. такого быть не может.");

            // собираем продукт
            let id = (() => {
                let href = oneOrError($r, "td.p_title_l a:eq(1)").attr("href");
                let n = extractIntPositive(href);
                if (n == null || n.length !== 3)
                    throw new Error(`в ссылке ${href} должно быть 3 числа`);

                return n[2];
            })();
            let $img = oneOrError($r, "div.product_img img");

            let product: IProduct = {
                id: id,
                img: $img.attr("src"),
                name: $img.attr("title")
            };

            // для ТМ учитываем факт ТМности
            let tmImg = isTM(product) ? product.img : "";

            // собираем контракты
            let contracts: IBuyContract[] = [];
            $subs.each((i, el) => {
                let $r = $(el);

                // контракт
                let offerID = numberfyOrError(oneOrError($r, "input[name='multipleDestroy[]']").val());

                // ячейка где чекбокс и линки на компанию и юнит
                let $div = oneOrError($r, "div.del_contract").next("div");

                let isIndep = $div.find("img[src='/img/unit_types/seaport.gif']").length > 0;

                let subid = 0;
                let unitName = "независимый поставщик";
                let companyName = "независимый поставщик";
                let self = false;

                if (!isIndep) {
                    // subid юнита
                    let $a = oneOrError($div, "a[href*='/unit/']");
                    let numbers = extractIntPositive($a.attr("href"));
                    if (numbers == null || numbers.length !== 1)
                        throw new Error("не смог взять subid юнита из ссылки " + url);

                    subid = numbers[0];

                    // имя юнита
                    unitName = $a.text();
                    if (unitName.length <= 0)
                        throw new Error(`имя поставщика юнит ${subid} не спарсилось`);


                    // для чужих складов имя идет линком, а для своих выделено strong тегом
                    $a = $div.find("a[href*='/company/']");
                    if ($a.length === 1)
                        companyName = $a.text();
                    else if ($a.length > 1)
                        throw new Error(`нашли ${$a.length} ссылок на компанию вместо 1`);
                    else {
                        companyName = oneOrError($div, "strong").text();
                        self = true;
                    }
                }

                // ограничения контракта и заказ
                // 
                let str = oneOrError($r, "input[name^='supplyContractData[party_quantity]']").val() as string;
                let ordered = numberfyOrError(str, -1);

                let ctype: ConstraintTypes;
                let val = oneOrError($r, "input[name^='supplyContractData[constraintPriceType]']").val() as string;
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
                let cminQ = numberfyOrError($r.find("input[name^='supplyContractData[quality_constraint_min]']").val(), -1);
                let maxPrice = numberfyOrError($r.find("input[name^='supplyContractData[price_constraint_max]']").val(), -1);
                let relPriceMarkUp = numberfyOrError($r.find("input[name^='supplyContractData[price_mark_up]']").val(), -1);

                // разовый контракт
                let $nextdiv = $r.find("input[name^='supplyContractData[constraintPriceType]']").next("div");
                if ($nextdiv.length > 1)
                    throw new Error(`Найдено несколько потенциальных div под обозначение Разового контракта ${offerID}:${companyName} товара ${product.img}`);
                else if ($nextdiv.length == 1 && $nextdiv.text().trim().indexOf("Разовая") < 0)
                    throw new Error(`Проверка div под обозначение Разового контракта ${offerID}:${companyName} товара ${product.img} провалилась.`);

                let instant = $nextdiv.length > 0;

                // состояние склада поставщика
                //
                // первая строка может быть либо число либо "323 из 34345345"
                // вторя строка всегда число или 0
                // для независа будет "не огран"
                let total = Number.MAX_SAFE_INTEGER;
                let available = Number.MAX_SAFE_INTEGER;
                let maxLimit = 0;
                let purchased = numberfyOrError($r.find("td.num:eq(0)").text(), -1);

                if (!isIndep) {
                    let $td = oneOrError($r, "td.num:eq(6) span");
                    let items = getOnlyText($td);
                    if (items.length != 2)
                        throw new Error("ошибка извлечения Доступно/Всего со склада");

                    total = numberfyOrError(items[1], -1);
                    let n = extractIntPositive(items[0]);
                    if (n == null || n.length > 2)
                        throw new Error("ошибка извлечения Доступно/Всего со склада");

                    [available, maxLimit] = n.length > 1 ? [n[1], n[0]] : [n[0], 0];
                }

                // характеристики товара поставщика
                //
                // если поставщик поднял цену, тогда новая цена будет второй и по факту это цена контракта.
                // нельзя заключать контракт по старой цене уже. и при обновлении поставок надо ориентироваться на новую цену
                let price = 0;
                let quality = 0;
                let brand = 0;      // бренда на складе не показывает вообще
                if (total > 0) {
                    let n = extractFloatPositive($r.children("td.num").eq(1).text());
                    if (n == null || n.length > 2)
                        throw new Error("не найдена цена товара");

                    price = n.length > 1 ? n[1] : n[0];
                    quality = numberfyOrError($r.children("td.num").eq(3).text());
                }

                contracts.push({
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
                        isIndependend: isIndep,
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
                });
            });

            res.push([product, contracts]);
        });

        // парсинг товаров внизу на которые заказов нет
        let $items = isWindow($html, url)
            ? $html.filter("div.add_contract")
            : $html.find("div.add_contract");

        let arr: IProduct[] = [];
        $items.each((i, el) => {
            let $div = $(el);
            let $img = oneOrError($div, "img");
            let img = $img.attr("src");
            let name = $img.attr("alt");

            let $a = $img.closest("a");
            let n = extractIntPositive($a.attr("href"));
            if (n == null || n.length != 3) // step1 тоже содержит число помимо айди товара и склада
                throw new Error("не нашли id товара " + img);

            let id = n[2];

            arr.push({ id: id, img: img, name: name });
        });

        return [res, arr];
    }
    catch (err) {
        throw err;
    }
}


interface ISaleWareItem {
    product: IProduct;
    stock: IStock;
    outOrdered: number;

    price: number;
    salePolicy: SalePolicies;
    maxQty: number | null;  // ограничение на макс объем заказа

    priceName: string;  // имена элементов для быстрого поиска по форме потом
    policyName: string;
    maxName: string;    // окно ввода максимума
}
/**
 * форма, товары
 * @param html
 * @param url
 */
function parseWareSaleNew(html: any, url: string): [JQuery, IDictionary<ISaleWareItem>] {
    let $html = $(html);

    try {
        let $form = isWindow($html, url)
            ? $html.filter("form[name=storageForm]")
            : $html.find("form[name=storageForm]");
        if ($form.length <= 0)
            throw new Error("Не найдена форма.");

        let $tbl = oneOrError($html, "table.grid");
        let $rows = closestByTagName($tbl.find("select[name*='storageData']"), "tr");

        let dict: IDictionary<ISaleWareItem> = {};
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            // товар
            let prod = parseProduct($tds.eq(2));

            let $price = oneOrError($r, "input.money[name*='[price]']");
            let $policy = oneOrError($r, "select[name*='[constraint]']");
            let $maxQty = oneOrError($r, "input.money[name*='[max_qty]']");
            let maxQty: null | number = numberfy($maxQty.val());
            maxQty = maxQty > 0 ? maxQty : null;

            dict[prod.img] = {
                product: prod,
                stock: parseStock($tds.eq(3)),
                outOrdered: numberfyOrError($tds.eq(4).text(), -1),

                price: numberfyOrError($price.val(), -1),
                salePolicy: $policy.prop("selectedIndex"),
                maxQty: maxQty,

                priceName: $price.attr("name"),
                policyName: $policy.attr("name"),
                maxName: $maxQty.attr("name"),
            }
        });

        return [$form, dict];
    }
    catch (err) {
        //throw new ParseError("sale", url, err);
        throw err;
    }


    function parseProduct($td: JQuery): IProduct {

        // товар
        let $img = oneOrError($td, "img");
        let img = $img.attr("src");
        let name = $img.attr("alt");

        let $a = oneOrError($td, "a");
        let n = extractIntPositive($a.attr("href"));
        if (n == null || n.length > 1)
            throw new Error("не нашли id товара " + img);

        let id = n[0];

        return { name: name, img: img, id: id };
    }

    // если товара нет, то характеристики товара зануляет
    function parseStock($td: JQuery): IStock {
        let $rows = $td.find("tr");

        // могут быть прочерки для товаров которых нет вообще
        let available = numberfy(oneOrError($td, "td:contains(Количество)").next("td").text());
        if (available < 0)
            available = 0;

        return {
            available: available,
            product: {
                brand: 0,
                price: available > 0 ? numberfyOrError(oneOrError($td, "td:contains(Себестоимость)").next("td").text()) : 0,
                quality: available > 0 ? numberfyOrError(oneOrError($td, "td:contains(Качество)").next("td").text()) : 0
            }
        }
    }
}


/**
 * Страница смены спецухи для склада.
 * /olga/window/unit/speciality_change/6835788
    [id, название, выделена?]
 * @param html
 * @param url
 */
function parseWareChangeSpec(html: any, url: string): [number, string, boolean][] {
    let $html = $(html);

    let res: [number, string, boolean][] = [];
    try {
        let $rows = $html.find("table.list").find("tr.even,tr.odd");
        if ($rows.length <= 0)
            throw new Error("Не найдено ни одной специализации");


        $rows.each((i, el) => {
            let $r = $(el);

            let $radio = oneOrError($r, "input");
            let cat = parseInt($radio.val());
            let name = $r.children("td").eq(1).text();
            let checked = $radio.prop("checked") as boolean;

            res.push([cat, name, checked]);
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}
