import * as crypto from 'crypto';

import URLSafeBase64 from 'urlsafe-base64';
import uuid from 'uuid';
import pwd from 'couch-pwd';


export function URLSafeUUID() {
  return URLSafeBase64.encode(uuid.v4(null, new Buffer(16)));
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function hashPassword(password) {
  return new Promise((resolve, reject) => {
    pwd.hash(password, (err, salt, hash) => {
      if (err) {
        return reject(err);
      }
      return resolve({
        salt,
        derived_key: hash
      });
    });
  });
}

export function verifyPassword(hashObj, password) {
  const iterations = hashObj.iterations;
  const salt = hashObj.salt;
  const derivedKey = hashObj.derived_key;

  if (iterations) {
    pwd.iterations(iterations);
  }

  return new Promise((resolve, reject) => {
    if (!salt || !derivedKey) {
      return reject(false);
    }

    pwd.hash(password, salt, (err, hash) => {
      if (hash === derivedKey) {
        return resolve(true);
      }

      return reject(false);
    });
  });
}

export function getDBURL(db) {
  if (db.user) {
    return `${db.protocol}${encodeURIComponent(db.user)}:${encodeURIComponent(db.password)}@${db.host}`;
  }

  return db.protocol + db.host;
}

export function getFullDBURL(dbConfig, dbName) {
  return getDBURL(dbConfig) + '/' + dbName;
}

export function toArray(obj) {
  if (!(obj instanceof Array)) {
    return [obj];
  }
  return obj;
}

export function getSessions(userDoc) {
  const sessions = [];

  if (userDoc.session) {
    Object.keys(userDoc.session).forEach((mySession) => {
      sessions.push(mySession);
    });
  }

  return sessions;
}

export function getExpiredSessions(userDoc, now) {
  const sessions = [];

  if (userDoc.session) {
    Object.keys(userDoc.session).forEach((mySession) => {
      if (userDoc.session[mySession].expires <= now) {
        sessions.push(mySession);
      }
    });
  }

  return sessions;
}

// Takes a req object and returns the bearer token, or undefined if it is not found
export function getSessionToken(req) {
  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');

    if (parts.length === 2) {
      const scheme = parts[0];
      const credentials = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        const parse = credentials.split(':');

        if (parse.length < 2) {
          return;
        }

        return parse[0];
      }
    }
  }
}

// Generates views for each registered provider in the user design doc
export function addProvidersToDesignDoc(config, ddoc) {
  const providers = config.getItem('providers');

  if (!providers) {
    return ddoc;
  }

  const ddocTemplate =
    'function(doc) {\n' +
    '  if(doc.%PROVIDER% && doc.%PROVIDER%.profile) {\n' +
    '    emit(doc.%PROVIDER%.profile.id, null);\n' +
    '  }\n' +
    '}';

  Object.keys(providers).forEach((provider) => {
    ddoc.auth.views[provider] = ddocTemplate.replace(new RegExp('%PROVIDER%', 'g'), provider);
  });

  return ddoc;
}

// Capitalizes the first letter of a string
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Access nested JavaScript objects with string key
 * http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
 *
 * @param {Object} obj The base object you want to get a reference to
 * @param {string} str The string addressing the part of the object you want
 * @return {Object|undefined} a reference to the requested key or undefined if not found
 */

export function getObjectRef(obj, str) {
  let _str = str.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties

  _str = _str.replace(/^\./, ''); // strip a leading dot
  const pList = _str.split('.');

  while (pList.length) {
    const n = pList.shift();

    if (n in obj) {
      return obj[n];
    }

    return;
  }
}

/**
 * Dynamically set property of nested object
 * http://stackoverflow.com/questions/18936915/dynamically-set-property-of-nested-object
 *
 * @param {Object} obj The base object you want to set the property in
 * @param {string} str The string addressing the part of the object you want
 * @param {*} val The value you want to set the property to
 * @return {*} the value the reference was set to
 */

export function setObjectRef(obj, str, val) {
  let _str = str.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  _str = _str.replace(/^\./, ''); // strip a leading dot
  const pList = _str.split('.');

  pList.forEach((item) => {
    if (!obj[item]) {
      obj[item] = {};
    }
    obj = obj[item];
  });

  obj[pList[pList.length - 1]] = val;
  return val;
}

/**
 * Dynamically delete property of nested object
 *
 * @param {Object} obj The base object you want to set the property in
 * @param {string} str The string addressing the part of the object you want
 * @return {boolean} true if successful
 */

export function delObjectRef(obj, str) {
  str = str.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  str = str.replace(/^\./, ''); // strip a leading dot
  const pList = str.split('.');
  const len = pList.length;

  for (let i = 0; i < len - 1; i += 1) {
    const elem = pList[i];
    if (!obj[elem]) {
      return false;
    }
    obj = obj[elem];
  }

  delete obj[pList[len - 1]];
  return true;
}

/**
 * Concatenates two arrays and removes duplicate elements
 *
 * @param {array} a First array
 * @param {array} b Second array
 * @return {array} resulting array
 */

export function arrayUnion(a, b) {
  const append = [];

  b.forEach((item) => {
    if (!a.includes(item)) {
      append.push(item);
    }
  });

  return a.concat(append);
}
