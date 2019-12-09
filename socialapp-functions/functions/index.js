const functions = require('firebase-functions');
const admin = require('firebase-admin');
const config = {
    apiKey: "AIzaSyD2H8Kj7tohl4pVho2qE2TPmHpcNsg8BKM",
    authDomain: "socialapp-4f873.firebaseapp.com",
    databaseURL: "https://socialapp-4f873.firebaseio.com",
    projectId: "socialapp-4f873",
    storageBucket: "socialapp-4f873.appspot.com",
    messagingSenderId: "710841974100",
    appId: "1:710841974100:web:84c4cd61b9cde54d621cc1",
    measurementId: "G-ZXCGQJ0GJZ"
  };

admin.initializeApp();

const app = require('express')();

const db = admin.firestore();
 
const firebase = require('firebase');
firebase.initializeApp(config);
app.get('/screams', (req, res) => {
	db.collection('screams').orderBy('createdAt', 'desc').get()
		.then(data => {
			let arr = [];
			data.forEach(doc =>
			{
				arr.push({
					screamId:doc.id,
					body: doc.data().body,
					userHandle: doc.data().userHandle,
					createdAt: doc.data().createdAt
				})
			});
			return res.json(arr);
		})
		.catch(err => console.error(err));
});

app.post('/scream', (req, res) => {

	const newScream = {
		body: req.body.body,
		userHandle: req.body.userHandle,
		createdAt: new Date().toISOString()
	};

	db.collection('screams').add(newScream)
		.then(doc => {
			res.json({ message: `document ${doc.id} created successfully`});
		})
		.catch(err => {
			res.status(500).json({ error: 'something went wrong' });
			console.error(err);
		});
});

app.post('/authentification', (req, res) => {
	let userToken;
	let userId; 
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmedPassword: req.body.confirmedPassword,
		handle: req.body.handle
	};

	db.doc(`/users/${newUser.handle}`).get()
		.then(doc => {
			if(doc.exists)
			{
				return res.status(400).json({message: `The username ${newUser.handle} is already taken`});
			}
			else
			{
				return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);	
			}
		})
		.then(data => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then(token => {
			userToken = token;
			const userCredentials = {
				handle: newUser.handle,
				email: newUser.email,
				userId: userId
			};
			return db.doc(`/users/$(newUser.handle}`).set(userCredentials);
		})
			.then(() => {
				return res.status(201).json({ userToken });
			})
		.catch(err => {
			if (err.code === "auth/email-already-in-use")
			{
				return res.status(400).json({message: "The email is already used" });
			}
			else
			{
				console.error(err);
				return res.status(500).json({error: err.code});
			}
		})
});

	exports.api = functions.region('europe-west1').https.onRequest(app);
