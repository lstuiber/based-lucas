
export function addHabits(element) {
    element.addEventListener('click', (event) => {
        // event.preventDefault();
        updateHabits();
    })

}


function updateHabits(){
    const inputs = document.getElementById("add-form").elements;
    console.log(inputs[0].value)
}