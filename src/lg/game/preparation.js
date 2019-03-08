const lg_var = require("../variables");
const LgLogger = require("../logger");
const ReactionHandler = require("../../functions/reactionHandler").ReactionHandler;
const VoiceHandler = require("../voice").VoiceHandler;
const ChannelsHandler = require("../channel").ChannelsHandler;
const RolesHandler = require("../roles/role").RolesHandler;
const IGame = require("./interface").IGame;

class GamePreparation extends IGame {

    constructor(client, channel, player, guild, gameInfo, gameOptions) {

        super(client);

        this.MAX_PLAYERS = 29;

        this.status = false;

        this.gameInfo = gameInfo;
        this.gameOptions = gameOptions;

        this.guild = guild;
        this.stemmingPlayer = player;
        this.preparationChannel = channel;
        this.configuration = new GameConfiguration(this.gameInfo);
        this.rolesHandler = new RolesHandler(client, guild, this.gameInfo);
        this.channelsHandler = new ChannelsHandler(client, guild, this.gameInfo);
        this.voiceHandler = new VoiceHandler(this.channelsHandler._channels.get(this.channelsHandler.voiceChannels.vocal_lg), gameOptions.musicMode);

        this.msg = undefined;
        this.richEmbed = undefined;

        this.keepChannels = false;

        return this;

    }

    prepareGame() {
        return new Promise((resolve, reject) => {
            this.init()
                .then(() => this.createRoles())
                .then(() => this.displayGuide())
                .then(() => this.initEvents())
                .then(status => {
                    if (!status) return resolve(status);
                    return this.setupChannels()
                })
                .then(() => this.channelsHandler.moveVocalPlayers(this.configuration))
                .then(() => this.rolesHandler.sendRolesToPlayers(this.configuration))
                .then(() => resolve(this.configuration))
                .catch(err => reject(err));
        });
    }

    init() {
        return new Promise((resolve, reject) => {

            this.richEmbed = CommunicationHandler.getLGSampleMsg()
                .addField("LG - Initialisation", "Initialisation du jeu...");

            this.preparationChannel.send(this.richEmbed).then(msg => {
                this.msg = msg;
                resolve(true);
            }).catch(err => reject(err));
        });
    }

    createRoles() {
        return new Promise((resolve, reject) => {
            this.rolesHandler.createRoles().then(() => resolve(true)).catch(err => {
                this.msg.edit(this.richEmbed.setDescription("Erreur lors de la création des rôles.")).catch(console.error);
                reject(err);
            });
        });
    }

