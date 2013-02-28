function initGoogleAPI()
{
    //setup Google info
    var participantID = gapi.hangout.getParticipantId();
    user = {"name": gapi.hangout.getParticipantById(participantID).person.displayName,
            "id": gapi.hangout.getParticipantById(participantID).person.id,
            "imageURL": gapi.hangout.getParticipantById(participantID).person.image.url,
            "participantID": participantID
    };

    gapi.hangout.data.onStateChanged.add(onStateChanged);
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
        Ext.iterate(event.addedKeys, function (obj,index) {
            //event function call
            if (obj.key.search("##")> 0) {
                var eventData = JSON.parse(obj.value);
                var id = obj.key.search("##");
                var funcName = obj.key.substr(0,id);
                eval(funcName + "(eventData)");
                gapi.hangout.data.clearValue(obj.key);
            }
        });

    }
    catch (e) {

        console.log('Fail state changed');
        console.log(e);
        console.log(event);
    }
}

