Array.prototype.remove = function(from, to) {
	var rest = this.slice((to || from) + 1 || this.length);
	this.length = from < 0 ? this.length + from : from;
	return this.push.apply(this, rest);
}; 

// Simulates PHP's date function
Date.prototype.format=function(format){var returnStr='';var replace=Date.replaceChars;for(var i=0;i<format.length;i++){var curChar=format.charAt(i);if(i-1>=0&&format.charAt(i-1)=="\\"){returnStr+=curChar}else if(replace[curChar]){returnStr+=replace[curChar].call(this)}else if(curChar!="\\"){returnStr+=curChar}}return returnStr};Date.replaceChars={shortMonths:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],longMonths:['January','February','March','April','May','June','July','August','September','October','November','December'],shortDays:['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],longDays:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],d:function(){return(this.getDate()<10?'0':'')+this.getDate()},D:function(){return Date.replaceChars.shortDays[this.getDay()]},j:function(){return this.getDate()},l:function(){return Date.replaceChars.longDays[this.getDay()]},N:function(){return this.getDay()+1},S:function(){return(this.getDate()%10==1&&this.getDate()!=11?'st':(this.getDate()%10==2&&this.getDate()!=12?'nd':(this.getDate()%10==3&&this.getDate()!=13?'rd':'th')))},w:function(){return this.getDay()},z:function(){var d=new Date(this.getFullYear(),0,1);return Math.ceil((this-d)/86400000)}, W:function(){var d=new Date(this.getFullYear(),0,1);return Math.ceil((((this-d)/86400000)+d.getDay()+1)/7)},F:function(){return Date.replaceChars.longMonths[this.getMonth()]},m:function(){return(this.getMonth()<9?'0':'')+(this.getMonth()+1)},M:function(){return Date.replaceChars.shortMonths[this.getMonth()]},n:function(){return this.getMonth()+1},t:function(){var d=new Date();return new Date(d.getFullYear(),d.getMonth(),0).getDate()},L:function(){var year=this.getFullYear();return(year%400==0||(year%100!=0&&year%4==0))},o:function(){var d=new Date(this.valueOf());d.setDate(d.getDate()-((this.getDay()+6)%7)+3);return d.getFullYear()},Y:function(){return this.getFullYear()},y:function(){return(''+this.getFullYear()).substr(2)},a:function(){return this.getHours()<12?'am':'pm'},A:function(){return this.getHours()<12?'AM':'PM'},B:function(){return Math.floor((((this.getUTCHours()+1)%24)+this.getUTCMinutes()/60+this.getUTCSeconds()/ 3600) * 1000/24)}, g:function(){return this.getHours()%12||12},G:function(){return this.getHours()},h:function(){return((this.getHours()%12||12)<10?'0':'')+(this.getHours()%12||12)},H:function(){return(this.getHours()<10?'0':'')+this.getHours()},i:function(){return(this.getMinutes()<10?'0':'')+this.getMinutes()},s:function(){return(this.getSeconds()<10?'0':'')+this.getSeconds()},u:function(){var m=this.getMilliseconds();return(m<10?'00':(m<100?'0':''))+m},e:function(){return"Not Yet Supported"},I:function(){return"Not Yet Supported"},O:function(){return(-this.getTimezoneOffset()<0?'-':'+')+(Math.abs(this.getTimezoneOffset()/60)<10?'0':'')+(Math.abs(this.getTimezoneOffset()/60))+'00'},P:function(){return(-this.getTimezoneOffset()<0?'-':'+')+(Math.abs(this.getTimezoneOffset()/60)<10?'0':'')+(Math.abs(this.getTimezoneOffset()/60))+':00'},T:function(){var m=this.getMonth();this.setMonth(0);var result=this.toTimeString().replace(/^.+ \(?([^\)]+)\)?$/,'$1');this.setMonth(m);return result},Z:function(){return-this.getTimezoneOffset()*60},c:function(){return this.format("Y-m-d\\TH:i:sP")},r:function(){return this.toString()},U:function(){return this.getTime()/1000}};

var console = console || { log: function() {} };

var CommonUtil = (function ( ) { 
	return {
		widgets: {},
		
		log: function(params) {
			if (typeof(console) != 'undefined')
				console.log(params);
			return params;
		},
		
		parseWidget: function(code) {
			//code = code.replace(findNoncode, 'Print("$1")');
			var newCode = 'Print(\'';
			var states = { almostCode: {s:'almostCode'}, code: {s:'code'}, almostPrint: {s:'almostPrint'}, print: {s:'print'}};
			var state = states.print;	
			for (var c=0; c<code.length; ++c) {		
				var curCode = code[c];
				var dontAdd = false;
				if (curCode == '<') {
					if (state == states.print) 
						state = states.almostCode;							
				}
				else if (curCode == '%') {
					if (state == states.almostCode) {
						state = states.code;				
						dontAdd = true;
						if (newCode.length > 0)
							newCode = newCode.substr(0, newCode.length-1);
						newCode += '\'); ';
					}
					else if (state == states.code) 
						state = states.almostPrint;			
				}
				else if (curCode == '>') {
					if (state == states.almostPrint) {
						state = states.print;
						dontAdd = true;
						if (newCode.length > 0)
							newCode = newCode.substr(0, newCode.length-1);
						newCode += ' Print(\'';
					}
				}
				else {
					if (state == states.almostCode)
						state = states.print;
					else if (state == states.almostPrint)
						state = states.code;
				}
				if (!dontAdd) {
					if (state == states.print)
						curCode = curCode.replace(/\'/g, '\\\'').replace(/\r/g, '').replace(/\n/g, '');
					newCode += curCode;
				}
			}
			if (state == states.print)
				newCode += '\'); ';
			return { code: newCode, dependencies: {} };
		},
		
		getWidgetHtml: function(view, model, widgetID, isLayout, displayScript, getWidget, callback, Print, widgetScript, isRoot) {	
			if (typeof(getWidget) == 'undefined')
				getWidget = this.getWidget;
			if (typeof(widgetScript) == 'undefined')
				widgetScript = { code: {}, instances: {} };
			if (typeof(isRoot) == 'undefined')
				isRoot = true;
			if (typeof(isLayout) == 'undefined')
				isLayout = false;	
			if (typeof(displayScript) == 'undefined')
				displayScript = false;	
				
			var widget = getWidget(view);			
			if (typeof(widgetScript.code[view]) == 'undefined' && !isRoot && !isLayout)
				widgetScript.code[view] = widget.code;	

			var instanceID = 'widget-' + view + '-' + widgetID;
			if (typeof(widgetScript.instances[instanceID]) == 'undefined' && !isRoot && !isLayout) 
				widgetScript.instances[instanceID] = model;
				
			var html = '';
			var Model = model;
			if (typeof (Print) == 'undefined') {
				Print = function (s) { html += s; };
			}	

			var Encode = function(str) {
				return str.replace(/"/g, '&quot;')
			}
		
			var Callback = function(section, callbackModel) {
				if (typeof(callback) != 'undefined' && callback != null) {
					callback(section, callbackModel);
				}
			}; 
			var Widget = function(widgetView, widgetModel, widgetID, isWidgetLayout, widgetDisplayScript, widgetCallback) {				
				if (widgetView != view) {
					CommonUtil.getWidgetHtml(widgetView, widgetModel, widgetID, isWidgetLayout, widgetDisplayScript, getWidget, widgetCallback, Print, widgetScript, false);
					return;
				}
				CommonUtil.log('Widget '+ widgetView +' not allowed within itself');
			};
			var WidgetID = function() {
				Print(widgetID);
				return widgetID;
			};
			var WidgetDependencies = function(widgetViews) {
				var script = 'CommonUtil.widgets = { ';
				var first = true;
				for (var i=0; i<widgetViews.length; ++i) {
					if (first)
						first = false;
					else
						script += ',\n';
					script += '"'+ widgetViews[i] +'": \'' 
						+ getWidget(widgetViews[i]).code.replace(/\'/g, "\\'").replace(/\\\\\'/g, "\\\\\\'") + '\'';
				}
				script += '};'
				Print(script);
			};
			
			eval(widget.code);
			
			if (isRoot && displayScript) {
				CommonUtil.log('getWidgetHtml ' + view);
				html = html.replace('<<WidgetScript>>', 
					'<script type="text/javascript">var widgets=' + JSON.stringify(widgetScript) + ';</script>');
			}
			
			return html;
		},
		
		getWidget: function(view) {
			if (typeof(widgets.code[view]) != 'undefined')
				return { code: widgets.code[view] };
			return { code: '' };
		},
		
		refreshWidget: function(widgetName, model, widgetID) {
			var instanceID = 'widget-' + widgetName + '-' + widgetID;
			if (typeof(widgets.instances[instanceID]) != 'undefined') {
		
				widgets.instances[instanceID] = model;
				$('.widget-'+widgetName+'-'+ widgetID).fadeOut('fast', function() {
					var newHtml = $(CommonUtil.getWidgetHtml(widgetName, widgets.instances[instanceID], widgetID, false, false)).hide();					
					$('.widget-'+widgetName+'-'+ widgetID).replaceWith(newHtml);
					
					$('.widget-'+widgetName+'-'+ widgetID).fadeIn('fast', function() {		
						/*$('.widget-'+widgetName+'-'+ widgetID).click(function() {
							var model = { test: [] };
							var len= Math.random()*10;
							for (var i=0; i<len; i++) {
								model.test[i] = i;
							}
							RefreshWidget(widgetName, model, widgetID);
						});		*/

					});
				});	
			}
		},

		genGuid: function(hashOfGuids) {
			function S4(){
				return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
			}
			return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
		}
	};
})( );

if (typeof (exports) != 'undefined')
{
	exports.log = CommonUtil.log;
	exports.parseWidget = CommonUtil.parseWidget;
	exports.getWidgetHtml = CommonUtil.getWidgetHtml;
}