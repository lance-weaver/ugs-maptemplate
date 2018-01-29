/*   UGS boilerplate template for calcite   */


// wrap all our code in a viewloaded function... which will repeadetly check if view is loaded before running page
var checkLoaded = setInterval(function() {
   // if view is loaded run this page, else try again every 100ms
   if (app.view) {
      viewloaded();
      clearInterval(checkLoaded);
      console.log("Loading Project Javascript: Success!");
  } else {
      console.log("Loading Project Javascript: View not ready. Trying again...");
  }
}, 100); // check every 100ms
var viewloaded = function(){


require([

    "esri/widgets/Search",
    "esri/layers/FeatureLayer",

], function(
Search, FeatureLayer
) {

		//  set the title of the app (note: web crawlers may not see this!)
		document.getElementById("subTitle").innerHTML = "My Project Name";
		document.title = "My Project Name";
	
	
	
      // show or hide any open calicite panels when user clicks for attribute details
      function showHideCalcitePanels(showPanel, showCollapse){
        // hide all windows
        //query(".panel-collapse").query(".panel .in").collapse("hide");   //close any open panels
        query(".panel.in").removeClass("in");   //close any open panels
        query(".panel-collapse").removeClass("in");

        // if specified show this calcite panel
        if (showPanel){
          //query(showPanel).query(showCollapse).addClass("in");
          query(showPanel).collapse("show");    // so I use these instead
          query(showCollapse).collapse("show");
        }
      }
	  
	  
	  /*    start all your custom code here  */
	  
	  
	  


});  //end require

} // end viewloaded wrapper function