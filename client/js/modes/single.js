game.single = {
  build: function () {
    if (!game.single.builded) {
      game.single.builded = false;
      game.newId();
    }
  },
  chooseStart: function (hero) {
    game.states.choose.selectFirst('force');
    game.states.choose.librarytest.hide();
    game.states.choose.randombt.show();
    game.states.choose.mydeck.show();
    game.states.choose.enablePick();
  },
  pick: function () {
    var availableSlots = $('.slot.available').length;
    if (!availableSlots) {
      game.loader.addClass('loading');
      game.states.choose.back.attr('disabled', true);
      game.timeout(400, game.single.chooseEnd);
    }
  },
  chooseEnd: function () {
    game.states.choose.playerpicks();
    game.states.changeTo('vs');
  },
  setTable: function () {
    if (!game.single.started) {
      game.single.started = true;
      game.states.table.enableUnselect();
      game.message.text(game.data.ui.battle);
      game.loader.removeClass('loading');
      game.audio.play('horn');
      game.player.placeHeroes();
      game.enemy.placeHeroes();
      game.states.table.surrender.show();
      game.states.table.skip.show().attr('disabled', true);
      game.states.table.discard.attr('disabled', true).show();
      game.turn.build(6);
      game.player.kills = 0;
      game.enemy.kills = 0;
      game.ai.start();
      game.states.table.el.addClass('turn');
      setTimeout(function () {
        game.skill.build('player');
        game.skill.build('enemy');
        game.timeout(400, game.single.beginPlayer);
      }, 400);
    }
  },
  startTurn: function (turn) {
    if (turn == 'player-turn') game.turn.counter = game.timeToPlay;
    else game.turn.counter = 15;
    game.timeout(1000, function () { 
      game.turn.count(turn, game.single.countEnd); 
    });
  },
  countEnd: function (turn) {
    if (turn == 'player-turn') { 
      game.single.endPlayerTurn();
    }
    if (turn == 'enemy-turn') {
      game.loader.addClass('loading');
      game.single.endEnemyTurn();
    }
  },
  beginPlayer: function () {
    game.turn.beginPlayer(function () {
      game.single.startTurn('player-turn');
      if (game.player.turn === 6) {
        $('.card', game.player.skills.ult).appendTo(game.player.skills.deck);
      }
      game.player.buyHand();
      game.tower.attack('enemy');
    });
  },
  action: function () {
    game.timeout(400, function () {
      if (game.turn.noAvailableMoves()) {
        game.turn.stopCount();
        game.single.endPlayerTurn();
      }
    });
  },
  skip: function () {
    if ( game.isPlayerTurn() ) {
      game.turn.stopCount();
      game.single.endPlayerTurn();
    }
  },
  endPlayerTurn: function () {
    game.states.table.el.removeClass('turn');
    game.turn.end('enemy-turn', game.single.beginEnemy);
  },
  beginEnemy: function () {
    game.turn.beginEnemy(function () {
      game.single.startTurn('enemy-turn');
      if (game.enemy.turn === 6) {
        $('.card', game.enemy.skills.ult).appendTo(game.enemy.skills.deck);
      }
      game.enemy.buyHand();
      game.tower.attack('player');
      game.timeout(800, game.ai.turnStart);
    });
  },
  endEnemyTurn: function () {
    game.turn.stopCount();
    game.turn.end('enemy-turn', game.single.beginPlayer);
  },
  win: function () {
    game.turn.stopCount();
    game.states.campaign.stage++;
    game.winner = game.player.name;
    game.states.table.el.removeClass('turn');
    game.states.result.updateOnce = true;
    game.states.changeTo('result');
  },
  surrender: function () {
    game.single.lose();
  },
  lose: function () {
    game.turn.stopCount();
    game.winner = game.enemy.name;
    game.states.table.el.removeClass('turn');
    game.loader.removeClass('loading');
    game.states.result.updateOnce = true;
    game.states.changeTo('result');
  },
  clear: function () {
    game.single.started = false;
  }
};