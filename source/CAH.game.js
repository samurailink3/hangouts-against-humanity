gameStarted = false;
numPlayers = 0;
reader = new Object();
readerIndex = 0;
numSubmissions = 0;
numRevealedSubmissions = 0;

function startGame() {
    //start game
    //TODO: add check for more than 1 player
    //TODO: window for choose options
    var eventData = new Object();
    eventData.gameStarter = user.name;
    eventData.sender = user.id;
    sendEvent('startedGame', eventData);
}

function startedGame(eventData){
    //notification
    gapi.hangout.layout.displayNotice(eventData.gameStarter + " started the game!");

    //clear points
    clearPoints();

    //number of players
    numPlayers = playerStore.count();

    //game is ongoing
    gameStarted = true;

    //disable start game button
    Ext.getCmp('startGameButton').disable();

    //initialize decks
    initDecks();

    //person who started the game randomly chooses reader,sends out cards
    if (eventData.sender == user.id) {
        chooseRandomReader();
        dealAnswers(10, true);
    }
}
///////////////////////////////////////////////////////
//
// MAIN GAME LOOP
//
///////////////////////////////////////////////////////
function doReaderTurn() {
    if (reader.id == user.id) {
        numSubmissions = 0;

        //disable hand for reader
        disableReaderHand();

        //increment turn counter for everyone
        sendEvent('incrementTurnCounter');

        //deal question card and get number of answers
        var numAnswers = dealQuestionCard();

        //allow answers to be submitted
        var eventData = new Object();
        eventData.numAnswers = numAnswers;
        sendEvent('allowSubmissions', eventData);

        //wait until all players have submitted
        var sLoop = setInterval(function () {checkSubmission();},1000);

        function checkSubmission()
        {
            if (numSubmissions == numPlayers-1) {
                clearInterval(sLoop);
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
    sendEvent('setReader',eventData);

}
function setReader(eventData) {
    reader = eventData.reader;
    gapi.hangout.layout.displayNotice(reader.name + " is the reader for this turn!");
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

function initDecks() {
    //master questions store
    masterQuestionStore = Ext.create('Ext.data.Store', {
        storeId:'masterQuestionStore',
        fields:['id', 'text', 'numAnswers', 'cardType'],
        data: masterCards,
        filters: [{
            property: 'cardType',
            value: /Q/
        }]
    });

    //master answers store
    masterAnswerStore = Ext.create('Ext.data.Store', {
        storeId:'masterAnswerStore',
        fields:['id', 'text', 'cardType'],
        data: masterCards,
        filters: [{
            property: 'cardType',
            value: /A/
        }]
    });

    //remaining questions store aka deck
    remainingQuestionStore = Ext.create('Ext.data.Store', {
        storeId:'remainingQuestionStore',
        fields:['id', 'text', 'numAnswers', 'cardType'],
        data: masterCards,
        filters: [{
            property: 'cardType',
            value: /Q/
        }]
    });

    //remaining answers store aka deck
    remainingAnswerStore = Ext.create('Ext.data.Store', {
        storeId:'remainingAnswerStore',
        fields:['id', 'text', 'cardType'],
        data: masterCards,
        filters: [{
            property: 'cardType',
            value: /A/
        }]
    });
}

function dealAnswers(numCards, initialDraw) {
    //for each player
    playerStore.each(function(playerRec){
        if (initialDraw || user.id != reader.id) {
            //pick numCards
            var pickedCards = new Array();
            for (var i=1;i<=numCards;i++) {
                var cardIndex = Math.ceil(remainingAnswerStore.count()*Math.random())-1;
                var cardRec = remainingAnswerStore.getAt(cardIndex);
                pickedCards.push(cardRec.getData().id);
                remainingAnswerStore.remove(cardRec);
            }
            //send draw event to player client
            var eventData = new Object();
            eventData.playerID = playerRec.getData().id;
            eventData.cardsDrawn = pickedCards;
            sendEvent('drawAnswers',eventData);
        }
    });
}

function drawAnswers(eventData) {
    //loop through cards drawn by everyone
    for (var i=0;i<eventData.cardsDrawn.length;i++) {
        var cardRec = masterAnswerStore.findRecord('id', eventData.cardsDrawn[i], 0, false, false, true);

        //add to your client if you drew them
        if (eventData.playerID == user.id) {
            $('#handArea-body').append('<div id="'+cardRec.getData().id+'" class="whitecard card"><div class="cardtext">'+cardRec.getData().text+'</div></div>');
        }
        else {
            //remove cards from deck since dealer already removed
            remainingAnswerStore.remove(cardRec);
        }
    }
}

function dealQuestionCard() {
    var cardIndex = Math.ceil(remainingQuestionStore.count()*Math.random())-1;
    var cardRec = remainingQuestionStore.getAt(cardIndex);
    var pickedCard = cardRec.getData().id;

    //send draw event to player client
    var eventData = new Object();
    eventData.playerID = user.id;
    eventData.cardDrawn = pickedCard;
    sendEvent('drawQuestion',eventData);
    return cardRec.getData().numAnswers;
}

function drawQuestion(eventData) {
    var cardRec = masterQuestionStore.findRecord('id', eventData.cardDrawn, 0, false, false, true);
    var cardText = cardRec.getData().text;
    cardText = cardText.replace(/_/g,'______');

    //add to your client if you drew them
    $('#sharedArea-body').append('<div class="blackcard card"><div class="cardtext">'+cardText+'</div></div>');

     //remove card from deck
    remainingQuestionStore.remove(cardRec);

    //if question card draws 2, reader deals out 2 to each player
    if (user.id == reader.id && cardRec.getData().numAnswers == 3) {
        dealAnswers(2);
    }
}

function allowSubmissions(eventData) {
    if (user.id != reader.id) {
        $('.whitecard').click(function() {
            if (eventData.numAnswers == 1) {
                if ($(this).hasClass('firstCardSelected')) {
                    //de-select
                    $(this).removeClass('firstCardSelected cardSelected');
                    $('#submitAnswerButton').remove();
                }
                else {
                    //remove other selection
                    $('.whitecard').removeClass('firstCardSelected cardSelected');
                    $('#submitAnswerButton').remove();

                    //add UI and button
                    $(this).addClass('firstCardSelected cardSelected');
                    $(this).wrap('<div class="submitWrap" style="float: left"></div>');
                    $(this).parent().append('<button id="submitAnswerButton" class="answerButton" type="button">Submit!</button>');

                    //event handler
                    $('#submitAnswerButton').click(function() {
                        var eventData = new Object();
                        eventData.numAnswer = 1;
                        eventData.answer = $(this).parent().children('div:first').attr('id');
                        eventData.playerID = user.id;
                        eventData.playerName = user.name;
                        sendEvent("submitAnswers", eventData);

                        //remove card
                        removeCardsFromHand();
                    });
                }
            }
        });
    }
}

function removeCardsFromHand() {
    $('.cardSelected').each(function () {
        if ($(this).parent().hasClass('submitWrap')) {
            $(this).parent().remove();
        }
        else {
            $(this).remove();
        }
    });
}

function submitAnswers(eventData) {
    numSubmissions++;
    $('#sharedArea-body').append('<div id="'+eventData.answer+'" class="whitecard card answer" data-playerName="'+eventData.playerName+'" data-playerID="'+eventData.playerID+'"><div class="cardtext"></div></div>');
}

function revealCards() {
    //show reader all the cards
    $('.answer').each(function () {
        //get card text
        var cardRec = masterAnswerStore.findRecord('id', $(this).attr('id'), 0, false, false, true);
        $(this).children('div:first').text(cardRec.getData().text);
    });

    //click reveals cards to other players
    $('.answer').click(function() {
        if (!$(this).hasClass('revealedCard')) {
            numRevealedSubmissions++;

            //send event to reveal to players
            var eventData = new Object();
            eventData.answer = $(this).attr('id');
            sendEvent('readCard',eventData);

            $(this).addClass('revealedCard');
            //if all are reveal give ability to choose
            if (numRevealedSubmissions == numSubmissions) {
                $('.revealedCard').wrap('<div class="chooseWrap" style="float: left"></div>');
                $('.chooseWrap').append('<button class="chooseAnswerButton" type="button">Winner</button>');
            }
        }
    });
}

function readCard(eventData) {
    //only show to the players (reader already sees it)
    if (user.id != reader.id) {
        //get card text
        var cardRec = masterAnswerStore.findRecord('id', eventData.answer, 0, false, false, true);
        $('#'+eventData.answer).children('div:first').text(cardRec.getData().text);
    }
}