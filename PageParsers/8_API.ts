
// Контракты на покупку у МЕНЯ
interface ISaleContractAPI {
    offer_id: number;               // мой оффер
    offer_constraint: number;       // ограничения оффера не продавать = 0 / любому / только конкретным / себе / корпорации
    offer_max_qty: number | null;   // ограничение на макс объем на 1 заказ или NULL

    // характеристика товара
    brandname_id: number | null;    // id бренда если товар ТМ. Но эта цифирь только здесь есть на странице ТМ ее нет.
    product_id: number;             // 
    product_name: string;           
    product_symbol: string;         // кажется это имя картинки продукта без пути и .gif, НО уникальная величина
                                    // для ТМ может выглядеть как brand/umbrella где картинка имеет путь /img/products/brand/umbrella.gif

    quantity_at_supplier_storage: number;   // сколько барахла всего у меня на складе 129832
    quality: number;                        // качество моего барахла 25.4351728492967
    free_for_buy: number;                   // сколько барахла свободно на моем складе 9832

    // уникальные параметры покупателя
    supplier_id: number;                    // id моего юнита который продает барахло
    consumer_user_id: number;               // id пользователя который покупает. Компаний может быть несколько на юзера
    consumer_id: number;                    // id юнита который сделал заказ
    consumer_company_id: number;            // id компании которая покупает 6383588
    consumer_name: string;                  // Имя юнита который покупает барахло 'Фабрика общественных интерьеров',
    consumer_company_name: string;          // Имя компании которая покупает 'Сумкин и Авоськин',
    consumer_unit_class_symbol: string;     // строковый идентификатор класса юнита 'workshop',
    consumer_unit_class_name: string;       // 'Завод'

    // местоположение юнита покупателя
    country_id: number;
    country_name: string;           // 'Казахстан'
    city_id: number;
    city_name: string;              // 'Павлодар',

    // параметры контракта
    created: string;                        // дата создания контракта '2017-09-27 18:18:34.743463',
    order: number;                          // порядковый номер ордера '0'

    offer_price: number;                    // цена по которой заключен контракт '36850.97'
    party_quantity: number;                 // текущий заказ по контракту '0'
    party_quantity_available: number;       // сколько свободно сейчас для этого контракта '129832'

    price_constraint: number;               // ограничение по цене выставленное покупаетелем '0'. Тоже что и на форме используется
    price_constraint_max: number;           // максимальная цена для ограничения по макс цене '0'
    quality_constraint_min: number;         // ограничение по качу '0'

    // предыдущая отгрузка
    dispatch_quantity: number | null;       // прошлый заказ отправленный или NULL
    dispatch_quality: number | null;        // качество ушедшее в прошлый раз или NULL
}

/**
 * Возвращает словарь где для каждого img товара лежит массив заказов
 * @param jsonStr
 * @param url
 */
function parseSaleContractsAPI(jsonObj: any, url: string): IDictionary<ISaleContractAPI[]> {
    try {

        let res: IDictionary<ISaleContractAPI[]> = {};
        for (let contr of jsonObj) {
            if (contr.product_symbol.length <= 0)
                throw new Error("пустая строка вместо символа продукта.");

            let img = `/img/products/${contr.product_symbol}.gif`;
            if (res[img] == null)
                res[img] = [];

            res[img].push(contr);
        }

        return res;
    }
    catch (err) {
        throw err;
    }
}