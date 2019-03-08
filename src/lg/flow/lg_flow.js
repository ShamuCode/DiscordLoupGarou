const RichEmbed = require("discord.js").RichEmbed;
const BotData = require("../../BotData.js");
const lg_var = require('../lg_var.js');
const LgLogger = require("../lg_logger");
const botColor = require("../lg_var").botColor;
const Wait = require("../../functions/wait.js").Wait;
const EventEmitter = require('events');
const CommunicationHandler = require('../message_sending').CommunicationHandler;
let timeToString = require('../../functions/time');
const ReactionHandler = require("../../functions/reactionHandler").ReactionHandler;

class IGame {

    constructor(client) {

        this.client = client;

        return this;

    }

}

class GlobalTimer {
    constructor(channel, secInterval) {
        this.embed = CommunicationHandler
            .getLGSampleMsg()
            .addField(
                `⏭`,
                "Réagissez avec ⏭ pour skip l'attente. Tout le monde doit skip pour pouvoir procéder."
            );
        this.timer = null;
        this.message = null;
        this.channel = channel;
        this.secInterval = secInterval ? secInterval : 5;

        this.count = 0;
        this.max = 0;
        this.time = null;
        return this;
    }

    async end() {
        clearInterval(this.timer);
        this.count = 0;
        await this.message.delete();
        this.message = null;
        return this;
    }

    setTimer(minutes, title, playerNb) {
        return new Promise((resolve, reject) => {
            if (this.timer) clearInterval(this.timer);

            this.max = playerNb;

            this.time = minutes;

            this.embed.setTitle(`${title} : ${timeToString(minutes)}`);

            let msgPromise = [];

            if (!this.message) {
                msgPromise.push(this.channel.send(this.embed));
            } else {
                msgPromise.push(this.message.edit(this.embed));
            }

            Promise.all(msgPromise)
                .then((msgs) => {
                    this.message = msgs.shift();
                    return new ReactionHandler(this.message, ["⏭"]).addReactions()
                })
                .then(reactionHandler => {

                    reactionHandler.initCollector(
                        (reaction) => {
                            if (reaction.emoji.name === "⏭") {
                                this.count += 1;
                                if (this.count === this.max) {
                                    reactionHandler.stop();
                                }
                            }
                        },
                        () => {
                            this.message.delete()
                                .then(() => {
                                    this.end().catch(() => this.message = null);
                                    resolve(this);
                                })
                                .catch(err => reject(err));
                        },
                        (reaction) => reaction.count > 1
                    );

                    this.timer = setInterval(() => {
                        this.update().then(isDone => {
                            if (isDone) resolve(this);
                        }).catch(console.error);
                    }, this.secInterval * 1000);

                })
                .catch(err => reject(err));

        });
    }

    async update() {
        this.time = ((this.time * 60) - this.secInterval) / 60;

        if (this.time <= 0) {
            this.end().catch(() => this.message = null);
            return true;
        } else {
            this.embed.setTitle(`${this.embed.title.split(':')[0]}: ${timeToString(this.time)}`);
            await this.message.edit(this.embed);
            return false;
        }
    }

}

class GameFlow extends IGame {

    constructor(client, gameInfo, gameOptions) {

        super(client);

        this.gameInfo = gameInfo;
        this.gameOptions = gameOptions;

        this.GameConfiguration = null;
        this.msg = null;

        this.killer = new EventEmitter();

        // equals 0 if not on pause, and > 0 if on pause
        this.onPause = 0;

        this.turnNb = 1;

        this.gameStats = new RichEmbed().setColor(botColor).setDescription("Fin de partie");

        this.deadPeople = [];

        return this;

    }

