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

const isThereVaccines = async (browser, page) => {
  const dom = await page.content()
  // No vaccines, run in X amount of time
  if (dom.includes(NO_VACCINES_MSG)) {
    browser.close()

    console.log(`No tests available, trying again in ${ config.repeatCheckTime } milliseconds`)

    setTimeout(() => {
      runTheLoop()
    }, config.repeatCheckTime)
    return false
  }

  return true
}

const mainRuntime = async (userConfig) => {
  console.log('Opening browser')
  const browser = await puppeteer.launch({
    defaultViewport: {
      height: 1920,
      width: 1080,
    },
    headless: userConfig.headless,
    product: 'chrome',
  })

  const page = await browser.newPage()

  console.log(`Navigating to ${ userConfig.url }`)
  await page.goto(userConfig.url)

  // set default to 10 min wait time (Giant Eagle has a 10 min max)
  await page.setDefaultNavigationTimeout(600000)


  const vaccinesAvailable = await isThereVaccines(browser, page)
  if (!vaccinesAvailable) return false

  // NOTE | Have yet to see page load with actual appointments
  // so alert me so I know when it's ready.

  console.log('Waiting in line...')

  // await for navigation post-line
  await page.waitForNavigation()

  // again check for vaccine availability
  const isAvailable = await isThereVaccines(browser, page)
  if (!isAvailable) return false

  const screenShot = await page.screenshot()

  if (pushClient) {
    pushClient.send({
      message: 'take a look',	// required
      title: 'COVID Tests may be available',
      sound: 'magic',
      priority: 1,
      file: { name: 'screen.png', data: screenShot },
    })
  }
  // const $ = cheerio.load(dom)
}

const runTheLoop = () => mainRuntime(config)

runTheLoop()
