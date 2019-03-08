const RichEmbed = require("discord.js").RichEmbed;
const LgLogger = require("../../lg_logger");
const EveryOneVote = require("../../lg_vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;

/**
 * L'enfant sauvage choisit un autre joueur au début de la partie qui devient son modèle.
 * //todo: Si le modèle meurt, l'enfant sauvage devient un loup-garou.
 */
class EnfantSauvage extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "EnfantSauvage";
        this.model = null;

        return this;
    }

    async askForModel(gameConf) {

        if (!this.dmChannel) {
            await this.getDMChannel();
        }

        let propositionMsg = new RichEmbed()
            .setAuthor(`${this.member.displayName}`, this.member.user.avatarURL)
            .setTitle('Tu es l\'enfant sauvage')
            .setDescription("Tu peux choisir ton modèle parmis les autres habitants du village." +
                " Si ton modèle meurt, tu deviendras un Loup-Garou.");

        await this.dmChannel.send(propositionMsg);

        let outcomeIdArray = await new EveryOneVote(
            'Qui prenez-vous comme modèle ?',
            gameConf,
            30000,
            this.dmChannel,
            1
        ).excludeDeadPlayers().runVote([this.member.id]);

        if (outcomeIdArray.length === 0) {

            LgLogger.info("L'enfant sauvage n'a pas pris de modèle", this.gameinfo);

            return this;

        } else if (outcomeIdArray.length === 1) {

            let model = gameConf._players.get(outcomeIdArray.shift());

            LgLogger.info(`L'enfant sauvage a pris comme modèle ${model.member.displayName}`, this.gameinfo);

            this.model = model;

            return this;

        } else {
            throw ("Deux votes simultanés pour l'enfant sauvage est impossible");
        }

    }

}

module.exports = {EnfantSauvage};
