game.turn = {
  build: function (time) {
    if (!game.turn.builded) {
      game.turn.builded = true;
      game.turn.msg = $('<p>').appendTo(game.topbar).addClass('turns').text(game.data.ui.turns + ': 0/0 (0)');
      game.turn.time = $('<p>').appendTo(game.topbar).addClass('time').text(game.data.ui.time + ': 0:00 Day');
      game.turn.el = $('<h1>').addClass('turntitle').appendTo(game.states.table.el);
    }
    game.time = time || 0;
    game.player.turn = 0;
    game.enemy.turn = 0;
    game.player.kills = 0;
    game.enemy.kills = 0;
    game.moves = [];
    game.turn.tickTime();
  },
  beginPlayer: function (cb) {
    if (game.currentState == 'table') {
      game.player.turn += 1;
      game.message.text(game.data.ui.yourturn);
      game.loader.removeClass('loading');
      game.turn.el.text(game.data.ui.yourturn).addClass('show');
      $('.map .card').removeClass('done');
      game.turn.start('turn', cb);
    }
  },
  beginEnemy: function (cb) {
    if (game.currentState == 'table') {
      game.enemy.turn += 1;
      game.message.text(game.data.ui.enemyturn);
      game.turn.start('unturn', cb);
    }
  },
  start: function (unturn, cb) {
    game.currentMoves = [];
    $('.table .card.dead').each(function () {
      var dead = $(this);
      if (game.time > dead.data('reborn') || 
          (game.mode == 'library' && !dead.hasBuff('wk-ult')) ) { 
        dead.reborn();
      }
    });
    $('.card').each(function () {
      var card = $(this);
      card.trigger('turnstart', { target: card });
      if (unturn == 'turn') card.trigger('playerturnstart', { target: card });
      else card.trigger('enemyturnstart', { target: card });
      card.reduceStun();
    });
    game.timeout(400, game.turn.tickTime);
    game.timeout(800, function () {
      game.turn.el.removeClass('show');
      if (unturn === 'turn') {
        game.states.table.el.removeClass('unturn');
        game.highlight.map();
        game.states.table.skip.attr('disabled', false);
      }
      if (cb) cb();
    });
  },
  count: function (unturn, cb1, cb2) {
    if (game.turn.counter >= 0) {
      var turncount = game.data.ui.yourturncount;
      if (unturn === 'unturn') turncount = game.data.ui.enemyturncount;
      game.message.text(turncount + ' ' + game.turn.counter + ' ' + game.data.ui.seconds);
      if (game.turn.counter === 0) cb2(unturn);
      else if (game.turn.counter > 0) {
        if (cb1) cb1(unturn);
        game.timeout(1000, game.turn.count.bind(this, unturn, cb1, cb2));
        game.turn.counter -= 1;
      }
    }
  },
  end: function (unturn, cb) {
    if (game.currentState == 'table') {
      game.turn.tickTime();
      game.states.table.skip.attr('disabled', true);
      game.message.text(game.data.ui.turnend);
      $('.spot.fountain').find('.card').each(function () {
        $(this).heal(10);
      });
      $('.map .card.heroes').each(function (i, card) {
        var hero = $(card);
        if (hero.hasClass('channeling')) game.turn.channel(hero);
        game.turn.buffs(hero);
        hero.trigger('turnend', { target: hero });
      });
      if (unturn === 'unturn' &&
          game.mode !== 'library') {
        game.turn.el.text(game.data.ui.enemyturn).addClass('show');
        game.timeout(800, function () { game.turn.el.removeClass('show'); });
      }
      game.moves.push(game.currentMoves.join('|'));
      if (cb) cb(unturn);
    }
  },
  channel: function (hero) {
    var duration = hero.data('channeling');
    if (duration) {
      var channel = hero.data('channel');
      if (duration < channel) hero.trigger('channel', hero.data('channel event')); 
      duration -= 1;
      hero.data('channeling', duration);
    } else hero.stopChanneling();
  },
  buffs: function (hero) {
    var buffs = hero.find('.buffs > .buff');
    buffs.each(function (i, buffElement) {
      var buff = $(buffElement);
      var duration = buff.data('duration'),
          data = buff.data('buff');
      if (duration) {
        duration -= 1;
        buff.data('duration', duration);
      } else if (data && data.temp && data.buffId) {
        hero.removeBuff(data.buffId);
        buff.trigger('expire', {target: hero});
      }
    });
  },
  noAvailableMoves: function () {
    return $('.map .player.card:not(.towers, .ghost)').length == $('.map .player.card.done:not(.towers, .ghost)').length;
  },
  tickTime: function () { 
    game.time += 0.5; // console.trace('t', game.time, game.turn.hours() );
    game.totalTurns = Math.floor(game.player.turn + game.enemy.turn);
    game.turn.msg.text(game.data.ui.turns + ': ' + game.player.turn + '/' + game.enemy.turn + ' (' + game.totalTurns + ')');
    game.turn.time.text(game.data.ui.time + ': ' + game.turn.hours() + ' ' + game.turn.dayNight());
  },
  hours: function () {
    var convertedMin, intMin, stringMin,
      hours = game.time % (game.dayLength * 2),
      intHours = parseInt(hours, 10),
      minutes = hours - intHours;
    convertedMin = minutes * 60;
    intMin = parseInt(convertedMin, 10);
    stringMin = intMin < 10 ? '0' + intMin : intMin;
    return intHours + ':' + stringMin;
  },
  dayNight: function () {
    var hours = game.time % (game.dayLength * 2);
    if (hours >= 6 && hours < 18) {
      game.map.el.removeClass('night');
      return game.data.ui.day;
    } else {
      game.map.el.addClass('night');
      return game.data.ui.night; 
    }
  }
};
