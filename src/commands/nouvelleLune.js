const instanciateLgGame = require("../lg/game/launch").instanciateLgGame;

module.exports = {
    name: "nouvelleLune",
    guide: "nouvelleLune",
    description: 'Lancer une nouvelle partie de Loup Garou avec l\'extension Nouvelle Lune',
    execute(LGBot, message) {
        instanciateLgGame(LGBot, message, "nouvelleLune").catch(console.error);
    },
};

