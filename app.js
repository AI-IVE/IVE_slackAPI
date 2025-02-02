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
app.message('', async ({ message, client, say }) => {
  // say() sends a message to the channel where the event was triggered

  $.ajax({
    url: 'http://127.0.0.1:5000/translate',
    method: 'POST',
    data: JSON.stringify({
      text: message.text,
      model: 'claude'
    }),
    contentType: 'application/json',
    success: async function(response) {
      const resText = response.translation;
      let resLang = `:${response.return_lang}:`;
      let orgLang = ':kr:';
      if(response.return_lang == 'ko') {
        resLang = ':kr:';
        orgLang = ':jp:';
      }

      let textBlocks = [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${message.text}`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${orgLang} :arrow_right: ${resLang}`
          }
        },
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": `${resText}`
          }
        },
        {
          "type": "section",
          "block_id": "replay-block",
          "text": {
            "type": "mrkdwn",
            "text": "> _This message was translated by_ *InswaVE* _BOT._"
          }
          // "accessory": {
          //   "type": "button",
          //   "text": {
          //     "type": "plain_text",
          //     "text": "RE-Translation"
          //   },
          //   "value": "click_me_123",
          //   "action_id": "re-translate"
          // }
        },
        {
          "type": "divider"
        }
      ];

      // await client.chat.update({token:process.env.SLACK_USER_TOKEN, channel: message.channel, ts: message.ts, text: resText});
      await client.chat.update({token:process.env.SLACK_USER_TOKEN, channel: message.channel, ts: message.ts, text: resText, blocks: textBlocks});
    },
    error: async function(error) {
      console.error(error);
      await client.chat.update({token:process.env.SLACK_USER_TOKEN, channel: message.channel, ts: message.ts, text: message.text});

    }
  });
  
});

app.action('re-translate', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();
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