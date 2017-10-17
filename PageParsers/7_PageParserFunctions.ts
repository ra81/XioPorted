//
// Сюда все функции которые парсят данные со страниц
//

/**
 * Определяет что данная страница открыта в режиме window то есть без шапки
 */
function isWindow($html: JQuery, url: string) {
    return url.indexOf("/window/") > 0;
}

/**
 * По пути картинки выявляется ТМ товар или нет. Обычно в ТМ у нас есть /brand/ кусок
 * @param product
 */
function isTM(product: IProduct) {
    if (product.img.length <= 0)
        throw new Error(`Нельзя определить брандовость продукта ${product.id} => ${product.name}`);

    return product.img.indexOf("/brand/") >= 0;
}

/**
 * Возвращает ТОЛЬКО текст элемента БЕЗ его наследников
 * @param el
 */
function getInnerText(el: Element) {
    return $(el).clone().children().remove().end().text();
}

/**
 * Из набора HTML элементов представляющих собой tr парсит subid. Ряды должны быть стандартного формата.
 */
function parseSubid($rows: JQuery): number[] {
    if ($rows == null)
        throw new ArgumentNullError("trList");

    let f = (i: number, e: Element) => numberfyOrError($(e).text());
    return $rows.find("td.unit_id").map(f).get() as any as number[];
}

/**
 * Берет локальное хранилище и тащит оттуда все записи по юнитам. возвращает subid
 */
function parseAllSavedSubid(realm: string): number[] {

    if (!realm || realm.length === 0)
        throw new ArgumentNullError("realm");

    let subids: number[] = [];
    let rx = new RegExp("x" + realm + "\\d+");
    for (let key in localStorage) {
        if (!rx.test(key))
            continue;

        let m = key.match(/\d+/);
        if (m != null)
            subids.push(numberfy(m[0]));
    }

    return subids;
}

/**
 * Парсинг главной страницы с юнитами.
 * @param html
* @param url
 */
function parseUnitList(html: any, url: string): IDictionaryN<IUnit> {
    let $html = $(html);

    try {
        let $table = isWindow($html, url)
            ? $html.filter("table.unit-list-2014")
            : $html.find("table.unit-list-2014");

        let res: IDictionaryN<IUnit> = {};
        let $rows = closestByTagName($table.find("td.unit_id"), "tr");
        if ($rows.length === 0)
            throw new Error("Не нашел ни одного юнита, что не может быть");

        $rows.each((i, el) => {
            let $r = $(el);

            let subid = numberfyOrError($r.find("td.unit_id").text());

            let typestr = $r.find("td.info").attr("class").split("-")[1];
            if (typestr == null)
                throw new Error("class attribute doesn't contains type part.");

            // такой изврат с приведением из за компилера. надо чтобы работало
            let type: UnitTypes = (UnitTypes as any)[typestr] ? (UnitTypes as any)[typestr] : UnitTypes.unknown;
            if (type == UnitTypes.unknown)
                throw new Error("Не описан тип юнита " + typestr);

            let name = oneOrError($r, "td.info a").text().trim();
            if (name.length <= 0)
                throw new Error(`имя юнита ${subid} не спарсилось.`);

            let size = oneOrError($r, "td.size").find("div.graybox").length; // >= 0
            let city = oneOrError($r, "td.geo").text().trim();

            res[subid] = {
                subid: subid,
                type: type,
                typeStr: UnitTypes[type],
                name: name,
                size: size,
                city: city
            };
        });

        return res;
    }
    catch (err) {
        console.log(url);
        throw err;
    }
}

/**
 * Парсит "/main/unit/view/ + subid + /sale" урлы
 * Склады, это их тема
 * @param html
 * @param url
 */
