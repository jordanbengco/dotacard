/*
states.changeTo('yourState')  -> set current state
       .currentstate -> get current state
       .el -> states div appended to game.container

each states
       have an element (this.el) appended to states.el
       if have build function will run once
       if have start function will run every time
       if have end function will run every time

////////////////////////////////////////////////////////*/

var states = {
  changeTo: function(state){
    if(state == states.currentstate) return;    
    var oldstate = states[states.currentstate];
    if(oldstate.el) oldstate.el.addClass('hidden'); 
    if(oldstate.end) oldstate.end();    
    var newstate = states[state];
    if(newstate.build && !newstate.builded){      
      newstate.build();
      newstate.builded = true;
    }
    states.el.removeClass(states.currentstate).addClass(state);
    if(newstate.el) newstate.el.removeClass('hidden').append(game.loader, game.message, game.triesCounter);
    states.currentstate = state;
    if(newstate.start) newstate.start();
  },
  
  build: function(){
    states.el = $('<div>').attr('id','states').appendTo(game.container);
    $.each(states, function(id){
      if(id == 'load' || id == 'el' || id == 'changeTo' || id == 'build' || id == 'currentstate') return;
      states[id].el = $('<div>').attr('id',id).appendTo(states.el).addClass('hidden');
      if(states[id].build) {
        states[id].build();
        states[id].builded = true;
      }
    });     
    setTimeout(function(){ game.states.changeTo('intro'); }, 1000);
  }, 
  
  currentstate: 'load',

  ////////////////////////////////////////////////////////////////////////////////////////
  'load': {
  ////////////////////////////////////////////////////////////////////////////////////////  
    
    end: function(){
      if(!game.debug){
        window.oncontextmenu = game.nomenu;
        window.onbeforeunload = function(){
          return 'Sure you wanna leave?';
        };
      }
    },
    
    reset: function(){
      if(game.debug){
        console.log('Reset', game);
      } else {
        alert('Connection error, sorry.');
        location.reload(true);
      }
    },
    
    quit: function(){
      var sure = confirm('Sure you wanna leave?');
      if(sure) location.reload(true);
    }
  },
  
  ////////////////////////////////////////////////////////////////////////////////////////
  'intro': {   
  ////////////////////////////////////////////////////////////////////////////////////////  
    
    build: function(){        
      if(!game.debug){ 
        this.video = $('<div>').addClass('introvideo').hide().appendTo(this.el).tubular({
          videoId: '-cSFPIwMEq4',
          scale: 1.2,
          onReady: function(video){ states.intro.videoReady = true; }
        });  
        this.box = $('<div>').hide().appendTo(this.el).addClass('box');
        this.text = $('<p>').appendTo(this.box).addClass('intro').html('DotaCard <a target="_blank" href="http://scriptogr.am/rafaelcastrocouto">beta</a>');
        this.el.click(function(){
          clearTimeout(game.timeout);  
          states.changeTo('login');
        }); 
      }
    },
    
    start: function(){
      if(!game.debug){
        this.box.fadeIn(3000);
        game.timeout = setTimeout(function(){
          if(states.currentstate == 'intro' && states.intro.videoReady) states.intro.playVideo();
          else states.changeTo('login');    
        }, 4000); 
        
      } else {
        states.changeTo('login'); 
      }
    },
    
    playVideo: function(){
      if(game.status != 'playing'){
        game.loader.addClass('hidden');
        this.box.delay(6000).fadeOut(3000);
        this.video.delay(3000).fadeIn(3000);
        setTimeout(function(){
          if(states.currentstate == 'intro'){
            var player = states.intro.video.data('tubular-player');
            console.log(player);
            player.playVideo();
          }
        }, 3000);
        game.timeout = setTimeout(function(){
          if(states.currentstate == 'intro'){  
            states.changeTo('login');
          }
        }, 102600); 
      }
    },
    
    pauseVideo: function(){
      var player = states.intro.video.data('tubular-player');
      player.pauseVideo();     
    },
    
    end: function(){
      if(!game.debug) this.video.remove();
    }
  },
  
  ////////////////////////////////////////////////////////////////////////////////////////
  'login': {  
  ////////////////////////////////////////////////////////////////////////////////////////
    
    build: function(){       
      this.menu = $('<div>').appendTo(this.el).addClass('box');
      this.title = $('<h1>').appendTo(this.menu).text('Choose a name');
      this.input = $('<input>').appendTo(this.menu).attr({ 'placeholder': 'Type any name here', 'type': 'text'})
      .keydown(function(e){
        if(e.which == 13) states.login.button.click();
      });    
      var c = 'Choose a name and click to play';
      this.button = $('<button>').appendTo(this.menu).attr({'placeholder': c, 'title': c}).text('Play')
      .click(function(){        
        var name = states.login.input.val();        
        if(!name) states.login.input.focus();
        else {
          game.player.name = name;
          states.login.button.attr( "disabled", true );
          game.loader.removeClass('hidden');
          db({'get':'server'}, function(server){
            if(server.status == 'online'){
              game.status = 'logged';
              states.changeTo('menu');
            }
            else states.load.reset();
          });            
        } 
      });
      this.text = $('<div>').appendTo(this.menu);
      this.logwith = $('<p>').appendTo(this.text).html('Login with: <a target="_blank" href="https://github.com/rafaelcastrocouto/dotacard" title="Coming soon">Facebook, Google</a>');
      this.lang = $('<p>').appendTo(this.text).html('Language: <a target="_blank" href="https://github.com/rafaelcastrocouto/dotacard" title="Coming soon">Translate</a>');
    },
    
    start: function(){
      game.loader.addClass('hidden');
      this.input.focus();
      game.status = 'logging';
      if(game.debug){
        this.input.val('Bot'+(parseInt(Math.random()*100)));
        this.button.click();
      }
    },
    
    end: function(){
      this.button.attr( "disabled", false );
    },
  },
  
  ////////////////////////////////////////////////////////////////////////////////////////
  'menu': {
  ////////////////////////////////////////////////////////////////////////////////////////  
    
    build: function(){     
      this.menu = $('<div>').appendTo(this.el).addClass('box'); 
      this.title = $('<h1>').appendTo(this.menu).text('Choose a game mode');
      this.public = $('<button>').appendTo(this.menu).attr({'title': 'Find an adversary online'}).text('Play public match')
      .click(function(){        
        states.menu.public.attr( "disabled", true );
        db({'get':'waiting'}, function(waiting){          
          if(waiting.id == 'none'){
            game.seed = new Date().valueOf();
            game.id = btoa(game.seed);
            var myGame = {id: game.id};
            db({'set': 'waiting', 'data': myGame}, function(){ 
              game.status = 'waiting';
              states.changeTo('choose');
            });
            
          } else {             
            game.id = waiting.id;     
            game.seed = parseInt(atob(game.id));
            game.status = 'found';
            var clearWait = {id: 'none'};            
            db({'set': 'waiting', 'data': clearWait}, function(){               
              states.changeTo('choose');
            });              
          }
        });
      });

      this.friend = $('<button>').appendTo(this.menu).attr({ 'title': 'Coming soon - Search for a friend to play', 'disabled': true }).text('Play with a friend');        
      this.bot = $('<button>').appendTo(this.menu).attr({ 'title': 'Coming soon - Play with against the computer', 'disabled': true }).text('Play with a bot');    
      this.options = $('<button>').appendTo(this.menu).attr({ 'title': 'Coming soon - User Configurations', 'disabled': true }).text('Options'); 
      this.credits = $('<button>').appendTo(this.menu).attr({ 'title': 'Coming soon - Credits', 'disabled': true }).text('Credits');
      
      if(!game.debug) this.chat = $('<iframe src="http://webchat.freenode.net?nick='+game.player.name+'&channels=%23dotacard" width="450" height="570"></iframe>').addClass('chat').appendTo(this.el);
    },
    
    start: function(){
      game.loader.addClass('hidden');
      game.message.html('Welcome <b>'+game.player.name+'</b>! ');
      $('<small>').addClass('logout').appendTo(game.message).text('Logout').click(states.load.quit);
      this.public.focus();
      if(game.debug){
        this.public.click();
      }
    },
    
    end: function(){
      states.menu.public.attr('disabled', false);
    }
  },
  
  ////////////////////////////////////////////////////////////////////////////////////////
  'choose': {   
  ////////////////////////////////////////////////////////////////////////////////////////  
    
    build: function(){    
      this.pickbox = $('<div>').appendTo(this.el).addClass('pickbox');
      this.pickedbox = $('<div>').appendTo(this.el).addClass('pickedbox').addClass('hidden').on('contextmenu', game.nomenu);
      for(var slot = 0; slot < 5; slot++){
        $('<div>').appendTo(this.pickedbox).attr({title: 'Click here to pick'}).data('slot', slot).addClass('slot available');
      }
      this.prepickbox = $('<div>').appendTo(this.el).addClass('prepickbox').html('My Decks<br>Comming soon...').addClass('hidden');
      this.counter = $('<p>').appendTo(this.pickedbox).addClass('counter').addClass('hidden');
      
      this.pickDeck = Deck({
        name: 'heroes', 
        cb: function(pickDeck){
          pickDeck.addClass('pickdeck').appendTo(states.choose.pickbox);
          states.choose.size = 100;
          $.each(pickDeck.data('cards'), function(id, card){
            card.data('place', card.index());  
            card.on('click.active', function(){
              var clickedCard = $(this);
              if(!clickedCard.hasClass('picked')){
                $('.card.active').removeClass('active');
                clickedCard.addClass('active');
                states.choose.pickDeck.css('left', clickedCard.index() * states.choose.size * -1);
              }
            });
          });
          pickDeck.width((states.choose.size + 100) * pickDeck.children().length);
        }
      });      
    },
    
    start: function(){ 
      game.currentData = {};
      this.findGame();
    },

    findGame: function(){   
      game.tries = 1;        
      if(game.status == 'found'){
        game.message.text('We found a game! Connecting ');
        game.loader.removeClass('hidden');
        game.player.type = 'challenger';
        game.currentData.challenger = game.player.name;
        db({'set': game.id, 'data': game.currentData}, function(){
          states.choose.getChallenged();
        });        
      } 
      if(game.status == 'waiting'){
        game.message.text('Searching for an enemy ');
        game.loader.removeClass('hidden');
        game.player.type = 'challenged';
        states.choose.getChallenger();
      }  
    },
    
    getChallenged: function(){
      db({'get': game.id }, function(found){         
        if(found.challenged){
          game.triesCounter.text('');
          game.currentData = found;  
          states.choose.battle(found.challenged, 'challenged');
        } else {
          game.triesCounter.text('('+(game.tries++)+')');  
          if(game.tries > game.connectionLimit) states.load.reset();
          else game.timeout = setTimeout(states.choose.getChallenged, 1000);
        }
      });
    },

    getChallenger: function(){
      db({'get': game.id }, function(found){
        if(found.challenger){
          game.triesCounter.text('');
          game.currentData = found;
          game.currentData.challenged = game.player.name;
          db({'set': game.id, 'data': game.currentData}, function(){
            states.choose.battle(found.challenger, 'challenger');
          });          
        } else {
          game.triesCounter.text('('+(game.tries++)+')');                
          if(game.tries > game.waitLimit) states.load.reset(); //todo: sugest bot match         
          else game.timeout = setTimeout(states.choose.getChallenger, 1000);
        }
      });
    },

    battle: function(enemy, challenge){     
      game.status = 'picking';
      game.loader.addClass('hidden');
      this.el.addClass('turn');
      game.enemy.name = enemy; 
      game.enemy.type = challenge; 
      game.message.html('Battle Found! <b>'+ game.player.name + '</b> vs <b class="enemy">' + game.enemy.name+'</b>');                
      this.counter.removeClass('hidden');
      //todo: play sound and stuff!         
      this.count = game.debug ? 1 : game.timeToPick;
      this.enablePick();
      clearTimeout(game.timeout);
      game.timeout = setTimeout(states.choose.pickCount, 1000);      
    },

    enablePick: function(){
      this.pickedbox.removeClass('hidden');
      this.prepickbox.removeClass('hidden');
      $('.slot').on('click.pick contextmenu.pick', states.choose.pick);
    },
    
    disablePick: function(){
      game.status = 'battle';
      $('.slot').off('click.pick contextmenu.pick', states.choose.pick);
    },

    pick: function(){
      var slot = $(this);
      if(slot.hasClass('available')){
        var pick = $('.pickbox .card.active');
        if(pick.length){
          slot.removeClass('available');
          pick.removeClass('active').appendTo(slot);
        }
      } else {        
        var card = slot.children('.card').addClass('active');
        if(card.length){
          $('.pickbox .card.active').removeClass('active');
          var cardInPlace = $('.pickbox .deck').children()[card.data('place')];
          $(cardInPlace).before(card);
          states.choose.pickDeck.css('left', card.index() * states.choose.size * -1);
          slot.addClass('available');
        }
      }
      return false;
    },

    pickCount: function(){ 
      states.choose.counter.text('Pick your deck, game starts in: '+(states.choose.count--));      
      if(states.choose.count < 0) {   
        states.choose.disablePick();
        states.choose.counter.text('Get Ready!');  
        states.choose.fillDeck();   
      }
      else setTimeout(states.choose.pickCount, 1000);
    },
    
    fillDeck: function(){
      if(game.debug){
        if(game.player.type == 'challenger') game.player.picks = ['wk','cm','ld','nyx','kotl'];
        else game.player.picks = ['am','cm','pud','ld','kotl'];
        states.choose.sendDeck();        
        return;
      }
      game.player.picks = [];
      $('.pickbox .card.active').removeClass('active');
      $('.slot').each(function(){
        var slot = $(this), card;
        if(slot.hasClass('available')){
          card = Deck.randomCard($('.pickbox .card'), 'noseed');
          slot.append(card).removeClass('available');
        } else  card = $('.card', slot);
        game.player.picks[slot.data('slot')] = card.data('hero');
        if(game.player.picks.length == 5) states.choose.sendDeck();        
      });   
    },

    sendDeck: function(){     
      this.el.removeClass('turn'); 
      states.choose.pickDeck.css('left', 0);
      clearTimeout(states.choose.timeout);
      states.choose.tries = 1;
      if(game.player.type == 'challenged'){
        game.currentData.challengedDeck = game.player.picks.join('|');
        db({'set': game.id, 'data': game.currentData}, function(){          
          states.choose.getChallengerDeck();
        });
      }
      if(game.player.type == 'challenger') states.choose.getChallengedDeck();         
    },

    getChallengerDeck: function(){ 
      game.message.text('Loading challenger deck');
      game.loader.removeClass('hidden');
      db({'get': game.id }, function(found){         
        if(found.challengerDeck){
          game.triesCounter.text('');
          game.currentData = found;
          game.enemy.picks = game.currentData.challengerDeck.split('|');
          states.changeTo('table');          
        } else {
          game.triesCounter.text('('+(game.tries++)+')');
          if(game.tries > game.connectionLimit) states.load.reset();
          else game.timeout = setTimeout(states.choose.getChallengerDeck, 1000);
        }
      });
    },

    getChallengedDeck: function(){
      game.message.text('Loading enemy deck');
      game.loader.removeClass('hidden');
      db({'get': game.id }, function(found){         
        if(found.challengedDeck){ 
          game.triesCounter.text('');
          game.currentData = found;    
          game.currentData.challengerDeck = game.player.picks.join('|');
          game.enemy.picks = game.currentData.challengedDeck.split('|');
          db({'set': game.id, 'data': game.currentData}, function(){
            states.changeTo('table');
          });              
        } else {
          game.triesCounter.text('('+(game.tries++)+')');
          if(game.tries > game.connectionLimit) states.load.reset();
          else game.timeout = setTimeout(states.choose.getChallengedDeck, 1000);
        }      
      });  
    },

    end: function(){           
      clearTimeout(game.timeout);                   
      this.pickedbox.addClass('hidden');
      this.prepickbox.addClass('hidden');       
      $('.pickedbox .card').appendTo(this.pickDeck);
      $('.slot').addClass('available');
      this.counter.addClass('hidden');
    }
  },

  ////////////////////////////////////////////////////////////////////////////////////////
  'table': {
  ////////////////////////////////////////////////////////////////////////////////////////
    
    build: function(){      
      this.time =  $('<p>').appendTo(this.el).addClass('time').text('Time: 0:00 Day Turns: 0/0 (0)');
      this.selectedArea = $('<div>').appendTo(this.el).addClass('selectedarea');
      this.buildMap();        
    },
    
    start: function(){      
      if(game.status == 'battle'){
        game.message.text('Muuuuuuuuuuuuu!');
        game.loader.removeClass('hidden'); 
        
        this.placeTowers(); 
        this.placeHeroes(); 
        this.buildSkills(); 
        this.buildTurns(); 
        
        game.currentData = {};
        game.player.kills = 0;
        game.enemy.kills = 0;
        
        //todo: build storage.state
        
        game.timeout = setTimeout(states.table.beginTurn, 1000);
      }
    },
    
    buildMap: function(){
      this.camera = $('<div>').appendTo(this.el).addClass('camera');
      this.map = Map.build({
        'width': game.width,
        'height': game.height,
        'class': 'map'
      }).appendTo(this.camera);
    },
    
    createTower: function(side, spot){
      var tower = Card({
        className: 'towers static '+side,
        side: side,
        name: 'Tower',        
        attribute: 'Building',
        range: 'Ranged',
        damage: 7,
        hp: 80
      });        
      tower.on('click.select', Card.select).place(spot);
      Map.around(spot, Map.getRange('Ranged'), function(td){
         td.addClass(side+'area');
      }, true);
      return tower;
    },
    
    placeTowers: function(){      
      game.player.tower = states.table.createTower('player', 'C5');
      game.enemy.tower = states.table.createTower('enemy', 'J1');    
    },
    
    towerAutoAttack : function(){
      var lowestHp = {
          notfound: true,
          data: function(c){
          if(c == 'currenthp') return Infinity;
          else return false;
        }
      };
      $('.map .playerarea .card.enemy').each(function(){
        var target = $(this);
        if(target.data('currenthp') < lowestHp.data('currenthp')) {
          lowestHp = target;
        }
      });  
      if(!lowestHp.notfound) {
        game.player.tower.attack(lowestHp);
        var fromSpot = Map.getPosition(game.player.tower);
        var toSpot = Map.getPosition(lowestHp);
        game.currentData.moves.push('A:'+fromSpot+':'+toSpot); 
      }
    },
    
    placeHeroes: function(){ 
      
      var xxx = 'F3';//'I1';
      
      if(game.player.picks && game.enemy.picks){
        
        game.player.mana = 0;      
        this.playerHeroesDeck = Deck({
          name: 'heroes', 
          filter: game.player.picks, 
          cb: function(deck){        
            deck.addClass('player').appendTo(states.table.el);
            var x = 0, y = 3;
            $.each(deck.data('cards'), function(i, card){   
              var p = game.player.picks.indexOf(card.data('hero'));
              card.addClass('player').data('side','player').on('click.select', Card.select);
              card.place(Map.toId(x + p,y));
              
              if(game.debug){
                if(p==0) card.place(xxx);
              }
              
              game.player.mana += card.data('mana');
            });
          }
        });  
      
        game.enemy.mana = 0;
        this.enemyHeroesDeck = Deck({
          name: 'heroes', 
          filter: game.enemy.picks, 
          cb: function(deck){
            deck.addClass('enemy').hide().appendTo(states.table.el);        
            var x = 11, y = 1;
            $.each(deck.data('cards'), function(i, card){   
              var p = game.enemy.picks.indexOf(card.data('hero'));
              card.addClass('enemy').data('side','enemy').on('click.select', Card.select);          
              card.place(Map.toId(x - p,y));  
              
              if(game.debug){
                if(p==0) card.place(Map.mirrorPosition(xxx));
              }              
              
              game.enemy.mana += card.data('mana');
            });
          }
        }); 
      }
    },
    
    buildSkills: function(){      
      game.player.cardsPerTurn = 1 + Math.round(game.player.mana/10);      
      game.enemy.cardsPerTurn = 1 + Math.round(game.enemy.mana/10);      
      game.player.maxCards = Math.round(game.player.mana/2);      
      game.enemy.maxCards = Math.round(game.enemy.mana/2);      
      this.playerHand = $('<div>').appendTo(this.el).addClass('player deck skills hand');
      this.playerPermanent = $('<div>').appendTo(this.el).addClass('player deck skills permanent');
      this.playerUlts = $('<div>').hide().appendTo(this.el).addClass('player deck skills ult');      
      this.playerCemitery = $('<div>').hide().appendTo(this.el).addClass('player deck skills cemitery');
      this.playerSkillsDeck = Deck({
        name: 'skills', 
        multi: 'cards',
        filter: game.player.picks, 
        cb: function(deck){        
          deck.addClass('player available').hide().appendTo(states.table.el);
          $.each(deck.data('cards'), function(i, skill){   
            skill.addClass('player').data('side','player').on('click.select', Card.select);
            if(skill.data('special')) {
              if(skill.data('special') == 'permanent') skill.appendTo(states.table.playerPermanent);
              if(skill.data('special') == 'ult') skill.appendTo(states.table.playerUlts);
            }        
          });        
        }
      });
      game.enemy.hand = 0;
      this.enemySkillsDeck = Deck({
        name: 'skills', 
        filter: game.enemy.picks, 
        cb: function(deck){        
          deck.addClass('enemy hand cemitery permanent').hide().appendTo(states.table.el);
          $.each(deck.data('cards'), function(i, skill){   
            skill.addClass('enemy').data('side','enemy');        
          });        
        }
      });
    },
    
    selectHand: function(){      
      for(var i=0; i<game.player.cardsPerTurn; i++){
        if(states.table.playerHand.children().length < game.player.maxCards) 
          game.player.buyCard();
      }      
    },    
    
    enemyHand: function(){
      for(var i=0; i<game.enemy.cardsPerTurn; i++){
        if(game.enemy.hand < game.enemy.maxCards){
          game.enemy.buyCard();
          game.enemy.hand++;
        }
      }      
    },
    
    buildTurns: function(){
      game.time = 0;      
      game.player.turn = 0;
      game.enemy.turn = 0;
      game.currentData.moves = [];
      if(game.player.type == 'challenged') game.status = 'turn';
      if(game.player.type == 'challenger') game.status = 'unturn';         
    },
    
    beginTurn: function(){      
      //todo: update storage.state = game.state - each hero hp position buffs etc, each player skill hand
      if(game.status != 'over') {    
        game.currentData.moves = []; 
        states.table.el.addClass(game.status);
        if(game.status == 'turn') game.message.text('Your turn now!');
        if(game.status == 'unturn') game.message.text('Enemy turn now!');        
        $('.card .damage').remove();
        $('.card .heal').remove();
        $('.card.dead').each(function(){
          var dead = $(this);
          if(game.time > dead.data('reborn')) dead.reborn();
        });       
        $('.card').each(function(){
          var card = $(this);          
          card.trigger('turnstart', {target: card});                  
          if(game.status == 'turn')  card.trigger('playerturnstart', {target: card});
          else card.trigger('enemyturnstart', {target: card});
          card.reduceStun();
        });
        if(game.turn == 6) $('.card', states.table.playerUlts).appendTo(states.table.playerSkillsDeck);
        if(game.status == 'turn'){         
          $('.map .card.player').removeClass('done');
          states.table.selectHand();               
          states.table.towerAutoAttack();        
          Map.highlight(); 
        } else {
          $('.map .card.enemy').removeClass('done');
          states.table.enemyHand();
        }
        game.time = game.player.turn + game.enemy.turn;  
        states.table.counter = game.timeToPlay;
        clearTimeout(game.timeout);
        game.timeout = setTimeout(states.table.turnCount, 1000);
      }
    },
    
    turnCount: function(){
      game.loader.addClass('hidden');
      states.table.time.text('Time: '+states.table.hours()+' '+states.table.dayNight()+' Turns: '+game.player.turn+'/'+game.enemy.turn +' ('+parseInt(game.time)+')');     
      if(game.status == 'turn') game.message.text('Your turn, you have '+states.table.counter+' seconds');
      if(game.status == 'unturn') game.message.text('Enemy turn ends in '+states.table.counter+' seconds');        
      if(states.table.counter-- < 1){
        $('.card.heroes').each(function(){
          var hero = $(this);
          hero.trigger('turnend', {target: hero});
        });
        if(game.status == 'turn') states.table.sendMoves();
        if(game.status == 'unturn') states.table.getMoves();    
      } else {
        game.time += 1 / game.timeToPlay;
        game.timeout = setTimeout(states.table.turnCount, 1000);
      }
    },
    
    sendMoves: function(){
      $('.card.heroes').each(function(){
        var hero = $(this);
        hero.trigger('playerturnend', {target: hero});
      });
      game.message.text('Uploading your turn '+game.player.turn);
      game.loader.removeClass('hidden');
      Map.unhighlight();
      $('.card .damage').remove();
      $('.card .heal').remove();
      game.status = 'unturn';
      states.table.el.removeClass('turn');    
      clearTimeout(game.timeout);
      states.table.sendData();
    },

    getMoves: function(){   
      game.message.text('Loading enemy turn '+(game.enemy.turn + 1));
      game.loader.removeClass('hidden');
      game.tries = 1;  
      states.table.el.removeClass('unturn');
      clearTimeout(game.timeout);
      game.timeout = setTimeout(states.table.getData, 1000);
    },

    sendData: function(){
      game.player.turn++;
      game.currentData[game.player.type + 'Turn'] = game.player.turn;  
      game.currentData.moves = game.currentData.moves.join('|');   
      db({'set': game.id, 'data': game.currentData}, function(){
        clearTimeout(game.timeout);
        game.timeout = setTimeout(states.table.beginTurn, 1000);
      });      
    },

    getData: function(){        
      db({'get': game.id }, function(data){                    
        if(data[game.enemy.type + 'Turn'] == (game.enemy.turn + 1) ){
          game.triesCounter.text('');
          game.currentData = data;
          game.enemy.turn++;
          states.table.executeEnemyMoves();            
        } else {
          game.triesCounter.text('('+(game.tries++)+')');
          if(game.tries > game.connectionLimit) states.load.reset();
          else game.timeout = setTimeout(states.table.getData, 1000);
        }
      });
    },
    
    hours: function(){
      var hours = game.time % game.dayLength;
      var perCentHours = hours / game.dayLength;
      var convertedHours = perCentHours * 24;
      var intHours = parseInt(convertedHours);      
      var minutes = convertedHours - intHours;
      if(minutes < 0) minutes = 0;
      var convertedMin = minutes * 60;
      var intMin = parseInt(convertedMin);
      var stringMin = (intMin < 10) ? '0'+intMin : intMin;
      return intHours+':'+stringMin;      
    },
    
    dayNight: function(){
      var hours = game.time % game.dayLength;
      if(hours < (game.dayLength/2) ) return 'Day';
      else return 'Night';
    },
    
    moveSelected: function(){
      var spot = $(this), card = game.selectedCard;
      if(game.selectedCard.hasClass('skills') && game.selectedCard.data('hero')) card = $('.map .card.player.'+game.selectedCard.data('hero'));
      var fromSpot = Map.getPosition(card);  
      var toSpot = Map.getPosition(spot);
      if(game.status == 'turn' && spot.hasClass('free') && (fromSpot != toSpot) && !card.hasClass('done')){
        card.move(toSpot);        
        game.currentData.moves.push('M:'+fromSpot+':'+toSpot);
        Map.unhighlight();
      }  
      return false;
    },

    attackWithSelected: function(){  
      var target = $(this), source = game.selectedCard;
      var fromSpot = Map.getPosition(source);
      var toSpot = Map.getPosition(target);  
      if(game.status == 'turn' && source.data('damage') && (fromSpot != toSpot) && !source.hasClass('done') && target.data('currenthp')){ 
        source.attack(target);      
        game.currentData.moves.push('A:'+fromSpot+':'+toSpot); 
        Map.unhighlight();
      }
      return false;
    },   

    passiveActivate: function(){
      var target = $(this), skill = game.selectedCard;
      var hero = skill.data('hero');
      var skillid = skill.data('skill');
      var toSpot = Map.getPosition(target);  
      if(hero && skillid && game.status == 'turn'){ 
        game.currentData.moves.push('P:'+toSpot+':'+skillid+':'+hero); 
        skill.activate(target);
        var t = skill.offset(), d = target.offset();
        skill.css({top: d.top - t.top - 22, left: d.left - t.left - 22, transform: 'scale(0.3)'});
        setTimeout(function(){          
          $(this.card).css({top: '', left: '', transform: ''}).appendTo(this.destiny);
          target.select();
        }.bind({ card: skill, destiny: states.table.playerCemitery }), 500);        
      }
    },
    
    castWithSelected: function(){
      var target = $(this), skill = game.selectedCard, source = game.castSource;
      var fromSpot = Map.getPosition(source);
      var toSpot = Map.getPosition(target);  
      var hero = skill.data('hero');
      var skillid = skill.data('skill');
      if(hero && skillid && fromSpot && toSpot && game.status == 'turn' && !source.hasClass('done')){ 
        game.currentData.moves.push('C:'+fromSpot+':'+toSpot+':'+skillid+':'+hero); 
        source.cast(skill, toSpot);         
      }
    },

    executeEnemyMoves: function(){
      game.message.text('Your enemy moved. Get ready!');
      var moves = game.currentData.moves.split('|');      
      for(var m = 0; m < moves.length; m++){
        var move = moves[m].split(':');
        var fromSpot = Map.mirrorPosition(move[1]), toSpot = Map.mirrorPosition(move[2]);
        var source, target, hero, skillid, skill;
        
        if(move[0] == 'M'){   
          target = $('#'+fromSpot+' .card');
          if(toSpot && !target.hasClass('done') && target.hasClass('enemy') && target.move) target.move(toSpot);
        }        
        if(move[0] == 'A'){
          source = $('#'+fromSpot+' .card');
          if(toSpot && !source.hasClass('done') && source.hasClass('enemy') && source.attack) source.attack(toSpot);
        }        
        if(move[0] == 'C'){ 
          skillid = move[3]; 
          hero = move[4];   
          source = $('#'+fromSpot+' .card');
          target = $('#'+toSpot);          
          skill = $('.enemy.skills .'+hero+'-'+skillid);
          if(skill.data('target') == 'enemy' || skill.data('target') == 'player' || skill.data('target') == 'self')
            target = $('#'+toSpot+' .card');
          if(skills[hero][skillid].cast && skill && !source.hasClass('done') && source.hasClass('enemy') && source.cast){
            source.cast(skill, target);
            game.enemy.hand--;
          }
        }         
        if(move[0] == 'P'){
          toSpot = Map.mirrorPosition(move[1]);
          skillid = move[2]; 
          hero = move[3];
          target = $('#'+toSpot+' .card');
          skill = $('.enemy.skills .'+hero+'-'+skillid);
          if(skills[hero][skillid].activate && skill && target.hasClass('enemy') && skill.activate){
            skill.activate(target);
            game.enemy.hand--;
          }
        }        
      }      
      $('.card.heroes').each(function(){
          var hero = $(this);
          hero.trigger('enemyturnend', {target: hero});
      });         
      clearTimeout(game.timeout);
      game.timeout = setTimeout(function(){
        if(game.status != 'over'){
          game.status = 'turn';
          states.table.beginTurn();
          if(game.selectedCard) game.selectedCard.select()
        }
      }, 2000);
    },
    
    animateCast: function(skill, target, destiny){
      if(typeof target == 'string') target = $('#'+target);
      var t = skill.offset(), d = target.offset();
      skill.css({top: d.top - t.top - 22, left: d.left - t.left - 22, transform: 'scale(0.3)'});
      setTimeout(function(){          
        $(this.card).css({top: '', left: '', transform: ''}).appendTo(this.destiny);          
        if(skill.hasClass('selected') && game.castSource) game.castSource.select();
      }.bind({ card: skill, destiny: destiny }), 500);
    },
    
    win: function(){
      game.winner = game.player.name;
      states.table.el.addClass('turn');
      game.message.text('Congratulations, you won!'); 
      states.table.sendData();
      game.status = 'over';      
      states.table.showResults();
    },    
    
    lose: function(){      
      game.winner = game.enemy.name;
      states.table.el.addClass('unturn');
      game.message.text('Game Over!');
      game.loader.addClass('hidden');
      game.status = 'over';      
      states.table.showResults();
    },

    showResults: function(){
      Map.unhighlight();
      $('#table .card').off('click.select');
      this.resultsbox = $('<div>').appendTo(this.el).attr({'class': 'resultsbox box'});
      $('<h1>').appendTo(this.resultsbox).addClass('result').text(game.winner+' victory');
      $('<h1>').appendTo(this.resultsbox).text('Towers HP: '+game.player.tower.data('currenthp')+' / '+game.enemy.tower.data('currenthp'));
      $('<h1>').appendTo(this.resultsbox).text('Heroes KD: '+game.player.kills+' / '+game.enemy.kills);
      this.playerResults = $('<div>').appendTo(this.resultsbox).attr({'class': 'results'});
      this.enemyResults = $('<div>').appendTo(this.resultsbox).attr({'class': 'results'});
      $('.player.heroes.card').not('.zoom').each(function(){
        var hero = $(this), heroid = $(this).data('hero'); 
        var img = $('<div>').addClass('portrait').append($('<div>').addClass('img'));
        var text = $('<span>').text( hero.data('name')+': '+hero.data('kills')+' / '+hero.data('deaths') );
        $('<p>').appendTo(states.table.playerResults).addClass(heroid).append(img, text);
      });      
      $('.enemy.heroes.card').not('.zoom').each(function(){
        var hero = $(this), heroid = $(this).data('hero');
        var img = $('<div>').addClass('portrait').append($('<div>').addClass('img'));
        var text = $('<span>').text( hero.data('name')+': '+hero.data('kills')+' / '+hero.data('deaths') );
        $('<p>').appendTo(states.table.enemyResults).addClass(heroid).append(img, text);
      });
      $('<button>').appendTo(this.resultsbox).text('Close')
      .click(function(){  
        states.changeTo('menu');
      });
    },
    
    end: function(){
      $('#table .card').remove();
      $('#table .deck').remove();
      this.resultsbox.remove();
    }
  
  } 
  //table end
};
// states end /////////////////////////////////////////////////////////
