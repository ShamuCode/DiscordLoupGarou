const instanciateLgGame = require("../lg/game/launch").instanciateLgGame;
const filename = __filename.split('/').pop().split('.').shift();

module.exports = {
    name: filename,
    description: 'Lancer une nouvelle partie de Loup Garou avec l\'extension de base Thiercelieux',
    execute(LGBot, message) {
        instanciateLgGame(LGBot, message, filename).catch(console.error);
    },
};

