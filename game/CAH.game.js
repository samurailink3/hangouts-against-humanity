gameStarted = false;
numPlayers = 0;
reader = new Object();
readerIndex = 0;
numSubmissions = 0;
numRevealedSubmissions = 0;
winningPoints = 0;
firstCardSelected = false;
secondCardSelected = false;
thirdCardSelected = false;
overlay = false;
masterCardsPicked = new Array();

function startGame() {
    //start game
    if (playerStore.count() < 3) {
        gapi.hangout.layout.displayNotice("You need at least 3 people to play.");
    }
    else {
        //present game options
        optionsWindow = Ext.create('Ext.window.Window', {
            title:'Game Options', id:'optionsWindow',
            width:450,
            height:200,
            autoShow: true,
            modal: true,
            collapsible: false,
            resizable: false,
            shadow:false,
            items: [
                {
                    xtype: 'checkboxgroup',
                    id: 'setGroup',
                    fieldLabel: 'Sets',
                    labelWidth: 35,
                    // Arrange checkboxes into two columns, distributed vertically
                    columns: 3,
                    columnWidth:  240,
                    vertical: false,
                    items: [
                        { boxLabel: 'Base', name: 'sets', inputValue: 'Base', checked: true, readOnly:true },
                        { boxLabel: 'First Expansion', name: 'sets', checked: true, inputValue: 'CAHe1'},
                        { boxLabel: 'Second Expansion', name: 'sets', checked: true, inputValue: 'CAHe2' },
                        { boxLabel: 'Christmas Set', name: 'sets', checked: false, inputValue: 'CAHxmas' },
                        { boxLabel: 'Grognards (fan RPG set)', name: 'sets', checked: false, inputValue: 'CAHgrognards' },
                        { boxLabel: 'Weeaboo (fan Anime set)', name: 'sets', checked: false, inputValue: 'CAHweeaboo' }

                    ]
                },
                {
                    id:'winningPoints',
                    xtype:'numberfield',
                    fieldLabel:'Points',
                    labelWidth:40,
                    width:100,
                    value:7,
                    maxValue:20,
                    minValue:1
                }
            ],
            buttons: [
                {
                    text: 'Start Game',
                    handler: function () {
                        if (!gameStarted) {
                            var eventData = new Object();
                            eventData.winningPoints = Ext.getCmp('winningPoints').getValue();
                            eventData.sets = Ext.getCmp('setGroup').getValue();
                            eventData.gameStarter = user.name;
                            eventData.sender = user.id;
                            sendEvent('startedGame', eventData);

                            gapi.hangout.data.setValue('winningPoints', Ext.getCmp('winningPoints').getValue().toString());
                            gapi.hangout.data.setValue('sets',JSON.stringify(Ext.getCmp('setGroup').getValue()));
                            gapi.hangout.data.setValue('masterCardsPicked', "");
                        }

                        this.up('window').close();
                    }
                },
                {
                    text: 'Cancel',
                    handler: function () {
                        this.up('window').close();
                    }
                }
            ]
        });
    }
}

function startedGame(eventData){
    //notification
    gapi.hangout.layout.displayNotice(eventData.gameStarter + " started the game!");

    //clear points
    clearPoints();

    //number of players
    numPlayers = playerStore.count();

    //winningPoints
    winningPoints = eventData.winningPoints;

    //game is ongoing
    gameStarted = true;

    //reposition video feed
    resetVideoWindow();
    //clear overlay
    if (overlay) {
        overlay.dispose();
    }

    //disable start game button
    Ext.getCmp('startGameButton').hide();
    Ext.getCmp('goalDisplay').setValue(winningPoints);
    Ext.getCmp('goalDisplay').show();

    //initialize decks
    initDecks(eventData.sets);

    //person who started the game randomly chooses reader,sends out cards
    if (eventData.sender == user.id) {
        chooseRandomReader();
    }
}
///////////////////////////////////////////////////////
//
// MAIN GAME LOOP
//
///////////////////////////////////////////////////////
function doReaderTurn() {
    numPlayers = playerStore.count();

    if (reader.id == user.id) {
        dealAnswers(10);

        numSubmissions = 0;
        numRevealedSubmissions = 0;

        //disable hand for reader
        disableReaderHand();

        //increment turn counter for everyone
        var curTurn = Ext.getCmp('turnCounter').getValue()+1;
        gapi.hangout.data.setValue('turn', curTurn.toString());
        sendEvent('incrementTurnCounter');

        //deal question card and get number of answers
        var numAnswers = dealQuestionCard();

        //allow answers to be submitted
        var eventData = new Object();
        eventData.numAnswers = numAnswers;
        sendEvent('allowSubmissions', eventData);

        //wait until all players have submitted
        var numLoops = 0;
        var sLoop = setInterval(function () {checkSubmission();},1000);

        function checkSubmission()
        {
            numLoops++;
            //all submission in or 2 minutes passed (in case of a drop)
            Ext.getCmp('gameStatePanel').setTitle("Round Timer:" + (120-numLoops) + " seconds");
            if (numSubmissions == numPlayers-1 || numLoops > 120) {
                clearInterval(sLoop);
                Ext.getCmp('gameStatePanel').setTitle("Game State");
                revealCards();
            }
        }
    }
}


