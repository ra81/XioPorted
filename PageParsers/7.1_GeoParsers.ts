

interface ICountry {
    id: number;         // номер страны
    name: string;       // имя. Азербайджан и т.д
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


interface IRegion {
    id: number;         // номер региона
    name: string;       // имя. Азербайджан и т.д
    tax: number;        // налоги. пока так заготовка лишь
    countryName: string;    // страна в которую входит
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


interface ICity {
    id: number;         // номер города
    name: string;       // имя. Азербайджан и т.д
    countryName: string;    // страна строкой
    population: number;
    salary: number;     // зарплата
    eduLevel: number;   // уровень образования
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
                population: 1000 * numberfyOrError($tds.eq(1).text(), 0),
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


interface IEnergyPrices {
    sector: string;     // отрасль
    price: number;      // цена на энергию
    products: IProduct[];   // список продукции для данного сектора
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
