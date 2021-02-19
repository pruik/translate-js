function each(storage, callback) {
  for (const key in storage) {
    storage.hasOwnProperty(key) && callback(key, storage[key]);
  }
}

function createRegistry() {
  let registry = {};
  let currentLocale = 'en';
  let interpolateRE = /{{\s*(\w+)\s*}}/g;
  const pluralizationRules = {
    en: {
      pluralizeTo: 'count',
      getVariationIndex(count) {
        return count === 1 ? 0 : 1;
      },
    },
  };

  function translate(key, templateData, options) {
    options = options || {};

    const locale = options.locale || currentLocale;
    const store = options.registry || registry;
    const translation = store[locale] && store[locale][key];

    if (typeof translation === 'undefined') {
      return translate.whenUndefined(key, locale);
    }
    if (Array.isArray(translation)) {
      return translatePlural(
        key,
        translation,
        templateData,
        locale,
        options.pluralizeTo
      );
    }
    return interpolate(translation, templateData);
  }

  function translatePlural(key, variations, data, locale, pluralizeTo) {
    const rule = pluralizationRules[locale];
    const dataKeys = Object.keys(data);
    const pluralizeKey =
      dataKeys.length === 1 ? dataKeys[0] : pluralizeTo || rule.pluralizeTo;
    const count = parseFloat(data[pluralizeKey]);

    if (isNaN(count)) {
      throw new Error(
        `Tranlation pluralization missing parameters on key "${key}"`
      );
    } else {
      return interpolate(variations[rule.getVariationIndex(count)], data);
    }
  }

  function interpolate(translationString, data) {
    return data
      ? translationString.replace(interpolateRE, (match, param) =>
          data.hasOwnProperty(param) ? data[param] : match
        )
      : translationString;
  }

  translate.add = function (items, locale, prefix) {
    locale = locale || currentLocale;
    registry[locale] = registry[locale] || {};

    each(items, (key, value) => {
      const registryKey = prefix ? `${prefix}.${key}` : key;
      const valueType = typeof value;

      if (
        Array.isArray(value) ||
        valueType === 'string' ||
        valueType === 'number'
      ) {
        registry[locale][registryKey] = value;
      } else {
        translate.add(value, locale, registryKey);
      }
    });

    return this;
  };

  translate.setLocale = function (locale) {
    currentLocale = locale;
    return this;
  };

  translate.getLocale = function () {
    return currentLocale;
  };

  translate.interpolateWith = function (userRE) {
    interpolateRE = userRE;
    return this;
  };

  translate.setPluralizationRule = function (locale, rule, options) {
    pluralizationRules[locale] = {
      pluralizeTo: (options && options.pluralizeTo) || 'count',
      getVariationIndex: rule,
    };
    return this;
  };

  translate.whenUndefined = function (key, locale) {
    return key;
  };

  translate.clear = function () {
    registry = {};
    return this;
  };

  translate.createRegistry = function () {
    return createRegistry();
  };

  return translate;
}

export default createRegistry();