    async listenDeaths() {
        setImmediate(() => {
            this.killer.on("death", (deadPlayer) => {

                if (!deadPlayer || typeof deadPlayer !== "object") {
                    LgLogger.warn(`Dead trigger error: deadPlayer equals ${deadPlayer}`, this.gameInfo);
                    return;
                }

                this.onPause += 1;
                LgLogger.info("onpause + 1", this.gameInfo);

                this.deadPeople.push(deadPlayer);

                LgLogger.info("Death triggered", this.gameInfo);

                deadPlayer.alive = false;

                this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.paradis_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: true},
                    [deadPlayer]
                ).then(() => this.GameConfiguration.channelsHandler.switchPermissions(
                    this.GameConfiguration.channelsHandler.channels.village_lg,
                    {VIEW_CHANNEL: true, SEND_MESSAGES: false},
                    [deadPlayer]
                )).then(() => {

                    if (deadPlayer.team === "LG") {
                        return this.GameConfiguration.channelsHandler.switchPermissions(
                            this.GameConfiguration.channelsHandler.channels.loups_garou_lg,
                            {'VIEW_CHANNEL': false, 'SEND_MESSAGES': false},
                            [deadPlayer]
                        );
                    }

                }).then(() => deadPlayer.die(this.GameConfiguration, this.killer).then((somebodyNew) => {

                    this.GameConfiguration.rolesHandler.removePlayerRole(deadPlayer.member).catch(console.error);
                    this.GameConfiguration.rolesHandler.addDeadRole(deadPlayer.member).catch(console.error);

                    deadPlayer.member.setVoiceChannel(this.GameConfiguration.channelsHandler._channels.get(
                        this.GameConfiguration.channelsHandler.voiceChannels.mort_lg
                    )).catch(() => true);

                    if (somebodyNew) {
                        somebodyNew.forEach(person => setImmediate(() => this.killer.emit("death", person)));
                    }

                    LgLogger.info("onpause - 1", this.gameInfo);
                    this.onPause -= 1;
                    setImmediate(() => this.killer.emit("death_processed"));

                })).catch(err => {
                    console.error(err);
                    LgLogger.info("onpause - 1", this.gameInfo);
                    this.onPause -= 1;
                    setImmediate(() => this.killer.emit("death_processed"));
                });

            });
        });
    }

    async run() {

        this.GameConfiguration.globalTimer = new GlobalTimer(this.GameConfiguration.channelsHandler._channels.get(
            this.GameConfiguration.channelsHandler.channels.thiercelieux_lg
        ));

        await this.listenDeaths();

        LgLogger.info('Game start', this.gameInfo);

        this.moveEveryPlayersToVocalChannel().catch(console.error);

        await this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg)
            .send(new RichEmbed().setColor(BotData.BotValues.botColor)
                .setAuthor("Les Loups-garous de Thiercelieux [v2.2]", lg_var.roles_img.LoupGarou)
                .setDescription('Développé par Kazuhiro#1248.\n\n*Thiercelieux est un petit village rural d\'apparence paisible,' +
                    ' mais chaque nuit certains villageois se transforment en loups-garou pour dévorer d\'autres villageois...*\n')
                .addField("Règles :",
                    'Les joueurs sont divisés en deux camps : les villageois (certains d\'entre eux jouant ' +
                    'un rôle spécial) et les loups-garou. Le but des villageois est de découvrir et d\'éliminer ' +
                    'les loups-garou, et le but des loups-garou est d\'éliminer tous les villageois.\nPour ' +
                    'les amoureux, leur but est de survivre tous les deux jusqu\'à la fin de la partie.')
                .setFooter("Bienvenue à Thiercelieux, sa campagne paisible, son école charmante, sa population accueillante, ainsi que " +
                    "ses traditions ancestrales et ses mystères inquiétants.", lg_var.roles_img.LoupGarou)
                .setImage(lg_var.roles_img.LoupGarou));


        await this.GameConfiguration.channelsHandler._channels.get(this.GameConfiguration.channelsHandler.channels.thiercelieux_lg)
            .send(new RichEmbed().setColor(BotData.BotValues.botColor)
                .addField(
                    "Table ronde",
                    this.GameConfiguration.getTable().map(member => member.displayName).toString().replace(/,+/g, '\n')
                )
            );


        this.GameConfiguration = await new FirstDay(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

        let shouldDie = await new FirstNight(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Le jour se lève sur thiercelieux 🌄`
        );

        await this.killPlayers(shouldDie);

        return await this.gameLoop();
    }

    async moveEveryPlayersToVocalChannel() {
        for (let player of this.GameConfiguration.getPlayers().values()) {
            player.member.setVoiceChannel(this.GameConfiguration.channelsHandler._channels.get(
                this.GameConfiguration.channelsHandler.voiceChannels.vocal_lg
            )).catch(() => true);
        }
    }

    async fillGameStats() {
        this.gameStats.setFooter(`Jeu terminé au bout de ${this.gameInfo.getPlayTime()}`);

        this.gameStats.addBlankField();
        this.gameStats.addField(
            "Loups",
            `${this.GameConfiguration.getMemberteams("LG")
                .toString().replace(/,+/g, '\n')}`,
            true
        ).addField(
            "Villageois",
            `${this.GameConfiguration.getMemberteams("VILLAGEOIS")
                .toString().replace(/,+/g, '\n')}`,
            true
        );

        if (this.GameConfiguration.getMemberteams("LOUPBLANC").length > 0) {
            this.gameStats.addField(
                "Loup Blanc",
                `${this.GameConfiguration.getMemberteams("LOUPBLANC")
                    .toString().replace(/,+/g, '\n')}`,
                true
            )
        }

        let winners = this.GameConfiguration.getAlivePlayers().map(player => `__**${player.member.displayName}**__`);

        this.gameStats.setDescription(
            `Vainqueur(s):\n\n${winners.length > 0 ? winners.toString()
                .replace(/,+/g, '\n') : "__**Personne n'a gagné !**__"}`
        );

    }

    /**
     * Problème d'architecture à venir avec l'infect père des loups :
     * Il peut infecter un villageois spécial, qui devient loup garou tout en gardant
     * ses pouvoirs précédents. Architecture à réfléchir pour pouvoir implémenter
     * l'infect père des loups, car la personne infecté aura deux rôles simultanément
     *
     * @returns {Promise<boolean>} resolve true if game ended, false if not.
     */
    async gameEnded() {
        let gameHasEnded = false;

        let gameStatus = {
            lg: 0,
            villageois: 0,
            abominableSectaire: 0,
            ange: 0,
            joueurDeFlute: 0,
            loupBlanc: 0,
            alivePlayers: 0
        };

        let players = this.GameConfiguration.getPlayers();

        for (let player of players.values()) {
            if (player.alive) {
                if (player.team === "LG") gameStatus.lg++;
                if (player.team === "VILLAGEOIS") gameStatus.villageois++;
                if (player.team === "ABOMINABLESECTAIRE") gameStatus.abominableSectaire++;
                if (player.team === "ANGE") gameStatus.ange++;
                if (player.team === "JOUEURDEFLUTE") gameStatus.joueurDeFlute++;
                if (player.team === "LOUPBLANC") gameStatus.loupBlanc++;
                gameStatus.alivePlayers++;
            }
        }

        let alivePlayers = this.GameConfiguration.getAlivePlayers();

        // selon la variante, le joueur de flute gagne puis termine la partie, ou pas
        if (this.GameConfiguration.charmedPlayers.length > 0) {

            if (this.GameConfiguration.charmedPlayers.length === alivePlayers.length - 1) {

                this.gameStats.setTitle("Le joueur de Flute a gagné !");
                this.gameStats.setImage(lg_var.roles_img.JoueurDeFlute);
                this.gameStats.setColor("GOLD");
                await this.fillGameStats();
                this.gameStats.setDescription(`Vainqueur : __**${this.GameConfiguration.JoueurDeFlute.member.displayName}**__`);

                return true;
            }

            if (this.GameConfiguration.charmedPlayers.length === alivePlayers.length - 2 && this.GameConfiguration.JoueurDeFlute.amoureux && !this.GameConfiguration._players.get(this.GameConfiguration.JoueurDeFlute.amoureux).charmed) {

                this.gameStats.setTitle("Le joueur de Flute et son amoureux/se ont gagné !");
                this.gameStats.setImage(lg_var.roles_img.JoueurDeFlute);
                this.gameStats.setColor("GOLD");
                await this.fillGameStats();
                this.gameStats.setDescription(`Vainqueurs : __**${this.GameConfiguration.JoueurDeFlute.member.displayName}**__ 💗  __**${this.GameConfiguration._players.get(this.GameConfiguration.JoueurDeFlute.amoureux).member.displayName}**__`);

                return true;
            }

        }

        if (gameStatus.alivePlayers === 1) {

            gameHasEnded = true;

            let alivePerson = alivePlayers[0];

            if (alivePerson.team === "LG") {
                this.gameStats.setTitle("Les Loups Garou ont gagnés !");
                this.gameStats.setImage(lg_var.roles_img.LoupGarou);
                this.gameStats.setColor('RED');
            } else if (alivePerson.team === "VILLAGEOIS") {
                this.gameStats.setTitle("Les Villageois ont gagnés !");
                this.gameStats.setImage(lg_var.roles_img.Villageois);
                this.gameStats.setColor('BLUE');
            }

            await this.fillGameStats();

            //todo: handle lone roles like loup blanc, ange and such, AND also Villageois if there is only 1 villager, same for LG team

        } else if (gameStatus.alivePlayers === 2 && alivePlayers[0].amoureux === alivePlayers[1].member.id) {

            gameHasEnded = true;
            this.gameStats.setTitle(`Le couple ${alivePlayers[0].member.displayName} 💗 ${alivePlayers[1].member.displayName} a gagné la partie !`);
            this.gameStats.setImage(lg_var.roles_img.Cupidon);
            this.gameStats.setColor('GOLD');
            await this.fillGameStats();

        } else if (gameStatus.lg === 0 && gameStatus.villageois === 0) {

            gameHasEnded = true;
            this.gameStats.setTitle("Tout le monde est mort !");
            this.gameStats.setColor('RED');
            await this.fillGameStats();

        } else if (gameStatus.lg === 0) {

            gameHasEnded = true;
            this.gameStats.setTitle("Les Villageois ont gagnés !");
            this.gameStats.setColor('BLUE');
            await this.fillGameStats();

        } else if (gameStatus.villageois === 0) {

            //todo: vérifier les rôles alone, ange, loup blanc..

            gameHasEnded = true;
            this.gameStats.setTitle("Les Loups Garou ont gagnés !");
            this.gameStats.setColor('RED');
            await this.fillGameStats();

        }

        LgLogger.info(`Game ended: ${gameHasEnded} | game status: ${
            Object.values(gameStatus).reduce((accumulator, currentValue) => accumulator + currentValue)
            } players remaining`, this.gameInfo);

        return gameHasEnded;
    }

    async gameLoop() {

        let shouldDie = [];

        while (await this.gameEnded() === false) {

            await Wait.seconds(3);

            while (this.onPause) {
                await Wait.seconds(1);
            }

            shouldDie = await new Day(this.GameConfiguration, this.gameInfo, this.turnNb, this.deadPeople).goThrough();

            await this.killPlayers(shouldDie);

            if (await this.gameEnded() === true) break;

            this.deadPeople = [];

            await Wait.seconds(2);

            while (this.onPause) {
                await Wait.seconds(1);
            }

            await this.GameConfiguration.channelsHandler.sendMessageToVillage("La nuit va bientôt tomber sur Thiercelieux...");
            await this.GameConfiguration.globalTimer.setTimer(
                23 / 60,
                "Temps avant la tombée de la nuit",
                this.GameConfiguration.getAlivePlayers().length
            );

            shouldDie = await new Night(this.GameConfiguration, this.gameInfo, this.turnNb).goThrough();

            await this.GameConfiguration.channelsHandler.sendMessageToVillage(
                `Le jour se lève sur thiercelieux 🌄`
            );

            await this.killPlayers(shouldDie);

            this.turnNb += 1;

            while (this.onPause) {
                await Wait.seconds(1);
            }

        }

        LgLogger.info("Game is over", this.gameInfo);

        return this.gameStats;
    }

    killPlayers(shouldDie) {
        return new Promise((resolve, reject) => {
            shouldDie = [...new Set(shouldDie)];
            shouldDie = shouldDie.filter(element => element !== undefined && element !== null);

            if (shouldDie.length === 0) return resolve(this);

            shouldDie.forEach(person => person ? setImmediate(() => this.killer.emit("death", person)) : null);
            LgLogger.info(`Should die : ${shouldDie.map(p => p ? p.member.displayName : null).toString()}`, this.gameInfo);
            this.killer.on("death_processed", () => {
                if (!this.onPause) {
                    LgLogger.info("resolve kill players", this.gameInfo);
                    resolve(this);
                }
            });
        });
    }
}

module.exports = {GameFlow};
