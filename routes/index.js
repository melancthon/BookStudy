
exports.index = function(req, res){	
	var m = req.app.locals.methods;
	var db = req.app.locals.db;

	/*
	console.log('started index');
	var i = 0;
	function compute()
	{
		i += 1;
		if (i > 5000000) {		
			console.log('ended index');




			return;
		}
		process.nextTick(compute);
	}
	compute();	
	//*/
	
	m.query(req,
		function() {			
			return { books: db.books, discussions: db.discussions };
		}, 
		function(data) {
			res.send(m.getWidgetHtml('index', data, 1));
		}
	);
};

exports.books = function(req,res) {
	var db = req.app.locals.db;
	var m = req.app.locals.methods;
	m.query(req,
		function() {
			return { books: m.getBooks(), tabs: m.getTabs(req), selectedTab: 'books' };
		},
		function(data) {
			res.send(m.getWidgetHtml('books', data, 1));
		}
	);
};

exports.book = function(req,res)
{	
	var db = req.app.locals.db;
	var m = req.app.locals.methods;
	m.query(req,
		function() {
			var book = m.getBook({id: req.params.id});
			return { book: book, 
				discussions: m.getBookDiscussions({id: req.params.id}), 
				guides: {}, 
				blogs: {'1': {image:'http://placehold.it/32x32', title:'A blog about stuff', desc:'Some description of the thing we are discussing and such and so on'}},
				tabs: m.getTabs(req) };
		},
		function(data) {
			res.send(m.getWidgetHtml('book', data, 1));
		}
	);
};

exports.addBook = function(req, res) {
	var c = req.app.locals.commands;	
	req.body.book.cdate = (new Date()).toUTCString();
	c.addBook({book: req.body.book}, function(data) { res.json(data); });	
};

exports.comments = function(req, res){	
	var db = req.app.locals.db;
	res.send({discussionID: req.query.discussionID});
}; 

exports.addDiscussion = function(req, res) {
	var c = req.app.locals.commands;
	c.addDiscussion({discussion: req.body.discussion, bookID: req.body.bookID, createDate: (new Date()).toUTCString(),
        userID: req.session.email}, 
		function(data) { res.json(data); });	
};

exports.moreDiscussions = function(req, res) {
	var m = req.app.locals.methods;
	m.query(req,
		function() {
			return { discussions: m.getBookDiscussions({id: req.query.bookID, 
				newest: req.query.newest, 
				oldest: req.query.oldest
            }) };
		},
		function(data) {
			res.json(data);
		}
	);
};

exports.bookDiscussion = function(req, res) {
    var m = req.app.locals.methods;
    m.query(req,
    	function() {
            var book = m.getBook({id:req.params.id});
            console.log(req.params);
            console.log(req.query);
			var discussion = m.getDiscussion({id: req.params.discussionID});
			return { discussion: discussion, book: book,
				tabs: m.getTabs(req) };
		},
		function(data) {
			res.send(m.getWidgetHtml('bookDiscussion', data, 1));
		}
	);
};