function showPopUpVehicl(e) {
    const id = e.getAttribute("vehicl_id");

    const container = document.getElementById('pop-up-form-container-vehicle-info');
    fetch('/api/vehicle?id=' + id).then(function (response) {
        if (response.status >= 200 && response.status < 300)
            response.json().then(function (data) {

                container.style.display = 'block';
                const recap = container.children[0].children[1].children[0].children[0];
                recap.innerHTML = "";
                let elem = document.createElement("div");

                elem.innerText = "Véhicule";
                elem.classList.add("label");
                recap.appendChild(elem);

                let elemChild = document.createElement("div");
                elemChild.innerText = data[0].title;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Numéro";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].number;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Type";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].type;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Capacité Maximale";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].size;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Nombre de patients à transporter";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].capacity;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);

                elem = document.createElement("div");

                elem.innerText = "Provenance";
                elem.classList.add("label");
                recap.appendChild(elem);

                elemChild = document.createElement("div");
                elemChild.innerText = data[0].description;
                elemChild.classList.add("label");
                elem = document.createElement("div");
                elem.classList.add("table-row-em");
                elem.appendChild(elemChild);
                recap.appendChild(elem);
            });
        else
            customAlert(MSG_ERROR, MSG_RETRY, WARNING);
    }).catch(function () {
        customAlert(MSG_ERROR, MSG_INTERNAL_ERROR, WARNING);
    });
}

function hidePopUpVehicl() {
    document.getElementById('pop-up-form-container-meeting-recap').style.display = 'none';
}