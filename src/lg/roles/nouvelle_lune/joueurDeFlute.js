const SondageInfiniteChoice = require("../../../functions/cmds/referendum").SondageInfiniteChoice;
const Player = require("../baseRole").Player;
let RichEmbed = require("discord.js").RichEmbed;
const botData = require('../../../BotData');


/**
 * Ennemi à la fois des villageois et des loups-garous, le joueur de flûte se réveille à la fin de chaque nuit et
 * choisit chaque fois deux nouveaux joueurs qu'il va charmer. Puis, il se rendort et le meneur de jeu réveille
 * tous les joueurs charmés (anciens et nouveaux) pour qu'ils se reconnaissent. Les joueurs charmés continuent à
 * jouer normalement (quel que soit leur rôle), mais si, à n'importe quel moment, le joueur de flûte est en vie
 * et tous les autres joueurs vivants sont charmés, le joueur de flûte gagne immédiatement, seul. Selon les variantes,
 * sa victoire peut ne pas arrêter la partie pour les autres joueurs ou la terminer instantanément.
 *
 * Si le joueur de flûte est en couple, il devra charmer tout le monde sauf lui et son amoureux.
 *
 * Si le joueur de flûte est infecté (cf rubrique infect père des loups), son objectif change et il devra alors
 * gagner avec les loups-garous
 *
 * chaque nuit, il vous enverra un MP pour vous informer de qui ilva charmer.Il envoie alors, s'il le désire,
 * jusqu'à deux noms. A la fin de la nuit, juste avant d'annoncer le jour,on annonce alors aux charmés (par Mp)
 * qu'ils l'ont été, ainsi que l'identité de tous les autres charmés. Si le Joueur de Flute meurt, tous les
 * charmés ne le sont plus.
 *
 * //todo: (Attention : si le Joueur de Flute réussit à charmer l'ensemble des villageois, mais qu'il ne survit pas à la nuit, alors le joueur de flute a échoué dans sa mission, et meurt.)
 *
 */
class JoueurDeFlute extends Player {

    constructor(guildMember, gameInfo) {
        super(guildMember, gameInfo);

        this.team = "JOUEURDEFLUTE";
        this.role = "JoueurDeFlute";

        return this;
    }

    async charmPlayer(configuration) {

        let dmChannel = await this.getDMChannel();

        let outcome = await new EveryOneVote(
            "Choisissez une personne à charmer",
            configuration,
            40000, dmChannel, 1
        ).excludeDeadPlayers().excludeCharmedPlayers().runVote([this.member.id]);

        if (!outcome || outcome.length === 0) {
            await dmChannel.send("Vous n'avez pas charmé de joueur.");
        } else {

            let targetId = outcome.shift();
            let target = configuration._players.get(targetId);

            target.charmed = true;

            await dmChannel.send(`Tu as charmé ${target.member.displayName}`);

        }

    }

    async wantsToCharm(question) {

        let choices = ["Oui", "Non"];

        let choiceArray = await new SondageInfiniteChoice(
            question,
            choices, await this.getDMChannel(), 30000,
            new RichEmbed().setColor(botData.BotValues.botColor),
            true, true, 1
        ).post();

        let result = [];

        choiceArray.forEach(choice => {
            result.push(choice[0] - 1);
        });

        if (result.length === 0) {
            return false;
        } else {
            return result.shift() === 0;
        }

    }

    async processRole(configuration) {

        if (await this.wantsToCharm("Voulez-vous charmer des joueurs ?")) {

            await this.charmPlayer(configuration);

            if (await this.wantsToCharm("Voulez-vous charmer un autre joueur ?")) {
                await this.charmPlayer(configuration);
            }

        }

        return this;
    }

    async die(configuration) {

        configuration.getAlivePlayers().forEach(player => {
            if (player.charmed) player.charmed = false;
        });

        return await super.die();

    }

}
