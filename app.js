// dependencies
var express = require('express')
  , routes = require('./routes')
  , login = require('./routes/login')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , command = require('./routes/admin/command')
  , util = require('./model/util')
  , fs = require('fs')
  , spawn = require('child_process').spawn
  , events = require('events')
  , uuid = require('node-uuid')
  , data = buckets.buckets;  

var app = express();

app.locals.db = 
{ 
	title: 'Book Study', 
	users: { 
		'melancthon@gmail.com': { password: 'test', rights: { fullControl: {} } }
	},
	books: {nextID: 1, books: {}},
	discussions: {nextID: 1, discussions: {}},
	commandHistory: [],
	maxCommandHistory: 50
};

app.locals.widgets = {};
app.locals.lastDBIndex = -1;
app.locals.queryLock = 0;
app.locals.commandLock = false;
app.locals.queryLockEmitter = new events.EventEmitter();
app.locals.commandLockEmitter = new events.EventEmitter();
app.locals.newCommands = [];
app.locals.indexes = {};
	
// logged interface commands
app.locals.commands = { 
	execCommand: 
		function(params) {

		},
	insertCommandHistory:	
		function(params) {	
			var db = app.locals.db;
			db.commandHistory.push(params.commandText);
			if (db.commandHistory.length > db.maxCommandHistory) {
				db.commandHistory.remove(0);
			}
		},
	addDiscussion: 
		function(params) {
			var m = app.locals.methods;
			var db = app.locals.db;
			var indexes	= app.locals.indexes;
			params.discussion.id = db.discussions.nextID++;
			params.discussion.createDate = params.createDate;
			params.discussion.editDate = params.discussion.createDate;
			var idS = params.discussion.id+'';
			db.discussions.discussions[idS] = params.discussion;
			
			if (typeof(params.bookID) !== 'undefined') {
				var book = db.books.books[params.bookID];
				if (typeof(book.discussions) === 'undefined')
					book.discussions = {};
				book.discussions[idS] = db.discussions.discussions[idS];
				m.addBookDiscussionIndex({book: book, discussion: db.discussions.discussions[idS]});
			}

			return db.discussions.discussions[idS];
		},
	addBook:
		function(params) {	
			var db = app.locals.db;
			var m = app.locals.methods;
			params.book.id = db.books.nextID++;
			db.books.books[params.book.id+''] = params.book;	
			m.createBookIndexes({book: db.books.books[params.book.id+'']});

			return db.books.books[params.book.id+''];
		},
	easyLog: 
		function() {
			console.log('easy');
		},
	hardLog:
		function() {
			console.log('hard start');
			for (i = 0; i < 100000000; ++i)
				if (i % 10000000 == 0)
					console.log('hard '+ i);
				else
					i += 0;
			console.log('hard end');
		}
};	

// app command logging method
app.locals.logCommand =
	function(name, args) {
		var fullCommand = 'c.' + name + '(';
		var firstArg = true;
		var argsLen = 1;
		for (var a=0; a<argsLen; ++a) {
			if (typeof(args[a]) !== 'undefined') {
				if (firstArg)
					firstArg = false;
				else
					fullCommand += ',';
				fullCommand += JSON.stringify(args[a]);
			}
		}
		fullCommand += ');\n';
		fs.appendFile('db/db'+app.locals.lastDBIndex+'.log', fullCommand, 'utf-8');
	}; 
	
