/**
 * @module planning
 */

const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]

const frMonths = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
]

const days = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat"
]

const frDays = [
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
    "Dimanche"
]


const hours = [
    "00",
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
]

window.addEventListener('load', function() {
    initNewEventDates();
});

// initNewEventDates()
//
// Initializes the dates of the add event form
function initNewEventDates() {
    let date = new Date();
    const hour = 3600000;
    const extraTime = date.getTime() % hour;

    date = new Date(date.getTime() - extraTime + hour * 2);
    let isoString = date.toISOString();
    let dateInputBeginAt = document.getElementById('begin_at');
    dateInputBeginAt.setAttribute("min", isoString.substring(0, (isoString.indexOf("T")|0) + 6|0));
    dateInputBeginAt.value = isoString.substring(0, (isoString.indexOf("T")|0) + 6|0);

    date = new Date(date.getTime() + 1 * hour);
    isoString = date.toISOString();
    let dateInputEndAt = document.getElementById('end_at');
    dateInputEndAt.setAttribute("min", isoString.substring(0, (isoString.indexOf("T")|0) + 6|0));
    dateInputEndAt.value = isoString.substring(0, (isoString.indexOf("T")|0) + 6|0);

    websocket.addEventListener('planning', 'new', (message) => {
        window.location.reload();
    });

    websocket.addEventListener('planning', 'update', (message) => {
        window.location.reload();
    });

    websocket.addEventListener('planning', 'delete', (message) => {
        window.location.reload();
    });
}

// todayEvents()
//
// Display today events
function todayEvents() {
    const todayLi = document.getElementById("today-li");
    const futureLi = document.getElementById("future-li");
    const pastLi = document.getElementById("past-li");

    todayLi.classList.add("active");
    futureLi.classList.remove("active");
    pastLi.classList.remove("active");

    document.getElementById("todaylay").style.display = "block";
    document.getElementById("futurelay").style.display = "none";
    document.getElementById("pastlay").style.display = "none";
}

// futureEvents()
//
// Display future events
function futureEvents() {
    const todayLi = document.getElementById("today-li");
    const futureLi = document.getElementById("future-li");
    const pastLi = document.getElementById("past-li");

    todayLi.classList.remove("active");
    futureLi.classList.add("active");
    pastLi.classList.remove("active");

    document.getElementById("todaylay").style.display = "none";
    document.getElementById("futurelay").style.display = "block";
    document.getElementById("pastlay").style.display = "none";
}

// pastEvents()
//
// Display past events
function pastEvents() {
    const todayLi = document.getElementById("today-li");
    const futureLi = document.getElementById("future-li");
    const pastLi = document.getElementById("past-li");

    todayLi.classList.remove("active");
    futureLi.classList.remove("active");
    pastLi.classList.add("active");

    document.getElementById("todaylay").style.display = "none";
    document.getElementById("futurelay").style.display = "none";
    document.getElementById("pastlay").style.display = "block";
}

