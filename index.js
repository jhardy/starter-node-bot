var Botkit = require('botkit');
var request = require('request');
var Promise = require("promise");

var weatherIconLookup = require('./lib/weatherbot');


// Expect a SLACK_TOKEN environment variable
var slackToken = process.env.SLACK_TOKEN
if (!slackToken) {
  console.error('SLACK_TOKEN is required!')
  process.exit(1)
}

var controller = Botkit.slackbot()
var bot = controller.spawn({
  token: slackToken
})

bot.startRTM(function (err, bot, payload) {
  if (err) {
    throw new Error('Could not connect to Slack')
  }
})

controller.on('bot_channel_join', function (bot, message) {
  bot.reply(message, "I'm here!")
})

controller.hears(['hello', 'hi'], ['direct_mention'], function (bot, message) {
  bot.reply(message, 'Hello.')
})

controller.hears(['hello', 'hi'], ['direct_message'], function (bot, message) {
  bot.reply(message, 'Hello.')
  bot.reply(message, 'It\'s nice to talk to you directly.')
})

controller.hears('.*', ['mention'], function (bot, message) {
  bot.reply(message, 'You really do care about me. :heart:')
})

controller.hears('help', ['direct_message', 'direct_mention'], function (bot, message) {
  var help = 'I will respond to the following messages: \n' +
      '`bot hi` for a simple message.\n' +
      '`bot attachment` to see a Slack attachment message.\n' +
      '`@<your bot\'s name>` to demonstrate detecting a mention.\n' +
      '`bot help` to see this again.'
  bot.reply(message, help)
})

controller.hears(['attachment'], ['direct_message', 'direct_mention'], function (bot, message) {
  var text = 'Beep Beep Boop is a ridiculously simple hosting platform for your Slackbots.'
  var attachments = [{
    fallback: text,
    pretext: 'We bring bots to life. :sunglasses: :thumbsup:',
    title: 'Host, deploy and share your bot in seconds.',
    image_url: 'https://storage.googleapis.com/beepboophq/_assets/bot-1.22f6fb.png',
    title_link: 'https://beepboophq.com/',
    text: text,
    color: '#7CD197'
  }]

  bot.reply(message, {
    attachments: attachments
  }, function (err, resp) {
    console.log(err, resp)
  })
});

controller.hears(['weather (.*)'], 'direct_message,direct_mention,mention', function(bot, message){

  var apiKey = "&appid=" + process.env.WEATHER_KEY;
  var units = "&units=imperial"
  var baseURL = 'http://api.openweathermap.org/data/2.5/weather';

  var matchedText =  message.match[1];
  var paramter = isNaN(matchedText) ? '?q=' + matchedText : '?zip=' + matchedText + ',us';
  var requestURL = baseURL + paramter + apiKey + units;

  console.log("Icon test: ", weatherIconLookup(100))
  requestp(requestURL, true).then(function(data) {
      console.log(data);
      var icon = weatherIconLookup(data.weather[0].id);
      console.log(data.weather[0].id, icon)
      var temp = data.main.temp;

      bot.reply(message, {
        text: "Current temperature in *" + data.name + "* is *" + temp + "º F* with a condition of *" + data.weather[0].description + "*",
        username: "WeatherBot",
        icon_emoji: icon
      })

  },  function (err) {
        console.log(err);
  })


});

function requestp(url, json) {
    json = json || false;
    return new Promise(function (resolve, reject) {
        request({url:url, json:json}, function (err, res, body) {
            if (err) {
                return reject(err);
            } else if (res.statusCode !== 200) {
                err = new Error("Unexpected status code: " + res.statusCode);
                err.res = res;
                return reject(err);
            }
            resolve(body);
        });
    });
}


controller.hears('.*', ['direct_message', 'direct_mention'], function (bot, message) {
  bot.reply(message, 'Sorry <@' + message.user + '>, I don\'t understand. \n')
});