//other game functions
function incrementTurnCounter(){
    Ext.getCmp('turnCounter').setValue(Ext.getCmp('turnCounter').getValue()+1);
}

function clearPoints() {
    playerStore.each(function(record) {
        record.set('points', 0);
    });
}

function chooseRandomReader() {
    readerIndex = Math.ceil(numPlayers*Math.random())-1;
    reader = playerStore.getAt(readerIndex).getData();
    var eventData = new Object();
    eventData.reader = reader;
    eventData.readerIndex = readerIndex;
    sendEvent('setReader',eventData);

    //to set initial card counts
    removeCardsFromHand();

}
function setReader(eventData) {
    reader = eventData.reader;
    readerIndex = eventData.readerIndex;
    gapi.hangout.layout.displayNotice(reader.name + " is the Card Czar for this turn!");
    var readerFeed = gapi.hangout.layout.createParticipantVideoFeed(reader.participantID);
    videoCanvas.setVideoFeed(readerFeed);
    readerVideoWindow.setTitle('Card Czar: ' + reader.name);
    //reset card selection variables
    firstCardSelected = false;
    secondCardSelected = false;
    thirdCardSelected = false;
    //advance turn
    if (user.id == reader.id) {
        doReaderTurn();
    }
}

function disableReaderHand() {
    Ext.getCmp('handArea').collapse();
}

function enableReaderHand() {
    Ext.getCmp('handArea').expand();
}

function initDecks(setsData) {
    var thisGameCards = new Array();
    for (var i in masterCards) {
        if (setsData.sets == 'Base') {
            if (masterCards[i].expansion == 'Base') {
                thisGameCards.push(masterCards[i]);
            }
        }
        else {
            if ($.inArray(masterCards[i].expansion,setsData.sets) > -1) {
                thisGameCards.push(masterCards[i]);
            }
        }
    }

    //master questions store
    masterQuestionStore = Ext.create('Ext.data.Store', {
        storeId:'masterQuestionStore',
        fields:['id', 'text', 'numAnswers', 'cardType'],
        data: thisGameCards,
        filters: [
            {
                property: 'cardType',
                value: /Q/
            }
        ]
    });

    //master answers store
    masterAnswerStore = Ext.create('Ext.data.Store', {
        storeId:'masterAnswerStore',
        fields:['id', 'text', 'cardType'],
        data: thisGameCards,
        filters: [
            {
                property: 'cardType',
                value: /A/
            }
        ]
    });

    //remaining questions store aka deck
    remainingQuestionStore = Ext.create('Ext.data.Store', {
        storeId:'remainingQuestionStore',
        fields:['id', 'text', 'numAnswers', 'cardType'],
        data: thisGameCards,
        filters: [
            {
                property: 'cardType',
                value: /Q/
            }
        ]
    });

    //remaining answers store aka deck
    remainingAnswerStore = Ext.create('Ext.data.Store', {
        storeId:'remainingAnswerStore',
        fields:['id', 'text', 'cardType'],
        data: thisGameCards,
        filters: [
            {
                property: 'cardType',
                value: /A/
            }
        ]
    });


}