// createSummary()
// Params:
//      Element element,
//      string title,
//      string beginAt
// Create and display summary of the events
function createSummary(element, id, title, description, ssNumber, type, beginAt, endAt, report, userId, currentUser) {
    if (isAO(currentUser) == true)
        var user = currentUser;
    else
        var user = JSON.parse(currentUser.replace(/&quot;/g,'"'));

    if (userId == user.id) {
        let span = document.createElement("span");
        let li = document.createElement("li");

        let titleText = document.createTextNode(title);
        let intl = new Intl.DateTimeFormat("fr-FR", {hour12: false, hour: "2-digit", minute: "2-digit", second:"2-digit"});
        let frDate = new Date(beginAt);
        let beginAtText = document.createTextNode(beginAt.slice(0, 10).split("-").reverse().join("/") + " à " + intl.format(frDate).slice(0, 5).split(":").join("h"));

        span.appendChild(beginAtText);
        li.appendChild(titleText);

        li.onclick = function() {
            let eventId = document.querySelector(".event-informations > div > div > .event-id");
            eventId.innerText = "#" + id;

            let inputTitle = document.querySelector(".event-informations > div > div > form > #title");
            let inputDescription = document.querySelector(".event-informations > div > div > form > #description");
            let inputSsNumber = document.querySelector(".event-informations > div > div > form > #ss_number");
            let inputType = document.querySelector(".event-informations > div > div > form > #type");
            let inputBeginAt = document.querySelector(".event-informations > div > div > form > #begin_at");
            let inputEndAt = document.querySelector(".event-informations > div > div > form > #end_at");
            let inputReport = document.querySelector(".event-informations > div > div > form > #report");
            let buttonDelete = document.querySelector(".event-informations > div > div > #deleteEvent");

            inputTitle.value = title;
            inputDescription.value = description;
            inputSsNumber.value = ssNumber;
            inputType.value = type;
            inputBeginAt.value = beginAt.slice(0, 16);
            inputEndAt.value = endAt.slice(0, 16);
            inputReport.value = report;

            buttonDelete.onclick = function() {
                // console.log("Deleting event #" + id + " ...");
                apiDelete('planning', id);
                // console.log("Event #" + id + " deleted.");
            };

            showPopUpEventInformations();
        };

        element.appendChild(span);
        element.appendChild(li);
    }
}

// displayEvents()
// Params:
//      Object events
// Display events in the summary
function displayEvents(events, currentUser) {
    const data = JSON.parse(events.replace(/&quot;/g,'"'));

    for (item in data) {
        let now = new Date();
        let begin = new Date(data[item].begin_at);
        let end = new Date(data[item].end_at);

        let yyyyToday = now.getFullYear();
        let mmToday = now.getMonth() + 1;
        let ddToday = now.getDate();
        if (ddToday < 10) ddToday = '0' + ddToday;
        if (mmToday < 10) mmToday = '0' + mmToday;
        let today = ddToday + '/' + mmToday + '/' + yyyyToday;

        let yyyyBegin = begin.getFullYear();
        let mmBegin = begin.getMonth() + 1;
        let ddBegin = begin.getDate();
        if (ddBegin < 10) ddBegin = '0' + ddBegin;
        if (mmBegin < 10) mmBegin = '0' + mmBegin;
        let beginDate = ddBegin + '/' + mmBegin + '/' + yyyyBegin;

        if (now.getTime() < end.getTime() && today == beginDate) {
            const summary = document.getElementById("todaylay");
            createSummary(summary, data[item].id, data[item].title, data[item].description, data[item].ss_number, data[item].type, data[item].begin_at, data[item].end_at, data[item].report, data[item].user_id, currentUser);
        } else if (now.getTime() < begin.getTime() && today != beginDate) {
            const summary = document.getElementById("futurelay");
            createSummary(summary, data[item].id, data[item].title, data[item].description, data[item].ss_number, data[item].type, data[item].begin_at, data[item].end_at, data[item].report, data[item].user_id, currentUser);
        } else if (end.getTime() < now.getTime()) {
            const summary = document.getElementById("pastlay");
            createSummary(summary, data[item].id, data[item].title, data[item].description, data[item].ss_number, data[item].type, data[item].begin_at, data[item].end_at, data[item].report, data[item].user_id, currentUser);
        }
    }
}

/**
 * Return the date of previous monday
 * @param {Date} date - Date of the current day
 */
function getMonday(date) {
    const currentDate = new Date(date);

    var currentDay = currentDate.getDay();
    mondayDate = currentDate.getDate() - currentDay + (currentDay == 0 ? -6 : 1); // adjust when day is sunday

    return new Date(currentDate.setDate(mondayDate));
}

/**
 * Return the number of days in the month
 * @param {int} month - Current month
 * @param {int} year - Current year
 */
function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

/**
 * Return an array of the week
 * @param {int} currentDay - Current day
 * @param {int} currentMonth - Current month
 * @param {int} currentYear - Current year
 * @param {Date} mondayDate - Monday date of the current week
 * @param {int} numberOfDays - Number of days in the current month
 */
