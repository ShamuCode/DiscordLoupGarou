class Period {

    constructor(configuration, gameInfo, turnNb) {

        this.GameConfiguration = configuration;

        this.gameInfo = gameInfo;

        this.turnNb = turnNb;

        this.roleMap = this.GameConfiguration.getRoleMap({dead: false, alive: true});
        this.deadRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: false});
        this.allRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: true});

        return this;

    }

    async updateRoleMaps() {
        this.roleMap = this.GameConfiguration.getRoleMap({dead: false, alive: true});
        this.deadRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: false});
        this.allRoleMap = this.GameConfiguration.getRoleMap({dead: true, alive: true});
        return this;
    }

}

module.exports = {Period};