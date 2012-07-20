Players = new Meteor.Collection('players');
Rooms = new Meteor.Collection('rooms');

if (Meteor.is_client) {
  /*
   * Helper Functions
   */
  var findSelf = function() {
    var player = Players.findOne(Session.get('player_id'));
    if (!player) {
      setPlayerId(null);
      location.reload();
    }
    return player;
  }

  var setPlayerId = function(player_id) {
    Session.set('player_id', player_id);
    $.cookie('player_id', player_id);
  }

  var change_room = function(room) {
    Session.set('room', room);
    Players.update(Session.get('player_id'), {$set: {room: room, entered_at: new Date()}});
  }

  var change_card = function(card) {
    Session.set('card', card);
    Players.update(Session.get('player_id'), {$set: {score: card}});
  }

  /*
   * Initialize session
   */
  var player_id = $.cookie('player_id');
  if (!player_id) {
    player_id = Players.insert({name: null});
  }
  setPlayerId(player_id);


  /*
   * Template setup
   */
  Template.navbar.player_name = function() {
    var player = findSelf();
    if (player) {
      return player.name;
    }
  }

  Template.navbar.events = {
    'click .brand': function(e) {
      Players.update(Session.get('player_id'), {$set: {room: null}});
      return false;
    },
    'change .player-name': function(e) {
      var value = String(e.target.value || "");
      Players.update(Session.get('player_id'), {$set: {name: value}});
    }
  }

  Template.app.lobby_mode = function() {
    var player = findSelf();
    return !player || !player.room;
  }

  Template.lobby.rooms = function() {
    return Rooms.find({}, {$sort: {entered_at: 1}});
  }

  Template.lobby.room_name = function() {
    if (!this.name.length) {
      return this._id;
    }

    return this.name;
  }

  Template.lobby.events = {
    'click .new-room': function(e) {
      var room_id = Rooms.insert({name: ''});
      change_room(room_id);
    },
    'click .shelf': function(e) {
      change_room(this._id);
    },
    'click .shelf .icon-trash': function(e) {
      Players.update({room: this._id}, {$set: {room: null, score: null}});
      Rooms.remove(this._id);

      return false;
    }
  };

  Template.room.cards = function() {
    return [ {value: 1}, {value: 2}, {value: 3}, {value: 5}, {value: 8}, {value: 13} ];
  }

  Template.room.selected = function() {
    if (this.value == Session.get('card')) {
      return 'selected';
    }
  }

  Template.room.room_name = function() {
    var current_room = Rooms.findOne({_id: Session.get('room')});
    return Template.lobby.room_name.apply(current_room);
  }

  Template.room.player_display = function() {
    return this.name ? this.name : this._id;
  }

  Template.room.players = function() {
    return Players.find({room: Session.get('room')}, {sort: {name: 1}});
  }

  Template.room.badge_class = function() {
    if (!this.score) {
      return '';
    }

    var badge = 'badge';
    switch (this.score) {
      case 2:
        badge += ' badge-inverse';
        break;
      case 3:
        badge += ' badge-success';
        break;
      case 5:
        badge += ' badge-info';
        break;
      case 8:
        badge += ' badge-warning';
        break;
      case 13:
        badge += ' badge-important';
        break;
    }

    return badge;
  }

  Template.room.score_display = function() {
    return this.score || '';
  }

  Template.room.end_round = function() {
    return Players.find({room: Session.get('room')}).count() == Players.find({room: Session.get('room'), score: {$gt: 0}}).count();
  }

  Template.room.events = {
    'click .card': function(e) {
      if (Session.get('card') == this.value) {
        change_card(null);
      } else {
        change_card(this.value);
      }
    },
    'click .reset': function(e) {
      Session.set('card', null);
      Players.update({room: Session.get('room')}, {$set: {score: null}});
    },
    'change .room-name': function(e) {
      var value = String(e.target.value || "");
      if (value.length) {
        Rooms.update(Session.get('room'), {$set: {name: value}});
      }
    },
    'click .shelf .icon-trash': function(e) {
      if (this._id == Session.get('player_id')) {
        alert('Y U NO NOT DELETE SELF!?');
      } else {
        Players.remove(this._id);
      }
    }
  };

}

if (Meteor.is_server) {
  Meteor.startup(function () {
  });
}
