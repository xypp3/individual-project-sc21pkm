# npm dash.js


## TODO:
- [x] [Checkout relevant example](https://github.com/Dash-Industry-Forum/dash.js/blob/e2e45217b41b1612d8df7802d3cfda97fdb63651/src/streaming/rules/abr/ThroughputRule.js#L36)
- [x] Export data from js client
- [x] Figure out buffer length settings
- [ ] Figure out startup time
- [ ] Aggregate data using python
- [ ] Write simple BBA
- [ ] Puppeteer the client side bandwidth limits
- [ ] Write my ABR function
- [ ] Split video using HAS
- [ ] Simple http server to server video


### Extras
- [ ] Puppeteer autonomously spin up and run instances
- [ ] Docker the whole testbed to allow reproduceability


## dash.js big bug
So for some reason I could not get the custom ABR rules working. Some magical reason the getSwitchRequest() function was not being called. Turns out that once built (I built it from source and it still did this) the getSwitchRequest() gets find and replaced with getMaxIndex() *(this includes comments and things)*. I don't know why but I'll search the GitHub issues if someone has already reported it or post the issue. At least so that they fix their docs so that others don't have to spend hours debugging library code.

## Project startup
