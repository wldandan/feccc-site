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
define(["dojo/_base/declare",
        "dojo/_base/Deferred",
        "dojo/_base/xhr",
        "dojo/query",
        "dojo/aspect",
        "dojo/_base/lang",
        "dojo/_base/array",
        "dojo/_base/json",
        "dojo/topic",
        "com/spss/ca/util/UrlFactory",
        "com/spss/ca/util/log/Logger",
        "idx/dialogs",
        "com/spss/ca/Events",
        "com/spss/ca/util/errorTranslator",
        "com/spss/ca/widget/sysErrorDialog",
        "dojo/_base/connect"], 
        function(declare,Deferred,xhr,query,aspect,lang,array,
        		json, topic, UrlFactory,Logger, dialogs, Events,errorTranslator,sysErrDialog, connect){
//	console.log("Add additional handler for xhr");
//	dojo.xhr.contest=1234;

	var self = this;
	var NotListenURL=["/ca/user/profile","/security/logout/"];
	this.declaredClass = "app.module.axhr";
	var logger = new Logger().getLogger(this);
	return declare(null,{
		//	ixhr:new com.spss.ca.util.AjaxUtil(),

		deferredMap : {},
		doxhr:function(request, method, singletonKey) {
			var self=this;
			if(request.handleAs==="json"){
				if(!request.headers){
					request.headers={};
				}
				request.headers["x-ajax"]=true;
			}
			
			var orgErrorHandler=request.error||function(){
				sysErrDialog.show(arguments[2]);//act as a default error process
			};
			if(request.error) {
				request.error = function(error, ioargs){
					if( ioargs.xhr.status===401){
						if(array.indexOf(NotListenURL,ioargs.url)===-1){
							setTimeout(function(){self._onSessionTimeout();},200);
						}
							else{
								orgErrorHandler(error, ioargs);
							}
							
							return;
					}
					
					if(self.errorprocess && dojo.isArray(self.errorprocess.errorno)
							&& dojo.indexOf(self.errorprocess.errorno, ioargs.xhr.status) > -1) {
						
						logger.error("Error happen while '" + method + " " + request.url + "': "+ioargs.xhr.status);
						return;
					} 
					if(error.responseText){
						var errobj=errorTranslator.parse(error.responseText);
						orgErrorHandler(error, ioargs,errobj);
					}
				};
				return dojo.xhr(method,request);
			}
			else{
				var def=new Deferred();
				
				var p=dojo.xhr(method,request);
				if(singletonKey){
					if(this.deferredMap[singletonKey]){
						for(var i = 0; i < this.deferredMap[singletonKey].length; i ++) {
							this.deferredMap[singletonKey][i].cancel("xhr Cancelled...");
							this.deferredMap[singletonKey].shift();
						}
					}else{
						this.deferredMap[singletonKey] = [];
					}
					this.deferredMap[singletonKey].push(p);
				}
				var THIS = this;
				p.then(function(data){
					def.resolve(data);
					if(singletonKey && THIS.deferredMap[singletonKey]){
						THIS.deferredMap[singletonKey].shift();
					}
					
				},function(error){
					
					if(error.status===401){
						if(array.indexOf(NotListenURL,request.url)===-1)
							setTimeout(function(){self._onSessionTimeout();},200);
						return;
					}
					
					if (error.status >= 500){
						error.isSystemError = true;
					}
					topic.publish("/xhr/error", error);	
					var errobj=errorTranslator.parse(error.responseText);
					def.errback(errobj);
				});
				def.ioArgs=p.ioArgs;
				return def;
			}
			
		},
		_onSessionTimeout:function(){
			//First set app hasLogin to false
			if(!this.hasLogin){
				return; //because we had not login, simply return
			}
			this.hasLogin=false;
			this.showSessionTimeoutMsg=true;
			//close all poped dialog
			this._closeAllDialog();
			//logoff
			this.appHeader._logoff();
			//notify login view display session time out message
			//dojo.publish("ca/session/timeout");
		},
		_closeAllDialog:function(){
			query(".dijitDialog").forEach(function(node){
				var cDialog=dijit.byNode(node);
				if(cDialog.hide){
					cDialog.hide();
				}
				
			});
		}
	});
});