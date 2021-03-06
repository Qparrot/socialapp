const functions = require('firebase-functions');
const app = require('express')();
const { getScream, getAllScreams, addScream } = require('./handlers/screams.js');
const { signIn, signUp, uploadImage, addUserData, getAuthentificatedUser } = require('./handlers/users.js');
const FBAuth = require('./util/FBAuth.js');

// Screams routes
app.get('/screams', getAllScreams);
app.post('/scream', FBAuth, addScream); 
app.get('/screamId/:screamId', getScream);

// Users routes
app.post('/authentication', signUp);
app.post('/login', signIn); 	
app.post('/userdata', FBAuth, addUserData);
app.get('/user/getuserdata', FBAuth, getAuthentificatedUser);


// Photo  routes
app.post('/user/image', FBAuth, uploadImage);

exports.api = functions.region('europe-west1').https.onRequest(app);
