const instanciateLgGame = require("../lg/game/launch").instanciateLgGame;

module.exports = {
    name: "thiercelieux",
    guide: "thiercelieux",
    description: 'Lancer une nouvelle partie de Loup Garou avec l\'extension de base Thiercelieux',
    execute(LGBot, message) {
        console.info("Thiercelieux Game");
        instanciateLgGame(LGBot, message, "thiercelieux").catch(console.error);
    },
};

