game.chat = {
  build: function () {
    if (!game.chat.builded) {
      game.chat.builded = true;
      game.chat.el = $('<div>').addClass('chat').appendTo(game.states.el).html('<h1>Chat</h1>').hover(game.chat.hover);
      game.chat.dis = $('<div>').appendTo(game.chat.el).addClass('dis hidden');
      game.chat.messages = $('<div>').addClass('messages').appendTo(game.chat.el);
      game.chat.input = $('<input>').appendTo(game.chat.el).attr({type: 'text', maxlength: 36}).keydown(game.chat.keydown);
      game.chat.button = $('<div>').addClass('button').appendTo(game.chat.el).on('mouseup touchend', game.chat.send).text(game.data.ui.send);
      setInterval(game.chat.interval, 1000);
    }
  },
  hover: function (event) {
    if (!game.chat.discordBuilded) {
      game.chat.discordBuilded = true;
      $('<iframe src="https://discordapp.com/widget?id=208322860333268993&theme=dark&username='+game.player.name+'" width="350" height="400" allowtransparency="true" frameborder="0">').appendTo(game.chat.dis).on('load', function (event) {
        // console.log(event);
        game.chat.dis.removeClass('hidden');
      });
    }
    game.chat.updating = (event.type === 'mouseenter');
    game.db({ 'get': 'chat' }, function (chat) {
      game.chat.update(chat);
      game.chat.input.focus();
    });
  },
  interval: function () {
    if (game.chat.updating) {
      game.db({ 'get': 'chat' }, function (chat) {
        game.chat.update(chat);
      });
    }
  },
  update: function (received) {
    if (received.messages && received.messages.length) {
      game.chat.messages.empty();
      $.each(received.messages, function () {
        var now = new Date().valueOf();
        var diff = now - Number(this.date);
        var date = new Date(Number(this.date));
        var day = game.data.ui.today + ' ' + date.toLocaleTimeString();
        if (diff > 24 * 60 * 60 * 1000) day = game.data.ui.yesterday + ' ' + date.toLocaleTimeString();
        if (diff > 48 * 60 * 60 * 1000) day = date.toLocaleString();
        var msg = $('<p>');
        msg.append($('<span>').addClass('user').text(this.user));
        msg.append($('<span>').addClass('date').text(day));
        msg.append($('<span>').addClass('data').text(this.data));
        msg.prependTo(game.chat.messages);
      });
    }
  },
  send: function () {
    var msg = game.chat.input.val();
    if (!msg) {
      game.chat.input.focus();
    } else {
      game.chat.button.attr('disabled', true);
      game.loader.addClass('loading');
      game.chat.input.val('');
      game.chat.set(msg, function (chat) {
        game.loader.removeClass('loading');
        setTimeout(function () {
          game.chat.button.attr('disabled', false);
        }, 2000);
      });
    }
  },
  set: function (msg, cb) {
    game.db({
      'set': 'chat',
      'user': game.player.name,
      'data': msg,
      'date': new Date().valueOf()
    }, function (chat) {
      game.chat.update(chat);
      if (cb) cb(chat);
    });
  },
  keydown: function (event) {
    if (event.which === 13 && !game.chat.button.attr('disabled')) {
      game.chat.send();
    }
  }
};
