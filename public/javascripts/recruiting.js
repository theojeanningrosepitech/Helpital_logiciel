/**
 * @module Recruiting
 */

/**
 * Add an offer in the list of job offers
 */
function addOffer() {
    let offer = {
        type_emploiement: document.getElementById('type_offer').value,
        remuneration: document.getElementById('compensation_offer').value,
        skills: document.getElementById('skills_offer').value,
        start_date: document.getElementById('date_offer').value
    };

    console.log(offer);

    apiPost('recruiting', offer, function(response) {
        response.json().then(function(data) {
            window.location.reload();
        });
    });
}
