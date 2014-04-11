/*******************************************************************************
 * * IBM Confidential * * OCO Source Materials * * IBM SPSS Analytic Catalyst * *
 * (C) Copyright IBM Corp. 2013 * * The source code for this program is not
 * published or otherwise divested of its trade secrets, * irrespective of what
 * has been deposited with the U.S. Copyright Office.
 ******************************************************************************/
require([ "dojo/_base/kernel", "dojo/_base/lang", "dojo/_base/array", "dojo/_base/loader", "dojo/has", "dojo/sniff" ], function(dojo, lang, array,
		i18n, has) {
	// Following put deviceType in dojo.golobal
	var deviceType;
	has.add("ios7", has("ios") && (has("ios") > 7 || has("ios") === 7));
	if (has("ios")) {
		has.add("tablet","ios");
		deviceType = "ios";
	} else if (navigator.userAgent.toLowerCase().indexOf("android") > 0) {
		has.add("tablet","android");
		deviceType = "android";
	} else {
		deviceType = "desktop";
	}
	if(has("ios7")){
		require(["com/spss/ca/Ios7Fix"]);
	}

	has.add("mobileclient", deviceType !== "desktop");
	dojo.global["deviceType"] = deviceType;
	var path = window.location.pathname;
	if (path.charAt(path.length) !== "/") {
		path = path.split("/");
		path.pop();
		path = path.join("/") + "/app";
	}

	if (window.location.search || window.location.hash.indexOf('?') !== -1) {
		var str = null;
		if (window.location.search && window.location.search.length > 0) {
			str = window.location.search.replace('?', '');
		} else {
			var href = window.location.href;
			str = href.substring(href.indexOf("?") + 1, href.length);
		}

		if (str.indexOf('=') !== -1) {
			var parts = str.split('=');
			if (parts.length === 2) {
				if (parts[0] === 'tablet' && parts[1] === 'true') {
					dojo.global.deviceType = "ios";
				}
			}
		}
	}
	require([ "dojo/_base/html", "dojox/app/main", "dojo/_base/connect", "com/spss/ca/util/log/Logger", "dojo/_base/Deferred", "dojo/_base/window","com/spss/ca/ViewBase"],
			function(dojo, Application, connect, Logger, Deferred) {
				this.declaredClass = "app";
				var log = new Logger().getLogger(this);
				log.info("Begin load application config");
				var config;

				// TODO: REMOVE; ONLY FOR TESTING
				// dojo.global.deviceType = "ios";
				// dojo.global.deviceType = "desktop";

				if (dojo.global.deviceType === "desktop") {
					config = "config.json";
				} else {
					config = "tablet_config.json";
				}

				log.info("Config load end,Being init app");
				require([ 'dojo/text!com/spss/ca/application/config/' + config, 'dojox/json/ref', "dojo/_base/xhr" ], function(configText, json, xhr) {
					var appConfig = json.fromJson(configText);
					var appResolve = new Deferred();

//					if (appConfig.debug) {
//						var appTestApi = appConfig.testAPIConfig;
//						xhr.get({
//							url : "app/" + appTestApi,
//							handleAs : "json",
//							load : function(testConfig) {
//								for ( var i = 0; i < testConfig.modules.length; i++) {
//									appConfig.modules.push(testConfig.modules[i]);
//								}
//								function getViewConfig(viewName) {
//									var vconfig = appConfig;
//									var vtree = viewName.split(",");
//									for ( var i = 0; i < vtree.length; i++) {
//										vconfig = vconfig.views[vtree[i]];
//									}
//
//									return vconfig;
//								}
//								for ( var view in testConfig.views) {
//									viewConfig = getViewConfig(view);
//									viewConfig.testAPI = testConfig.views[view].testAPI;
//									viewConfig.dependencies.push(testConfig.views[view].modulePath);
//								}
//
//								appResolve.resolve(true);
//							},
//							error : function() {
//								appConfig.debug = false;
//								appResolve.resolve(true);
//							}
//						});
//					} else {
					appResolve.resolve(true);
//					}

					appResolve.then(function() {
						app = Application(appConfig);
						log.info("Application started");
						connect.subscribe("/app/loadchild", lang.hitch(app, function(node) {
							log.info(node);
						}));
					});
				});
			});
});
