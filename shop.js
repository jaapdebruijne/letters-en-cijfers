(function () {
  'use strict';
  var LC = (window.LC = window.LC || {});

  // Things a child can buy with stars. Drawings live in art.js under the same ids.
  LC.SHOP = {
    avatar: [
      { id: 'bow', slot: 'head', cost: 3, name: 'Strikje' },
      { id: 'flower', slot: 'head', cost: 4, name: 'Bloem' },
      { id: 'party', slot: 'head', cost: 5, name: 'Feestmuts' },
      { id: 'scarf', slot: 'body', cost: 6, name: 'Sjaal' },
      { id: 'shades', slot: 'face', cost: 8, name: 'Zonnebril' },
      { id: 'hearts', slot: 'face', cost: 8, name: 'Hartjesbril' },
      { id: 'wizard', slot: 'head', cost: 12, name: 'Toverhoed' },
      { id: 'crown', slot: 'head', cost: 15, name: 'Kroon' },
      { id: 'cape', slot: 'body', cost: 20, name: 'Cape' }
    ],
    room: [
      { id: 'teddy', cost: 6, name: 'Teddybeer' },
      { id: 'lamp', cost: 8, name: 'Lamp' },
      { id: 'fishbowl', cost: 12, name: 'Vissenkom' },
      { id: 'horse', cost: 15, name: 'Houten paard' },
      { id: 'train', cost: 18, name: 'Treintje' },
      { id: 'rainbow', cost: 25, name: 'Regenboog' }
    ]
  };

  LC.shopItem = function (id) {
    var all = LC.SHOP.avatar.concat(LC.SHOP.room);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return null;
  };
})();
