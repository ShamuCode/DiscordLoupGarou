const RichEmbed = require('discord.js').RichEmbed;
let botData = require("../BotData.js");

let addAdmins = (LGBot, message) => {

    if (message.member && message.member.hasPermission("BAN_MEMBERS")) {

        let Settings = LGBot.Settings.get(message.guild.id);

        if (!Settings) {
            LGBot.Settings.set(message.guild.id, botData.Settings);
            Settings = LGBot.Settings.get(message.guild.id);
        }

        Settings.Admins.push(message.mentions.members.array().map(member => member.id));
        Settings.Admins = [...new Set(Settings.Admins)];

        LGBot.Settings.set(message.guild.id, Settings);

        message.channel.send(new RichEmbed().setColor(botData.BotValues.botColor)
            .addField(
                "Admins du bot LG pour le serveur " + message.guild.name,
                Settings.Admins
                    .filter(id => message.guild.members.get(id))
                    .map(id => `__${message.guild.members.get(id).displayName}__`)
                    .toString()
                    .replace(/,+/g, "\n")
            )
        ).catch(console.error);

    } else {
        message.reply("Tu n'as pas la permission").catch(console.error);
    }

};

module.exports = {
    name: "addAdmin",
    guide: `addAdmin @Utilisateur1 @Utilisateur2 ...`,
    description: 'Ajouter des admins au bot LG, capables de stopper des parties de force. Il est nécessaire de mentionner pour sélectionner.',
    execute(LGBot, message) {
        addAdmins(LGBot, message);
    },
};