function dealAnswers(handSize) {
    var cardIndexesPicked = new Array();
    var masterCardsString = gapi.hangout.data.getValue('masterCardsPicked');
    if (masterCardsString != "") {
        masterCardsPicked = masterCardsString.split(',');
    }

    playerStore.each(function(playerRec){
        //check number of cards and draw up to handsize
        var numCardsNeeded = handSize - playerRec.getData().cardsInHand;
        if (numCardsNeeded > 0 && playerRec.getData().id != reader.id) {
            console.log("Detected "+playerRec.getData().name+" needs " + numCardsNeeded + " cards (draw up to "+handSize+") Had "+ playerRec.getData().cardsInHand+ " cards");
            //pick numCards
            var pickedCards = new Array();
            for (var i=1;i<=numCardsNeeded;i++) {
                var cardIndex = Math.ceil(remainingAnswerStore.count()*Math.random())-1;
                while ($.inArray(cardIndex,cardIndexesPicked) !==-1) {
                    cardIndex = Math.ceil(remainingAnswerStore.count()*Math.random())-1;
                }
                var cardRec = remainingAnswerStore.getAt(cardIndex);
                pickedCards.push(cardRec.getData().id);
                cardIndexesPicked.push(cardIndex);
                masterCardsPicked.push(cardIndex);
            }
            //send draw event to player client
            var eventData = new Object();
            eventData.playerID = playerRec.getData().id;
            eventData.cardsDrawn = pickedCards;
            sendEvent('drawAnswers',eventData);
            console.log(playerRec.getData().name + " " + pickedCards.toString());
        }
    });
    gapi.hangout.data.setValue('masterCardsPicked', masterCardsPicked.toString());
}

function drawAnswers(eventData) {
    /*if (eventData.playerID == user.id) {
        console.log("drawing cards:"+eventData.cardsDrawn.toString());
    }*/

    //loop through cards drawn by everyone
    for (var i=0;i<eventData.cardsDrawn.length;i++) {
        var cardRec = remainingAnswerStore.findRecord('id', eventData.cardsDrawn[i], 0, false, false, true);

        //add to your client if you drew them
        if (eventData.playerID == user.id) {
            $('#handArea-body').append('<div class="myCardWrap" style="float:left;"><div id="'+cardRec.getData().id+'" class="whitecard card"><div class="cardtext">'+cardRec.getData().text+'</div></div></div>');
        }
        //remove cards from deck since dealer already removed
        remainingAnswerStore.remove(cardRec);
    }
}

function dealQuestionCard() {
    var cardIndex = Math.ceil(remainingQuestionStore.count()*Math.random())-1;
    var cardRec = remainingQuestionStore.getAt(cardIndex);
    var pickedCard = cardRec.getData().id;

    var masterCardsString = gapi.hangout.data.getValue('masterCardsPicked');
    if (masterCardsString != "") {
        masterCardsPicked = masterCardsString.split(',');
    }

    masterCardsPicked.push(pickedCard);
    gapi.hangout.data.setValue('masterCardsPicked', masterCardsPicked.toString());

    //send draw event to player client
    var eventData = new Object();
    eventData.playerID = user.id;
    eventData.cardDrawn = pickedCard;

    sendEvent('drawQuestion',eventData);
    return cardRec.getData().numAnswers;
}

function drawQuestion(eventData) {
    var cardRec = remainingQuestionStore.findRecord('id', eventData.cardDrawn, 0, false, false, true);
    var cardText = cardRec.getData().text;
    cardText = cardText.replace(/_/g,'______');

    //add to your client if you drew them
    $('#sharedArea-body').append('<div class="blackcard card"><div class="cardtext">'+cardText+'</div></div>');
    if (cardRec.getData().numAnswers == 2) {
        $('.blackcard').addClass('pick2');
    }
    else if (cardRec.getData().numAnswers == 3) {
        $('.blackcard').addClass('pick3');
    }

     //remove card from deck
    remainingQuestionStore.remove(cardRec);

    //if question card draws 2, reader deals out 2 to each player
    if (user.id == reader.id) {
        if (cardRec.getData().numAnswers == 3) {
            //dealAnswers(12);
            //TODO: deal up to 12, issue is timing as main loop keeps going
        }
    }
}

