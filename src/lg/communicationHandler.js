const BotData = require("../BotData");
const lg_var = require("./variables");
const IGame = require("./game/interface").IGame;

class CommunicationHandler extends IGame {

    constructor(client, message) {

        super(client);

        return this;

    }

    static getLGSampleMsg() {
        return new RichEmbed()
            .setColor(BotData.BotValues.botColor)
            .setAuthor("Loup-Garou de Thiercelieux", lg_var.roles_img.LoupGarou);
    }

    static reconstructEmbed(messageEmbed) {

        let newEmbed = new RichEmbed();

        if (messageEmbed.author) newEmbed.setAuthor(messageEmbed.author);
        if (messageEmbed.color) newEmbed.setColor(messageEmbed.color);
        if (messageEmbed.description) newEmbed.setDescription(messageEmbed.description);
        if (messageEmbed.footer) newEmbed.setFooter(messageEmbed.footer);
        if (messageEmbed.image) newEmbed.setImage(messageEmbed.image);
        if (messageEmbed.thumbnail) newEmbed.setThumbnail(messageEmbed.thumbnail);
        if (messageEmbed.title) newEmbed.setTitle(messageEmbed.title);
        if (messageEmbed.url) newEmbed.setURL(messageEmbed.url);

        messageEmbed.fields.forEach(field => {

            if (field.name === '\u200B' && field.value === '\u200B') {
                newEmbed.addBlankField(field.inline);
            } else {
                newEmbed.addField(field.name, field.value, field.inline);
            }

        });

        return newEmbed;
    }

}

module.exports = {CommunicationHandler};