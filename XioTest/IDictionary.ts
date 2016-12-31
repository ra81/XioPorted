
// стандартный словарь. 
interface IDictionary<T> {
    [index: string]: T;
}

// просто кусок кода которым я проверял работу с селектами
//$("#mainContent > table.unit-list-2014 > tbody > tr:nth-child(1) > td:nth-child(11) > select:nth-child(1)").change(
//    function () {
//        let id = $(this).attr("data-id");
//        let p = $(this).closest("tr");
//        p.css("background-color", "rgb(255, 210, 170)");
//        console.log(p.get());
//        console.log(id);
//    });