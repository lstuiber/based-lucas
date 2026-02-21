import { addHabits } from './update-habit'
import { removeHabits} from './update-habit'

export function addHabit(element) {
    

    element.addEventListener('click', () => {
        addElement();
    })
}

function addElement(){
    let apendEl = "add-form"
    const addList =document.getElementsByClassName("inputLabel").length;
    // check if a form is already created
    if (document.getElementsByClassName("add-button").length < 1){
            const createForm = document.createElement("form");
        createForm.id = "add-form";
        document.getElementById("app").appendChild(createForm);
    }

    addFormInputs(addList, apendEl);

    addButton()



}

function addFormInputs(addList, apendEl) {
    const newDiv = document.createElement('div');
    newDiv.className = "inputs";
    newDiv.id =`input${addList}`;
    const newLabel = document.createElement('input');
    newLabel.className="inputLabel";
    newLabel.id = `inputs${addList}`
    newLabel.setAttribute("type", "input");

    const removeButton = document.createElement('button');
    removeButton.textContent = "Remove";
    removeButton.className="remove-button";
    removeButton.id = "remove-habit";
    removeButton.type= "button";
    document.getElementById("add-form").appendChild(removeButton);


    document.getElementById(apendEl).appendChild(newDiv);
    document.getElementById(`input${addList}`).appendChild(newLabel);
    document.getElementById(`input${addList}`).appendChild(removeButton);

    removeHabits(document.querySelector('#remove-habit'));
}

function addButton() {
    // logic to move button to the bottom of the list
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