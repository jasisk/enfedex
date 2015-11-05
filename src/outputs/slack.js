import QS from 'querystring';
import Wreck from 'wreck';

const API_ROOT = 'https://slack.com/api/';

export default class SlackClient {
  constructor(token) {
    this.token = token;
  }

  _callApi(method, params, cb) {
    params = {token: this.token, ...params};
    Wreck.post(API_ROOT + method, {
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      payload: QS.stringify(params)
    }, (err, res, payload) => {
      if (err) { return cb(err); }
      cb(null, payload);
    });
  }

  send(params, cb) {
    params = { channel: '#general', ...params };
    this._callApi('chat.postMessage', params, cb);
  }
}

export function makeTitle(chunk) {
  return `${chunk.name} v${chunk.version} published by ${chunk.author.name}`;
}

export function formatAttachment(chunk) {
  const meta = {
    color: chunk.new ? '#00a856' : '#00dae6',
    author_name: chunk.author.name,
    author_link: `mailto:${chunk.author.email}`,
    title: `${chunk.name} v${chunk.version}`,
    title_link: chunk.changesUrl || chunk.repoUrl,
    text: chunk.description,
    fallback: makeTitle(chunk),
    fields: [
      {
        title: 'dist-tags:',
        value: chunk['dist-tags'].map(tag => `• ${tag}`).join('\n'),
        short: true
      },
      {
        title: 'new or updated:',
        value: chunk.new ? 'new :tada:' : 'updated :sparkles:',
        short: true
      }
    ]
  };

  if (chunk.repoUrl) {
    meta.fields.unshift({
      title: 'repo:',
      value: chunk.repoUrl,
      short: false
    });
  }

  return JSON.stringify([meta]);
}
