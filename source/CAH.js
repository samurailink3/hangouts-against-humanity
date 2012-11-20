unique_id = 0;
participantArray = new Array();

gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        //Google API
        initGoogleAPI();

        //hack for Firefox for now
        Ext.resetElement = Ext.getBody();

        //tooltip manager
        Ext.tip.QuickTipManager.init();

        //init data stores
        initDataStores();

        //main app layout
        initLayout();

        //update participants
        sendEvent('updateParticipantsList');

    }
});

//controller functions
function updateParticipantsList() {
    participantArray = gapi.hangout.getEnabledParticipants();
    for (var i=0; i<participantArray.length;i++) {
        var match = playerStore.query("id", participantArray[i].person.id, false, false, true);
        if (match.length == 0) {
            playerStore.add({
                id: participantArray[i].person.id,
                name: participantArray[i].person.displayName,
                imageURL: participantArray[i].person.image.url,
                points: 0
            });
        }
    }
}

//Helper functions
function uniqid()
{
    unique_id++;
    return user.id+unique_id;
}

