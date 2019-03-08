const lg_var = require('../lg_var.js');
const LgLogger = require("../lg_logger");
const LoupGarouVote = require("../lg_vote").LoupGarouVote;
const get_random_in_array = require("../../functions/parsing_functions").get_random_in_array;
const allRoles = require("../roles/roleFactory").allRoles;
const Period = require("./lg_period").Period;

class Night extends Period {

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

        configuration.voiceHandler.playNightBGM().catch(console.error);

        this.LGTarget = null;
        this.shouldDieTonight = new Map();

        configuration.channelsHandler.switchPermissions(
            configuration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: false},
            configuration.getAlivePlayers()
        ).catch(console.error);

        return this;
    }

    async initRole(roleName, prefix, realName) {
        let roles = this.roleMap.get(roleName);

        if (!roles || roles.length < 1) {
            return false;
        }

        let role = roles[0];

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `${prefix}**${realName ? realName : roleName}** se réveille.`,
            undefined,
            lg_var.roles_img[roleName]
        );

        return role;
    }

    async initPetiteFilleListening() {
        let petitesFilles = this.roleMap.get("PetiteFille");

        if (!petitesFilles || petitesFilles.length < 1 || !petitesFilles[0].alive) {
            try {
                if (this.GameConfiguration.loupGarouMsgCollector) {
                    this.GameConfiguration.loupGarouMsgCollector.stop();
                }
            } catch (e) {
                console.error(e);
            }
            return;
        }

        LgLogger.info("Début de l'écoute petite fille", this.gameInfo);

        let petiteFille = petitesFilles[0];

        let dmChannel = await petiteFille.getDMChannel();

        await dmChannel.send("Début de l'écoute des loups garous");

        this.GameConfiguration.loupGarouMsgCollector = this.GameConfiguration.getLGChannel().createMessageCollector(() => true);

        this.GameConfiguration.loupGarouMsgCollector.on("collect", msg => {
            dmChannel.send(msg.cleanContent).catch(() => true);
        });

    }


    async goThrough() {
        LgLogger.info("Going through night", this.gameInfo);
        this.shouldDieTonight.clear();

        await this.GameConfiguration.channelsHandler.sendMessageToVillage("🌌 La nuit tombe.");

        await Promise.all([
            this.callLoupsGarou(),
            this.callJoueurDeFlute(),
            this.callSalvateur()
        ]);

        await this.updateRoleMaps();

        await Promise.all([
            this.callVoyante(),
            this.callChaman(),
            this.callInfectPereDesLoups(),
            this.callFrereSoeurs()
        ]);

        await this.updateRoleMaps();

        await Promise.all([
            this.callSorciere(),
            this.callRenard()
        ]);

        await this.updateRoleMaps();

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: true},
            this.GameConfiguration.getAlivePlayers()
        );

        return Array.from(this.shouldDieTonight.values());
    }

    async informCharmedPlayers() {

        let promises = [];

        this.GameConfiguration.charmedPlayers.forEach(charmedPlayer => {
            promises.push(charmedPlayer.member.send("Tu es charmé par le joueur de flûte"));
        });

        await Promise.all(promises);

    }

    async callLoupsGarou() {

        if (this.turnNb === 1) {
            this.GameConfiguration.getLGChannel().send("Prenez garde à la petite fille...").catch(console.error);
        }
        await this.initPetiteFilleListening();

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Les **Loups Garous** se réveillent 🐺`, undefined, lg_var.roles_img.LoupGarou
        );

        await this.GameConfiguration.voiceHandler.announceRole("LoupGarou", true);

        let outcome = await new LoupGarouVote(
            "Veuillez choisir votre proie.",
            this.GameConfiguration,
            60000,
            this.GameConfiguration.getLGChannel()
        ).excludeDeadPlayers().runVote(this.GameConfiguration.getLGIds());

        if (!outcome || outcome.length === 0) {
            this.shouldDieTonight.set("LGTarget", get_random_in_array(this.GameConfiguration.getVillageois(false)));
        } else {
            this.shouldDieTonight.set("LGTarget", this.GameConfiguration.getPlayerById(get_random_in_array(outcome)));
        }

        await this.GameConfiguration.getLGChannel().send(
            `Votre choix est de dévorer ${this.shouldDieTonight.get("LGTarget").member.displayName}`
        );

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            `Les **Loups Garous** se rendorment.`, undefined, lg_var.roles_img.LoupGarou
        );

        return this;
    }

    async callJoueurDeFlute() {

        let joueurDeFlute = await this.initRole("JoueurDeFlute", "Le ");

        if (!joueurDeFlute) return this;

        await joueurDeFlute.processRole(this.GameConfiguration);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "Le **Joueur de Flute** se rendort.", undefined, lg_var.roles_img.JoueurDeFlute
        );

        return this;
    }

    async callSalvateur() {

        let salvateur = await this.initRole("Salvateur", "Le ");

        if (!salvateur) return this;

        await salvateur.processRole(this.GameConfiguration);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "Le **Salvateur** se rendort.", undefined, lg_var.roles_img.Salvateur
        );

        return this;
    }

    async callVoyante() {

        let voyante = await this.initRole("Voyante", "La ");

        if (!voyante) {
            return this;
        }

        await this.GameConfiguration.voiceHandler.announceRole("Voyante", true);

        await voyante.processRole(this.GameConfiguration);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "La **Voyante** se rendort.", undefined, lg_var.roles_img.Voyante
        );

        return this;
    }

    async callChaman() {
        return this;
    }

    async callInfectPereDesLoups() {
        return this;
    }

    async callFrereSoeurs() {
        return this;
    }

    async callSorciere() {

        let sorciere = await this.initRole("Sorciere", "La ", "Sorcière");

        if (!sorciere) return this;

        await this.GameConfiguration.voiceHandler.announceRole("Sorciere", true);

        await sorciere.processRole(this.GameConfiguration, this.shouldDieTonight.get("LGTarget"));

        if (sorciere.savedLgTarget || sorciere.targetIsSavedBySalva) {
            this.shouldDieTonight.set("LGTarget", null);
        }

        this.shouldDieTonight.set("SorciereTarget", sorciere.target);

        if (sorciere.target) {
            LgLogger.info(`Sorciere target: ${sorciere.target.member.displayName}`, this.gameInfo);
            LgLogger.info(`Sorciere saved: ${sorciere.savedLgTarget}`, this.gameInfo);
            LgLogger.info(`Sorciere potions: vie[${sorciere.potions.vie}] poison[${sorciere.potions.poison}]`, this.gameInfo);
        }

        sorciere.savedLgTarget = false;
        sorciere.targetIsSavedBySalva = false;

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "La **Sorcière** se rendort", undefined, lg_var.roles_img.Sorciere
        );

        return this;
    }

    async callRenard() {
        return this;
    }

}

class FirstNight extends Night {

    constructor(configuration, gameInfo, turnNb) {

        super(configuration, gameInfo, turnNb);

        return this;

    }

    async goThrough() {

        await this.GameConfiguration.channelsHandler.sendMessageToVillage("🌌 La nuit tombe.");

        await this.callVoleur();
        await this.updateRoleMaps();
        await this.callCupidon();
        await this.updateRoleMaps();
        await this.callEnfantSauvage();
        await this.updateRoleMaps();

        await Promise.all([
            this.callLoupsGarou(),
            this.callJoueurDeFlute(),
            this.callSalvateur()
        ]);

        await this.updateRoleMaps();

        await Promise.all([
            this.callVoyante(),
            this.callChaman(),
            this.callInfectPereDesLoups(),
            this.callFrereSoeurs()
        ]);

        await this.updateRoleMaps();

        await Promise.all([
            this.callSorciere(),
            this.callRenard()
        ]);

        await this.updateRoleMaps();

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: true},
            this.GameConfiguration.getAlivePlayers()
        );

        return Array.from(this.shouldDieTonight.values());
    }

    async callVoleur() {
        let newPlayer = null;

        let voleur = await this.initRole("Voleur", "Le ");

        if (!voleur) return this;

        await this.GameConfiguration.voiceHandler.announceRole("Voleur", true);

        await voleur.proposeRoleChoice(this.GameConfiguration);

        if (!voleur.roleChosen) {
            this.gameInfo.addToHistory(`[Voleur] ${voleur.member.displayName}: a choisi de garder son rôle`);
            return this;
        }

        this.gameInfo.addToHistory(`[Voleur] ${voleur.member.displayName}: a choisi de prendre le rôle ${voleur.roleChosen}`);

        let voleurId = voleur.member.id;

        this.GameConfiguration.removePlayer(voleurId);
        this.GameConfiguration.addPlayer(allRoles[voleur.roleChosen](voleur.member));

        newPlayer = this.GameConfiguration.getPlayerById(voleurId);
        let promises = [];

        Object.keys(newPlayer.permission).forEach((channelName) => {

            let channel = this.GameConfiguration.channelsHandler._channels.get(
                this.GameConfiguration.channelsHandler.channels[channelName]
            );

            if (channel) {
                promises.push(
                    channel.overwritePermissions(
                        newPlayer.member,
                        newPlayer.permission[channelName]
                    )
                );
            }

        });

        await Promise.all(promises);

        await this.GameConfiguration.channelsHandler.switchPermissions(
            this.GameConfiguration.channelsHandler.channels.village_lg,
            {VIEW_CHANNEL: true, SEND_MESSAGES: false},
            [newPlayer]
        );

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "**Le Voleur** se rendort.", undefined, lg_var.roles_img.Voleur
        );

        return this;
    }

    async callCupidon() {

        let cupidons = this.roleMap.get("Cupidon");

        if (!cupidons || cupidons.length < 1) {
            return true;
        }

        let cupidon = cupidons[0];

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "💘 **Cupidon** se réveille, il désignera __les amoureux__.", undefined,
            lg_var.roles_img.Cupidon
        );

        await this.GameConfiguration.voiceHandler.announceRole("Cupidon", true);

        let [id1, id2] = cupidon.getChoice(this.GameConfiguration);

        let choice1 = this.GameConfiguration._players.get(id1);
        let choice2 = this.GameConfiguration._players.get(id2);

        if (!choice1 || !choice2) {
            LgLogger.info("Cupidon n'a pas fait son choix", this.gameInfo);

            let players = Array.from(this.GameConfiguration._players.values());
            let randomChoice = get_random_in_array(players);
            players.splice(players.indexOf(randomChoice));

            if (!choice1) choice1 = randomChoice;
            if (!choice2) choice2 = get_random_in_array(players);
        }

        choice1.amoureux = choice2.member.id;
        choice2.amoureux = choice1.member.id;

        this.GameConfiguration._players.set(choice1.member.id, choice1);
        this.GameConfiguration._players.set(choice2.member.id, choice2);

        LgLogger.info(`${choice1.member.displayName} et ${choice2.member.displayName} sont en couple.`, this.gameInfo);

        await Promise.all([
            cupidon.member.send(`${choice1.member.displayName} et ${choice2.member.displayName} sont en couple.`),
            choice1.member.send(`Tu es en couple avec ${choice2.member.displayName} 💞`),
            choice2.member.send(`Tu es en couple avec ${choice1.member.displayName} 💞`),
        ]);

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "💘 **Cupidon** se rendort.", undefined, lg_var.roles_img.Cupidon
        );

        return this.GameConfiguration;

    }

    async callEnfantSauvage() {
        let enfantSauvage = this.roleMap.get("EnfantSauvage");

        if (!enfantSauvage || enfantSauvage.length < 1) return this;

        enfantSauvage = enfantSauvage[0];

        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "L'**Enfant Sauvage** se réveille.", undefined, lg_var.roles_img.EnfantSauvage
        );

        await enfantSauvage.askForModel(this.GameConfiguration);
        await this.GameConfiguration.channelsHandler.sendMessageToVillage(
            "L'**Enfant Sauvage** se rendort.", undefined, lg_var.roles_img.EnfantSauvage
        );

        return this;
    }

}

module.exports = {Night, FirstNight};
