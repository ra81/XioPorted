//
// Сюда все функции которые парсят данные со страниц
//

/**
 * Пробуем оцифровать данные но если они выходят как Number.POSITIVE_INFINITY или 0, валит ошибку
 * @param value строка являющая собой число больше 0
 */
function numberfyOrError(value: string) {
    let n = numberfy(value);
    if (n === Number.POSITIVE_INFINITY || n === 0)
        throw new RangeError("Должны получить число > 0");

    return n;
}

/**
 * Из набора HTML элементов представляющих собой tr парсит subid. Ряды должны быть стандартного формата.
 */
function parseSubid(trList: HTMLTableRowElement[]): number[] {
    if (trList == null)
        throw new ArgumentNullError("trList");

    let f = (i: number, e: Element) => numberfyOrError($(e).text());
    return $(trList).find("td.unit_id").map(f).get() as any as number[];
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
 * Парсит id компании со страницы
 */
function getCompanyId() {
    let m = $(".dashboard a").attr("href").match(/\d+/);
    if (m == null)
        throw new ParseError("company id");

    return numberfy(m[0]);
}

/**
 * Парсинг главной страницы с юнитами.
 * @param html
* @param url
 */
function parseUnitList(html: any, url: string): IUnitList {
    let $html = $(html);
    let $unitList = $html.find(".unit-list-2014");

    try {
        let _subids = $unitList.find("td:nth-child(1)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _type = $unitList.find("td:nth-child(3)").map((i, e) => {
            let s = $(e).attr("class").split("-")[1];
            if (s == null)
                throw new RangeError("class attribute doesn't contains type part.");

            return s;
        }).get() as any as string[];

        return { subids: _subids, type: _type };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}

/**
 * Парсит "/main/unit/view/ + subid + /sale" урлы
 * @param html
 * @param url
 */
function parseSale(html: any, url: string): ISale {
    let $html = $(html);

    try {
        let _form = $html.find("[name=storageForm]") as JQuery;

        let _policy = $html.find("select:even").map((i, e) => {
            let f = $(e).find("[selected]").index();
            if (f < 0)
                throw new RangeError("policy index < 0");

            return f;
        }).get() as any as number[];

        let _price = $html.find("input.money:even").map((i, e) => numberfyOrError($(e).val())).get() as any as number[];

        let _incineratorMaxPrice = $html.find('span[style="COLOR: green;"]').map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _outqual = $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(2) td:nth-child(2)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _outprime = $html.find("td:has('table'):nth-last-child(6)  tr:nth-child(3) td:nth-child(2)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _stockqual = $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(2) td:nth-child(2)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _stockprime = $html.find("td:has('table'):nth-last-child(5)  tr:nth-child(3) td:nth-child(2)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        // название продукта Спортивное питание, Маточное молочко и так далее
        let _product = $html.find(".grid a:not([onclick])").map((i, e) => {
            let t = $(e).text();
            if (t.trim() === "")
                throw new Error("product name is empty");

            return t;
        }).get() as any as string[];

        // урл на продукт
        let _productId = $html.find(".grid a:not([onclick])").map((i, e) => {
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
            outqual: _outqual,
            outprime: _outprime,
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

/**
 * Парсит страницы вида "/main/unit/view/ + subid + /sale/product", а так же
 * "/main/unit/view/" + subid + "/sale/product/ + productId"
 * @param html
 * @param url
 */
function parseSaleContracts(html: any, url: string): ISaleContract {
    let $html = $(html);

    // слегка дибильный подход. В объекте мы имеем цены покупцов для одной категории по url, но список категорий 
    // каждый раз забираем весь.
    // TODO: перепилить. Сделать контракт как {url:string, ИмяТовара:string, prices: number[]} 
    // итоговая структура будет выглядеть так 
    /* $mapped[subid/sale/product] = {
            categories: string[];  - список урлов категорий
        }
        а далее
        $mapped[subid/sale/product/prodId] = {
            prodName: string; - строковое имя продукта    
            buyerPrices: number[]; - массив цен покупцов данного товара
        }

        аналогично делать ISale. Вместо хуйни с string|number вставить туда сразу свойство
        contracts: IDictionary<ISaleContract> содержащее инфу по всем товарам. ключом будет productId или его урл
    */ 
    try {
        // каждая категория представляет товар который продается со склада или производства. По факту берем ссыль через которую
        // попадаем на список покупателей товара.
        // если покупцов товара НЕТ, тогда данной категории не будет. То есть не может быть пустая категория
        let _categorys = $html.find("#productsHereDiv a").map(function (i, e) { return $(e).attr("href"); }).get() as any as string[];

        // здесь уже есть четкая гарантия что резалт будет вида 
        // ["Медицинский инструментарий", 534.46, 534.46, 534.46, 534.46]
        // то есть первым идет название а потом цены покупателей
        let _contractprices = ($html.find("script:contains(mm_Msg)").text().match(/(\$(\d|\.| )+)|(\[\'name\'\]		= \"[a-zA-Zа-яА-ЯёЁ ]+\")/g) || []).map(function (e) { return e[0] === "[" ? e.slice(13, -1) : numberfy(e) }) as any as string | number[]
        return { category: _categorys, contractprice: _contractprices };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}

/**
 * Парсинг данных по страницы /main/unit/view/8004742/virtasement
 * @param html
 * @param url
 */
function parseAds(html: any, url: string): IAds {
    let $html = $(html);

    try {
        // известность
        let _celebrity = numberfy($html.find(".infoblock tr:eq(0) td:eq(1)").text());

        // население города
        let _pop = (() => {
            let m = $html.find("script").text().match(/params\['population'\] = \d+/);
            if (m == null)
                throw new Error("population number not found.");

            return numberfy(m[0].substring(23));
        })();

        // текущий бюджет, он может быть и 0
        let _budget = numberfy($html.find(":text:not([readonly])").val());

        // бюжет на поддержание известности
        // ["не менее ©110.25  в неделю для ТВ-рекламы"] здесь может быть и $110.25
        // данный бюжет тоже может быть 0 если известность 0
        let _requiredBudget = numberfy($html.find(".infoblock tr:eq(1) td:eq(1)").text().split(/[$©]/g)[1]);
        if (_celebrity > 0 && _requiredBudget === 0)
            throw new Error("required budget can't be 0 for celebrity" + _celebrity);

        return {
            celebrity: _celebrity,
            pop: _pop,
            budget: _budget,
            requiredBudget: _requiredBudget
        };
    }
    catch (err) {
        throw new ParseError("unit list", url, err);
    }
}