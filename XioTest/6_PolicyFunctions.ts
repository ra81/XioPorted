//
// сюда кладем все функции которые собсна выполняют политики
//
function advertisement(policyName: string, subid: number, choices: number[]) {

    let url = "/" + $realm + "/main/unit/view/" + subid + "/virtasement";
    let urlFame = "/" + $realm + "/ajax/unit/virtasement/" + subid + "/fame";
    let urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    //["-", "Zero", "Min TV", "Max", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Req"]

    let pccost = 0;     // цена 1 контакта
    let getcount = 0;

    // ["Max", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50"]
    if (choices[0] >= 3 && choices[0] <= 9) {
        getcount++;
        xGet(urlManager, "manager", false, () => !--getcount && post());
    }

    // ["Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50"]
    if (choices[0] >= 4 && choices[0] <= 9) {
        getcount++;
        // чтобы послать запрос используем moneyCost=20000&type%5B0%5D=2260
        // подаем сумму и ID рекламы. Если сумма 0, то вернет по минимальной цене инфу.
        // Интернет = 2260, Печать, Наружка, Радио, Тв = 2264. Можно запросить любые данные ответ приходит такой
        /*
        contactCost: "2.07253886010363" - цена контакта
        contactCount: "965"             - число контактов за данную сумму.
        minCost: "2000"                 - минималка для данного вида рекламы
        population: "2258018"           - население города общее
        productivity: "1"               - эффективность рекламы
        totalCost: "2000"               - конечная стоимость рекламы. Обычно или минималка или то что мы послали
        */
        // TODO: как сказала djerri рекламу держать все время нехорошо. Надо ее снимать и ставить минималку на поддержание
        // принцип 2 дня реклмы, и 3 дня поддержание и все. 
        xPost(urlFame, "moneyCost=0&type%5B0%5D=2264", (data) => {
            pccost = numberfy(JSON.parse(data).contactCost);
            !--getcount && post();
        });
    }

    //["Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Req"]
    if (choices[0] >= 4) {
        getcount++;
        xGet(url, "ads", false, () => !--getcount && post());
    }

    //["-", "Zero", "Min TV"]
    if (choices[0] <= 2)
        post();


    function post() {
        $("[id='x" + "Ads" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _ads = $mapped[url] as IAds;

        let data = "";
        let budget = 0;
        switch (choices[0]) {
            case 1: // Zero
                data = "cancel=Stop+advertising";
                break;

            case 2: // Min TV
                data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=0";
                break;

            case 3: // Max
                var _top = $mapped[urlManager] as ITopManager;
                var qualIndex = _top.pic.indexOf(subType["advertisement"][2]);
                var topQual = _top.base[qualIndex] + _top.bonus[qualIndex];

                budget = 200010 * Math.pow(topQual, 1.4);
                data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
                break;

            case 4: // "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50"
            case 5:
            case 6:
            case 7:
            case 8:
            case 9:
                var _top = $mapped[urlManager] as ITopManager;
                var qualIndex = _top.pic.indexOf(subType["advertisement"][2]);
                var topQual = _top.base[qualIndex] + _top.bonus[qualIndex];

                let multiplier = [1, 2, 5, 10, 20, 50];
                budget = Math.round(_ads.pop * pccost * multiplier[choices[0] - 4]);
                let maxbudget = Math.floor(200010 * Math.pow(topQual, 1.4));
                budget = Math.min(budget, maxbudget);
                data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
                break;
                // TODO: если например требуемый бюджет 0, тупит и ставит минималку по ТВ. 
            case 10: // "Req"
                data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + _ads.requiredBudget;
        }

        // ставим рекламу
        if (choices[0] <= 3 || budget !== _ads.budget)
            xPost(url, data, () => xTypeDone(policyName));
        else
            xTypeDone(policyName);
    }
}

function equipment(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/window/unit/equipment/" + subid;
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlSalary = "/" + $realm + "/window/unit/employees/engage/" + subid;
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var urlEquipment = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/equipment";
    var urlAnimals = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/animals";

    var getcount = 0;
    let equip: any = {};

    getcount += 4;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithEquipment/20000", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithEquipment/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithAnimals/20000", "none", false, function () {
        !--getcount && phase();
    });
    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithAnimals/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });

    function phase() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        getcount += 2;
        xGet(urlEquipment, "machines", false, function () {
            !--getcount && phase2();
        });
        xGet(urlAnimals, "animals", false, function () {
            !--getcount && phase2();
        });
    }

    function phase2() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _machines = $mapped[urlEquipment] as IMachines;
        let _animals = $mapped[urlAnimals] as IAnimals;

        for (var i = 0; i < _machines.subid.length; i++) {
            if (_machines.subid[i] === subid) {
                for (var key in _machines)     // TODO: конский хак. как то переделать
                    equip[key] = (_machines as any)[key][i];

                break;
            }
        }

        for (var i = 0; i < _animals.subid.length; i++) {
            if (_animals.subid[i] === subid) {
                for (var key in _animals) // TODO: конский хак. как то переделать
                    equip[key] = (_animals as any)[key][i];

                equip["perc"] = 100 - _animals.perc[i];
                break;
            }
        }

        // console.log('phase2 equip.black = ' + equip.black);
        if (
            equip.black > 0
            || choices[1] === 1 && equip.red > 0
            || choices[1] === 2 && equip.perc >= 1
            || choices[0] === 1 && equip.required > equip.quality
        ) {
            getcount++;
            xsup.push([subid, equip.id,
                (function () {
                    xGet(url, "equipment", true, function () {
                        let _equip = $mapped[url] as IEquipment;

                        if (equipfilter.indexOf(_equip.filtername) === -1) {
                            equipfilter.push(_equip.filtername);
                            getcount += 3;
                            xGet("/" + $realm + "/window/common/util/setpaging/db" + _equip.filtername + "/equipmentSupplierListByUnit/40000", "none", false, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            var data = "total_price%5Bfrom%5D=&total_price%5Bto%5D=&quality%5Bfrom%5D=&quality%5Bto%5D=&quantity%5Bisset%5D=1&quantity%5Bfrom%5D=1&total_price%5Bfrom%5D=0&total_price%5Bto%5D=0&total_price_isset=0&quality%5Bfrom%5D=0&quality%5Bto%5D=0&quality_isset=0&quantity_isset=1";
                            xPost("/" + $realm + "/window/common/util/setfiltering/db" + _equip.filtername + "/equipmentSupplierListByUnit", data, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            xGet("/" + $realm + "/window/common/util/setfiltering/db" + _equip.filtername + "/equipmentSupplierListByUnit/supplierType=all", "none", false, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            xsup.push([subid, equip.id, (function () {
                                xGet(url, "equipment", true, function () {
                                    !--getcount && post();
                                });
                            })]);
                        }
                        else {
                            !--getcount && post();
                        }
                    });
                })
            ]);
            xsupGo();

            if (choices[0] === 2) {
                getcount += 2;
                xGet(urlSalary, "salary", false, function () {
                    !--getcount && post();
                });
                xGet(urlManager, "manager", false, function () {
                    !--getcount && post();
                });
            }
        }
        else {
            xTypeDone(policyName);
        }

    }

    function post(this:any) {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _equip = $mapped[url] as IEquipment;
        var equipWear = 0;
        // console.log('choices[1] = ' + choices[1]);
        // console.log('equip.black = ' + equip.black);
        // console.log('equip.red = ' + equip.red);
        // console.log('equip.perc = ' + equip.perc);
        // console.log('equip.required = ' + equip.required);
        // console.log('equip.quality = ' + equip.quality);
        // console.log('equip.type = ' + equip.type);

        if (equip.required < equip.quality * 0.9) {
            equip.required = equip.quality;
        }

        if (choices[1] === 0) {
            equipWear = equip.black;
        }
        else if (choices[1] === 1) {
            equipWear = equip.black + equip.red;
        }
        else if (choices[1] === 2) {
            equipWear = equip.perc >= 1 ? 1 : 0;
        }

        var change:any[] = [];

        if (choices[0] === 1) {

            var offer:any = {
                low: [],
                high: [],
                inc: []
            };

            var qualReq = (equip.required || 0) + 0.005;
            var qualNow = equip.quality - 0.005;
            // console.log('qualReq = ' + qualReq);
            // console.log('qualNow = ' + qualNow);

            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / _equip.qualOffer[i],
                    quality: _equip.qualOffer[i],
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                // console.log('data.quality = ' + data.quality );
                if (data.quality < qualReq) {
                    offer.low.push(data);
                }
                else {
                    offer.high.push(data);
                }
            }

            for (var key in offer) {
                offer[key].sort(function (a:any, b:any) {
                    return a.PQR - b.PQR;
                });
            }

            var l = 0;
            var h = 0;
            var qualEst = 0;
            var qualNew = qualNow;
            // console.log('offer.low.length = ' + offer.low.length);
            // console.log('offer.high.length = ' + offer.high.length);

            while (equipWear > 0 && h < offer.high.length) {
                // console.log('l = ' + l);
                // console.log('h = ' + h);

                if (offer.low[l] && offer.low[l].length > l && offer.low[l].available - offer.low[l].buy === 0) {
                    l++;
                    // console.log('continue l');
                    continue;
                }
                if (offer.high[h] && offer.high[h].length > h && offer.high[h].available - offer.high[h].buy === 0) {
                    h++;
                    // console.log('continue h');
                    continue;
                }

                // console.log(subid, l, offer.low[l].available - offer.low[l].buy, offer.low[l]);
                // console.log(subid, h, offer.high[h].available - offer.high[h].buy, offer.high[h]);

                qualEst = qualNew;
                l < offer.low.length && offer.low[l].buy++;
                for (var key in offer) {
                    for (var i = 0; i < offer[key].length; i++) {
                        if (offer[key][i].buy) {
                            qualEst = ((equip.num - offer[key][i].buy) * qualEst + offer[key][i].buy * offer[key][i].quality) / equip.num;
                        }
                    }
                }
                l < offer.low.length && offer.low[l].buy--;

                if (l < offer.low.length && qualEst > qualReq && offer.low[l].PQR < offer.high[h].PQR) {
                    offer.low[l].buy++;
                }
                else {
                    offer.high[h].buy++;
                }

                equipWear--;
            }

            for (var key in offer) {
                for (var i = 0; i < offer[key].length; i++) {
                    if (offer[key][i].buy) {
                        change.push({
                            op: "repair",
                            offer: offer[key][i].offer,
                            amount: offer[key][i].buy
                        });
                        qualNew = ((equip.num - offer[key][i].buy) * qualNew + offer[key][i].buy * offer[key][i].quality) / equip.num;
                    }
                }
            }

            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / (_equip.qualOffer[i] - qualReq),
                    quality: _equip.qualOffer[i] - 0.005,
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                if (data.quality > qualReq) {
                    offer.inc.push(data);
                }
            }

            offer.inc.sort(function (a:any, b:any) {
                return a.PQR - b.PQR;
            });

            var n = 0;
            qualEst = 0;
            var torepair = 0;
            for (var i = 0; i < offer.inc.length; i++) {
                if (offer.inc[i].buy) {
                    torepair += offer.inc[i].buy;
                    qualEst += offer.inc[i].buy * offer.inc[i].quality;
                }
            }
            qualEst = (qualEst + (equip.num - torepair) * qualNow) / equip.num;

            while (qualEst < qualReq && n < offer.inc.length) {

                if (offer.inc[n] && offer.inc[n].length > n && offer.inc[n].available - offer.inc[n].buy === 0) {
                    n++;
                    continue;
                }

                offer.inc[n].buy++;

                qualEst = 0;
                torepair = 0;
                for (var i = 0; i < offer.inc.length; i++) {
                    if (offer.inc[i].buy) {
                        torepair += offer.inc[i].buy;
                        qualEst += offer.inc[i].buy * offer.inc[i].quality;
                    }
                }
                qualEst = (qualEst + (equip.num - torepair) * qualNow) / equip.num;
            }

            if (torepair) {
                change.push({
                    op: "terminate",
                    amount: torepair
                });
            }

            for (var i = 0; i < offer.inc.length; i++) {
                if (offer.inc[i].buy) {
                    change.push({
                        op: "buy",
                        offer: offer.inc[i].offer,
                        amount: offer.inc[i].buy
                    });
                }
            }

            if (equipWear > 0 && (h < offer.high.length || n < offer.inc.length)) {
                postMessage0("No equipment on the market with a quality higher than required. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }

        }

        else if (choices[0] === 2 && equipWear !== 0) {
            let _top = $mapped[urlManager] as ITopManager;
            let _salary = $mapped[urlSalary] as ISalary;

            var managerIndex = _top.pic.indexOf(subType[equip.type][2]);
            var equipMax = calcEquip(calcSkill(_salary.employees, subType[equip.type][0], _top.base[managerIndex] + _top.bonus[managerIndex]));

            let offer: any = {
                low: [],
                mid: [],
                high: []
            };

            let qualNow = equip.quality + 0.005;

            for (var i = 0; i < _equip.offer.length; i++) {
                var data = {
                    PQR: _equip.price[i] / _equip.qualOffer[i],
                    quality: _equip.qualOffer[i] + 0.005,
                    available: _equip.available[i],
                    buy: 0,
                    offer: _equip.offer[i],
                    index: i
                };
                if (data.quality < qualNow) {
                    offer.low.push(data);
                }
                else if (data.quality < equipMax) {
                    offer.mid.push(data);
                }
                else {
                    offer.high.push(data);
                }
            }

            for (var key in offer) {
                offer[key].sort(function (a:any, b:any) {
                    return a.PQR - b.PQR;
                });
            }

            var l = 0;
            var m = 0;
            var h = 0;
            var qualEst = 0;
            let qualNew = qualNow;

            while (equipWear > 0 && l + m < offer.low.length + offer.mid.length && m + h < offer.mid.length + offer.high.length) {

                if (offer.low[l] && offer.low[l].length > l && offer.low[l].available - offer.low[l].buy === 0) {
                    l++;
                    continue;
                }
                if (offer.mid[m] && offer.mid[m].length > m && offer.mid[m].available - offer.mid[m].buy === 0) {
                    m++;
                    continue;
                }
                if (offer.high[h] && offer.high[h].length > h && offer.high[h].available - offer.high[h].buy === 0) {
                    h++;
                    continue;
                }

                qualEst = qualNew;
                h < offer.high.length && offer.high[h].buy++;
                for (var key in offer) {
                    for (var i = 0; i < offer[key].length; i++) {
                        if (offer[key][i].buy) {
                            qualEst = ((equip.num - offer[key][i].buy) * qualEst + offer[key][i].buy * offer[key][i].quality) / equip.num;
                        }
                    }
                }
                h < offer.high.length && offer.high[h].buy--;

                if (h < offer.high.length && qualEst < equipMax && (m === offer.mid.length || offer.high[h].PQR < offer.mid[m].PQR)) {
                    offer.high[h].buy++;
                }
                else if (l < offer.low.length && qualEst > equipMax && (m === offer.mid.length || offer.low[l].PQR < offer.mid[m].PQR)) {
                    offer.low[l].buy++;
                }
                else {
                    offer.mid[m].buy++;
                }

                equipWear--;
            }

            for (var key in offer) {
                for (var i = 0; i < offer[key].length; i++) {
                    if (offer[key][i].buy) {
                        change.push({
                            op: "repair",
                            offer: offer[key][i].offer,
                            amount: offer[key][i].buy
                        });
                        qualNew = ((equip.num - offer[key][i].buy) * qualNew + offer[key][i].buy * offer[key][i].quality) / equip.num;
                    }
                }
            }

            if (equipWear > 0 && l + m < offer.low.length + offer.mid.length) {
                postMessage0("No equipment on the market with a quality lower than the maximum quality defined by the Top1. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
            else if (equipWear > 0 && m + h < offer.mid.length + offer.high.length) {
                postMessage0("No equipment on the market with a quality higher than the current quality. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }

        }

        else if (choices[0] === 3 && equipWear !== 0) {

            let offer:any[] = [];

            for (var i = 0; i < _equip.offer.length; i++) {
                offer.push({
                    price: _equip.price[i],
                    quality: _equip.qualOffer[i],
                    available: _equip.available[i],
                    offer: _equip.offer[i],
                    index: i
                });
            }

            offer.sort(function (a, b) {
                return a.price - b.price;
            });

            var i = 0;
            while (equipWear > 0 && i < offer.length) {

                var tobuy = 0;
                if (offer[i].quality === 2.00) {

                    tobuy = Math.min(equipWear, offer[i].available);
                    equipWear -= tobuy;
                    change.push({
                        op: "repair",
                        offer: offer[i].offer,
                        amount: tobuy
                    });

                }
                i++;
            }

            if (i === offer.length) {
                postMessage0("No equipment on the market with a quality of 2.00. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }

        }

        var equipcount = change.length;
        change.length && console.log(subid, change);
        for (var i = 0; i < change.length; i++) {
            xequip.push(
                (function (i:number) {
                    xContract("/" + $realm + "/ajax/unit/supply/equipment", {
                        'operation': change[i].op,
                        'offer': change[i].offer,
                        'unit': subid,
                        'supplier': change[i].offer,
                        'amount': change[i].amount
                    },
                        function (data) {
                            if (xequip.length) {
                                xequip.shift()();
                            }
                            else {
                                fireequip = false;
                            }
                            !--equipcount && xTypeDone(policyName);
                            !equipcount && xsupGo(subid, equip.id);
                        });
                }.bind(this, i))
            );
        }

        if (xequip.length && !fireequip) {
            fireequip = true;
            xequip.shift()();
        }
        else if (equipcount === 0) {
            xTypeDone(policyName);
            xsupGo(subid, equip.id);
        }

    }

}

function holiday(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/company/view/" + companyid + "/unit_list/employee/salary";
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlSupply = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlTrade = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";

    var getcount = 2;
    xGet("/" + $realm + "/main/common/util/setpaging/dbunit/unitListWithHoliday/20000", "none", false, function () {
        !--getcount && phase();
    });

    xGet("/" + $realm + "/main/common/util/setfiltering/dbunit/unitListWithHoliday/class=0/type=0", "none", false, function () {
        !--getcount && phase();
    });

    if (choices[0] === 3) {
        getcount++;
        xGet(urlMain, "main", false, function () {
            !--getcount && phase();
        });
    }

    function phase() {
        $("[id='x" + "Holiday" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
        getcount++;
        xGet(url, "employees", false, function () {
            !--getcount && post();
        });

        let _main = $mapped[urlMain] as IMain;

        if (choices[0] === 3 && _main.isStore) {
            getcount++;
            xGet(urlTrade, "tradehall", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 3 && !_main.isStore) {
            getcount++;
            xGet(urlSupply, "prodsupply", false, function () {
                !--getcount && post();
            });
        }
    }

    function post() {
        $("[id='x" + "Holiday" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var holiday = true;
        let _main = $mapped[urlMain] as IMain;
        let _employees = $mapped[url] as IEmployees;
        let _tradeHall = $mapped[urlTrade] as ITradeHall;
        let _prodSupply = $mapped[urlSupply] as IProdSupply;

        if (choices[0] === 2) {
            holiday = false;
        }
        else if (choices[0] === 3) {
            if (_main.isStore) {
                holiday = true;
                for (var i = 0; i < _tradeHall.stock.length; i++) {
                    if (_tradeHall.stock[i])
                        holiday = false;
                }

                if (!_tradeHall.stock.length)
                    holiday = true;
            }
            else {
                holiday = false;
                for (var i = 0; i < _prodSupply.stock.length; i++) {
                    if (!_prodSupply.stock[i])
                        holiday = true;
                }

                if (_prodSupply.stock.length !== _prodSupply.required.length)
                    holiday = true;
            }
        }

        var index = _employees.id.indexOf(subid);
        var onHoliday = _employees.onHoliday[index];

        if (holiday && !onHoliday) {
            xGet("/" + $realm + "/main/unit/view/" + subid + "/holiday_set", "none", false, function () {
                xTypeDone(policyName);
            });
        }
        else if (!holiday && onHoliday) {
            xGet("/" + $realm + "/main/unit/view/" + subid + "/holiday_unset", "none", false, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function incineratorPrice(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/sale";

    xGet(url, "service", false, function () {
        xGet(url2, "sale", false, function () {
            post();
        });
    });

    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _service = $mapped[url] as IService;
        let _sale = $mapped[url2] as ISale;
        var change = false;
        var data = "setprice=1";

        for (var i = 0; i < _service.incineratorPrice.length; i++) {
            var price = 0;
            if (choices[0] === 1)
                price = _sale.incineratorMaxPrice[i];

            price = numberfy(price.toPrecision(4)); // TODO: тут как бы поправил, хз что он имел ввиду. явно привел к числу

            if (_service.incineratorPrice[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }

        }

        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function politicAgitation(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlFinance = "/" + $realm + "/main/unit/view/" + subid + "/finans_report/by_item";
    var urlAjax = "/" + $realm + "/ajax/unit/artefact/list/?unit_id=" + subid + "&slot_id=368592";

    xGet(url, "main", false, function () {
        phase();
    });

    function phase() {
        $("[id='x" + "Politics" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var getcount = 0;
        let _main = $mapped[url] as IMain;

        if (!_main.hasAgitation && choices[0] === 1) {
            getcount += 1;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
        }
        else {
            xTypeDone(policyName);
        }
    }


    function post() {
        $("[id='x" + "Politics" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _main = $mapped[url] as IMain;
        let _ajax = $mapped[urlAjax] as IAjax;

        for (var artid in $mapped[urlAjax]) { // TODO: бля вот тут просто говнокодище. возможно будет баг
            if (_ajax[artid].symbol === "agitation_1.gif" && numberfy(_ajax[artid].size) === _main.size) {
                xGet("/" + $realm + "/ajax/unit/artefact/attach/?unit_id=" + subid + "&artefact_id=" + artid + "&slot_id=368592", "none", false, function () {
                    xTypeDone(policyName);
                });

                break;
            }
        }
    }
}

function prodBooster(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlFinance = "/" + $realm + "/main/unit/view/" + subid + "/finans_report/by_item";
    var urlAjax = "/" + $realm + "/ajax/unit/artefact/list/?unit_id=" + subid + "&slot_id=300139";

    xGet(url, "main", false, function () {
        phase();
    });

    function phase() {
        $("[id='x" + "Solars" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var getcount = 0;
        let _main = $mapped[url] as IMain;

        if (!_main.hasBooster && choices[0] === 1) {
            getcount += 1;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
        }
        else if (!_main.hasBooster && choices[0] === 2) {
            getcount += 2;
            xGet(urlAjax, "ajax", false, function () {
                !--getcount && post();
            });
            xGet(urlFinance, "financeitem", false, function () {
                !--getcount && post();
            });

        }
        else {
            xTypeDone(policyName);
        }
    }

    function post() {
        $("[id='x" + "Solars" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _main = $mapped[url] as IMain;
        let _ajax = $mapped[urlAjax] as IAjax;
        let _financeItem = $mapped[urlFinance] as IFinanceItem;

        for (var artid in _ajax) {
            if (_ajax[artid].symbol === "20221659.gif" && numberfy(_ajax[artid].size) === _main.size) {
                if (choices[0] === 2) {
                    var costs = numberfy(_ajax[artid].initial_cost) / numberfy(_ajax[artid].ttl) + numberfy(_ajax[artid].cost_per_turn);
                    var savings = _financeItem.energy / 2;

                    if (costs >= savings) {
                        xTypeDone(policyName);
                        return false;
                    }
                }

                xGet("/" + $realm + "/ajax/unit/artefact/attach/?unit_id=" + subid + "&artefact_id=" + artid + "&slot_id=300139", "none", false, function () {
                    xTypeDone(policyName);
                });

                break;
            }
        }

        return false;
    }
}

function prodSupply(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/consume";
    var urlContract = "/" + $realm + "/ajax/unit/supply/create";


    xGet(url, "prodsupply", false, function () {
        phase();
    });

    function phase() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _prodSupply = $mapped[url] as IProdSupply;
        if (choices[0] >= 2 && !_prodSupply.isProd && choices[0] !== 4) {
            xGet(url2, "consume", false, function () {
                post();
            });
        }
        else {
            post();
        }
    }

    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _prodSupply = $mapped[url] as IProdSupply;
        let _consume = $mapped[url2] as IConsume;

        if (choices[0] === 4) {
            var data = 'destroy=1';

            for (var i = 0; i < _prodSupply.offer.length; i++) {
                data += "&" + encodeURI("multipleDestroy[]=" + _prodSupply.offer[i]);
            }
            if (_prodSupply.offer.length > 0) {
                xPost(url, data, function () {
                    xTypeDone(policyName);
                });
            }
            else {
                xTypeDone(policyName);
            }
        } else {

            if (_prodSupply.parcel.length !== _prodSupply.required.length) {
                choices[0] = 1;
                postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> is missing a supplier, or has too many suppliers!");
            }

            for (var i = 0; i < _prodSupply.parcel.length; i++) {
                var newsupply = 0;
                if (choices[0] === 2 && _prodSupply.isProd) {
                    newsupply = _prodSupply.required[i]
                }
                else if (choices[0] === 2 && !_prodSupply.isProd) {
                    newsupply = _consume.consump[i];
                }
                else if (choices[0] === 3 && _prodSupply.isProd) {
                    newsupply = Math.min(2 * _prodSupply.required[i], Math.max(3 * _prodSupply.required[i] - _prodSupply.stock[i], 0));
                }
                else if (choices[0] === 3 && !_prodSupply.isProd) {
                    newsupply = Math.min(2 * _consume.consump[i], Math.max(3 * _consume.consump[i] - _prodSupply.stock[i], 0));
                }
                if (newsupply > 0 && _prodSupply.available[i] < newsupply) {
                    var prodText = (_prodSupply.isProd) ? "(production) " : "";
                    postMessage0("Subdivision " + prodText + "<a href=" + url + ">" + subid + "</a> has insufficient reserves at the supplier!");
                    break;
                }
            }

            let change:any[] = [];
            for (var i = 0; i < _prodSupply.parcel.length; i++) {
                var newsupply = 0;
                if (choices[0] === 1) {
                    newsupply = 0;
                }
                else if (choices[0] === 2 && _prodSupply.isProd) {
                    newsupply = _prodSupply.required[i]
                }
                else if (choices[0] === 2 && !_prodSupply.isProd) {
                    newsupply = _consume.consump[i];
                }
                else if (choices[0] === 3 && _prodSupply.isProd) {
                    newsupply = Math.min(2 * _prodSupply.required[i], Math.max(3 * _prodSupply.required[i] - _prodSupply.stock[i], 0));
                }
                else if (choices[0] === 3 && !_prodSupply.isProd) {
                    newsupply = Math.min(2 * _consume.consump[i], Math.max(3 * _consume.consump[i] - _prodSupply.stock[i], 0));
                }

                if (_prodSupply.parcel[i] !== newsupply || _prodSupply.reprice[i]) {
                    change.push({
                        amount: newsupply,
                        offer: _prodSupply.offer[i],
                        unit: subid,
                        priceMarkUp: _prodSupply.price_mark_up[i],
                        priceConstraint: _prodSupply.price_constraint_max[i],
                        constraintPriceType: _prodSupply.price_constraint_type[i],
                        qualityMin: _prodSupply.quality_constraint_min[i]
                    });
                }
            }

            // TODO: зачем каждый поставщик шлется отдельно? Разом все чтобы уменьшить число запросов
            var postcount = change.length;
            if (postcount) {
                for (var i = 0; i < change.length; i++) {
                    xContract(urlContract, change[i], function () {
                        !--postcount && xTypeDone(policyName);
                    });
                }
            }
            else {
                xTypeDone(policyName);
            }
        }
    }
}

function research(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/investigation";
    var urlProject = "/" + $realm + "/window/unit/view/" + subid + "/project_create";
    var urlUnit = "/" + $realm + "/window/unit/view/" + subid + "/set_experemental_unit";
    var urlForecast = "/" + $realm + "/ajax/unit/forecast";
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";

    xGet(url, "research", false, function () {
        $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _research = $mapped[url] as IResearch;

        if (choices[0] === 1 && _research.isFree) {
            xGet(urlManager, "manager", false, function () {
                let _top = $mapped[urlManager] as ITopManager;

                var managerIndex = _top.pic.indexOf("/img/qualification/research.png");
                var manager = _top.base[managerIndex] + _top.bonus[managerIndex];

                if (_research.level + 1 < calcTechLevel(manager)) {
                    xPost(urlProject, "industry=" + _research.industry + "&unit_type=" + _research.unittype, function (data) {
                        $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                        var isContinue = !!$(data).find(":submit").length;
                        if (isContinue) {
                            let data = "industry=" + _research.industry + "&unit_type=" + _research.unittype + "&level=" + (_research.level + 1) + "&create=Invent";
                            xPost("/" + $realm + "/window/unit/view/" + subid + "/project_create", data, function () {
                                $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                                xTypeDone(policyName);
                            });
                        }
                        else {
                            postMessage0("Laboratory <a href=" + url + ">" + subid + "</a> reached the maximum technology level for its size. Could not research the next level.");
                            xTypeDone(policyName);
                        }
                    });
                }
                else {
                    xTypeDone(policyName);
                }
            });
        }
        else if (choices[0] === 1 && _research.isHypothesis && !_research.isBusy) {

            function calcProduct(p:number, n:number) {
                var value = 1;
                for (var m = 1; m <= n - 1; m++)
                    value = value * (1 - (1 / 100 * (m - 1) + p));

                return value;
            }

            function calcStudyTime(p:number, k:number) {
                //p is possibility between 0 and 1
                //k is reference time between 0 and +infinite    
                var value = 0;
                for (var n = 0; n <= 100 * (1 - p); n++)
                    value += k * (n + 1) * (1 / 100 * n + p) * calcProduct(p, n + 1);

                return value;
            }

            var favid = -1;
            var favindex = -1;
            var lowtime = Infinity;
            for (var i = 0; i < _research.chance.length; i++) {
                var studytime = calcStudyTime(_research.chance[i] / 100, _research.time[i]);
                if (studytime < lowtime) {
                    lowtime = studytime;
                    favid = _research.hypId[i];
                    favindex = i;
                }

            }

            if (_research.curIndex !== favindex) {
                var data = "selectedHypotesis=" + favid + "&selectIt=Select+a+hypothesis";
                xPost(url, data, function () {
                    $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                    xTypeDone(policyName);
                });
            }
            else {
                xTypeDone(policyName);
            }

        }
        else if (choices[0] === 1 && (_research.isAbsent || _research.isFactory)) {
            xGet(urlUnit, "experimentalunit", false, function () {
                $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

                let _expUnit = $mapped[urlUnit] as IExperimentalUnit;
                type TEffi = { id: number, efficiency: number, load: number };
                let effi: TEffi[] = [];
                var contractcount = _expUnit.id.length;
                for (var i = 0; i < _expUnit.id.length; i++) {
                    (function (i) {
                        xContract(urlForecast, { "unit_id": _expUnit.id[i] }, function (data) {
                            $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                            effi.push({
                                "id": _expUnit.id[i],
                                "efficiency": numberfy(data.productivity),
                                "load": numberfy(data.loading)
                            });
                            !--contractcount && post();
                        });
                    })(i);
                }

                if (!_expUnit.id.length) {
                    postMessage0("There is no factory available to support laboratory <a href=" + url + ">" + subid + "</a>");
                    xTypeDone(policyName);
                }

                function post() {
                    $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

                    var efficient = 0;
                    var index = -1;
                    for (var i = 0; i < effi.length; i++) {
                        if (efficient < effi[i].efficiency * effi[i].load) {
                            efficient = effi[i].efficiency * effi[i].load;
                            index = i;
                        }
                    }

                    if (index === -1) {
                        postMessage0("There is no factory available to support laboratory <a href=" + url + ">" + subid + "</a>");
                        xTypeDone(policyName);
                    }
                    else {
                        var data = "unit=" + effi[index].id + "&next=Select";
                        xPost(urlUnit, data, function () {
                            $("[id='x" + "Research" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');
                            xTypeDone(policyName);
                        });
                    }
                }
            });
        }
        else {
            xTypeDone(policyName);
        }
    });
}

function retailPrice(policyName: string, subid: number, choices: number[]) {
    //debugger;
    var url = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";
    xGet(url, "tradehall", false, function () { phase(); });

    function phase() {
        $("#xPricecurrent").html(`<a href=/${$realm}/main/unit/view/${subid}>${subid}</a>`);

        let _tradeHall = $mapped[url] as ITradeHall;

        // запрос нужных ссылок для отработки потом опций
        switch (choices[0]) {

            case 2: // Market 10%
            case 3: // Turnover
            case 4: // stock
            case 7: // Sales
            case 8: // Market 6%
                {
                    // запрашиваем историю цен
                    var getcount = _tradeHall.history.length;
                    for (var i = 0; i < _tradeHall.history.length; i++) {
                        xGet(_tradeHall.history[i], "pricehistory", false,
                            function () { !--getcount && post(); });
                    }
                }
                break;

            case 5: // Local
                {
                    // запрос отчета по Рознице для товара в городе
                    var getcount = _tradeHall.report.length;
                    for (var i = 0; i < _tradeHall.report.length; i++) {
                        xGet(_tradeHall.report[i], "retailreport", false,
                            function () { !--getcount && post(); });
                    }
                }
                break;

            default:
                post();
        }
    }

    function post() {
        $("#xPricecurrent").html(`<a href=/${$realm}/main/unit/view/${subid}>${subid}</a>`);

        let _tradeHall = $mapped[url] as ITradeHall;
        var change = false;
        var data = "action=setprice";

        // пробегаем по каждому товару Торгового зала
        for (var i = 0; i < _tradeHall.price.length; i++) {
            var price = 0;

            // опция 1. Стратегия установки цены
            switch (choices[0]) {
                case 1:
                    price = zero(i);
                    break;

                case 2:
                    price = market10(i);
                    break;

                case 3:
                    price = turnover(i);
                    break;

                case 4:
                    price = stock(i);
                    break;

                case 5:
                    price = local(i);
                    break;

                case 6:
                    price = city(i);
                    break;

                case 7:
                    price = sales(i);
                    break;

                case 8:
                    price = market6Ex(i);
                    break;

                default:
                    price = 0;
            }

            price = numberfy(price.toPrecision(4));

            // опция 2. ограничение мин цены продажи
            var myPurchPrice = _tradeHall.purch[i];                // цена закупки товара
            var myPrice = _tradeHall.price[i];

            var multiplier = [0, 1, 1.1, 1.4, 2];
            var prime = Math.round(myPurchPrice * multiplier[choices[1]]);
            price = Math.max(price, prime);

            // если цена подлежит изменению, поднять флаг и добавить в общий список.
            if (myPrice !== price && price > 0) {
                change = true;
                data += "&" + encodeURI(_tradeHall.name[i] + "=" + price);
            }
        }

        // если есть изменения цен, отправим данные, иначе завершаем
        if (change) {
            xPost(url, data, function () { xTypeDone(policyName); });
        }
        else {
            xTypeDone(policyName);
        }
    }

    function zero(item: number) {
        return 0;
    }

    function market6(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        var priceOld = _history.price[0];                         // цена последней продажи
        var share = _tradeHall.share[item];                       // доля рынка которую занимаем

        var price = priceOld || 0;
        if (share < 4.5)
            price *= (1 - 0.03);

        if (share > 7.5)
            price *= (1 + 0.03);

        return price;
    }

    function market6Ex(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        //debugger;
        // в расчетах предполагаем, что парсер нам гарантирует 0 или число, если элемент есть в массиве.
        // не паримся с undefined
        if (!_tradeHall) {
            postMessage0(`Subdivision <a href=${url}>${subid}</a> has unit == null`);
            return 0;
        }

        if (!_history) {
            postMessage0(`Subdivision <a href=${url}>${subid}</a> has salesHistory == null`);
            return 0;
        }

        // в истории продаж всегда должна быть хотя бы одна строка. Пусть с 0, но должна быть
        if (_history.price.length < 1) {
            postMessage0(`Subdivision <a href=${url}>${subid}</a> has salesHistory.price.length < 1`);
            return 0;
        }

        // мое качество сегодня и цена стоящая в окне цены, кач и цена локальных магазов сегодня
        var myQuality = _tradeHall.quality[item];
        var myPrice = _tradeHall.price[item];
        var cityPrice = _tradeHall.cityprice[item];
        var cityQuality = _tradeHall.cityquality[item];

        // продажи сегодня и цена для тех продаж.
        var priceOld = _history.price[0];
        var saleOld = _history.quantity[0];
        var priceOlder = _history.price[1] || 0; // более старых цен может и не быть вовсе если продаж раньше не было
        var saleOlder = _history.quantity[1] || 0;

        // закупка и склад сегодня
        var deliver = _tradeHall.deliver[item];
        var stock = _tradeHall.stock[item];

        // доля рынка которую занимаем сегодня. если продаж не было то будет 0
        var share = _tradeHall.share[item];

        // если продаж вообще не было, история будет содержать 1 стру с нулями.
        var isNewProduct = Math.max.apply(null, _history.price) === 0;
        //if (unit.img[i].endsWith("sportfood.gif"))
        //    debugger;

        var stockNotSold = stock > deliver;
        var price = myPrice; // если алго не изменит цену на выходе, то останется старая.
        if (isNewProduct) {
            //debugger;
            // когда пришла первая поставка товара, цена еще 0, ставим базовую цену
            if (stock > 0 && stock === deliver)
                if (myPrice === 0)
                    price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);

            // если товар уже был и цена стояла а продаж еще не было, плохо это. если не стояло, ставим базовую
            if (stock > deliver)
                if (myPrice > 0)
                    postMessage0(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${_tradeHall.img[item]}></img> with Price:${myPrice}. Correct prices!`);
                else
                    price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
        }

        // если на складе пусто, нужно все равно менять цену если продажи были.
        // просто потому что на след раз когда на складе будет товар но не будет продаж, мы долю рынка не увидим.
        if (!isNewProduct) {
            if (saleOld === 0) {
                // товар тока пришел. был перерыв в поставках
                if (stock > 0 && stock === deliver) {
                    if (myPrice === 0)
                        price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                }

                // товар на складе был, но не продавался
                if (stock > deliver) {
                    // TODO: как то подумать чтобы если продаж не было не снижать от установленной а привязаться к прошлым продажам если кач подходит
                    if (myPrice === 0)
                        price = calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
                    else
                        postMessage0(`Subdivision <a href=${url}>${subid}</a> has 0 sales for <img src=${_tradeHall.img[item]}></img> with Price:${myPrice}. Correct prices!`);
                }
            }

            if (saleOld > 0) {
                // рынок не занят и не все продаем? Снижаем цену. Если продали все то цену чуть повысим
                if (share < 4.5)
                    price = stock > deliver ? priceOld * (1 - 0.03) : priceOld * (1 + 0.01);

                // рынок занят и продали не все? Цену чуть снижаем. Если все продаем то повышаем цену, иначе продаваться будет больше
                if (share > 4.5 && share < 6)
                    price = stock > deliver ? priceOld * (1 - 0.01) : priceOld * (1 + 0.03);

                if (share > 6 && share < 7.5)
                    price = stock > deliver ? priceOld * (1 + 0.01) : priceOld * (1 + 0.03);

                if (share > 7.5)
                    price = stock > deliver ? priceOld * (1 + 0.03) : priceOld * (1 + 0.05);
            }
        }
        // если цена уже минимальна а продажи 0, алармить об этом
        return price;
    };

    function market10(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        var priceOld = _history.price[0];                         // цена последней продажи
        var share = _tradeHall.share[item];                       // доля рынка которую занимаем

        // если продаж еще не было, то цену оставляем как есть.
        var price = priceOld || 0;
        if (share < 8)
            price *= (1 - 0.03);

        if (share > 12)
            price *= (1 + 0.03);

        return price;
    }

    function stock(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        var priceOld = _history.price[0];                         // цена последней продажи

        var deliver = _tradeHall.deliver[item];           // текущая закупка
        var stock = _tradeHall.stock[item];               // сейчас на складе

        var price = priceOld || 0;
        if (stock > 0 && deliver === stock)
            price *= (0.97 + 0.06);

        return price;
    }

    function turnover(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        var priceOld = _history.price[0];                         // цена последней продажи
        var priceOlder = _history.price[1];                       // 
        var saleOld = _history.quantity[0];
        var saleOlder = _history.quantity[1];
        var turnOld = saleOld * priceOld;
        var turnOlder = saleOlder * priceOlder;

        var price = 0;
        if (!priceOld)
            price = 0;
        else if (!priceOlder)
            price = priceOld * 1.03;
        else
            if ((turnOld > turnOlder) === (priceOld > priceOlder))
                price = priceOld * (1 + 0.03);
            else
                price = priceOld * (1 - 0.03);

        return price;
    }

    function sales(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _history = $mapped[_tradeHall.history[item]] as IPriceHistory;

        var myPrice = _tradeHall.price[item]
        var myQuality = _tradeHall.quality[item];                 // мое текущее качество на складе
        var myPurchPrice = _tradeHall.purch[item];                // цена закупки товара

        var priceOld = _history.price[0];                         // цена последней продажи
        var priceOlder = _history.price[1];                       // 
        var saleOld = _history.quantity[0];
        var saleOlder = _history.quantity[1];

        var price = 0;
        if (!priceOld)
            price = 0;
        else if (!priceOlder)
            price = priceOld * 1.03;
        else
            if ((saleOld > saleOlder) === (priceOld > priceOlder))
                price = priceOld * (1 + 0.03);
            else
                price = priceOld * (1 - 0.03);

        return price;
    }

    function local(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;
        let _report = $mapped[_tradeHall.report[item]] as IRetailReport;

        var myQuality = _tradeHall.quality[item];                 // мое текущее качество на складе
        var localPrice = _report.localprice;                    // местные поставщики цена и качество
        var localQuality = _report.localquality;

        return calcBaseRetailPrice(myQuality, localPrice, localQuality);
    }

    function city(item: number) {
        let _tradeHall = $mapped[url] as ITradeHall;

        var myQuality = _tradeHall.quality[item];                 // мое текущее качество на складе
        var cityPrice = _tradeHall.cityprice[item];       // местные магазы цена и кач
        var cityQuality = _tradeHall.cityquality[item];

        return calcBaseRetailPrice(myQuality, cityPrice, cityQuality);
    }

    // расчет стартовой цены продажи в маге исходя из цены и кача местных магов. Потолок в 4 раза выше.
    function calcBaseRetailPrice(myQuality: number, localPrice: number, localQuality: number) {
        if (myQuality === 0 || localPrice === 0 || localQuality === 0)
            throw new Error("Аргументы должны быть > 0!")

        return Math.max(localPrice * (1 + Math.log(myQuality / localQuality)), 0, 4);
    }
}

function salary(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/window/unit/employees/engage/" + subid;
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";
    var getcount = 0;

    if (choices[0] === 1) {
        getcount++;
        xGet(url, "salary", true, function () {
            !--getcount && post();
        });
    }
    else if (choices[0] >= 2) {
        getcount += 3;
        xGet(urlMain, "main", true, function () {
            !--getcount && post();
        });
        xGet(urlManager, "manager", false, function () {
            !--getcount && post();
        });
        xGet(url, "salary", true, function () {
            !--getcount && post();
        });
    }

    //choices[1]: ["min 80% max 500%", "max 500%", "min 80%", "No bound"]
    function post() {
        $("[id='x" + "Salary" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var change = false;
        let _salary = $mapped[url] as ISalary;
        let _main = $mapped[urlMain] as IMain;
        let _top = $mapped[urlManager] as ITopManager;

        if (_salary.salaryNow === 0) {
            change = true;
            _salary.form.find("#salary").val(_salary.salaryCity);
        }
        else if (choices[0] === 1 && (_salary.skillNow !== _salary.skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8))) {
            //"Required"
            change = true;
            _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, _salary.skillReq);
            if (choices[1] !== 3 && choices[1] !== 1) {
                _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
            }
            if (choices[1] !== 3 && choices[1] !== 2) {
                _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
            }
            _salary.form.find("#salary").val(_salary.salaryNow);
        }
        else if (choices[0] === 2) {
            //"Target"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], _top.base[managerIndex]);

            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }

        }
        else if (choices[0] === 3) {
            //"Maximum"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]);

            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        else if (choices[0] === 4) {
            //"Overflow"
            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var manager = _top.base[managerIndex] + _top.bonus[managerIndex];
            var factor3 = subType[_main.img][1];
            var managerNew = manager * calcOverflowTop1(_main.maxEmployees, factor3, manager);
            var skillReq = calcSkill(_salary.employees, subType[_main.img][0], managerNew);

            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }
        else if (choices[0] >= 5 && choices[0] <= 13) {
            //"20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"
            var loadPercent = 20;
            if (choices[0] === 6) {
                loadPercent = 30;
            }
            else if (choices[0] === 7) {
                loadPercent = 39;
            }
            else if (choices[0] === 8) {
                loadPercent = 50;
            }
            else if (choices[0] === 9) {
                loadPercent = 60;
            }
            else if (choices[0] === 10) {
                loadPercent = 69;
            }
            else if (choices[0] === 11) {
                loadPercent = 119;
            }
            else if (choices[0] === 12) {
                loadPercent = 139;
            }
            else if (choices[0] === 13) {
                loadPercent = 130;
            }

            var managerIndex = _top.pic.indexOf(subType[_main.img][2]);
            var skillReq = _salary.skillReq;
            var load = _salary.employees / calcEmployees(skillReq, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]) * 100;
            while (load < loadPercent) {
                skillReq += 0.01;
                load = _salary.employees / calcEmployees(skillReq, subType[_main.img][0], _top.base[managerIndex] + _top.bonus[managerIndex]) * 100;
            }
            skillReq -= 0.01;
            skillReq = Math.max(skillReq, _salary.skillReq);

            if (_salary.skillNow !== skillReq || (choices[1] !== 3 && choices[1] !== 2 && _salary.salaryNow > (_salary.salaryCity - .005) * 5) || (choices[1] !== 3 && choices[1] !== 1 && _salary.salaryNow < (_salary.salaryCity + .005) * 0.8)) {
                change = true;
                _salary.salaryNow = calcSalary(_salary.salaryNow, _salary.salaryCity, _salary.skillNow, _salary.skillCity, skillReq);
                if (choices[1] !== 3 && choices[1] !== 1) {
                    _salary.salaryNow = Math.max(_salary.salaryNow, (_salary.salaryCity + .005) * 0.8);
                }
                if (choices[1] !== 3 && choices[1] !== 2) {
                    _salary.salaryNow = Math.min(_salary.salaryNow, (_salary.salaryCity - .005) * 5);
                }
                _salary.form.find("#salary").val(_salary.salaryNow);
            }
        }

        if (change) {
            xPost(url, _salary.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function salePolicy(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/sale";

    xGet(url, "sale", false, function () {
        post();
    });

    function post() {
        $("[id='x" + "Policy" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var change = false;
        let _sale = $mapped[url] as ISale;

        for (var i = 0; i < _sale.price.length; i++) {

            if (choices[0] === 1) {
                var policy = 0;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 2) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 1;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 3) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 3;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
            else if (choices[0] === 4) {
                var policy = choices[1] && !_sale.outprime[i] ? 0 : 5;
                if (_sale.policy[i] !== policy) {
                    change = true;
                    _sale.form.find("select:even").eq(i).find("option").eq(policy).prop("selected", true);
                }
            }
        }
        if (change) {
            xPost(url, _sale.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function salePrice(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/sale";
    var urlContract = "/" + $realm + "/main/unit/view/" + subid + "/sale/product";
    var urlIP = "/" + $realm + "/main/geo/countrydutylist/359837";
    var urlTM = "/" + $realm + "/main/globalreport/tm/info";
    var urlCTIE = "/" + $realm + "/main/geo/regionENVD/359838";
    var urlTrans = "/" + $realm + "/main/common/main_page/game_info/transport";
    let urlReport:string[] = [];
    // ["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"]

    var getcount = 1;
    xGet(url, "sale", false, () => !--getcount && phase());

    // ["Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"]
    if (choices[0] >= 3) {
        getcount = getcount + 2;
        xGet(urlTM, "TM", false, () => !--getcount && phase());
        xGet(urlIP, "IP", false, () => !--getcount && phase());
    }

    // ["CTIE", "Profit Tax"]
    if (choices[0] === 4 || choices[0] === 5) {
        getcount++;
        xGet(urlTrans, "transport", false, () => !--getcount && phase());
    }

    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _sale = $mapped[url] as ISale;
        let _transport = $mapped[urlTrans] as ITransport;

        if (choices[0] === 4) {
            getcount++;
            xGet(urlCTIE, "CTIE", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 5) {
            getcount++;
            var indexRegion = _transport.regionName.indexOf(_sale.region);
            var regionId = _transport.regionId[indexRegion];
            urlCTIE = "/" + $realm + "/main/geo/regionENVD/" + regionId;

            xGet(urlCTIE, "CTIE", false, function () {
                !--getcount && post();
            });
        }
        else if (choices[0] === 8) {

            getcount += _sale.price.length + 1;
            xGet("/" + $realm + "/main/common/util/setpaging/reportcompany/marketingProduct/40000", "none", false, function () {
                !--getcount && post();
            });

            for (var i = 0; i < _sale.price.length; i++) {
                urlReport.push("/" + $realm + "/main/globalreport/marketing/by_products/" + _sale.productId[i]);
                xGet(urlReport[i], "productreport", false, function () {
                    !--getcount && post();
                });
            }

            // если есть страница с контрактами, надо ее грузануть иначе все данные на главной sale странице
            if (_sale.contractpage) {
                getcount++;
                xGet(urlContract, "salecontract", false, function () {
                    let _saleContract = $mapped[urlContract] as ISaleContract;

                    // загружаем контракты по каждому товару
                    getcount += _saleContract.category.length;
                    for (var i = 0; i < _saleContract.category.length; i++)
                        xGet(_saleContract.category[i], "salecontract", false, () => !--getcount && post());

                    !--getcount && post()
                });
            }

        }
        else {
            post();
        }

    }

    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _sale = $mapped[url] as ISale;
        let _tm = $mapped[urlTM] as ITm;
        let _ip = $mapped[urlIP] as IIp;
        let _transport = $mapped[urlTrans] as ITransport;
        let _ctie = $mapped[urlCTIE] as ICtie;
        let _saleContract = $mapped[urlContract] as ISaleContract;
        var change = false;

        for (var i = 0; i < _sale.price.length; i++) {
            let _report = $mapped[urlReport[i]] as IProductReport;

            var primecost = choices[1] ? _sale.outprime[i] : _sale.stockprime[i];
            var quality = choices[1] ? _sale.outqual[i] : _sale.stockqual[i];
            var price = 0;

            if (choices[0] === 2) {
                price = 0.01;
            }
            else if (choices[0] === 3) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = primecost + 0.01 < 30 * IP ? primecost + 0.01 : primecost;
                price = Math.round(price * 100) / 100;
            }
            else if (choices[0] === 4) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];

                var indexCTIE = _ctie.product.indexOf(product);
                var CTIE = _ctie.CTIE[indexCTIE];
                var priceCTIE = primecost * (1 + CTIE / 100);
                price = Math.round(priceCTIE * 100) / 100;
                price = price < 30 * IP ? price : primecost;
            }
            else if (choices[0] === 5) {
                var indexRegion = _transport.regionName.indexOf(_sale.region);
                var regionId = _transport.regionId[indexRegion];
                urlCTIE = "/" + $realm + "/main/geo/regionENVD/" + regionId;
                _ctie = $mapped[urlCTIE] as ICtie;

                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];

                var indexCTIE = _ctie.product.indexOf(product);
                var CTIE = _ctie.CTIE[indexCTIE];
                var priceCTIE = primecost * (1 + CTIE / 100 * _ctie.profitTax / 100);
                price = Math.round(priceCTIE * 100) / 100;
                price = price < 30 * IP ? price : primecost;
            }
            else if (choices[0] === 6) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = IP;
            }
            else if (choices[0] === 7) {
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];
                price = 30 * IP;
            }
            else if (choices[0] === 8) {
                // TODO: нахуевертил хуй разберешь. запилить здесь иначе PQR не работает.
                var indexFranchise = _tm.franchise.indexOf(_sale.product[i]);
                var product = _tm.product[indexFranchise] || _sale.product[i];
                var indexIP = _ip.product.indexOf(product);
                var IP = _ip.IP[indexIP];

                var favPQR = Infinity;
                for (var j = 0; j < _report.price.length; j++) {
                    var allowed = _report.max[j] === 0 || _report.max[j] * 3 > _report.total[j] - _report.available[j];
                    if (allowed && subid !== _report.subid[j]) {
                        var PQR = _report.price[j] / _report.quality[j];
                        if (PQR < favPQR) {
                            favPQR = PQR;
                        }
                    }
                }

                var thisproduct = false;
                var lowprice = Infinity;
                var highprice = 0;
                // TODO: тут могут быть косяки! возможно будет криво считать цены закупщиков и не будет работать. проверять.
                if (_sale.contractpage && _saleContract.category.length) {
                    let _contract: ISaleContract = { contractprice:[], category:[]};
                    for (var j = 0; j < _saleContract.category.length; j++) {
                        _contract = $mapped[_saleContract.category[j]] as ISaleContract;
                        if (_contract.contractprice[0] === _sale.product[i]) {
                            thisproduct = true;
                            break;
                        }
                    }

                    if (_contract.contractprice[0] === "")
                        throw new Error("Неведомая хуйня но что то не так с PQR salePrice");

                    let contractprices = thisproduct ? _contract.contractprice : [];

                    for (var j = 1; j < contractprices.length; j++) {
                        lowprice = Math.min(lowprice, contractprices[j] as number);
                        highprice = Math.max(highprice, contractprices[j]as number);
                    }

                }
                else {

                    let contractprices = _sale.contractpage && _saleContract ? _saleContract.contractprice : _sale.contractprice;

                    for (var j = 0; j < contractprices.length; j++) {
                        if (contractprices[j] === _sale.product[i]) {
                            thisproduct = true;
                        }
                        else if (typeof contractprices[j] === "string") {
                            thisproduct = false;
                        }
                        else if (thisproduct) {
                            lowprice = Math.min(lowprice, contractprices[j] as number);
                            highprice = Math.max(highprice, contractprices[j] as number);
                        }
                    }

                }

                price = Math.round(favPQR * quality * 100) / 100;	

                if (highprice > 0) {
                    price = Math.max(Math.ceil(highprice * 0.91 * 100) / 100, price);
                    price = Math.min(Math.floor(lowprice * 1.09 * 100) / 100, price);
                }

                price = Math.min(price, 30 * IP);
                price = Math.max(price, primecost);

            }

            if (_sale.price[i] !== price && (primecost || choices[2] === 1)) {
                change = true;
                _sale.form.find("input.money:even").eq(i).val(price);
            }
        }


        if (change) {
            _sale.form.find("select[id] option").prop("selected", true);
            xPost(url, _sale.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function servicePrice(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;
    var url2 = "/" + $realm + "/main/unit/view/" + subid + "/consume";

    xGet(url, "service", false, function () {
        phase();
    });

    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _service = $mapped[url] as IService;
        var getcount = _service.history.length * 2;

        for (var i = 0; i < _service.history.length; i++) {
            xGet(_service.history[i], "servicepricehistory", false, function () {
                !--getcount && post();
            });
            xGet(url2, "consume", false, function () {
                !--getcount && post();
            });
        }
    }

    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _service = $mapped[url] as IService;
        let _consume = $mapped[url2] as IConsume;
        
        var change = false;
        var data = "setprice=1";

        for (var i = 0; i < _service.price.length; i++) {

            let _serviceHistory = $mapped[_service.history[i]] as IServiceHistory;
            var price = 0;

            if (choices[0] === 1) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];

                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (saleOld > saleOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            } else if (choices[0] === 2) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var turnOld = _serviceHistory.quantity[0] * priceOld;
                var turnOlder = _serviceHistory.quantity[1] * priceOlder;

                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (turnOld > turnOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            } else if (choices[0] === 3) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];
                var profitOld = (priceOld - _consume.purch[0]) * saleOld;
                var profitOlder = (priceOlder - _consume.purch[0]) * saleOlder;

                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (profitOld > profitOlder) === (priceOld > priceOlder) ? priceOld * 1.03 : priceOld * 0.97;
                }
            }

            price = numberfy(price.toPrecision(4));

            var multiplier = [0, 1, 1.1, 1.4, 2];
            var prime = Math.round(_consume.purch[0] * multiplier[choices[1]]);
            price = Math.max(price, prime);

            if (_service.price[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }
        }

        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }

    }

}

function serviceWithoutStockPrice(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;

    xGet(url, "service", false, function () {
        phase();
    });

    function phase() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _service = $mapped[url] as IService;
        var getcount = _service.history.length;

        for (var i = 0; i < _service.history.length; i++) {
            xGet(_service.history[i], "servicepricehistory", false, function () {
                !--getcount && post();
            });
        }
    }

    function post() {
        $("[id='x" + "Price" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _service = $mapped[url] as IService;
        var change = false;
        var data = "setprice=1";

        for (var i = 0; i < _service.price.length; i++) {

            let _serviceHistory = $mapped[_service.history[i]] as IServiceHistory;
            var price = 0;

            if (choices[0] === 1) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var saleOld = _serviceHistory.quantity[0];
                var saleOlder = _serviceHistory.quantity[1];

                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (saleOld > saleOlder) === (priceOld > priceOlder) ? 1.03 * priceOld : 0.97 * priceOld;
                }
            } else if (choices[0] === 2) {
                var priceOld = _serviceHistory.price[0];
                var priceOlder = _serviceHistory.price[1];
                var turnOld = _serviceHistory.quantity[0] * priceOld;
                var turnOlder = _serviceHistory.quantity[1] * priceOlder;

                if (!priceOld) {
                    price = 0;
                }
                else if (!priceOlder) {
                    price = priceOld * 1.03;
                }
                else {
                    price = (turnOld > turnOlder) === (priceOld > priceOlder) ? 1.03 * priceOld : 0.97 * priceOld;
                }
            }

            price = numberfy(price.toPrecision(4));

            if (_service.price[i] !== price && price > 0) {
                change = true;
                data += "&" + encodeURI("servicePrice=" + price);
            }

        }

        if (change) {
            xPost(url, data, function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }

    }

}

function storeSupply(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlContract = "/" + $realm + "/ajax/unit/supply/create";
    var urlTrade = "/" + $realm + "/main/unit/view/" + subid + "/trading_hall";
    //debugger;
    var getcount = 1;
    xGet(url, "storesupply", false, function () {
        !--getcount && phase();
    });

    if (choices[1] >= 1) {
        getcount++;
        xGet(urlTrade, "tradehall", false, function () {
            !--getcount && phase();
        });
    }

    var reports: string[] = [];

    function phase() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _storeSupply = $mapped[url] as IStoreSupply;
        let _tradeHall = $mapped[urlTrade] as ITradeHall;

        if (choices[1] >= 4 || choices[2] >= 1) {
            getcount += _storeSupply.img.length;
            for (var i = 0; i < _storeSupply.img.length; i++) {
                var index = _tradeHall.img.indexOf(_storeSupply.img[i]);
                reports.push(_tradeHall.report[index]);

                xGet(reports[i], "retailreport", false, function () {
                    !--getcount && post();
                });
            }
        }
        else {
            post();
        }
    }

    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _storeSupply = $mapped[url] as IStoreSupply;
        let _tradeHall = $mapped[urlTrade] as ITradeHall;
        var change:any[] = [];

        if (_storeSupply.parcel.length !== _storeSupply.sold.length) {
            choices[0] = 1;
            postMessage0("Subdivision <a href=" + url + ">" + subid + "</a> is missing a supplier, or has too many suppliers!");
        }
        for (var i = 0; i < _storeSupply.parcel.length; i++) {
            var newsupply = 0;

            if (choices[0] === 2) {
                newsupply = _storeSupply.sold[i];
            }
            else if (choices[0] === 3) {
                newsupply = _storeSupply.quantity[i] === _storeSupply.purchase[i]
                    ? _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 1 * 0.25)
                    : _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 0 * 0.25);
            }
            else if (choices[0] === 4) {
                newsupply = Math.min(2 * _storeSupply.sold[i], 3 * _storeSupply.sold[i] - _storeSupply.quantity[i]);
            }
            else if (choices[0] === 5) {
                newsupply = (_storeSupply.sold[i] > _storeSupply.quantity[i] / 2)
                    ? _storeSupply.sold[i] * (0.4 * 1 + 0.8)
                    : _storeSupply.sold[i] * (0.4 * 0 + 0.8);
            }

            if (newsupply > 0 && _storeSupply.available[i] < newsupply) {
                postMessage0("Subdivision (store) <a href=" + url + ">" + subid + "</a> has insufficient reserves at the supplier!");
                break;
            }
        }

        for (var i = 0; i < _storeSupply.parcel.length; i++) {
            //[["-", "Zero", "Sold", "Amplify", "Stock", "Enhance"], 
            // ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], 
            // ["Any Q", "Local Q", "City Q"]],
            var newsupply = 0;
            if (choices[0] === 1) {
                newsupply = 0;
            }
            else if (choices[0] === 2) {
                newsupply = _storeSupply.sold[i];
            }
            else if (choices[0] === 3) {
                newsupply = _storeSupply.quantity[i] === _storeSupply.purchase[i]
                    ? _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 1 * 0.25)
                    : _storeSupply.sold[i] + Math.ceil(_storeSupply.sold[i] * 0 * 0.25);
            }
            else if (choices[0] === 4) {
                newsupply = Math.min(2 * _storeSupply.sold[i], 3 * _storeSupply.sold[i] - _storeSupply.quantity[i]);
            }
            else if (choices[0] === 5) {
                newsupply = (_storeSupply.sold[i] > _storeSupply.quantity[i] / 2)
                    ? _storeSupply.sold[i] * (0.4 * 1 + 0.8)
                    : _storeSupply.sold[i] * (0.4 * 0 + 0.8);
            }

            var minsupply = 0;
            let _retailReport = $mapped[reports[i]] as IRetailReport;

            if (choices[1] === 1) {
                minsupply = 1;
            }
            else if (choices[1] === 2) {
                minsupply = Math.ceil(1000 / _storeSupply.price[i]);
            }
            else if (choices[1] === 3) {
                minsupply = Math.ceil(1000000 / _storeSupply.price[i]);
            }
            else if (choices[1] === 4) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.01);
            }
            else if (choices[1] === 5) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.05);
            }
            else if (choices[1] === 6) {
                minsupply = Math.ceil(_retailReport.marketsize * 0.10);
            }

            newsupply = Math.max(newsupply, minsupply - _storeSupply.quantity[i] + _storeSupply.purchase[i]);

            var nosupply = false;

            if (choices[2] === 1) {
                nosupply = _storeSupply.quality[i] != null && _storeSupply.quality[i] < _retailReport.localquality;
            }
            else if (choices[2] === 2) {
                nosupply = _storeSupply.quality[i] != null && _storeSupply.quality[i] < _retailReport.cityquality;
            }

            if (nosupply) {
                newsupply = 0;
            }

            if (_storeSupply.parcel[i] !== newsupply || _storeSupply.reprice[i]) {
                change.push({
                    amount: newsupply,
                    offer: _storeSupply.offer[i],
                    unit: subid,
                    priceConstraint: _storeSupply.price_constraint_max[i],
                    priceMarkUp: _storeSupply.price_mark_up[i],
                    qualityMin: _storeSupply.quality_constraint_min[i],
                    constraintPriceType: _storeSupply.price_constraint_type[i]
                });
            }
        }
        // TODO: тут походу каждый товар шлется отдельно, есть смысл посылать одной кнопкой. так будет вернее.
        var postcount = change.length;
        if (postcount) {
            for (var i = 0; i < change.length; i++) {
                xContract(urlContract, change[i], function () {
                    !--postcount && xTypeDone(policyName);
                });
            }
        }
        else {
            xTypeDone(policyName);
        }
    }
}

function technology(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/main/unit/view/" + subid + "/technology";
    var urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";

    var getcount = 2;
    xGet(url, "tech", false, function () {
        !--getcount && post();
    });
    xGet(urlManager, "manager", false, function () {
        !--getcount && post();
    });

    function post() {
        $("[id='x" + "Technology" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _top = $mapped[urlManager] as ITopManager;
        let _tech = $mapped[url] as ITech;
        var change = false;
        var newTech = -1;

        if (choices[0] === 1) {

            var managerIndex = _top.pic.indexOf(subType[_tech.img][2]);
            var managerQual = _top.base[managerIndex] + _top.bonus[managerIndex];
            var techLevel = calcTechLevel(managerQual);

            // если цена технологии нулевая, то купит которую можно.
            // TODO: неясно чего оно тут проверяет строку а не число. возможно тупняк или так надо
            for (var i = _tech.price.length - 1; i >= 0; i--) {
                if (_tech.price[i] === "$0.00" && (i + 1) <= techLevel && (i + 1) > _tech.tech && _tech.tech > 0) {
                    newTech = i + 1;
                    change = true;
                    break;
                }
            }

        }

        if (change) {
            xPost(url, "level=" + newTech + "&impelentit=Buy+a+technology", function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }
    }


}

function training(policyName: string, subid: number, choices: number[]) {
    var url = "/" + $realm + "/window/unit/employees/education/" + subid;
    var urlValue = "/" + $realm + "/ajax/unit/employees/calc_new_lvl_after_train/" + subid;

    xGet(url, "training", false, function () {
        phase();
    });

    var expectedSkill = 0;

    function phase() {
        $("[id='x" + "Training" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _train = $mapped[url] as ITraining;

        if (choices[0] === 3 && _train.form.length) {
            xContract(urlValue, "employees=" + _train.employees + "&weeks=4", function (data) {
                expectedSkill = data.employees_level;
                post();
            });
        }
        else if (_train.form.length) {
            post();
        }
        else {
            xTypeDone(policyName);
        }

    }

    function post() {
        $("[id='x" + "Training" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _train = $mapped[url] as ITraining;
        var change = false;

        if (choices[0] === 1) {
            change = true;
            _train.form.find("#unitEmployeesData_timeCount").val(4);
        }
        else if (choices[0] === 2 && _train.salaryNow > _train.salaryCity) {
            change = true;
            _train.form.find("#unitEmployeesData_timeCount").val(4);
        }
        else if (choices[0] === 3) {

            var salaryNew = calcSalary(_train.salaryNow, _train.salaryCity, expectedSkill, _train.skillCity, _train.skillNow);
            salaryNew = Math.max(salaryNew, 0.8 * _train.salaryCity);
            var savings = (_train.salaryNow - salaryNew) * 365;
            var costs = _train.weekcost * 4 / _train.employees;

            if (savings > costs) {
                change = true;
                _train.form.find("#unitEmployeesData_timeCount").val(4);
            }

        }

        if (change) {
            xPost(url, _train.form.serialize(), function () {
                xTypeDone(policyName);
            });
        }
        else {
            xTypeDone(policyName);
        }

    }
}

function wareSize(policyName: string, subid: number, choices: number[]) {

    var url = "/" + $realm + "/main/unit/view/" + subid;
    var urlSize = "/" + $realm + "/window/unit/upgrade/" + subid;

    xGet(url, "waremain", false, function () {
        phase();
    });


    let min: number;
    let max: number;

    if (choices[0] === 1) {
        min = 69 / 5;
        max = 69.5;
    }
    else {
        min = 20;
        max = 200;
    }

    function phase() {
        $("[id='x" + "Size" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _ware = $mapped[url] as IWareMain;
        if (_ware.full < min || _ware.full > max) {

            xGet(urlSize, "size", false, function () {
                post();
            });

        }
        else {
            xTypeDone(policyName);
        }

    }

    function post() {
        $("[id='x" + "Size" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _ware = $mapped[url] as IWareMain;
        let _wareSize = $mapped[urlSize] as IWareSize

        if (_ware.size < 10) {
            _ware.size = _ware.size * 1000;
        }

        for (var i = 0; i < _wareSize.rent.length; i++) {
            if (_wareSize.size[i] < 10) {
                _wareSize.size[i] = _wareSize.size[i] * 1000;
            }

            var coef = _wareSize.size[i] / _ware.size;
            var normal = _ware.full / coef > min && _ware.full / coef < max;
            var low = i === 0 && _wareSize.size[i] < _ware.size && _ware.full / coef < min;
            var high = i === _wareSize.rent.length && _wareSize.size[i] > _ware.size && _ware.full / coef > max;

            if (normal || low || high) {
                xPost("/" + $realm + "/window/unit/upgrade/" + subid, "upgrade%5Bbound%5D=" + _wareSize.id[i], function () {
                    xTypeDone(policyName);
                });
                return false;
            }
        }

        xTypeDone(policyName);

        return false;
    }
}

function wareSupply(policyName: string, subid: number, choices: number[], good:string) {

    var url = "/" + $realm + "/main/unit/view/" + subid + "/supply";
    var urlMain = "/" + $realm + "/main/unit/view/" + subid;
    let urlContract:string[] = [];

    var getcount = 2;
    xGet(url, "waresupply", true, function () {
        !--getcount && phase();
    });
    xGet(urlMain, "waremain", true, function () {
        !--getcount && phase();
    });

    if (choices[1] >= 1) {
        var minFreeForBuy = 1;
        //"Any available volume"
        // , "1k", "10k", "100k"
        // , "1m", "10m", "100m"
        // , "1b", "10b", "100b"
        if (choices[3] > 0) {
            minFreeForBuy = 100 * Math.pow(10, choices[3]);
        }

        getcount += 3;
        xGet("/" + $realm + "/window/common/util/setpaging/dbwarehouse/supplyList/40000", "none", false, function () {
            !--getcount && phase();
        });
        var data = "total_price%5Bfrom%5D=&total_price%5Bto%5D=&quality%5Bfrom%5D=&quality%5Bto%5D=&quantity%5Bfrom%5D=&free_for_buy%5Bfrom%5D=" + minFreeForBuy + "&brand_value%5Bfrom%5D=&brand_value%5Bto%5D=";
        xPost("/" + $realm + "/window/common/util/setfiltering/dbwarehouse/supplyList", data, function () {
            !--getcount && phase();
        });
        xGet("/" + $realm + "/window/common/util/setfiltering/dbwarehouse/supplyList/supplierType=all/tm=all", "none", false, function () {
            !--getcount && phase();
        });

    }

    function phase(this:any) {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _wareSupp = $mapped[url] as IWareSupply;
        let _ware = $mapped[urlMain] as IWareMain;

        var contract = _wareSupp.contract.concat(_wareSupp.contractAdd);
        var id = _wareSupp.id.concat(_wareSupp.idAdd);
        var type = _wareSupp.type.concat(_wareSupp.typeAdd);

        if (choices[1] >= 1 && _wareSupp.type.length) {

            for (var i = 0; i < _ware.product.length; i++) {
                if (good && _ware.product[i] !== good)
                    continue;

                getcount++;
                let index = type.indexOf(_ware.product[i]);
                urlContract[i] = contract[index];

                xsup.push([subid, id[index],
                    (function (urlCon:any, type:any) {
                        xGet(urlCon, "contract", true, function () {
                            xsupGo(subid, type);
                            !--getcount && post();
                        });
                    }.bind(this, contract[index], id[index]))
                ]);
            }
            xsupGo();
        }
        else {
            post();
        }
    }

    var change:any[] = [];
    var deletechange = false;
    var deletestring = "contractDestroy=1";

    function post() {
        $("[id='x" + "Supply" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        let _wareSupp = $mapped[url] as IWareSupply;
        let _ware = $mapped[urlMain] as IWareMain;
        let supplier:any[] = [];
        var j = 0;
        var x = 0;
        for (var i = 0; i < _ware.product.length; i++) {

            var newsupply = 0;
            if (choices[0] === 2) {
                newsupply = _ware.shipments[i];
            }
            else if (choices[0] === 3) {
                newsupply = Math.min(2 * _ware.shipments[i], Math.max(3 * _ware.shipments[i] - _ware.stock[i], 0));
            }
            else if (choices[0] === 4) {
                newsupply = (_ware.shipments[i] > _ware.stock[i] / 2)
                    ? _ware.shipments[i] * (0.4 * 1 + 0.8)
                    : _ware.shipments[i] * (0.4 * 0 + 0.8);
            }
            else if (choices[0] === 5) {
                newsupply = Math.min(Math.sqrt(_ware.shipments[i] / _ware.stock[i] * 2), 2) * _ware.shipments[i];
            }
            else if (choices[0] === 6) {
                newsupply = Infinity;
            }

            newsupply = Math.ceil(newsupply);

            var set = newsupply;

            var jstart = j;
            supplier = [];
            while (_ware.product[i] === _wareSupp.product[j]) {
                supplier.push({
                    available: _wareSupp.available[j],
                    PQR: _wareSupp.price[j] / _wareSupp.quality[j],
                    offer: _wareSupp.offer[j],
                    myself: _wareSupp.myself[j],
                    index: j,
                    sup: j - jstart,
                    priceMarkUp: _wareSupp.price_mark_up[j],
                    priceConstraint: _wareSupp.price_constraint_max[j],
                    constraintPriceType: _wareSupp.price_constraint_type[j],
                    qualityMin: _wareSupp.quality_constraint_min[j]
                });
                j++;
            }

            if (good && _ware.product[i] !== good) {
                continue;
            }

            if (choices[1] === 0) {

                supplier.sort(function (a, b) {
                    return a.PQR - b.PQR;
                });

                var toset = 0;
                for (var k = 0; k < supplier.length; k++) {
                    toset = Math.min(set, supplier[k].available);
                    set -= toset;
                    if (_wareSupp.parcel[supplier[k].index] !== toset || _wareSupp.reprice[supplier[k].index]) {
                        change.push({
                            'newsup': false,
                            'offer': supplier[k].offer,
                            'amount': toset,
                            'priceMarkUp': supplier[k].priceMarkUp,
                            'priceConstraint': supplier[k].priceConstraint,
                            'constraintPriceType': supplier[k].constraintPriceType,
                            'qualityMin': supplier[k].qualityMin
                        });
                    }
                }

                if (set > 0) {
                    postMessage0("Not enough suppliers for product " + _ware.product[i] + " in warehouse <a href=" + url + ">" + subid + "</a>");
                }
            }

            else if (choices[1] >= 1) {

                var product = _ware.product[i];

                var offers = supplier.map(function (contract) {
                    return contract.offer;
                });

                var mix = supplier.slice();
                var indexcount = mix.length;
                let _contract = $mapped[urlContract[i]] as IContract;

                for (var k = 0; k < _contract.offer.length; k++) {
                    if (offers.indexOf(_contract.offer[k]) === -1 && (_contract.tm[k] === product || !_contract.tm[k] && _contract.product === product) && blackmail.indexOf(_contract.company[k]) === -1) {
                        mix.push({
                            available: _contract.available[k],
                            PQR: _contract.price[k] / _contract.quality[k],
                            offer: _contract.offer[k],
                            company: _contract.company[k],
                            myself: _contract.myself[k],
                            row: k
                        });
                    }
                }

                mix.sort(function (a, b) {
                    return a.PQR - b.PQR;
                });

                if (choices[2] === 0) {
                    set = Math.max(set, 1);
                }

                for (var k = 0; k < mix.length; k++) {

                    var comp:any = mix[k].myself && choices[1] === 1 || !mix[k].myself && choices[1] === 3 || choices[1] === 2;
                    var toset = Math.min(set, mix[k].available) * comp;
                    set -= toset;

                    if (choices[2] === 2 && mix[k].index >= 0) {
                        toset = Math.max(toset, 1);
                    }

                    if (mix[k].available && (toset > 0 || choices[2] >= 1 && mix[k].index >= 0) && (mix[k].row >= 0 || mix[k].index >= 0 && (_wareSupp.parcel[mix[k].index] !== toset || _wareSupp.reprice[mix[k].index]))) {
                        change.push({
                            'newsup': mix[k].row >= 0,
                            'offer': mix[k].offer,
                            'amount': toset,
                            'company': mix[k].company,
                            'good': product,
                            'priceMarkUp': mix[k].priceMarkUp,
                            'priceConstraint': mix[k].priceConstraint,
                            'constraintPriceType': mix[k].constraintPriceType,
                            'qualityMin': mix[k].qualityMin
                        });
                        if (mix[k].row >= 0) {
                            _contract.available[mix[k].index] -= toset;
                        }
                    }
                    else if (mix[k].index >= 0 && toset === 0 && choices[2] === 0 || mix[k].index >= 0 && !mix[k].available) {
                        deletechange = true;
                        deletestring += "&supplyContractData%5Bselected%5D%5B%5D=" + mix[k].offer;
                        supplier.splice(mix[k].sup, 1);
                    }
                }

                if (set > 0) {
                    postMessage0("Not enough suppliers for product " + product + " in warehouse <a href=" + url + ">" + subid + "</a>");
                }
            }
        }

        var contractcount = change.length + (deletechange ? 1 : 0);

        if (deletechange) {
            xPost(url, deletestring, function () {
                contractcount--;
                further();
            });
        }
        else {
            further();
        }

        function further() {

            for (var i = 0; i < change.length; i++) {

                (function (steak) {
                    xContract("/" + $realm + "/ajax/unit/supply/create", {
                        'offer': steak.offer,
                        'unit': subid,
                        'amount': steak.amount,
                        'priceConstraint': steak.priceConstraint,
                        'priceMarkUp': steak.priceMarkUp,
                        'qualityMin': steak.qualityMin,
                        'constraintPriceType': steak.constraintPriceType
                    }, function (data) {

                        if (data.result === "-5" && blackmail.indexOf(steak.company) === -1) {
                            postMessage0("You are blackmailed by the company 「" + steak.company + "」!");
                            blackmail.push(steak.company);
                        }

                        if (data.result === "-5") {
                            wareSupply(policyName, subid, choices, steak.good);
                        }

                        if (data.result !== "-5" && steak.newsup) {
                            suppliercount++;
                            $("#XioSuppliers").text(suppliercount);
                        }

                        if (data.result !== "-5") {
                            !--contractcount && xTypeDone(policyName);
                        }

                    });
                })(change[i]);

            }

            if (contractcount === 0) {
                xTypeDone(policyName);
            }

            change = [];

        }
    }
}


