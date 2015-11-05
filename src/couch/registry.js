import Semver from 'semver';
import Wreck from 'wreck';
import Url from 'url';

export default url => ({
  get(id, cb) {
    Wreck.get(
      url + id,
      {json: 'force'},
      (err, _, payload) => cb(err, munge(payload))
    );
  }
});

function munge(doc) {
  let previousDoc;
  let modifiedDoc;

  const meta = {};
  const {
    name,
    time: { created, modified, ...time },
    versions,
    homepage,
    repository = {},
      description,
    maintainers,
    'dist-tags': distTags
  } = doc;

  let modifiedVersion;
  Object.keys(time).forEach(version => {
    if (time[version] === modified) { modifiedVersion = version; }
  });

  if (!(modifiedVersion)) {
    return undefined;
  }


  modifiedDoc = versions[modifiedVersion];

  if (homepage) { meta.homepage = homepage; }

  meta['dist-tags'] = Object.keys(distTags).filter(tag => distTags[tag] === modifiedVersion);
  meta.repoUrl = repository2http(repository);
  meta.author = modifiedDoc._npmUser;
  meta.time = time[modifiedVersion];
  meta.new = modified === created;
  meta.version = modifiedVersion;

  if (meta.repoUrl) {
    meta.changesUrl = meta.repoUrl;

    if (previousDoc = getPreviousDoc(modifiedVersion, versions)) {
      meta.changesUrl += `/compare/${previousDoc.gitHead}...${modifiedDoc.gitHead}`;
    }	 else {
      meta.changesUrl += `/commit/${modifiedDoc.gitHead}`;
    }
  }

  Object.assign(meta, { name, description, maintainers });

  return meta;
}

// thanks, erik!
function repository2http({ type = '', url = '' }) {
  if (type !== 'git' || !(url.includes('github'))) {
    return undefined;
  }

  // Try parsing the URL, if that fails one symptom is
  // a missing protocol. If the protocol is missing,
  // prepend one and try again. That way we don't have to
  // try to write url parsing rules here, we just test
  // for what we need.
  let parsed = Url.parse(url);
  if (!parsed.protocol && !parsed.hostname) {
    // If there's no protocol, we assume the parse failed. Will
    // happen, for example, on git@github.com:org/repository.git.
    parsed = Url.parse('https://' + url);
    if (!parsed.protocol && !parsed.hostname) {
      // Adding a protocol didn't help, so not a valid uri for our needs.
      return undefined;
    }
  }

  // Git paths like github.com:org/repo produce the pathname
  // '/:org/repo', so the colon needs to be removed. Also,
  // remove the optional `.git` extension.
  parsed.pathname = parsed.pathname.replace(/^\/\:/, '/').replace(/\.git$/, '');
  parsed.protocol = 'https:';
  parsed.slashes = true;
  parsed.auth = null;
  parsed.host = null;
  parsed.path = null;
  parsed.search = null;
  parsed.hash = null;
  parsed.query = null;
  return Url.format(parsed);
}

function getPreviousDoc(current, versions) {
  if (!(current in versions)) {
    return undefined;
  }

  const keys = Object.keys(versions).sort(Semver.compare);
  const previous = keys[keys.indexOf(current) - 1];

  if (previous) {
    return versions[previous];
  }
}
