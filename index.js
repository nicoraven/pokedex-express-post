const express = require('express');
const jsonfile = require('jsonfile');

const FILE = 'pokedex.json';

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

// tell your app to use the module
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

// Set up method-override for PUT and DELETE forms
const methodOverride = require('method-override')
app.use(methodOverride('_method'));

// this line below, sets a layout look to your express project
const reactEngine = require('express-react-views').createEngine();
app.engine('jsx', reactEngine);

// this tells express where to look for the view files
app.set('views', __dirname + '/views');

// this line sets react to be the default view engine
app.set('view engine', 'jsx');

/**
 * ===================================
 * Routes
 * ===================================
 */

 /*
 * Available routes:
 /pokemon/:id/edit
 /id
 /pokemon/new
 /pokemon
 / -> default/home
 */

// edit the data for a given pokemon
app.get('/pokemon/:id/edit', (request, response) => {
    let pokemonId = parseInt( request.params.id );
    let arrayIndex = (pokemonId - 1);

    jsonfile.readFile(FILE, (err, obj) => {
        const record = obj.pokemon[arrayIndex];
        // console.log(record);

        if (pokemonId === undefined) {
        // send 404 back
        response.status(404);
        response.send("not found");
        } else {
        // render form
        response.render('editpokemon', {action: `/pokemon/${pokemonId}?_method=PUT`, name: record.name, id: record.id, num: record.num, img: record.img, height: record.height, weight: record.weight, candy: record.candy, candy_count: record.candy_count, egg: record.egg, avg_spawns: record.avg_spawns, spawn_time: record.spawn_time});
        }
    });
});

app.put('/pokemon/:id', (request, response) => {
    console.log( "this is request body:",request.body );
    // get the current contents of the file
    jsonfile.readFile(FILE, (err, obj) => {

        // get the location in the array we are requesting
        let pokemonId = parseInt( request.params.id );
        let arrayIndex = (pokemonId - 1);

        // individually edit each value in the object
        obj.pokemon[arrayIndex].name = request.body.name;
        obj.pokemon[arrayIndex].img = request.body.img;
        obj.pokemon[arrayIndex].height = request.body.height;
        obj.pokemon[arrayIndex].weight = request.body.weight;
        obj.pokemon[arrayIndex].candy = request.body.candy;
        obj.pokemon[arrayIndex].candy_count = request.body.candy_count;
        obj.pokemon[arrayIndex].egg = request.body.egg;
        obj.pokemon[arrayIndex].avg_spawns = request.body.avg_spawns;
        obj.pokemon[arrayIndex].spawn_time = request.body.spawn_time;

        // we dont need to reassign this, but lets be explicit about the change
        const changedObj = obj;

        jsonfile.writeFile(FILE, changedObj, (err) => {
            console.error(err)

            response.send(request.body);
        });
    });
});

// get a specified pokemon's details by ID
app.get('/:id', (request, response) => {

  // get json from specified file
  jsonfile.readFile(FILE, (err, obj) => {
    // obj is the object from the pokedex json file
    // extract input data from request
    let inputId = parseInt( request.params.id );
    var pokemon;

    // find pokemon by id from the pokedex json file
    for( let i=0; i<obj.pokemon.length; i++ ){
      let currentPokemon = obj.pokemon[i];
      if( currentPokemon.id === inputId ){
        pokemon = currentPokemon;
      }
    }

    if (pokemon === undefined) {
      // send 404 back
      response.status(404);
      response.send("not found");
    } else {
      response.send(pokemon);
    }
  });
});

// respond with a HTML page with a form that has these fields: id, num, name, img, height, and weight
app.get('/pokemon/new', (request, response) => {
    let  newForm =`<h1>Let's create a new Pokemon!</h1>
                  <form method="POST" action="/pokemon">
                  <h4>Provide your new pokemon's details here:</h4>
                  Name: <input type="text" name="name">
                  Image link: <input type="text" name="img">
                  Height: <input type="text" name="height">
                  Weight: <input type="text" name="weight">
                  <p></p>
                  <input type="submit" value="Submit">
                  </form>`;

    response.send(newForm);
});

// parse the form data and save the new pokemon data into pokedex.json
app.post('/pokemon', function(request, response) {

    // save the request body
    jsonfile.readFile(FILE, (err, obj) => {
        let newPokemon = {};
        var num=0;
        // create new list item
        newPokemon.id = obj.lastKey+1;
        console.log(newPokemon.id);
        if (newPokemon.id < 10){
            num = ('00' + newPokemon.id);
            console.log('pokemon num is ' + num);
        }
        else if (newPokemon.id > 9 && newPokemon.id < 100){
            num = ('0' + newPokemon.id);
            console.log('pokemon num is ' + num);
        }
        else {
            num = newPokemon.id.toString();
            console.log('pokemon num is ' + num);
        }
        newPokemon.num = num;

        newPokemon.name = request.body.name;
        newPokemon.img = request.body.img;
        newPokemon.height = request.body.height;
        newPokemon.weight = request.body.weight;

        obj.pokemon.push(newPokemon);

        // update total number of pokemon
        obj.lastKey = obj.lastKey+1;

        jsonfile.writeFile(FILE, obj, (err) => {
            if (err) { console.log(err) };
        });

        response.send(newPokemon);
    });
});

// default
app.get('/', (request, response) => {

    let pokemonList = [];

    // checks how user wants list of pokemon sorted
    let selectSort = `<form method="get" action="/">
                  Sort pokemon by:
                  <select name="sortby">
                  <option value="name">Name</option>
                  <option value="id">ID</option>
                  </select>
                  <input type="submit" value="Submit">
                  </form>`;
                  // http://expressjs.com/en/api.html#req.query
                  // console.log(request.query.sortby)

    // redirects to /pokemon/new
    let newPokeButton = `<form method="get" action="/pokemon/new">
                  Want to create a custom pokemon?
                  <input type="submit" value="Create new Pokemon">
                  </form>`;

    // redirects to /pokemon/id/edit
    let editPokeButton = `<form method="get" action="/pokemon/:id/edit">
                  Want to edit a pokemon?
                  <input type="text">
                  <input type="submit" value="Edit Pokemon">
                  </form>`;

    // get list of pokemon
    jsonfile.readFile(FILE, (err, obj) => {
        // create new list item for each pokemon
        if (request.query.sortby === "name"){
            for (let pokemon of obj.pokemon){
                pokemonList.push(`<li>${pokemon.name}</li>`);
                // default sort will arrange by UTF-16 code units order
                pokemonList.sort();
            }
        }
        else if (request.query.sortby === "id"){
            for (let pokemon of obj.pokemon){
                pokemonList.push(`<li>${pokemon.id}: ${pokemon.name}</li>`);
                // To compare numbers instead of strings, the compare function can simply subtract b from a. The following function will sort the array ascending (if it doesn't contain Infinity and NaN)
                pokemonList.sort((a, b) => a - b);
            }
        }
        else {
            for (let pokemon of obj.pokemon){
                pokemonList.push(`<li>${pokemon.name}</li>`);
            }
        }
        // removes comma between each list item
        pokemonList = pokemonList.join('');

        let respondMessage = `<h1>Welcome to the online Pokedex!</h1>
        ${newPokeButton}
        ${editPokeButton}
        <br>
        ${selectSort}
        <br>
        <h3>Pokemon List:</h3>
        ${pokemonList}`;

        // console.log(pokemonList);
        response.send(respondMessage);
    });
});

/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
app.listen(3000, () => console.log('~~~ Tuning in to the waves of port 3000 ~~~'));