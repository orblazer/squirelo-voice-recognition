/**
 * The match sentence callback
 *
 * @callback OnMatchSentence
 * @param {string} sentence The matched sentence
 * @returns {void}
 */

/**
 * Setup the voice recognition
 * @param {string[]} filter The match sentences (each string is search in voice sentence)
 * @param {OnMatchSentence} onMatch The function called when {@link matchSentences} is matched (this is not fired if is in timeout or is in same sentence)
 * @param {number} [timeout=30] The timeout in seconds between 2 call of {@link onMatch}
 */
function setup(filter, onMatch, timeout = 30) {
  // Bind elements
  const stateElem = document.getElementById('state')
  const matchedCountElem = document.getElementById('matched-count')
  const matchedSentenceElem = document.getElementById('matched-sentence')
  const filterElem = document.getElementById('filter')

  // Declare variables
  let matchedSentence = 0
  let lastRun = 0

  const matchRegex = new RegExp(`(${filter.map((entry) => escapeRegExp(entry)).join('|')})`, 'gi')
  const recognition = new GrammarDetector(matchRegex, {
    continuous: true,
    lang: 'fr-FR',
    interimResults: true,
  })

  // Bind buttons
  document.getElementById('action').addEventListener('click', () => {
    if (recognition.isActive) {
      recognition.stop()
    } else {
      recognition.start()
    }
  })

  // Fill filter
  filter.forEach(entry => {
    filterElem.insertAdjacentHTML('beforeend', `<li>${entry}</li>`)
  })

  // Bind recognition events
  recognition.addEventListener('start', () => {
    stateElem.innerHTML = 'Activé'
    stateElem.style.color = 'green'
  })
  recognition.addEventListener('end', () => {
    stateElem.innerHTML = 'Désactivé'
    stateElem.style.color = 'red'
  })
  recognition.addEventListener('error', console.error)
  recognition.addEventListener('sentence', ({ detail }) => {
    if (!detail.matched) {
      return
    }

    matchedCountElem.innerHTML = ++matchedSentence
    matchedSentenceElem.insertAdjacentHTML(
      'afterbegin',
      `<li>${detail.value.replace(matchRegex, '<mark>$&</mark>')}</li>`
    )
  })

  // Bind recognition event
  recognition.addEventListener('match', ({ detail }) => {
    const now = Date.now()
    if ((now - lastRun) / 1000 >= timeout) {
      lastRun = now
      onMatch(detail.value)
    }
  })
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
