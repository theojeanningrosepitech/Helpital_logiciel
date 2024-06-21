// var t=setInterval(runFunction,1000);
let grid = GridStack.init({
    minRow: 6,
    maxRow: 6,
    float: true,
    class: "dashboard"
});

const removeIcon = "<i class=\"material-icons delete-button\" onclick=\"removeWidget(this.parentElement)\">remove_circle</i>"
let widgets = JSON.parse(decodeURIComponent(all_widgets))
let dashboard_layout = JSON.parse(JSON.parse(decodeURIComponent(layout)))

window.onload = function () {
    if (dashboard_layout !== null) {
        dashboard_layout.children.forEach((data) => {
            data.content = decodeURIComponent(data.content)
        })
        console.log("triggered")
        console.log(dashboard_layout)
        grid.destroy();
        grid = GridStack.addGrid(document.querySelector('body'), dashboard_layout)
        document.getElementById("edit-button").parentElement.setAttribute('id', "buttons")
        let elems = document.querySelectorAll(".grid-stack-item");
        [].forEach.call(elems, function (el) {
            if (el.parentElement.id !== "edit") {
                let i = document.createElement("i")
                i.classList.add("material-icons")
                i.classList.add("delete-button")
                i.addEventListener("click", removeWidget, el.parentElement)
                i.innerText = "remove_circle"
                i.style.display = "none"
                el.appendChild(i)
            }
        })
    } else {
        grid.addWidget({
            "minW": 2,
            "minH": 3,
            "noResize": true,
            "noMove": true,
            "locked": true,
            "id": "planning",
            "content": decodeURIComponent(planningWidgetHTML)
        })
        grid.addWidget({
            "minW": 2,
            "minH": 3,
            "noResize": true,
            "noMove": true,
            "locked": true,
            "id": "pointage",
            "content": decodeURIComponent(pointageWidgetHTML)
        })
        document.querySelectorAll('[gs-id="planning"]')[0].id = "planning";
        document.querySelectorAll('[gs-id="pointage"]')[0].id = "pointage";
        let collection = grid.el.children
        for (let el of collection) {
            let i = document.createElement("i")
            i.classList.add("material-icons")
            i.classList.add("delete-button")
            i.addEventListener("click", removeWidget, el.parentElement)
            i.innerText = "remove_circle"
            i.style.display = "none"
            if (el.id !== "edit")
                el.appendChild(i)
        }
    }

    if (localStorage.getItem("checkedIn") === 'true' && document.getElementById("check-in-time") && document.getElementById("flowing-time")) {
        let checkedIn = localStorage.getItem("checkedIn") === 'true'
        if (checkedIn) {
            let timeInterval = setInterval(updateTime, 1000)
            localStorage.setItem("timeInterval", timeInterval.toString())

            let timeCheckedIn = new Date(localStorage.getItem("timeCheckedIn"))
            document.getElementById("check-in-time").innerText = `Heure de pointage: ${timeCheckedIn.toTimeString().slice(0, 8)}`
            let endDate = new Date();
            let seconds = (endDate.getTime() - timeCheckedIn.getTime()) / 1000;
            document.getElementById("flowing-time").innerText = toHHMMSS(Math.floor(seconds))
        }
    }
}

window.onbeforeunload = function () {
    let layout = grid.save(true, true)
    layout.children.forEach((data) => {
        data.content = encodeURIComponent(data.content)
    })
    const requestOptions = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(layout)
    };
    document.cookie = document.cookie.slice(0, document.cookie.indexOf("dashboard_layout")+"dashboard_layout=".length) + requestOptions.body
    fetch(`/api/users/dashboard?id=${getCookie("userId")}`, requestOptions);
}


function checkIn() {

    let checkedIn = localStorage.getItem("checkedIn") === 'true'
    if (checkedIn) {
        localStorage.setItem("checkedIn", "false")
        clearInterval(localStorage.getItem("timeInterval"))
        let e = document.getElementById("flowing-time").innerText
        let a = document.getElementById("check-in-time").innerText.slice(19, 28)
        document.getElementById("check-in-time").innerText = "Vous avez pointé aujourd'hui à " + a + " pour " + e
        document.getElementById("flowing-time").innerText = ""
    } else {
        timeCheckedIn = new Date()
        localStorage.setItem("timeCheckedIn", timeCheckedIn)
        localStorage.setItem("checkedIn", "true")
        document.getElementById("check-in-time").innerHTML = `Heure de pointage: ${timeCheckedIn.toTimeString().slice(0, 8)}`
        let endDate = new Date();
        let seconds = (endDate.getTime() - timeCheckedIn.getTime()) / 1000;
        document.getElementById("flowing-time").innerText = toHHMMSS(Math.floor(seconds))
        let timeInterval = setInterval(updateTime, 1000)
        localStorage.setItem("timeInterval", timeInterval.toString())
    }
}

function updateTime() {
    let timeCheckedIn = new Date(localStorage.getItem("timeCheckedIn"))
    let endDate = new Date();
    let seconds = (endDate.getTime() - timeCheckedIn.getTime()) / 1000;
    document.getElementById("flowing-time").innerText = toHHMMSS(Math.floor(seconds))
}

let edit = false

