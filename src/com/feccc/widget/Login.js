define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./template/Login.html"
], function(
	declare,
	_WidgetBase,
	_TemplatedMixin,
	templateStr
){
	return declare("widget.Login", [_WidgetBase, _TemplatedMixin],{
		templateString: templateStr
	});
});
