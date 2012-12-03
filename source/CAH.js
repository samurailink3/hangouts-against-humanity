unique_id = 0;
participantArray = new Array();

gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        warningPrompt();
    }
});

function warningPrompt() {
    //present game options
    confirmationWindow = Ext.create('Ext.window.Window', {
        title:'Warning!',
        width:450,
        height:200,
        autoShow: true,
        modal: true,
        collapsible: false,
        resizable: false,
        shadow: false,
        html: 'Hangouts Against Humanity is a Google+ Hangout app designed for playing <a href="http://www.cardsagainsthumanity.com/index2.html" target="_blank">Cards Against Humanity</a>. Please be aware this game is intended for mature audiences. <br><br> Hangouts Against Humanity is available on Github where you can view the source, wiki, and submit issues <a href="https://github.com/samurailink3/hangouts-against-humanity" target="_blank">here</a> ',
        buttons: [
            {
                text: 'I am a Horrible Person',
                handler: function () {
                    this.up('window').close();

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
                        minWidth: 250,
                        resizable: {preserveRatio: 'true'},
                        shadow: false,
                        listeners : {
                            'move' : function(win,x,y,opt){
                                videoCanvas.setPosition(x+7,y+28);
                                videoCanvas.setVisible(true);
                            },
                            'resize': function(self, width, height) {
                                videoCanvas.setWidth(width-19);
                                videoCanvas.setVisible(true);
                            }
                        }
                    });
                    $('#readerVideoWindow').mousedown(function () {videoCanvas.setVisible(false);});
                    resetVideoWindow();

                    var soundURL = 'https://tabletopforge.com/CAH/img/Winner.wav';
                    winnerSound = gapi.hangout.av.effects.createAudioResource(soundURL).createSound({loop: false, localOnly: true});

                    //check if game starter and if so sync to game state
                    if (gapi.hangout.data.getValue('winningPoints') >=1 ) {
                        syncNewPlayer();
                    }
                }
            },
            {
                text: 'Cancel',
                handler: function () {
                    $('body').html('<img src="http://images1.fanpop.com/images/photos/1800000/Care-Bears-Wallpaper-80s-toybox-1886586-1024-768.jpg">');
                }
            }
        ]
    });
}

function syncNewPlayer() {
    //winningPoints
    winningPoints = gapi.hangout.data.getValue('winningPoints');

    //game is ongoing
    gameStarted = true;

    //disable start game button
    Ext.getCmp('startGameButton').hide();
    Ext.getCmp('goalDisplay').setValue(winningPoints);
    Ext.getCmp('goalDisplay').show();

    //initialize decks
    initDecks(JSON.parse(gapi.hangout.data.getValue('sets')));

    //correct the turn
    Ext.getCmp('turnCounter').setValue(gapi.hangout.data.getValue('turn'));
}

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
                participantID: participantArray[i].id,
                cardsInHand: 0
            });
        }
    }

    //remove players no longer in the game
    var playersToRemove = new Array();
    playerStore.each(function (playerRec) {
        for (var i=0; i<participantArray.length;i++) {
            found = false;
            console.log(participantArray[i]);
            console.log(playerRec);
            if (participantArray[i].person.id == playerRec.getData().id) {
                found = true;
            }
        }
        if (!found) {
            playersToRemove.push(playerRec);
        }
    });

    for (var i=0; i<playersToRemove.length;i++) {
        playerStore.remove(playersToRemove[i]);
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
    readerVideoWindow.alignTo(Ext.getBody(), "tr-tr", [-10, 20]);
    videoCanvas.setWidth(readerVideoWindow.getWidth()-19);
    videoCanvas.setVideoFeed(defaultFeed);
    var pos = readerVideoWindow.getPosition();
    videoCanvas.setPosition(pos[0]+7, pos[1]+28);
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

