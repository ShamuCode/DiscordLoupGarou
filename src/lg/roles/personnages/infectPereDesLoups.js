const LoupGarou = require("../baseRole").LoupGarou;

class InfectPereDesLoups extends LoupGarou {

    constructor(guildMember) {
        super(guildMember);

        this.role = "InfectPereDesLoups";

        return this;
    }

}

module.exports = {InfectPereDesLoups};