var app;

require(["esri/Map",
  "esri/Basemap",
  "esri/views/MapView",
  "esri/views/SceneView",
  "esri/widgets/Search",
  "esri/widgets/ScaleBar",
  "esri/core/watchUtils",
  "dojo/query",

  // Bootstrap
  "bootstrap/Collapse",
  "bootstrap/Dropdown",
  "bootstrap/Tab",

  // Calcite-maps
  "calcite-maps/calcitemaps-v0.3",
  "dojo/domReady!"
], function(Map, Basemap, MapView, SceneView, Search, ScaleBar, watchUtils, query) {

  // App
  app = {
    scale: 4600000,
    center: [-111.3, 39.4],
    initialExtent: null,
    basemap: "topo",
    viewPadding: {
      top: 50, bottom: 0
    },
    uiPadding: {
      top: 15, bottom: 15
    },
    mapView: null,
    sceneView: null,
    activeView: null,
    searchWidgetNav: null
  };



  // 2d MapView
  var mapView = new Map({
    basemap: app.basemap
  });
  app.mapView = new MapView({
    container: "mapViewDiv",
    map: new Map( { basemap: app.basemap, constraints: { snapToZoom: false } } ),
    scale: app.scale,
    center: app.center,
    padding: app.viewPadding,
    ui: {
      components: ["zoom", "compass", "attribution"],
      padding: app.uiPadding
    }
  });


  // 3d SceneView
  var mapScene = new Map({
    basemap: app.basemap,
    ground: "world-elevation"
  });
  app.sceneView = new SceneView({
    container: "sceneViewDiv",
    map: new Map( { basemap: app.basemap, ground: "world-elevation", constraints: { snapToZoom: false } } ),
    scale: app.scale,
    center: app.center,
    padding: app.viewPadding,
    ui: {
      padding: app.uiPadding
    }
  });
  app.activeView = app.sceneView;




  app.activeView.then(function() {
    app.initialExtent = app.activeView.extent;
  });

  app.scaleBar = new ScaleBar({
    view: app.activeView,
    unit: "dual"
  });

  app.mapView.ui.add(app.scaleBar, {
          position: "bottom-left"
        });

  // Search Widgets
  app.searchWidgetNav = createSearchWidget("searchNavDiv");

  function createSearchWidget(parentId) {
    var search = new Search({
      viewModel: {
        view: app.activeView,
        highlightEnabled: false,
        popupEnabled: true,
        showPopupOnSelect: true
      }
      }, parentId);
    search.startup();
    return search;
  }

  // Popup and Panel Events

  // Views - Listen to view size changes to show/hide panels
  app.mapView.watch("size", viewSizeChange);
  app.sceneView.watch("size", viewSizeChange);

  function viewSizeChange(screenSize) {
    if (app.screenWidth !== screenSize[0]) {
      app.screenWidth = screenSize[0];
      setPanelVisibility();
    }
  }

  // Popups - Listen to popup changes to show/hide panels
  app.mapView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);
  app.sceneView.popup.watch(["visible", "currentDockPosition"], setPanelVisibility);

  // Panels - Show/hide the panel when popup is docked
  function setPanelVisibility() {
     var isMobileScreen = app.activeView.widthBreakpoint === "xsmall" || app.activeView.widthBreakpoint === "small",
      isDockedVisible = app.activeView.popup.visible && app.activeView.popup.currentDockPosition,
      isDockedBottom = app.activeView.popup.currentDockPosition && app.activeView.popup.currentDockPosition.indexOf("bottom") > -1;
    // Mobile (xsmall/small)
    if (isMobileScreen) {
      if (isDockedVisible && isDockedBottom) {
        query(".calcite-panels").addClass("invisible");
      } else {
        query(".calcite-panels").removeClass("invisible");
      }
    } else { // Desktop (medium+)
      if (isDockedVisible) {
        query(".calcite-panels").addClass("invisible");
      } else {
        query(".calcite-panels").removeClass("invisible");
      }
    }
  }

  // Panels - Dock popup when panels show (desktop or mobile)
  query(".calcite-panels .panel").on("show.bs.collapse", function(e) {
    if (app.activeView.popup.currentDockPosition || app.activeView.widthBreakpoint === "xsmall") {
      app.activeView.popup.dockEnabled = false;
    }
  });

  // Panels - Undock popup when panels hide (mobile only)
  query(".calcite-panels .panel").on("hide.bs.collapse", function(e) {
    if (app.activeView.widthBreakpoint === "xsmall") {
      app.activeView.popup.dockEnabled = true;
    }
  });

  // Tab Events (Switch Map & Scene Views on click)
  query(".calcite-navbar li a[data-toggle='tab']").on("click", function(e) {
    syncTabs(e);
    if (e.target.text.indexOf("Map") > -1) {
      syncViews(app.sceneView, app.mapView);
      app.activeView = app.mapView;
    } else {  //Scene selected
      syncViews(app.mapView, app.sceneView);
      app.activeView = app.sceneView;
    }
    syncSearch();
  });

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
  function syncSearch() {
    app.searchWidgetNav.viewModel.view = app.activeView;
    // Sync
    if (app.searchWidgetNav.selectedResult) {
      app.searchWidgetNav.search(app.searchWidgetNav.selectedResult.name);
    }
    app.activeView.popup.reposition();
 
  }

  // Basemap events
  query("#selectBasemapPanel").on("change", function(e){
    app.mapView.map.basemap = e.target.options[e.target.selectedIndex].dataset.vector;
    app.sceneView.map.basemap = e.target.value;
  });

  // Collapsible popup (optional)
  query(".esri-popup .esri-title").on("click", function(e){
    query(".esri-popup .esri-container").toggleClass("esri-popup-collapsed");
    app.activeView.popup.reposition();
  });

  // Toggle navigation menu
  function closeMenu() {
    if (query(".calcite-dropdown.open")[0]) {
      query(".calcite-dropdown, .calcite-dropdown-toggle").removeClass("open");
    }
  }
  // Listen for clicks away from menu
  app.mapView.on("click", function(e) {
    closeMenu();
  });

  app.sceneView.on("click", function(e) {
    closeMenu();
  });

});
