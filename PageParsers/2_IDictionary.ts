

interface IUnit {
    subid: number;
    name: string;
    type: UnitTypes;
    typeStr: string;
    size: number;
    city: string;
}

interface IMain {
    type: UnitTypes;
    employees: number;
    totalEmployees: number;
    employeesReq: number;

    salaryNow: number;
    salaryCity: number;

    skillNow: number;
    skillCity: number,
    skillReq: number;

    equipNum: number;
    equipMax: number;
    equipQual: number;
    equipReq: number;

    equipBroken: number;
    equipWearBlack: number;
    equipWearRed: boolean;

    managerPic: string;
    qual: number;
    techLevel: number;
    img: string;
    size: number;
    hasBooster: boolean;
    hasAgitation: boolean;
    onHoliday: boolean;
    isStore: boolean;
    departments: number;
    visitors: number;
    service: ServiceLevels;
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

interface ITopManager {
    base: number[];
    bonus: number[];
    pic: string[];
}

interface IUnitAds {
    celebrity: number;
    pop: number;
    budget: number;
    requiredBudget: number;
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

interface IUnitSalary {
    employees: number;
    maxEmployees: number;
    form: JQuery;
    salaryNow: number;
    salaryCity: number;
    skillNow: number;
    skillCity: number;
    skillReq: number;
}

interface ITradeHall {
    stock: number[];
    deliver: number[];
    reportUrl: string[];
    report: IRetailReport[];
    img: string[];
    quality: number[];
    purch: number[];
    price: number[];
    name: string[];
    share: number[];
    cityprice: number[];
    cityquality: number[];
    historyUrl: string[];
    history: (IPriceHistoryItem[])[];
}

interface ISale {
    form: JQuery;
    policy: number[];
    price: number[];
    incineratorMaxPrice: number[];

    outamount: number[];
    outqual: number[];
    outprime: number[];

    stockamount: number[];
    stockqual: number[];
    stockprime: number[];

    product: string[];
    productId: number[];
    region: string;
    contractpage: boolean;
    contractprice: string|number[];
}

interface ISaleNew {
    region: string;
    form: JQuery;
    incineratorMaxPrice: number[];
    products: IDictionary<ISaleProductData>;

    contractpage: boolean;
    contracts: IDictionary<ISaleContract[]>;
}

interface IPriceHistoryItem {
    date: Date;
    quantity: number;
    quality: number;
    price: number;
    brand: number;
}

interface IRetailReport {
    marketsize: number;
    localprice: number;
    localquality: number;
    cityprice: number;
    cityquality: number;
}

interface IProductReport {
    max: number[];
    total: number[];
    available: number[];
    quality: number[];
    price: number[];
    subid: number[];
}

interface IStoreSupply {
    parcel: number[];
    price_mark_up: number[];
    price_constraint_max: number[];
    price_constraint_type: string[];
    quality_constraint_min: number[];

    deliver: number[];
    stock: number[];
    sold: number[];

    offer: number[];
    price: number[];
    reprice: boolean[];
    quality: number[];
    available: number[];

    img: string[];
}

// информация о товаре в хранилище. Кол-во, качество, цена, бренд
interface IStorageData {
    quantity: number;
    quality: number;
    price: number;
    brand: number;
}

// товар в игре. Имя, картинка и номер. Уникально идентифицирует
interface IProduct {
    name: string;
    img: string;    // полный путь картинки /img/products/clay.gif или /img/products/brand/clay.gif
    id: number
}

interface ISaleProductData {
    product: IProduct;
    stock: IStorageData;
    out: IStorageData;
    freeQuantity: number;
    orderedQuantity: number;
    salePolicy: number;
    salePrice: number;
}

interface ISaleContract {
    UnitType: string;
    CompanyName: string;
    UnitId: string;
    Purchased: number;  // закуплено в пересчет
    Ordered: number;    // заказано на след пересчет
    Price: number;      // цена контракта
}

interface IEnergyPrices {
    sector: string;     // отрасль
    price: number;      // цена на энергию
    products: IProduct[];   // список продукции для данного сектора
}
