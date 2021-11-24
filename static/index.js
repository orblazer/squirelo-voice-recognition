/**
 * The match sentences (each string is search in voice sentence)
 * @type {string[]}
 */
const filter = ['bonjour', 'salut']

/**
 * The timeout in seconds between 2 call of {@link onMatch}
 * @type {number}
 */
const timeout = 10

/**
 * The function called when {@link matchSentences} is matched (this is not fired if is in timeout or is in same sentence)
 * @param {string} sentence The matched sentence
 * @param {boolean} isFinal The sentence is final
 */
function onMatch(sentence, isFinal) {}

/**
 * DONT NEED TO TOUCH BELLOW !
 *
 * If you touch, make the stuff inside `window.onload`
 */
window.onload = () => {
  setup(filter, onMatch, timeout)
}
