/**
 * @typedef GrammarDetectorOptions
 * @type {object}
 * @property {boolean} continuous The recognition listen in continuous
 * @property {string} lang The lang of recognition
 * @property {boolean} interimResults The interim results is allowed or not
 * @property {boolean} maxAlternatives The maximum alternatives
 * @property {number} confidence The confidence step
 * @property {number} sameSentenceTolerance The same sentence tolerance ratio
 */

const activeSym = Symbol('active')
const recognitionSym = Symbol('recognition')

class GrammarDetector extends EventTarget {
  /**
   * @param {RegExp} regex The match regex
   * @param {GrammarDetectorOptions} options The options
   */
  constructor(
    regex,
    {
      continuous = true,
      lang = 'en-US',
      interimResults = false,
      maxAlternatives = 1,
      confidence = 0.8,
      sameSentenceTolerance = 0.5,
    }
  ) {
    super()

    this._options = {
      regex,
      continuous,
      lang,
      interimResults,
      maxAlternatives,
      confidence,
      sameSentenceTolerance,
    }

    this._currentSentence = { value: '', matched: false }
    this._lastSentence = { value: '', matched: false }
  }

  get isActive() {
    return this[activeSym]
  }

  /**
   * Start the recognition
   */
  start() {
    if (this[activeSym]) {
      return
    }
    this[activeSym] = true

    this[recognitionSym] = new webkitSpeechRecognition()

    // Bind options
    this[recognitionSym].continuous = this._options.continuous
    this[recognitionSym].lang = this._options.lang
    this[recognitionSym].interimResults = this._options.interimResults
    this[recognitionSym].maxAlternatives = this._options.maxAlternatives

    // Bind event
    this[recognitionSym].onerror = ({ error, message }) => {
      if (error === 'no-speech') {
        return
      }
      if (error === 'aborted') {
        this.dispatchEvent(new Event('end'))
        return
      }

      this.dispatchEvent(new ErrorEvent('error', { error, message }))
    }
    this[recognitionSym].onend = () => {
      if (this.isActive) {
        this[recognitionSym].start()
      }
    }
    this[recognitionSym].onresult = this._onResult.bind(this)

    this[recognitionSym].start()
    this.dispatchEvent(new Event('start'))
  }

  /**
   * Stop the recognition
   */
  stop() {
    if (!this[activeSym]) {
      return
    }

    this[activeSym] = false
    this[recognitionSym].abort()
  }

  _onResult(event) {
    // Find last approved sentence
    let result, isFinal
    if (event.results.length > 1) {
      for (let i = event.results.length - 1; i >= 0; i--) {
        result = event.results[i]

        if (result[0].confidence >= this._options.confidence) {
          this._currentSentence.value = result[0].transcript.trim()
          isFinal = result.isFinal
          break
        }
      }
    } else {
      result = event.results[0]

      this._currentSentence.value = result[0].transcript.trim()
      isFinal = result.isFinal
    }

    // Test sentence
    if (isFinal) {
      // Skip spam sentence
      if (similarity(this._lastSentence.value, this._currentSentence.value) > this._options.sameSentenceTolerance) {
        return
      }

      this._matchCurrentSentence()
      this.dispatchEvent(new CustomEvent('sentence', { detail: this._currentSentence }))

      // Reset when is new sentence
      this._lastSentence = this._currentSentence
      this._currentSentence = { value: '', matched: false }
    }
    else {
      this._matchCurrentSentence()
    }
  }

  _matchCurrentSentence() {
    if (!this._currentSentence.matched && this._options.regex.test(this._currentSentence.value)) {
      this._currentSentence.matched = true
      this.dispatchEvent(new CustomEvent('match', { detail: this._currentSentence }))
    }
  }
}

function similarity(s1, s2) {
  var longer = s1
  var shorter = s2
  if (s1.length < s2.length) {
    longer = s2
    shorter = s1
  }
  var longerLength = longer.length
  if (longerLength == 0) {
    return 1.0
  }
  return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
}
function editDistance(s1, s2) {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  var costs = new Array()
  for (var i = 0; i <= s1.length; i++) {
    var lastValue = i
    for (var j = 0; j <= s2.length; j++) {
      if (i == 0) costs[j] = j
      else {
        if (j > 0) {
          var newValue = costs[j - 1]
          if (s1.charAt(i - 1) != s2.charAt(j - 1)) newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
          costs[j - 1] = lastValue
          lastValue = newValue
        }
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}
