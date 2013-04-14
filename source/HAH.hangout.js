
function UserCtrl($scope) {
    var participantID = gapi.hangout.getParticipantId();
    $scope.name = gapi.hangout.getParticipantById(participantID).person.displayName;
    $scope.id = gapi.hangout.getParticipantById(participantID).person.id;
    $scope.imageURL = gapi.hangout.getParticipantById(participantID).person.image.url;
}


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

