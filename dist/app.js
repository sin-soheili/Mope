'use strict';
const dateEl = document.getElementById('nav--date');
const searchInput = document.getElementById('search');

const themeEl = document.getElementById('toogleA');
const body = document.body;

const btnTrash = document.getElementById('trash');
const btnCheckAll = document.getElementById('checkall');
const btnUnCheckAll = document.getElementById('uncheckall');
const btnTheme = document.getElementById('theme');

const checks = document.getElementsByClassName('check')

const form = document.querySelector('#form');
const formTime = document.getElementById('form--time');
const formTitle = document.getElementById('form--title');
const formColorContainer = document.getElementById('color--form');

const list = document.getElementById('list');


class Task {
    id = (Date.now() + '').slice(-10);
    constructor(title, colorDiv, time, coords) {
        this.coords = coords;
        this.time = time;
        this.title = title;
        this.color = colorDiv
        this.checkinput = false;
    }
}

class App {
    date = new Date();
    #currentColor = 'gray';
    #map;
    #mapZoomLevel = 13;
    #mapEvent;
    #tasks = [];

    constructor() {
        // Get user's position
        this._getPosition();

        // Get data from local storage
        this._getLocalStorage();

        this._setDescription()
        

        // Attach event handlers
        formColorContainer.addEventListener('click', this._setColor.bind(this));
        form.addEventListener('submit', this._newTask.bind(this));
        btnTheme.addEventListener('click', this._changeTheme.bind(this));
        list.addEventListener('click',this._moveToPopup.bind(this))
        btnCheckAll.addEventListener('click', this._checkAllTasks);
        btnUnCheckAll.addEventListener('click', this._unCheckAll);
        btnTrash.addEventListener('click', this._deleteCheckedTasks.bind(this));
        window.addEventListener('keydown', this._KeyboardHandler.bind(this));

    }



    _setDescription() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

        dateEl.innerHTML = `${days[this.date.getDay()]} ${this.date.getDate()}, <span class="text-gray-300">${months[this.date.getMonth()]}
         ${this.date.getFullYear()}</span>`;
    }


    _KeyboardHandler(e) {
        if (!form.classList.contains('hidden')) {
            if (e.key === 'Escape') {
                this._hideForm();
            }
        }
    }

    _changeTheme() {
        body.classList.toggle('dark');
        localStorage.theme = body.classList.contains('dark')?'dark':'light';
    }

    _getPosition() {
        if (navigator.geolocation)
            navigator.geolocation.getCurrentPosition(
                this._loadMap.bind(this),
                function () {
                    alert('Could not get your position');
                }
            );
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                'Sin-Soheili',
        }).addTo(this.#map);

        // Handling clicks on map
        this.#map.on('click', this._showForm.bind(this));

        this.#tasks.forEach(ts => {
            this._renderTaskMarker(ts);
          });

          if (localStorage.theme === 'dark') {
            body.classList.add('dark')
          } else {
            body.classList.remove('dark')
          }
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
    }

    _hideForm() {
        // Empty inputs
        formTime.value = formTitle.value = '';
        form.classList.add('hidden');

    }

    _setColor(e) {
        if (!e.target.classList.contains('color-container')) return;

        this.#currentColor = e.target.id;
    }

    _newTask(e) {
        const validInputs = (...inputs) =>
            inputs.every(inp => inp.length > 0);

        //prevent event
        e.preventDefault();

        // get data from form
        const Ntitle = formTitle.value;
        const NTime = formTime.value;
        const Ncolor = this.#currentColor;
        const { lat, lng } = this.#mapEvent.latlng;
        let task;

        //check validaton
        if (!validInputs(NTime, Ntitle)) return alert('Fill out the form!');

        //create new object
        task = new Task(Ntitle, Ncolor, NTime, [lat, lng]);

        //add new object to arrey
        this.#tasks.push(task);

        // Render workout on map as marker
        this._renderTaskMarker(task);

        // Render tasks on list
        this._rendertask(task);

        // Hide form + clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();
    }

    _hideForm() {
        // Empty Input
        formTime.value = formTitle.value = '';

        form.classList.add('hidden');
    }

    _renderTaskMarker(task) {
        L.marker(task.coords, {
            draggable: true
        })
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                })
            )
            .setPopupContent(
                `${task.title} `
            )
            .openPopup();
    }

    _rendertask(task) {
        let html = `
            <li class="item-container" data-id="${task.id}">
                            <div class="order-start space-x-4">
                                <!--check list-->
                                <input type="checkbox" name="check"  
                                class="check cursor-pointer ">
                                <!--profile-->
                                <div class="order-start space-x-2">
                                    <!--Color-->
                                    <div class="color-container bg-${task.color}-500"></div>
                                    <!--Title-->
                                    <p class="font-bold text-gray-700 dark:text-white">${task.title}
                                    </p>
                                </div>
                            </div>
                            <!--Right-->
            <div class="item-title">
                <!--time-->
                <p><span id="task--time">${task.time}</span> ms</p>
            </div>
                        </li >
            `;
        list.insertAdjacentHTML('afterbegin', html);
    }

    _moveToPopup(e) {
        if (!this.#map) return;

        const taskEl = e.target.closest('.item-container');

        if (!taskEl) return;

        const task = this.#tasks.find(
            ts => ts.id === taskEl.dataset.id
        );

        this.#map.setView(task.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
    }

    _setLocalStorage() {
        localStorage.setItem('tasks', JSON.stringify(this.#tasks));
    }

    _getLocalStorage() {

        const data = JSON.parse(localStorage.getItem('tasks'));

        if (!data) return;

        this.#tasks = data;

        this.#tasks.forEach(task => {
            this._rendertask(task);
        });

        
    }

    _checkAllTasks() {
        const allChecks = [...checks];
        allChecks.map(check => check.checked = true)
    }

    _unCheckAll() {
        const allChecks = [...checks];
        allChecks.map(check => check.checked = false)
    }

    _deleteCheckedTasks() {
        const allChecks = [...checks];
        allChecks.map(check => {
            if (check.checked === true) {
                //get real item
                const item = check.parentElement.parentElement;

                //find element in array
                const elemIndex = this.#tasks.findIndex(task => task.id === item.dataset.id);

                //delete item from arrey
                this.#tasks.splice(elemIndex, 1)

            }
        })
        this._setLocalStorage();
        location.reload();
    }

    reset() {
        localStorage.removeItem('tasks');
        location.reload();
    }
}

const app = new App();