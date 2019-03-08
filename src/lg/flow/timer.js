const CommunicationHandler = require('../communicationHandler').CommunicationHandler;
const ReactionHandler = require("../../functions/reactionHandler").ReactionHandler;
let timeToString = require('../../functions/time');

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
                .then(/** @type {ReactionHandler} */ reactionHandler => {

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

module.exports = {GlobalTimer};