// displayReport(contact)
// Params:
//      String report
// Display report
function displayReport(report) {
    let inputReport = document.querySelector(".display-report > div > div > form > #report");

    inputReport.value = report;

    console.log(inputReport);
    console.log(inputReport.value);
    console.log(report);

    showPopUpDisplayReport();
}
