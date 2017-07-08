# IXIT_AUTOMATION_SPIDER_SERVER (IASS)

In the name of automation, I needed a webcrawler that looked through specific sites for Music and Video downloadables
and posted links found to my apps MongoDB database. This project has also been done in using [Scrapy](https://github.com/k0d3d/ixitscrapy) in Python. I also use awesome [Kue](https://www.npmjs.com/package/kue) for scheduling crawling / spider jobs.
This helps with CPU and Memory management when running multiple spiders concurrently.

## My Use Cases
- Scraping structured data from webpages in custom useragents.
- Listening to feeds and Webhooks for new / updated data to initiate scraping.
- Downloading media files and extracting metadata which can be saved on a DB.
- Using CURL to schedule batch crawls.

## Getting Started

To start scraping structured data from the web using IASS, you will need to have REDIS running somewhere, locally or remotely. 
Remember to set these environment variable

export APP_SECRET="UeISAdQDIW:Lcsa2-=22mcn4ksIO30dWPW*@ndsa1238321-1384MCgMMEe9bYNNIbhLMTDu6"
export ELASTICSEARCH_URL="http://xxxxxx
export MONGO_URL="mongodb://xxxxx
export NODE_ENV="production"
export REDIS_URL="redis://xxxxx"
export VAULT_RESOURCE="https://xxxx"
export IWAC_RESOURCE="https://xxxxxx"
export DEBUG="isas"  // optional


### Prerequisites

- NodeJs 6.x +
- Redis
- MongoDB (optional)


### Installing


```bash
$ git clone git@github.com:k0d3d/iass.git

```

```bash
$ cd iass
```

```bash
$ npm install
```

### Running Spiders using IASS

Check ./def for working examples you can modify for your needs.
```bash
$ index.js --mode=crawl --jobName=tooexclusive
```

--jobName this should correspond with the definitions file store in ./def .
eg. `--jobName=linda` -> ./def/linda.json


## Built With

* [Scrapy](http://www.dropwizard.io/1.0.2/docs/) 

## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.


## Authors

* **Michael Rhema** - [aka Koded](https://github.com/k0d3d) , [Twitter](@pinkybrayne)


## License

This project is licensed under the BSD License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc
