import { Readable } from 'stream';
import Registry from './registry';
import Follow from 'follow';


export const States = {
  FRESH: 'FRESH',
  FOLLOWING: 'FOLLOWING',
  PAUSED: 'PAUSED'
};

export let defaults = {
  db: 'https://skimdb.npmjs.com/registry/',
  inactivity_ms: 1000 * 60 * 60
};

export default class FollowStream extends Readable {
  constructor(config) {
    super({ objectMode: true });
    const { FRESH } = States;

    this._state = FRESH;
    this._processing = false;

    this.opts = {...defaults, ...config};
    this._registry = Registry(this.opts.db);
    this._feed = new Follow.Feed(this.opts);
    this._feed.on('error', err => this.emit('error', err));
  }

  _read() {
    const { FRESH, PAUSED } = States;
    switch (this._state) {
    case FRESH:
      this._feed.on('change', change => {
        this._pause();
        this.process(change, change => {
          let ready = true;
          if (change) { ready = this.push(change); }
          if (ready) { this._resume(); }
        });
      });
      this._follow();
      break;
    case PAUSED:
      if (!this._processing) { this._resume(); }
      break;
    default:
      console.error(`unhandled state: ${this._state}`);
    }
  }
  
  _follow() {
    const { FOLLOWING } = States;
    this._state = FOLLOWING;
    this._feed.follow();
  }

  _pause() {
    const { PAUSED } = States;
    this._state = PAUSED;
    this._feed.pause();
  }

  _resume() {
    const { FOLLOWING } = States;
    this._state = FOLLOWING;
    this._feed.resume();
  }

  process(change, cb) {
    this._feed.pause();
    this._processing = true;
    this._registry.get(change.id, (err, doc) => {
      this._processing = false;
      if (err) {
        console.error(`unable to process seq #${change.seq} [${change.id}]`);
        this._feed.resume();
        return cb(null);
      }
      cb(doc);
    });
  }
}
