//
// сюда кладем все функции которые собсна выполняют политики
//
function advertisement(policyName: string, subid: number, choices: number[]) {

    let url = "/" + $realm + "/main/unit/view/" + subid + "/virtasement";
    let urlFame = "/" + $realm + "/ajax/unit/virtasement/" + subid + "/fame";
    let urlManager = "/" + $realm + "/main/user/privat/persondata/knowledge";

    let pccost = 0;
    let getcount = 0;
    if (choices[0] >= 3 && choices[0] <= 9) {
        getcount++;
        xGet(urlManager, "manager", false, function () {
            !--getcount && post();
        });
    }

    if (choices[0] >= 4 && choices[0] <= 9) {
        getcount++;
        xPost(urlFame, "moneyCost=0&type%5B0%5D=2264", function (data) {
            pccost = numberfy(JSON.parse(data).contactCost);
            !--getcount && post();
        });
    }

    if (choices[0] >= 4) {
        getcount++;
        xGet(url, "ads", false,
            () => !--getcount && post());
    }

    if (choices[0] <= 2)
        post();


    function post() {
        $("[id='x" + "Ads" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

        var data = "";
        var budget = 0;
        let top = $mapped[urlManager] as ITopManager;
        let ads = $mapped[url] as IAds;

        if (choices[0] === 1) {
            data = "cancel=Stop+advertising";
        }
        else if (choices[0] === 2) {
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=0";
        }
        else if (choices[0] === 3) {
            var managerIndex = top.pic.indexOf("/img/qualification/advert.png");
            var manager = top.base[managerIndex] + top.bonus[managerIndex];
            budget = 200010 * Math.pow(manager, 1.4);
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
        }
        else if (choices[0] >= 4 && choices[0] <= 9) {
            var managerIndex = top.pic.indexOf("/img/qualification/advert.png");
            var manager = top.base[managerIndex] + top.bonus[managerIndex];
            var multiplier = [1, 2, 5, 10, 20, 50];
            budget = Math.round(ads.pop * pccost * multiplier[choices[0] - 4]);
            var maxbudget = Math.floor(200010 * Math.pow(manager, 1.4));
            budget = Math.min(budget, maxbudget);
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + budget;
        }
        else if (choices[0] === 10) {
            data = "advertData%5Btype%5D%5B%5D=2264&advertData%5BtotalCost%5D=" + ads.requiredBudget;
        }

        if (choices[0] <= 3 || budget !== ads.budget)
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
    var equip: any = {};

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
        
        let machines = $mapped[urlEquipment] as IMachines;
        let animals = $mapped[urlAnimals] as IAnimals;
        
        for (var i = 0; i < machines.subid.length; i++) {
            if (machines.subid[i] === subid) {
                for (var key in machines) {
                    equip[key] = machines[key][i];
                }
                break;
            }
        }
        for (var i = 0; i < animals.subid.length; i++) {
            if (animals.subid[i] === subid) {
                for (var key in animals) {
                    equip[key] = animals[key][i];
                }
                equip.perc = 100 - animals.perc[i];
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

                        let equipment = $mapped[url] as IEquipment;
                        if (equipfilter.indexOf(equipment.filtername) === -1) {
                            equipfilter.push(equipment.filtername);
                            getcount += 3;
                            xGet("/" + $realm + "/window/common/util/setpaging/db" + equipment.filtername + "/equipmentSupplierListByUnit/40000", "none", false, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            var data = "total_price%5Bfrom%5D=&total_price%5Bto%5D=&quality%5Bfrom%5D=&quality%5Bto%5D=&quantity%5Bisset%5D=1&quantity%5Bfrom%5D=1&total_price%5Bfrom%5D=0&total_price%5Bto%5D=0&total_price_isset=0&quality%5Bfrom%5D=0&quality%5Bto%5D=0&quality_isset=0&quantity_isset=1";
                            xPost("/" + $realm + "/window/common/util/setfiltering/db" + equipment.filtername + "/equipmentSupplierListByUnit", data, function () {
                                !(--getcount - 1) && xsupGo(subid, equip.id);
                            });
                            xGet("/" + $realm + "/window/common/util/setfiltering/db" + equipment.filtername + "/equipmentSupplierListByUnit/supplierType=all", "none", false, function () {
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

    function post() {
        $("[id='x" + "Equipment" + "current']").html('<a href="/' + $realm + '/main/unit/view/' + subid + '">' + subid + '</a>');

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

        var change = [];
        let _equipment = $mapped[url] as IEquipment;
        let _manager = $mapped[urlManager] as ITopManager;
        let _salary = $mapped[urlSalary] as ISalary;
        type TData = { PQR: number, quality: number, available: number, buy: number, offer: number, index: number };
        //type TOffer = { low: TData[], high: TData[], inc: TData[] };

        if (choices[0] === 1) {
            var offer: IDictionary<TData[]> = {
                low: [],
                high: [],
                inc: []
            };

            var qualReq = (equip.required || 0) + 0.005;
            var qualNow = equip.quality - 0.005;
            // console.log('qualReq = ' + qualReq);
            // console.log('qualNow = ' + qualNow);

            for (var i = 0; i < _equipment.offer.length; i++) {
                var data: TData = {
                    PQR: _equipment.price[i] / _equipment.qualOffer[i],
                    quality: _equipment.qualOffer[i],
                    available: _equipment.available[i],
                    buy: 0,
                    offer: _equipment.offer[i],
                    index: i
                };
                // console.log('data.quality = ' + data.quality );
                if (data.quality < qualReq) {
                    offer["low"].push(data);
                }
                else {
                    offer["high"].push(data);
                }
            }

            for (var key in offer) {
                offer[key].sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
            }

            var l = 0;
            var h = 0;
            var qualEst = 0;
            var qualNew = qualNow;
            // console.log('offer["low"].length = ' + offer["low"].length);
            // console.log('offer["high"].length = ' + offer["high"].length);

            while (equipWear > 0 && h < offer["high"].length) {
                // console.log('l = ' + l);
                // console.log('h = ' + h);
                // TODO: сраный говнокод. length не может быть. и реальный дебаг показал что хуй!
                if (offer["low"][l] && offer["low"][l].length > l && offer["low"][l].available - offer["low"][l].buy === 0) {
                    l++;
                    // console.log('continue l');
                    continue;
                }
                if (offer["high"][h] && offer["high"][h].length > h && offer["high"][h].available - offer["high"][h].buy === 0) {
                    h++;
                    // console.log('continue h');
                    continue;
                }

                // console.log(subid, l, offer["low"][l].available - offer["low"][l].buy, offer["low"][l]);
                // console.log(subid, h, offer["high"][h].available - offer["high"][h].buy, offer["high"][h]);

                qualEst = qualNew;
                l < offer["low"].length && offer["low"][l].buy++;
                for (var key in offer) {
                    for (var i = 0; i < offer[key].length; i++) {
                        if (offer[key][i].buy) {
                            qualEst = ((equip.num - offer[key][i].buy) * qualEst + offer[key][i].buy * offer[key][i].quality) / equip.num;
                        }
                    }
                }
                l < offer["low"].length && offer["low"][l].buy--;

                if (l < offer["low"].length && qualEst > qualReq && offer["low"][l].PQR < offer["high"][h].PQR) {
                    offer["low"][l].buy++;
                }
                else {
                    offer["high"][h].buy++;
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

            for (var i = 0; i < _equipment.offer.length; i++) {
                var data = {
                    PQR: _equipment.price[i] / (_equipment.qualOffer[i] - qualReq),
                    quality: _equipment.qualOffer[i] - 0.005,
                    available: _equipment.available[i],
                    buy: 0,
                    offer: _equipment.offer[i],
                    index: i
                };
                if (data.quality > qualReq) {
                    offer["inc"].push(data);
                }
            }

            offer["inc"].sort(function (a, b) {
                return a.PQR - b.PQR;
            });

            var n = 0;
            qualEst = 0;
            var torepair = 0;
            for (var i = 0; i < offer["inc"].length; i++) {
                if (offer["inc"][i].buy) {
                    torepair += offer["inc"][i].buy;
                    qualEst += offer["inc"][i].buy * offer["inc"][i].quality;
                }
            }
            qualEst = (qualEst + (equip.num - torepair) * qualNow) / equip.num;

            while (qualEst < qualReq && n < offer["inc"].length) {

                if (offer["inc"][n] && offer["inc"][n].length > n && offer["inc"][n].available - offer["inc"][n].buy === 0) {
                    n++;
                    continue;
                }

                offer["inc"][n].buy++;

                qualEst = 0;
                torepair = 0;
                for (var i = 0; i < offer["inc"].length; i++) {
                    if (offer["inc"][i].buy) {
                        torepair += offer["inc"][i].buy;
                        qualEst += offer["inc"][i].buy * offer["inc"][i].quality;
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

            for (var i = 0; i < offer["inc"].length; i++) {
                if (offer["inc"][i].buy) {
                    change.push({
                        op: "buy",
                        offer: offer["inc"][i].offer,
                        amount: offer["inc"][i].buy
                    });
                }
            }

            if (equipWear > 0 && (h < offer["high"].length || n < offer["inc"].length)) {
                postMessage0("No equipment on the market with a quality higher than required. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }

        }

        else if (choices[0] === 2 && equipWear !== 0) {

            var managerIndex = _manager.pic.indexOf(subType[equip.type][2]);
            var equipMax = calcEquip(calcSkill(_salary.employees, subType[equip.type][0], _manager.base[managerIndex] + _manager.bonus[managerIndex]));

            var offer = {
                low: [],
                mid: [],
                high: []
            };

            var qualNow = equip.quality + 0.005;

            for (var i = 0; i < _equipment.offer.length; i++) {
                var data = {
                    PQR: _equipment.price[i] / _equipment.qualOffer[i],
                    quality: _equipment.qualOffer[i] + 0.005,
                    available: _equipment.available[i],
                    buy: 0,
                    offer: _equipment.offer[i],
                    index: i
                };
                if (data.quality < qualNow) {
                    offer["low"].push(data);
                }
                else if (data.quality < equipMax) {
                    offer.mid.push(data);
                }
                else {
                    offer["high"].push(data);
                }
            }

            for (var key in offer) {
                offer[key].sort(function (a, b) {
                    return a.PQR - b.PQR;
                });
            }

            var l = 0;
            var m = 0;
            var h = 0;
            var qualEst = 0;
            var qualNew = qualNow;

            while (equipWear > 0 && l + m < offer["low"].length + offer.mid.length && m + h < offer.mid.length + offer["high"].length) {

                if (offer["low"][l] && offer["low"][l].length > l && offer["low"][l].available - offer["low"][l].buy === 0) {
                    l++;
                    continue;
                }
                if (offer.mid[m] && offer.mid[m].length > m && offer.mid[m].available - offer.mid[m].buy === 0) {
                    m++;
                    continue;
                }
                if (offer["high"][h] && offer["high"][h].length > h && offer["high"][h].available - offer["high"][h].buy === 0) {
                    h++;
                    continue;
                }

                qualEst = qualNew;
                h < offer["high"].length && offer["high"][h].buy++;
                for (var key in offer) {
                    for (var i = 0; i < offer[key].length; i++) {
                        if (offer[key][i].buy) {
                            qualEst = ((equip.num - offer[key][i].buy) * qualEst + offer[key][i].buy * offer[key][i].quality) / equip.num;
                        }
                    }
                }
                h < offer["high"].length && offer["high"][h].buy--;

                if (h < offer["high"].length && qualEst < equipMax && (m === offer.mid.length || offer["high"][h].PQR < offer.mid[m].PQR)) {
                    offer["high"][h].buy++;
                }
                else if (l < offer["low"].length && qualEst > equipMax && (m === offer.mid.length || offer["low"][l].PQR < offer.mid[m].PQR)) {
                    offer["low"][l].buy++;
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

            if (equipWear > 0 && l + m < offer["low"].length + offer.mid.length) {
                postMessage0("No equipment on the market with a quality lower than the maximum quality defined by the Top1. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }
            else if (equipWear > 0 && m + h < offer.mid.length + offer["high"].length) {
                postMessage0("No equipment on the market with a quality higher than the current quality. Could not repair subdivision <a href=" + url + ">" + subid + "</a>");
            }

        }

        else if (choices[0] === 3 && equipWear !== 0) {

            var offer = [];

            for (var i = 0; i < _equipment.offer.length; i++) {
                offer.push({
                    price: _equipment.price[i],
                    quality: _equipment.qualOffer[i],
                    available: _equipment.available[i],
                    offer: _equipment.offer[i],
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
                (function (i) {
                    xContract("/" + realm + "/ajax/unit/supply/equipment", {
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
                            !--equipcount && xTypeDone(type);
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


function salePrice(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function salePolicy(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function servicePrice(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function serviceWithoutStockPrice(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function incineratorPrice(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function retailPrice(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function prodSupply(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function storeSupply(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function wareSupply(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}



function salary(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function holiday(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function training(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function technology(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function research(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function prodBooster(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function politicAgitation(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}

function wareSize(policyName: string, subid: number, choices: number[]) {
    let fn = getFuncName(arguments);
    logDebug("started: ", fn);
    xTypeDone(policyName);
}
