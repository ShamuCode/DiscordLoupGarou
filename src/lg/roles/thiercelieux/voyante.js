const lg_var = require("../../variables");
const roles_img = require("../../variables").roles_img;
const EveryOneVote = require("../../vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;
let RichEmbed = require('discord.js').RichEmbed;

class Voyante extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Voyante";

        return this;
    }

    async processRole(configuration) {
        let dmChannel = await this.getDMChannel();

        let outcome = await new EveryOneVote(
            "Choisissez une personne pour voir son rôle",
            configuration,
            40000, dmChannel, 1
        ).excludeDeadPlayers().runVote([this.member.id]);

        if (!outcome || outcome.length === 0) {
            await dmChannel.send("Ton tour est terminé, tu n'as pas joué ton rôle de voyante");
            return this;
        } else if (outcome.length === 1) {

            let target = configuration.getPlayerById(outcome[0]);

            await configuration.channelsHandler.sendMessageToVillage(`La Voyante a détecté un(e) ${target.role}`, lg_var.roles_img[target.role]);

            await dmChannel.send(new RichEmbed()
                .setAuthor(target.member.displayName, target.member.user.avatarURL)
                .setTitle(target.role)
                .setImage(roles_img[target.role])
                .setColor(target.member.displayColor)
            );

        }

        return this;
    }

}

module.exports = {Voyante};
