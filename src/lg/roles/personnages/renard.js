const Villageois = require("../baseRole").Villageois;

class Renard extends Villageois {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Renard";

        return this;
    }

}

module.exports = {Renard};