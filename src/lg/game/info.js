class GameInfo {

    constructor(message, playTime) {
        this.guild = message.guild;
        this.playTime = playTime;
        this._history = [];
        this.gameNumber = new Date().toUTCString().split(' ')[4];
        if (this.gameNumber) {
            this.gameNumber.replace(/:+/g, "42");
        }
    }

    addToHistory(msg) {
        this._history.push(msg);
    }

    get history() {
        return this._history;
    }

    get serverName() {
        return this.guild.name;
    }

    get stemmingTime() {
        return this.playTime;
    }

    get gameNb() {
        return this.gameNumber;
    }

    getPlayTime() {
        let minutes = (new Date() - this.playTime) / 1000 / 60;
        let hours = minutes / 60;
        let playTime = `${(minutes % 60).toFixed()}m`;
        if (hours >= 1) {
            playTime = `${hours.toFixed()}h${playTime}`;
        }

        return playTime;
    }
}

module.exports = {GameInfo};