function getCurrentWeek(currentDay, currentMonth, currentYear, mondayDate, numberOfDays) {
    let newDays = 1;
    let nextMonth;
    let nextYear;
    let weekdaysArray = [];

    for (var countDays = currentDay; countDays < numberOfDays; countDays++) {
        if (countDays > getDaysInMonth(mondayDate.getMonth(), currentYear)) {
            if (months[mondayDate.getMonth()] != "Dec") {
                nextMonth = months[mondayDate.getMonth() + 1];
                nextYear = (parseInt(currentYear)).toString();
            } else {
                nextMonth = months[0];
                nextYear = (parseInt(currentYear) + 1).toString();
            }
            let countDate = new Date(nextMonth + " " + newDays.toString() + " " + nextYear);
            weekdaysArray.push(countDate);
            newDays++;
        } else {
            let countDate = new Date(currentMonth + " " + countDays.toString() + " " + currentYear);
            weekdaysArray.push(countDate);
        }
    }
    return weekdaysArray;
}

/**
 * Create the table of the planning
 * @param {date} currentDate - Date of the current day
 */
function generatePlanning(currentDate, events, currentUser) {
    let year = currentDate.getFullYear();
    let month = months[currentDate.getMonth()];
    let day = days[currentDate.getDay()];
    let dayNumber = ("0" + currentDate.getDate()).slice(-2);

    // Display the current date in span#month-date
    let date = document.getElementById("month-date");
    date.innerHTML = frMonths[currentDate.getMonth()] + " " + year;

    // Get first day of the week date
    let mondayDate = getMonday(currentDate);
    let mondayYear = mondayDate.getFullYear();
    let mondayMonth = months[mondayDate.getMonth()];
    let mondayDay = parseInt(("0" + mondayDate.getDate()).slice(-2));
    let numberOfDays = parseInt(mondayDay) + 7;

    // Get an array of the week
    let weekdaysArray = getCurrentWeek(mondayDay, mondayMonth, mondayYear, mondayDate, numberOfDays)

    // Generate headers
    var headerDays = document.querySelectorAll("#monday-header, #tuesday-header, #wednesday-header, #thursday-header, #friday-header, #saturday-header, #sunday-header");
    headerDays[0].innerHTML = "Lun. " + ("0" + weekdaysArray[0].getDate()).slice(-2);
    headerDays[1].innerHTML = "Mar. " + ("0" + weekdaysArray[1].getDate()).slice(-2);
    headerDays[2].innerHTML = "Mer. " + ("0" + weekdaysArray[2].getDate()).slice(-2);
    headerDays[3].innerHTML = "Jeu. " + ("0" + weekdaysArray[3].getDate()).slice(-2);
    headerDays[4].innerHTML = "Ven. " + ("0" + weekdaysArray[4].getDate()).slice(-2);
    headerDays[5].innerHTML = "Sam. " + ("0" + weekdaysArray[5].getDate()).slice(-2);
    headerDays[6].innerHTML = "Dim. " + ("0" + weekdaysArray[6].getDate()).slice(-2);

    // Generate planning
    for (day in weekdaysArray) {
        var elements = document.querySelectorAll("#monday-hours, #tuesday-hours, #wednesday-hours, #thursday-hours, #friday-hours, #saturday-hours, #sunday-hours");
        elements[day].innerHTML = "";
        for (hour in hours) {
            elements[day].innerHTML += "<div class=hour id=" + weekdaysArray[day].getFullYear() + "-" + (weekdaysArray[day].getMonth() + 1) + "-" + ("0" + weekdaysArray[day].getDate()).slice(-2) + "-" + hours[hour] + "></div>";
        }
    }
    loadEvents(events, currentUser);
}

// isAO()
// Params:
//      Object data
// Check if the data is an Array or an Object
function isAO(data) {
    return data instanceof Array || data instanceof Object ? true : false;
}