function allowSubmissions(eventData) {
    if (user.id != reader.id) {
        $('.whitecard').click(function() {

            if ($(this).hasClass('cardSelected')) {
                //de-select
                if ($(this).hasClass('firstCardSelected')) {
                    firstCardSelected = false;
                }
                if ($(this).hasClass('secondCardSelected')) {
                    secondCardSelected = false;
                }
                if ($(this).hasClass('firstCardSelected')) {
                    thirdCardSelected = false;
                }
                $(this).removeClass('firstCardSelected secondCardSelected thirdCardSelected cardSelected');
                $('.answerButton').remove();
            }
            else {
                //select card
                if (!firstCardSelected) {
                    $(this).addClass('firstCardSelected cardSelected');
                    firstCardSelected = true;
                }
                else if (!secondCardSelected && eventData.numAnswers >= 2) {
                    $(this).addClass('secondCardSelected cardSelected');
                    secondCardSelected = true;
                }
                else if (!thirdCardSelected && eventData.numAnswers == 3) {
                    $(this).addClass('thirdCardSelected cardSelected');
                    thirdCardSelected = true;
                }
            }

            //num of selected = submissions needed
            if (eventData.numAnswers ==  $('.cardSelected').length && $(this).hasClass('cardSelected')) {
                //add UI and button
                $(this).parent().append('<button id="submitAnswerButton" class="answerButton" type="button">Submit!</button>');

                //event handler
                $('#submitAnswerButton').click(function() {
                    var submitData = new Object();
                    submitData.numAnswers = eventData.numAnswers;
                    submitData.answer =  $('.firstCardSelected').attr('id');
                    if (eventData.numAnswers >= 2) {
                        submitData.answer2 =  $('.secondCardSelected').attr('id');
                    }
                    if (eventData.numAnswers == 3) {
                        submitData.answer3 =  $('.thirdCardSelected').attr('id');
                    }
                    submitData.playerID = user.id;
                    submitData.playerName = user.name;
                    submitData.numAnswers = eventData.numAnswers;
                    sendEvent("submitAnswers", submitData);

                    //remove card
                    removeCardsFromHand();
                    $(this).removeClass('firstCardSelected secondCardSelected thirdCardSelected cardSelected');
                    $('.answerButton').remove();
                    $('.whitecard').unbind();
                });
            }
        });
    }
}

function removeCardsFromHand() {
    $('.cardSelected').each(function () {
       $(this).parent().remove();
    });
    //update cards in hand for everyone
    var eventData = new Object();
    eventData.playerID = user.id;
    eventData.cardsInHand = $('.myCardWrap').length;
    sendEvent('updateCardsInHand',eventData);
}

function  updateCardsInHand(eventData) {
    playerStore.each(function(playerRec){
        if (playerRec.getData().id == eventData.playerID) {
            playerRec.set('cardsInHand',eventData.cardsInHand);
        }
    });
}

function submitAnswers(eventData) {
    numSubmissions++;
    $('#sharedArea-body').append('<div id="'+eventData.playerID+'" class="answerContainer" style="float:left" data-numanswers="'+eventData.numAnswers+'"><div id="'+eventData.answer+'" class="whitecard card answer" data-playerName="'+eventData.playerName+'" data-playerID="'+eventData.playerID+'"><div class="cardtext"></div></div></div>');
    if (eventData.numAnswers >= 2) {
        $('#'+eventData.playerID).append('<div id="'+eventData.answer2+'" class="whitecard card answer" data-playerName="'+eventData.playerName+'" data-playerid="'+eventData.playerID+'"><div class="cardtext"></div></div>');
    }
    if (eventData.numAnswers == 3) {
        $('#'+eventData.playerID).append('<div id="'+eventData.answer3+'" class="whitecard card answer" data-playerName="'+eventData.playerName+'" data-playerid="'+eventData.playerID+'"><div class="cardtext"></div></div>');
    }
}

function revealCards() {
    //instructions to reader
    gapi.hangout.layout.displayNotice("Click a card to reveal it as you read it.");

    //shuffle answers, then sync
   /* var parent = $("#sharedArea-body");
    var divs = $('.answerContainer');
    while (divs.length) {
        parent.append(divs.splice(Math.floor(Math.random() * divs.length), 1)[0]);
    }
    console.log($('.answerContainer').toString());*/

    //show reader all the cards
    $('.answer').each(function () {
        //get card text
        var cardRec = masterAnswerStore.findRecord('id', $(this).attr('id'), 0, false, false, true);
        $(this).children('div:first').html(cardRec.getData().text);
    });

    //click reveals cards to other players
    $('.answerContainer').click(function() {
        if (!$(this).hasClass('revealedSet')) {
            numRevealedSubmissions++;

            //send event to reveal to players
            var eventData = new Object(); eventData.containerID = $(this).attr('id');
            eventData.numAnswers = $(this).attr('data-numanswers');
            eventData.answer = $(this).children('div:first').attr('id');
            if ($(this).attr('data-numanswers')>=2) {
                eventData.answer2 = $(this).children('div:nth-child(2)').attr('id');
            }
            if ($(this).attr('data-numanswers')==3) {
                eventData.answer3 = $(this).children('div:nth-child(3)').attr('id');
            }
            sendEvent('readCard',eventData);

            $(this).addClass('revealedSet');
            //if all are reveal give ability to choose
            if (numRevealedSubmissions == numSubmissions) {
                $('.revealedSet').wrap('<div class="chooseWrap" style="float: left"></div>');
                $('.chooseWrap').append('<button class="chooseAnswerButton" type="button">Winner</button>');

                //choosing a winner
                $('.chooseAnswerButton').click(function() {
                    //event for winner chosen
                    var eventData = new Object();
                    eventData.playerID = $(this).parent().children('div:first').children('div:first').attr('data-playerid');
                    eventData.playerName = $(this).parent().children('div:first').children('div:first').attr('data-playername');
                    sendEvent("winnerPicked", eventData);

                    //remove winner buttons
                    $('.chooseAnswerButton').remove();
                });
            }
        }
    });
}

