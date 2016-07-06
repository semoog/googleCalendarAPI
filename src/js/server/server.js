import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import gcal from 'google-calendar';
import config from './config';

const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
//App Init
const app = express();
const port = 9000;

//Middleware
app.use(bodyParser.json());
var corsOptions = {
	origin: 'http://localhost:9000'
}
app.use(cors(corsOptions));
app.use(express.static(__dirname + '/../../../build')); //serve all of our static front-end files from our server.
app.use(session({ secret: config.session_secret, resave: true, saveUninitialized: true }));

//Passport
passport.serializeUser(function(user, cb) {
  cb(null, user);
});
passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());
passport.use(new GoogleStrategy({
		clientID: config.consumer_key,
		clientSecret: config.consumer_secret,
		callbackURL: "http://localhost:9000/auth/google/callback",
		scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar']
	},
	(accessToken, refreshToken, profile, done) => {

    console.log("Auth Success. Celebration is in order.");

		const google_calendar = new gcal.GoogleCalendar(accessToken);

		return done(null, profile);
	}
));

//Auth Routing
app.get('/auth/google',
	passport.authenticate('google', {
		scope: ['profile']
	}));

app.get('/auth/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/'
	}),
	function (req, res) {
		// Successful authentication, redirect home.
		res.redirect('/');
	});

//Listen
app.listen(port, function () {
	console.log('Listening on port ', port);
})
