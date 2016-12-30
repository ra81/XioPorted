//interface IPolicy {
//    func: () => void;
//    save: string[][];
//    order: string[][];
//    name: string;
//    group: string;
//    wait: string[];
//}

//interface IJsonPolicies {
//    pp: IPolicy;
//    pw: IPolicy;
//    ps: IPolicy;
//    pn: IPolicy;
//    sc: IPolicy;
//    sl: IPolicy;
//    ee: IPolicy;
//    pt: IPolicy;
//    sp: IPolicy;
//    sr: IPolicy;
//    sh: IPolicy;
//    ad: IPolicy;
//    es: IPolicy;
//    en: IPolicy;
//    eh: IPolicy;
//    ep: IPolicy;
//    et: IPolicy;
//    qm: IPolicy;
//    tc: IPolicy;
//    rs: IPolicy;
//    pb: IPolicy;
//    pa: IPolicy;
//    wz: IPolicy;
//}

//let policyJSON: IDictionary<IPolicy> = {
//    pp: {
//        func: salePrice,
//        save: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock", "Output"], ["Keep", "Reject"]],
//        order: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock", "Output"], ["Keep", "Reject"]],
//        name: "priceProd",
//        group: "Price",
//        wait: []
//    },
//    pw: {
//        func: salePrice,
//        save: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock"], ["Keep", "Reject"]],
//        order: [["-", "Zero", "$0.01", "Prime Cost", "CTIE", "Profit Tax", "1x IP", "30x IP", "PQR"], ["Stock"], ["Keep", "Reject"]],
//        name: "priceProd",
//        group: "Price",
//        wait: []
//    },
//    ps: {
//        func: salePolicy,
//        save: [["-", "No sale", "Any", "Company", "Corp."], ["All", "Output"]],
//        order: [["-", "No sale", "Any", "Company", "Corp."], ["All", "Output"]],
//        name: "policy",
//        group: "Policy",
//        wait: []
//    },
//    pn: {
//        func: salePolicy,
//        save: [["-", "No sale", "Any", "Company", "Corp."]],
//        order: [["-", "No sale", "Any", "Company", "Corp."]],
//        name: "policy",
//        group: "Policy",
//        wait: []
//    },
//    sc: {
//        func: servicePrice,
//        save: [["-", "Sales", "Turnover", "Profit"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
//        order: [["-", "Sales", "Turnover", "Profit"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
//        name: "priceService",
//        group: "Price",
//        wait: []
//    },
//    sl: {
//        func: serviceWithoutStockPrice,
//        save: [["-", "Sales", "Turnover"]],
//        order: [["-", "Sales", "Turnover"]],
//        name: "priceService",
//        group: "Price",
//        wait: []
//    },
//    ee: {
//        func: incineratorPrice,
//        save: [["-", "Max"]],
//        order: [["-", "Max"]],
//        name: "priceService",
//        group: "Price",
//        wait: []
//    },
//    pt: {
//        func: retailPrice,
//        save: [["-", "Zero", "Market 10%", "Turnover", "Stock", "Local", "City", "Sales", "Market 6%"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
//        order: [["-", "Zero", "Market 6%", "Market 10%", "Sales", "Turnover", "Stock", "Local", "City"], ["P x0.0", "P x1.0", "P x1.1", "P x1.4", "P x2.0"]],
//        name: "priceRetail",
//        group: "Price",
//        wait: []
//    },
//    sp: {
//        func: prodSupply,
//        save: [["-", "Zero", "Required", "Stock", "Remove"]],
//        order: [["-", "Zero", "Required", "Stock", "Remove"]],
//        name: "supplyProd",
//        group: "Supply",
//        wait: ["priceProd", "policy", "tech", "equip"]
//    },
//    sr: {
//        func: storeSupply,
//        save: [["-", "Zero", "Sold", "Amplify", "Stock", "Enhance"], ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], ["Any Q", "Local Q", "City Q"]],
//        order: [["-", "Zero", "Sold", "Stock", "Amplify", "Enhance"], ["None", "One", "$1 000", "$1 000 000", "Market 1%", "Market 5%", "Market 10%"], ["Any Q", "Local Q", "City Q"]],
//        name: "supplyRetail",
//        group: "Supply",
//        wait: ["priceProd", "policy"]
//    },
//    sh: {
//        func: wareSupply,
//        save: [["-", "Zero", "Required", "Stock", "Enhance", "Nuance", "Maximum"], ["None", "Mine", "All", "Other"], ["Remove", "Zeros", "Ones"], ["Any available volume", "1k", "10k", "100k", "1m", "10m", "100m", "1b", "10b", "100b"]],
//        order: [["-", "Zero", "Required", "Stock", "Enhance", "Nuance", "Maximum"], ["None", "Mine", "All", "Other"], ["Remove", "Zeros", "Ones"], ["Any available volume", "1k", "10k", "100k", "1m", "10m", "100m", "1b", "10b", "100b"]],
//        name: "supplyWare",
//        group: "Supply",
//        wait: ["supplyProd", "supplyRetail"]
//    },
//    ad: {
//        func: advertisement,
//        save: [["-", "Zero", "Min TV", "Max", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Req"]],
//        order: [["-", "Zero", "Min TV", "Req", "Pop1", "Pop2", "Pop5", "Pop10", "Pop20", "Pop50", "Max"]],
//        name: "ads",
//        group: "Ads",
//        wait: []
//    },
//    es: {
//        func: salary,
//        save: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
//        order: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "130%top1", "139%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
//        name: "salaryOldInterface",
//        group: "Salary",
//        wait: ["equip"]
//    },
//    en: {
//        func: salary,
//        save: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "139%top1", "130%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
//        order: [["-", "Required", "Target", "Maximum", "Overflow", "20%top1", "30%top1", "39%top1", "50%top1", "60%top1", "69%top1", "119%top1", "130%top1", "139%top1"], ["min 80% max 500%", "max 500%", "min 80%", "No bound"]],
//        name: "salaryNewInterface",
//        group: "Salary",
//        wait: ["equip"]
//    },
//    eh: {
//        func: holiday,
//        save: [["-", "Holiday", "Working"]],
//        order: [["-", "Holiday", "Working"]],
//        name: "holidayElse",
//        group: "Holiday",
//        wait: []
//    },
//    ep: {
//        func: holiday,
//        save: [["-", "Holiday", "Working", "Stock"]],
//        order: [["-", "Holiday", "Working", "Stock"]],
//        name: "holidayProd",
//        group: "Holiday",
//        wait: ["priceProd"]
//    },
//    et: {
//        func: training,
//        save: [["-", "Always", "City Salary", "1 Year"]],
//        order: [["-", "Always", "City Salary", "1 Year"]],
//        name: "training",
//        group: "Training",
//        wait: ["salaryNewInterface", "salaryOldInterface"]
//    },
//    qm: {
//        func: equipment,
//        save: [["-", "Required", "Maximal", "Q2.00"], ["Black", "Full", "Perc"]],  //Fill
//        order: [["-", "Required", "Maximal", "Q2.00"], ["Black", "Full", "Perc"]],
//        name: "equip",
//        group: "Equipment",
//        wait: ["tech", "research"]
//    },
//    tc: {
//        func: technology,
//        save: [["-", "Research"]],
//        order: [["-", "Research"]],
//        name: "tech",
//        group: "Technology",
//        wait: []
//    },
//    rs: {
//        func: research,
//        save: [["-", "Continue"]],
//        order: [["-", "Continue"]],
//        name: "research",
//        group: "Research",
//        wait: []
//    },
//    pb: {
//        func: prodBooster,
//        save: [["-", "Always", "Profitable"]],
//        order: [["-", "Always", "Profitable"]],
//        name: "solars",
//        group: "Solars",
//        wait: []
//    },
//    pa: {
//        func: politicAgitation,
//        save: [["-", "Continuous agitation"]],
//        order: [["-", "Continuous agitation"]],
//        name: "politics",
//        group: "Politics",
//        wait: []
//    },
//    wz: {
//        func: wareSize,
//        save: [["-", "Packed", "Full"]],
//        order: [["-", "Packed", "Full"]],
//        name: "size",
//        group: "Size",
//        wait: []
//    }
//};
