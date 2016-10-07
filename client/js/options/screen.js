game.screen = {
  width: 970,
  height: 600,
  resolutions: ['auto', 'low', 'high', 'medium', 'default'],
  resize: function (event) {
    $('#sweet-alert-mediaquery').remove();
    game.offset = game.container.offset();
    var scale = 1;
    if (window.innerWidth/window.innerHeight > game.screen.width/game.screen.height) {
      scale = window.innerHeight/game.screen.height;
    } else {
      scale = window.innerWidth/game.screen.width;
    }
    scale = (scale * 0.96).toFixed(2);
    if (scale < 0.5) scale = 0.5;
    game.container.css('transform', 'translate3d(-50%, -50%, 0) scale('+scale+')');
    game.sweet.css('transform', 'translate3d(-50%, -50%, 0) scale('+scale+')');
  },
  rememberResolution: function () {
    var res, rememberedres = localStorage.getItem('resolution');
    if (rememberedres && game.screen.resolutions.indexOf(rememberedres) > -1) res = rememberedres;
    if (res) {
      game.screen.setResotution(res);
      game.screen.changeResolution(res);
    }
  },
  setResotution: function (res) {
    $('input[name=resolution][value='+res+']').attr('checked', true);
  },
  changeResolution: function (resolution) {
    if (!resolution || resolution.constructor.name !== 'String') {
      resolution = $('input[name=resolution]:checked', '.screenresolution').val() || 'auto';
    }
    game.container.removeClass(game.screen.resolutions.join(' ')).addClass(resolution);
    localStorage.setItem('resolution', resolution);
  },
};