    displayGuide() {
        return new Promise((resolve, reject) => {
            this.richEmbed = CommunicationHandler.getLGSampleMsg()
                .setDescription("Préparation du jeu")
                .setThumbnail(lg_var.roles_img.LoupGarou)
                .addField("Rejoindre la partie", "Veuillez réagir avec la réaction 🐺", true)
                .addField("Quitter la partie", "Veuillez réagir avec la réaction 🚪", true)
                .addField("Lancer la partie", `Seul ${this.stemmingPlayer.displayName} peut lancer la partie avec ❇`, true)
                .addField("Stopper la partie", "Veuillez réagir avec la réaction 🔚", true)
                .addField("Joueurs participants au jeu", "Aucun participant pour le moment");

            this.msg.edit(this.richEmbed).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    initEvents() {
        return new Promise((resolve, reject) => {

            let gamePreparationMsg = new ReactionHandler(this.msg, ["🐺", "🚪", "❇", "🔚"]);

            gamePreparationMsg.addReactions().catch(err => reject(err));

            gamePreparationMsg.initCollector((reaction) => {

                let guildMember = this.guild.members.get(reaction.users.last().id);

                if (!guildMember) {
                    console.error(`${reaction.users.last().username} non présent sur le serveur ${this.guild.name}`);
                    return;
                }

                if (reaction.emoji.name === "🐺") {
                    this.configuration.addParticipant(guildMember);
                    this.rolesHandler.addPlayerRole(guildMember).catch(console.error);
                    this.updateParticipantsDisplay();
                    reaction.remove(guildMember.user).catch(console.error);
                    if (this.configuration.getParticipantsNames().length === this.MAX_PLAYERS) {
                        this.status = true;
                        gamePreparationMsg.collector.stop();
                    }
                } else if (reaction.emoji.name === "🚪") {
                    this.rolesHandler.removeRoles(guildMember);
                    this.configuration.removeParticipant(guildMember.id);
                    this.updateParticipantsDisplay();
                    reaction.remove(guildMember.user).catch(console.error);
                } else if (reaction.emoji.name === "❇") {
                    reaction.remove(guildMember.user).catch(console.error);
                    if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                        if (this.configuration.getParticipantsNames().length > 1) {
                            this.status = true;
                            gamePreparationMsg.collector.stop();
                        }
                    }
                } else if (reaction.emoji.name === "🔚") {
                    reaction.remove(guildMember.user).catch(console.error);
                    if (guildMember.id === this.stemmingPlayer.id || guildMember.hasPermission('BAN_MEMBERS')) {
                        this.status = false;
                        gamePreparationMsg.collector.stop();
                    }
                }

            }, () => {
                if (this.status === false) {
                    gamePreparationMsg.message.delete().catch(() => true);
                    LgLogger.info("User decided to end game", this.gameInfo);
                    resolve(false);
                } else {
                    gamePreparationMsg.removeReactionList(["🐺", "❇"]).catch(console.error);
                    this.rolesHandler.assignRoles(this.configuration)
                        .then((configuration) => {
                            this.configuration = configuration;
                            resolve(this.status);
                        })
                        .catch(err => reject(err));
                }
            }, (reaction) => reaction.count > 1 && reaction.users.last().id !== this.client.user.id);
        });
    }

    setupChannels() {
        return new Promise((resolve, reject) => {
            this.checkChannels().then((areChannelsReady) => {
                return this.channelsHandler.setupChannels(areChannelsReady, this.configuration);
            }).then(() => resolve(true)).catch(err => reject(err));
        });
    }

    checkChannels() {
        return new Promise((resolve, reject) => {

            this.channelsHandler.checkChannelsOnGuild().then(() => {
                resolve(true);
            }).catch(() => {
                resolve(false);
            });

        });
    }

    updateParticipantsDisplay() {
        this.richEmbed.fields[this.richEmbed.fields.length - 1].value = this.configuration
            .getParticipantsNames()
            .toString()
            .replace(/,+/g, "\n");
        if (this.richEmbed.fields[this.richEmbed.fields.length - 1].value === "") {
            this.richEmbed.fields[this.richEmbed.fields.length - 1].value = "Aucun participant pour le moment";
        }
        this.richEmbed.setFooter(`Nombre de joueurs : ${this.configuration.getParticipantsNames().length}`);
        this.msg.edit(this.richEmbed).catch(console.error);
    }

    askForChannelGeneration() {
        return new Promise((resolve, reject) => {
            this.preparationChannel.send(CommunicationHandler.getLGSampleMsg()
                .setTitle("Voulez-vous garder les salons nécessaires au jeu sur le serveur discord une fois la partie terminée ?")
                .setDescription("Garder les salons sur le serveur discord permet de ne plus les générer par la suite")
                .addField("✅", "Garder les salons sur le serveur")
                .addField("❎", "Supprimer les salons du serveur une fois la partie terminée")
            ).then(msg => {

                let question = new ReactionHandler(msg, ["✅", "❎"]);

                question.addReactions().then(() => {

                    question.initCollector((reaction) => {
                        let r = reaction.emoji.name;

                        if (r === "✅") {
                            this.keepChannels = true;
                            question.stop();
                        } else if (r === "❎") {
                            this.keepChannels = false;
                            question.stop();
                        }

                    }, () => {
                        msg.delete().then(() => resolve(this.keepChannels)).catch(() => resolve(this.keepChannels));
                    }, (reaction) => {
                        let user = reaction.users.last();
                        return reaction.count > 1 && (user.id === this.stemmingPlayer || this.guild.members.get(user.id).hasPermission('BAN_MEMBERS'))
                    });

                }).catch(err => reject(err));

            }).catch(err => reject(err));

        })
    }

}

module.exports = {GamePreparation};