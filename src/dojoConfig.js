dojoConfig = {
	has : {
		"dojo-guarantee-console" : true,
		"popup" : true,
		"dojo-firebug" : true,
		"dojo-debug-messages" : true
	},
	baseUrl : "/",
	packages : [ {
		name : "dojo",
		location: "lib/dojo"
	}, {
		name : "dijit",
		location : "lib/dijit"
	}, {
		name : "dojox",
		location : "lib/dojox"
	}],
	traceSet : {
		"loader-inject" : 0,
		"loader-define" : 0,
		"loader-runFactory" : 0,
		"loader-execModule" : 0,
		"loader-execModule-out" : 0,
		"loader-defineModule" : 0
	},
	//This will prevent browser from caching resources.
	//It's convinent for developing. It should be deleted when deploying.
	cacheBust : false,
	async : true
};