function editMode() {
    if (!edit) {
        document.getElementsByClassName("dashboard grid-stack")[0].style.background = "#dddddd"
        document.getElementsByClassName("dashboard grid-stack")[0].style.border = "dashed medium var(--darkerGrey)"
        document.getElementsByClassName("dashboard grid-stack")[0].style.borderRadius = "10px"
        let elems = document.querySelectorAll(".grid-stack-item");
        grid.enable();
        [].forEach.call(elems, function (el) {
            el.classList.add("gentle-hover-shake");
            console.log(el.getElementsByClassName("ui-resizable-handle"))
            el.getElementsByClassName("ui-resizable-handle")[0].onmouseenter = (event) => {
                console.log("onmouseenter")
                el.classList.remove("gentle-hover-shake");
            }
            el.getElementsByClassName("ui-resizable-handle")[0].onmouseleave = (event) => {
                console.log("onmouseleave")
                el.classList.add("gentle-hover-shake");
            }

            if (el.id !== "edit") {
                el.getElementsByClassName("delete-button")[0].style.display = "inline-block"
                el.getElementsByClassName("delete-button")[0].onmouseenter = (event) => {
                    el.classList.remove("gentle-hover-shake");
                }
                el.getElementsByClassName("delete-button")[0].onmouseleave = (event) => {
                    el.classList.add("gentle-hover-shake");
                }
            }
        });

        let b = document.getElementById("buttons")
        b.style.background = "white"

        let a = document.getElementById("add-button")
        a.style.display = "inline-block"
        a.onmouseenter = (event) => {
            document.getElementById("edit").classList.remove("gentle-hover-shake");
        }
        a.onmouseleave = (event) => {
            document.getElementById("edit").classList.add("gentle-hover-shake");
        }

        let e = document.getElementById("edit-button")
        e.onmouseenter = (event) => {
            document.getElementById("edit").classList.remove("gentle-hover-shake");
        }
        e.onmouseleave = (event) => {
            document.getElementById("edit").classList.add("gentle-hover-shake");
        }

        edit = true
    } else {
        grid.disable()
        document.getElementsByClassName("dashboard grid-stack")[0].style.background = ""
        document.getElementsByClassName("dashboard grid-stack")[0].style.border = ""

        document.getElementById("buttons").style.background = "none"

        let elems = document.querySelectorAll(".grid-stack-item");
        [].forEach.call(elems, function (el) {
            el.classList.remove("gentle-hover-shake");
            if (el.id !== "edit") {
                el.getElementsByClassName("delete-button")[0].style.display = "none"
            }
        });

        let a = document.getElementById("add-button")
        a.style.display = "none"
        a.onmouseenter = (event) => {
        }
        a.onmouseleave = (event) => {
        }

        let e = document.getElementById("edit-button")
        e.onmouseenter = (event) => {
        }
        e.onmouseleave = (event) => {
        }

        edit = false
    }
}

function removeWidget(event) {
    let widget = event.target.parentElement
    grid.removeWidget(widget)
}

function removeObjectWithId(arr, id, toPush) {
    arr.forEach((el, index) => {
        console.log(index)
        if (el.id === id) {
            console.log("rentre dans le if")
            toPush.push(arr[index])
            arr.splice(index, 1)
            return arr
        }
    })
    return arr
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function addWidget() {
    let edit = document.getElementById("edit")
    console.log("ADD WIDGET")
    let inactive = []
    let active_widgets = grid.save(true, true)
    for (let widget of widgets) {
        if (!checkPresent(widget, active_widgets.children)) {
            inactive.push(widget)
        }
    }
    const alertBackground = document.getElementById('alert-box-background');
    let alertBox = alertBackground.children[0];
    const mainBox = alertBackground.children[0].children[0];
    const titleElem = document.createElement('h1');
    let div = document.createElement('div');

    alertBox.style.minHeight = "50vh";

    titleElem.innerText = "Ajouter un widget";
    mainBox.appendChild(titleElem);


    let list = document.createElement("ul");
    list.style.display = "block"
    let a = 0
    for (let widget of inactive) {
        let listItem = document.createElement("li")
        listItem.style.display = "block"
        listItem.id = a
        listItem.addEventListener("click", (event) => {
            inactive[event.target.id].content = decodeURIComponent(inactive[event.target.id].content)
            let name = inactive[event.target.id].id
            grid.addWidget(inactive[event.target.id])
            console.log(name)
            document.querySelector('[gs-id=' + name + ']').id = name;
            let i = document.createElement("i")
            i.classList.add("material-icons")
            i.classList.add("delete-button")
            i.addEventListener("click", removeWidget)
            i.innerText = "remove_circle"
            i.style.display = "inline-block"

            grid.enable()
            let el = document.getElementById(name)
            el.classList.add("gentle-hover-shake");
            el.getElementsByClassName("ui-resizable-handle")[0].onmouseenter = (event) => {
                console.log("onmouseenter")
                el.classList.remove("gentle-hover-shake");
            }
            el.getElementsByClassName("ui-resizable-handle")[0].onmouseleave = (event) => {
                console.log("onmouseleave")
                el.classList.add("gentle-hover-shake");
            }

            document.getElementById(name).appendChild(i)
            document.querySelector("#alert-box > div > div > ul").removeChild(event.target)
        })
        listItem.innerText = capitalizeFirstLetter(widget.id)
        list.appendChild(listItem)
        a++
    }
    div.appendChild(list);
    mainBox.appendChild(div);

    if (alertBackground.style.display === 'block')
        closeAlert();
    alertBackground.style.display = 'block';
}

function checkPresent(element, array) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].id === element.id) {
            return true
        }
    }
    return false
}