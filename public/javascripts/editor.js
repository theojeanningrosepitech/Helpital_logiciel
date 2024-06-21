function getSelectionParentElement() {
    var parentEl = null, sel;

    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            parentEl = sel.getRangeAt(0).commonAncestorContainer;
            if (parentEl.nodeType != 1) {
                parentEl = parentEl.parentNode;
            }
        }
    } else if ( (sel = document.selection) && sel.type != "Control")
        parentEl = sel.createRange().parentElement();

    return parentEl;
}

function getSelectedNode() {
    const selectedParent = getSelectionParentElement();
    const parent = document.getElementById("content");
    const parentNote = document.getElementById("n_content");
    const parentPrescription = document.getElementById("p_content");

    if (parent && parent.contains(selectedParent)) {
        var selection = window.getSelection();
        if (selection.rangeCount > 0)
            return selection.getRangeAt(0).startContainer.parentNode;
    }

    if (parentNote && parentNote.contains(selectedParent)) {
        var selection = window.getSelection();
        if (selection.rangeCount > 0)
            return selection.getRangeAt(0).startContainer.parentNode;
    }

    if (parentPrescription && parentPrescription.contains(selectedParent)) {
        var selection = window.getSelection();
        if (selection.rangeCount > 0)
            return selection.getRangeAt(0).startContainer.parentNode;
    }

    return null;
}

function applyClass(className) {
    const element = getSelectedNode();

    if (element !== null) {
        if (className == "align-left" || className == "align-center" || className == "align-right") {
            element.classList.remove("align-left");
            element.classList.remove("align-center");
            element.classList.remove("align-right");
            element.classList.add(className);
        } else {
            if (element.classList.contains(className)) {
                element.classList.remove(className);
            } else
                element.classList.add(className);
        }
    } else
        console.log("Error: element is null");
}

function changeColor(color) {
    const element = getSelectedNode();

    if (element !== null) {
        element.style.cssText += "color: " + color.value + ";";
    } else
        console.log("Error: element is null");
}

function changeSize() {
    const element = getSelectedNode();

    if (element !== null) {
        const size = window.getComputedStyle(element).fontSize;

        if (size == "24px")
            element.style.cssText += "font-size: 16px;";
        else
            element.style.cssText += "font-size: 24px;";
    } else
        console.log("Error: element is null");
}

function printText() {
    var printContents = document.getElementById("n_content").innerHTML;
    var originalContents = document.body.innerHTML;

    document.body.innerHTML = printContents;

    window.print();

    document.body.innerHTML = originalContents;
}
