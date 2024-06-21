async function ShowTutorial() {

    console.log("open tuto");   

    if (document.getElementById('tutorial_display').style.display == 'block') {
        document.getElementById('tutorial_display').style.display = 'none';
    } else {
        document.getElementById('tutorial_display').style.display = 'block';
    }
}

function checkClick() {
    document.onclick = function(e) {
        var divToHide = document.querySelector("#tutorial_display");
        if (e.target.id === "pop-up-container-tuto") {
            divToHide.style.display = 'none';
        }
    };
}

checkClick();