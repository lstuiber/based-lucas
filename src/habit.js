
export function addHabit(element) {
    

    element.addEventListener('click', () => {
        addElement();
    })
}

function addElement(){
    const newLabel = document.createElement('input');
    const newInputLabel = newLabel.setAttribute("type", "input");

    const newInput = document.createElement('input');
    const newContent = newInput.setAttribute("type", "checkbox");

    const currentElement = document.getElementById("app");
    document.body.insertBefore(newLabel, currentElement);
    document.body.insertBefore(newInput, currentElement);

}