function readCard(eventData) {
    //only show to the players (reader already sees it)
    if (user.id != reader.id) {
        //get card text
        var cardRec = masterAnswerStore.findRecord('id', eventData.answer, 0, false, false, true);
        $('#'+eventData.answer).children('div:first').html(cardRec.getData().text);
        if (eventData.numAnswers>=2) {
            var cardRec = masterAnswerStore.findRecord('id', eventData.answer2, 0, false, false, true);
            $('#'+eventData.answer2).children('div:first').html(cardRec.getData().text);
        }
        if (eventData.numAnswers==3) {
            var cardRec = masterAnswerStore.findRecord('id', eventData.answer3, 0, false, false, true);
            $('#'+eventData.answer3).children('div:first').html(cardRec.getData().text);
        }
    }
}

function winnerPicked(eventData) {
    var playerRecord = playerStore.findRecord("id", eventData.playerID, 0, false, false, true);
    var points = playerRecord.get('points');
    points++;
    playerRecord.set('points',points);

    //add winner class
    $('#'+eventData.playerID).addClass('winner');

    //cleanup shared area for both reader and players

    $('.answerContainer').each(function () {
        if (!$(this).hasClass('winner')) {
            $(this).remove();
        }
    });

    //check winner
    if (points>= winningPoints) {
        gapi.hangout.layout.displayNotice(eventData.playerName + " has won the game!");
        //switch feed to winner
        var winnerFeed = gapi.hangout.layout.createParticipantVideoFeed(playerRecord.get('participantID'));
        videoCanvas.setVideoFeed(winnerFeed);
        readerVideoWindow.setTitle('Game Winner: ' + eventData.playerName);

        //play sound
        winnerSound.play();

        //center window and make it bigger
        readerVideoWindow.center(); readerVideoWindow.setSize(500,300);
        if (user.id == eventData.playerID) {
            var pancakes = gapi.hangout.av.effects.createImageResource('https://raw.github.com/samurailink3/hangouts-against-humanity/master/source/img/winner_pancake.png');
            overlay = pancakes.showFaceTrackingOverlay({
                'trackingFeature': gapi.hangout.av.effects.FaceTrackingFeature.NOSE_ROOT,
                'scaleWithFace': true,
                'rotateWithFace': true,
                'offset': {x: 0, y:0},
                'scale': 2.0});
        }

        resetGame();

    } //continue round
    else {
        gapi.hangout.layout.displayNotice(eventData.playerName + " has won the point.");
        var winnerFeed = gapi.hangout.layout.createParticipantVideoFeed(playerRecord.get('participantID'));
        videoCanvas.setVideoFeed(winnerFeed);
        readerVideoWindow.setTitle('Gloat cam: ' + eventData.playerName);

        //let round winner gloat for 5 seconds
        setTimeout(function(){
            //cleanup
            $('.blackcard').remove();
            $('.chooseWrap').remove();
            $('.winner').remove();

            //pick new reader
            advanceReader();
        },5000);

    }
}

function advanceReader() {
    //try and catch new/left players
    updateParticipantsList();
    readerIndex = playerStore.find('id',reader.id,0,false,false,true);
    if (user.id == reader.id) {
        if (readerIndex < numPlayers-1) {
            readerIndex++;
        }
        else {
            readerIndex = 0;
        }

        reader = playerStore.getAt(readerIndex).getData();
        var eventData = new Object();
        eventData.reader = reader;
        eventData.readerIndex = readerIndex;
        sendEvent('setReader',eventData);

        enableReaderHand();
    }
}

function resetGame() {
    //enable start game button
    Ext.getCmp('startGameButton').show();
    Ext.getCmp('goalDisplay').hide();

    //cleanup
    $('.blackcard').remove();
    $('.chooseWrap').remove();
    $('.winner').remove();
    $('.answerContainer').remove();

    $('.myCardWrap').remove();
    removeCardsFromHand();

    gameStarted = false;

    clearPoints();
    Ext.getCmp('turnCounter').setValue(0);

    //try and catch new/left players
    updateParticipantsList();
}