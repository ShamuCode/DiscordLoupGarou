const get_random_in_array = require("../../../functions/parsing_functions").get_random_in_array;
const EveryOneVote = require("../../lg_vote").EveryOneVote;
const Villageois = require("../baseRole").Villageois;

class Chasseur extends Villageois {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.role = "Chasseur";

        return this;
    }

    async die(GameConfiguration) {
        let targets = [];

        if (GameConfiguration.getAlivePlayers().length > 0) {

            await GameConfiguration.channelsHandler.sendMessageToVillage(
                `${this.member.displayName}, le Chasseur, est mort. Il va maintenant désigner une personne à emporter avec lui.`
            );
            let dmChannel = await this.getDMChannel();

            let outcome = await new EveryOneVote(
                "Qui voulez-vous emporter avec vous dans la mort ?",
                GameConfiguration,
                40000,
                dmChannel,
                1
            ).excludeDeadPlayers().runVote();

            if (!outcome || outcome.length === 0) {
                targets.push(get_random_in_array(GameConfiguration.getAlivePlayers()));
            } else {
                targets.push(GameConfiguration.getPlayerById(outcome[0]));
            }

            await this.dmChannel.send(`Vous avez choisi ${targets[0].member.displayName}`);

        }

        if (this.amoureux && GameConfiguration.getPlayerById(this.amoureux).alive) {
            targets.push(GameConfiguration.getPlayerById(this.amoureux));
        }

        let additionnalDeath = await super.die(GameConfiguration);

        if (additionnalDeath) {
            targets = targets.concat(additionnalDeath);
        }

        return targets;
    }

}

module.exports = {Chasseur};
