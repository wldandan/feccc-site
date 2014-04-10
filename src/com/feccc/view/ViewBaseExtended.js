define(["dojo/_base/declare",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dojox/app/ViewBase",
        "dojo/Deferred",
        "dojo/when",
        "com/spss/ca/View",
        "dojox/app/utils/constraints","dojox/app/utils/nls"],function(declare,lang,domConstruct,ViewBase,Deferred,when,ViewWidget,constraints, nls){
	return declare("com.spss.ca.ViewBaseExtended",ViewBase,{
		_active:false,
		resize:function(){
			if(this.viewWidget){
				this.viewWidget.resize();
			}
		},
		load:function(){
			var loadDeferred=new Deferred();
			this.viewparams={};
			if(this.parent.views&&this.name&&this.parent.views[this.name]){
				lang.mixin(this.viewparams, this.parent.views[this.name]);
			}
			//this.viewparams=?lang.clone(this.parent.views[this.name]):{};
			if(this.app){
				this.viewparams.app=this.app;
			}
			
			var nlsDef = nls(this);
			this.viewparams.viewContainer=this;
			when(nlsDef, lang.hitch(this, function(nls){
				// we inherit from the parent NLS
				this.nls = {};
				if(nls){
					// make sure template can access nls doing ${nls.myprop}
					lang.mixin(this.nls, nls);
				}
				when(this._loadClass("controller"),lang.hitch(this,function(controllerDef){
					if(this.controller){
						this.viewparams.controller=controllerDef;
					}
					when(this._loadClass("render"),lang.hitch(this,function(renderDef){
						if(this.render){
							this.viewparams.render=renderDef;
						}
						if(this.template&&!this.templateString){
							when(this._loadTemplate(),lang.hitch(this,function(template){
								this.viewparams.templateString=template[template.length-1];
								loadDeferred.resolve(true);
							}));
						}else{
							if(this.templateString){
								this.viewparams.templateString=this.templateString;
							}
							loadDeferred.resolve(true);
						}
					}));
				}));
			}));
			return loadDeferred;
		},
		isActive:function(){
			return this._active;
		},
		_loadClass:function(key){
			var viewControllerDef = new Deferred();
			var path;

			if(!this[key]){ // no longer using this.controller === "none", if we dont have one it means none.
				this.app.log("  > in app/ViewBase _loadViewController no controller set for view name=[",this.name,"], parent.name=[",this.parent.name,"]");
				viewControllerDef.resolve(true);
				return viewControllerDef;
			}else if (lang.isArray(this[key])){
				path=[];
				for(var i=0;i<this[key].length;i++){
					path.push(this[key][i].replace(/(\.js)$/, ""));
				}
			}else{
				path = this[key].replace(/(\.js)$/, "");
			}

			var requireSignal;
			try{
				var loadFile = path;
				var index = loadFile.indexOf("./");
				if(index >= 0){
					loadFile = path.substring(index+2);
				}
				requireSignal = require.on("error", function(error){
					if(viewControllerDef.isResolved() || viewControllerDef.isRejected()){
						return;
					}
					if(error.info[0] && (error.info[0].indexOf(loadFile) >= 0)){
						viewControllerDef.resolve(false);
						requireSignal.remove();
					}
				});

				if(path.indexOf("./") == 0){
					path = "com/spss/ca/application/"+path;
				}
				if(lang.isArray(path)){
					if(path.length===0){
						viewControllerDef.resolve(true);
						requireSignal.remove();
					}else
						{
							require(path, function(){
								viewControllerDef.resolve(true);
								requireSignal.remove();
							});
						}
				}else{
					require([path], function(controller){
						viewControllerDef.resolve(controller);
						requireSignal.remove();
					});
				}
				
			}catch(e){
				viewControllerDef.reject(e);
				if(requireSignal){
					requireSignal.remove();
				}
			}
			return viewControllerDef;
		},
		_loadTemplate: function(){
			// summary:
			//		load view HTML template and dependencies.
			// tags:
			//		private
			//

			if(this.templateString){
				return true;
			}else{
				var tpl = this.template;
				var deps = this.dependencies?this.dependencies:[];
				if(tpl){
					if(tpl.indexOf("./") == 0){
						tpl = "com/spss/ca/application/"+tpl;
					}
					deps = deps.concat(["dojo/text!"+tpl]);
				}
				var def = new Deferred();
				if(deps.length > 0){
					var requireSignal;
					try{
						requireSignal = require.on("error", lang.hitch(this, function(error){
							if(def.isResolved() || def.isRejected()){
								return;
							}
							if(error.info[0] && error.info[0].indexOf(this.template) >= 0 ){
								def.resolve(false);
								requireSignal.remove();
							}
						}));
						require(deps, function(){
							def.resolve.call(def, arguments);
							requireSignal.remove();
						});
					}catch(e){
						def.resolve(false);
						if(requireSignal){
							requireSignal.remove();
						}
					}
				}else{
					def.resolve(true);
				}
				return def;
			}
		},
		_startup:function(){
			this.viewWidget=new ViewWidget(this.viewparams);
			this.domNode=this.viewWidget.domNode;
			this.inherited(arguments);
		},
		startup:function(){
			this.viewWidget.startup();
		},
		beforeActivate: function(from,data){
			if(this.viewWidget.loadModel){
				if(data && data.passingData){
					this.viewWidget.loadModel(data.passingData);
				}else{
					var url =  window.location.href;
					var params = url.split("&");
					params.shift(0);
					var jsonData = {};
					for ( var i = 0; i < params.length; i++) {
						var param = params[i].split("=");
						jsonData[param[0]] = param[1];
					}
					this.viewWidget.loadModel(jsonData);
				}
			}
			this.initHeader(from,data);
		},
		initHeader : function(from,data){
			//	TODO  need to add ut, now I didn't add ut for this change because of its not a final way to initial data model here, the new solution will be find ASAP, and the ut will cover this logic later.
			// summary:
			//		view life cycle beforeActivate()
			var viewArray = this.id.split("_");
			var view = app;
			viewArray.splice(0,1);
			var length = viewArray.length;
			for ( var i = 0; i < viewArray.length - 1; i++) {
				if(view.views[viewArray[i]] && view.views[viewArray[i]].defaultView && view.views[viewArray[i]].defaultView === viewArray[i + 1]){
					length --;
					break;
				}
				view = view.views[viewArray[i]];
			}
			if(length < 3 && (!this.parent.header || !this.parent.header.visible)){
				app.appHeader.refreshHeader();
				if(app.appHeader.breadcrumbs){
					app.appHeader.breadcrumbs.clear();
				}
			}else if(this.parent.header && this.parent.header.type !== 'dd'){
				app.appHeader.clearDropDown();
			}
			if((this.header && this.header.visible)){
//				app.appHeader.navigation.getChildren()[1].set("selected",true);
				app.appHeader.set('secondaryBannerType',"lightgrey");
				if(this.header.type === 'label'){
					var title = this.title || this.nls.name || this.nls.pageTitle;
					var target = viewArray.join(",");
					if(this.id.indexOf("dataSources") > -1 && this.nls.name){
						var datasourceName = app.dataModel.get("datasource.usersetting.currentDataSourceName");
						if(datasourceName.then){
							datasourceName.then(lang.hitch(this, function(name){
								title = dojo.string.substitute(this.nls.name,[name]);
							this.title = title;
							}));
						}else if(datasourceName){
							title = dojo.string.substitute(this.nls.name,[datasourceName]);
							this.title = title;
						}
					}
					if(this.target){
						target = this.target;
					}else if(this.id.indexOf("dataSources") > -1 && (data && data.passingData)){
						target += "&id=" + data.passingData.id;
						this.target = target;
					}
					app.appHeader.addPageTitle(title);
					app.appHeader.addBreadcrumb(title,title,target);
				}else if(this.header.type === 'dd'){
					var project = app.dataModel.get("project.usersetting.currentproject");
					app.appHeader.renderDropDown(project);
				}else{
					app.appHeader.refreshHeader();
					app.appHeader.renderTabHeader(this.viewWidget.getChildren()[0].id);
					var project = app.dataModel.get("project.usersetting.currentproject");
					app.appHeader.renderDropDown(project);
				}
			}
			
		
		},
		afterActivate: function(from,data){
			// summary:
			//		view life cycle afterActivate()
			if(this.viewWidget&&this.viewWidget.activate){
				var passingData=null;
				if(data){
					var targetId="CA_"+data.data.target.split(",").join("_");
					if(targetId===this.id){
						this.viewWidget.set("data",data.data);
						passingData=data.passingData;
						if(this.app.appHeader.getBackTarget){
							this.app.appHeader.getBackTarget();
						}
						
					}				
				}
				this.viewWidget.activate(passingData);
			}
//			this.viewWidget.restoreView();
			this._active=true;
			if(this.viewWidget.btnDiv){
				domConstruct.place(this.viewWidget.btnDiv,app.appHeader.secondaryBannerNode);
			}
		},

		beforeDeactivate: function(){
			// summary:
			//		view life cycle beforeDeactivate()
			if(this.viewWidget.btnDiv){
				domConstruct.place(this.viewWidget.btnDiv,this.viewWidget.domNode);
			}
			this._active=false;
			if(this.viewWidget&&this.viewWidget.deactivate){
				this.viewWidget.deactivate();
			}
		},

		afterDeactivate: function(){
			// summary:
			//		view life cycle afterDeactivate()
		},

		destroy: function(){
			// summary:
			//		view life cycle destroy()
			for(var childViewName in this.children){
				var childView=this.children[childViewName];
				if(childView.destroy){
					childView.destroy();
				}
			}
			if(this.viewWidget){
				this.viewWidget.destroyRecursive();
			}
			if(this.parent&&this.parent.children){
				delete this.parent.children[this.id];
			}
			delete this.viewparams;
			delete this.controller;
			delete this.render;
			delete this.templateString;
			delete this;
		},
		canTransout:function(target){	
				return this.viewWidget.canTransout(target);
		}
	});
	
});