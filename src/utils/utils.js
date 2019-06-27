let randomCompareFct = () => Math.random() - 0.5;

module.exports = () => {

    Array.prototype.shuffle = () => this.sort(randomCompareFct);

    Map.prototype.getShuffled = () => new Map([...this.entries()].sort(randomCompareFct));

};