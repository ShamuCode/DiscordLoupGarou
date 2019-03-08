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

    activateExtension(extension) {
        this.extensions[extension] = true;
        return this;
    }

    activateAllExtensions() {
        this.extensions.thiercelieux = true;
        this.extensions.nouvelleLune = true;
        this.extensions.personnage = true;
        this.extensions.village = true;
        return this;
    }

}

module.exports = {GameOptions};