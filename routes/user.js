
exports.index = function(req, res){	
	res.send("respond with a resource");
};

exports.one = function(req, res) {	
	console.log('user one');
	res.render('one', req.app.locals({ userID: req.params.id }));
}