function parseSale(html: any, url: string): ISale {
    let $html = $(html);

    try {
        let $rows = $html.find("table.grid").find("tr.even, tr.odd");

        // помним что на складах есть позиции без товаров и они как бы не видны по дефолту в продаже, но там цена 0 и есть политика сбыта.
        let _form = $html.find("[name=storageForm]") as JQuery;

        // может быть -1 если вдруг ничего не выбрано в селекте, что маовероятно
        let _policy = $rows.find("select:nth-child(3)").map((i, e) => $(e).find("[selected]").index()).get() as any as number[];

        let _price = $rows.find("input.money:nth-child(1)").map((i, e) => numberfy($(e).val())).get() as any as number[];
        let _incineratorMaxPrice = $html.find('span[style="COLOR: green;"]').map((i, e) => numberfy($(e).text())).get() as any as number[];

        let stockIndex = $html.find("table.grid").find("th:contains('На складе')").index();
        let $stockTd = $rows.children(`td:nth-child(${stockIndex+1})`);
        let _stockamount = $stockTd.find("tr:nth-child(1)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];
        let _stockqual = $stockTd.find("tr:nth-child(2)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];
        let _stockprime = $stockTd.find("tr:nth-child(3)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];

        // относится к производству. для складов тупо редиректим на ячейку со складом. Будет одно и то же для склада и для выхода.
        let outIndex = $html.find("table.grid").find("th:contains('Выпуск')").index();
        let $outTd = outIndex >= 0 ? $rows.children(`td:nth-child(${outIndex + 1})`) : $stockTd;
        let _outamount = $outTd.find("tr:nth-child(1)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];
        let _outqual = $outTd.find("tr:nth-child(2)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];
        let _outprime = $outTd.find("tr:nth-child(3)").find("td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];

        // название продукта Спортивное питание, Маточное молочко и так далее
        let _product = $rows.find("a:not([onclick])").map((i, e) => {
            let t = $(e).text();
            if (t.trim() === "")
                throw new Error("product name is empty");

            return t;
        }).get() as any as string[];

        // номер продукта
        let _productId = $rows.find("a:not([onclick])").map((i, e) => {
            let m = $(e).attr("href").match(/\d+/);
            if (m == null)
                throw new Error("product id not found.");

            return numberfyOrError(m[0]);
            }).get() as any as number[];

        // "Аттика, Македония, Эпир и Фессалия"
        let _region = $html.find(".officePlace a:eq(-2)").text();
        if (_region.trim() === "")
            throw new Error("region not found");

        // если покупцов много то появляется доп ссылка на страницу с контрактами. эта херь и говорит есть она или нет
        let _contractpage = !!$html.find(".tabsub").length;
        // TODO: сделать чтобы контракты были вида [товар, [линк на юнит, цена контракта]]. Тогда тупо словарь удобный для работы а не текущая хуйня
        // данное поле существует только если НЕТ ссылки на контракты то есть в простом случае и здесь может быть такой хуйня
        // ["Молоко", "$1.41", "$1.41", "$1.41", "Мясо", "$5.62"]
        // идет категория, потом цены покупателей, потом снова категория и цены. И как бы здесь нет порядка
        // Если покупателей нет, гарантируется пустой массив!
        let _contractprice = ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map((e) => {
            return e[0] === "[" ? e.slice(13, -1) : numberfy(e);
        }) as any as string|number[];

        return {
            form: _form,
            policy: _policy,
            price: _price,
            incineratorMaxPrice: _incineratorMaxPrice,

            outamount: _outamount,
            outqual: _outqual,
            outprime: _outprime,

            stockamount: _stockamount,
            stockqual: _stockqual,
            stockprime: _stockprime,
            product: _product,
            productId: _productId,
            region: _region,
            contractpage: _contractpage,
            contractprice: _contractprice
        };
    }
    catch (err) {
        throw new ParseError("sale", url, err);
    }
}

function _parseSaleNew(html: any, url: string): ISaleNew {
    let $html = $(html);

    type THeaders = { prod: number, stock: number, out: number, policy: number, price: number, ordered: number, free: number };

    // парсинг ячейки продукта на складе или на производстве
    // продукт идентифицируется уникально через картинку и имя. Урл на картинку нам пойдет
    // так же есть у продуктов уникальный id, но не всегда его можно выдрать
    let parseProduct = ($td: JQuery): IProduct => {
        let img = $td.find("img").eq(0).attr("src");

        let $a = $td.find("a");
        // название продукта Спортивное питание, Маточное молочко и так далее
        let name = $a.text().trim();
        if (name.length === 0)
            throw new Error("Имя продукта пустое.");

        // номер продукта
        let m = $a.attr("href").match(/\d+/);
        if (m == null)
            throw new Error("id продукта не найден");

        let id = numberfyOrError(m[0], 0);  // должно быть больше 0 полюбому

        return { name: name, img: img, id: id };
    };

    // парсинг ячеек на складе и выпуск 
    // если нет товара то прочерки стоят.вывалит - 1 для таких ячеек
    let parseStock = ($td: JQuery): IStorageData => {
        
        return {
            quantity: numberfy($td.find("tr").eq(0).find("td").eq(1).text()),
            quality: numberfy($td.find("tr").eq(1).find("td").eq(1).text()),
            price: numberfy($td.find("tr").eq(2).find("td").eq(1).text()),
            brand: -1
        }
    };

    // ищет имена в хедерах чтобы получить индексы колонок
    let parseHeaders = ($ths: JQuery): THeaders => {

        // индексы колонок с данными
        let prodIndex  = $ths.filter(":contains('Продукт')").index();
        let stockIndex = $ths.filter(":contains('На складе')").index();
        // для склада нет выпуска и ячейки может не быть. Просто дублируем складскую ячейку
        let outIndex = $ths.filter(":contains('Выпуск')").index();
        if (outIndex < 0)
            outIndex = stockIndex;

        let policyIndex = $ths.filter(":contains('Политика сбыта')").index();
        let priceIndex = $ths.filter(":contains('Цена')").index();
        let orderedIndex = $ths.filter(":contains('Объем заказов')").index();
        let freeIndex = $ths.filter(":contains('Свободно')").index();

        let obj = {
            prod: prodIndex,
            stock: stockIndex,
            out: outIndex,
            policy: policyIndex,
            price: priceIndex,
            ordered: orderedIndex,
            free: freeIndex
        };

        return obj;
    }

    let parseContractRow = ($row: JQuery): ISaleContract => {
        // тип покупца вытащим из картинки. для завода workshop
        let items = $row.find("img[src*=unit_types]").attr("src").split("/");
        let unitType = items[items.length - 1].split(".")[0];

        let companyName = $row.find("b").text();
        let $a = $row.find("a").eq(1);
        let unitId = matchedOrError($a.attr("href"), new RegExp(/\d+/));
        let $td = $a.closest("td");
        let purshased = numberfyOrError($td.next("td").text(), -1);
        let ordered = numberfyOrError($td.next("td").next("td").text(), -1);
        let price = numberfyOrError($td.next("td").next("td").next("td").text(), -1);

        return {
            CompanyName: companyName,
            UnitType: unitType,
            UnitId: unitId,
            Ordered: ordered,
            Purchased: purshased,
            Price: price
        };
    };

    try {
        let $storageTable = $("table.grid");

        // помним что на складах есть позиции без товаров и они как бы не видны по дефолту в продаже, но там цена 0 и есть политика сбыта.
        let _storageForm = $html.find("[name=storageForm]");
        let _incineratorMaxPrice = $html.find('span[style="COLOR: green;"]').map((i, e) => numberfy($(e).text())).get() as any as number[];

        // "Аттика, Македония, Эпир и Фессалия"
        let _region = $html.find(".officePlace a:eq(-2)").text().trim();
        if (_region === "")
            throw new Error("region not found");

        // если покупцов много то появляется доп ссылка на страницу с контрактами. эта херь и говорит есть она или нет
        let _contractpage = !!$html.find(".tabsub").length;

        // берем все стркои включая те где нет сбыта и они пусты. Может быть глюки если заказы есть товара нет. Хз в общем.
        // список ВСЕХ продуктов на складе юнита. Даже тех которых нет в наличии, что актуально для складов
        let products: IDictionary<ISaleProductData> = {};
        let $rows = $storageTable.find("select[name*='storageData']").closest("tr");
        let th = parseHeaders($storageTable.find("th"));
        for (let i = 0; i < $rows.length; i++) {
            let $r = $rows.eq(i);

            let product = parseProduct($r.children("td").eq(th.prod));

            // для складов и производства разный набор ячеек и лучше привязаться к именам чем индексам
            let stock = parseStock($r.children("td").eq(th.stock));
            let out = parseStock($r.children("td").eq(th.out));

            let freeQuantity = numberfyOrError($r.children("td").eq(th.free).text(), -1);
            let orderedQuantity = numberfyOrError($r.children("td").eq(th.ordered).text(), -1);

            // может быть -1 если вдруг ничего не выбрано в селекте, что маовероятно
            let policy = $r.find("select:nth-child(3)").prop("selectedIndex") as number;
            let price = numberfyOrError($r.find("input.money:nth-child(1)").eq(0).val(), -1);

            if (products[product.img] != null)
                throw new Error("Что то пошло не так. Два раза один товар");

            products[product.img] = {
                product: product,
                stock: stock,
                out: out,
                freeQuantity: freeQuantity,
                orderedQuantity: orderedQuantity,
                salePolicy: policy,
                salePrice: price
            };
        }


        // Парсим контракты склада
        let contracts: IDictionary<ISaleContract[]> = {};
        if (_contractpage) {

        }
        else {
            let $consumerForm = $html.find("[name=consumerListForm]");
            let $consumerTable = $consumerForm.find("table.salelist");

            // находим строки с заголовками товара. Далее между ними находятся покупатели. Собираем их
            let $prodImgs = $consumerTable.find("img").filter("[src*='products']");
            let $productRows = $prodImgs.closest("tr");   // ряды содержащие категории то есть имя товара

            // покупцы в рядах с id
            let $contractRows = $consumerTable.find("tr[id]");
            if ($contractRows.length < $prodImgs.length)
                throw new Error("Что то пошло не так. Число контрактов МЕНЬШЕ числа категорий");


            let prodInd = -1;
            let lastInd = -1;
            let key = "";
            for (let i = 0; i < $contractRows.length; i++) {
                let $r = $contractRows.eq(i);

                // если разница в индексах больше 1 значит была вставка ряда с именем товара и мы уже другой товар смотрим
                if ($r.index() > lastInd + 1) {
                    prodInd++;
                    key = $prodImgs.eq(prodInd).attr("src");
                    contracts[key] = [];
                }

                contracts[key].push(parseContractRow($r));
                lastInd = $r.index();
            }
        }

        return {
            region: _region,
            incineratorMaxPrice: _incineratorMaxPrice,
            form: _storageForm,
            contractpage: _contractpage,
            products: products,
            contracts: contracts
        };
    }
    catch (err) {
        //throw new ParseError("sale", url, err);
        throw err;
    }
}

enum SalePolicies {
    nosale = 0,
    any,
    some,
    company,
    corporation
}

interface ISaleWareItem {
    product: IProduct;
    stock: IStock;
    outOrdered: number;

    price: number;
    salePolicy: SalePolicies;

    priceName: string;  // имена элементов для быстрого поиска по форме потом
    policyName: string;
}
/**
 * форма, товары
 * @param html
 * @param url
 */
function parseUnitSaleNew(html: any, url: string): [JQuery, IDictionary<ISaleWareItem>] {
    let $html = $(html);

    try {
        let $tbl = oneOrError($html, "table.grid");
        let $form = $html.find("form[name=storageForm]");
        let $rows = closestByTagName($tbl.find("select[name*='storageData']"), "tr");

        let dict: IDictionary<ISaleWareItem> = {};
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            // товар
            let prod = parseProduct($tds.eq(2));

            let $price = oneOrError($tds.eq(6), "input.money");
            let $policy = oneOrError($tds.eq(7), "select:eq(0)");

            dict[prod.img] = {
                product: prod,
                stock: parseStock($tds.eq(3)),
                outOrdered: numberfyOrError($tds.eq(4).text(), -1),

                price: numberfyOrError($price.val(), -1),
                salePolicy: $policy.prop("selectedIndex"),

                priceName: $price.attr("name"),
                policyName: $policy.attr("name"),
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


///**
// * Парсит страницы вида "/main/unit/view/ + subid + /sale/product", а так же
// * "/main/unit/view/" + subid + "/sale/product/ + productId"
// * @param html
// * @param url
// */
//function parseSaleContracts(html: any, url: string): ISaleContract {
//    let $html = $(html);

//    // слегка дибильный подход. В объекте мы имеем цены покупцов для одной категории по url, но список категорий 
//    // каждый раз забираем весь.
//    // TODO: перепилить. Сделать контракт как {url:string, ИмяТовара:string, prices: number[]} 
//    // итоговая структура будет выглядеть так 
//    /* $mapped[subid/sale/product] = {
//            categories: string[];  - список урлов категорий
//        }
//        а далее
//        $mapped[subid/sale/product/prodId] = {
//            prodName: string; - строковое имя продукта    
//            buyerPrices: number[]; - массив цен покупцов данного товара
//        }

//        аналогично делать ISale. Вместо хуйни с string|number вставить туда сразу свойство
//        contracts: IDictionary<ISaleContract> содержащее инфу по всем товарам. ключом будет productId или его урл
//    */ 
//    try {
//        // каждая категория представляет товар который продается со склада или производства. По факту берем ссыль через которую
//        // попадаем на список покупателей товара.
//        // если покупцов товара НЕТ, тогда данной категории не будет. То есть не может быть пустая категория
//        let _categorys = $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[];

//        // здесь уже есть четкая гарантия что резалт будет вида 
//        // ["Медицинский инструментарий", 534.46, 534.46, 534.46, 534.46]
//        // то есть первым идет название а потом цены покупателей
//        let _contractprices = ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e) }) as any as string | number[]
//        return { category: _categorys, contractprice: _contractprices };
//    }
//    catch (err) {
//        throw new ParseError("sale contracts", url, err);
//    }
//}

/**
 * Парсинг данных по страницы
   /main/unit/view/8004742/virtasement
   /window/unit/view/8004742/virtasement
 */
function parseUnitAds(html: any, url: string): IUnitAds {
    let $html = $(html);

    try {
        // известность
        let _celebrity = numberfyOrError($html.find(".infoblock tr:eq(0) td:eq(1)").text(), -1);

        // население города
        let _pop = (() => {
            // для window у нас чуть иначе поиск
            let scriptTxt = isWindow($html, url)
                ? $html.filter("script").text()
                : $html.find("script").text();

            // если регулярка сработала значит точно нашли данные
            let m = execOrError(scriptTxt, /params\['population'\] = (\d+);/i);
            return numberfyOrError(m[1], 0);
        })();

        // текущий бюджет, он может быть и 0
        let _budget = numberfyOrError($html.find("input:text:not([readonly])").val(), -1);

        // бюжет на поддержание известности
        // ["не менее ©110.25  в неделю для ТВ-рекламы"] здесь может быть и $110.25
        // данный бюжет тоже может быть 0 если известность 0
        let _requiredBudget = numberfyOrError($html.find(".infoblock tr:eq(1) td:eq(1)").text().split(/[$©]/g)[1], -1);
        //if (_celebrity > 0 && _requiredBudget === 0)  такое может быть при хреновой известности
        //    throw new Error("required budget can't be 0 for celebrity" + _celebrity);

        return {
            celebrity: _celebrity,
            pop: _pop,
            budget: _budget,
            requiredBudget: _requiredBudget
        };
    }
    catch (err) {
        throw err;
    }
}

/**
 * Парсим данные  с формы зарплаты /window/unit/employees/engage/" + subid
 * @param html
 * @param url
 */
function parseUnitSalary(html: any, url: string): IUnitSalary {
    let $html = $(html);

    try {
        let _form = $html.filter("form");
        let _employees = numberfy($html.find("#quantity").val());
        let _maxEmployees = numberfy($html.find("tr.even:contains('Максимальное количество')").find("td.text_to_left").text());
        if (_maxEmployees <= 0)
            throw new RangeError("Макс число рабов не может быть 0.");

        let _salaryNow = numberfy($html.find("#salary").val());
        let _salaryCity = numberfyOrError($html.find("tr:nth-child(3) > td").text().split(/[$©]/g)[1]);
        let _skillNow = numberfy($html.find("#apprisedEmployeeLevel").text());
        let _skillCity = (() => {
            let m = $html.find("div span[id]:eq(1)").text().match(/[0-9]+(\.[0-9]+)?/);
            if (m == null)
                throw new Error("city skill not found.");

            return numberfyOrError(m[0]);
        })();
        let _skillReq = (() => {
            let m = $html.find("div span[id]:eq(1)").text().split(",")[1].match(/(\d|\.)+/);
            if (m == null)
                throw new Error("skill req not found.");

            return numberfy(m[0]);
        })();

        return {
            form: _form,
            employees: _employees,
            maxEmployees: _maxEmployees,
            salaryNow: _salaryNow,
            salaryCity: _salaryCity,
            skillNow: _skillNow,
            skillCity: _skillCity,
            skillReq: _skillReq
        };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}

/**
 * /olga/window/unit/employees/education/6566432
 * @param html
 * @param url
 */
function parseUnitEducation(html: any, url: string): [number, IUnitSalary]|null {
    let $html = $(html);

    try {
        // формы может не быть если обучение уже запущено
        let $form = $html.filter("form");   // через find не находит какого то хера
        if ($form.length <= 0)
            return null;

        let $tbl = oneOrError($html, "table.list");

        let salaryNow = numberfyOrError($tbl.find("td:eq(8)").text());
        let salaryCity = numberfyOrError($tbl.find("td:eq(9)").text().split("$")[1]);

        let weekcost = numberfyOrError($tbl.find("#educationCost").text());

        let employees = numberfyOrError($tbl.find("#unitEmployeesData_employees").val(), -1);
        let emplMax = numberfyOrError($tbl.find("td:eq(2)").text().split(":")[1]);

        let skillNow = numberfyOrError($tbl.find("span:eq(0)").text());
        let skillCity = numberfyOrError($tbl.find("span:eq(1)").text());
        let skillRequired = numberfyOrError($tbl.find("span:eq(2)").text(), -1); // может быть и 0

        return [weekcost, {
            form: $form,
            employees: employees,
            maxEmployees: emplMax,
            salaryCity: salaryCity,
            salaryNow: salaryNow,
            skillCity: skillCity,
            skillReq: skillRequired,
            skillNow: skillNow
        }]
        
    }
    catch (err) {
        throw err;
    }
}


/**
 * /main/user/privat/persondata/knowledge
 * @param html
 * @param url
 */
function parseManager(html: any, url: string): ITopManager {
    let $html = $(html);

    try {
        // бонусной херни не всегда может быть поэтому надо заполнять руками
        let stats = (() => {
            let jq = $html.find("tr.qual_item").find("span.mainValue");
            if (jq.length === 0)
                throw new Error("top stats not found");

            // не может быть 0
            let main = jq.map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

            // может быть 0. иногда бонусного спана совсем нет
            let bonus = jq.map((i, e) => {
                let bonusSpan = $(e).next("span.bonusValue");
                if (bonusSpan.length === 0)
                    return 0;

                let n = numberfy(bonusSpan.text());
                return n < 0 ? 0: n;
            }).get() as any as number[];

            return [main, bonus];
        })();

        let _base = stats[0];
        let _bonus = stats[1];
        let _pic = $html.find(".qual_item img").map((i, e) => $(e).attr("src")).get() as any as string[];

        if (_base.length !== _bonus.length || _base.length !== _pic.length)
            throw new Error("что то пошло не так. массивы разной длины")

        return {
            base: _base,
            bonus: _bonus,
            pic: _pic
        };
    }
    catch (err) {
        throw err;
    }
}

/**
 * /main/unit/view/ + subid
 * @param html
 * @param url
 */
function parseUnitMain(html: any, url: string): IMain {
    let $html = $(html);

    try {
        let newInterf = $html.find(".unit_box").length > 0;
        if (newInterf) {
            let _employees = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(0) td:eq(1)").text());
            let _salaryNow =  numberfy($html.find(".unit_box:has(.fa-users) tr:eq(2) td:eq(1)").text());
            let _salaryCity = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(3) td:eq(1)").text());
            let _skillNow = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(4) td:eq(1)").text());
            let _skillReq = numberfy($html.find(".unit_box:has(.fa-users) tr:eq(5) td:eq(1)").text());
            // TODO: в новом интерфейсе не все гладко. проверить как оборудование ищет
            let _equipNum = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(0) td:eq(1)").text());
            let _equipMax = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(1) td:eq(1)").text());
            let _equipQual = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(2) td:eq(1)").text());
            let _equipReq = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(3) td:eq(1)").text());

            let _equipWearBlack = numberfy($html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1)").text().split("(")[1]);
            let _equipWearRed = $html.find(".unit_box:has(.fa-cogs) tr:eq(4) td:eq(1) span").length === 1;
            let _managerPic = $html.find(".unit_box:has(.fa-user) ul img").attr("src");
            let _qual = numberfy($html.find(".unit_box:has(.fa-user) tr:eq(1) td:eq(1)").text());
            let _techLevel = numberfy($html.find(".unit_box:has(.fa-industry) tr:eq(3) td:eq(1)").text());
            // общее число подчиненных по профилю
            let _totalEmployees = numberfy($html.find(".unit_box:has(.fa-user) tr:eq(2) td:eq(1)").text());
            let _img = $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0];
            let _size = numberfy($html.find("#unitImage img").attr("src").split("_")[1]);
            let _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;
            let _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;
            let _onHoliday = !!$html.find("[href$=unset]").length;
            let _isStore = !!$html.find("[href$=trading_hall]").length;
            let _departments = numberfy($html.find("tr:contains('Количество отделов') td:eq(1)").text());
            let _visitors = numberfy($html.find("tr:contains('Количество посетителей') td:eq(1)").text());

            return {
                type: UnitTypes.unknown,
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesReq: -1,

                salaryNow: _salaryNow,
                salaryCity: _salaryCity,

                skillNow: _skillNow,
                skillCity: -1,
                skillReq: _skillReq,

                equipNum: _equipNum,
                equipMax: _equipMax,
                equipQual: _equipQual,
                equipReq: _equipReq,
                equipBroken: -1,
                equipWearBlack: _equipWearBlack,
                equipWearRed: _equipWearRed,

                managerPic: _managerPic,
                qual: _qual,
                techLevel: _techLevel,
                img: _img,
                size: _size,
                hasBooster: _hasBooster,
                hasAgitation: _hasAgitation,
                onHoliday: _onHoliday,
                isStore: _isStore,
                departments: _departments,
                visitors: _visitors,
                service: ServiceLevels.none
            };
        }
        else {
            let rxFloat = new RegExp(/\d+\.\d+/g);
            let rxInt = new RegExp(/\d+/g);
            let $block = $html.find("table.infoblock");

            // Количество рабочих. может быть 0 для складов.
            let empl = (() => {
                // Возможные варианты для рабочих будут
                // 10(требуется ~ 1)
                // 10(максимум:1)
                // 10 ед. (максимум:1) это уже не включать
                // 1 000 (максимум:10 000) пробелы в числах!!
                let types = ["сотрудников", "работников", "учёных", "рабочих"];
                let res = [-1, -1];

                //let emplRx = new RegExp(/\d+\s*\(.+\d+.*\)/g);
                //let td = jq.next("td").filter((i, el) => emplRx.test($(el).text()));
                let jq = $block.find('td.title:contains("Количество")').filter((i, el) => {
                    return types.some((t, i, arr) => $(el).text().indexOf(t) >= 0);
                });

                if (jq.length !== 1)
                    return res;

                // например в лаборатории будет находить вместо требований, так как их нет, макс число рабов в здании
                let m = jq.next("td").text().replace(/\s*/g, "").match(rxInt);
                if (!m || m.length !== 2)
                    return res;

                return [parseFloat(m[0]), parseFloat(m[1])];
            })();
            let _employees = empl[0];
            let _employeesReq = empl[1];
            // общее число подчиненных по профилю
            let _totalEmployees = numberfy($block.find('td:contains("Суммарное количество подчинённых")').next("td").text());

            let salary = (() => {
                //let rx = new RegExp(/\d+\.\d+.+в неделю\s*\(в среднем по городу.+?\d+\.\d+\)/ig);
                let jq = $block.find('td.title:contains("Зарплата")').next("td");
                if (jq.length !== 1)
                    return ["-1", "-1"];

                let m = jq.text().replace(/\s*/g, "").match(rxFloat);
                if (!m || m.length !== 2)
                    return ["-1", "-1"];

                return m;
            })();
            let _salaryNow = numberfy(salary[0]);
            let _salaryCity = numberfy(salary[1]);

            let skill = (() => {
                let jq = $block.find('td.title:contains("Уровень квалификации")').next("td");
                if (jq.length !== 1)
                    return ["-1", "-1", "-1"];

                // возможные варианты результата
                // 10.63 (в среднем по городу 9.39, требуется по технологии 6.74)
                // 9.30(в среднем по городу 16.62 )
                let m = jq.text().match(rxFloat);
                if (!m || m.length < 2)
                    return ["-1", "-1", "-1"];

                return [m[0], m[1], m[2] || "-1"];
            })();
            let _skillNow = numberfy(skill[0]);
            let _skillCity = numberfy(skill[1]);
            let _skillReq = numberfy(skill[2]);     // для лаб требования может и не быть

            let equip = (() => {
                let res = [-1, -1, -1, -1, -1, -1, -1];

                // число оборудования тупо не ищем. гемор  не надо
                
                // качество оборудования и треб по технологии
                let jq = $block.find('td.title:contains("Качество")').next("td");
                if (jq.length === 1) {
                    // 8.40 (требуется по технологии 1.00)
                    // или просто 8.40 если нет требований
                    let m = jq.text().match(rxFloat);
                    if (m && m.length > 0) {
                        res[2] = parseFloat(m[0]) || -1;
                        res[3] = parseFloat(m[1]) || -1;
                    }
                }

                // красный и черный и % износа
                // 1.28 % (25+1 ед.)
                // 0.00 % (0 ед.)
                let types = ["Износ", "Здоровье"];
                jq = $block.find("td.title").filter((i, el) => {
                    return types.some((t, i, arr) => $(el).text().indexOf(t) >= 0);
                });

                if (jq.length === 1) {
                    let rx = new RegExp(/(\d+\.\d+)\s*%\s*\((\d+)(?:\+(\d+))*.*\)/ig);
                    let m = rx.exec(jq.next("td").text());
                    if (m) {
                        // первым идет сама исходная строка
                        res[4] = parseFloat(m[1]);  // 0  или float.
                        res[5] = parseInt(m[2]);    // 0 или целое
                        res[6] = parseInt(m[3]) || -1; // красного может не быть будет undefined
                    }
                }

                return res;
            })();
            let _equipNum = equip[0];
            let _equipMax = equip[1];
            let _equipQual = equip[2];
            let _equipReq = equip[3];
            // % износа или здоровье животных для ферм.
            let _equipBroken = equip[4];
            // кол-во черного оборудования
            let _equipWearBlack = equip[5];
            // есть ли красное оборудование или нет
            let _equipWearRed = equip[6] > 0;

            let _managerPic = "";
            let _qual = (() => {
                let jq = $block.find("td.title:contains('Квалификация игрока')").next("td");
                if (jq.length !== 1)
                    return -1;

                return numberfy(jq.text());
            })();
            let _techLevel = (() => {
                let jq = $block.find("td.title:contains('Уровень технологии')").next("td");
                if (jq.length !== 1)
                    return -1;

                return numberfy(jq.text());
            })();

            // обработка картинки
            let [_img, _size] = ((): [string, number] => {
                let imgsrc = oneOrError($html, "#unitImage img").attr("src");
                let imgfile = imgsrc.split("/").pop();
                if (imgfile == null)
                    throw new Error(`какая то ошибка в обработке картинки ${imgsrc} юнита`);

                // в методе странно но номера символов походу не с 0 идут а с 1
                let imgname = imgfile.split(".")[0];    // без расширения уже
                let img = imgname.substring(0, imgname.length - 1 - 1);
                let size = numberfyOrError(imgname.substring(imgname.length - 1, imgname.length));

                return [img, size];
            })();

            // такой изврат с приведением из за компилера. надо чтобы работало
            let _type: UnitTypes = (UnitTypes as any)[_img] ? (UnitTypes as any)[_img] : UnitTypes.unknown;
            if (_type == UnitTypes.unknown)
                throw new Error("Не описан тип юнита " + _img);

            //  есть ли возможность вкорячить бустер производства типо солнечных панелей или нет. если не занято то втыкает
            let _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;

            // хз что это вообще
            let _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;

            let _onHoliday = !!$html.find("[href$=unset]").length;
            let _isStore = !!$html.find("[href$=trading_hall]").length;
            let _departments = numberfy($html.find('tr:contains("Количество отделов") td:eq(1)').text()) || -1;

            let $r = $html.find("tr:contains('Количество посетителей')");
            let _visitors = numberfy($r.find("td:eq(1)").text()) || -1;

            $r = $r.next("tr");
            let _service: ServiceLevels = ServiceLevels.none;
            {
                let txt = "";

                // для магазинов уровень в спец хинте лежит, для заправок/сервисов просто ячейка
                // но хинта может и не быть вовсе если маг в отпуске или товар нет
                if (_type === UnitTypes.shop)
                    txt = $r.find("div.productivity_hint div.title").text().trim();
                else
                    // last надо потому что может быть вложенная ячейка и нужно взять самую вложенную
                    txt = $html.find("td:contains(Уровень сервиса)").last().next("td").text().trim();

                if (txt.length > 1)
                    switch (txt.toLowerCase()) {
                    case "элитный":
                        _service = ServiceLevels.elite;
                        break;

                    case "очень высокий":
                        _service = ServiceLevels.higher;
                        break;

                    case "высокий":
                        _service = ServiceLevels.high;
                        break;

                    case "нормальный":
                        _service = ServiceLevels.normal;
                        break;

                    case "низкий":
                        _service = ServiceLevels.low;
                        break;

                    case "очень низкий":
                        _service = ServiceLevels.lower;
                        break;

                    case "не известен":
                        _service = ServiceLevels.none;
                        break;

                    default:
                        throw new Error("Не смог идентифицировать указанный уровень сервиса " + txt);
                }
            }

            return {
                type: _type,
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesReq: _employeesReq,

                salaryNow: _salaryNow,
                salaryCity: _salaryCity,

                skillNow: _skillNow,
                skillCity: _skillCity,
                skillReq: _skillReq,

                equipNum: _equipNum,
                equipMax: _equipMax,
                equipQual: _equipQual,
                equipReq: _equipReq,
                equipBroken: _equipBroken,
                equipWearBlack: _equipWearBlack,
                equipWearRed: _equipWearRed,

                managerPic: _managerPic,
                qual: _qual,
                techLevel: _techLevel,
                img: _img,
                size: _size,

                hasBooster: _hasBooster,
                hasAgitation: _hasAgitation,
                onHoliday: _onHoliday,
                isStore: _isStore,
                departments: _departments,
                visitors: _visitors,
                service: _service
            };
        }
    }
    catch (err) {
        throw err; // new ParseError("unit main page", url, err);
    }
}



interface IUnitEmployees {
    employees: number;
    required: number;
    efficiency: number;
    holidays: boolean;
}

interface IUnitEquipment {
    equipment: number;
    equipmentMax: number;
    quality: number;
    qualityRequired: number;

    brokenPct: number;
    brokenRed: number;
    brokenBlack: number;

    efficiency: number;
}

interface IMainBase extends IUnit {
    //img: string;
    efficiency: number;
    innovations: string[];
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

interface IMainFuel {
    rent: number;

    employees: IUnitEmployees;
    equipment: IUnitEquipment;

    visitors: number;
    service: ServiceLevels;
} 

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

// названия инноваций
let InnovationNames = {
    Parking: "Автомобильная парковка",
    PRAgent: "Партнёрский договор с рекламным агентством"
};

function parseUnitMainNew(html: any, url: string): IMainBase {
    let $html = $(html);

    try {
        if ($html.find(".unit_box").length > 0)
            throw new Error("Не работаю на новом интерфейсе");

        let mainBase = base();

        switch (mainBase.type) {
            case UnitTypes.warehouse:
                return $.extend({}, mainBase, ware(mainBase.size));

            case UnitTypes.shop:
                return $.extend({}, mainBase, shop(mainBase));

            case UnitTypes.fuel:
                return $.extend({}, mainBase, fuel());

            default:
                return mainBase;
        }
    }
    catch (err) {
        throw err; // new ParseError("unit main page", url, err);
    }

    // юнит, img, эффективность
    function base(): IMainBase {

        // subid 
        let n = extractIntPositive(url);
        if (n == null)
            throw new Error(`на нашел subid юнита в ссылке ${url}`);

        let subid = n[0];

        // 
        let $header = oneOrError($html, "div.headern");
        let [name, city] = parseUnitNameCity($header);

        // 
        let type = parseUnitType($header);
        let size = parseUnitSize($header);

        // эффективность может быть "не известна" для новых юнитов значит не будет прогресс бара
        let $td = $html.find("table.infoblock tr:contains('Эффективность работы') td.progress_bar").next("td");
        let eff = $td.length > 0 ? numberfyOrError($td.text(), -1) : 0;

        // инновации
        let innov: string[] = [];
        let $slots = $html.find("div.artf_slots"); // может отсутствовать вовсе если нет инноваций
        if ($slots.length > 0) {
            $slots.find("img[src^='/pub/artefact/']").each((i, el) => {
                let $img = $(el);

                // обычно выглядит так: Маркетинг / Автомобильная парковка
                let title = $img.attr("title");
                let items = title.split("/");
                let name = nullCheck(items[items.length - 1]).trim();

                innov.push(name);
            });
        }

        return {
            subid: subid,
            name: name,
            type: type,
            typeStr: UnitTypes[type],
            size: size,
            city: city,
            efficiency: eff,
            innovations: innov
        };
    }
    function baseOld(): IMainBase {

        // subid 
        let $a = oneOrError($html, "a[data-name='itour-tab-unit-view']");
        let n = extractIntPositive($a.attr("href"));
        if (n == null)
            throw new Error(`на нашел subid юнита`);

        let subid = n[0];

        // city
        // "    Расположение: Великие Луки ("
        let lines = getOnlyText(oneOrError($html, "div.office_place"));
        let arr = execOrError(lines[1].trim(), /^расположение:(.*)\(/i);
        //let city = lines[1].split(":")[1].split("(")[0].trim();
        let city = arr[1].trim();
        if (city == null || city.length < 1)
            throw new Error(`не найден город юнита ${city}`);

        // name
        let name = oneOrError($html, "#headerInfo h1").text().trim();

        // обработка картинки
        let imgsrc = oneOrError($html, "#unitImage img").attr("src");
        let imgfile = imgsrc.split("/").pop();
        if (imgfile == null)
            throw new Error(`какая то ошибка в обработке картинки ${imgsrc} юнита`);

        // в методе странно но номера символов походу не с 0 идут а с 1
        let imgname = imgfile.split(".")[0];    // без расширения уже

        let img = imgname.substring(0, imgname.length - 1 - 1);
        let size = numberfyOrError(imgname.substring(imgname.length - 1, imgname.length));

        // такой изврат с приведением из за компилера. надо чтобы работало
        let type: UnitTypes = (UnitTypes as any)[img] ? (UnitTypes as any)[img] : UnitTypes.unknown;
        if (type == UnitTypes.unknown)
            throw new Error("Не описан тип юнита " + img);

        //let unit: IUnit = { subid: subid, name: name, size: size, type: type, city: city };

        // эффективность может быть "не известна" для новых юнитов значит не будет прогресс бара
        let $td = $html.find("table.infoblock tr:contains('Эффективность работы') td.progress_bar").next("td");
        let eff = $td.length > 0 ? numberfyOrError($td.text(), -1) : 0;

        // инновации
        let innov: string[] = [];
        let $slots = $html.find("div.artf_slots"); // может отсутствовать вовсе если нет инноваций
        if ($slots.length > 0) {
            $slots.find("img[src^='/pub/artefact/']").each((i, el) => {
                let $img = $(el);

                // обычно выглядит так: Маркетинг / Автомобильная парковка
                let title = $img.attr("title");
                let items = title.split("/");
                let name = nullCheck(items[items.length - 1]).trim();

                innov.push(name);
            });
        }

        return {
            subid: subid,
            name: name,
            type: type,
            size: size,
            city: city,
            //img: img,
            typeStr: UnitTypes[type],
            efficiency: eff,
            innovations: innov
        };
    }

    function ware(size: number): IMainWare {
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

    function shop(base: IMainBase): IMainShop {
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

    function fuel(): IMainFuel {
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
    }

    function equipment(): IUnitEquipment {

        let $info = $html.find("table.infoblock"); // Район города  Расходы на аренду

        // Количество оборудования
        let str = $info.find("td.title:contains(Количество оборудования)").next("td").text();
        let n = extractIntPositive(str);
        if (n == null || n.length < 2)
            throw new Error("не нашли оборудование");

        let equipment = n[0];
        let equipmentMax = n.length > 1 ? n[1]: 0;

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

    function employees() {

        let $block = $html.find("table.infoblock");

        // Количество рабочих. может быть 0 для складов.
        // Возможные варианты для рабочих будут
        // 10(требуется ~ 1)
        // 10(максимум:1)
        // 1 000 (максимум:10 000) пробелы в числах!!
        // 10 ед. (максимум:1) это уже не включать
        let employees = 0;
        let employeesReq = 0;

        //let types = ["сотрудников", "работников", "учёных", "рабочих"];
        //let $r = $block.find(`td.title:contains(Количество сотрудников), 
        //                      td.title:contains(Количество работников),
        //                      td.title:contains(Количество учёных),
        //                      td.title:contains(Количество рабочих)`);
        


        //let empl = (() => {
        //    // Возможные варианты для рабочих будут
        //    // 10(требуется ~ 1)
        //    // 10(максимум:1)
        //    // 10 ед. (максимум:1) это уже не включать
        //    // 1 000 (максимум:10 000) пробелы в числах!!
        //    let types = ["сотрудников", "работников", "учёных", "рабочих"];
        //    let res = [-1, -1];

        //    //let emplRx = new RegExp(/\d+\s*\(.+\d+.*\)/g);
        //    //let td = jq.next("td").filter((i, el) => emplRx.test($(el).text()));
        //    let jq = $block.find('td.title:contains("Количество")').filter((i, el) => {
        //        return types.some((t, i, arr) => $(el).text().indexOf(t) >= 0);
        //    });

        //    if (jq.length !== 1)
        //        return res;

        //    // например в лаборатории будет находить вместо требований, так как их нет, макс число рабов в здании
        //    let m = jq.next("td").text().replace(/\s*/g, "").match(rxInt);
        //    if (!m || m.length !== 2)
        //        return res;

        //    return [parseFloat(m[0]), parseFloat(m[1])];
        //})();
        //let _employees = empl[0];
        //let _employeesReq = empl[1];
        //// общее число подчиненных по профилю
        //let _totalEmployees = numberfy($block.find('td:contains("Суммарное количество подчинённых")').next("td").text());

        //let salary = (() => {
        //    //let rx = new RegExp(/\d+\.\d+.+в неделю\s*\(в среднем по городу.+?\d+\.\d+\)/ig);
        //    let jq = $block.find('td.title:contains("Зарплата")').next("td");
        //    if (jq.length !== 1)
        //        return ["-1", "-1"];

        //    let m = jq.text().replace(/\s*/g, "").match(rxFloat);
        //    if (!m || m.length !== 2)
        //        return ["-1", "-1"];

        //    return m;
        //})();
        //let _salaryNow = numberfy(salary[0]);
        //let _salaryCity = numberfy(salary[1]);

        //let skill = (() => {
        //    let jq = $block.find('td.title:contains("Уровень квалификации")').next("td");
        //    if (jq.length !== 1)
        //        return ["-1", "-1", "-1"];

        //    // возможные варианты результата
        //    // 10.63 (в среднем по городу 9.39, требуется по технологии 6.74)
        //    // 9.30(в среднем по городу 16.62 )
        //    let m = jq.text().match(rxFloat);
        //    if (!m || m.length < 2)
        //        return ["-1", "-1", "-1"];

        //    return [m[0], m[1], m[2] || "-1"];
        //})();
        //let _skillNow = numberfy(skill[0]);
        //let _skillCity = numberfy(skill[1]);
        //let _skillReq = numberfy(skill[2]);     // для лаб требования может и не быть

    }

    function serviceFromStrOrError(str: string): ServiceLevels {

        switch (str.toLowerCase()) {
            case "элитный":
                return ServiceLevels.elite;

            case "очень высокий":
                return ServiceLevels.higher;

            case "высокий":
                return ServiceLevels.high;

            case "нормальный":
                return ServiceLevels.normal;

            case "низкий":
                return ServiceLevels.low;

            case "очень низкий":
                return ServiceLevels.lower;

            case "не известен":
                return ServiceLevels.none;

            default:
                throw new Error("Не смог идентифицировать указанный уровень сервиса " + str);
        }
    }
}

/**
 * В переданном хтмл пробует спарсить Имя юнита и Город расположения. Возвращает в таком же порядке
 * @param $html полная страница или хедер
 */
function parseUnitNameCity($html: JQuery): [string, string] {

    // city
    // Нижний Новгород (Россия, Поволжье)	
    let lines = oneOrError($html, "div.title:first p").text().trim().split("\n");
    let arr = execOrError(lines[0].trim(), /^(.*)\(/i);
    let city = arr[1].trim();
    if (city == null || city.length < 1)
        throw new Error(`не найден город юнита ${city}`);

    // name
    let name = oneOrError($html, "div.title:first h1").text().trim();
    if (name == null || name.length < 1)
        throw new Error(`не найдено имя юнита`);

    return [name, city];
}
/**
 * В переданном коде пробует спарсить размер юнита
 * @param $html полная страница или хедер
 */
function parseUnitSize($html: JQuery): number {

    // <div class="bg-image bgunit-shop_5"></div>
    let $div = oneOrError($html, "div.bg-image");

    let size = 0;
    let classList = $div.attr("class").split(/\s+/);
    for (let cl of classList) {
        // вырезаем тупо "bgunit-"
        // shop_5 || service_light_5
        if (cl.startsWith("bgunit-")) {
            let items = cl.slice(7).split("_");
            size = parseInt(items[items.length - 1]);

            if (isNaN(size))
                throw new Error("Невозможно спарсить размер юнита из " + cl);

            break;
        }
    }

    if (size <= 0)
        throw new Error("Невозможно спарсить размер юнита.");

    return size;
}
/**
 * С переданного хтмл пробует парсить тип юнита. Если 
 * @param $html полная страница или хедер
 */
function parseUnitType($html: JQuery): UnitTypes {

    let $div = oneOrError($html, "div.picture");

    let typeStr = "";
    let classList = $div.attr("class").split(/\s+/);
    for (let cl of classList) {

        // вырезаем тупо "bg-page-unit-header-"
        if (cl.startsWith("bg-page-unit-header-")) {
            typeStr = cl.slice(20);
            break;
        }
    }

    if (typeStr.length <= 0)
        throw new Error("Невозможно спарсить тип юнита");

    // некоторый онанизм с конверсией но никак иначе
    let type: UnitTypes = (UnitTypes as any)[typeStr] ? (UnitTypes as any)[typeStr] : UnitTypes.unknown;
    if (type == UnitTypes.unknown)
        throw new Error("Не описан тип юнита " + typeStr);

    return type;
}


/**
 * /lien/main/unit/view/4152881/finans_report
 * @param html
 * @param url
 */
function parseUnitFinRep(html: any, url: string): [Date, IUnitFinance][] {
    let $html = $(html);

    try {
        let res: [Date, IUnitFinance][] = [];

        // если в таблице нет данных, например только создали магазин, тогда не будет th заголовков.
        let $tbl = oneOrError($html, "table.treport");
        if ($tbl.find("th").length <= 0)
            return res;

        let $rows = $tbl.find("tr");

        // в лабораториях и других подобных юнитах есть тока расходы, а остальное отсутсвтует вообще строки
        let $header = $rows.eq(0);
        let $incom = $rows.filter(":contains('Доходы')");
        let $profit = $rows.filter(":contains('Прибыль')");
        let $tax = $rows.filter(":contains('Налоги')");
        let $expense = $rows.filter(":contains('Расходы')");
        if ($expense.length <= 0)
            throw new Error("Статья расходов не найдена. А она обязана быть");

        for (let i of [1, 2, 3, 4]) {
            let date = extractDate($header.children().eq(i).text());
            if (date == null)
                throw new Error("не могу извлечь дату из заголовка"+ $header.children().eq(i).html());

            res.push([date, {
                income: $incom.length > 0 ? numberfyOrError($incom.children().eq(i).text(), -1) : 0,
                expense: numberfyOrError($expense.children().eq(i).text(), -1),
                profit: $profit.length > 0 ? numberfy($profit.children().eq(i).text()) : 0,      // может быть и отрицат
                tax: $tax.length > 0 ? numberfyOrError($tax.children().eq(i).text(), -1) : 0
            }]);
        }

        return res;
    }
    catch (err) {
        logDebug(`error on ${url}`);
        throw err;
    }
}

/**
 * Финансовый отчет по товарам для магазина/заправки
   /olga/window/unit/view/6885676/finans_report/by_production
 * @param html
 * @param url
 */
function parseUnitFinRepByProd(html: any, url: string): IDictionary<[number,number,number]> {
    let $html = $(html);

    try {
        let res: IDictionary<[number, number, number]> = {};

        // для магазов где нет торговли будет пустая страница и ничего не будет
        // для window таблица идет без парент тега надо искать иначе
        let $tbl = $html.filter("table.grid");
        if ($tbl.length <= 0)
            $tbl = $html.find("table.grid");

        if ($tbl.length <= 0)
            return res;

        if ($tbl.length > 1)
            throw new Error("Нашли 2 таблицы table.grid вместо 1");

        let $rows = $tbl.find("tr.even, tr.odd");
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            let img = oneOrError($r, "img").attr("src");
            let sold = numberfyOrError($tds.eq(1).text(), -1);
            let turn = numberfyOrError($tds.eq(2).text(), -1);
            let prime = numberfyOrError($tds.eq(3).text(), -1);

            res[img] = [sold, turn, prime];
        });
        

        return res;
    }
    catch (err) {
        logDebug(`error on ${url}`);
        throw err;
    }
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
                        unit: { subid: subid, type: UnitTypes.unknown, typeStr:"unknown", name: unitName, size: 0, city: "" },
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
                    }
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


/**
 * все продавцы данного продукта ВООБЩЕ /"+realm+"/main/globalreport/marketing/by_products/"+mapped[url].productId[i]
 * @param html
 * @param url
 */
function parseProductReport(html: any, url: string): IProductReport {
    let $html = $(html);

    try {
        let $rows = $html.find(".grid").find("tr.odd, tr.even");

        // Макс ограничение на контракт. -1 если без.
        let _max = $rows.find("td.nowrap:nth-child(2)").map((i, e) => {
            let $span = $(e).find("span");
            if ($span.length !== 1)
                return -1;

            return numberfy($span.text().split(":")[1]);
        }).get() as any as number[];

        // общее число на складе. может быть 0
        let _total = $rows.find("td.nowrap:nth-child(2)").map((i, e) => {
            let txt = $(e).clone().children().remove().end().text().trim();
            if (txt.length === 0)
                throw new Error("total amount not found");

            return numberfy(txt);
            }).get() as any as number[];
        let _available = $rows.find("td.nowrap:nth-child(3)").map((i, e) => numberfy($(e).text())).get() as any as number[];

        // не могут быть 0 по определению
        let _quality = $rows.find("td.nowrap:nth-child(4)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
        let _price = $rows.find("td.nowrap:nth-child(5)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        // может быть независимый поставщик БЕЗ id. для таких будет -1 id
        let _subid = $rows.find("td:nth-child(1) td:nth-child(1)").map((i, e) => {
            let jq = $(e).find("a");
            if (jq.length !== 1)
                return -1;

            let m = jq.attr("href").match(/\d+/);
            return numberfy(m ? m[0] : "-1");
            }).get() as any as number[];

        return {
            max: _max,
            total: _total,
            available: _available,
            quality: _quality,
            price: _price,
            subid: _subid
        };
    }
    catch (err) {
        throw new ParseError("product report", url, err);
    }
}

/**
 * "/"+realm+"/main/company/view/"+companyid+"/unit_list/employee/salary"
 * @param html
 * @param url
 */
function parseEmployees(html: any, url: string): IEmployees {
    let $html = $(html);

    try {
        let $rows = $html.find("table.list").find(".u-c").map((i, e) => $(e).closest("tr").get());

        let _id = $rows.find(":checkbox").map((i, e) => numberfyOrError($(e).val())).get() as any as number[];

        // может быть 0 в принципе
        let _salary = $rows.find("td:nth-child(7)").map((i, e) => {
            let txt = getInnerText(e).trim();
            if (txt.length === 0)
                throw new Error("salary not found");

            return numberfy(txt);
        }).get() as any as number[];

        // не может быть 0
        let _salaryCity = $rows.find("td:nth-child(8)").map((i, e) => {
            let txt = getInnerText(e).trim(); // тут низя удалять ничо. внутри какой то инпут сраный и в нем текст
            if (txt.length === 0)
                throw new Error("salary city not found");

            return numberfyOrError(txt);
        }).get() as any as number[];

        // может быть 0
        let _skill = $rows.find("td:nth-child(9)").map((i, e) => {
            let txt = $(e).text().trim();  // может быть a тег внутри. поэтому просто текст.
            if (txt.length === 0)
                throw new Error("skill not found");

            return numberfy(txt);
        }).get() as any as number[];
        let _skillRequired = $rows.find("td:nth-child(10)").map((i, e) => {
            let txt = $(e).text().trim();  // может быть a тег внутри. поэтому просто текст.
            if (txt.length === 0)
                throw new Error("skill not found");

            return numberfy(txt);
        }).get() as any as number[];

        let _onHoliday = $rows.find("td:nth-child(11)").map((i, e) => !!$(e).find(".in-holiday").length).get() as any as boolean[];

        // может отсутстовать если мы в отпуске -1 будет
        let _efficiency = $rows.find("td:nth-child(11)").map((i, e) => {
            let txt = getInnerText(e).trim();
            return numberfy(txt || "-1");
        }).get() as any as string[];

        return {
            id: _id,
            salary: _salary,
            salaryCity: _salaryCity,
            skill: _skill,
            skillRequired: _skillRequired,
            onHoliday: _onHoliday,
            efficiency: _efficiency
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
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


interface IProductProperties {
    price: number;
    quality: number;
    brand: number;
}

interface IStock {
    available: number;
    product: IProductProperties;
}

interface IRetailStock extends IStock {
    sold: number;
    deliver: number;
    ordered: number;
}

interface ISupplyStock extends IStock {
    total: number;
    purchased: number;
}

// буквы большие обязательны. иначе не работает отправка на сервер
enum ConstraintTypes {
    Abs, Rel
}
interface IContractConstraints {
    type: ConstraintTypes;      // тип. Abs, Rel берется тупо из селекта
    price: number;              // при Abs это ценник
    priceMarkUp: number;        // а при Rel номер опции.
    minQuality: number;
}
interface IBuyContract {
    offer: IOffer;
    ordered: number;
    constraints: IContractConstraints;
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
                let cminQ = numberfyOrError(oneOrError($td, "input[name^='supplyContractData[quality_constraint_min]']").val(), -1);
                let maxPrice = numberfyOrError(oneOrError($td, "input.contractConstraintPriceAbs").val(), -1);
                let relPriceMarkUp = numberfyOrError(oneOrError($td, "select.contractConstraintPriceRel").val(), -1);


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
                    }
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

/**
 * Со страницы с тарифами на энергию парсит все тарифы на энергию по всем отраслям для данного региона
 * @param html
 * @param url
 */
function parseEnergyPrices(html: any, url: string): IDictionary<IEnergyPrices> {
    let $html = $(html);

    let res: IDictionary<IEnergyPrices> = {};

    try {

        let $rows = $html.find("tr").has("img");
        for (let i = 0; i < $rows.length; i++) {
            let $r = $rows.eq(i);

            let $tds = $r.children("td");

            let sector = $tds.eq(0).text().trim();
            let energyPrice = numberfyOrError($tds.eq(2).text().split("/")[0], -1);
            let products = parseProducts($tds.eq(1));

            if (res[sector] != null)
                throw new Error("Повторилась отрасль " + sector);

            res[sector] = { sector: sector, price: energyPrice, products: products }
        }

        return res;
    }
    catch (err) {
        throw err;
    }

    // собирает все продукты из ячейки
    function parseProducts($td: JQuery): IProduct[] {
        let $imgs = $td.eq(0).find("img");

        let res: IProduct[] = [];
        for (let i = 0; i < $imgs.length; i++) {
            let $pic = $imgs.eq(i);

            // название продукта Спортивное питание, Маточное молочко и так далее
            let name = $pic.attr("title").trim();
            if (name.length === 0)
                throw new Error("Имя продукта пустое.");

            // номер продукта
            let m = $pic.parent("a").attr("href").match(/\d+/);
            if (m == null)
                throw new Error("id продукта не найден");

            let id = numberfyOrError(m[0], 0);  // должно быть больше 0 полюбому
            let img = $pic.attr("src");

            res.push({
                name: name,
                img: img,
                id: id
            });
        }

        return res;
    };
}


interface IRegion {
    id: number;         // номер региона
    name: string;       // имя. Азербайджан и т.д
    tax: number;        // налоги. пока так заготовка лишь
    countryName: string;    // страна в которую входит
}

interface ICountry {
    id: number;         // номер страны
    name: string;       // имя. Азербайджан и т.д
}

interface ICity {
    id: number;         // номер города
    name: string;       // имя. Азербайджан и т.д
    countryName: string;    // страна строкой
    population: number;
    salary: number;     // зарплата
    eduLevel: number;   // уровень образования
}

/**
 * /olga/main/common/main_page/game_info/bonuses/country
 * @param html
 * @param url
 */
function parseCountries(html: any, url: string): ICountry[] {
    let $html = $(html);

    try {

        let $tds = $html.find("td.geo");
        let countries = $tds.map((i, e): ICountry => {
            let $a = oneOrError($(e), "a[href*=regionlist]");

            let m = matchedOrError($a.attr("href"), /\d+/i);
            return {
                id: numberfyOrError(m, 0),
                name: $a.text().trim()
            };
        }).get() as any as ICountry[];

        return countries;
    }
    catch (err) {
        throw err;
    }
}

function parseRegions(html: any, url: string): IRegion[] {
    let $html = $(html);

    try {
        let $rows = closestByTagName($html.find("td.geo"), "tr");

        let res: IRegion[] = [];
        $rows.each((i, el) => {
            let $r = $(el);
            let $geo = oneOrError($r, "td.geo");
            let $a = oneOrError($geo, "a[href*=citylist]");

            let m = matchedOrError($a.attr("href"), /\d+/i);
            res.push({
                id: numberfyOrError(m, 0),
                name: $a.text().trim(),
                tax: numberfyOrError($r.children("td").eq(8).text()),
                countryName: $geo.attr("title")
            });
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}

function parseCities(html: any, url: string): ICity[] {
    let $html = $(html);

    try {

        let $rows = closestByTagName($html.find("td.geo"), "tr");
        let towns = $rows.map((i, e): ICity => {
            let $r = $(e);
            let $tds = $r.children("td");

            let country = $tds.eq(0).attr("title").trim();
            if (country.length < 2)
                throw new Error("Ошибка парсинга имени страны");

            let $a = oneOrError($tds.eq(0), "a[href*=city]");
            let name = $a.text().trim();
            if (country.length < 2)
                throw new Error("Ошибка парсинга имени города");

            let str = matchedOrError($a.attr("href"), /\d+/i);
            let id = numberfyOrError(str, 0);

            return {
                id: id,
                name: name,
                countryName: country,
                population: 1000*numberfyOrError($tds.eq(1).text(), 0),
                salary: numberfyOrError($tds.eq(2).text(), 0),
                eduLevel: numberfyOrError($tds.eq(3).text(), 0),
            }
        }).get() as any as ICity[];

        return towns;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Со странички пробуем спарсить игровую дату. А так как дата есть почти везде, то можно почти везде ее спарсить
 * Вывалит ошибку если не сможет спарсить дату со странички
 * @param html
 * @param url
 */
function parseGameDate(html: any, url: string): Date {
    let $html = $(html);

    try {
        // вытащим текущую дату, потому как сохранять данные будем используя ее
        let $date = $html.find("div.date_time");
        if ($date.length !== 1)
            throw new Error("Не получилось получить текущую игровую дату");

        let currentGameDate = extractDate(getOnlyText($date)[0].trim());
        if (currentGameDate == null)
            throw new Error("Не получилось получить текущую игровую дату");

        return currentGameDate;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Парсит данные по числу рабов со страницы управления персоналам в Управлении
 * @param html
 * @param url
 */
function parseManageEmployees(html: any, url: string) {
    if (html == null)
        throw new Error("страница пуста. парсить нечего");

    let $html = $(html);

    function getOrError<T>(n: T | null) {
        if (n == null)
            throw new Error("Argument is null");

        return n as T;
    }

    try {

        let $rows = $html.find("tr").has("td.u-c");

        let units: IDictionaryN<IEmployeesNew> = {};
        $rows.each((i, e) => {
            let $r = $(e);
            let $tds = $r.children("td");

            let n = extractIntPositive($tds.eq(2).find("a").eq(0).attr("href"));
            if (n == null || n.length === 0)
                throw new Error("не смог извлечь subid");

            let _subid = n[0];

            let _empl = numberfyOrError($tds.eq(4).text(), -1);
            let _emplMax = numberfyOrError($tds.eq(5).text(), -1);

            let _salary = numberfyOrError(getOnlyText($tds.eq(6))[0], -1);
            let _salaryCity = numberfyOrError($tds.eq(7).text(), -1);

            let $a = $tds.eq(8).find("a").eq(0);
            let _qual = numberfyOrError($a.text(), -1);
            let _qualRequired = numberfyOrError($tds.eq(9).text(), -1);

            let $tdEff = $tds.eq(10);
            let _holiday = $tdEff.find("div.in-holiday").length > 0;
            let _eff = -1;
            if (!_holiday)
                _eff = numberfyOrError($tdEff.text(), -1);

            units[_subid] = {
                subid: _subid,
                empl: _empl,
                emplMax: _emplMax,
                salary: _salary,
                salaryCity: _salaryCity,
                qual: _qual,
                qualRequired: _qualRequired,
                eff: _eff,
                holiday: _holiday
            };
        });

        return units;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Парсит страницу отчета по рекламе, собирает всю инфу по всем юнитам где реклама есть. Где рекламы нет
 * те не выводятся в этой таблице их надо ручками парсить
 * @param html
 * @param url
 */
function parseCompAdsReport(html: any, url: string) {
    let $html = $(html);

    try {
        // заберем таблицы по сервисам и по торговле, а рекламу офисов не будем брать. числануть тока по шапкам
        let $tbls = isWindow($html, url)
            ? $html.filter("table.grid").has("th:contains('Город')")
            : $html.find("table.grid").has("th:contains('Город')");

        let $rows = $tbls.find("tr").has("a[href*='unit']");  // отсекаем шапку оставляем тока чистые

        let units: IDictionaryN<IAdsNew> = {};
        $rows.each((i, e) => {
            let $r = $(e);
            let $tds = $r.children("td");

            let n = extractIntPositive($tds.eq(1).find("a").eq(0).attr("href"));
            if (n == null || n.length === 0)
                throw new Error("не смог извлечь subid");

            let _subid = n[0];
            let _budget = numberfyOrError($tds.eq(2).text(), 0);

            let init = $tds.length > 8 ? 4 : 3;
            let _effAd = numberfyOrError($tds.eq(init).text(), -1);
            let _effUnit = numberfyOrError($tds.eq(init+1).text(), -1);
            let _celebrity = numberfyOrError($tds.eq(init+2).text().split("(")[0], -1);
            let _visitors = numberfyOrError($tds.eq(init+3).text().split("(")[0], -1);
            let _profit = numberfy($tds.eq(init+4).text());

            units[_subid] = {
                subid: _subid,
                budget: _budget,
                celebrity: _celebrity,
                visitors: _visitors,
                effAd: _effAd,
                effUnit: _effUnit,
                profit: _profit
            };
        });

        return units;
    }
    catch (err) {
        throw err;
    }
}

/**
 * Со страницы со всеми продуктами игры парсит их список
 * /lien/main/common/main_page/game_info/products
 * Брендовые товары здесь НЕ отображены и парсены НЕ БУДУТ
 * @param html
 * @param url
 */
function parseProducts(html: any, url: string): IDictionary<IProduct> {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.list")
            : $html.find("table.list");

        let $items = $tbl.find("a").has("img");
        if ($items.length === 0)
            throw new Error("не смогли найти ни одного продукта на " + url);

        let dict: IDictionary<IProduct> = {};
        $items.each((i, el) => {
            let $a = $(el);

            let _img = $a.find("img").eq(0).attr("src");

            // название продукта Спортивное питание, Маточное молочко и так далее
            let _name = $a.attr("title").trim();
            if (_name.length === 0)
                throw new Error("Имя продукта пустое.");

            // номер продукта
            let m = matchedOrError($a.attr("href"), /\d+/);
            let _id = numberfyOrError(m, 0);  // должно быть больше 0 полюбому

            dict[_img] = {id: _id,  name: _name, img: _img };
        });

        return dict;
    }
    catch (err) {
        throw err;
    }
}

interface IUnitFinance {
    income: number;     // доходы
    expense: number;    // расходы
    profit: number;     // прибыль
    tax: number;        // налоги
}

/**
 * /olga/main/company/view/6383588/finance_report/by_units/
 * @param html
 * @param url
 */
function parseFinanceRepByUnits(html: any, url: string): IDictionaryN<IUnitFinance> {
    let $html = $(html);

    try {
        let $grid = $html.find("table.grid");
        if ($grid.length === 0)
            throw new Error("Не найдена таблица с юнитами.");

        let $rows = closestByTagName($grid.find("img[src*='unit_types']"), "tr");
        let res: IDictionaryN<IUnitFinance> = {};
        $rows.each((i, el) => {
            let $r = $(el);

            let unithref = $r.find("a").attr("href");
            let n = extractIntPositive(unithref);
            if (n == null)
                throw new Error("не смог определить subid для " + unithref);

            let subid = n[0];

            let incomInd = $grid.find("th:contains('Доходы')").index();
            let expInd = $grid.find("th:contains('Расходы')").index();
            let profitInd = $grid.find("th:contains('Прибыль')").index();
            let taxInd = $grid.find("th:contains('Налоги')").index();
            if (incomInd < 0 || expInd < 0 || profitInd < 0 || taxInd < 0)
                throw new Error("не нашли колонки с прибыль, убыток, налоги");

            let income = numberfy($r.children("td").eq(incomInd).text());
            let exp = numberfy($r.children("td").eq(expInd).text());
            let profit = numberfy($r.children("td").eq(profitInd).text());
            let tax = numberfyOrError($r.children("td").eq(taxInd).text(), -1);  // налоги всегда плюсовыве

            res[subid] = {
                expense: exp,
                income: income,
                profit: profit,
                tax: tax
            };
        });

        return res;
    }
    catch (err) {
        throw err;
    }
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

interface IOffer {
    id: number;
    companyName: string;
    isIndependend: boolean; // независимых пометим особой меткой
    unit: IUnit;    // по юниту уже можно понять чей это склад лично мой или нет
    self: boolean;  // это не говорит о том что мой юнит, либо мой либо в корпе либо мне открыл кто то
    maxLimit: number | null; // ограничение на макс закупку у поставщика
    origPrice: number | null; // цена поставщика без учета таможни и доставки
    stock: ISupplyStock;
    tmImg: string;  // если предлагает ТМ то путь на картинку ТМ товара либо ""
}

// TODO: запилить парсинг имени юнита везде где он используется
/**
 * Парсит страничку со снабжением магазинов, складов и так далее.
   /lien/window/unit/supply/create/4038828/step2
 * @param html
 * @param url
 */
function parseSupplyCreate(html: any, url: string): IOffer[] {
    let $html = $(html);

    try {
        let $rows = $html.find("table.unit-list-2014 tr[id^='r']");
        let res: IOffer[] = [];
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            let isIndependent = $tds.eq(1).text().toLowerCase().indexOf("независимый поставщик") >= 0;

            // ТМ товары идет отдельным списком и их надо выделять
            let tmImg = $tds.eq(0).find("img").attr("src") || "";

            // для независимого поставщика номера юнита нет и нет имени компании
            let subid = 0;
            let companyName = "Независимый поставщик";
            let unitName = "Независимый поставщик";
            if (!isIndependent) {
                let str = $tds.eq(1).find("a").attr("href");
                let nums = extractIntPositive(str);
                if (nums == null || nums.length < 1)
                    throw new Error("невозможно subid для " + $tds.eq(1).text());

                subid = nums[0];

                // есть такие мудаки которые не имеют имени компании вообще. это швиздец. ставим им некое штатное
                // pidoras имя и дальше они с ним внутри игры будут. сразу они в ЧС рукой добавлены чтобы у них ничо не бралось
                companyName = $tds.eq(1).find("b").text();
                if (companyName.length <= 0) {
                    logDebug(`имя компании поставщика юнит ${subid} не спарсилось. присваиваю имя pidoras`);
                    companyName = "pidoras";
                }

                unitName = oneOrError($tds.eq(1), "a").text();
                if (unitName.length <= 0)
                    throw new Error(`имя подразделения компании ${companyName} юнит ${subid} не спарсилось`);
            }

            // если поставщик независимый и его субайди не нашли, значит на складах дохера иначе парсим
            let available = isIndependent ? Number.MAX_SAFE_INTEGER: 0;
            let total = isIndependent ? Number.MAX_SAFE_INTEGER : 0;
            let maxLimit = 0;
            if (!isIndependent) {
                let nums = extractIntPositive($tds.eq(3).html());
                if (nums == null || nums.length < 2)
                    throw new Error("невозможно получить количество на складе и свободное для покупки для " + $tds.eq(1).text());

                available = nums[0];
                total = nums[1];

                // на окне снабжения мы точно не видим сколько же реальный лимит если товара меньше чем лимит
                // реальный лимит мы увидим тока в магазине когда подцепим поставщика
                if ($tds.eq(3).find("u").length > 0)
                    maxLimit = available;
            }

            // свой юнит или открытый для меня, он всегда выводится даже если available 0. Другие включая корп не выводятся если 0
            // поэтому если юнит видим и доступно 0, значит он self
            let offer = numberfyOrError(($r.prop("id") as string).substr(1));
            let self = $r.hasClass("myself") || available <= 0;

            // цены ВСЕГДА ЕСТЬ. Даже если на складе пусто
            // это связано с тем что если склад открыт для покупки у него цена больше 0 должна стоять
            // Есть цена поставщика, на которую работает ограничение по макс цене, и есть конечная цена
            let origPrice = numberfyOrError($tds.eq(4).text());

            let nums = extractFloatPositive($tds.eq(5).html());
            if (nums == null || nums.length < 1)
                throw new Error("невозможно получить цену.");

            let price = nums[0];

            // кача и бренда может не быть если объем на складе у нас 0, иначе быть обязан для розницы
            // для НЕ розницы бренда не будет, поэтому последнее может быть -1 или 0 как повезет
            let quality = numberfy($tds.eq(6).text());
            quality = quality < 0 ? 0 : quality;
            if (available > 0 && quality < 1)
                throw new Error(`качество поставщика ${offer} не найдено`);

            let brand = numberfy($tds.eq(7).text());   // не может быть меньше 1 по факту
            brand = brand < 0 ? 0 : brand;

            let productProp: IProductProperties = {
                price: price,
                quality: quality,
                brand: brand
            }

            let supp: IOffer = {
                id: offer,
                companyName: companyName,
                self: self,
                isIndependend: isIndependent,
                unit: { subid: subid, type: UnitTypes.unknown, typeStr: "unknown", name: unitName, size: 0, city: "" },
                maxLimit: maxLimit > 0 ? maxLimit : null,
                origPrice: origPrice,
                stock: {
                    available: available,
                    total: total,
                    purchased: 0,
                    product: productProp
                },
                tmImg: tmImg
            };

            res.push(supp);
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}

enum MarketIndex {
    None = -1, E, D, C, B, A, AA, AAA
}
function mIndexFromString(str: string): MarketIndex {
    let index = MarketIndex.None;
    switch (str) {
        case "AAA":
            return MarketIndex.AAA;

        case "AA":
            return MarketIndex.AA;

        case "A":
            return MarketIndex.A;

        case "B":
            return MarketIndex.B;

        case "C":
            return MarketIndex.C;

        case "D":
            return MarketIndex.D;

        case "E":
            return MarketIndex.E;

        case "?":
        case "None":
            return MarketIndex.None;

        default:
            throw new Error(`Неизвестный индекс рынка: ${str}`);
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
            product: { id: id, img: img, name: name},
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

/**
 * Размеры товаров. Задает сколько метров склада надо на 1 штуку товара
   /lien/main/industry/unit_type/info/2011/volume
   
 * @param html
 * @param url
 */
function parseProductsSize(html: any, url: string): IDictionaryN<[IProduct, number]> {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.grid")
            : $html.find("table.grid");

        let $rows = closestByTagName($tbl.find("img"), "tr");
        if ($rows.length < 100)
            throw new Error('слишком мало товаров найдено. очевидно ошибка');

        let res: IDictionaryN<[IProduct, number]> = {};
        $rows.each((i, el) => {
            let $r = $(el);

            let $img = oneOrError($r, "img");
            let img = $img.attr("src");
            let name = $img.attr("title");

            let n = extractIntPositive($r.find("a").eq(0).attr("href"));
            if (n == null || n.length > 1)
                throw new Error("не найден id продукта " + img);

            let id = n[0];

            // сколько штук влазит в 5млн метров склада
            let quant = numberfyOrError($r.find("td").last().text());

            // на выходе дадим сколько метров надо на 1 штуку товара
            res[id] = [{ id: id, img: img, name: name }, 5000000 / quant];
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}

interface ICountryDuties {
    ip: number;
    import: number;
    export: number;
}

/**
 * Таможенные пошлины и индикативные цены img = duties
 * @param html
 * @param url
 */
function parseCountryDuties(html: any, url: string): IDictionary<ICountryDuties> {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.list")
            : $html.find("table.list");

        if ($tbl.length <= 0)
            throw new Error("Не найдена таблица с товарами.");

        let $img = $tbl.find("td:nth-child(5n-4)");
        let $exp = $tbl.find("td:nth-child(5n-2)");
        let $imp = $tbl.find("td:nth-child(5n-1)");
        let $ip = $tbl.find("td:nth-child(5n)");
        if ($img.length !== $ip.length)
            throw new Error("картинок товара и индикативных цен найдено разное число");

        // в таблице есть пробелы, поэтому если картинки нет значит это пробел
        let dict: IDictionary<ICountryDuties> = {};
        for (let i = 0; i < $ip.length; i++) {
            let img = $img.eq(i).find("img").attr("src");
            if (img == null || img.length <= 0)
                continue;
            
            dict[img] = {
                export: numberfyOrError($exp.eq(i).text(), -1),
                import: numberfyOrError($imp.eq(i).text(), -1),
                ip: numberfyOrError($ip.eq(i).text())
            };
        }

        return dict;
    }
    catch (err) {
        throw err;
    }
}

/**
 * /olga/main/globalreport/tm/info
 * @param html
 * @param url
 */
function parseTM(html: any, url: string): IDictionary<string> {
    let $html = $(html);

    try {
        let $imgs = isWindow($html, url)
            ? $html.filter("table.grid").find("img")
            : $html.find("table.grid").find("img");

        if ($imgs.length <= 0)
            throw new Error("Не найдено ни одного ТМ товара.");

        let dict: IDictionary<string> = {};
        $imgs.each((i, el) => {
            let $img = $(el);

            let img = $img.attr("src");
            let lines = getOnlyText($img.closest("td").next("td"));
            if (lines.length !== 4)
                throw new Error("ошибка извлечения имени товара франшизы для " + img);

            dict[img] = lines[1].trim();
        });

        return dict;
    }
    catch (err) {
        throw err;
    }
}

//
// аналитические отчеты
//

interface ISpecReportItem {
    product: IProduct;
    specialization: string; // спецуха строкой
    factoryID: number;      // айди фабрики где данная спецуха. бывает что на разных фабриках может быть одна
    unitCount: number;      // число предприятий
    quantity: number;       // сколько производится единиц
}

/**
 * Парсер отчета по производственным специализациям со страницы аналитических отчетов
   /olga/main/mediareport
 * @param html
 * @param url
 */
function parseReportSpec(html: any, url: string): ISpecReportItem[] {
    let $html = $(html);

    try {
        let $table = isWindow($html, url)
            ? $html.filter("table.list")
            : $html.find("table.list");
        if ($table.length <= 0)
            throw new Error("Не найдена таблица с данными");

        let $rows = $table.find("img").closest(".even, .odd");  // в каждой строке картинка товара, но картинки есть и в других местах
        if ($rows.length < 5)
            throw new Error(`найдено слишком мало(${$rows.length}) специализаций в отчете ${url}`);

        let res: ISpecReportItem[] = [];
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            // спецуха
            let $a = oneOrError($tds.eq(0), "a");
            let spec = $a.text();
            let n = extractIntPositive($a.attr("href"));
            if (n == null || n.length != 1)
                throw new Error("не нашли id завода " + spec);

            let fid = n[0]; // id завода. есть товары которые на разных заводах можно делать а спецуха одинакова

            // товар
            let $img = oneOrError($tds.eq(1), "img");
            let img = $img.attr("src");
            let name = $img.attr("alt");

            $a = $img.closest("a");
            n = extractIntPositive($a.attr("href"));
            if (n == null || n.length != 1)
                throw new Error("не нашли id товара " + img);

            let id = n[0];

            // производство 
            let units = numberfyOrError($tds.eq(2).text(), -1);
            let quant = numberfyOrError(getInnerText($tds.get(3)), -1);

            res.push({
                product: { id: id, img: img, name: name },
                specialization: spec,
                factoryID: fid,
                quantity: quant,
                unitCount: units
            });
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}

function parseX(html: any, url: string) {
    //let $html = $(html);

    //try {
    //    let _size = $html.find(".nowrap:nth-child(2)").map((i, e) => {
    //        let txt = $(e).text();
    //        let sz = numberfyOrError(txt);
    //        if (txt.indexOf("тыс") >= 0)
    //            sz *= 1000;

    //        if (txt.indexOf("млн") >= 0)
    //            sz *= 1000000;

    //        return sz;
    //    }).get() as any as number[];
    //    let _rent = $html.find(".nowrap:nth-child(3)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
    //    let _id = $html.find(":radio").map((i, e) => numberfyOrError($(e).val())).get() as any as number[];

    //    return {
    //        size: _size,
    //        rent: _rent,
    //        id: _id
    //    };
    //}
    //catch (err) {
    //    throw new ParseError("ware size", url, err);
    //}
}