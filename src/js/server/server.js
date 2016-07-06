import express from 'express';
import bodyParser from 'body-parser'
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import gcal from 'google-calendar';
import util from 'util';
import config from './config';

const GoogleStrategy = require( 'passport-google-oauth20' ).Strategy;

import google from 'googleapis';
const calendar = google.calendar('v3');

let OAuth2 = google.auth.OAuth2;
let oauth2Client = new OAuth2( config.consumer_key, config.consumer_secret, '/auth/google/callback' );
google.options( {
	auth: oauth2Client
} ); // set auth as a global default

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
app.use(session({
	secret: config.session_secret,
	resave: true,
	saveUninitialized: true
}));

//Passport
passport.serializeUser(function (user, cb) {
	cb(null, user);
});
passport.deserializeUser(function (obj, cb) {
	cb(null, obj);
});
app.use(passport.initialize());
app.use(passport.session());
let google_calendar = new gcal.GoogleCalendar();
passport.use(new GoogleStrategy({
		clientID: config.consumer_key,
		clientSecret: config.consumer_secret,
		callbackURL: "http://localhost:9000/auth/google/callback",
		scope: ['openid', 'email', 'https://www.googleapis.com/auth/calendar']
	},
	(accessToken, refreshToken, profile, done) => {

		console.log("Auth Success. Celebration is in order.");

    console.log("Access Token: ", accessToken);

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken
    });

		return done(null, profile);
	}
));

//Auth Routing
app.get('/auth/google',
	passport.authenticate('google'));

app.get('/auth/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/'
	}),
	(req, res) => {
		// Successful authentication, redirect home.
		res.redirect('/');
	});

app.get('/event', (req, res) => {
	let event = {
		'summary': 'Donovan sux cox',
		'location': '560 S 100 W St, Provo, UT 84601',
		'description': 'I made an event baby.',
		'start': {
			'dateTime': '2016-07-07T14:00:00-07:00',
			'timeZone': 'America/Los_Angeles',
		},
		'end': {
			'dateTime': '2016-07-07T17:00:00-07:00',
			'timeZone': 'America/Los_Angeles',
		},
		'recurrence': [
    'RRULE:FREQ=WEEKLY;COUNT=1'
  ],
		'attendees': [
			{
				'email': 'donovan.hiland@gmail.com'
			},
			{
				'email': 'sebmernst@gmail.com'
			},
  ],
		'reminders': {
			'useDefault': false,
			'overrides': [
				{
					'method': 'email',
					'minutes': 24 * 60
				},
				{
					'method': 'popup',
					'minutes': 10
				},
    ],
		},
	};

	calendar.events.insert({
    auth: oauth2Client,
		calendarId: 'fcsdvkpqktb7qieirpun9glnvo@group.calendar.google.com',
		resource: event,
    sendNotifications: true
	}, function (err, event) {
		if (err) {
			console.log('There was an error contacting the Calendar service: ' + err);
			return;
		}
		console.log('Event created: %s', event.htmlLink);
    res.redirect('/');
	});
});

app.get('/calendar', (req, res) => {
	let newCalendar = {
    summary: 'DevMountain Cohort Schedule 3'
	};

	calendar.calendars.insert({
    auth: oauth2Client,
		resource: newCalendar,
	}, function (err, newCalendar) {
		if (err) {
			console.log('There was an error contacting the Calendar service: ' + err);
			return;
		}
		console.log('Calendar created: %s', util.inspect(newCalendar));
	});
});

//Listen
app.listen(port, () => {
	console.log('Listening on port ', port);
})
