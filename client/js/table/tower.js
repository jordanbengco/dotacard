﻿game.tower = {
  build: function (side, pos) {
    var tower = game.card.build({
      className: 'towers static ' + side,
      side: side,
      name: game.data.ui.tower,
      attribute: game.data.ui.building,
      range: game.data.ui.ranged,
      description: game.data.ui.towerDescription,
      armor: 4,
      resistance: 100,
      damage: 16,
      hp: 80
    });
    tower.on('mousedown touchstart', game.card.select);
    tower.place(pos);
    tower.around(tower.data('range'), function (spot) {
      spot.addClass(side + 'area');
    });
    return tower;
  },
  place: function () {
    var p = 'C6';
    game.player.tower = game.tower.build('player', p);
    game.enemy.tower = game.tower.build('enemy', game.map.mirrorPosition(p));
    p = 'A6';
    $('#' + p).addClass('fountain fountainplayer').attr({title: 'Player Fountain'});
    $('#' + game.map.mirrorPosition(p)).addClass('fountain fountainenemy').attr({title: 'Enemy Fountain'});
  },
  attack: function (side) {
    var from, to,
      attacker = game.opponent(side),
      lowestHp = {
        notfound: true,
        data: function (c) { return Infinity; }
      };
    $('.map .'+ attacker +'area .card.' + side).each(function () {
      var target = $(this);
      if (target.data('current hp') < lowestHp.data('current hp')) {
        lowestHp = target;
      }
    });
    if (!lowestHp.notfound) {
      game[attacker].tower.attack(lowestHp);
      if (game.mode === 'online') {
        from = game[attacker].tower.getPosition();
        to = lowestHp.getPosition();
        game.currentMoves.push('A:' + from + ':' + to);
      }
    }
  }
};
