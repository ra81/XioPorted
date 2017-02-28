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
        throw new ParseError("sale contracts", url, err);
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
        throw new ParseError("ads", url, err);
    }
}

/**
 * Парсим данные  с формы зарплаты /window/unit/employees/engage/" + subid
 * @param html
 * @param url
 */
function parseSalary(html: any, url: string): ISalary {
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
 * /main/user/privat/persondata/knowledge
 * @param html
 * @param url
 */
function parseManager(html: any, url: string): ITopManager {
    let $html = $(html);

    try {
        let _base = $html.find(".qual_item .mainValue").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _bonus = $html.find(".qual_item .bonusValue").map((i, e) => numberfy($(e).text())).get() as any as number[];

        let _pic = $html.find(".qual_item img").map((i, e) => $(e).attr("src")).get() as any as string[];

        return {
            base: _base,
            bonus: _bonus,
            pic: _pic
        };
    }
    catch (err) {
        throw new ParseError("top manager", url, err);
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
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesDemand: -1,

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
                visitors: _visitors
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
                let emplRx = new RegExp(/\d+\s*\(.+\d+.*\)/g);
                let jq = $block.find("td.title:contains('Количество')").next("td").filter((i, el) => emplRx.test($(el).text()));
                if (jq.length !== 1)
                    return ["-1", "-1"];

                let m = jq.text().match(rxInt);
                if (!m || m.length !== 2)
                    return ["-1", "-1"];
                
                return m as string[];
            })();
            let _employees = numberfy(empl[0]);
            let _employeesDemand = numberfy(empl[1]);
            // общее число подчиненных по профилю
            let _totalEmployees = numberfy($block.find("td:contains('Суммарное количество подчинённых')").next("td").text());

            let salary = (() => {
                //let rx = new RegExp(/\d+\.\d+.+в неделю\s*\(в среднем по городу.+?\d+\.\d+\)/ig);
                let jq = $block.find("td.title:contains('Зарплата')").next("td");
                if (jq.length !== 1)
                    return ["-1", "-1"];

                let m = jq.text().match(rxFloat);
                if (!m || m.length !== 2)
                    return ["-1", "-1"];

                return m;
            })();
            let _salaryNow = numberfy(salary[0]);
            let _salaryCity = numberfy(salary[1]);

            let skill = (() => {
                let jq = $block.find("td.title:contains('Уровень квалификации')").next("td");
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
                let jq = $block.find("td.title:contains('Качество')").next("td");
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
                jq = $block.find("td.title:contains('Износ')").next("td");
                if (jq.length === 1) {
                    let rx = new RegExp(/(\d+\.\d+)\s*%\s*\((\d+)(?:\+(\d+))*.*\)/ig);
                    let m = rx.exec(jq.text());
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
            // % износа 
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
            
            let _img = $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0];
            let _size = numberfy($html.find("#unitImage img").attr("src").split("_")[1]);
            let _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;
            let _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;
            let _onHoliday = !!$html.find("[href$=unset]").length;
            let _isStore = !!$html.find("[href$=trading_hall]").length;
            let _departments = numberfy($html.find("tr:contains('Количество отделов') td:eq(1)").text()) || -1;
            let _visitors = numberfy($html.find("tr:contains('Количество посетителей') td:eq(1)").text()) || -1;

            return {
                employees: _employees,
                totalEmployees: _totalEmployees,
                employeesDemand: _employeesDemand,

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
                visitors: _visitors
            };
        }
    }
    catch (err) {
        throw new ParseError("unit main page", url, err);
    }
}



function parseX(html: any, url: string) {

}