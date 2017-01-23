game.tree = {
  build: function (spot, side) {
    var tree = game.card.build({
      className: 'trees static neutral ' + side,
      name: game.data.ui.tree,
      attribute: game.data.ui.tree,
      description: game.data.ui.forest
    });
    tree.on('mousedown touchstart', game.card.select);
    tree.place(spot);
    return tree;
  },
  place: function () {
    var treeSpots = 'A1 A3 B1';
    $.each(treeSpots.split(' '), function () {
      game.tree.build(this, 'rad');
      game.tree.build(game.map.mirrorPosition(this), 'dire');
    });
  }
};
