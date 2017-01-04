
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


interface IEmploees {
    id: number[];
    salaryWrk: number[];
    salaryCity: number[];
    skillWrk: number[];
    skillCity: number[];
    onHoliday: boolean;
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