// loadEvent()
// Params:
//      Object events
// Load the events of the week in the table of the planning
function loadEvents(events, currentUser) {
    if (isAO(events) == true)
        var data = events;
    else
        var data = JSON.parse(events.replace(/&quot;/g,'"'));

    if (isAO(currentUser) == true)
        var user = currentUser;
    else
        var user = JSON.parse(currentUser.replace(/&quot;/g,'"'));

    for (item in data) {
        if (data[item].user_id == user.id) {
            const eventDate = new Date(data[item].begin_at);
            let year = eventDate.getFullYear();
            let month = eventDate.getMonth() + 1;
            let day = days[eventDate.getDay()];
            let hour = hours[eventDate.getHours()];
            let dayNumber = ("0" + eventDate.getDate()).slice(-2);

            if (document.getElementById(year + "-" +  month + "-" + dayNumber + "-" + hour)) {
                var event = document.getElementById(year + "-" +  month + "-" + dayNumber + "-" + hour);

                if (event.classList.contains("event")) {
                    event.classList.remove("event");
                    event.classList.add("multiple-events");
                    let twinEvent = event.innerText;
                    event.innerHTML =
                                    "<div class='event'>" +
                                        "<span class='event-title'>" + twinEvent.slice(0, 3) + ".</span>" +
                                    "</div>";
                    event.innerHTML +=
                                    "<div class='event'>" +
                                        "<span class='event-title'>" + data[item].title.slice(0, 3) + ".</span>" +
                                    "</div>";

                    switch (event.classList[1]) {
                        case "blue":
                            event.classList.remove("blue");
                            event.children[0].classList.add("blue");
                            break;
                        case "orange":
                            event.classList.remove("orange");
                            event.children[0].classList.add("orange");
                            break;
                        case "green":
                            event.classList.remove("green");
                            event.children[0].classList.add("green");
                            break;
                        case "pink":
                            event.classList.remove("pink");
                            event.children[0].classList.add("pink");
                            break;
                        case "red":
                            event.classList.remove("red");
                            event.children[0].classList.add("red");
                            break;
                        case "light-grey":
                            event.classList.remove("light-grey");
                            event.children[0].classList.add("light-grey");
                            break;
                        case "grey":
                            event.classList.remove("grey");
                            event.children[0].classList.add("grey");
                            break;
                    }
                    switch (data[item].type) {
                        case "Consultation":
                            event.children[1].classList.add("blue");
                            break;
                        case "Opération":
                            event.children[1].classList.add("orange");
                            break;
                        case "Visites":
                            event.children[1].classList.add("green");
                            break;
                        case "Garde":
                            event.children[1].classList.add("pink");
                            break;
                        case "Réunion":
                            event.children[1].classList.add("red");
                            break;
                        case "Déjeuner":
                            event.children[1].classList.add("light-grey");
                            break;
                        case "Pause":
                            event.children[1].classList.add("grey");
                            break;
                        case "Vacances":
                            event.children[1].classList.add("grey");
                            break;
                    }

                    event.children[0].classList.add("multiple-events-child");
                    event.children[1].classList.add("multiple-events-child");
                } else {
                    event.classList.add("event");
                    event.innerHTML = data[item].title;

                    switch (data[item].type) {
                        case "Consultation":
                            event.classList.add("blue");
                            break;
                        case "Opération":
                            event.classList.add("orange");
                            break;
                        case "Visites":
                            event.classList.add("green");
                            break;
                        case "Garde":
                            event.classList.add("pink");
                            break;
                        case "Réunion":
                            event.classList.add("red");
                            break;
                        case "Déjeuner":
                            event.classList.add("light-grey");
                            break;
                        case "Pause":
                            event.classList.add("grey");
                            break;
                        case "Vacances":
                            event.classList.add("grey");
                            break;
                    }

                    event.onclick = () => {
                        showPopUpAlertUser();
                        // console.log("onclick: " + data[item].type);

                        // switch (data[item].type) {
                        //     case "Consultation":
                        //         console.log("onclick con.");
                        //         showPopUpAlertUser();
                        //         // window.location.replace('/consultation?ssNumber=' + data[item].ssNumber + '&eventTitle=' + data[item].title + '&eventDescription=' + data[item].description)
                        //         break;
                        //     case "Opération":
                        //         console.log("onclick opé.");
                        //         showPopUpAlertUser();
                        //         // window.location.replace('/operation?ssNumber=' + data[item].ssNumber + '&eventTitle=' + data[item].title + '&eventDescription=' + data[item].description)
                        //         break;
                        // }
                    }
                }
            }
        }
    }
}

