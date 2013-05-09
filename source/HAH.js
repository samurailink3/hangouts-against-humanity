/* App Controllers */

var hahApp = angular.module('hahApp', []);

hahApp.factory('game', function($rootScope,$http) {
    var game = {};
    game.data = {};

    //Gets the card deck
    game.getCards = function() {
        $http.get('https://hangouts-against-humanity.herokuapp.com/cards/base')
            .success(function(data) {
                game.data.cards = data;
            });

        return game.data;
    };

    return game;
});

hahApp.controller('GameCtrl', function GameCtrl($scope, $http, game) {
    $scope.cards = game.getCards();
    console.log($scope.cards);
});

