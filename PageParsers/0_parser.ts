﻿// ==UserScript==
// @name           parsers
// @namespace      
// @description    parsers
// @version        12.1.1
// @include        https://virtonomica.ru/*/*
// ==/UserScript==

$ = jQuery = jQuery.noConflict(true);
let $xioDebug = true;

let urlTemplates: IDictionary<[string, (html: any, url: string)=> any]> = {
    manager: ["/#realm#/main/user/privat/persondata/knowledge", parseManager]
};

$(document).ready(() => parseStart());

function parseStart() {
    let href = window.location.href;
    let url = window.location.pathname;
    logDebug("url: ", href);

    let realm = getRealm(href);
    logDebug("realm: ", realm);
    if (realm == null)
        throw new Error("realm не найден.");

    for (let key in urlTemplates) {
        let h = urlTemplates[key][0].replace(/#realm#/, realm);
        if (h === url) {
            let obj = urlTemplates[key][1]($("html").html(), url);
            logDebug("parsed: ", obj);
        }
    }
}

function logDebug(msg: string, ...args: any[]) {
    if (!$xioDebug)
        return;

    if (args.length === 0)
        console.log(msg);
    else
        console.log(msg, args);
}

/**
 * Проверяет что элемент есть в массиве.
 * @param item
 * @param arr массив НЕ null
 */
function isOneOf<T>(item: T, arr: T[]) {
    return arr.indexOf(item) >= 0;
}

/**
 * Оцифровывает строку. Возвращает всегда либо Number.POSITIVE_INFINITY либо 0
 * @param variable любая строка.
 */
function numberfy(variable: string): number {
    // возвращает либо число полученно из строки, либо БЕСКОНЕЧНОСТЬ, либо 0 если не получилось преобразовать.

    if (String(variable) === 'Не огр.' ||
        String(variable) === 'Unlim.' ||
        String(variable) === 'Не обм.' ||
        String(variable) === 'N’est pas limité' ||
        String(variable) === 'No limitado' ||
        String(variable) === '无限' ||
        String(variable) === 'Nicht beschr.') {
        return Number.POSITIVE_INFINITY;
    } else {
        return parseFloat(variable.replace(/[\s\$\%\©]/g, "")) || 0;
        //return parseFloat(String(variable).replace(/[\s\$\%\©]/g, "")) || 0; //- так сделано чтобы variable когда undef получалась строка "0"
    }
};

function zipAndMin(napArr1: number[], napArr2: number[]) {
    // адская функция. так и не понял нафиг она

    if (napArr1.length > napArr2.length) {
        return napArr1;
    } else if (napArr2.length > napArr1.length) {
        return napArr2;
    } else {
        var zipped = napArr1.map((e, i) => [napArr1[i], napArr2[i]]);
        var res = zipped.map(function (e, i) {
            if (e[0] == 0) {
                return e[1];
            } else if (e[1] == 0) {
                return e[0];
            } else {
                return Math.min(e[0], e[1]);
            }
        });
        return res;
    }
}

/**
 * из урла  извлекает имя риалма.
 * @param url
 */
function getRealm(url: string): string | null {
    // https://*virtonomic*.*/*/main/globalreport/marketing/by_trade_at_cities/*
    // https://*virtonomic*.*/*/window/globalreport/marketing/by_trade_at_cities/*
    let rx = new RegExp(/https:\/\/virtonomica\.ru\/([a-zA-Z]+)\/.+/ig);
    let m = rx.exec(url);
    if (m == null)
        return null;

    return m[1];
}