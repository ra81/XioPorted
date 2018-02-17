//
// Сюда все функции которые парсят данные со страниц
//

// Политики сбыта на заводах/складах
enum SalePolicies {
    nosale = 0,
    any,
    some,
    company,
    corporation
}

interface IUnit {
    subid: number;
    name: string;
    type: UnitTypes;
    typeStr: string;
    size: number;
    city: string;
}

// товар в игре. Имя, картинка и номер. Уникально идентифицирует
interface IProduct {
    name: string;
    img: string;    // полный путь картинки /img/products/clay.gif или /img/products/brand/clay.gif
    id: number
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

// непосредственно уже контракт. с оффером и ограничениями по цене качу. Уже заключенное нечто.
interface IBuyContract {
    offer: IOffer;
    ordered: number;
    constraints: IContractConstraints;
    instant: boolean;
}

// предложение, НЕ контракт. По факту все на странице заказа товара в маг и есть оффера.
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

interface ISale {
    form: JQuery;
    policy: number[];
    price: number[];
    incineratorMaxPrice: number[];

    outamount: number[];
    outqual: number[];
    outprime: number[];

    stockamount: number[];
    stockqual: number[];
    stockprime: number[];

    product: string[];
    productId: number[];
    region: string;
    contractpage: boolean;
    contractprice: string | number[];
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


// информация о товаре в хранилище. Кол-во, качество, цена, бренд
interface IStorageData {
    quantity: number;
    quality: number;
    price: number;
    brand: number;
}
interface ISaleProductData {
    product: IProduct;
    stock: IStorageData;
    out: IStorageData;
    freeQuantity: number;
    orderedQuantity: number;
    salePolicy: number;
    salePrice: number;
}
interface ISaleContract {
    UnitType: string;
    CompanyName: string;
    UnitId: string;
    Purchased: number;  // закуплено в пересчет
    Ordered: number;    // заказано на след пересчет
    Price: number;      // цена контракта
}
interface ISaleNew {
    region: string;
    form: JQuery;
    incineratorMaxPrice: number[];
    products: IDictionary<ISaleProductData>;

    contractpage: boolean;
    contracts: IDictionary<ISaleContract[]>;
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


interface IUnitAds {
    celebrity: number;
    pop: number;
    budget: number;
    requiredBudget: number;
}
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


interface IUnitSalary {
    employees: number;
    maxEmployees: number;
    form: JQuery;
    salaryNow: number;
    salaryCity: number;
    skillNow: number;
    skillCity: number;
    skillReq: number;
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
        let _maxEmployees = numberfy($html.find("tr:contains('Максимальное количество')").last().find("td.text_to_left").text());
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


interface IMain {
    type: UnitTypes;
    employees: number;
    totalEmployees: number;
    employeesReq: number;

    salaryNow: number;
    salaryCity: number;

    skillNow: number;
    skillCity: number,
    skillReq: number;

    equipNum: number;
    equipMax: number;
    equipQual: number;
    equipReq: number;

    equipBroken: number;
    equipWearBlack: number;
    equipWearRed: boolean;

    managerPic: string;
    qual: number;
    techLevel: number;
    img: string;
    size: number;
    hasBooster: boolean;
    hasAgitation: boolean;
    onHoliday: boolean;
    isStore: boolean;
    departments: number;
    visitors: number;
    service: ServiceLevels;
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

function parseUnitMainNew(html: any, url: string): IMainBase {
    let $html = $(html);

    try {
        if ($html.find(".unit_box").length > 0)
            throw new Error("Не работаю на новом интерфейсе");

        let mainBase = base();

        switch (mainBase.type) {
            case UnitTypes.warehouse:
                return $.extend({}, mainBase, wareMain($html, mainBase.size));

            case UnitTypes.shop:
                return $.extend({}, mainBase, shopMain($html, mainBase));

            case UnitTypes.fuel:
                return $.extend({}, mainBase, fuelMain($html));

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
}


/**
 * В переданном хтмл пробует спарсить Имя юнита и Город расположения. Возвращает в таком же порядке
 * @param $html полная страница или хедер
 */
function parseUnitNameCity($html: JQuery): [string, string] {
    let x: IProduct;
    // name
    let name = oneOrError($html, "div.title:first h1").text().trim();
    if (name == null || name.length < 1)
        throw new Error(`не найдено имя юнита`);

    // city
    // Нижний Новгород (Россия, Поволжье)	
    let m = getOnlyText(oneOrError($html, "div.title:first"))[1].trim().match(/^(.*)\(/i);
    if (m == null || m[1] == null || m[1].length <= 1)
        throw new Error(`не найден город юнита ${name}`);

    let city = m[1].trim();

    return [name, city];
}
/**
 * В переданном коде пробует спарсить размер юнита
 * @param $html полная страница или хедер
 */
function parseUnitSize($html: JQuery): number {

    // классы откуда можно дернуть тип юнита грузятся скриптом уже после загрузки страницц
    // и добавляются в дивы. Поэтому берем скрипт который это делает и тащим из него информацию
    let lines = $html.find("div.title script").text().split(/\n/);

    let rx = /\bbg-image\b.*?\bbgunit-.*?(\d+)\b/i;
    let size = 0;
    for (let line of lines) {
        let arr = rx.exec(line);
        if (arr != null && arr[1] != null) {
            size = numberfyOrError(arr[1]);
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

    // классы откуда можно дернуть тип юнита грузятся скриптом уже после загрузки страницц
    // и добавляются в дивы. Поэтому берем скрипт который это делает и тащим из него информацию
    let lines = $html.find("div.title script").text().split(/\n/);

    let rx = /\bbody\b.*?\bbg-page-unit-(.*)\b/i;
    let typeStr = "";
    for (let line of lines) {
        let arr = rx.exec(line);
        if (arr != null && arr[1] != null) {
            typeStr = arr[1];
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


/**
 * Со странички пробуем спарсить игровую дату. А так как дата есть почти везде, то можно почти везде ее спарсить
 * Если дату не вышло содрать то вернет null
 * @param html
 */
function parseGameDate(html: any): Date | null {
    let $html = $(html);

    try {
        // вытащим текущую дату, потому как сохранять данные будем используя ее
        let $date = $html.find("div.date_time");
        if ($date.length !== 1)
            return null;
            //throw new Error("Не получилось получить текущую игровую дату");

        let currentGameDate = extractDate(getOnlyText($date)[0].trim());
        if (currentGameDate == null)
            return null;
            //throw new Error("Не получилось получить текущую игровую дату");

        return currentGameDate;
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
/**
 * Парсинг всех ТМ продуктов /olga/main/globalreport/tm/info
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
            // TODO: баголовка. где то вылетает эксепш на парсинге числа хз где
            let o = numberfy(($r.prop("id") as string).substr(1));
            if (o <= 0)
                throw new Error(`ошибка парсинга offerID =${($r.prop("id") as string).substr(1)} в строке ${$r.text()}`);

            let offer = numberfyOrError(($r.prop("id") as string).substr(1));
            let self = $r.hasClass("myself") || available <= 0;

            // цены ВСЕГДА ЕСТЬ. Даже если на складе пусто
            // это связано с тем что если склад открыт для покупки у него цена больше 0 должна стоять
            // Есть цена поставщика, на которую работает ограничение по макс цене, и есть конечная цена
            // TODO: баголовка. где то вылетает эксепш на парсинге числа хз где
            let op = numberfy($tds.eq(4).text());
            if (op <= 0)
                throw new Error(`ошибка парсинга origPrice = ${$tds.eq(4).text()} в строке ${$r.text()}`);

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