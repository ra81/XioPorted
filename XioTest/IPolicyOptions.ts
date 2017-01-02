
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

        return new PolicyOptions(key, choices);
    }
}

// берет контейнер селектов и собирает данные с аттрибутами data-name, data-choice и value
// сразу их нормализуя в save формат
function parseOptions(container: HTMLElement, policyDict: IDictionary<IPolicy>): PolicyOptions {

    let td = $(container);
    let selects = td.find("select.XioChoice");
    if (selects.length === 0)
        throw new Error("Нельзя ничего спарсить если нет элементов.");

    let opts: number[] = [];
    let policyKey = td.attr("policy-key");
    let policy: IPolicy = policyDict[policyKey];
    for (var i = 0; i < selects.length; i++) {
        let el = selects.eq(i);

        let optionNumber = numberfy(el.attr("option-number"));    // даже если аттрибута нет, нумерификация вернет 0 жопа.
        let optionValueIndex = parseInt(el.val());                // NaN будет если хуня в значении
        if (isNaN(optionValueIndex))
            throw new Error("Элементы в поле value должны содержать численное значение опции.")

        opts[optionNumber] = optionValueIndex;
    }
    opts = show2Save(policy, opts);     // переводим из отображаемой в сохраняемую нотацию

    let newPolicyStr = policyKey + opts.join("-");
    return PolicyOptions.fromString(newPolicyStr);
}

// формирует ключик для хранилища. сделано так чтобы в случае чего разом везде поменять и все.
function makeStorageKey(realm: string, subid: string): string {
    return "x" + realm + subid;
}

// загружаем из хранилища сразу все опции для данного юнита и реалма. выдаем стандартный словарь или {}
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

    if (dictIsEmpty(options))
        throw new Error("Попытка записать в лок. хранилище пустой набор опций. Аларм.");

    let storageKey = makeStorageKey(realm, subid);
    let newItems: string[] = [];
    let keys = Object.keys(options).sort();     // сортирнем ключики
    for (let i = 0; i < keys.length; i++)
        newItems.push(options[keys[i]].toString());

    let newSaveString = newItems.join(";");
    logDebug(`newSaveString:${newSaveString}`);

    ls[storageKey] = newSaveString;
}

// обновляет запись с политиками в хранилище. если чет делалось то вернет полный список опций юнита уже обновленный или {}
function updateOptions(realm: string, subid: string, options: IDictionary<PolicyOptions>): IDictionary<PolicyOptions> {
    if (dictIsEmpty(options))
        return {};

    let loaded = loadOptions(realm, subid);     // будет {} если опций нет
    logDebug(`oldOptions:${dict2String(loaded)}`);
    for (let key in options)
        loaded[key] = options[key];

    logDebug(`newOptions:${dict2String(loaded)}`)
    storeOptions(realm, subid, loaded);
    return loaded;
}

// формирует готовый контейнер с опциями который можно тупо вставлять куда надо
function buildContainerHtml(subid: string, policyKey: string, policy: IPolicy, empty?: boolean): string {

    if (policy == null)
        throw new Error("policy должен быть задан.")

    if (empty)
        return `<td policy-group=${policy.group} class='XioContainer XioEmpty'></td>`;

    // если не пустой надо сделать
    if (subid == null || subid.length === 0)
        throw new Error("subid должен быть задан.")

    if (policyKey == null || policyKey.length === 0)
        throw new Error("policyKey должен быть задан.")

    

    let uniqueId = subid + "-" + policyKey;
    let htmlstring = `<td unit-id=${subid} policy-group=${policy.group} policy-key=${policyKey} id=${uniqueId} class=XioContainer>
                         ${buildOptionsHtml(policy)}
                       </td>`;

    return htmlstring;
}

function buildOptionsHtml(policy: IPolicy): string {

    // в каждую строку юнита добавляем селекты для выбора политик. пока без установки значений.
    var htmlstring = "";
    for (var optionNumber = 0; optionNumber < policy.order.length; optionNumber++) {
        if (optionNumber >= 1)
            htmlstring += "<br>";

        htmlstring += `<select option-number=${optionNumber} class=XioChoice>`;
        for (var ind = 0; ind < policy.order[optionNumber].length; ind++) {
            let optionValue = policy.order[optionNumber][ind];
            htmlstring += `<option value=${ind}>${optionValue}</option>`;
        }

        htmlstring += "</select>";
    }

    return htmlstring;
}

// опции в режиме отображения подаем
function setOptions(container: HTMLElement, options: PolicyOptions, showMode: boolean, policy: IPolicy) {

    let $selects = $(container).find("select.XioChoice");
    let showChoices = showMode ? options.choices : save2Show(policy, options.choices);

    // проставляем теперь значения для этих селектов
    for (var optionNumber = 0; optionNumber < policy.order.length; optionNumber++)
        $selects.filter(`[option-number=${optionNumber}]`).val(Math.max(showChoices[optionNumber], 0));
}

// в будущем будут фильтры, эта шняга понадобится. да и пусть будет централизованно
function parseSubid(trList: HTMLElement[]): number[] {
    let rows = $(trList);
    return rows.find("td.unit_id").map((i, e) => numberfy( $(e).text() )).get() as any as number[];
}