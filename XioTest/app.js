// включены опции стриктНулл.
// запрет неявных Эни, ретурнов, this
var Shop = (function () {
    function Shop() {
    }
    Shop.prototype.market6 = function (url, i) {
        //debugger;
        // в расчетах предполагаем, что парсер нам гарантирует 0 или число, если элемент есть в массиве.
        // не паримся с undefined
        var unit = mapped[url];
        if (!unit) {
            this.postMessage("Subdivision <a href=" + url + ">" + subid + "</a> has unit == null");
            return 0;
        }
        //console.log(unit);
        var salesHistory = mapped[unit.history[i]]; // {price:[], quantity:[]}
        if (!salesHistory) {
            this.postMessage("Subdivision <a href=" + url + ">" + subid + "</a> has salesHistory == null");
            return 0;
        }
        // в истории продаж всегда должна быть хотя бы одна строка. Пусть с 0, но должна быть
        if (salesHistory.price.length < 1) {
            this.postMessage("Subdivision <a href=" + url + ">" + subid + "</a> has salesHistory.price.length < 1");
            return 0;
        }
        // мое качество сегодня и цена стоящая в окне цены, кач и цена локальных магазов сегодня
        var myQuality = unit.quality[i];
        var myPrice = unit.price[i];
        var cityPrice = unit.cityprice[i];
        var cityQuality = unit.cityquality[i];
        // продажи сегодня и цена для тех продаж.
        var priceOld = salesHistory.price[0];
        var saleOld = salesHistory.quantity[0];
        var priceOlder = salesHistory.price[1] || 0; // более старых цен может и не быть вовсе если продаж раньше не было
        var saleOlder = salesHistory.quantity[1] || 0;
        // закупка и склад сегодня
        var deliver = unit.deliver[i];
        var stock = unit.stock[i];
        // доля рынка которую занимаем сегодня. если продаж не было то будет 0
        var share = unit.share[i];
        // если продаж вообще не было, история будет содержать 1 стру с нулями.
        var isNewProduct = Math.max.apply(null, salesHistory.price) === 0;
        var stockNotSold = stock > deliver;
        var price = 0;
        if (isNewProduct) {
            //debugger;
            // если продукт новый, и склад был, но явно продаж не было, ТО
            // если цена проставлена, снижаем ее. Иначе считаем базовую
            // если товара не было, то оставляем ту цену что вписана, либо ставим базовую. Вдруг я руками вписал сам.
            if (stockNotSold) {
                //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                if (myPrice === 0)
                    this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                else
                    this.postMessage("Subdivision <a href=" + url + ">" + subid + "</a> has 0 sales for <img src=" + unit.img[i] + "></img> with Price:" + myPrice + ". Correct prices!");
            }
            else
                price = myPrice > 0 ? myPrice : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
        }
        // если на складе пусто, нужно все равно менять цену если продажи были.
        // просто потому что на след раз когда на складе будет товар но не будет продаж, мы долю рынка не увидим.
        if (!isNewProduct) {
            if (saleOld === 0) {
                // Если товар был и не продавался Что то не так, снижаем цену резко на 5%
                // если saleOld === 0, то всегда и priceOld будет 0. Так уж работает
                // пробуем взять ту цену что стоит сейчас и снизить ее, если цены нет, то ставим базовую
                if (stockNotSold) {
                    //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                    // TODO: как то подумать чтобы если продаж не было не снижать от установленной а привязаться к прошлым продажам если кач подходит
                    if (myPrice === 0)
                        this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                    else
                        this.postMessage("Subdivision <a href=" + url + ">" + subid + "</a> has 0 sales for <img src=" + unit.img[i] + "></img> with Price:" + myPrice + ". Correct prices!");
                }
            }
            if (saleOld > 0) {
                // рынок не занят и не все продаем? Снижаем цену. Если продали все то цену чуть повысим
                if (share < 4.5)
                    price = stockNotSold ? priceOld * (1 - 0.03) : priceOld * (1 + 0.01);
                // рынок занят и продали не все? Цену чуть снижаем. Если все продаем то повышаем цену, иначе продаваться будет больше
                if (share > 4.5 && share < 6)
                    price = stockNotSold ? priceOld * (1 - 0.01) : priceOld * (1 + 0.03);
                if (share > 6 && share < 7.5)
                    price = stockNotSold ? priceOld * (1 + 0.01) : priceOld * (1 + 0.03);
                if (share > 7.5)
                    price = stockNotSold ? priceOld * (1 + 0.03) : priceOld * (1 + 0.05);
            }
        }
        // если цена уже минимальна а продажи 0, алармить об этом
        return price;
    };
    Shop.prototype.calcBaseRetailPrice = function (myQuality, localPrice, localQuality) {
        if (myQuality === 0 || localPrice === 0 || localQuality === 0)
            throw new Error("Аргументы должны быть > 0!");
        return Math.max(localPrice * (1 + Math.log(myQuality / localQuality)), 0, 4);
    };
    Shop.prototype.postMessage = function (msg, nope) {
        $("div").attr("id", "msg").appendTo("#content");
    };
    return Shop;
}());
var subid = 123;
var url = "http://qwerty.ru/apoteke1";
var url2 = "http://qwerty.ru/store2";
var u = {
    name: ["solt", "milk"],
    price: [10, 100],
    quality: [2, 6],
    purch: [1, 5],
    cityprice: [8, 60],
    cityquality: [1, 1],
    deliver: [20, 40],
    stock: [50, 120],
    share: [1, 6],
    report: ["soltreport", "milkreport"],
    history: ["solthist", "milkhist"],
    img: ["solt.img", "milk.img"]
};
var h1 = {
    price: [9, 12, 10],
    quantity: [30, 20, 25]
};
var h2 = {
    price: [120, 110, 100],
    quantity: [30, 50, 60]
};
var mapped = { url: u };
mapped[u.history[0]] = h1;
mapped[u.history[1]] = h2;
var x = mapped[url];
var b = x ? x.quantity[0] : 0;
window.onload = function () {
    var body = document.getElementsByTagName("body")[0];
    var button = document.createElement("input");
    button.type = "submit";
    button.value = "calc";
    body.appendChild(button);
    $("#content").text(u.history[0]);
    //$("body").append(btn);
    //var greeter = new Greeter(el);
    //greeter.start();
};
//# sourceMappingURL=app.js.map