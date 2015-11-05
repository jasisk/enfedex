import Slack, { formatAttachment, makeTitle } from './outputs/slack';
import FollowStream from './couch/follow';
import { Transform } from 'stream';
import After from 'after';

const TOKEN = process.env.SLACK_TOKEN;
const log = new Transform({ objectMode: true });

let slack;

if (TOKEN) {
  slack = new Slack(TOKEN);
} else {
  console.log('SLACK_TOKEN missing - only logging to console.');
}

log._transform = function (chunk, _, cb) {
  let after = After(1, cb);

  if (slack) {
    after = After(2, cb);

    slack.send({
      channel: '#npm-paypal',
      username: 'pubbot',
      attachments: formatAttachment(chunk),
      icon_emoji: ':robot_face:'
    }, (err, res) => {
      if (err) { // this is kinda weak but I'm lazy
        console.error(err.toString('utf8'));
      } else {
        res = JSON.parse(res.toString('utf8'));
        if (!(res.ok)) { console.dir(res); }
      }
      after();
    });
  }

  console.log(makeTitle(chunk));
  after();
};

const follower = new FollowStream({
  db: 'http://10.24.104.114:5984/registry/',
  since: 'now'
});

follower.pipe(log);
