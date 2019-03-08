class GameOptions {
    constructor() {
        this._voice = true;
        this._music = true;
        this._musics = null;

        this.musicMode = null;

        this.extensions = {
            thiercelieux: false,
            nouvelleLune: false,
            personnage: false,
            village: false
        };

        return this;
    }

    set voice(value) {
        this._voice = value;
    }

    get voice() {
        return this._voice;
    }

    set music(value) {
        this._music = value;
    }

    get music() {
        return this._music;
    }

    activateThiercelieuxExtension() {
        this.extensions.thiercelieux = true;
        return this;
    }

    activateNouvelleLuneExtension() {
        this.extensions.nouvelleLune = true;
        return this;
    }

    activatePersonnageExtension() {
        this.extensions.personnage = true;
        return this;
    }

    activateVillageExtension() {
        this.extensions.village = true;
        return this;
    }

}

module.exports = {GameOptions};