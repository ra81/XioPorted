
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
