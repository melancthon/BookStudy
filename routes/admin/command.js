
exports.postCommand = function(req, res, next) {
	var result = null;
	var c = req.app.locals.commands;
	var m = req.app.locals.methods;

	if (req.body.saveHistory === 'true') 
		c.insertCommandHistory({ commandText: req.body.commandText });	
	
	eval('result = '+ req.body.commandText);
	
	res.json(result);
}  

exports.commandHistory = function(req, res) {	
	var m = req.app.locals.methods;
	res.json(m.getCommandHistory());
}
 