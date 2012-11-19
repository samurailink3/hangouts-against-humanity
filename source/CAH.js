gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        //Google API
        initGoogleAPI();

        //hack for Firefox for now
        Ext.resetElement = Ext.getBody();

        //tooltip manager
        Ext.tip.QuickTipManager.init();

        //main app layout
        initLayout();
    }
});

//Helper functions
function uniqid()
{
    unique_id++;
    return user.id+unique_id;
}