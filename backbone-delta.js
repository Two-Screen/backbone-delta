//! backbone-delta.js 0.3.1, https://github.com/Two-Screen/backbone-delta
//! © 2012 Stéphan Kochen, Angry Bytes. MIT licensed.

(function() {

// Look for Underscore.js.
var _;
if (typeof(require) !== 'undefined') {
    _ = require('underscore');
}
else {
    _ = window._;
}

// Extend a Backbone.js instance. The option `noPatch` will prevent
// monkey-patching, and only add methods.
var extend = function(Backbone, options) {
    options || (options = {});

    var Model = Backbone.Model;
    var ModelProto = Model.prototype;
    var Collection = Backbone.Collection;
    var CollectionProto = Collection.prototype;

    // Reset the model's attributes.
    //
    // This is similar to set, but will also unset attributes not in `attrs`.
    ModelProto.reset = function(attrs, options) {
        var now = this.attributes, unset = {}, attr;
        options || (options = {});
        if (!attrs) return this;
        if (attrs instanceof Model) attrs = attrs.attributes;
        attrs = _.clone(attrs);

        // Collect attributes to unset.
        for (attr in now) {
            if (!_.has(attrs, attr)) {
                attrs[attr] = void 0;
                unset[attr] = true;
            }
        }

        // Apply changes.
        if (!this.set(attrs, options)) return false;
        for (attr in unset) {
            delete now[attr];
        }

        return this;
    };

    // Variant of `Model#fetch` that uses `Model#reset`.
    ModelProto.fetchReset = function(options) {
        options = options ? _.clone(options) : {};
        if (options.parse === void 0) options.parse = true;
        var success = options.success;
        options.success = function(model, resp, options) {
            var parsed = model.parse(resp, options);
            if (!model.reset(parsed, options)) return false;
            if (success) success(model, resp);
        };
        return this.sync('read', this, options);
    };

    // Reset the collection, applying small changes without a `reset` event.
    //
    // Models are regarded the same if their IDs match, in which case, the
    // attributes will be reset. Other models will be added or removed.
    //
    // If no matching models are found at all, this does a normal reset.
    CollectionProto.delta = function(models, options) {
        var haveId = {}, matching = [], added = [], removed, model;
        options || (options = {});
        models = _.isArray(models) ? models.slice() : [models];

        // Validate the new models, and look for matching existing models.
        for (i = 0, length = models.length; i < length; i++) {
            model = models[i] = this._prepareModel(models[i], options);
            if (!model) {
                throw new Error("Can't add an invalid model to a collection");
            }
            haveId[model.id] = true;
            (this.get(model.id) ? matching : added).push(model);
        }

        // Short-circuit to normal reset, if possible.
        if (matching.length === 0) {
            return this.reset(models, options);
        }

        // Determine which models are to be removed.
        removed = this.select(function(model) {
            return !haveId[model.id];
        });

        // Apply changes.
        this.remove(removed, options);
        _.each(matching, function(model) {
            this.get(model).reset(model, options);
        }, this);
        this.add(added, options);

        return this;
    };

    // Variant of `Collection#fetch` that uses `Collection#delta`.
    CollectionProto.fetchDelta = function(options) {
        options = options ? _.clone(options) : {};
        if (options.parse === void 0) options.parse = true;
        var success = options.success;
        options.success = function(collection, resp, options) {
            var parsed = collection.parse(resp, options);
            collection.delta(parsed, options);
            if (success) success(collection, resp, options);
        };
        return this.sync('read', this, options);
    };

    // Patch `fetch` methods to add options.
    if (!options.noPatch) {
        var origModelFetch = ModelProto.fetch;
        ModelProto.fetch = function(options) {
            if (options && options.reset) {
                return this.fetchReset(options);
            }
            else {
                return origModelFetch.call(this, options);
            }
        };

        var origCollectionFetch = CollectionProto.fetch;
        CollectionProto.fetch = function(options) {
            if (options && options.delta) {
                return this.fetchDelta(options);
            }
            else {
                return origCollectionFetch.call(this, options);
            }
        };
    }

    return Backbone;
};

// Inherit from Backbone.js and create subclasses of Model and Collection.
var inherit = function(Backbone, options) {
    var ctor = function() {};
    ctor.prototype = Backbone;
    var sub = new ctor();

    sub.Model = Backbone.Model.extend();
    sub.Collection = Backbone.Collection.extend({ model: sub.Model });

    return extend(sub, options);
};

// Export.
var BBDelta;
if (typeof(require) !== 'undefined') {
    BBDelta = inherit(require('backbone'));
    module.exports = BBDelta;
}
else {
    BBDelta = inherit(window.Backbone);
    window.BBDelta = BBDelta;
}
BBDelta.extend = extend;
BBDelta.inherit = inherit;

})();
