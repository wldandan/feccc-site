define(["dojo/_base/declare",
        "dojo/aspect",
        "dojo/_base/lang",
        "dojo/keys",
        'dojo/query',
        "dojo/dom-construct", 
        'dojo/dom-attr',
        "dojo/dom-class",
        "dojo/has",
        "com/spss/ca/TransitionEvent",
        "com/spss/ca/CometUtil",  
        "dojo/i18n!com/spss/ca/application/nls/message", 
        "dojo/on",
        "dojo/string",
        "dojox/mobile/ProgressIndicator",
        "dojo/has!tablet?com/spss/ca/util/ViewPath4Tablet:com/spss/ca/util/ViewPath",
        "com/spss/ca/mobile/widget/projects/explore/InsightText",
        'com/spss/ca/desktop/widget/projects/explore/insight/widgets/HoverCard',
        'com/spss/ca/desktop/widget/projects/explore/insight/widgets/HoverCardContains',
        "com/spss/ca/util/UrlFactory",
        "dojo/html",
        "dojo/ready",
        "com/spss/ca/util/AppUtil",
        "com/spss/ca/util/log/Logger",
        "dojox/app/utils/constraints",
        "dojo/_base/unload","dojo/_base/event","dojo/_base/sniff"], 
function(declare, aspect,lang, keys, query,domConstruct,domAttr,domClass,has, TransitionEvent,  
		Comet, i18n, on, string,ProgressIndicator, ViewPath,InsightText,HoverCard,HoverCardContains,
		UrlFactory,
		html, ready,AppUtil,Logger,constraints){
	this.declaredClass = "app.module.appctr";
	var logger = new Logger().getLogger(this);
	return declare(null,{
		hasLogin:false,
		fieldChangeList : {},
		keepData : false,
		postCreate: function(params, node){
			
			logger.debug("Verifying dojo locale...");
			//Begin get correct local
			logger.debug("Dojo default locale is:" + dojo.locale);
			dojo.locale=dojo.cookie("lcLang")||dojo.locale;
			logger.debug("Take locale in cookie for preference. Now Dojo locale is:" + dojo.locale);
			if(!this.isLocalSupported(dojo.locale)) {
				logger.debug(dojo.locale + " is not supported. Set locale to en.");
				dojo.locale="en";
			}
			this.app=this;
			window.onbeforeunload=lang.hitch(this,"pageUnload");
			
			//dojo.addOnUnload(this,"pageUnload");
			//dojo.addOnWindowUnload(this,"windowunload");
		},
		windowunload:function(evt){
			logger.log(evt);
		},
		pageUnload:function(evt){			
			if(!this.canUnload()){
				return i18n["unloadConfirm"];
//				evt.returnValue=i18n["unloadConfirm"];
//				if(has("webkit")){
//					var s=confirm(i18n["unloadConfirm"]);
//					if(!s)
//						dojo.stopEvent(evt);
//				}
			}
		},
		sleep:function(n){
			var start=(new Date()).getTime();
			while(true){
				var end=(new Date()).getTime();
				if((end-start)>n*1000){
					break;
				}
			}
		},
		reset:function(){
			logger.debug("Reseting application...");
			
			app.hasLogin=false;
			this._navTo();
			
			logger.debug("Reset data model.");
			if(this.restDataModel){
				this.restDataModel();
			}
			logger.debug("App header bind user.");
			if(this.appHeader.bindUser)
			{
				this.appHeader.bindUser();
			}
			else{
				this.emit("app-reset",{});
			}
			
			this.stopListenProjectStatus();
			
			
			//history.go(-1);
			logger.debug("Clear browser history.");
			//history.pushState(null,null);
			//destroy all view and scene except login
			for(var vname in this.children){
				var appChildView=this.children[vname];
				if(appChildView.id!=="CA_login"&&appChildView.destroy){
					appChildView.destroy();
				}
			}
		},
		
		forward:function(target, params){
			logger.debug("Forward to " + target);
			if(!target){
				target = ViewPath.home;
			}
			this.stopListenProjectStatus();
			if(dojo.global.deviceType==="desktop"){
				this._transitionTo(target, params);
			}else{
				this._navTo(target, params, "forward");
			}
			//console.log("### Forward = ", this._historyManager);
		},
		
		back:function(target, params){
			logger.debug("Backward to " + target);
			this._navTo(target, params, "back");
			//console.log("### Back = ", this._historyManager);
		},
		
		_returnUrl : [],
		hasReturnUrl : function() {
			return this._returnUrl.length > 0;
		},
		
		registerReturnUrl : function(url) {
			this._returnUrl = [ url ];
		},
		
		returnUrl : function() {
			return this._returnUrl.pop();
		},
		
		
		getFieldChangeList : function(){
			return this.fieldChangeList;
		},
		last:function(){
			logger.debug("Navigate to last.");
			if(this._lastNav.length > 1){
				var _nav = this._lastNav[0];
				this._navTo(_nav.target,_nav.params, "forward");
			}
		},
		
		getParams:function(paramName){
			if(paramName==="project"){
				return "TestProject";
			}
				
			if(paramName==="datasource"){
				return "TestDataSet";
			}
				
			else{
				return "UnKnown";
			}
				
		},
		// Firefox is returning a already decoded value from location.hash, so only decode
		// if not Firefox
		_getDecodedHash: function() {
			if (typeof (HTMLElement) !== "undefined" && (has("ff") || has("mozilla"))) {
				return window.location.hash;
			} else {
				return decodeURIComponent(window.location.hash);
			}
		},
		_transitionTo : function(target,passData){
			var url = "target=" + target;
			for ( var item in passData) {
				if(item !== 'navFrom'){
					url += "&" + item + "=" + passData[item];
				}
			}
			var urlArray = target.split("&");
			if(urlArray.length > 1 && !passData){
				url = target;
				target = urlArray[0];
			}
			var transopts = {
				target : target,
				url : url,
				data : {
					passingData : passData
				}
			};
			var tdata=dojo.clone(transopts);
			transopts.data.data = tdata;
			return new TransitionEvent(app.domNode, transopts, null).dispatch();
		},
		_navTo:function(target, urlparams, navopt){
			//this.setNavTo(target);
			var isMultiState=false;
			if(!target)
				{
					target=this.hasLogin?"home":"login";
				}
			var opt_url = "";
			var hs = this._getDecodedHash();
			var scomefrom=AppUtil.getHashParams("target",hs)||"homeScene,welcome";
			var targetViewConfig=AppUtil.getViewConfig(target);
			isMultiState=!!targetViewConfig["hasMultiState"];
			var data=urlparams&&urlparams.data?urlparams.data:{};
			if(typeof urlparams==="string"){
				opt_url=urlparams;
			}else{
				var up = {};
				dojo.mixin(up, urlparams);
				
				up["target"] = target?target:"";
				
				if(target&&target!=="null"){
					
					if(!targetViewConfig){
						logger.debug("Target view:"+target+" not found");
						return this._navTo("homeScene,welcome");//not found target, so redirect to home
					}
					
					this.prevView=AppUtil.getHashParams("target",hs);
					if(targetViewConfig["neednavefrom"]){
						
						
						if(targetViewConfig["hasMultiState"])
							{
							//	var navfrom=this._getHashParams("navfrom",hs);
								
								
								if(!this.prevView||this.prevView==="null")
									this.prevView="homeScene,welcome";
							}
						else{
							var navfrom=AppUtil.getHashParams("navfrom",hs);
							if(!navfrom){
								navfrom=AppUtil.getHashParams("target",hs);
							}
								
							if(!navfrom||navfrom==="null"){
								navfrom=ViewPath.home;
							}
								
							up["navfrom"]=navfrom;
						}
					}
				}
				
				opt_url += ("target" + "=" + up["target"] + "&");
				for(var x in up){
					if(x==="target"&&!up[x])
						{
							continue;
						}
					if(x==="data"){
						continue;
					}
					if(x !== "target"){
						opt_url += (x + "=" + up[x] + "&");
					}
				}
				if(opt_url) {
					opt_url = opt_url.substr(0, opt_url.length-1);
				}
			}
			
			
			var transopts = {
				hasMultiState:isMultiState,
				target:target,
				phash:hs,
				url:opt_url?opt_url:"/",
				comefrom:scomefrom,
				navaction:navopt//navopt maybe forward or back, this is used to operate on view stack not on history
			};
			var tdata=dojo.clone(transopts);
			transopts.data={};
			
			transopts.data.data=tdata;
			transopts.data.passingData=data;
			logger.debug("Append bookmark to URL: " + transopts.url);
			if(!transopts.target){
				transopts.href="/";
			}
			logger.debug("Begin transition...");
			return new TransitionEvent(app.domNode, transopts, null).dispatch();
		},
		listenProjectStatus:function(){
			//ready(lang.hitch(this, function() {
			logger.debug("Start comet to listen project status...");
				if(!this.psListener)
					{
						this.psListener=new Comet({
							url:"/services/listen/ca/build",
							buURL:"/ca/build"
							
						});
					}
				this.psListener.restart();
			//}));
			
		},
		stopListenProjectStatus:function(){
			logger.debug("Stoping listen project status...");
			if(this.psListener)
			{
				this.psListener.stop();
			}
		},
		_showFieldHover: function(e) {
			if (!e.keyCode || e.keyCode === keys.ENTER
					|| e.keyCode === keys.SPACE) {
				e.stopPropagation();

				var fieldName = domAttr.get(this, "data-ca-fieldName");

				if (!this.hoverCard1) {
					this.hoverCard1 = new HoverCard();
					if(e.target){
						this.hoverCard1.set('target',e.target);
					}
					this.hoverCard1.startup();					

					if (!this.hoverCardContains) {
						this.hoverCardContains = new HoverCardContains({
							field : fieldName
						});

						dojo.connect(this.hoverCard1, "_onClick", this.hoverCardContains, this.hoverCardContains.onClick);

						this.hoverCard1.containerNode.appendChild(this.hoverCardContains.domNode);

					} else {
						this.hoverCardContains = new HoverCardContains({
							field : fieldName
						});

						domConstruct.empty(this.hoverCard1.containerNode);

						this.hoverCard1.containerNode.appendChild(this.hoverCardContains.domNode);

					}

				}
				if(this.hoverCard1){
					//if(this.hoverCard1.moreActions){
//						app.dataModel.get("project.dataSourceDeleted($projectId)",{
//							projectId:this.hoverCardContains._currentProject.id
//						}).then(lang.hitch(this,function(deleted){
//							if(deleted){
//								this.hoverCard1.footerNode.style.display="none";
//							}
							this.hoverCard1.open(this);//show(this, this, [ 'after-centered', 'before-centered' ], false);
						//}));
					//}
					
				}
				
			}
		},
		
		_closeAllDialog:function(){
            query(".dijitDialog").forEach(function(node){
                var cDialog=dijit.byNode(node);
                if(cDialog.hide){
                	cDialog.hide();
                }
                
            });
        },
		
		showHoverCard : function(insightText) {

			var textInsight = domConstruct.toDom(insightText);

			var self = this;
			//query('.fieldHover', textInsight).on('mouseover', function(e)
			query('.fieldHover', textInsight).forEach(function(node){
				domAttr.set(node,'title',node.innerHTML);
			});
			query('.fieldHover', textInsight).on('mouseout', function(e) {
                e.stopPropagation();
                if (this.hoverCard1) {
                    dojo.connect(this.hoverCard1, "hide", self, self._closeAllDialog);
                    var that = this;
                    this._hideTimer2 = setTimeout(lang.hitch(this, function(){that.hoverCard1.close();}), 1500);
                }
            });
			query('.fieldHover', textInsight).on('click', this._showFieldHover);
			query('.fieldHover', textInsight).on('keydown', this._showFieldHover);

			return textInsight;
		},

		showHelpHoverCard : function(domNode){
			if(dojo.global.deviceType==="desktop"){
				dojo.query('.helpHover',domNode).forEach(lang.hitch(this, function(node){
					if(node.innerHTML.length === 1){
						domClass.add(node,'helpWrap');
						domClass.remove(node,'helpHover');
						node.innerHTML = '<span class="helpWrapHover" tabindex="0">' + node.innerHTML + '</span>';
					}
					if(!this.helpHoverCard._started){
						this.helpHoverCard.startup();
					}
					this.helpHoverCard.addTarget(node);
				  }));
			}else{
				dojo.query('.helpHover,.fieldHover',domNode).forEach(function(node){
					if(dojo.hasClass(node.parentNode,"insightText")){
						return;
					}
						
					var hString=node.outerHTML;
					var txt=new InsightText({
						text:hString
					});
					txt.placeAt(node);
//					html.set(node,txt.domNode);
//					node = txt.domNode;
				});
					
				}
        },
		favorite : function(projectId, insightId,favorite){
			var url = string.substitute(UrlFactory.favorite, {
				projectID :projectId
			});
			this.start = new Date();
			if(favorite){
				var req = {
						url : url,
						handleAs : 'json',
						postData : dojo.toJson({insights : [insightId]}),
						headers : { "Content-Type" : "application/json" }
				};
				var def=app.doxhr(req,"POST");
				def.then(lang.hitch(this,function(data){
					app.showMessageToaster(i18n.favorite.addSuccess);
				}));
			}else{
				var req = {
						url : url,
						handleAs : 'json',
						content : {insights : insightId}
				};
				var def=app.doxhr(req,"DELETE");
				def.then(lang.hitch(this,function(data){
					app.showMessageToaster(i18n.favorite.removeSuccess);
				}));
			}
		},
        showMessageToaster : function(message){
    		var messageObject =  {
				type: 'success',
                content: message,
				timestamp: (new Date().getTime() - this.start.getTime()) / 1000 + " second(s) ago"
            };
    		if(!this.messageToaster._started){
    			this.messageToaster.startup();
			}
        	this.messageToaster.add(messageObject);
        },
		changeLocal:function(/*String*/localName,/*Boolean*/notreload){
			logger.debug("Change locale to " + localName);
			dojo.cookie("lcLang",localName);
			if(!notreload)
			window.location.reload();
		},
		
		isLocalSupported:function(local){
			//TODO implement this to include all supported locales in CA
			var supported_local=["en","en-shout"];
			return dojo.indexOf(supported_local,local)>-1;
			
		},
		_genHashMap:function(hashStr){
			var params = hashStr.split("&");
			var up={};
			for(var x in params) {
				var str=params[x].split("=");
				up[str[0]]=str[1];
			}
			return up;
		},
		showStandby:function(containerNode){
			this.prog = ProgressIndicator.getInstance();
			containerNode.appendChild(this.prog.domNode);
			this.prog.start;
		},
		hideStandby:function(){
			if(this.prog){
				this.prog.stop();
			}
		},
		//Update to dojo 1.9
		transViewState:function(viewTargetStr,data){
			var tmphash="";
			if(arguments.length>=2){
				var urlHashStack=[];
				if(!this.prevView){
					this.prevView= ViewPath.home;
				}
				urlHashStack.push("target="+viewTargetStr);
				for(var x in data){
					urlHashStack.push(x+"="+data[x]);
				}
				var viewConfig=AppUtil.getViewConfig(viewTargetStr);
				if(viewConfig["neednavefrom"]){
					urlHashStack.push("navfrom="+this.prevView);
				}
				 tmphash=urlHashStack.join("&");
			}else{
				tmphash=viewTargetStr;
			}
			
			this.emit("app-transState",{
				url:tmphash
			});
			//this._historyManager.addToHistory(tmphash);
		},
		setupControllers:function(){
			
		},
		canTransout:function(target){
			var view=this._getSelectChildren(this);
			return view.canTransout(target);
		},
		canUnload:function(){
			var view=this._getSelectChildren(this);
			if(view.viewWidget.canUnload){
				return view.viewWidget.canUnload();
			}
			
			return true;
		},
		transition:function(target){
			//transition to target without change url hash
			this.emit("app-transition",{
				viewId:target
			});
		},
		_logoff : function() {
			
			logger.debug("Logging off...");
			var defr = app.dataModel.act("user.logout");
			defr.then(lang.hitch(app, app._suclogoff));
			var oldUserNode = this.userNode.parentNode;
			this._globalActionsNode.removeChild(oldUserNode);
			this.userNode = null;
			this.user = null;
		},
		_getSelectChildren:function(view){
			console.log("========================>"+view.id);
			var childView=constraints.getSelectedChild(view,"center");
			console.log("========================>Child view id"+childView?childView.id:"Null");
			return childView.views?this._getSelectChildren(childView):childView;
		}
	});
}
);
