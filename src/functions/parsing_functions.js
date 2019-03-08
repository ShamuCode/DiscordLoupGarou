function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

let shuffle_array = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = getRandomInt(0, i);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

module.exports = {

    shuffle_array,

    get_random_index: function (array) {
        if (array.length === 1) return (0);
        return (getRandomInt(0, array.length));
    },

    get_random_in_array: (array) => {
        if (array.length === 1) return (array[0]);
        return (array[getRandomInt(0, array.length)]);
    }

};
