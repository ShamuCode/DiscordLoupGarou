const SondageInfiniteChoice = require("../../../functions/referendum").SondageInfiniteChoice;
const Villageois = require("../baseRole").Villageois;

class BoucEmissaire extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "BoucEmissaire";

        return this;
    }

    async askIfWantsMore() {

        let dmChannel = await this.getDMChannel();

        let result = await new SondageInfiniteChoice(
            "Voulez-vous choisir une personne suplémentaire qui ne pourra pas voter la prochaine nuit ?",
            ["Oui", "Non"], dmChannel, 10000, null, true, true, 1
        ).post(true);

        return result[0] === "Oui";
    }

    async askTarget(configuration, exceptionArrayId) {

        let dmChannel = await this.getDMChannel();

        if (!exceptionArrayId) {
            exceptionArrayId = [];
        }

        exceptionArrayId.push(this.member.id);

        let outcome = await new EveryOneVote(
            "Choisissez les personnes qui pourront voter à la prochaine nuit",
            configuration,
            10000, dmChannel, 1
        ).excludeDeadPlayers().runVote(exceptionArrayId);

        if (!outcome || outcome.length === 0) {
            return null;
        } else {

            let target = configuration.getPlayerById(outcome[0]);

            if (!target) {
                console.error("Guild member not found");
                return null;
            }

            target.canVote = false;
            target.cantVoteNextTurn = true;

            return target;

        }

    }

    async processRole(configuration) {

        let dmChannel = await this.getDMChannel();
        let choices = [];

        await dmChannel.send("Avant ta mort, tu dois choisir qui aura le droit de voter pour la journée suivante.");

        for (let i = 0 ; i < configuration.getAlivePlayers().length - 1 ; i++) {
            if (await this.askIfWantsMore()) {
                choices.push(await this.askTarget(configuration, choices));
            }
        }

        return choices;

    }

}

module.exports = {BoucEmissaire};
