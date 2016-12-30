//namespace Shops {

//    export class TradingHall {
//        name: string[];
//        price: number[];
//        quality: number[];
//        purch: number[];
//        cityprice: number[];
//        cityquality: number[];
//        deliver: number[];
//        stock: number[];
//        share: number[];

//        report: string[];       // ссыли на розничные отчеты для всех товаров магаз
//        history: string[];      // ссыли на отчет по продажам
//        img: string[];          // ссыли на картинку товара
//    }

//    export class SalesHistory {
//        price: number[];
//        quantity: number[];
//    }

//    export class RetailReport {
//        marketsize: number;
//        localprice: number;
//        localquality: number;
//        cityprice: number;
//        cityquality: number;
//    }

//    function market6Ex(url: string, i: number): number {
        
//        //debugger;
//        // в расчетах предполагаем, что парсер нам гарантирует 0 или число, если элемент есть в массиве.
//        // не паримся с undefined
//        var unit = mapped[url] as Shops.TradingHall;
//        if (!unit) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has unit == null`);
//            return 0;
//        }
//        //console.log(unit);
//        var salesHistory = mapped[unit.history[i]] as Shops.SalesHistory; // {price:[], quantity:[]}
//        if (!salesHistory) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has salesHistory == null`);
//            return 0;
//        }

//        // в истории продаж всегда должна быть хотя бы одна строка. Пусть с 0, но должна быть
//        if (salesHistory.price.length < 1) {
//            postMessage(`Subdivision <a href=${url}>${subid}</a> has salesHistory.price.length < 1`);
//            return 0;
//        }

//        // мое качество сегодня и цена стоящая в окне цены, кач и цена локальных магазов сегодня
//        var myQuality = unit.quality[i];
//        var myPrice = unit.price[i];
//        var cityPrice = unit.cityprice[i];
//        var cityQuality = unit.cityquality[i];

//        // продажи сегодня и цена для тех продаж.
//        var priceOld = salesHistory.price[0];
//        var saleOld = salesHistory.quantity[0];
//        var priceOlder = salesHistory.price[1] || 0; // более старых цен может и не быть вовсе если продаж раньше не было
//        var saleOlder = salesHistory.quantity[1] || 0;

//        // закупка и склад сегодня
//        var deliver = unit.deliver[i];
//        var stock = unit.stock[i];

//        // доля рынка которую занимаем сегодня. если продаж не было то будет 0
//        var share = unit.share[i];


//        // если продаж вообще не было, история будет содержать 1 стру с нулями.
//        var isNewProduct = Math.max.apply(null, salesHistory.price) === 0;
//        var stockNotSold = stock > deliver;
//        let price = 0;
//        if (isNewProduct) {
//            //debugger;
//            // если продукт новый, и склад был, но явно продаж не было, ТО
//            // если цена проставлена, снижаем ее. Иначе считаем базовую
//            // если товара не было, то оставляем ту цену что вписана, либо ставим базовую. Вдруг я руками вписал сам.
//            if (stockNotSold) {
//                //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                if (myPrice === 0)
//                    calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                else
//                    postMessage(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${unit.img[i]}></img> with Price:${myPrice}. Correct prices!`);
//            } else
//                price = myPrice > 0 ? myPrice : calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//        }

//        // если на складе пусто, нужно все равно менять цену если продажи были.
//        // просто потому что на след раз когда на складе будет товар но не будет продаж, мы долю рынка не увидим.
//        if (!isNewProduct) {

//            if (saleOld === 0) {
//                // Если товар был и не продавался Что то не так, снижаем цену резко на 5%
//                // если saleOld === 0, то всегда и priceOld будет 0. Так уж работает
//                // пробуем взять ту цену что стоит сейчас и снизить ее, если цены нет, то ставим базовую
//                if (stockNotSold) {
//                    //price = myPrice > 0 ? myPrice * (1 - 0.05) : this.calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                    // TODO: как то подумать чтобы если продаж не было не снижать от установленной а привязаться к прошлым продажам если кач подходит
//                    if (myPrice === 0)
//                        calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
//                    else
//                        postMessage(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${unit.img[i]}></img> with Price:${myPrice}. Correct prices!`);
//                }

//                // если продаж не было и товара не было, то фигли менять что либо. Стоит как есть.
//            }

//            if (saleOld > 0) {
//                // рынок не занят и не все продаем? Снижаем цену. Если продали все то цену чуть повысим
//                if (share < 4.5)
//                    price = stockNotSold ? priceOld * (1 - 0.03) : priceOld * (1 + 0.01);

//                // рынок занят и продали не все? Цену чуть снижаем. Если все продаем то повышаем цену, иначе продаваться будет больше
//                if (share > 4.5 && share < 6)
//                    price = stockNotSold ? priceOld * (1 - 0.01) : priceOld * (1 + 0.03);

//                if (share > 6 && share < 7.5)
//                    price = stockNotSold ? priceOld * (1 + 0.01) : priceOld * (1 + 0.03);

//                if (share > 7.5)
//                    price = stockNotSold ? priceOld * (1 + 0.03) : priceOld * (1 + 0.05);
//            }
//        }

//        // если цена уже минимальна а продажи 0, алармить об этом
//        return price;
//    }

//    function calcBaseRetailPrice(myQuality: number, localPrice: number, localQuality: number): number {

//        if (myQuality === 0 || localPrice === 0 || localQuality === 0)
//            throw new Error("Аргументы должны быть > 0!");

//        return Math.max(localPrice * (1 + Math.log(myQuality / localQuality)), 0, 4);
//    }
//}