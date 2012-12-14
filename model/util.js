CommonUtil = require('../public/js/util');
buckets = require('../public/js/buckets');

exports.log = CommonUtil.log;
exports.parseWidget = CommonUtil.parseWidget;
exports.getWidgetHtml = CommonUtil.getWidgetHtml;
exports.buckets = buckets;

exports.getFileExtension = function(fileName) {
	var lastDotIndex = fileName.lastIndexOf('.');
	if (lastDotIndex > 1) {
		return fileName.substring(lastDotIndex+1);
	}
	return '';
};