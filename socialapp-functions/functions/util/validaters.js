const isEmail = (email) => {
	var regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	if(email.match(regEx))
		return true;
	else
		return false;
}

const isEmpty = (string) => { 
	if(string.trim() === '')
		return true;
	else
		return false;
}

exports.validateUserData = (data) => {
	let userData = {};
	
	if(data.bio.trim() !== '')
		userData.bio = data.bio.trim();
	if(data.location.trim() !== '')
		userData.location = data.location.trim();
	if(data.website.trim() !== '')
	{
		if(data.website.trim().substring(0, 4) === 'http')
			userData.website = data.website.trim();
		else
			userData.website = `http://${data.website.trim()}`;
	}
	return  userData;
	
}

exports.validateSignUpData = (data) => {
	let errors = {};
	if(isEmpty(data.email))
		errors.email = "Must not be empty";
	else if (!isEmail(data.email))
		errors.email = "Must be a valid email address";	
	if(isEmpty(data.handle))
		errors.handle = "Must not be empty";
	if(isEmpty(data.password))
		errors.password = "Must not be empty";
	if (data.password !== data.confirmedPassword)
		errors.password = "Must be identical";	
	return {
		errors,
		valid: Object.keys(errors).length === 0 ? true : false
		};
};

exports.validateSignInData = (data) => {
	let errors = {};
	if(isEmpty(data.email))
		errors.email = "Must not be empty";
	if(isEmpty(data.password))
		errors.password = "Must not be empty";

	return ({
		errors,
		valid: Object.keys(errors).length === 0 ? true : false
	});
}
