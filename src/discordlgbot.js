const Discord = require('discord.js');
const fs = require('graceful-fs');

class DiscordLGBot extends Discord.Client {

    constructor() {
        super();

        this.initializeCommands();

        this.on('ready', this.onReady);
        this.on('error', err => console.error(err));
        this.on('disconnect', event => console.error(event));
        this.on('resume', nb => console.info(`Connection resumed. Replayed: ${nb}`));
        this.on('message', this.onMessage);

        this.login(process.env.botToken).then(() => console.log('Logged in')).catch(console.error);

        return this;
    }

    initializeCommands() {
        this.commands = new Discord.Collection();

        for (const file of fs.readdirSync('./src/commands')) {
            const command = require(`./commands/${file}`);
            this.commands.set(command.name.toLowerCase(), command);
        }
    }

    initializeDatabases() {
        const connectToMysqlDB = require('./functions/database');
        const Enmap = require('enmap');
        const EnmapLevel = require('enmap-level');
        const Settings = new EnmapLevel({name: "Settings"});
        this.Settings = new Enmap({provider: Settings});
        const LG = new EnmapLevel({name: "LG"});
        this.LG = new Enmap({provider: LG});
        const userStat = new EnmapLevel({name: "userStat"});
        this.userStat = new Enmap({provider: userStat});

        connectToMysqlDB(this).then(() => console.info('Mysql Database connected')).catch(console.error);

        return this;
    }

    onReady() {
        console.info('The bot is ready.');
        console.info(`Connected to ${this.guilds.size} servers, servicing ${this.users.size} users.`);

        this.initializeDatabases();

        this.user.setActivity(`${process.env.botPrefix}help - Réalisé par Kazuhiro#1248 - https://gitlab.com/AmadeusSalieri/DiscordLoupGarou`).catch(console.error);

        this.voiceConnections.array().forEach(voiceConnection => {
            voiceConnection.disconnect();
        });

        //const msg = LGBot.Settings.get("RestartMsg");

        /*if (msg && msg.length > 0) {

            if (LGBot.Settings.Admins) {
                LGBot.Settings.Admins.forEach(adminID => {
                    let user = LGBot.users.get(adminID);

                    if (user) user.send('Le bot Loup Garou a redémarré. ' + msg).catch(console.error);
                });
            } else {
                LGBot.Settings.Admins = [];

                LGBot.guilds.array().forEach(guild => {
                    LGBot.Settings.Admins.push(guild.ownerID);

                    let user = LGBot.users.get(guild.ownerID);

                    if (user) user.send('Le bot Loup Garou vient de redémarrer. ' + msg).catch(console.error);

                });
            }

        }*/
    }

    onMessage(message) {
        if (message.author.bot) return;

        const args = message.content.slice(process.env.botPrefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();

        if (!message.content.startsWith(process.env.botPrefix)) {
            return;
        }

        if (!this.commands.has(command)) return;

        try {
            this.commands.get(command).execute(this, message, args);
        } catch (error) {
            console.error(error);
            message.reply('une erreur s\'est produite pendant l\'exécution de cette commande !').catch(console.error);
        }
    }

}

new DiscordLGBot();

require('./utils/utils');
