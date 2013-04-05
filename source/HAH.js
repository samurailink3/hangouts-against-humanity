
gapi.hangout.onApiReady.add(function (eventObj) {
    if (eventObj.isApiReady) {
        angular.element(document).ready(function() {
            angular.bootstrap(document);
        });
    }
});
