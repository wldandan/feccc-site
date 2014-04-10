define("com/spss/ca/View",
		["dojo", 
		 "dojo/_base/lang",
		 "dijit/_WidgetBase", 
		 "dijit/_Container",
		 "dijit/_Contained",
		 "dijit/_TemplatedMixin",
		 "dijit/_WidgetsInTemplateMixin",
		 "dojo/on",
		 "dojo/dom-class",
		 "dojo/_base/Deferred",
		 
		 "dojo/i18n!com/spss/ca/application/nls/message",
		 "dojo/i18n!com/spss/ca/application/nls/application",
		 "dojo/_base/array",
		 "dojo/aspect",
		 "dojo/dom-attr",
		 "dojo/dom-construct",
		 "dojo/dom-geometry",
		 "dojox/mobile/scrollable",
		 "com/spss/ca/Events",
		 "com/spss/ca/util/log/Loggee",
		 "idx/dialogs",
		 "dojo/query",
		 "dojo/touch"
		 ], 
function(dojo, lang,Widget,Container,Contained,TemplatedMixin,WidgetsInTemplateMixin, on,domClass,deferred, i18n,i18nApp,
		array, aspect, domAttr, domCon, domGeo, 
		scrollable, Events,Loggee,dialogs,query,touch) {

	return dojo.declare("com.spss.ca.View", [ Widget,Container,Contained,TemplatedMixin,WidgetsInTemplateMixin,Loggee ], {	
		
		//View config:
		//		allowedPreView: array, specify which view can be pre-view of current view. 
		//						Becareful not circle between two view configuration.
		_bindHandle:[],
		activated:false,
		_editting:false,
		_viewRestoring:false,
		_confirmMsg:i18n["confirmsave"],
		_preview:"",
		//-----
		selected: false,
		keepScrollPosition: true,
		baseClass: "applicationView mblView",
		//config:null,
		widgetsInTemplate: true,
		templateString: '<div></div>',
	//	focusedNode:null,
		toString: function(){return this.id;},
		//--------
		constructor:function(params){
			if(params.render)
			{
				//render is doing some related with ui and special for device work
				var renderClass=params.render;
				var renderController=new renderClass();
				dojo.safeMixin(this,renderController,true);
			}
			if(params.controller)
			{
			var ctor=params.controller;
			var viewController=new ctor();
				dojo.safeMixin(this,viewController);
			}
			
		},
		isView:function(){
			return true;
		},
		startup:function(){
			if(!this._started) {
				this.inherited(arguments);			
				this.doA11y();
	//			if(dojo.global.deviceType!=="desktop")
	//				{
	//					this._initScroller();
	//				}
				this.subscribe("/app/transviewstate/"+this.id,lang.hitch(this,"restoreView"));
			}
		},
		restoreView:function(){
			//This function need to be implemented by view self
			//In this function, view should check url has str first
			//to find if need refresh itself data or not
			this._viewRestoring=true;
		},
		perform:function(methodName,args){
			if(lang.exists(methodName,this)){
			return	this[methodName].apply(this,args);
			}
			else{
				throw new Error("Method not define:"+methodName);
			}
		},
		testPerform:function(msg){
			return this.id+msg;
		},
		
		_getSelfTargetStr:function(){
			var sp=this.domNode.id.split("_");
			sp.shift();
			return sp.join(",");
		},
		canUnload:function(){
			return !this.get("editting");
		},
		viewUnload : function() {
			this.logger.info("Unloading view");
		},
		isItemIncludedInCollection : function(item,  collection) {
			var items = collection.split(";");
			for(var i = 0;i < items.length; i++){
				if (item===items[i]){
					return true;
				}
			}
			return false;
		},		
		canTransout:function(target){
			var ctDefr=new deferred();
			var cf=true;
			var selftarget=this._getSelfTargetStr();
			if(target===selftarget||this.isItemIncludedInCollection(target,selftarget)){
				ctDefr.resolve(true);//trans state in same view;
			}
			else{
				var isEditting=this.get("editting");
				if(isEditting)
				{
					dialogs.confirm(
						i18n["unloadConfirm"],lang.hitch(this,function(){
							
						this.viewUnload(target);
						this.set("editting",false);
						setTimeout(function(){ctDefr.resolve(true);},500);
					}),function(){
						ctDefr.resolve(false);
					});
//				var confirmdef=confirmd("confirmDialog",this._confirmMsg,i18n["btnLeavewithoutsaving"],i18n["btnSaverebuild"],i18n["btnCancel"]);
//					dojo.when(confirmdef,lang.hitch(this,function(result){
//						if(result===1){
//							this.set("editting",false);
//							ctDefr.resolve(cf);							
//						}else if(result===2){
//							dojo.when(this.saveData(),lang.hitch(this,function(sucsave){
//								if(sucsave)
//								ctDefr.resolve(cf);
//								else
//									ctDefr.resolve(false);
//							}));
//						}
//						else{
//							ctDefr.resolve(false);
//						}
//							
//					}));					
				}else
					{
						ctDefr.resolve(cf);
					}	
			}		
			return ctDefr;
		},
		saveData:function(){
			//If this view is editting
			//subclass should save its data first
			// then set editting to false.
			// return :
			// 		If save success return true
			//		else return value.
			this.set("editting",false);
			return false;
		},
		_getEdittingAttr:function(){
			return this._editting;
		},
		_setEdittingAttr:function(value){
			this._editting=value;
		},
		_initScroller:function(){
			//TODO: useless function, remove it at 2.0
			if(this.scrollNode){
				var fixHeaderH=0;
				if(this.viewHead){
					fixHeaderH=20;
				//	this.viewHead.style.zIndex=this.domNode.style.zIndex+1;
				}
				this.scroller=new dojox.mobile.scrollable();
				var scrollparams={
						domNode:this.domNode,
						containerNode:this.scrollNode
					};
				aspect.after(this.scroller,"getDim",lang.hitch(this,function(dim){
					if(dim.o){
						if(this.scroller.isLocalHeader){
							dim.o.h=dim.o.h+dojo.marginBox(this.viewHead.domNode).h;
						}
						
					}
					return dim;
				}));
				if(fixHeaderH){
					scrollparams.fixedHeaderHeight=fixHeaderH;
					scrollparams.isLocalHeader=true;
				}
				this.scroller.init(scrollparams);
				
//				setTimeout(lang.hitch(this,function(){
//					this.scroller.containerNode.style.height="auto";
//				}),300);
			}
		},
		buildRendering:function(){
		 this.inherited(arguments);		
		// this.connect(this.domNode,touch.press,"onTouchStart");
		// on(this.domNode,"focusChanged",lang.hitch(this,"onTouchStart"));
		 on(this.domNode,"scrollNodeIn",lang.hitch(this,"_scinview"));
		 this.doi18n();
	//	 this.connect(this.domNode,"onfocus","_getInput");
		},	
		activate:function(data){
			//summary
			//		This method will be called 
			//		when view become selected view again
			this.inherited(arguments);
			if(this.activated)
				{
					return;
				}
			this.activated=true;
			//this.app.setNavTo(this.id);
			this.logger.info("View activated:"+this.id);
			//this.buildBreadcrumbs();
		},
		buildBreadcrumbs:function(){
			//TODO: useless function, remove it at 2.0
			if(this.breadcrumbs) {
				var brds=[];
				var viewNames=i18nApp["viewNames"];
				for(var i=0;i<this.breadcrumbs.length;i++) {
					var brd=dojo.mixin({},this.breadcrumbs[i]);
					if(brd.label) {
						var sl=brd.label.split(":");
						var nlslabel=viewNames[sl[0]];
						brd.label=nlslabel+(sl[1]?":"+this.app.getParams(sl[1]):"");
					}							
					brds.push(brd);
				}
				dojo.publish(Events.Breadcrumbs.change, {"navs":brds});
			}
		},
		deactivate: function(){
			//summary
			//		This method will be called 
			//		when view become unselected
			this.inherited(arguments);
			if(!this.activated){
				return;
			}
				
			this.activated=false;
			query("*:focus",this.domNode).forEach(function(node){
				if(node.blur){
					node.blur();
				}
			});
			
			this.logger.info("View deactivated:"+this.id);
		},
		uninitialize:function(){
			this.inherited(arguments);
			if(this._bindHandle)
				{
					for(watchHandler in this._bindHandle)
						{
							if(watchHandler.unwatch)
								watchHandler.unwatch();
						}
				}
		},
		resize:function(rect){
			//ADD resize method to get chained call from parent.
			//Views can process resize and orientation change in this method
			//Be aware, can't use screen.width>screen.height to judge orientation
			//because this will not changed when orientation change on IPAD2
			if(rect){
				domGeo.setMarginBox(this.domNode, rect);
			}
			
			var contBox = domGeo.getContentBox(this.domNode);
			this.layout(contBox);
		},
		
		layout: function(contBox) {
			array.forEach(this.getChildren(), function(widget){
				if(widget.resize){
					if(!widget.isView)
					widget.resize();
				}
			});
		},
		
		doi18n:function(){
			//respond for do i18n work for template
		},
		 doA11y:function(){
			 
		 },
		 showInlineMsg:function(msg, type){
			dojo.publish(Events.InlineMessage.show+"." + this.id, {
				"message":msg,
				"type" : (type  ? type : "error")
					});
		 },
		 clearInlineMsg:function(){
			 dojo.publish(Events.InlineMessage.clear+"." + this.id);
		 },
		 _setDataAttr:function(value){
			 if(value&&value.comefrom){
				 this.set("pview",value.comefrom);
				 this.set("purl",value.phash);
			 }
		 },
		 _setPurlAttr:function(value){
			 if(value){
				 this._purl=value.substring(0,value.lastIndexOf("&")); 
			 }else{
				 this._purl=null;
			 }
				 
			 
		 },
		 _setPviewAttr:function(value){
			 if(this.allowedPreView&&lang.isArray(this.allowedPreView)&&array.indexOf(this.allowedPreView,value)!==-1){
				this._preview=value; 
			 }
		 },
		 _getPurlAttr:function(){
			return this._purl ;
		 },
		 _getPviewAttr:function(){
			 if(this._preview){
				 return this._preview;
			 }
				 
			 if(this.allowedPreView&&lang.isArray(this.allowedPreView)){
				 return this.allowedPreView[0];
			 }
				 
		 },
		 _getInput:function(e){
			 var inputNode=e.target;
			 if(inputNode.tagName.toLowerCase==="input"){
				 this.logger.info("Get input");
				 inputNode.scrollIntoViewIfNeeded();
			 }
		 },
		_genParamsFromHash:function(sHash){
				var hash=sHash||decodeURIComponent(window.location.hash);
				if(hash) {
					this.logger.debug("Starting app from hash: " + hash);
					while(hash.charAt(0)==="#"){
						hash=hash.substr(1);
					//	console.log("=========>"+hash);
					}
					if(!hash){
						return null;
					}
						
					var params = hash.split("&");
					var tparams=[];
					for(var i=0;i<params.length;i++){
						if(params[i].indexOf("=")>0){
							tparams.push(params[i]);
						}
						else
							{
								var x=tparams.pop();
								x+="&"+params[i];
								tparams.push(x);
							}
					}
					var up={};
					if(lang.isArray(tparams)){
						for(var i = 0; i < tparams.length; i ++) {
							var str=tparams[i].split("=");
							up[str[0]]=str[1];
						}
					}else{
						for(var x in tparams) {
							var str=tparams[x].split("=");
							up[str[0]]=str[1];
						}
					}
					return up;
				}
				else
					{
						return null;
					}
			},
		    _scinview:function(e){

		   		if(dojo.global.deviceType==="android"){
		   			console.log("---------------->scroller need scroll up to show controll");
		   			e.target.scrollIntoView(false);
		   		}
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
