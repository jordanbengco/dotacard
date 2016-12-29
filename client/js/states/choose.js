game.states.choose = {
  size: 200,
  build: function () {
    this.pickbox = $('<div>').addClass('pickbox').attr('title', game.data.ui.chooseheroes).appendTo(this.el);
    this.pickedbox = $('<div>').addClass('pickedbox').hide();
    this.slots = this.buildSlots();
    this.counter = $('<p>').addClass('counter').hide().appendTo(this.pickedbox);
    this.pickDeck = this.buildDeck();
    this.buttonbox = $('<div>').addClass('buttonbox');
    this.back = $('<div>').addClass('back button').text(game.data.ui.back).attr({title: game.data.ui.backtomenu}).on('mouseup touchend', this.backClick).appendTo(this.buttonbox);
    this.randombt = $('<div>').addClass('random button').text(game.data.ui.random).attr({title: game.data.ui.randomtitle}).on('mouseup touchend', game.states.choose.randomClick).appendTo(this.buttonbox);
    this.mydeck = $('<div>').addClass('mydeck button highlight').text(game.data.ui.mydeck).attr({title: game.data.ui.mydecktitle}).on('mouseup touchend', this.savedDeck).appendTo(this.buttonbox);
    this.librarytest = $('<div>').addClass('librarytest button highlight').text(game.data.ui.librarytest).attr({title: game.data.ui.librarytesttitle}).on('mouseup touchend', this.testHeroClick).appendTo(this.buttonbox);
    this.el.append(this.pickedbox).append(this.buttonbox);
  },
  start: function () {
    var hero = localStorage.getItem('choose');
    if (game.mode && game[game.mode].chooseStart) game[game.mode].chooseStart(hero);
  },
  buildDeck: function (pickDeck) {
    game.library.buildSkills();
    return game.deck.build({
      name: 'heroes', 
      cb: function (pickDeck) {
        pickDeck.addClass('pickdeck').appendTo(game.states.choose.pickbox);
        $.each(pickDeck.data('cards'), function (i, card) {
          card[0].dataset.index = i;
          if (card.data('disable')) card.addClass('dead');
          card.on('mousedown.choose touchstart.choose', game.states.choose.select);
          var hero = card.data('hero');
          $('.library.skills .card.'+hero).each(function (i, el) {
            var skill = $(el);
            if (skill.data('deck') == game.data.ui.buy) {
              card.selfBuff(skill, null, 'fxOff'); 
            }
          });
        });
        pickDeck.width(game.states.choose.size + $('.card').width() * pickDeck.children().length);
        $('.pickbox .card.dead').each(function (i, card) {
          card.dataset.index += pickDeck.data('cards').length;
          game.states.choose.pickDeck.append(card);
        });
      }
    });
  },
  buildSlots: function () {
    var slots = [];
    for (var slot = 0; slot < 5; slot += 1) {
      slots.push($('<div>').appendTo(this.pickedbox).attr({ title: game.data.ui.rightpick }).data('slot', slot).addClass('slot available').on('mouseup touchend', this.pick));
    }
    return slots;
  },
  select: function (recover) {
    var card = $(this);
    if (card.hasClass && card.hasClass('card')) {
      $('.choose .selected').removeClass('selected draggable');
      card.addClass('selected');
      if (game.mode !== 'library' && !card.hasClass('dead')) card.addClass('draggable');
      else if (game.mode == 'library') game.library.select(card, recover);
      var index = card.siblings(':visible').addBack().index(card) || card.index();
      game.states.choose.pickDeck.css('margin-left', index * -1 * game.states.choose.size);
      if (!card.hasClass('dead')) localStorage.setItem('choose', card.data('hero'));
    }
  },
  enablePick: function () {
    game.states.choose.pickEnabled = true;
    game.states.choose.pickedbox.show();
  },
  disablePick: function () {
    game.states.choose.pickEnabled = false;
  },
  pick: function () {
    var card,
      slot = $(this).closest('.slot'),
      pick = $('.pickbox .card.selected');
    if (!pick.data('disable') &&
        game.states.choose.pickEnabled &&
        game.mode !== 'library') {
      game.states.choose.mydeck.attr('disabled', true);
      game.audio.play('activate');
      if (slot.hasClass('available')) {
        slot.removeClass('available');
        var prev = pick.prevAll(':visible').first();
        if (prev.length) card = prev;
        else card = pick.nextAll(':visible').first();
      } else {
        card = slot.children('.card');
        card.on('mousedown.choose touchstart.choose', game.states.choose.select).insertBefore(pick);
      }
      pick.appendTo(slot).clearEvents('choose');
      game.states.choose.sort();
      game.states.choose.select.call(card);
      if (game[game.mode].pick) game[game.mode].pick();
    }
  },
  selectFirst: function (force) {
    var first = game.states.choose.pickDeck.children().first();
    this.select.call(first, force);
  },
  selectHero: function (hero, force) {
    var card = game.states.choose.pickDeck.children('.'+hero);
    this.select.call(card, force);
  },
  sort: function () {
    $('.pickdeck .card').sort(function (a, b) {
      return a.dataset.index - b.dataset.index;
    }).appendTo('.pickdeck');
  },
  savedDeck:  function () {
    if (!$(this).attr('disabled')) {
      $(this).attr('disabled', true);
      var deck = localStorage.getItem('mydeck').split(',');
      if (deck && deck.length == 5) {
        game.states.choose.remember(deck);
        if (game[game.mode].chooseEnd) {
          game.timeout(100, game[game.mode].chooseEnd);
        }
      }
    }
  },
  remember: function (deck) {
    $('.slot').each(function (i) {
      var slot = $(this),
          hero = deck[i],
          card = $('.pickbox .card.'+hero);
      if (card && slot.hasClass('available')) {
        slot.append(card).removeClass('available selected');
      }
      if ($('.choose .card.selected').length === 0) { game.states.choose.selectFirst(); }
    });
  },
  randomClick: function () {
    if (!$(this).attr('disabled')) {
      $(this).attr('disabled', true);
      game.states.choose.randomFill();
      if (game[game.mode].chooseEnd) {
        game.timeout(100, game[game.mode].chooseEnd);
      }
    }
  },
  randomFill: function () {
    $('.slot').each(function () {
      var slot = $(this), card;
      if (slot.hasClass('available')) {
        card = $('.pickbox .card').not('.dead').randomCard('noseed');
        slot.append(card).removeClass('available selected');
      }
      if ($('.choose .card.selected').length === 0) { game.states.choose.selectFirst(); }
    });
  },
  playerpicks: function () {
    game.player.picks = [];
    $('.slot').each(function () {
      var slot = $(this), card = slot.find('.card');
      game.player.picks[slot.data('slot')] = card.data('hero');
      if (game.player.picks.length === 5) {
        localStorage.setItem('mydeck', game.player.picks);
      }
    });
  },
  testHeroClick: function () {
    //library only
    if (!game.states.choose.librarytest.attr('disabled')) {
      game.library.chooseEnd();
    } else game.alert('Sorry but this hero is still under development!');
  },
  backClick: function () {
    if (!$(this).attr('disabled')) {
      if (game.mode == 'online') {
        game.db({
          'set': 'back',
          'data': game.id
        }, game.states.choose.toMenu);
      } if (game.mode == 'single') {
        game.states.changeTo('campaign');
      } else game.states.choose.toMenu();
    }
  },
  toMenu: function () {
    game.clear();
    game.states.changeTo('menu');
  },
  clear: function () {
    setTimeout(function () {
      $('.slot .card.skills').appendTo(game.library.skills);
      $('.pickbox .card').show();
      $('.slot').addClass('available').show();
      this.mydeck.attr('disabled', false);
      this.randombt.attr('disabled', false);
      this.back.attr({disabled: false});
      this.counter.hide();
      this.pickedbox.hide();
      this.librarytest.hide();
      this.randombt.hide();
      this.mydeck.hide();
      this.sort();
      $('.slot .card.heroes').prependTo(this.pickDeck).on('mousedown.choose touchstart.choose', game.states.choose.select);
    }.bind(this), 100);
  }
};
