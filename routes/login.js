function Index(req, res) {
	var m = req.app.locals.methods;
	var email = '';
	if (typeof(req.body.email) != 'undefined')
		email = req.body.email;
	res.send(m.getWidgetHtml('login', { email: email }, 1));
}

exports.index = function(req, res){	
	Index(req, res);
}; 

exports.login = function(req, res){	
	var m = req.app.locals.methods;
	if (m.login(req.body)) {
		req.session['email'] = req.body.email;
		res.redirect('/book/list');
	}
	else {
		Index(req, res);
	}
}; 

exports.logout = function(req, res) {
	req.session = null;
	res.redirect('/login');
};