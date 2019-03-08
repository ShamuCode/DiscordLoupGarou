module.exports = {
    name: __filename.split('/').pop().split('.').shift(),
    description: 'Lancer une nouvelle partie de Loup Garou avec l\'extension Le Village',
    execute(LGBot, message) {

        if (!message.member) {
            return;
        }

        message.reply("L'extension Le Village est en cours de développement").catch(console.error);
    },
};

