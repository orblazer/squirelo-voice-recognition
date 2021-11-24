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
const noActivityTimeoutSym = Symbol('noActivityTimeout')

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

    this[recognitionSym] = new (window.SpeechRecognition || window.webkitSpeechRecognition)()

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
    clearTimeout(this[noActivityTimeoutSym])
  }

  _onResult({results}) {
    // Avoid staying blocked if talking a lot and S2T connection lost
    clearTimeout(this[noActivityTimeoutSym])
    this[noActivityTimeoutSym] = setTimeout(() => this[recognitionSym].stop(), 2000)

    // Find transcript
    const result = results[results.length - 1]
    let transcript = result[0].transcript
    if (results.length > 1) {
      transcript = results[results.length - 2][0].transcript + transcript
    }


    const detail = {
      value: transcript,
      matched: this._options.regex.test(transcript),
      isFinal: result.isFinal
    }

    // Dispatch match event
    if (detail.matched) {
      this.dispatchEvent(new CustomEvent('match', {detail }))
    }

    // Dispatch event
    this.dispatchEvent(new CustomEvent('sentence', { detail }))
  }
}
