
// настройки одной политики для одного юнита
class PolicyOptions {
    key: string;        // короткое имя политики pp/pw и так далее
    choices: number[];  // значения опций. Индекс = номер опции, а значение = значение опции

    constructor(key: string, choices: number[]) {
        this.key = key;
        this.choices = choices;
    }

    // конвертит в стандартную строку для хранения вида pp0-1-0.  Метод this безопасен
    toString = () => {
        return this.key + this.choices.join("-");
    }

    //  из строки хранения вида pp0-1-0 собирает объект.
    static fromString = (str: string) => {
        if (str.length < 3)
            throw new Error(`str:${str} должна иметь длину от 3 символов.`);

        let key = str.substring(0, 2);
        let choices = str.substring(2).split("-").map((item, index, arr) => numberfy(item));

        return new PolicyOptions(key, choices);;
    }
}

// берет любой набор элементов с аттрибутами data-name, data-choice и value и собирает с них опции 
// сразу их нормализуя в save формат
function parseOptions(elements: JQuery, policyDict: IDictionary<IPolicy>): PolicyOptions | null {

    // проверять что это селекты не будем, любая хуйня может быть лишь бы были в ней поля
    if (elements.length === 0)
        return null;

    let opts: number[] = [];
    let policyKey = elements.eq(0).attr("data-name");;
    let policy: IPolicy = policyDict[policyKey];
    for (var i = 0; i < elements.length; i++) {
        let el = elements.eq(i);

        if (policyKey !== el.attr("data-name"))
            throw new Error("Все элементы для парсинга опций должны принадлежать к одной политике.");

        let optionNumber = numberfy(el.attr("data-choice"));    // даже если аттрибута нет, нумерификация вернет 0 жопа.
        let optionValueIndex = parseInt(el.val());              // NaN будет если хуня в значении
        if (isNaN(optionValueIndex))
            throw new Error("Элементы в поле value должны содержать численное значение опции.")

        opts[optionNumber] = optionValueIndex;
        //let optionValue = policy.order[optionNumber][optionValueIndex];
        //let saveValueIndex = policy.save[optionNumber].indexOf(optionValue);
        //if (saveValueIndex < 0)
        //    throw new Error(`Не найден saveIndex для значения опции ${optionValue}.`);

        //opts.push(saveValueIndex);
    }
    opts = show2Save(policy, opts);     // переводим из отображаемой в сохраняемую нотацию

    let newPolicyStr = policyKey + opts.join("-");
    return PolicyOptions.fromString(newPolicyStr);
}

// формирует ключик для хранилища. сделано так чтобы в случае чего разом везде поменять и все.
function makeStorageKey(realm: string, subid: string): string {
    return "x" + realm + subid;
}

// загружаем из хранилища сразу все опции для данного юнита и реалма. выдаем стандартный словарь
function loadOptions(realm: string, subid: string): IDictionary<PolicyOptions> {

    let storageKey = makeStorageKey(realm, subid);
    let savedPolicyStrings: string[] = ls[storageKey] ? ls[storageKey].split(";") : [];
    let parsedDict: IDictionary<PolicyOptions> = {};

    for (var n = 0; n < savedPolicyStrings.length; n++) {
        let key = savedPolicyStrings[n].substring(0, 2);
        let choices = savedPolicyStrings[n].substring(2).split("-").map((item, index, arr) => numberfy(item));

        parsedDict[key] = new PolicyOptions(key, choices);
        logDebug(`parsed policy:${parsedDict[key].toString()}`);
    }

    return parsedDict;
}

// записывает в хранилище все опции всех политик для указанного юнита в указанном реалме. 
// подразумеваем что опции уже в save формате
function storeOptions(realm: string, subid: string, options: IDictionary<PolicyOptions>): void {

    if (Object.keys.length === 0)
        throw new Error("Попытка записать в лок. хранилище пустой набор опций. Аларм.");

    let storageKey = makeStorageKey(realm, subid);
    let newItems: string[] = [];
    for (var key in options)
        newItems.push(options[key].toString());

    let newSaveString = newItems.join(";");
    logDebug(`newSaveString:${newSaveString}`);

    ls[storageKey] = newSaveString;
}