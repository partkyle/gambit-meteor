Players = new Meteor.Collection('players');
Rooms = new Meteor.Collection('rooms');

if (Meteor.is_client) {
  /*
   * Helper Functions
   */

  var changeCard = function(card) {
    var room = Rooms.findOne(Session.get('room'));
    _(room.users).each(function(user) {
      if (user.userId == Meteor.user()._id) {
        user.score = card;
      }
    });
    Rooms.update(room._id, room);
  };

  var currentCard = function() {
    var room = Rooms.findOne(Session.get('room'));
    var user = _(room.users).filter(function(user) {
      return user.userId == Meteor.user()._id;
    });

    if (user.length) {
      return user[0].score;
    }
  };

  var joinRoom = function(roomId) {
    Session.set('room', roomId);
    var room = Rooms.findOne(roomId);
    room.users = _(room.users).filter(function(user) {
      return user.userId != Meteor.user()._id;
    });
    var roomUser = {userId: Meteor.user()._id,
                    name: Meteor.user().profile.name || 'Who am I?',
                    email: Meteor.user().services.google.email,
                    score: null};
    room.users.push(roomUser);
    Rooms.update(roomId, room);
  };

  var verifyRoom = function() {
    var room = Rooms.findOne(Session.get('room'));
    var user = _(room.users).filter(function(user) {
      return user.userId == Meteor.user()._id;
    });

    if (user.length) {
      return user[0];
    } else {
      Session.set('room', null);
    }
  };

  /*
   * Template setup
   */

  Template.navbar.events = {
    'click .brand': function(e) {
      Session.set('room', null);
      return false;
    }
  };

  Template.app.lobbyMode = function() {
    var room = Rooms.findOne(Session.get('room'));
    var user = _(room.users).filter(function(user) {
      return user.userId == Meteor.user()._id;
    });
    console.log(user);
    if (user.length) {
      return user[0];
    }
    return false;
  };

  Template.app.room = function() {
    return Rooms.findOne(Session.get('room'));
  };

  Template.lobby.rooms = function() {
    return Rooms.find({});
  };

  Template.lobby.roomName = function() {
    if (!this.name.length) {
      return this._id;
    }

    return this.name;
  };

  Template.lobby.roomCount = function() {
    return this.users.length;
  }

  Template.lobby.roomHoverTitle = function() {
    // TODO this should probably just be in the template
    var usernames = _(this.users).map(function(u) { return u.name + ' (' + u.email + ')' });
    var title = '';
    _(usernames).each(function(u) {
      title += u + '\n';
    })
    return title;
  }

  Template.lobby.events = {
    'click .new-room': function(e) {
      var roomId = Rooms.insert({name: '', users: []});
      joinRoom(roomId);
    },
    'click .shelf': function(e) {
      joinRoom(this._id);
    },
    'click .shelf .icon-trash': function(e) {
      Rooms.remove(this._id);
      return false;
    }
  };

  Template.room.cards = function() {
    return [ {value: 1}, {value: 2}, {value: 3}, {value: 5}, {value: 8}, {value: 13} ];
  };

  Template.room.selected = function() {
    if (this.value == currentCard()) {
      return 'selected';
    }
  };

  Template.room.roomName = function() {
    var current_room = Rooms.findOne({_id: Session.get('room')});
    return Template.lobby.roomName.apply(current_room);
  };

  Template.room.players = function() {
    return Players.find({room: Session.get('room')}, {sort: {name: 1}});
  };

  Template.room.users = function() {
    return Rooms.findOne(Session.get('room')).users;
  };

  Template.room.userDisplay = function() {
    return Meteor.users.findOne(this.userId).name || this.userId;
  };

  Template.room.badgeClass = function() {
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
  };

  Template.room.scoreDisplay = function() {
    return this.score || '';
  };

  Template.room.showScore = function() {
    var room = Rooms.findOne(Session.get('room'));
    return _(room.users).all(function(user) {
      return user.score;
    });
  };

  Template.room.events = {
    'click .card': function(e) {
      if (verifyRoom()) {
        if (currentCard() == this.value) {
          changeCard(null);
        } else {
          changeCard(this.value);
        }
      }
    },
    'click .reset': function(e) {
      if (verifyRoom()) {
        var room = Rooms.findOne(Session.get('room'));
        _(room.users).each(function(user) {
          user.score = null;
        });
        Rooms.update(room._id, room);
      }
    },
    'change .room-name': function(e) {
      if (verifyRoom()) {
        var value = String(e.target.value || "");
        if (value.length) {
          Rooms.update(Session.get('room'), {$set: {name: value}});
        }
      }
    },
    'click .shelf .icon-trash': function(e) {
      if (verifyRoom()) {
        var room = Rooms.findOne(Session.get('room'));
        var userId = this.userId;
        room.users = _(room.users).filter(function(user) {
          return user.userId != userId;
        });
        Rooms.update(room._id, room);
        return false;
      }
    }
  };
}

if (Meteor.is_server) {
  Meteor.startup(function () {
  });
}
