CommonUtil = require('../public/js/util');

exports.log = CommonUtil.log;
exports.parseWidget = CommonUtil.parseWidget;
exports.getWidgetHtml = CommonUtil.getWidgetHtml;

exports.getFileExtension = function(fileName) {
	var lastDotIndex = fileName.lastIndexOf('.');
	if (lastDotIndex > 1) {
		return fileName.substring(lastDotIndex+1);
	}
	return '';
};