// non-logged methods
app.locals.methods = {
	getBook: function(params) {
		var m = app.locals.methods;
		var db = app.locals.db;
		var book = m.shallow(db.books.books[params.id]);
		return book;
	},

	getBooks: function(params) {		
		var m = app.locals.methods;
		var db = app.locals.db;
		var books = {};
		for(var b in db.books.books) {
			books[b] = m.shallow(db.books.books[b]);
		}
		return books;
	},

	getBookDiscussions: function(params) {
		var m = app.locals.methods;
		var db = app.locals.db
		var i = app.locals.indexes;
		var book = db.books.books[params.id];
		var discussions = [];
		if (book) {
			var num = 0;
			if (!params.beforeDiscussionID && !params.afterDiscussionID) {
				i.discussionsByLastEditDate[book.id].forEach(
					function(elem){
						++num;
						if (num > 5)
							return false;
						discussions.push(m.shallow(elem));
					});
			}
		}
		return discussions;
	},

	shallow: function(obj) {
		var copy = {};
		for(var prop in obj) {
			var propVal = obj[prop];
			var propValType = typeof(propVal);
			if (propValType !== 'object' && propValType !== 'function')
				copy[prop] = propVal;
		}

		return copy;
	},

	index: function(params) {
		var m = app.locals.methods;
		var db = app.locals.db;
		var indexes	= app.locals.indexes;

		console.log('index stuff');

		for(var i in db.books.books)
		{
			var book = db.books.books[i];
			m.createBookIndexes({book: book});
			for(var j in book.discussions) {
				var discussion = book.discussions[j];
				m.addBookDiscussionIndex({book: book, discussion: discussion});
			}
		}
	},

	addBookDiscussionIndex: function(params) {		
		var i = app.locals.indexes;
		i.discussionsByLastEditDate[params.book.id].add(params.discussion);
	},

	createBookIndexes: function(params) {
		var m = app.locals.methods;
		var i = app.locals.indexes;
		if (!i.discussionsByLastEditDate)
			i.discussionsByLastEditDate = {};
		i.discussionsByLastEditDate[params.book.id] = new data.BSTree(function(a,b){
			return m.compareDescending(a,b,['editDate', 'id'])
		});
	},

	compare: function(a, b, compareFields) {
		for(var p in compareFields) {
			var compareField = compareFields[p];
			if (a[compareField] < b[compareField])
				return -1;
			else if (a[compareField] > b[compareField])
				return 1;	
		}
		
		return 0;
	},

	compareDescending: function(a, b, compareFields) {
		for(var p in compareFields) {
			var compareField = compareFields[p];
			if (a[compareField] > b[compareField])
				return -1;
			else if (a[compareField] < b[compareField])
				return 1;	
		}
		
		return 0;
	},

	log: util.log,
	easyLog: 
		function(i) {
			console.log('easy '+i);
		},
	query: function(req, queryMethod, callback) {	
		var db = app.locals.db;
		var l = app.locals;
		var m = app.locals.methods;
		var getData = function() {
			m.lock({lockType: 'queryLock'});
			req.lockType = 'queryLock';
			var data = null;
			try {
				data = queryMethod();
			}
			catch(err) {
				console.log(err);
				data = null;
			}

			m.unlock({lockType: 'queryLock'});
			if (typeof(callback) !== 'undefined')
				callback(data);	

		}
		if(l.commandLock) {
			l.commandLockEmitter.once('unlock', function() {	
				getData();
			});
		}		
		else
			getData();
	},
	pushCommands: function() {	
		var db = app.locals.db;
		var l = app.locals;
		var m = app.locals.methods;							
		var c = app.locals.commands;							
		var doCommands = function() {
			m.lock({lockType: 'commandLock'});
			try {			
				while(l.newCommands.length > 0) {
					var args = l.newCommands[0].args;
					var data = l.newCommands[0].command.apply(this, args);
					if (args.length > 1 && typeof(args[1]) === 'function')
						args[1](data);
					l.newCommands.splice(0, 1);
				}	
				l.newCommands = [];
			}
			catch (err) {				
				l.newCommands = [];
			}
			m.unlock({lockType: 'commandLock'});			
		}
		if (l.queryLock > 0) {
			l.queryLockEmitter.once('unlock', function() {	
				doCommands();
			});
		}
		else if (l.commandLock) {
			l.commandLockEmitter.once('unlock', function() {	
				doCommands();
			});
		}
		else {
			doCommands();
		}
	},	
	unlock: function(params) {
		var l = app.locals;
		if (params.lockType == 'queryLock') {
			--l.queryLock;
			if (l.queryLock <= 0)
			{
				l.queryLock = 0;
				l.queryLockEmitter.emit('unlock');
			}
		}
		else if (params.lockType == 'commandLock') {
			l.commandLock = false;
			l.commandLockEmitter.emit('unlock');
		}
		return { queryLock: l.queryLock, commandLock: l.commandLock };
	},
	lock: function(params) {
		var l = app.locals;		
		if (params.lockType == 'queryLock') {
			++l.queryLock;
			if (l.queryLock <= 0)
				l.queryLock = 1;
		}
		else if (params.lockType == 'commandLock')		
			l.commandLock = true;
		return { queryLock: l.queryLock, commandLock: l.commandLock };
	},
	getLocks: function() {	
		var l = app.locals;			
		return { queryLock: l.queryLock, commandLock: l.commandLock };
	},
	getWidget: function(view) {
		if (typeof(app.locals.widgets[view]) == 'undefined') {
			app.locals.widgets[view] = util.parseWidget(fs.readFileSync('views/' + view + '.jw', 'utf-8'));
			return app.locals.widgets[view];
		}
		return app.locals.widgets[view];
	},
	getWidgetHtml: function(view, model, widgetID) {
		return util.getWidgetHtml(view, model, widgetID, false, true, app.locals.methods.getWidget);
	},
	getCommandHistory:
		function(params) {
			var db = app.locals.db;
			return db.commandHistory;
		},
	lastDBLogIndex:
		function(params) {
			var dbLogIndex = -1;
			var dbFiles = fs.readdirSync('db');
			for(var f=0; f < dbFiles.length; ++f) {	
				var dbFile = dbFiles[f];
				var ext = util.getFileExtension(dbFile);
				if (ext == 'js') 
					dbLogIndex++;
			}
			return dbLogIndex;
		},
	restoreDB:
		function(params, callback) {
			console.log("restoring db");
			
			var oldLoggingMethod = app.locals.logCommand;
			app.locals.logCommand = function() { };
		
			var m = app.locals.methods;
			if (typeof(params) == 'undefined')
				params = {};
			if (typeof(params.logIndex) == 'undefined') {
				params.logIndex = m.lastDBLogIndex();
				app.locals.lastDBIndex = params.logIndex;
			}
			if (typeof(params.resaveRestorePoints) == 'undefined') 
				params.resaveRestorePoints = false;	 		

			console.log(params);
							
			if (params.logIndex > -1) {
				// restore db 	
				var restoredDB = {};
				if (fs.existsSync('db/db'+params.logIndex+'.js')) {
					var dbString = fs.readFileSync('db/db'+params.logIndex+'.js', 'utf-8');
					console.log('Restoring DB from db'+params.logIndex+'.js');					
					eval('app.locals.db = ' + dbString + ';');
					m.index();
					//console.log(app.locals.db);
				} 
				
				// re-run app from the restore point until the end of the logs
				var logIndex = params.logIndex;
				while(true) {
					if (fs.existsSync('db/db'+logIndex+'.js')) {
						if (fs.existsSync('db/db'+logIndex+'.log')) {
							var commandLog = fs.readFileSync('db/db'+logIndex+'.log', 'utf-8');
							var c = app.locals.commands;
							var m = app.locals.methods;
							console.log('Restoring DB from db'+logIndex+'.log:');
							eval(commandLog); 
							
							// re-save restore point
							if (params.resaveRestorePoints) 
								m.saveDB({ logIndex: logIndex });
						}
						
						++logIndex; 
					}			
					else 
						break;
				}	
				
			}
			else {
				// save initial db
				m.saveDB({});
			}
						
			app.locals.logCommand = oldLoggingMethod;

			return { restored: true }; 
		},
	saveDB: 
		function(params) { 
			var m = app.locals.methods;
			console.log("saving db");
			if (typeof(params) == 'undefined')
				params = {};
			if (typeof(params.logIndex) == 'undefined') {
				app.locals.lastDBIndex = app.locals.lastDBIndex + 1;
				params.logIndex = app.locals.lastDBIndex;
			}							
			console.log(params);
			
			if (typeof(params.db) === 'undefined') 
				fs.writeFileSync('db/db'+params.logIndex+'.js', JSON.stringify(app.locals.db), 'utf-8');	  			
			else 				
				fs.writeFileSync('db/db'+params.logIndex+'.js', JSON.stringify(params.db), 'utf-8');	  			
									
			return { saved: true }; 
		},
	login:
		function(params) {
			var users = app.locals.db.users;
			return (typeof (users[params.email]) !== 'undefined' && users[params.email].password == params.password);			
		},
	isLoggedIn:
		function(params) {
			return typeof (params.email) !== 'undefined';
		},
	startApp: 
		function(params) {
			app.locals.methods.restoreDB({});		
			http.createServer(app).listen(app.get('port'), function(){
				console.log("Express server listening on port " + app.get('port'));
			});				
		},
	getTabs:
		function() {
			return [{name:'Feed', link:''}, {name: 'Books', link:'/book/list'}, {name: 'Blogs', link:'/blogs'}];
		}
}	

