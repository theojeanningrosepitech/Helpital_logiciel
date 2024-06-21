/**
 * Init list of user for back_office
 */
function initOrdersList() {
    const list = document.getElementById('list');
    let selects;

    for (let i = 0; i !== list.childElementCount; i++) {
        selects = list.children[i].getElementsByTagName('select');

        for (let j = 0; j !== selects.length; j++) {
            selects[j].addEventListener('change', saveOrdersSelectOptions);
        }
    }
}

function saveOrdersSelectOptions(e) {
    const data = e.target.options[e.target.selectedIndex].value;
    const target = e.target.getAttribute('name');

    apiUpdate("orders", {
        id: e.target.parentNode.getAttribute('item-id'),
        [target]: data,
    });
}

function addOrder() {
    apiPost("orders", {
        title: document.getElementById('title').value
    }, () => {
        window.location.reload();
    });
}
