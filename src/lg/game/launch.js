const LoupGarou = require("../game/game");
const getMusics = require('../../functions/googleSheets');
const GameOptions = require("../game/options").GameOptions;
const get_random_in_array = require("../../functions/parsing_functions").get_random_in_array;
const SondageInfiniteChoice = require("../../functions/cmds/referendum").SondageInfiniteChoice;
const RichEmbed = require('discord.js').RichEmbed;
let botData = require("../../BotData.js");

let askMusicMode = async (message) => {

    let musicModes = await getMusics();
    let musicsData = musicModes.gameData;
    musicModes = Object.keys(musicsData);

    let embed = new RichEmbed()
        .setTitle("Cliquez ici pour rajouter vos musiques")
        .setColor(botData.BotValues.botColor)
        .setURL("https://docs.google.com/spreadsheets/d/18-N7KfwYHyRIsKG06D_5tLIrpoLaeOm9WvS_RT79wfc/edit?usp=sharing");

    let choiceArray = await new SondageInfiniteChoice(
        "Quel set de musiques voulez-vous utiliser ?",
        musicModes, message.channel, 30000, embed, true, false
    ).post();

    let result = [];

    choiceArray.forEach(choice => {
        result.push(musicModes[choice[0] - 1]);
    });

    let finalChoice = null;

    if (result.length === 0) {
        finalChoice = get_random_in_array(musicModes);
    } else {
        finalChoice = get_random_in_array(result);
    }

    return musicsData[finalChoice];
};

let askOptions = async (message, extension) => {

    let gameOptions = new GameOptions();

    if (extension === "all") {
        gameOptions.activateAllExtensions();
    } else {
        gameOptions.activateExtension(extension);
    }

    gameOptions.musicMode = await askMusicMode(message);

    await message.channel.send(new RichEmbed().setColor(botData.BotValues.botColor)
        .setTitle(`Musiques utilisées : ${gameOptions.musicMode.name}`));

    return gameOptions;

};

let launchNewGame = async (LGBot, message, LG, extension) => {

    let gameOptions = await askOptions(message, extension);

    LG.running = true;
    LG.stemming = message.author.id;
    LGBot.LG.set(message.guild.id, LG);

    LG.game = new LoupGarou.Game(LGBot, message, gameOptions);

    await LG.game.launch();

    LG.game = null;
    LG.running = false;
    LGBot.LG.set(message.guild.id, LG);

};

let instanciateLgGame = async (LGBot, message, extension) => {

    if (!message.member) {
        return;
    }

    let LG = LGBot.LG.get(message.guild.id);

    if (LG === undefined || LG === null) {
        LG = botData.LG;
        LGBot.LG.set(message.guild.id, LG);
        LG = LGBot.LG.get(message.guild.id);
    }

    if (!LG.running) {

        launchNewGame(LGBot, message, LG, extension).catch(console.error);

    } else {
        message.channel.send("Partie de LG déjà en cours, pour stopper la partie de force, tapez lg/stop").catch(console.error);
    }
};

module.exports = {instanciateLgGame};