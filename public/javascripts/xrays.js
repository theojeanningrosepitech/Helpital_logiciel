/**
 * @module xrays
 */

/**
 * Show the view pop up
 * @param {string} href - Path of the file to view
 */
function showPopUpView(href) {
    document.getElementById('pop-up-view-container').style.display = 'block';

    const title = document.getElementsByClassName("view-header title");
    const content = document.getElementsByClassName("view-content");

    title[0].innerHTML = href;
    content[0].innerHTML = "<img src='/xrays/" + href + "'/>"
}

/**
 * Hide the view pop up
 */
function hidePopUpView() {
    document.getElementById('pop-up-view-container').style.display = 'none';
}

/**
 * Load the x-rays contained in public/xrays/
 */
function loadXRays() {
    console.log("X-Rays loaded.");
}

/**
 * Refresh the x-rays displayed on the page
 */
function refreshXRays() {
    location.reload();
    console.log("X-Rays refreshed.");
}

websocket.addEventListener('radiograph', 'new', (message) => {
    window.location.reload();
});

websocket.addEventListener('radiograph', 'delete', (message) => {
    const list = document.getElementById('list');

    for (let i = list.childElementCount - 1; i !== -1; i--) {
        if (list.children[i].getAttribute('item-id') == message.identifiers.id) {
            list.children[i].remove();
        }
    }
});
