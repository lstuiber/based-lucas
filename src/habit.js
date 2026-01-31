
export function addHabit(element) {
    

    element.addEventListener('click', () => {
        addElement();
    })
}

function addElement(){
    let firstEl = true;
    let apendEl = "add-form"
    const addList =document.getElementsByClassName("inputLabel").length;
    console.log(addList)
    if (document.getElementsByClassName("add-button").length < 1){
            const createForm = document.createElement("form");
        createForm.id = "add-form";
        document.getElementById("app").appendChild(createForm);
    }

    if (document.getElementsByClassName("inputLabel").length > 0) {
        console.log("test")
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



    // const currentElement = document.getElementById("app");
    console.log(apendEl);
    console.log(document.getElementById(apendEl));
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
        document.getElementById("add-form").appendChild(addButton);





}