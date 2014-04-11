define([ 
    "dojo/_base/html", 
    "dojox/app/main", 
    "dojo/_base/connect", 
    "dojo/_base/Deferred", 
    "dojo/text!./config/config.json",
    
    "dojo/_base/window"
], function(
	dojo, Application, connect, Deferred, configText
) {
	this.declaredClass = "app";
	app = Application(json.fromJson(configText));
});
