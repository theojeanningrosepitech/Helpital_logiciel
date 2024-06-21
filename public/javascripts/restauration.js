function showMenuRelaisH() {
    document.getElementById('menu_relais_h').style.display = "flex";
    document.getElementById('menu_medirest').style.display = "none";
    document.getElementById('menu_helpifood').style.display = "none";
}

function showMenuMedirest() {
    document.getElementById('menu_medirest').style.display = "flex";
    document.getElementById('menu_relais_h').style.display = "none";
    document.getElementById('menu_helpifood').style.display = "none";
}

function showMenuHelpifood() {
    document.getElementById('menu_helpifood').style.display = "flex";
    document.getElementById('menu_relais_h').style.display = "none";
    document.getElementById('menu_medirest').style.display = "none";
}