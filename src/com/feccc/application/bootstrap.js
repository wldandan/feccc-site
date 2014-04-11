/************************************************************************
** IBM Confidential
** 
** OCO Source Materials
**
** IBM SPSS Analytic Catalyst
**
** (C) Copyright IBM Corp. 2013
**
** The source code for this program is not published or otherwise divested of its trade secrets, 
** irrespective of what has been deposited with the U.S. Copyright Office.
************************************************************************/
require(["dojo/_base/xhr","com/spss/ca/util/UrlFactory","dojo/parser","dojo/_base/sniff","dojo/_base/array"],function(xhr,UrlFactory,parser,has,array){
	
	var req = {
			"url": UrlFactory.agent/*,
			"sync" : true */
		};
	var defd = dojo.xhr("GET",req);
	defd.then(function(data) {
		var userAgentLocale = dojo.fromJson(data);
		dojo.locale = userAgentLocale.lang.concat((userAgentLocale.cy.length === 0) ? '' : '-' + userAgentLocale.cy);
		parser.parse();
		require( [ "com/spss/ca/application/app" ]);
	});
});