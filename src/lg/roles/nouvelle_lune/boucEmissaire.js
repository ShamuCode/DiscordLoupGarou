const Villageois = require("../baseRole").Villageois;

class BoucEmissaire extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "BoucEmissaire";

        return this;
    }

    async askIfWantsMore() {

        let dmChannel = await this.getDMChannel();

    }

    async askTarget(configuration) {

        let dmChannel = await this.getDMChannel();

        let outcome = await new EveryOneVote(
            "Choisissez les personnes qui pourront voter à la prochaine nuit",
            configuration,
            10000, dmChannel, 1
        ).excludeDeadPlayers().runVote([this.member.id]);

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

        await dmChannel.send("Avant ta mort, tu dois choisir qui aura le droit de voter pour la journée suivante.");



        return this.member.id;

    }

}

module.exports = {BoucEmissaire};
