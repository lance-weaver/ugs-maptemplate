/*   UGS boilerplate template for calcite   */

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-11759067-12', 'auto');
ga('send', 'pageview');


require([
  "esri/Map",
  "esri/Basemap",
  "esri/layers/TileLayer",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/widgets/Home",
  "esri/widgets/Search",
  "esri/widgets/ScaleBar",
  "esri/widgets/Locate",
  "esri/core/watchUtils",
  "dojo/query",
  "dojo/dom-style",
  "dijit/form/HorizontalSlider",

  // Bootstrap
  "bootstrap/Collapse",
  "bootstrap/Dropdown",
  "bootstrap/Tab",
  "bootstrap/Button",
  "bootstrap/Tooltip",

  // Calcite-maps
  "calcite-maps/calcitemaps-v0.5",
  "dojo/domReady!"
], function(Map, Basemap, TileLayer, MapView, SceneView, Home, Search, ScaleBar, Locate, watchUtils, query, domStyle, HorizontalSlider) {

  console.log("loading UGS calcite template...");
  // use this to make reloads get current state?
  //window.onbeforeunload = viewToURL();  //for this to work, edit the viewtourl function a bit...

  // get the uri variables and store them in the global app[] array
  function URLToArray(url) { //decode the URL, put vars in array
     //var request = [];
	 var nohash = url.replace("#", "");
     var pairs = nohash.substring(url.indexOf('?') + 1).split('&');
     for (var i = 0; i < pairs.length; i++) {
       if (!pairs[i])
         continue;
       var pair = pairs[i].split('=');
       app[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
     }
     //console.log(app);
  }
  URLToArray(document.location.href);
  //console.log(app);

    // must be global to access layers
    var map = new Map({
        basemap: app.basemap, // "satellite", "hybrid", "terrain", "topo", "gray", "dark-gray", "oceans", "osm", "national-geographic", "Topographic", topo-vector,
        //logo: false,
        ground: "world-elevation" //turn elevation on or off
    });

    //test for mobile device and adjust map accordingly
  	if (/iPhone|iPad|iPod|Mini/i.test(navigator.userAgent)) {
        // allow only mapview for iphones
        app.mview = "map";
        query("a[href='#3dTab']").addClass("hidden");   // 
        query(".dropdown-menu").query(".hidden-md.hidden-lg").addClass("hidden");   // not working?
    } else if (/Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        // make mapview the default view for adroid mobile too.  Do we want this?
        //app.mview = "map";
    } else {
        // make search expanded by default on desktops
        query(".calcite-navbar-search").removeClass("calcite-search-expander");
    }

  // check url params to see whether to load mapview or sceneview
  if (app.mview == "map"){    // or $.inArray()  or  dojo.indexOf(array, value)

        // 2d mapview
        app.view = new MapView({
          container: "mapViewDiv",
          map: map,
          scale: app.scale,
          center: app.center.split(','),
          padding: app.viewPadding,
		  constraints: {
			rotationEnabled: false
		  },
          ui: {
            components: ["zoom", "compass", "attribution"],
            padding: app.uiPadding
          }
        });

        query("#3dTab").removeClass("in active");
        query("#2dTab").addClass("in active");
        query(".navbar-nav li.active").removeClass("active"); // remove 'active' class on whichever is selected
        query("#mapNav").parent().addClass("active");   // add active to <li> holding 2d tab

  } else {

      // 3d SceneView
      app.view = new SceneView({
        container: "sceneViewDiv",
        map: map,
        scale: app.scale,
        center: app.center.split(','),
        padding: app.viewPadding,
        highlightOptions: {
          color: [255, 241, 58],
          fillOpacity: 0.4
        },
        ui: {
          components: ["zoom", "compass", "navigation-toggle", "attribution"],
          padding: app.uiPadding
        }
      });
	  app.mview == "scene";

      query("#2dTab").removeClass("in active");
      query("#3dTab").addClass("in active");
      query(".navbar-nav li.active").removeClass("active");
      query("#sceneNav").parent().addClass("active");

  }  //end check uri



  // no need for seperate views anymore
  //app.view = app.activeView;


  app.view.then(function() {
    //console.log(app.view.extent);
    app.initialExtent = app.view.extent;
  });

  // adds the home widget to the top left corner of the View
  app.homeWidget = new Home({
    view: app.view
  });
  app.view.ui.add(app.homeWidget, "top-left");

  // adds the scalebar to the bottom left corner of the MapView
  app.scaleBar = new ScaleBar({
    view: app.view,
    unit: "dual"
  });
  app.view.ui.add(app.scaleBar, {
    position: "bottom-left"
  });

  // Search Widgets
  app.searchWidgetNav = createSearchWidget("searchNavDiv");

  function createSearchWidget(parentId) {
    var search = new Search({
      minSuggestCharacters: 2,
      //popupEnabled: true,
      //popupOpenOnSelect: true,
      viewModel: {
        view: app.view,
        //highlightEnabled: true,
      }
      }, parentId);
    //search.startup();
    //console.log(search);
    return search;
  }


  // set the Info Panel max-height onload (calcite defaul is max 500px)
  // css defaults to 500, 383, 272 and 160 respectively for dif screen sizes... we make it much bigger here.
  setPanelHeight([0,app.view.height]);
  // set the Info Panel max-height on resize
  app.view.watch("size", setPanelHeight);

  function setPanelHeight(screenSize) {
    var value = screenSize[1] - 150 + "px";
    var cpanel = query(".panel-body");
    cpanel.forEach(function (div, i) {
      domStyle.set(div, "max-height", value);
    });
    // don't let stacked panels go bigger than viewport either
    domStyle.set(query(".calcite-panels")[0], "max-height", value);
  }


  // Popup and Panel Events

  // Views - Listen to view size changes to show/hide panels
  app.view.watch("size", viewSizeChange);
  //app.sceneView.watch("size", viewSizeChange);

  // listen for window resize, dock popup when small enough
  function viewSizeChange(screenSize) {
    if (app.screenWidth !== screenSize[0]) {
      app.screenWidth = screenSize[0];
      setPanelVisibility();
    }
  }

  // Popups - Listen to popup changes to show/hide panels
  app.view.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);
  //app.sceneView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);

  // Panels - Temporarily hide the calcite panel when popup is manually docked (mobile OR desktop)
  // show the calcite panel again if docked popup is closed
  function setPanelVisibility() {
     var isMobileScreen = app.view.widthBreakpoint === "xsmall" || app.view.widthBreakpoint === "small",
      isDockedVisible = app.view.popup.visible && app.view.popup.currentDockPosition,
      isDockedBottom = app.view.popup.currentDockPosition && app.view.popup.currentDockPosition.indexOf("bottom") > -1;
    // Mobile (xsmall/small)
    if (isMobileScreen) {
      if (isDockedVisible && isDockedBottom) {
        query(".calcite-panels").addClass("invisible");
      } else {
        query(".calcite-panels").removeClass("invisible");
      }
    } else {  // Desktop (medium+)
      if (isDockedVisible) {
        query(".calcite-panels").addClass("invisible");
      } else {
        query(".calcite-panels").removeClass("invisible");
      }
    }
  }

  // These two functions dock and undock the esri popup on mobile
  // if a calcite panel is open or opened the popup will show on map insted of on the bottom dock
  // not sure if I like it... I think I like the popup to ALWAYS be docked,
  // but this allows you to keep a popup open WHILE changing opacity, layers, etc.. so has benifits

  // Calcite Panels - unDock popup when panels show (desktop or mobile)
  query(".calcite-panels .panel").on("show.bs.collapse", function(e) {     // fire when any panel shows
    if (app.view.popup.currentDockPosition || app.view.widthBreakpoint === "xsmall") {
      app.view.popup.dockEnabled = false;   // keep popup dock off on desktop or turn it off when a panel opens on mobile
    }
  });
  // Calcite Panels - Dock popup when panels hide (mobile only)
  query(".calcite-panels .panel").on("hide.bs.collapse", function(e) {    // fire when any panel hides
    if (app.view.widthBreakpoint === "xsmall") {
      app.view.popup.dockEnabled = true;    // enable popup dock on mobile when closing calcite panel
    }
  });

  // share button controls
  query(".dropdown-menu").on("click", function(e){
    //console.log(e);
    if (e.target.text == " Share"){
        var appUri = window.location.href;
        var params = viewToURL();
        var txt = appUri+"?mview=map"+params;
        $(".textarea").text(txt);
        //var div = document.getElementsByClassName("textarea");
        //div.innerHTML = txt;
    }
  });

  //geolocate widget
  app.locate = new Locate({
      view: app.view
  });

  // geolocate user position
  query(".dropdown-menu").on("click", function(e){
        if (e.target.text == " Locate"){
            app.locate.locate().then(function(){
              // do we want to add a note to user?
              if (query(".calcite-dropdown.open")[0]) {
                query(".calcite-dropdown, .calcite-dropdown-toggle").removeClass("open");
              } // end if
            }) // end .then
        } // end if
    }); // end query

  // Tab Events (reload page to Switch Map & Scene Views on click)
  query(".navbar-nav li a[data-toggle='tab']").on("click", function(e) {
    var params = viewToURL();
    //syncTabs(e);
    if (e.target.id == "mapNav") {
      window.location.search = '?mview=map'+params;   //setting the .search property, appends the variables to the url
      //syncViews(app.sceneView, app.mapView);
      //app.view = app.mapView;
    } else {  //Scene selected
      window.location.search = '?mview=scene'+params;
      //syncViews(app.mapView, app.sceneView);
      //app.view = app.sceneView;
    }
    //syncSearch();
  });

    // Tab Events on drop down hamburger menu (for adroid mobile devices)
    query(".dropdown-menu").on("click", function(e){
      var params = viewToURL();
      if (e.target.id == "mapNavMbl"){
        window.location.search = '?mview=map'+params;   //setting the .search property, appends the variables to the url
      } else {  //Scene selected
        window.location.search = '?mview=scene'+params;
      } // end if
  }); // end query

    // if there are open panels in switch from 2d to 3d, set them
  function restoreOpenPanels() {
    if (app.panels){
        query(".panel.in").removeClass("in");   //close any open panels
        query(".panel-collapse").removeClass("in");

        //query('#'+app.panels).addClass("in");
        query('#'+app.panels).collapse('show');
        query('#'+app.panels).parent().collapse('show');
    }
  }
  restoreOpenPanels();

  // Save the map state to URL so switching between map & scene saves the view
  function viewToURL(){;
    app.state = "&center="+ app.view.center.longitude.toFixed(5)+","+app.view.center.latitude.toFixed(5);
    app.state += "&scale="+ app.view.scale.toFixed(0);
    app.state += "&basemap="+ app.view.map.basemap.id;
    var openpanels = query(".panel-collapse.in");   // get id of any open panel bodies
    if (openpanels[0]){
        app.state += "&panels="+ openpanels[0].id; // store in url. ex. collapseLegend
    }
    //app.state += "&tilt="+ app.view.camera.tilt;   //no tilt cant be tranfered between views?
    //app.state += "&layers="+ //add visible layers here
    return app.state;
  }
/*
  // Toggle Map & Scene Tabs
  function syncTabs(e) {
    query(".calcite-navbar li.active").removeClass("active");
    query(e.target).addClass("active");
  }

  // Views
  function syncViews(fromView, toView) {
    watchUtils.whenTrueOnce(toView, "ready").then(function(result) {
      watchUtils.whenTrueOnce(toView, "stationary").then(function(result) {
        toView.goTo(fromView.viewpoint);
        toView.popup.reposition();
      });
    });
  }

  // Search Widgets
  // when switching between map and scene, keep search results
  function syncSearch() {
    app.searchWidgetNav.viewModel.view = app.view;
    // Sync
    if (app.searchWidgetNav.selectedResult) {
      app.searchWidgetNav.search(app.searchWidgetNav.selectedResult.name);
      console.log("selectedResult")
    }
    app.view.popup.reposition();
    console.log("No selectedResult")
  }

*/

  // Basemap events
  query("#selectBasemapPanel").on("change", function(e){
    console.log("change the basemap");
    if (e.target.value == "ustopo"){
        // setup the ustopo basemap global variable.
        var ustopo = new Basemap({
            baseLayers: new TileLayer({
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer"
            }),
            title: "usTopographic",
            id:"ustopo"
        });
        app.view.map.basemap = ustopo;
      // if mapview use basemaps defined in the value-vector=, but if mapview use value=
    } else if (app.mview == "map"){
      app.view.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
      //app.view.map.basemap = e.target.value;
    } else {  // =="scene"
      app.view.map.basemap = e.target.value;
    }
  });

  // Collapsible & resizable popup (optional)   -not supported in 4.x
  query(".esri-popup").on("click", function(e){
    query(".esri-popup .esri-container").toggleClass("esri-popup-collapsed");
    app.view.popup.reposition();
  });

  // Toggle navigation menu
  function closeMenu() {
    if (query(".calcite-dropdown.open")[0]) {
      query(".calcite-dropdown, .calcite-dropdown-toggle").removeClass("open");
    }
  }
  // Listen for clicks away from menu
  app.view.on("click", function(e) {
    closeMenu();
  });



  // fullscreen for android devices
  query("#calciteToggleNavbar").on("click", function(e){
      		if(navigator.userAgent.match(/(iPhone|iPod|iPad)/i)){
      			// give a not saying not supported in apple devices?
            alert("true fullscreen unavailable in apple devices");
      		} else if (!document.fullscreenElement &&    // alternative standard method
      			  !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
        			if (document.documentElement.requestFullscreen) {
        			  document.documentElement.requestFullscreen();
        			} else if (document.documentElement.msRequestFullscreen) {
        			  document.documentElement.msRequestFullscreen();
        			} else if (document.documentElement.mozRequestFullScreen) {
        			  document.documentElement.mozRequestFullScreen();
        			} else if (document.documentElement.webkitRequestFullscreen) {
        			  document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        			}
      		} else {
        			if (document.exitFullscreen) {
        			  document.exitFullscreen();
        			} else if (document.msExitFullscreen) {
        			  document.msExitFullscreen();
        			} else if (document.mozCancelFullScreen) {
        			  document.mozCancelFullScreen();
        			} else if (document.webkitExitFullscreen) {
        			  document.webkitExitFullscreen();
        			}
      		}
          // cancel calcite's default behavior of hiding the nav bar
          query("body").removeClass("calcite-nav-hidden");
	});  // end click

   // dojo rangeslider for opacity
   var opslider = new HorizontalSlider({
       name: "slider",
       value: 0.8,
       minimum: 0,
       maximum: 1,
       discreteValues: 11,
       intermediateChanges: true,
       style: "width:300px;",
       onChange: function(value){
          app.view.map.layers.forEach(function (lyr, i) {
            lyr.opacity = value;
          });
       }
   }, "opacitySlider").startup();
    //}, "opacitySlider");



    /******************************************************************
     * Apply Calcite Maps CSS classes to change application on the fly
     *
     * For more information about the CSS styles or Sass build visit:
     * http://github.com/esri/calcite-maps
     ******************************************************************/


      var cssSelectorUI = ".calcite-navbar, .calcite-panels",
      cssSelectorMap = ".calcite-map";

      // Theme - light (default) or dark theme
      query("#settingsTheme").on("change", function(e) {
        var textColor = e.target.options[e.target.selectedIndex].dataset
          .textcolor,
          bgColor = e.target.options[e.target.selectedIndex].dataset.bgcolor;
        query(cssSelectorUI).removeClass(
          "calcite-text-dark calcite-text-light calcite-bg-dark calcite-bg-light calcite-bg-custom"
        ).addClass(textColor + " " + bgColor);
        query(cssSelectorUI).removeClass(
          "calcite-bgcolor-dark-blue calcite-bgcolor-blue-75 calcite-bgcolor-dark-green calcite-bgcolor-dark-brown calcite-bgcolor-darkest-grey calcite-bgcolor-lightest-grey calcite-bgcolor-black-75 calcite-bgcolor-dark-red"
        ).addClass(bgColor);
        query("#settingsColor").attr("value", "");
      });

      // Color - custom color
      query("#settingsColor").on("change", function(e) {
        var customColor = e.target.value,
          textColor = e.target.options[e.target.selectedIndex].dataset.textcolor,
          bgColor = e.target.options[e.target.selectedIndex].dataset.bgcolor;
        query(cssSelectorUI).removeClass(
          "calcite-text-dark calcite-text-light calcite-bg-dark calcite-bg-light calcite-bg-custom"
        ).addClass(textColor + " " + bgColor);
        query(cssSelectorUI).removeClass(
          "calcite-bgcolor-dark-blue calcite-bgcolor-blue-75 calcite-bgcolor-dark-green calcite-bgcolor-dark-brown calcite-bgcolor-darkest-grey calcite-bgcolor-lightest-grey calcite-bgcolor-black-75 calcite-bgcolor-dark-red"
        ).addClass(customColor);
        if (!customColor) {
          on.emit(query("#settingsTheme")[0], "change", {
            bubbles: true,
            cancelable: true
          });
        }
      });

      // Widgets - light (default) or dark theme
      query("#settingsWidgets").on("change", function(e) {
        var theme = e.target.value;
        query(cssSelectorMap).removeClass(
          "calcite-widgets-dark calcite-widgets-light").addClass(
          theme);
      });

      // Layout - top or bottom nav position
      query("#settingsLayout").on("change", function(e) {
        var layout = e.target.value;
        var layoutNav = e.target.options[e.target.selectedIndex].dataset
          .nav;
        query("body").removeClass("calcite-nav-bottom calcite-nav-top")
          .addClass(layout);
        query("nav").removeClass("navbar-fixed-bottom navbar-fixed-top")
          .addClass(layoutNav);
        setViewPadding(layout);
      });




}); // end require
