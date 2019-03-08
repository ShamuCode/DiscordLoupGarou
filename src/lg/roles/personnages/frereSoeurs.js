const Villageois = require("../baseRole").Villageois;

class FamilleMember extends Villageois {

    constructor(guildMember) {
        super(guildMember);



        return this;
    }

}

class Frere extends FamilleMember {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Frere";

        return this;
    }

}

class Soeur extends FamilleMember {

    constructor(guildMember) {
        super(guildMember);

        this.role = "Soeur";

        return this;
    }

}

module.exports = {Frere, Soeur};