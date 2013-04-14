//After Hangout API is ready
gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        //manually bootstrap angular
        angular.bootstrap(document.body);

        //start listening to events
        gapi.hangout.data.onStateChanged.add(onStateChanged);
    }
});
