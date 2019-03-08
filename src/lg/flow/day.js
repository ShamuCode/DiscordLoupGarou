const LgLogger = require("../logger");
const DayVote = require("../vote").DayVote;
const get_random_in_array = require("../../functions/parsing_functions").get_random_in_array;
const EveryOneVote = require("../vote.js").EveryOneVote;
let timeToString = require('../../functions/time');
const Period = require("./period").Period;

class Day extends Period {

    constructor(configuration, gameInfo, turnNb, deadPeople) {

        super(configuration, gameInfo, turnNb);

        configuration.voiceHandler.playDayBGM().catch(console.error);

        this.deadPeople = deadPeople;

        return this;

    }

    async goThrough() {
        LgLogger.info("Going through day", this.gameInfo);
        let outcome = await this.debateTime();

        return [await this.pronounceSentence(outcome)];
    }

    async debateTime() {

        let debateDuration = this.GameConfiguration.getAlivePlayers().length / 2; // in minutes

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Vous disposez de ${timeToString(debateDuration)} pour débattre, et faire un vote`
        );

        await this.GameConfiguration.globalTimer.setTimer(
            debateDuration / 2,
            "Temps avant le début du vote",
            this.GameConfiguration.getAlivePlayers().length
        );

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'ADD_REACTIONS': true
            },
            this.GameConfiguration.getAlivePlayers()
        );

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: false,
                ADD_REACTIONS: false
            },
            this.GameConfiguration.getDeadPlayers()
        );

        let voteTimeout = setTimeout(() => {
            this.GameConfiguration.channelsHandler.sendMessageToVillage(`Il reste ${timeToString(debateDuration / 4)} avant la fin du vote`)
        }, (debateDuration / 4) * 60 * 1000);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Votez dans le channel ${this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg).toString()} !`
        );

        let outcome = await new DayVote(
            "Qui doit mourir ?",
            this.GameConfiguration,
            (debateDuration / 2) * 60 * 1000,
            this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
            this.GameConfiguration.getAlivePlayers().length
        ).excludeDeadPlayers().runVote();

        clearTimeout(voteTimeout);

        return outcome;
    }

    async pronounceSentence(outcome) {

        let victimId = null;

        if (!outcome || outcome.length === 0) {

            // vote blanc

        } else if (outcome.length === 1) {

            victimId = outcome[0]

        } else if (outcome.length > 1) {

            // more than one victim voted, the capitaine must make a decision
            // if no capitaine, random victim
            // if capitaine refuse to make a decision, pick a random victim

            let capitaine = this.GameConfiguration.Capitaine;

            if (capitaine && capitaine.alive) {

                await this.GameConfiguration.channelsHandler.sendMessageToVillage("Le vote est nul, le Capitaine va devoir trancher");

                victimId = await new Promise((resolve, reject) => {
                    capitaine.getDMChannel()
                        .then(dmChannel => new EveryOneVote(
                            "Qui doit mourir ?",
                            this.GameConfiguration,
                            30000,
                            dmChannel,
                            1
                        ).excludeDeadPlayers().runVote(
                            this.GameConfiguration.getAlivePlayers().filter(p => !outcome.includes(p.member.id))
                        ))
                        .then(capitaineDecision => {
                            if (!capitaineDecision || capitaineDecision.length === 0) {
                                resolve(get_random_in_array(outcome));
                            } else {
                                resolve(capitaineDecision[0]);
                            }
                        })
                        .catch(err => reject(err));
                });

            } else {

                victimId = get_random_in_array(outcome);

            }

        }

        if (!victimId) {

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le village n'a pas souhaité voter`
            );

            return null;

        } else {
            let victim = this.GameConfiguration.getPlayerById(victimId);

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le village a souhaité la mort de **${victim.member.displayName}**, étant ${victim.role}`
            );

            return victim;
        }

    }

}

class FirstDay extends Period {

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

        configuration.voiceHandler.playFirstDayBGM().catch(console.error);

        return this;
    }

    async goThrough() {

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "🌄 Le jour se lève à Thiercelieux." +
            " Quand la neige éternelle ornera les montagnes, le capitaine devra être élu."
        );

        await this.GameConfiguration.voiceHandler.announceDayBegin();
        await this.GameConfiguration.globalTimer.setTimer(
            1,
            "Temps avant le vote du capitaine",
            this.GameConfiguration.getAlivePlayers().length
        );

        await this.capitaineElection();
        await this.GameConfiguration.channelsHandler.sendMessageToVillage("⛰ La nuit va bientôt tomber sur Thiercelieux.");
        await this.GameConfiguration.voiceHandler.announceNightSoon();
        await this.GameConfiguration.globalTimer.setTimer(
            0.5,
            "Temps avant la tombée de la nuit",
            this.GameConfiguration.getAlivePlayers().length
        );

        return this.GameConfiguration;
    }

    async capitaineElection() {

        LgLogger.info('Begining capitaine election.', this.gameInfo);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "🏔 Les villageois se réunissent afin d'élir leur capitaine\n" +
            "C'est l'heure du vote !"
        );

        await this.GameConfiguration.voiceHandler.announceVoteCapitaine();

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': true,
                'ADD_REACTIONS': true
            },
            Array.from(this.GameConfiguration.getPlayers().values())
        );

        LgLogger.info('Permissions switch, init referendum.', this.gameInfo);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Votez dans le channel ${this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg).toString()} !`
        );

        let outcome = await new EveryOneVote(
            "Qui voulez-vous élir comme capitaine ?",
            this.GameConfiguration,
            120000,
            this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg),
            this.GameConfiguration._players.size
        ).runVote();

        LgLogger.info("Capitaine outcome : " + outcome, this.gameInfo);

        if (outcome.length === 0) {
            this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "Le village n'a pas voulu élire de Capitaine."
            ).catch(console.error);

            this.gameInfo.addToHistory(`Le village n'a pas élu de Capitaine du village.`);

        } else if (outcome.length === 1) {
            let id = outcome.shift();
            let capitaineElected = this.GameConfiguration._players.get(id);

            this.gameInfo.addToHistory(`Le village a élu ${capitaineElected.member.displayName} Capitaine du village.`);

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `${capitaineElected.member.displayName} a été élu Capitaine de Thiercelieux !`
            );
            capitaineElected.capitaine = true;
            this.GameConfiguration._players.set(id, capitaineElected);
            this.GameConfiguration.capitaine = capitaineElected;
        } else if (outcome.length > 1) {

            this.gameInfo.addToHistory(`Le village n'a pas élu de Capitaine du village.`);

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                "Le village n'a pas pu élire de Capitaine, les votes étant trop serrés."
            );
        }

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg,
            {
                'VIEW_CHANNEL': true,
                'SEND_MESSAGES': false,
                'ADD_REACTIONS': true
            },
            Array.from(this.GameConfiguration.getPlayers().values())
        );

        return this.GameConfiguration;

    }

}

module.exports = {Day, FirstDay};