// Required Packages
require('dotenv').config();

const { google } = require("googleapis");
const mailComposer = require('nodemailer/lib/mail-composer');
const OAuth2 = google.auth.OAuth2;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const refreshToken = process.env.REFRESH_TOKEN;
const redirectURL = process.env.REDIRECT_URL;

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.modify",
  "https://mail.google.com/mail/feed/atom"
];

// Configure OAuth2 client
const oauth2Client = new OAuth2(clientId, clientSecret, redirectURL, SCOPES);

// Set up OAuth2 client
oauth2Client.setCredentials({
  refresh_token: refreshToken,
});

const gmail = google.gmail({ version: "v1", auth: oauth2Client });

let checkNewEmails = async () => {
    // Add is:unread to the query
    let res = await gmail.users.messages.list({ userId: "me", q: "is:unread" });
    let messages = res.data.messages;
    if (messages) {
      for (let message of messages) {
        let messageData = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
        });
  
        // Get thread data
        let threadData = await gmail.users.threads.get({
          userId: "me",
          id: messageData.data.threadId,
        });
  
        // If the message isn't the first in the thread, skip replying steps
        if (threadData.data.messages[0].id !== message.id) {
          continue;
        }
  
        let fromEmail = "";
        if (
          messageData.data &&
          messageData.data.payload &&
          messageData.data.payload.headers
        ) {
          let fromHeader = messageData.data.payload.headers.find(
            (header) => header.name === "From"
          );
          if (fromHeader) {
            fromEmail = fromHeader.value;
          }
        }
  
        let mail = new mailComposer({
          to: fromEmail,
          from: "tanishqtiwari463@gmail.com",
          subject: "subject",
          text: "I'll get back to you.",
        });
  
        mail.compile().build((err, message) => {
          if (err) {
              console.log("Error compiling email 'mime' => ", err);
              return;
          }
  
          const encodedMessage = Buffer.from(message)
              .toString('base64')
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
  
          gmail.users.messages.send({
              userId: 'me',
              requestBody: {
                  raw: encodedMessage
              }
          }, (err, result) => {
              if (err) {
                  console.log("Error sending email", err);
              }
          });
        });
  
        // Mark the message as read after replying
        await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD'],
            addLabelIds: ['STARRED']
          }
        });
      }
    }
  };

function executeRandomInterval() {
    // Generate a random delay between 45 and 120 seconds (multiply by 1000 to convert to ms)
    const delay = Math.floor(Math.random() * ((120 - 45) + 1) + 45) * 1000;
  
    // CheckNewEmails function as above...
  
    // Call checkNewEmails function
    checkNewEmails()
      .then(() => {
        // Call the function again after the random delay
        setTimeout(executeRandomInterval, delay);
      })
      .catch((err) => {
        console.error('Error during checking new emails: ', err);
        // In case of error, also call the function again after the delay
        setTimeout(executeRandomInterval, delay);
      });
}

console.log('code working....')  

// Initial call to start the checking emails loop
executeRandomInterval();
