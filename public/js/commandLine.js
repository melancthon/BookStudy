
var CL = (function ( ) { 
	var userHistoryArr = [];
	var userHistoryHash = {};
	var historyIndex = null;
	var outputIndex = 0;
	var maxHistory = 50;

	function postCommand(commandText, saveHistory) {
		$.post('/admin/command/post', {commandText: commandText, saveHistory: saveHistory}, function(data) {
			$('.command-output').append(	
				'<div class="command">' + commandText + '</div>'+
				'<div class="command-result">' + JSON.stringify(data) + '</div>'+
				'<div id="command-index-'+outputIndex+'">&nbsp;</div>');
			$('.command-output').scrollTo('#command-index-'+outputIndex, 100);
			++outputIndex;
		});
	}

	function commandHistory(up) {
		if (userHistoryArr.length == 0)
			return;
		if (historyIndex == null)
			historyIndex = 0;
		else {
			if (up)
				--historyIndex;
			else 
				++historyIndex;
		}
		if (historyIndex < 0)
			historyIndex = 0;
		else if (historyIndex >= userHistoryArr.length) 
			historyIndex = userHistoryArr.length - 1;			
		$('.command-line input').val(userHistoryArr[historyIndex]);
	}
	 
	function log(logWhat) {
		if (typeof (console) != 'undefined')
			console.log(logWhat);
	}
	
	function loadHistory() {
		$.get('/admin/command/history', {}, function(data) {						
			if (data != null) {
				userHistoryArr = data;
				userHistoryHash = {};
				for (var h = 0; h<userHistoryArr.length; ++h) {
					userHistoryHash[userHistoryArr[h]] = h;
				}
				historyIndex = userHistoryArr.length+1;
			}
		});
	}

	return  {
		log: function(logWhat) {
			log(logWhat);
		},
		command: function(commandText) {
			postCommand(commandText);
		},
		init: function() {
			$('.command-line input').keydown(function(event) {
				if (event.which == 13) {
					var commandText = $(this).val();
					var saveHistory = false;
					if (typeof(userHistoryHash[commandText]) == 'undefined')
					{	
						userHistoryHash[commandText] = userHistoryArr.length;
						userHistoryArr.push(commandText);		
						saveHistory = true;
					}		
					if (userHistoryArr.length > maxHistory) {
						var firstInHistory = userHistoryArr[0];
						delete userHistoryHash[firstInHistory];
						userHistoryArr.remove(0);
					}
					historyIndex = userHistoryArr.length;
					postCommand(commandText, saveHistory);
					$(this).val('');
				}
				else if (event.which == 38) {
					commandHistory(true);
				}
				else if (event.which == 40) {
					commandHistory(false);
				}
			});
			
			$('.command-link').click(function() {
				$('.command-line').toggleClass('command-hide');
			});
			
			loadHistory();
		}
	};
})( );

$(document).ready(function() {
	CL.init();
});