//
// Свои исключения
// 

class ArgumentError extends Error {
    constructor(argument: string, message?: string) {
        let msg = `${argument}. ${message}`;
        super(msg);
    }
}

class ArgumentNullError extends Error {
    constructor(argument: string) {
        let msg = `${argument} is null`;
        super(msg);
    }
}

class ParseError extends Error {
    constructor(dataName: string, url?: string, innerError?: Error) {
        let msg = `Error parsing ${dataName}`;
        if (url)
            msg += `from $(url)`;

        msg += ".";
        if (innerError)
            msg += innerError.message + ".";

        super(msg);
    }
}
