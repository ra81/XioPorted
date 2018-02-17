
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

interface IProductAPI {
    id: number;
    name: string;
    symbol: string;     // укороченный вариант img без пути и расширения по факту milk, umbrella, brand/umbrella для ТМ
    img: string;
    category_id: number;    
    category_name: string;  // категория торуемой линейки. Автотовары, одежда и так далее. То что в магазине видим
}
/**
 * Список всех торгуемых продуктов. На выходе словарь img = ProductAPI
 * @param jsonObj
 * @param url
 */
function parseProductsAPI(jsonObj: any, url: string): IDictionary<IProductAPI> {
    try {

        let res: IDictionary<IProductAPI> = {};
        for (let pid in jsonObj) {
            let prod = jsonObj[pid];
            if (prod.symbol.length <= 0)
                throw new Error("пустая строка вместо символа продукта.");

            let img = `/img/products/${prod.symbol}.gif`;
            prod["img"] = img;

            res[img] = prod;
        }

        return res;
    }
    catch (err) {
        throw err;
    }
}

interface ICityAPI {
    id: number;
    name: string;

    level: number;              // уровень города. Число от 1 походу. Хз че означает возможно базовое богатство
    population: number;
    salary: number;
    unemployment: number;   
    education: number;
    plough_field: number;       // пахотные земли?? число от 0 и выше
    x: number;                  // координаты ЖПС на карте нах не нужные
    y: number;
    status: number;             // ХБЗ
    wealth_level: number;       // динамический уровень богатства. В расчете цен местных используется

    region_id: number;          // '423500',
    region_name: string;        // 'Ангола',
    country_id: number;         // '423497',
    country_name: string;       // 'Ангола',
    country_symbol: string;     // ао, сокращенное название страны
}
function parseCityAPI(jsonObj: any, url: string): IDictionary<ICityAPI> {
    try {

        let res: IDictionary<ICityAPI> = {};
        for (let cid in jsonObj) {
            let city = jsonObj[cid];
            res[city.name] = city;
        }

        return res;
    }
    catch (err) {
        throw err;
    }
}

interface IRegionAPI {
    id: number;
    name: string;

    landarea: number;
    population: number;
    tax: number;            // налог на прибыль
    status: number;
    sort: number;           // число от 0. хбз
    city_count: number;     // число городов

    country_id: number;         // '423497',
    country_name: string;       // 'Ангола',
    country_symbol: string;     // ао, сокращенное название страны
}
function parseRegionAPI(jsonObj: any, url: string): IDictionaryN<IRegionAPI> {
    try {
        return jsonObj;
    }
    catch (err) {
        throw err;
    }
}

interface ISupplyContractAPI{
    // id юнита куда закупаю
    consumer_id: number;

    // уникальные параметры поставщика
    supplier_user_id: number | null;        // для независа может быть и NULL
    supplier_id: number;                    // id моего юнита который продает барахло
    supplier_name: string;                  // 'Металлургический завод АЛЮМИНИЙ',
    supplier_company_id: number | null;     // null для независа
    supplier_company_name: string | null;          // 'PIRAMIDON Инвест',  | null для независа
    supplier_is_seaport: boolean;            // если независ то будет тру. в сырых данных 1/0 значения

    // параметры контракта
    offer_id: number;               // оффер
    offer_constraint: number;       // ограничения оффера не продавать = 0 / любому / только конкретным / себе / корпорации
    offer_max_qty: number | null;   // ограничение на макс объем на 1 заказ или NULL
    created: string;                // дата создания контракта '2017-09-27 18:18:34.743463',
    order: number;                  // порядковый номер ордера '0' У ПОСТАВЩИКА. То есть видим свою очередь
    
    // характеристика товара
    brandname_id: number | null;    // id бренда если товар ТМ. Но эта цифирь только здесь есть на странице ТМ ее нет.
    product_id: number;             // 
    product_name: string;
    product_symbol: string;         // кажется это имя картинки продукта без пути и .gif, НО уникальная величина
                                    // для ТМ может выглядеть как brand/umbrella где картинка имеет путь /img/products/brand/umbrella.gif

    quantity_at_supplier_storage: number;     // сколько барахла всего у на складе поставщика 129832
    free_for_buy: number;                     // сколько барахла свободно на складе 9832

    quality: number;                        // качество барахла 25.4351728492967
    price: number;                          // конечная текущая цена по которой будет поставка сегодня! Не учитывает новых цен
    offer_price: number;                    // цена по которой заключен контракт '36850.97' БЕЗ транспорта и таможень
    offer_new_price: number;

    offer_transport_cost: number;           // ' => '0.086', транспортные расходы
    offer_tax_cost: number;                 // таможенные расходы  ' => '0',
    offer_tax_cost_new: number;             // видимо новая таможня после изменний ' => '0',

    party_quantity: number;                 // текущий заказ по контракту '0'
    party_quantity_available: number;       // сколько свободно сейчас для этого контракта '129832'

    price_constraint: number;               // ограничение по цене выставленное покупаетелем '0'. Тоже что и на форме используется
    price_constraint_max: number;           // максимальная цена для ограничения по макс цене '0'
    quality_constraint_min: number;         // ограничение по качу '0'

    // предыдущая отгрузка
    dispatch_quantity: number | null;       // прошлый заказ отправленный или NULL
    dispatch_quality: number | null;        // качество ушедшее в прошлый раз или NULL

    instant: boolean;                       // если разовы то будет ТРУ иначе фалс
}
function parseSupplyContractsAPI(jsonObj: any, url: string): IDictionary<ISupplyContractAPI[]> {

    try {

        let res: IDictionary<ISupplyContractAPI[]> = {};
        for (let offer_id in jsonObj) {
            let contr = jsonObj[offer_id]

            if (contr.product_symbol.length <= 0)
                throw new Error("пустая строка вместо символа продукта.");

            let img = `/img/products/${contr.product_symbol}.gif`;
            if (res[img] == null)
                res[img] = [];

            // часть полей преобразуем для удобства
            contr["price"] = contr.offer_price + contr.offer_transport_cost + contr.offer_tax_cost;

            contr["instant"] = contr.contract_duration != null;
            delete contr["contract_duration"];

            contr.supplier_is_seaport = contr.supplier_is_seaport > 0;

            // для независа особое заполнение полей и надо их конвертировать
            if (contr.supplier_is_seaport) {
                contr.quantity_at_supplier_storage = Number.MAX_SAFE_INTEGER;
                contr.free_for_buy = Number.MAX_SAFE_INTEGER;
                contr.party_quantity_available = Number.MAX_SAFE_INTEGER;
            }

            res[img].push(contr);
        }

        return res;
    }
    catch (err) {
        throw err;
    }
}
