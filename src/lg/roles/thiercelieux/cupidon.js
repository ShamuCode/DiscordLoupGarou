const Villageois = require("../baseRole").Villageois;
const EveryOneVote = require("../../lg_vote.js").EveryOneVote;

class Cupidon extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Cupidon";

        this.id1 = undefined;
        this.id2 = undefined;

        this.dmChannel = undefined;

        return this;
    }

    async getChoice(configuration) {

        let dmChannel = await this.getDMChannel();

        let firstOutcome = await new EveryOneVote(
            "Veuillez choisir le premier élu",
            configuration,
            40000, dmChannel, 1
        ).excludeDeadPlayers().runVote();

        if (!firstOutcome || firstOutcome.length === 0) {

            await this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé");
            await configuration.channelsHandler.sendMessageToVillage(
                "**Cupidon** se rendort."
            );

            return [undefined, undefined];

        } else if (firstOutcome.length === 1) {

            this.id1 = firstOutcome.shift();

        } else {
            throw ("Plusieurs votes ont été fait pour cupidon, situation impossible");
        }

        let secondOutcome = await new EveryOneVote(
            "Veuillez choisir son/sa partenaire",
            configuration,
            40000, this.dmChannel, 1
        ).excludeDeadPlayers().runVote([this.id1]);

        if (!secondOutcome || secondOutcome.length === 0) {

            await this.dmChannel.send("Tu n'as pas fait ton choix, ton tour est terminé");
            await configuration.channelsHandler.sendMessageToVillage(
                "**Cupidon** se rendort."
            );

        } else if (secondOutcome.length === 1) {

            this.id2 = secondOutcome.shift();

        } else {
            throw ("Plusieurs votes ont été fait pour cupidon, situation impossible");
        }

        return [this.id1, this.id2];

    }

}

module.exports = {Cupidon};
