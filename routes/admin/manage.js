exports.users = function(req,res)
{    
	var m = req.app.locals.methods;
	m.query(req,
        function() {
			return { users: m.getUsers(), tabs: m.getTabs(req), selectedTab: 'users' };
		},
		function(data) {
			res.send(m.getWidgetHtml('users', data, 1));
		}
    );
};

exports.addUser = function(req,res)
{    
	var m = req.app.locals.methods;
    var c = req.app.locals.commands;
    c.addUser({user: req.body.user}, function(data) { 
        added = data;
        m.query(req,
            function() {
    			return { users: m.getUsers() };
    		},
    		function(data) {
                data.added = added;
    			res.json(data);
    		}
        );
    });  
};