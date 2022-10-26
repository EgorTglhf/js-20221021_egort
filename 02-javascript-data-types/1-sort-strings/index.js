/**
 * sortStrings - sorts array of string by two criteria "asc" or "desc"
 * @param {string[]} arr - the array of strings
 * @param {string} [param="asc"] param - the sorting type "asc" or "desc"
 * @returns {string[]}
 */
export function sortStrings(arr, param = 'asc') {
    // new array which will be sorted
    let newArr = arr.map(a => a);
    // sorting with correct compare strings and rule for upper case
    newArr.sort((a, b) => {
        if (a.toLowerCase() === b.toLowerCase()) {
            return b.localeCompare(a);
        } else {
            return param === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
        }
    });

    return newArr;

}
