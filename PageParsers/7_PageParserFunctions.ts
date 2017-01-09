﻿//
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
 * Возвращает ТОЛЬКО текст элемента БЕЗ его наследников
 * @param el
 */
function getInnerText(el: Element) {
    return $(el).clone().children().remove().end().text();
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

    try {
        let $rows = $html.find(".unit-list-2014").find("tr").not(".unit_comment");

        //let _subids = $unitList.find("td:nth-child(1)").not(".unit_comment").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
        let _subids = $rows.find("td:nth-child(1)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];

        let _type = $rows.find("td:nth-child(3)").map((i, e) => {
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

                return numberfy(bonusSpan.text());
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
                // 1 000 (максимум:10 000) пробелы в числах!!
                let types = ["сотрудников", "работников", "учёных", "рабочих"];
                let res = [-1, -1];

                //let emplRx = new RegExp(/\d+\s*\(.+\d+.*\)/g);
                //let td = jq.next("td").filter((i, el) => emplRx.test($(el).text()));
                let jq = $block.find("td.title:contains('Количество')").filter((i, el) => {
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
            let _totalEmployees = numberfy($block.find("td:contains('Суммарное количество подчинённых')").next("td").text());

            let salary = (() => {
                //let rx = new RegExp(/\d+\.\d+.+в неделю\s*\(в среднем по городу.+?\d+\.\d+\)/ig);
                let jq = $block.find("td.title:contains('Зарплата')").next("td");
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

            let _img = $html.find("#unitImage img").attr("src").split("/")[4].split("_")[0];
            let _size = numberfy($html.find("#unitImage img").attr("src").split("_")[1]);

            //  есть ли возможность вкорячить бустер производства типо солнечных панелей или нет. если не занято то втыкает
            let _hasBooster = !$html.find("[src='/img/artefact/icons/color/production.gif']").length;

            // хз что это вообще
            let _hasAgitation = !$html.find("[src='/img/artefact/icons/color/politics.gif']").length;

            let _onHoliday = !!$html.find("[href$=unset]").length;
            let _isStore = !!$html.find("[href$=trading_hall]").length;
            let _departments = numberfy($html.find("tr:contains('Количество отделов') td:eq(1)").text()) || -1;
            let _visitors = numberfy($html.find("tr:contains('Количество посетителей') td:eq(1)").text()) || -1;

            return {
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
                visitors: _visitors
            };
        }
    }
    catch (err) {
        throw new ParseError("unit main page", url, err);
    }
}

/**
 * Чисто размер складов вида https://virtonomica.ru/fast/window/unit/upgrade/8006972
 * @param html
 * @param url
 */
function parseWareSize(html: any, url: string): IWareSize {
    let $html = $(html);

    try {
        let _size = $html.find(".nowrap:nth-child(2)").map((i, e) => {
            let txt = $(e).text();
            let sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;

            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;

            return sz;
        }).get() as any as number[];
        let _rent = $html.find(".nowrap:nth-child(3)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
        let _id = $html.find(":radio").map((i, e) => numberfyOrError($(e).val())).get() as any as number[];

        return {
            size: _size,
            rent: _rent,
            id: _id
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}

/**
 * Главная страница склада аналогично обычной главной юнита /main/unit/view/ + subid
 * @param html
 * @param url
 */
function parseWareMain(html: any, url: string): IWareMain {
    let $html = $(html);

    try {
        if ($html.find("#unitImage img").attr("src").indexOf("warehouse") < 0)
            throw new Error("Это не склад!");

        let _size = $html.find(".infoblock td:eq(1)").map((i, e) => {
            let txt = $(e).text();
            let sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;

            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;

            return sz;
        }).get() as any as number;
        let _full = (() => {
            let f = $html.find("[nowrap]:eq(0)").text().trim();
            if (f === "")
                throw new Error("ware full not found");

            return numberfy(f);
        })();
        let _product = $html.find(".grid td:nth-child(1)").map((i, e) => $(e).text()).get() as any as string[];
        let _stock = $html.find(".grid td:nth-child(2)").map((i, e) => numberfy($(e).text())).get() as any as number[];
        let _shipments = $html.find(".grid td:nth-child(6)").map((i, e) => numberfy($(e).text())).get() as any as number[];

        return {
            size: _size,
            full: _full,
            product: _product,
            stock: _stock,
            shipments: _shipments
        };
    }
    catch (err) {
        throw new ParseError("ware main", url, err);
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

function parseX(html: any, url: string) {
    let $html = $(html);

    try {
        let _size = $html.find(".nowrap:nth-child(2)").map((i, e) => {
            let txt = $(e).text();
            let sz = numberfyOrError(txt);
            if (txt.indexOf("тыс") >= 0)
                sz *= 1000;

            if (txt.indexOf("млн") >= 0)
                sz *= 1000000;

            return sz;
        }).get() as any as number[];
        let _rent = $html.find(".nowrap:nth-child(3)").map((i, e) => numberfyOrError($(e).text())).get() as any as number[];
        let _id = $html.find(":radio").map((i, e) => numberfyOrError($(e).val())).get() as any as number[];

        return {
            size: _size,
            rent: _rent,
            id: _id
        };
    }
    catch (err) {
        throw new ParseError("ware size", url, err);
    }
}