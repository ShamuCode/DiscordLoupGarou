const LgLogger = require("../logger");
const GamePreparation = require("./preparation").GamePreparation;
const GameInfo = require("./info").GameInfo;
const IGame = require("./interface").IGame;
const GameFlow = require("../flow/flow").GameFlow;
const ReactionHandler = require("../../functions/reactionHandler").ReactionHandler;
const Wait = require('../../functions/wait').Wait;
const CommunicationHandler = require('../communicationHandler').CommunicationHandler;

class Game extends IGame {

    constructor(client, message, gameOptions) {

        super(client);

        this.playTime = new Date();
        this.gameInfo = new GameInfo(message, this.playTime);

        LgLogger.info('New lg game created', this.gameInfo);

        this.guild = message.guild;

        this.endMsg = null;

        this.gameOptions = gameOptions;

        this.stemmingChannel = message.channel;
        this.stemmingPlayer = message.member;

        this.preparation = new GamePreparation(
            this.client, this.stemmingChannel, this.stemmingPlayer, this.guild, this.gameInfo, gameOptions
        );
        this.flow = new GameFlow(this.client, this.gameInfo, gameOptions);

        this.quitListener = undefined;

        this.client.on('guildMemberRemove', (member) => {
            if (member.guild.id === message.guild.id) {
                if (this.preparation && this.preparation.configuration) {
                    this.preparation.configuration._players.delete(member.id);
                }
                if (this.flow && this.flow.GameConfiguration && this.flow.GameConfiguration._players) {
                    this.flow.GameConfiguration._players.delete(member.id);
                }
            }
        });

        this.msgCollector = [];
        this.listenMsgCollector();

        return this;

    }

    async launch() {
        LgLogger.info("Preparing game...", this.gameInfo);

        let status = await this.preparation.prepareGame();

        if (!status) {
            await this.quit();
            LgLogger.info("Quitting game", this.gameInfo);
            return this;
        }

        this.updateObjects(status);

        await this.flow.GameConfiguration.voiceHandler.join();
        await this.flow.GameConfiguration.voiceHandler.setupEvents();
        await this.flow.GameConfiguration.voiceHandler.playFirstDayBGM();

        LgLogger.info("Game successfully prepared.", this.gameInfo);

        await this.msg.delete();

        // noinspection JSUnresolvedFunction
        this.msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Joueurs",
                this.preparation.configuration
                    .getPlayerNames()
                    .toString()
                    .replace(/,+/g, '\n')
            )
        );

        await this.listenQuitEvents();

        // noinspection JSUnresolvedFunction
        let msg = await this.stemmingChannel.send(CommunicationHandler.getLGSampleMsg()
            .addField(
                "Le jeu va bientôt commencer", "Début du jeu dans 5 secondes"
            )
        );

        LgLogger.info(`${this.flow.GameConfiguration.getGameConfString()}`, this.gameInfo);

        await Wait.seconds(5);
        await msg.delete();

        this.endMsg = await this.flow.run();

        await this.stemmingChannel.send(this.endMsg);
        let msgSent = await this.stemmingChannel.send("Nettoyage des channels dans 5 secondes");
        await Wait.seconds(5);
        await msgSent.delete();
        await this.quit();

        return this;
    }

    updateObjects(status) {
        let configuration = status;

        configuration.channelsHandler = this.preparation.channelsHandler;
        configuration.rolesHandler = this.preparation.rolesHandler;
        configuration.voiceHandler = this.preparation.voiceHandler;
        configuration.voiceHandler.voiceChannel = configuration.channelsHandler._channels.get(
            configuration.channelsHandler.voiceChannels.vocal_lg
        );

        this.msg = this.preparation.msg;
        this.flow.msg = this.preparation.msg;
        this.flow.GameConfiguration = configuration;
    }

    listenQuitEvents() {
        return new Promise((resolve, reject) => {

            this.quitListener = new ReactionHandler(this.msg, ["🔚"]);

            this.quitListener.addReactions().catch(console.error);

            this.quitListener.initCollector((reaction) => {

                if (reaction.emoji.name === "🚪") {

                    //todo: allow user to quit the game

                } else if (reaction.emoji.name === "🔚") {
                    let user = reaction.users.last();

                    reaction.remove(user).catch(() => true);
                    if (user.id === this.stemmingPlayer || this.guild.members.get(user.id).hasPermission('BAN_MEMBERS')) {
                        this.quit().catch(console.error);
                    }
                }
                reaction.remove(reaction.users.last()).catch(() => true);

            }, () => {

            }, (reaction) => {
                return reaction.count > 1;
            });

            resolve(true);

        });
    }

    quit() {
        return new Promise((resolve, reject) => {
            let LG = this.client.LG.get(this.guild.id);

            if (LG) LG.running = false;

            this.client.LG.set(this.guild.id, LG);

            if (this.quitListener) this.quitListener.stop();

            let quitPromises = [];

            if (this.flow && this.flow.GameConfiguration) {

                if (this.flow.GameConfiguration.loupGarouMsgCollector) {
                    this.flow.GameConfiguration.loupGarouMsgCollector.stop();
                }

                if (this.flow.GameConfiguration.voiceHandler) {
                    quitPromises.push(this.flow.GameConfiguration.voiceHandler.destroy());
                }

            }

            quitPromises.push(this.preparation.rolesHandler.deleteRoles());

            if (this.preparation.keepChannels === false) {
                quitPromises.push(this.preparation.channelsHandler.deleteChannels());
            } else {
                quitPromises.push(this.preparation.channelsHandler.cleanChannels(this.endMsg));
                quitPromises.push(this.preparation.channelsHandler.resetPermissionsOverwrites());
            }

            Promise.all(quitPromises).then(() => {
                resolve(this);
            }).catch((err) => {
                this.stemmingChannel.send("Jeu arrêté, des erreurs se sont produite : ```" + err + "```").catch(console.error);
                reject(err);
            });
        });
    }

    listenMsgCollector() {

        this.client.on('message', (message) => {

            if (message && message.channel.parent) {

                if (message.channel.parent.name.toLowerCase() === "loups_garou_de_thiercelieux") {
                    this.msgCollector.push(message);
                }

            }

        });

    }
}

module.exports = {Game};
