/*function UserCtrl($scope) {
    var participantID = gapi.hangout.getParticipantId();
    $scope.userName = gapi.hangout.getParticipantById(participantID).person.displayName;
    $scope.userID = gapi.hangout.getParticipantById(participantID).person.id;
    $scope.userImageURL = gapi.hangout.getParticipantById(participantID).person.image.url;
}

function HangoutCtrl($scope,$http) {
    var hangoutID = gapi.hangout.getHangoutId();
    $scope.hangoutID = gapi.hangout.getHangoutId();

    //save the HangoutID
    var thisHangout = {};
    thisHangout.test = 'West Wing rocks!';

    $http.post('https://hangouts-against-humanity.herokuapp.com/hangout/'+hangoutID,thisHangout).success(function (resp) {
            console.log(resp);
        }
    )
}*/

//After Hangout API is ready
gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        //manually bootstrap angular
        angular.bootstrap(document.body, ['hahApp']);

        //start listening to events
        gapi.hangout.data.onStateChanged.add(onStateChanged);
    }
});

//send event name and string version of JSON object to shared state
function sendEvent(eventName, eventData) {
    var id = uniqid();
    if (!eventData) {
        eventData = new Object();
        eventData.sender = user.id;
    }
    gapi.hangout.data.setValue(eventName+"##"+id,JSON.stringify(eventData));
}


//Process received state change
function onStateChanged(event) {
    try {
        //get new key pairs
        var newKeys = event.addedKeys;
        //loop through keys
        for(var i=0, len=newKeys.length; i < len; i++){
            //event function call (use ## to identify event name)
            if (newKeys[i].key.search("##")> 0) {
                var eventData = JSON.parse(newKeys[i].value);
                var id = newKeys[i].key.search("##");
                var funcName = newKeys[i].key.substr(0,id);
                eval(funcName + "(eventData)");
                gapi.hangout.data.clearValue(newKeys[i].key);
            }
        }
    }
    catch (e) {
        //log error
        console.log('Fail state changed');
        console.log(e);
        console.log(event);
    }
}

