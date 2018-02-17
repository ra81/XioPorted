
interface IWorkshopSupply {
    product: IProduct;
    required: number;
    deliver: number;
    ordered: number;
    stock: IStock;
}
/**
 * Парсинг снабжения завода БЕЗ контрактов. Сами контракты проще через АПИ сработать
 * @param html
 * @param url
 */
function parseWorkshopSupply(html: any, url: string): IDictionary<IWorkshopSupply> {
    let $html = $(html);

    try {
        let $form = isWindow($html, url)
            ? $html.filter("form[name=supplyContractForm]")
            : $html.find("form[name=supplyContractForm]");
        if ($form.length <= 0)
            throw new Error("Не найдена форма.");

        let $tbl = oneOrError($form, "table.list");
        let $rows = $tbl.find("tr[id^='product_row_']");

        let dict: IDictionary<IWorkshopSupply> = {};
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            // товар
            let prod = parseProduct($r.find("th img[src*='/products/']").closest("td"));
            dict[prod.img] = {
                product: prod,
                required: numberfyOrError($tds.eq(0).find("td:contains('Требуется')").next("td").text(), -1),
                ordered: numberfyOrError($tds.eq(0).find("td:contains('Заказ')").next("td").text(), -1),
                deliver:numberfyOrError($tds.eq(0).find("td:contains('Закупка')").next("td").text(), -1),
                stock: parseStock($tds.eq(1)),
            }
        });

        return dict;
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


interface ISaleWorkshopItem extends ISaleWareItem {
    output: IStock;     // выпуск продукции
}
/**
 * форма, товары
 * @param html
 * @param url
 */
function parseWorkshopSale(html: any, url: string): [JQuery, IDictionary<ISaleWorkshopItem>] {
    let $html = $(html);

    try {
        let $form = isWindow($html, url)
            ? $html.filter("form[name=storageForm]")
            : $html.find("form[name=storageForm]");
        if ($form.length <= 0)
            throw new Error("Не найдена форма.");

        let $tbl = oneOrError($html, "table.grid");
        let $rows = closestByTagName($tbl.find("select[name*='storageData']"), "tr");

        let dict: IDictionary<ISaleWorkshopItem> = {};
        $rows.each((i, el) => {
            let $r = $(el);
            let $tds = $r.children("td");

            let $check = $r.find("input[type='checkbox']");
            if ($check.length > 1)
                throw new Error(`нашли несколько чекбоксов в одной строке.`);

            let inc = $check.length > 0 ? 1 : 0;

            // товар
            let prod = parseProduct($tds.eq(1 + inc));

            let $price = oneOrError($r, "input.money[name*='[price]']");
            let $policy = oneOrError($r, "select[name*='[constraint]']");
            let $maxQty = oneOrError($r, "input.money[name*='[max_qty]']");
            let maxQty: null | number = numberfy($maxQty.val());
            maxQty = maxQty > 0 ? maxQty : null;

            dict[prod.img] = {
                product: prod,
                output: parseStock($tds.eq(2 + inc)),
                stock: parseStock($tds.eq(3 + inc)),
                outOrdered: numberfyOrError($tds.eq(4 + inc).text(), -1),

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
