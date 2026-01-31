import { addHabits } from './update-habit'


export function addHabit(element) {
    

    element.addEventListener('click', () => {
        addElement();
    })
}

function addElement(){
    let firstEl = true;
    let apendEl = "add-form"
    const addList =document.getElementsByClassName("inputLabel").length;
    if (document.getElementsByClassName("add-button").length < 1){
            const createForm = document.createElement("form");
        createForm.id = "add-form";
        document.getElementById("app").appendChild(createForm);
    }

    if (document.getElementsByClassName("inputLabel").length > 0) {
        firstEl = false;
    }
    const newDiv = document.createElement('div');
    newDiv.className = "inputs";
    newDiv.id =`input${addList}`;
    const newLabel = document.createElement('input');
    newLabel.className="inputLabel";
    newLabel.id = `inputs${addList}`
    const newInputLabel = newLabel.setAttribute("type", "input");

    const newInput = document.createElement('input');
    newInput.className="habitInput";
    newInput.id=`checkbox${addList}`;
    newInput.setAttribute("type", "checkbox");


    document.getElementById(apendEl).appendChild(newDiv);
    document.getElementById(`input${addList}`).appendChild(newLabel);
    document.getElementById(`input${addList}`).appendChild(newInput);
        if (document.getElementsByClassName("add-button").length){
            document.getElementById("add-habit").remove();
    }
    const addButton = document.createElement("button");
        addButton.textContent = "Add";
        addButton.className="add-button";
        addButton.id = "add-habit"
        addButton.type= "button"
        document.getElementById("add-form").appendChild(addButton);
        addHabits(document.querySelector('#add-habit'));




}