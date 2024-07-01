const { App } = require('@slack/bolt');
const {JSDOM} = require('jsdom');
const {window} = new JSDOM();
const {document} = new JSDOM('').window;
global.document = document;

const $ = require('jquery')(window);

require('dotenv').config();


// Initializes your app with your bot token and signing secret
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false, // add this
  appToken: process.env.SLACK_APP_TOKEN, // add this
  port: process.env.PORT || 3000
});


// Listens to incoming messages that contain "hello"
app.message('', async ({ message, say }) => {
  // say() sends a message to the channel where the event was triggered
  console.log(message);

  $.ajax({
    url: 'http://127.0.0.1:5000/translate',
    method: 'POST',
    data: JSON.stringify({
      text: message.text,
      model: 'gpt4'
    }),
    contentType: 'application/json',
    success: async function(response) {
      console.log(response);
      let resText = response.translation;

      await say({
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              // "text": `Hey there <@${message.user}>!`
              "text": `${resText}`
            },
            "accessory": {
              "type": "button",
              "text": {
                "type": "plain_text",
                "text": "Click Me"
              },
              "action_id": "button_click"
            }
          }
        ],
        text: `Hey there <@${message.user}>!`
      });
      // Do something with the translated text
    },
    error: function(error) {
      console.error(error);
    }
  });
  // console.log(resText);
  
  
  
  
});

app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
  console.log(body);
  // await fetch('http://127.0.0.1:5000/translate', {
  //   'body': {
  //     "text":"안녕하세요.등록하신 메일 주소로 개발 라이선스 전달드렸습니다.확인 부탁드립니다.감사합니다. ",
  //     "model" :"claude"
  //   }
  // });
  await say(`<@${body.user.id}> clicked the button`);
});

app.event('app_home_opened', async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Welcome to your _App's Home tab_* :tada:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "This button won't do much for now but you can set up a listener for it using the `actions()` method and passing its unique `action_id`. See an example in the `examples` folder within your Bolt app."
            }
          },
          {
            "type": "actions",
            "elements": [
              {
                "type": "button",
                "text": {
                  "type": "plain_text",
                  "text": "Click me!"
                }
              }
            ]
          }
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});



(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();