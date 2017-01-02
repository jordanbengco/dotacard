game.states.table = {
  build: function () {
    game.camera = $('<div>').addClass('camera');
    this.map = game.map.build({'width': game.width, 'height': game.height}).appendTo(game.camera);
    this.selectedArea = $('<div>').addClass('selectedarea');
    this.selectedCard = $('<div>').addClass('selectedcard').appendTo(this.selectedArea);
    this.cardBack = $('<div>').addClass('cardback').appendTo(this.selectedCard);
    //this.neutrals = $('<div>').appendTo(this.el).addClass('neutraldecks');
    this.player = $('<div>').addClass('playerdecks player');
    this.enemy = $('<div>').addClass('enemydecks enemy');
    this.buttonbox = $('<div>').addClass('buttonbox');
    this.surrender = $('<div>').hide().appendTo(this.buttonbox).addClass('surrender button').text(game.data.ui.surrender).on('mouseup touchend', this.surrenderClick);
    this.back = $('<div>').hide().appendTo(this.buttonbox).addClass('back button').text(game.data.ui.back).on('mouseup touchend', this.backClick);
    this.skip = $('<div>').hide().appendTo(this.buttonbox).addClass('skip button highlight').attr({disabled: true}).text(game.data.ui.skip).on('mouseup touchend', this.skipClick);
    this.discard = $('<div>').hide().appendTo(this.buttonbox).addClass('discard button').attr({disabled: true}).text(game.data.ui.discard).on('mouseup touchend', this.discardClick);
    this.el.append(game.camera).append(this.selectedArea).append(this.buttonbox).append(this.player).append(this.enemy);
  },
  start: function (recover) {
    if (game.turn.el) {
      game.turn.time.show();
      game.turn.msg.show();
    }
    if (game.mode && !game.states.table.setup) {
      game.states.table.setup = true;
      game.tower.place();
      game.tree.place();
      game.units.place();
      game[game.mode].setTable();
    }
  },
  enableUnselect: function () {
    game.states.table.el.on('mousedown touchstart', function (event) { 
      var target = $(event.target); 
      if (!target.closest('.button, .card, .movearea, .targetarea').length) {
        game.card.unselect();
        if (game.mode && game[game.mode].unselected) game[game.mode].unselected();
      }
    });
  },
  animateCast: function (skill, target, event, cb) {
    game.highlight.clearMap();
    if (typeof target === 'string') { target = $('#' + target); }
    var s = skill.offset();
    var x = event.clientX - s.left, y = event.clientY - s.top;
    var fx = x * 1 - 150; var fy = y * 1 - 220;
    skill.css({transform: 'translate('+fx+'px, '+fy+'px) scale(0.3)'});
    game.timeout(400, function () {
      $(this.skill).css({
        top: '',
        left: '',
        transform: ''
      });
      cb();
    }.bind({ skill: skill }));
  },
  skipClick: function () {
    if (!game.states.table.skip.attr('disabled')) {
      game.states.table.skip.attr('disabled', true);
      game.highlight.clearMap();
      if (game[game.mode].skip) game[game.mode].skip();
    }
  },
  surrenderClick: function () {
    //online && tutorial
    game.confirm(function(confirmed) {
      if (confirmed && game.mode && game[game.mode].surrender) {
        game[game.mode].surrender();
      }
    }, game.data.ui.leave);
  },
  backClick: function () {
    //library only
    game.states.table.clear();
    game.setMode('library');
    game.states.changeTo('choose');
  },
  discardClick: function () {
    if (!game.states.table.discard.attr('disabled') &&
        game.selectedCard &&
        game.selectedCard.hasClass('skills') && 
        game.isPlayerTurn() ) {
      game.player.discard(game.selectedCard);
      game.states.table.discard.attr('disabled', true);
    }
  },
  clear: function () {
    this.selectedCard.removeClass('flip');
    game.states.table.setup = false;
    game.map.clear();
    game.card.clearSelection();
    $('.table .card').remove();
    $('.table .deck').remove();
    this.buttonbox.show().children().hide();
    this.el.removeClass('turn');
    if (game.turn.el) game.turn.el.removeClass('show');
    game.clearTimeouts();
  },
  end: function () {
    if (game.turn.el) {
      game.turn.el.removeClass('show');
      game.turn.msg.hide();
      game.turn.time.hide();
    }
  }
};