// previousWeek()
// Params:
//      Object events
// Load the previous week in the planning
function previousWeek(events, currentUser) {
    var element = document.querySelectorAll('[id$="-00"]');
    var elementID = element[0].getAttribute("id");
    var dateArray = elementID.split("-");
    var formatDate = dateArray[0] + " " + dateArray[1] + " " + dateArray[2];
    const currentMonday = new Date(formatDate);
    var pastMonday = currentMonday.getDate() - 7;
    currentMonday.setDate(pastMonday);

    generatePlanning(currentMonday, events, currentUser);
}

// nextWeek()
// Params:
//      Object events
// Load the next week in the planning
function nextWeek(events, currentUser) {
    var element = document.querySelectorAll('[id$="-00"]');
    var elementID = element[0].getAttribute("id");
    var dateArray = elementID.split("-");
    var formatDate = dateArray[0] + " " + dateArray[1] + " " + dateArray[2];
    const currentMonday = new Date(formatDate);
    var nextMonday = currentMonday.getDate() + 7;
    currentMonday.setDate(nextMonday);

    generatePlanning(currentMonday, events, currentUser);
}

// addEvent()
// Params:
//      Object element
// Add an event to the planning
function addEvent(element) {
    let newEvent = {
        title: document.querySelector(".add-event-form > div > div > form > #title").value,
        description: document.querySelector(".add-event-form > div > div > form > #description").value,
        ss_number: document.querySelector(".add-event-form > div > div > form > #ss_number").value,
        type: document.querySelector(".add-event-form > div > div > form > #type").value,
        begin_at: document.querySelector(".add-event-form > div > div > form > #begin_at").value,
        end_at: document.querySelector(".add-event-form > div > div > form > #end_at").value,
        user_id: getCookie('userId'),
    };

    if (newEvent.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un titre', WARNING);
        return;
    } else if (newEvent.begin_at === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de début', WARNING);
        return;
    } else if (newEvent.end_at === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de fin', WARNING);
        return;
    } else if (newEvent.begin_at >= newEvent.end_at) {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de fin correcte', WARNING);
        return;
    }


    newEvent.begin_at = formatApiDate(new Date(newEvent.begin_at));
    newEvent.end_at = formatApiDate(new Date(newEvent.end_at));

    apiPost('planning', newEvent, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}

// editEvent()
// Params:
//      Object element
// Edit an event to the planning
function editEvent(element) {
    let eventId = document.querySelector(".event-informations > div > div > .event-id").innerText.slice(1);
    // console.log(eventId);

    let newEvent = {
        id: eventId,
        title: document.querySelector(".event-informations > div > div > form > #title").value,
        description: document.querySelector(".event-informations > div > div > form > #description").value,
        ss_number: document.querySelector(".event-informations > div > div > form > #ss_number").value,
        type: document.querySelector(".event-informations > div > div > form > #type").value,
        begin_at: document.querySelector(".event-informations > div > div > form > #begin_at").value,
        end_at: document.querySelector(".event-informations > div > div > form > #end_at").value,
        report: document.querySelector(".event-informations > div > div > form > #report").value,
        user_id: getCookie('userId'),
    };

    // console.log(document.querySelector(".event-informations > div > .form-content > form > #title").value);
    // console.log(getCookie('userId'));

    if (newEvent.title === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner un titre', WARNING);
        return;
    } else if (newEvent.begin_at === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de début', WARNING);
        return;
    } else if (newEvent.end_at === '') {
        customAlert(MSG_ERROR, 'Vous devez renseigner une date de fin', WARNING);
        return;
    } else if (new Date(newEvent.begin_at) <= new Date() || new Date(newEvent.end_at) <= new Date()) {
        customAlert(MSG_ERROR, 'Vous ne pouvez pas modifier un événement déjà commencé/terminé', WARNING);
        return;
    }

    newEvent.begin_at = formatApiDate(new Date(newEvent.begin_at));
    newEvent.end_at = formatApiDate(new Date(newEvent.end_at));

    apiUpdate('planning', newEvent, function(response) {
        window.location.reload();
    });
}

/**
 * Format date for API
 * @param {date} date - Date to format for the API
 */
function formatApiDate(date) {
    let day = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date);
    let month = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date);
    let year = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date);
    let hours = new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false }).format(date);
    let minutes = new Intl.DateTimeFormat('en', { minute: '2-digit' }).format(date);

    return `${year}-${month}-${day} ${hours}:${minutes}:00`;
}