// Make all interface commands loggable, and only execute the commands when locks are unlocked.
// Also, call the callback after the command is called.
for(var name in app.locals.commands) {	
	var makeLog = function(n) {
		var l = app.locals;
		var m = l.methods;
		var backup = l.commands[n];
		l.commands[n] = function() {
			l.logCommand(n, arguments);
			l.newCommands.push({command: function() {
				return backup.apply(this, arguments); 
			}, args: arguments});
			if (l.newCommands.length == 1)
				m.pushCommands();			
		};
	};
	makeLog(name);
}

app.locals.log = 
	function(logWhat) {
		console.log(logWhat);
		return logWhat;
	};	

// configure app
app.configure(function(){
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views'); 
	app.set('view engine', 'jade');
	app.use(express.favicon()); 
	//app.use(express.logger('dev')); 
	app.use(express.compress());
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.cookieParser('xpl33t26'));
	//app.use(express.session());
	app.use(express.cookieSession());
	app.use(function(req, res, next) {
		var m = app.locals.methods;
		//console.log(m.isLoggedIn(req.session));
		if (!m.isLoggedIn(req.session) && req.path != '/login' && req.path != '/login/post' && req.path != '/logout')	{
			res.redirect('/login');	
		}
		else
			next();
	});
	app.use(app.router);
	app.use(function(err, req, res, next) {	
		var m = app.locals.methods;
		if (typeof(req.lockType) !== 'undefined') {
			m.unlock({lockType: req.lockType});
		}
		
		m.unlock({lockType: 'commandLock'});
		
		if (req.path == '/admin/command/post') {   
			console.error(err.stack);
			res.json(err.stack);
		}
		//else 
		//	res.end();
		next(err);
	});

	//if ('development' == app.get('env')) {		
		app.use(express.errorHandler());
	//}
});

/*
process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});
*/

// use regular expressions to find parameters
/*
app.param(function(name, fn){
  if (fn instanceof RegExp) {
    return function(req, res, next, val){
      var captures;
      if (captures = fn.exec(String(val))) {
        req.params[name] = captures;
        next();
      } else {
        next('route');
      }
    }
  }
});

// id param
app.param('id', /^\d+$/);
*/

// all requests 
app.all('*', function(req, res, next) {
	req.app = app;
	next();
});

// some gets
app.get('/', routes.index);
app.get('/index', routes.index);
app.get('/book/list', routes.books);

app.get('/login', login.index);
app.get('/logout', login.logout);
app.post('/login/post', login.login);

app.get('/users', user.index);
app.get('/user/:id', user.one);

app.get('/comments', routes.comments);
app.post('/discussion/add', routes.addDiscussion);
app.get('/discussion/more', routes.moreDiscussions);
app.post('/book/add', routes.addBook);
app.get('/book/index/:id', routes.book);

// admin 
app.post('/admin/command/post', command.postCommand);
app.get('/admin/command/history', command.commandHistory);

app.locals.methods.startApp();