


// алиас для группы типов.
type MappedPage = ISaleNew | IWareSupply | IWareSize | IWareMain | ITraining | ITech | IStoreSupply | IServiceHistory | IProductReport | ISaleContract | ICtie | ITransport | IIp | ITm | IRetailReport | IPriceHistory | IExperimentalUnit | IResearch | IConsume | IFinanceItem | IAjax | ISale | IService | IEmployees | IUnitList | ITopManager | IAds | IMachines | IAnimals | IEquipment | ISalary | IMain | ITradeHall | IProdSupply;

interface IMain {
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
}

interface IEmployees {
    id: number[];
    salary: number[];
    salaryCity: number[];
    skill: number[];
    skillRequired: number[];
    onHoliday: boolean[];
    efficiency: string[];
}

interface IUnitList {
    subids: number[];
    type: string[];
}

interface ITopManager {
    base: number[];
    bonus: number[];
    pic: string[];
}

interface IAds {
    celebrity: number;
    pop: number;
    budget: number;
    requiredBudget: number;
}

interface IMachines {
    id: number[];
    subid: number[];
    type: string[];
    num: number[];
    perc: number[];
    black: number[];
    red: number[];
    quality: number[];
    required: number[];
}

interface IAnimals {
    id: number[];
    subid: number[];
    type: string[];
    num: number[];
    perc: number[];
    black: number[];
    red: number[];
}

interface IEquipment {
    qualNow: number;
    qualReq: number;
    equipNum: number;
    equipMax: number;
    equipPerc: number;
    price: number[];
    qualOffer: number[];
    available: number[];
    offer: number[];
    img: string[];
    filtername: string;
}

interface ISalary {
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
    report: string[];
    img: string[];
    quality: number[];
    purch: number[];
    price: number[];
    name: string[];
    share: number[];
    cityprice: number[];
    cityquality: number[];
    history: string[];
}

interface IProdSupply {
    isProd: boolean;
    parcel: number[];
    price_mark_up: number[];
    price_constraint_max: number[];
    price_constraint_type: string[];
    quality_constraint_min: number[];
    required: number[];
    stock: number[];
    basequality: number[];
    prodid: number[];
    offer: number[];
    price: number[];
    quality: number[];
    available: number[];
    maximum: number[];
    reprice: boolean[];
    mainrow: boolean[];
    nosupplier: boolean[];
    img: string;
}

interface IService {
    price: number[];
    history: string[];
    incineratorPrice: number[];

    //not used
    stock: number[];
    deliver: number[];
    report: string[];
    img: string[];
    quality: number[];
    name: string[];
    share: number[];
    cityprice: number[];
    cityquality: number[];
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

interface IAjax {
    [key: string]: { symbol: string, size: string, initial_cost: string, ttl: string, cost_per_turn: string };
}

interface IFinanceItem {
    energy: number;
}

interface IConsume {
    consump: number[];
    purch: number[];
}

interface IResearch {
    isFree: boolean;
    isHypothesis: boolean;
    isBusy: boolean;
    hypId: number[];
    curIndex: number;
    chance: number[];
    time: number[];
    isAbsent: boolean;
    isFactory: boolean;
    unittype: number;
    industry: number;
    level: number;
}

interface IExperimentalUnit {
    id: number[];
}

interface IPriceHistory {
    quantity: number[];
    price: number[];
}

interface IRetailReport {
    marketsize: number;
    localprice: number;
    localquality: number;
    cityprice: number;
    cityquality: number;
}

interface ITm {
    product: string[];
    franchise: string[];
}

interface IIp {
    product: string[];
    IP: number[];
}

interface ITransport {
    countryName: string[];
    countryId: number[];
    regionName: string[];
    regionId: number[];
    cityName: string[];
    cityId: number[];
}

interface ICtie {
    product: string[];
    profitTax: number;
    CTIE: number[];
}

//interface ISaleContract {
//    category: string[];
//    contractprice: string|number[];
//}

interface IProductReport {
    max: number[];
    total: number[];
    available: number[];
    quality: number[];
    price: number[];
    subid: number[];
}

interface IServiceHistory {
    price: number[];
    quantity: number[];
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

interface ITech {
    price: string[];
    tech: number;
    img: string;
}

interface ITraining {
    form: JQuery;
    salaryNow: number;
    salaryCity: number;
    weekcost: number;
    employees: number;
    skillNow: number;
    skillCity: number;
}

interface IWareMain {
    size: number;
    full: number;
    product: string[];
    stock: number[];
    shipments: number[];
}

interface IWareSize {
    size: number[];
    rent: number[];
    id: number[];
}

interface IWareSupply {
    form: JQuery;
    contract: string[];
    id: number[];
    type: string[];
    stock: number[];
    shipments: number[];
    parcel: number[];
    price_mark_up: number[];
    price_constraint_max: number[];
    price_constraint_type: string[];
    quality_constraint_min: number[];
    product: string[];
    price: number[];
    reprice: boolean[];
    quality: number[];
    offer: number[];
    available: number[];
    myself: boolean[];
    contractAdd: string[];
    idAdd: number[];
    typeAdd: string[];
}

interface IBuyContract {
    available: number[];
    offer: number[];
    price: number[];
    quality: number[];
    tm: string[];
    company: string[];
    myself: boolean[];
    product: string;
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
    img: string;
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

//interface IProductContracts {
//    Name: string;       // имя товара
//    Img: string;        // урл на картинку
//    Contracts: IContract[];
//}

interface IEnergyPrices {
    sector: string;     // отрасль
    price: number;      // цена на энергию
    products: IProduct[];   // список продукции для данного сектора
}

interface IRegion {
    id: number;         // номер региона
    name: string;       // имя. Азербайджан и т.д
    energy: IDictionary<IEnergyPrices>;     // словарь с ценами на энергию. для всех отраслей
    salary: number;     // средняя зарплата в городе    
    tax: number;        // налоги. пока так заготовка лишь
}