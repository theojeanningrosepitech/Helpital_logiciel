function showPopUpMeeting() {
  document.getElementById('pop-up-form-container-meeting').style.display = 'block';
}

function hidePopUpMeeting() {
  document.getElementById('pop-up-form-container-meeting').style.display = 'none';
}

function showPopUpMeetingRecap(e) {
  const id = e.getAttribute("meeting_id");

  const container = document.getElementById('pop-up-form-container-meeting-recap');
  fetch('/api/meeting?id=' + id).then(function (response) {
    if (response.status >= 200 && response.status < 300)
      response.json().then(function (data) {

        container.style.display = 'block';
        const recap = container.children[0].children[1].children[0].children[0];
        recap.innerHTML = "";
        let elem = document.createElement("div");

        elem.innerText = "Titre";
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

        elem.innerText = "Description";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].description;
        elemChild.classList.add("label");
        elem = document.createElement("div");
        elem.classList.add("table-row-em");
        elem.appendChild(elemChild);
        recap.appendChild(elem);

        elem = document.createElement("div");

        elem.innerText = "Responsable";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].n_creator;
        elemChild.classList.add("label");
        elem = document.createElement("div");
        elem.classList.add("table-row-em");
        elem.appendChild(elemChild);
        recap.appendChild(elem);

        elem = document.createElement("div");

        elem.innerText = "Participants";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].identity;
        elemChild.classList.add("label");
        elem = document.createElement("div");
        elem.classList.add("table-row-em");
        elem.appendChild(elemChild);
        recap.appendChild(elem);

        elem = document.createElement("div");

        elem.innerText = "Notes";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].n_content;
        elemChild.classList.add("label");
        elem = document.createElement("div");
        elem.classList.add("table-row-em");
        elem.appendChild(elemChild);
        recap.appendChild(elem);

        elem = document.createElement("div");

        elem.innerText = "Fichiers";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].file;
        elemChild.classList.add("label");
        elem = document.createElement("div");
        elem.classList.add("table-row-em");
        elem.appendChild(elemChild);
        recap.appendChild(elem);

        elem = document.createElement("div");

        elem.innerText = "Dates";
        elem.classList.add("label");
        recap.appendChild(elem);

        elemChild = document.createElement("div");
        elemChild.innerText = data[0].creation_date;
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

function hidePopUpMeetingRecap() {
  document.getElementById('pop-up-form-container-meeting-recap').style.display = 'none';
}

function addPatient(element) {

  const inputName = element.parentNode.getElementsByTagName("input")[0];
  if (inputName.value == '') {
    alert('Attention : Il faut remplir le champ.');
    return;
  }
  const option = new Option(inputName.value, inputName.value);
  const list = element.parentNode.getElementsByTagName("select")[0];

  list.add(option, undefined);
  inputName.value = '';
  inputName.focus();
}

function removePatient(element) {

  const list = element.parentNode.getElementsByTagName("select")[0];
  let selected = [];

  for (let i = 0; i < list.options.length; i++) {
    selected[i] = list.options[i].selected;
  }

  let index = list.options.length;
  while (index--) {
    if (selected[index]) {
      list.remove(index);
    }
  }
}

function searchList() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('responsable');
  filter = input.value.toUpperCase();
  ul = document.getElementById("displayResponsable");
  li = ul.getElementsByTagName('li');

  if (input.value)
    ul.style.display = "block";
  else
    ul.style.display = "none";

  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "block";
    } else {
      li[i].style.display = "none";
    }
  }
}

function listenKeyEnter(meetingId) {
  var li = document.getElementById(meetingId);

  li.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      li.click();
      return true
    }
    return false
  });
}


function displayInformations(meetingStr) {
  var meeting = JSON.parse(meetingStr)
  var input = document.getElementById("responsable");
  input.value = meeting.n_creator;
}

function searchListParticipent() {
  var input, filter, ul, li, a, i, txtValue;
  input = document.getElementById('participent');
  filter = input.value.toUpperCase();
  ul = document.getElementById("displayParticipant");
  li = ul.getElementsByTagName('li');

  if (input.value)
    ul.style.display = "block";
  else
    ul.style.display = "none";

  for (i = 0; i < li.length; i++) {
    a = li[i].getElementsByTagName("a")[0];
    txtValue = a.textContent || a.innerText;
    if (txtValue.toUpperCase().indexOf(filter) > -1) {
      li[i].style.display = "block";
    } else {
      li[i].style.display = "none";
    }
  }
}

function displayParticipentInformations(meetingStr) {
  var meeting = JSON.parse(meetingStr)
  var input = document.getElementById("participent");
  input.value = meeting.identity;
}

function getInformations(meetingId) {
  const data = {
    id: meetingId,
    identity: document.getElementById("identity").value,
  };
  apiUpdate("meeting", data);
}

function checkClick() {
  document.onclick = function (e) {
    var divToHideParticipent = document.querySelector("#displayParticipant");
    var divToHide = document.querySelector("#displayResponsable");
    if (e.target.id !== "displayResponsable") {
      divToHide.style.display = 'none';
    }
    if (e.target.id !== "displayParticipant") {
      divToHideParticipent.style.display = 'none';
    }
  };
}

checkClick();

function addRecap() {
  let newRecap = {
    title: document.getElementById('title').value,
    description: document.getElementById('description').value,
    n_creator: document.getElementById('responsable').value,
    identity: document.getElementById('participent').value,
    n_content: document.getElementById('note').value,
    //file: document.getElementById('my_file').value,
    creation_date: document.getElementById('begin_at').value,
  };

  if (newRecap.title === '') {
    customAlert(MSG_ERROR, 'Vous devez renseigner un titre', WARNING);
    return;
  } else if (newRecap.description === '') {
    customAlert(MSG_ERROR, 'Vous devez renseigner une date de début', WARNING);
    return;
  } else if (newRecap.n_creator === '') {
    customAlert(MSG_ERROR, 'Vous devez renseigner une date de fin', WARNING);
    return;
  }

  apiPost('meeting', newRecap, function (response) {
    response.json().then(function (data) {
      window.location.reload();
    });
  });
}