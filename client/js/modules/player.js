game.player = {
  manaBuild: function () {
    game.player.maxCards = Math.round(game.player.mana / 2);
    game.player.cardsPerTurn = 1 + Math.round(game.player.mana / 10);
    game.player.maxCards = Math.round(game.player.mana / 2);
    game.player.skills = {};
  },
  buyCard: function () {
    if (game.player.turn === 6) {
      $('.player.deck.skills.ult .card').appendTo(game.player.skills.deck);
    }
    var availableSkills = $('.skills.available.player.deck .card'),
      card = game.deck.randomCard(availableSkills),
      heroid,
      hero,
      to,
      skillid;
    if (availableSkills.length === 0) {
      $('.player.deck.skills.cemitery .card').appendTo(game.player.skills.deck);
    }
    if (card.data('type') === game.data.ui.toggle) {
      card.appendTo(game.player.skills.sidehand);
    } else if (card.data('type') === game.data.ui.automatic) {
      heroid = card.data('hero');
      hero = $('.map .player.heroes.' + heroid);
      to = game.map.getPosition(hero);
      skillid = card.data('skill');
      card.passive(to);
      if (game.mode == 'online') game.currentData.moves.push('P:' + to + ':' + skillid + ':' + heroid);
      card.appendTo(game.player.skills.sidehand);
    } else {
      card.appendTo(game.player.skills.hand);
    }
  },
  buyHand: function () {
    var i;
    for (i = 0; i < game.player.cardsPerTurn; i += 1) {
      if (game.player.skills.hand.children().length < game.player.maxCards) {
        game.player.buyCard();
      }
    }
  },
  move: function () {
    var spot = $(this),
      card = game.selectedCard, 
      from = game.map.getPosition(card),
      to = game.map.getPosition(spot);
    if (!game.states.table.el.hasClass('unturn') && 
        spot.hasClass('free') && 
        from !== to && 
        !card.hasClass('done')) {
      card.move(to);
      if (game.mode == 'online') game.currentData.moves.push('M:' + from + ':' + to);
      game.highlight.clearMap();
    }
  },
  attack: function () {
    var target = $(this),
      source = game.selectedCard,
      from = game.map.getPosition(source),
      to = game.map.getPosition(target);
    if (!game.states.table.el.hasClass('unturn') && source.data('damage') && from !== to && !source.hasClass('done') && target.data('current hp')) {
      source.attack(target);
      if (game.mode == 'online') game.currentData.moves.push('A:' + from + ':' + to);
      game.highlight.clearMap();
    }
  },
  passive: function () {
    var target = $(this),
      skill = game.selectedCard,
      hero = skill.data('hero'),
      skillid = skill.data('skill'),
      to = game.map.getPosition(target);
    if (hero && skillid && 
       !game.states.table.el.hasClass('unturn')) {
      game.audio.play('activate');
      if (game.mode == 'online') game.currentData.moves.push('P:' + to + ':' + skillid + ':' + hero);
      skill.passive(target);
      game.states.table.animateCast(skill, target);
      game.highlight.clearMap();
    }
  },
  toggle: function () {
    var target = $(this),
      skill = game.selectedCard,
      hero = skill.data('hero'),
      skillid = skill.data('skill'),
      to = game.map.getPosition(target);
    if (hero && skillid && !game.states.table.el.hasClass('unturn')) {
      game.audio.play('activate');
      if (game.mode == 'online') game.currentData.moves.push('T:' + to + ':' + skillid + ':' + hero);
      skill.toggle(target);
      game.states.table.animateCast(skill, target);
      game.highlight.clearMap();
    }
  },
  cast: function () {
    var target = $(this),
      skill = game.selectedCard,
      source = $('.map .source'),
      from = game.map.getPosition(source),
      to = game.map.getPosition(target),
      hero = skill.data('hero'),
      skillid = skill.data('skill');
    if (hero && skillid && from && to && 
       !game.states.table.el.hasClass('unturn') && 
       !source.hasClass('done')) {
      if (game.mode == 'online') game.currentData.moves.push('C:' + from + ':' + to + ':' + skillid + ':' + hero);
      source.cast(skill, to);
      game.states.table.animateCast(skill, to);
      game.highlight.clearMap();
    }
  }
};