/***********************
 
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pug          - A view engine for dynamically rendering HTML pages
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database

***********************/

const express = require('express'); // Add the express framework has been added
let app = express();

const bodyParser = require('body-parser'); // Add the body-parser tool has been added
app.use(bodyParser.json());              // Add support for JSON encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Add support for URL encoded bodies

const pug = require('pug'); // Add the 'pug' view engine

//Create Database Connection
const pgp = require('pg-promise')();


/**********************
  
  Database Connection information

  host: This defines the ip address of the server hosting our database.  We'll be using localhost and run our database on our local machine (i.e. can't be access via the Internet)
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab, we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database.  You'll need to set a password USING THE PSQL TERMINAL THIS IS NOT A PASSWORD FOR POSTGRES USER ACCOUNT IN LINUX!

**********************/
// REMEMBER to chage the password

const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: 'football_db',
	user: 'sean',
	password: 'football'
};

let db = pgp(dbConfig);

// set the view engine to ejs
app.set('view engine', 'pug');
app.use(express.static(__dirname + '/')); // This line is necessary for us to use relative paths and access our resources directory


// login page 
app.get('/login', function(req, res) {
	res.render('pages/login',{
		local_css:"signin.css", 
		my_title:"Login Page"
	});
});

// registration page 
app.get('/register', function(req, res) {
	res.render('pages/register',{
		my_title:"Registration Page"
	});
});

//home page
app.get('/home', function(req, res) {
  var query = 'select * from favorite_colors;';
  db.any(query)
        .then(function (rows) {
            res.render('pages/home',{
        my_title: "Home Page",
        data: rows,
        color: '',
        color_msg: ''
      })

        })
        .catch(function (err) {
            // display error message in case an error
            console.log('error', err); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
        })
});

