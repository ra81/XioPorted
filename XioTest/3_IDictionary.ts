﻿
// стандартный словарь. 
// так тут устроены словари с индексами в виде строки, что нельзя им добавить свойств и методов. увы нах.
// если индексы численные то нет проблем
interface IDictionary<T> {
    [key: string]: T;
}

// проверяет есть ли ключи в словаре
function dictIsEmpty<T>(dict: IDictionary<T>): boolean {
    return Object.keys(dict).length === 0;
}

// словарь в виде одной строки через ,
function dict2String<T>(dict: IDictionary<T>): string {
    if (dictIsEmpty(dict))
        return "";

    let newItems: string[] = [];
    for (let key in dict)
        newItems.push(key + ":" + dict[key].toString());

    return newItems.join(", ");
}

//type Action = () => void;
interface IAction0 {
    (): void;
}

interface IAction1<T> {
    (arg: T): void;
}

// алиас для группы типов.
type MappedPage = IContract | IWareSupply | IWareSize | IWareMain | ITraining | ITech | IStoreSupply | IServiceHistory | IProductReport | ISaleContract | ICtie | ITransport | IIp | ITm | IRetailReport | IPriceHistory | IExperimentalUnit | IResearch | IConsume | IFinanceItem | IAjax | ISale | IService | IEmployees | IUnitList | ITopManager | IAds | IMachines | IAnimals | IEquipment | ISalary | IMain | ITradeHall | IProdSupply;

interface IMain {
    employees: number;
    salaryNow: number;
    salaryCity: number;
    skillNow: number;
    skillReq: number;
    equipNum: number;
    equipMax: number;
    equipQual: number;
    equipReq: number;
    equipWearBlack: number;
    equipWearRed: boolean;
    managerPic: string;
    qual: number;
    techLevel: number;
    maxEmployees: number;
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
    salaryWrk: number[];
    salaryCity: number[];
    skillWrk: number[];
    skillCity: number[];
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
    outqual: number[];
    outprime: number[];
    stockqual: number[];
    stockprime: number[];
    product: string[];
    productId: number[];
    region: string;
    contractpage: boolean;
    contractprice: string|number[];
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

interface ISaleContract {
    category: string[];
    contractprice: string|number[];
}

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
    purchase: number[];
    quantity: number[];
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

interface IContract {
    available: number[];
    offer: number[];
    price: number[];
    quality: number[];
    tm: string[];
    company: string[];
    myself: boolean[];
    product: string;
}