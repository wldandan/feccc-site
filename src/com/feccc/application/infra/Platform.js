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