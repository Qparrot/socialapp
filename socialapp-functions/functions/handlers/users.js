const { db } = require('../util/admin.js');
const config = require('../util/config.js');
const { validateSignUpData, validateSignInData } = require('../util/validaters.js');
const firebase = require('firebase');
firebase.initializeApp(config);

exports.signIn = (req, res) => {
	const credentials = {
		email: req.body.email,
		password: req.body.password
	}
	const { valid, errors } = validateSignInData(credentials);
	if(!valid)
		return res.status(400).json(errors);

	firebase.auth().signInWithEmailAndPassword(credentials.email, credentials.password)
		.then(data => {
			return data.user.getIdToken();
		})
		.then(token => {
			return res.json({token});
		})
		.catch (err => {
			console.error(err);
			if(err.code === 'auth/wrong-password')
				return res.status(403).json({general: 'Wrong credentials, please try again' });
			else
				return res.status(500).json({error: err.code});
		});
};

exports.signUp = (req, res) => {
	let userToken;
	let userId; 
	const newUser = {
		email: req.body.email,
		password: req.body.password,
		confirmedPassword: req.body.confirmedPassword,
		handle: req.body.handle
	};
	const { valid, errors } = validateSignUpData(newUser);
	if (!valid)
		return res.status(400).json(errors);

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
				userId: userId,
				createdAt: new Date().toISOString()
			};
			return db.doc(`/users/${newUser.handle}`).set(userCredentials);
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
};
