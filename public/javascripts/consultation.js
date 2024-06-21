function postData(user, patient) {
    let p_content = document.getElementById('data').value
    let p_attached_to = patient.ss_number
    let toPost = {
        n_content: p_content,
        n_attached_to: p_attached_to,
        n_creator: user
    }
    apiPost('note', toPost, () => {
        window.location.replace('/planning')
    })
}

function displayImg(el) {
    let d = document.getElementById(el.innerText)
    if (d.style.display === "none") {
        d.style.display = "flex"
    } else
        d.style.display = "none"
}