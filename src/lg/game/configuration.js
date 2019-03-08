class GameConfiguration {

    constructor(gameInfo) {

        this.gameInfo = gameInfo;
        this.globalTimer = null;

        this._table = [];

        // players of the game, mapped by id, we store here LG game role objects like LoupBlanc()
        this._players = new Map();

        // participants mapped by their Id, we store here only GuildMember objects for game preparation
        this._participants = new Map();

        this.channelsHandler = undefined;
        this.rolesHandler = undefined;
        this.voiceHandler = undefined;

    }

    toString() {

        let msg = 'Configuration du jeu\n\n';

        let conf = this.getRoleMap({alive: true, dead: false});

        for (let [role, playerArray] of conf.entries()) {

            msg += `__${role}__ : **${playerArray.length}**\n`;

        }

        return msg;

    }

    needsLG() {
        let lgNb = 0;
        let totalNb = 0;

        for (let player of this._players.values()) {
            if (player.team === "LG") {
                lgNb += 1;
            }
            totalNb += 1;
        }

        return ((lgNb + 1) / totalNb) * 100 <= 25;

    }

    get charmedPlayers() {

        let charmedPlayers = [];

        for (let player of this._players.values()) {
            if (player.charmed) {
                charmedPlayers.push(charmedPlayers);
            }
        }

        return charmedPlayers;

    }

    get JoueurDeFlute() {

        for (let player of this._players.values()) {
            if (player.role === "JoueurDeFlute") {
                return player;
            }
        }

        return null;

    }

    getLGChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.loups_garou_lg);
    }

    get villageChannel() {
        return this.channelsHandler._channels.get(this.channelsHandler.channels.village_lg);
    }

    get Capitaine() {

        for (let player of this._players.values()) {
            if (player.capitaine) return player;
        }

        return null;
    }

    getPlayerById(id) {
        return this._players.get(id);
    }

    getGameConfString() {

        let str = '';

        for (let player of this._players.values()) {
            str += `${player.member.displayName} : ${player.role}, `;
        }

        return str.slice(0, str.length - 2);

    }

    getParticipants() {
        return this._participants;
    }

    addParticipant(guildMember) {
        this._participants.set(guildMember.id, guildMember);
    }

    removeParticipant(id) {
        this._participants.delete(id);
    }

    getTable() {
        if (this._table.length === 0) {
            this._table = Array.from(this._participants.values());
        }
        return this._table;
    }

    getParticipantsNames() {
        let participantsNames = [];

        for (let participant of this._participants.values()) {
            participantsNames.push(participant.displayName);
        }

        return participantsNames;
    }

    getPlayerNames() {
        let playerNames = [];

        for (let player of this._players.values()) {
            playerNames.push(player.member.displayName);
        }

        return playerNames;
    }

    getMemberteams(team) {
        let lgNames = [];

        for (let player of this._players.values()) {
            if (player.team === team) lgNames.push(`**${player.role}** : ${player.member.displayName}`);
        }

        return lgNames;
    }

    getPlayersIdName() {

        let playersIdName = new Map();

        for (let [id, player] of this._players) {
            playersIdName.set(id, player.member.displayName);
        }

        return playersIdName;

    }

    getPlayers() {
        return this._players;
    }

    getDeadPlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (!player.alive) players.push(player);
        }

        return players;
    }

    getAlivePlayers() {
        let players = [];

        for (let player of this._players.values()) {
            if (player.alive) players.push(player);
        }

        return players;
    }

    addPlayer(player) {
        this._players.set(player.member.id, player);
    }

    removePlayer(id) {
        this._players.delete(id);
    }

    getRoleMap(options) {

        let roleMap = new Map();

        let array;
        for (let player of this._players.values()) {

            array = roleMap.get(player.role);

            if (!array) {
                if ((options.alive && options.dead) ||
                    (options.alive && !options.dead && player.alive) ||
                    (!options.alive && options.dead && !player.alive)) {
                    roleMap.set(player.role, [player]);
                }
            } else if ((options.alive && options.dead) ||
                (options.alive && !options.dead && player.alive) ||
                (!options.alive && options.dead && !player.alive)) {

                array.push(player);
                roleMap.set(player.role, array);

            }

        }

        return roleMap;

    }

    getLG(onlyAlive) {

        let lgs = [];

        for (let player of this._players.values()) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgs.push(player);
                } else {
                    lgs.push(player);
                }
            }
        }

        return lgs;
    }

    getLGIds(onlyAlive) {
        let lgIds = [];

        for (let [id, player] of this._players) {
            if (player.team === "LG") {
                if (onlyAlive) {
                    if (player.alive) lgIds.push(id);
                } else {
                    lgIds.push(id);
                }
            }
        }

        return lgIds;
    }

    /**
     *
     * @param includeDead specifies if you want to include dead villageois as well as alive villageois
     * @returns {Array}
     */
    getVillageois(includeDead) {

        if (includeDead === undefined) includeDead = true;

        let villageois = [];

        for (let player of this._players.values()) {
            if (player.team === "VILLAGEOIS") {
                if (!includeDead) {
                    if (player.alive) villageois.push(player);
                } else {
                    villageois.push(player);
                }
            }
        }

        return villageois;
    }

}

module.exports = {GameConfiguration};