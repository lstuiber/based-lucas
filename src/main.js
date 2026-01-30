import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { addHabit } from './habit.js'

document.querySelector('#app').innerHTML = `
  <div>
    <button id="habit">Add Habit</button>
  </div>
`

addHabit(document.querySelector('#habit'))
