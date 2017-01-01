
// настройки одной политики для одного юнита
class PolicyOptions {
    key: string;        // короткое имя политики pp/pw и так далее
    choices: number[];  // значения опций. Индекс = номер опции, а значение = значение опции

    constructor(name: string, choices: number[]) {
        this.name = name;
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