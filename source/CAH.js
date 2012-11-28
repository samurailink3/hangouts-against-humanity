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
        defaultFeed = gapi.hangout.layout.getDefaultVideoFeed();
        videoCanvas = gapi.hangout.layout.getVideoCanvas();
        //video canvas for reader
        readerVideoWindow = Ext.create('Ext.window.Window', {
            title:'Video',
            id:'readerVideoWindow',
            width:300,
            height:200,
            autoShow: true,
            closable: false,
            collapsible: false,
            resizable: false,
            shadow: false,
            listeners : {
                'move' : function(win,x,y,opt){
                    videoCanvas.setPosition(x+5,y+28);
                    videoCanvas.setVisible(true);
                }
            }
        });
        $('#readerVideoWindow').mousedown(function () {videoCanvas.setVisible(false);});
        resetVideoWindow();

        var pancakes = gapi.hangout.av.effects.createImageResource('http://tabletopforge.com/CAH/img/winner_pancakes.png');
        pancakesOverlay = pancakes.createFaceTrackingOverlay({
            'trackingFeature': gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT,
            'scaleWithFace': true,
            'rotateWithFace': true,
            'scale': 1.0});

        winnerSound = gapi.hangout.av.effects.createAudioResource(
            'http://tabletopforge.com/CAH/img/Winner.wav').createSound({loop: false, localOnly: false});
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
                points: 0,
                displayIndex: 0 || participantArray[i].displayIndex,
                participantID: participantArray[i].id
            });
        }
    }
    Ext.getCmp('playerGrid').store.sort([
        { property: 'displayIndex',  direction: 'ASC' },
        { property: 'name', direction: 'ASC' }
    ]);
}

//Helper functions
function uniqid()
{
    unique_id++;
    return user.id+unique_id;
}

function resetVideoWindow() {
    readerVideoWindow.alignTo(Ext.getBody(), "tr-tr", [-10, 10]);
    videoCanvas.setWidth(readerVideoWindow.getWidth()-19);
    videoCanvas.setVideoFeed(defaultFeed);
    var pos = readerVideoWindow.getPosition();
    videoCanvas.setPosition(pos[0]+5, pos[1]+28);
    videoCanvas.setVisible(true);

}

function createTextOverlay(string) {
    // Create a canvas to draw on
    var canvas = document.createElement('canvas');
    canvas.setAttribute('width', 166);
    canvas.setAttribute('height', 100);

    var context = canvas.getContext('2d');

    // Draw background
    context.fillStyle = '#BBB';
    context.fillRect(0,0,166,50);

    // Draw text
    context.font = '32pt Impact';
    context.lineWidth = 6;
    context.lineStyle = '#000';
    context.fillStyle = '#FFF';
    context.fillColor = '#ffff00';
    context.fillColor = '#ffff00';
    context.textAlign = 'center';
    context.textBaseline = 'bottom';
    context.strokeText(string, canvas.width / 2, canvas.height / 2);
    context.fillText(string, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL();
}

