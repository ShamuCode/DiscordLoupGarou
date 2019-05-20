const RichEmbed = require('discord.js').RichEmbed;
let botData = require("../BotData.js");
const fs = require('fs');

module.exports = {
    name: "help",
    guide: "help",
    description: 'afficher ce message d\'aide',
    execute(LGBot, message) {

        let helpMsg = new RichEmbed()
            .setColor(botData.BotValues.botColor)
            .setThumbnail(LGBot.user.avatarURL)
            .setAuthor("Guide pour jouer", LGBot.user.avatarURL)
            .setTitle("Cliquez ici pour ajouter vos musiques personnalisées au bot")
            .setURL("https://docs.google.com/spreadsheets/d/18-N7KfwYHyRIsKG06D_5tLIrpoLaeOm9WvS_RT79wfc/edit?usp=sharing");

        let i = 1;

        for (const file of fs.readdirSync('./src/commands')) {

            const command = require(`./${file}`);

            if (i === 25) {
                message.channel.send(helpMsg).catch(console.error);
                i = 0;
                helpMsg = new RichEmbed()
                    .setColor(botData.BotValues.botColor)
                    .setThumbnail(LGBot.user.avatarURL)
                    .setTitle("Guide pour jouer");
            }

            helpMsg.addField(`${process.env.botPrefix}${command.guide}`, command.description);

            i++;
        }

        message.channel.send(helpMsg).catch(console.error);
    },
};
