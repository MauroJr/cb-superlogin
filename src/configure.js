import { getObjectRef, setObjectRef, delObjectRef } from './utils';

export default function Configure(data, defaults) {
  this.config = data || {};
  this.defaults = defaults || {};

  this.getItem = function getItem(key) {
    const result = getObjectRef(this.config, key);
    if (typeof result === 'undefined' || result === null) {
      return getObjectRef(this.defaults, key);
    }
    return result;
  };

  this.setItem = function setItem(key, value) {
    return setObjectRef(this.config, key, value);
  };

  this.removeItem = function removeItem(key) {
    return delObjectRef(this.config, key);
  };
}