/**
 * Export events from the planning
 */
function exportEvents() {
    cal.download();
}

/**
 * Clear date
 * @param {Date} date - Clean ICS date to JSON date
 */
function clearIcsToJsonDate(date) {
    var clearDate = "";
    var tmp = "";

    for (var j = 0; j < 4; j++) {
        tmp += date[j];
    }
    tmp += "-";
    for (var j = 4; j < 6; j++) {
        tmp += date[j];
    }
    tmp += "-";
    for (var j = 6; j < 11; j++) {
        tmp += date[j];
    }
    tmp += ":";
    for (var j = 11; j < 13; j++) {
        tmp += date[j];
    }
    tmp += ":";
    for (var j = 13; j < 15; j++) {
        tmp += date[j];
    }

    clearDate = tmp;

    return clearDate;
}

/**
 * Import events from your computer
 * @param {object} fileObject - ICS file with new events to import
 * @param {array} planning - Array of the events
 */
function importEvents(fileObject, planning, currentUser) {
    if (isAO(currentUser) == true)
        var user = currentUser;
    else
        var user = JSON.parse(currentUser.replace(/&quot;/g,'"'));

    var data;

    let reader = new FileReader();
    reader.readAsText(fileObject);
    reader.onload = function() {
        data = reader.result;
        var lines = data.split("\n");
        var events = {};
        var title = "";
        var description = "";
        var type = "";
        var begin_at = "";
        var end_at = "";
        var events_i = 0;

        for (i = 0; i < lines.length; i++) {
            if (lines[i].includes('DESCRIPTION')) {
                description = lines[i].split(":");
                events[events_i] = {description: description[1].substring(0, description[1].length - 1)};
            }
            else if (lines[i].includes('DTSTART')) {
                var begin_at = lines[i].split(":");
                begin = clearIcsToJsonDate(begin_at[1]);
                events[events_i]["begin_at"] = begin;
            }
            else if (lines[i].includes('DTEND')) {
                var end_at = lines[i].split(":");
                end = clearIcsToJsonDate(end_at[1]);
                events[events_i]["end_at"] = end;
            }
            else if (lines[i].includes('LOCATION')) {
                var type = lines[i].split(":");
                events[events_i]["type"] = type[1].substring(0, type[1].length - 1);
            }
            else if (lines[i].includes('SUMMARY')) {
                var title = lines[i].split(":");
                events[events_i]["title"] = title[1].substring(0, title[1].length - 1);
            }
            else if (lines[i].includes('END:VEVENT')) {
                events[events_i]["user_id"] = user.id;
                events_i++;
            }
        }

        // console.log("Events object: ");
        // console.log(events);

        var size = Object.keys(events).length;

        for (var i = 0; i < size; i++) {
            let bool = 0;

            for (let event in planning) {
                let newDate = new Date(events[i].begin_at);
                let oldDate = new Date(planning[event].begin_at);
                if (planning[event].title == events[i].title && planning[event].description == events[i].description && newDate.getDate() == oldDate.getDate()) {
                    // console.log(planning[event].title + " " + events[i].title);
                    bool = 1;
                }
            }

            if (bool == 0) {
                apiPost('planning', events[i], function(response) {
                    response.json().then(function(data) {
                        window.location.reload();
                    });
                });
            }
        }
    };
}