/*Add your other get/post request handlers below here: */
app.get('/home/pick_color', function(req, res) {
  var color_choice = req.query.color_selection;
  var color_options =  'select * from favorite_colors;';
  var color_message = "select color_msg from favorite_colors where hex_value = '" + color_choice + "';";
  db.task('get-everything', task => {
        return task.batch([
            task.any(color_options),
            task.any(color_message)
        ]);
    })
    .then(info => {
      res.render('pages/home',{
        my_title: "Home Page",
        data: info[0],
        color: color_choice,
        color_msg: info[1][0].color_msg
      })
    })
    .catch(error => {
        // display error message in case an error
            console.log('error', error);//if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    })
});

app.post('/home/pick_color', function(req, res) {
  var color_hex = req.body.color_hex;
  var color_name = req.body.color_name;
  var color_message = req.body.color_message;
  var insert_statement = "INSERT INTO favorite_colors(hex_value, name, color_msg) VALUES('" + color_hex + "','" +
              color_name + "','" + color_message +"') ON CONFLICT DO NOTHING;";
  var color_select = 'select * from favorite_colors;';
  db.task('get-everything', task => {
        return task.batch([
            task.any(insert_statement),
            task.any(color_select)
        ]);
    })
    .then(info => {
      res.render('pages/home',{
        my_title: "Home Page",
        data: info[1],
        color: color_hex,
        color_msg: color_message
      })
    })
    .catch(error => {
        // display error message in case an error
            console.log('error', error); //if this doesn't work for you replace with console.log
            res.render('pages/home', {
                title: 'Home Page',
                data: '',
                color: '',
                color_msg: ''
            })
    });
});
//team_stats
app.get('/team_stats', function(req, res) {
  var query1 = 'select * from football_games;';
  var query2 = 'select count(*) from football_games where home_score > visitor_score;';
  var query3 = 'select count(*) from football_games where home_score < visitor_score;';
  db.task('get-everything', task => {
      return task.batch([
          task.any(query1),
          task.any(query2),
          task.any(query3)
      ]);
  })
  .then(data => {
    // console.log(data[1][0]['count']);
    // console.log(data[2][0]['count']);
    res.render('pages/team_stats',{
        my_title: "Game Stats!!!",
        games: data[0],
        games_won: data[1][0]['count'],
        games_lost: data[2][0]['count']
      })
  })
  .catch(error => {
      // display error message in case an error
          console.log('error', err);
          res.render('pages/page_name',{
        my_title: "ERROR",
        games: '',
        games_won: '',
        games_lost: ''
      })
  });
});

//player info
app.get('/player_info', function(req, res) {
  var query = 'SELECT * FROM football_players;';
  db.any(query)
    .then(function (rows) {
      res.render('pages/player_info',{
        my_title: "Pick A Player",
        player_data: rows,  
      })
    })
    .catch(function (err) {
        // display error message in case an error
        request.flash('error', err);
        res.render('pages/page_name',{
      my_title: "Pick Error",
      player_data: '',
    })
  })
});

// player page
app.get('/player_info/post', function(req, res) {
  // var id = req.body.name;
  // console.log("post query");
  var player_choice = req.query.player_choice;
  console.log(player_choice);
  var query1 = 'SELECT * FROM football_players;';
  var query2 = "select count(*) from football_games join football_players on football_players.id = any(players) where football_players.name = '"+player_choice+"';";
  db.task('get-everything', task => {
    return task.batch([
      task.any(query1),
      task.any(query2),
    ]);
  })
  .then(data => {
      // console.log("post api results");
      console.log(data[1])
    res.render('pages/player_info',{
      my_title: "Player's Page",
      player_year: data[0][1]['year'],
      player_major: data[0][1]['major'],
      games_played: data[1][0]['count'],
      pass_yrd: data[0][1]['passing_yards'],
      avg_pass: data[0][1]['passing_yards']/data[1][0]['count'],
      rush_yrd: data[0][1]['rushing_yards'],
      avg_rush: data[0][1]['rushing_yards']/data[1][0]['count'],
      rec_yrd: data[0][1]['receiving_yards'],
      avg_rec: data[0][1]['receiving_yards']/data[1][0]['count']
    })
  })
    .catch(error => {
        // display error message in case an error
      console.log(error);
      res.render('pages/player_info',{
        player_info: "PP Error",
        data: '',
      })
    });
  });
/*********************************
 
  		/home - get request (no parameters) 
  				This route will make a single query to the favorite_colors table to retrieve all of the rows of colors
  				This data will be passed to the home view (pages/home)

  		/home/pick_color - post request (color_message)
  				This route will be used for reading in a post request from the user which provides the color message for the default color.
  				We'll be "hard-coding" this to only work with the Default Color Button, which will pass in a color of #FFFFFF (white).
  				The parameter, color_message, will tell us what message to display for our default color selection.
  				This route will then render the home page's view (pages/home)

  		/home/pick_color - get request (color)
  				This route will read in a get request which provides the color (in hex) that the user has selected from the home page.
  				Next, it will need to handle multiple postgres queries which will:
  					1. Retrieve all of the color options from the favorite_colors table (same as /home)
  					2. Retrieve the specific color message for the chosen color
  				The results for these combined queries will then be passed to the home view (pages/home)

  		/team_stats - get request (no parameters)
  			This route will require no parameters.  It will require 3 postgres queries which will:
  				1. Retrieve all of the football games in the Fall 2018 Season
  				2. Count the number of winning games in the Fall 2018 Season
  				3. Count the number of lossing games in the Fall 2018 Season
  			The three query results will then be passed onto the team_stats view (pages/team_stats).
  			The team_stats view will display all fo the football games for the season, show who won each game, 
  			and show the total number of wins/losses for the season.

  		/player_info - get request (no parameters)
  			This route will handle a single query to the football_players table which will retrieve the id & name for all of the football players.
			  Next it will pass this result to the player_info view (pages/player_info), which will use the ids & names to populate the select tag for a form
			  
************************************/


app.listen(3000);
console.log('3000 is the magic port');
