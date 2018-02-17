
interface ITopManager {
    base: number[];
    bonus: number[];
    pic: string[];
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
                return n < 0 ? 0 : n;
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


interface IProductReport {
    max: number[];
    total: number[];
    available: number[];
    quality: number[];
    price: number[];
    subid: number[];
}
/**
 * все продавцы данного продукта ВООБЩЕ /"+realm+"/main/globalreport/marketing/by_products/"+mapped[url].productId[i]
 * @param html
 * @param url
 */
function parseProductSuppliers(html: any, url: string): IOffer[] {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.grid")
            : $html.find("table.grid");

        let res: IOffer[] = [];
        let $rows = $tbl.find("tr.odd, tr.even");
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            // для независимого поставщика у нас особый подход будет
            let isIndep = $tds.eq(0).find("img[src='/img/unit_types/seaport.gif']").length > 0
            if (isIndep) {
                let cname = $tds.eq(0).text().trim()
                let q = numberfyOrError($tds.eq(3).text());
                let price = numberfyOrError($tds.eq(4).text());

                res.push({
                    companyName: cname,
                    id: -1,
                    isIndependend: true,
                    maxLimit: null,
                    origPrice: price,
                    self: false,
                    tmImg: "",
                    unit: { city: "", name: cname, size: -1, subid: -1, type: UnitTypes.warehouse, typeStr: "warehouse" },
                    stock: {
                        total: Number.POSITIVE_INFINITY,
                        available: Number.POSITIVE_INFINITY,
                        product: { brand: 0, price: price, quality: q },
                        purchased: 0,
                    }
                });

                return;
            }


            //  собираем юнит
            let $a = $tds.eq(0).find("a").eq(1);
            if ($a.length != 1)
                throw new Error(`Найдено больше 1 ссылки на юнит для ${$r.text()}`);

            let m = extractIntPositive($a.attr("href"));
            if (m == null || m.length != 1)
                throw new Error("Не найден subid юнита");

            let subid = m[0];
            let name = getOnlyText($a)[0].trim();

            // такой изврат с приведением из за компилера. надо чтобы работало
            let imgName = nullCheck($tds.find("img").attr("src").split("/").pop());
            let typestr = imgName.split(".")[0].trim();    // картинка без расширения
            if (typestr == null || typestr.length < 1)
                throw new Error("Не найден type юнита");

            let type: UnitTypes = (UnitTypes as any)[typestr] ? (UnitTypes as any)[typestr] : UnitTypes.unknown;
            if (type == UnitTypes.unknown)
                throw new Error("Не описан тип юнита " + typestr);


            // остальные параметры
            let company = $tds.eq(0).find("strong").text().trim();  // может быть и пустым у некоторых ушлепков
            let q = numberfyOrError($tds.eq(3).text());
            let price = numberfyOrError($tds.eq(4).text());

            let total = numberfyOrError(getOnlyText($tds.eq(1))[0].trim());
            let free = numberfyOrError($tds.eq(2).text());
            // max: 80 000
            let maxLim = $tds.eq(1).find("span").length > 0
                ? numberfyOrError(nullCheck($tds.eq(1).find("span").text().split(":").pop()))
                : null;

            res.push({
                id: -1,
                companyName: company,
                isIndependend: isIndep,
                maxLimit: maxLim,
                origPrice: price,
                self: false,
                tmImg: "",
                unit: {
                    city: "",
                    name: name,
                    size: -1,
                    subid: subid,
                    type: type,
                    typeStr: typestr
                },
                stock: {
                    available: free,
                    total: total,
                    purchased: 0,
                    product: { brand: 0, price: price, quality: q }
                }
            });
        });

        return res;
    }
    catch (err) {
        throw err;
    }
}
function parseProductSuppliersOld(html: any, url: string): IProductReport {
    let $html = $(html);

    try {
        let $tbl = isWindow($html, url)
            ? $html.filter("table.grid")
            : $html.find("table.grid");

        let $rows = $tbl.find("tr.odd, tr.even");

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


interface IEmployeesNew {
    subid: number;      // айди юнита
    empl: number;       // число рабов в юните
    emplMax: number;    // макс число рабов
    salary: number;     // зарплата
    salaryCity: number; // зарплата в городе
    qual: number;       // квалификация
    qualRequired: number;   // требуемая квала
    eff: number;        // эффективность персонала
    holiday: boolean;   // в отпуске или нет. Если да, то eff будет -1
};
/**
 * Парсит данные по числу рабов со страницы управления персоналам в Управлении
 * @param html
 * @param url
 */
function parseManageEmployees(html: any, url: string): IDictionaryN<IEmployeesNew> {

    let $html = $(html);

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


interface IAdsNew {
    subid: number;
    budget: number;
    effAd: number;
    effUnit: number;
    celebrity: number;
    visitors: number;
    profit: number;
}
/**
 * Парсит страницу отчета по рекламе, собирает всю инфу по всем юнитам где реклама есть. Где рекламы нет
 * те не выводятся в этой таблице их надо ручками парсить
 * @param html
 * @param url
 */
function parseCompAdsReport(html: any, url: string):IDictionaryN <IAdsNew> {
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
            let _effUnit = numberfyOrError($tds.eq(init + 1).text(), -1);
            let _celebrity = numberfyOrError($tds.eq(init + 2).text().split("(")[0], -1);
            let _visitors = numberfyOrError($tds.eq(init + 3).text().split("(")[0], -1);
            let _profit = numberfy($tds.eq(init + 4).text());

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
        let $grid = isWindow($html, url)
            ? $html.filter("table.grid")
            : $html.find("table.grid");
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


