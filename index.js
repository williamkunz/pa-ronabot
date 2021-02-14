const fs = require('fs')

const cheerio = require('cheerio')
const bent = require('bent')
const puppeteer = require('puppeteer')
const Pushover = require('pushover-notifications')

const config = require('./config.json')

const { NO_VACCINES_MSG } = require('./constants')

const hasPushover = (config.pushoverAPIKey.length && config.pushoverUser.length)

const pushClient = hasPushover
  ? new Pushover({
    token: config.pushoverAPIKey,
    user: config.pushoverUser,
  })
  : null

const retryLoop = () => {
  setTimeout(() => {
    runTheLoop()
  }, config.repeatCheckTime)
}

const isThereVaccines = async (browser, page) => {
  const dom = await page.content()
  // No vaccines, run in X amount of time
  if (dom.includes(NO_VACCINES_MSG)) {
    browser.close()

    console.log(`No tests available, trying again in ${ config.repeatCheckTime } milliseconds`)

    retryLoop()

    return false
  }

  return true
}

const checkForZipError = async (browser, page) => {
  const dom = await page.content()

  const $ = cheerio.load(dom)
  const zipError = $('#ZipError')

  if (zipError.length) {
    console.log(zipError.first().value())
    console.log(`No tests available, trying again in ${ config.repeatCheckTime } milliseconds`)
    browser.close()

    retryLoop()

    return true
  }

  return false
}

const mainRuntime = async (userConfig) => {
  console.log('Opening browser')
  const browser = await puppeteer.launch({
    headless: userConfig.headless,
    product: 'chrome',
    slowMo: process.env.NODE_ENV === 'production' ? 0 : 1000,
  })

  const page = await browser.newPage()

  console.log(`Navigating to ${ userConfig.url }`)
  await page.goto(userConfig.url)

  // set default to 10 min wait time (Giant Eagle has a 10 min max)
  await page.setDefaultNavigationTimeout(600000)


  const vaccinesAvailable = await isThereVaccines(browser, page)
  if (!vaccinesAvailable) return false

  console.log('Waiting in line...')

  // await for navigation post-line
  await page.waitForNavigation()

  // again check for vaccine availability
  const isAvailable = await isThereVaccines(browser, page)
  if (!isAvailable) return false

  // Find zip field and autofill
  const $ = cheerio.load(dom)

  const zipInput = $('#zip-input')
  const submitButton = $('#btnGo')

  zipInput.val(config.zip)
  await submitButton.click()
  await page.waitForRequest()

  // check for availability within 50 miles
  const zipError = await checkForZipError(browser, page)
  if (zipError) return false

  // Alert me. You've entered your zip code and there is no #ZipError
  const screenShot = await page.screenshot()
  if (pushClient) {
    pushClient.send({
      message: 'Quick, run to your computer! You have 10 minutes to complete the appointment.',	// required
      title: 'COVID Tests may be available',
      sound: 'magic',
      priority: 1,
      file: { name: 'screen.png', data: screenShot },
    })
  }
}

const runTheLoop = () => mainRuntime(config)

runTheLoop()
