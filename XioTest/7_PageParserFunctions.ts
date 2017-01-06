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