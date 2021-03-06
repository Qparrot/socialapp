const { db, admin } = require('../util/admin.js');
const config = require('../util/config.js');
const { validateSignUpData, validateSignInData, validateUserData } = require('../util/validaters.js');
const firebase = require('firebase');
firebase.initializeApp(config);

exports.signIn = (req, res) => {
	console.log('here');
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
			console.log('I am here');
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

	const noImg = 'no-img.jpeg';

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
				imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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

exports.addUserData = (req, res) => {
	let userData = validateUserData(req.body);

		db.doc(`/users/${req.user.handle}`).update(userData)
		.then( () => {
			return res.status(200).json("New data added");
		})
		.catch((err) => {
			console.error(err)
			return res.status(400).json({error: err.code});
		});
	};
exports.getAuthentificatedUser = (req,res) => {
	let userData = {};
	db.doc(`/users/${req.user.handle}`).get()
		.then(doc => {
			if(doc.exists) {
				userData.credentials = doc.data();
				return db.collection('likes').where('userHandle', '==', req.user.handle).get()
			}
		})
		.then(data => {
			userData.likes = [];
			data.forEach(doc => {
				userData.likes.push(doc.data());
			});
			return res.json(userData);
		})
		.catch(err => {
			console.error(err);
			res.status(500).json({error: err.code});
		});
};

exports.uploadImage = (req, res) => {
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');

	const busboy = new BusBoy({ headers: req.headers});
 
	let imageFileName;
	let imageToBeUploaded = {};
	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if(mimetype !== 'image/jpeg' && mimetype !== 'image/png')
		{
			return res.status(400).json("Wrong file type");
		}
		console.log(fieldname);
		console.log(filename);
		console.log(mimetype);
		const imageEx = filename.split('.')[filename.split('.').length - 1];
		imageFileName = `${Math.round(Math.random()*1000000)}.${imageEx}`;
		const filepath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filepath, mimetype };
		file.pipe(fs.createWriteStream(filepath));
	}); 
	busboy.on('finish', () => {
		admin.storage().bucket().upload(imageToBeUploaded.filepath, {
		resumable: false,
			metadata: {
				metadata: {
			contentType: imageToBeUploaded.mimetype
				}
			}
		})
	 	.then(() => {
			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
			return db.doc(`/users/${req.user.handle}`).update({imageUrl: imageUrl});
		})
		.then(() => {
			res.json({message: 'Image uploaded successfully'});
		})
		.catch(err => {
			console.error(err);
			return res.status(500).json({ error: err.code});
		});
	});
	busboy.end(req.rawBody);
};

