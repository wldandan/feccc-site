define([ 
    "dojo/_base/json", 
    "dojox/app/main", 
    "dojo/_base/connect", 
    "dojo/_base/Deferred", 
    "dojo/text!./config/config.json"
], function(
	json, Application, connect, Deferred, configText
) {
	this.declaredClass = "app";
	app = Application(json.fromJson(configText));
});
