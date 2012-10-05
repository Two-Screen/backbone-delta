//! backbone-delta.js 0.1.2, https://github.com/Two-Screen/backbone-delta
//! © 2012 Stéphan Kochen, Angry Bytes. MIT licensed.

(function() {

// Look for Underscore.js.
var _, BBDelta;
if (typeof(require) !== 'undefined') {
    _ = require('underscore');
    BBDelta = exports;
}
else {
    _ = window._;
    BBDelta = window.BBDelta = {};
}

// We need an instance of Backbone.js to work with.
// This creates our functions for a given instance.
BBDelta.curry = function(Backbone) {
    var Model = Backbone.Model;
    var Collection = Backbone.Collection;

    // Reset the model's attributes.
    //
    // This is similar to set, but will also unset attribtues not in `attrs`.
    var resetModel = function(model, attrs, options) {
        var now = model.attributes, unset = {}, attr;
        options || (options = {});
        if (!attrs) return model;
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
        if (!model.set(attrs, options)) return false;
        for (attr in unset) {
            delete now[attr];
        }

        return model;
    };

    // Variant of `Model#fetch` that adds the `reset` option.
    var fetchModel = function(model, options) {
        options = options ? _.clone(options) : {};

        var success = options.success;
        options.success = function(resp, status, xhr) {
            var method = options.reset ? 'reset' : 'set';
            if (!model[method](model.parse(resp, xhr), options)) return false;
            if (success) success(model, resp);
        };
        options.error = Backbone.wrapError(options.error, model, options);

        var sync = model.sync || Backbone.sync;
        return sync.call(model, 'read', model, options);
    };

    // Reset the collection, applying small changes without a `reset` event.
    //
    // Models are regarded the same if their IDs match, in which case, its
    // attributes will be reset. Other models will be added or removed.
    //
    // If no matching models are found at all, this does a normal reset.
    var collectionDelta = function(collection, models, options) {
        var haveId = {}, matching = [], added = [], removed, model;
        options || (options = {});
        models = _.isArray(models) ? models.slice() : [models];

        // Validate the new models, and look for matching existing models.
        for (i = 0, length = models.length; i < length; i++) {
            model = models[i] = collection._prepareModel(models[i], options);
            if (!model) {
                throw new Error("Can't add an invalid model to a collection");
            }
            haveId[model.id] = true;
            (collection.get(model.id) ? matching : added).push(model);
        }

        // Short-circuit to normal reset, if possible.
        if (matching.length === 0) {
            return collection.reset(models, options);
        }

        // Determine which models are to be removed.
        removed = collection.select(function(model) {
            return !haveId[model.id];
        });

        // Apply changes.
        collection.remove(removed, options);
        _.each(matching, function(model) {
            collection.get(model).reset(model, options);
        });
        collection.add(added, options);

        return collection;
    };

    // Variant of `Collection#fetch` that adds the `delta` option.
    var fetchCollection = function(collection, options) {
        options = options ? _.clone(options) : {};
        if (options.parse === undefined) options.parse = true;

        var success = options.success;
        options.success = function(resp, status, xhr) {
            var method = 'reset';
            options.delta && (method = 'delta');
            options.add && (method = 'add');
            collection[method](collection.parse(resp, xhr), options);
            if (success) success(collection, resp);
        };
        options.error = Backbone.wrapError(options.error, collection, options);

        var sync = collection.sync || Backbone.sync;
        return sync.call(collection, 'read', collection, options);
    };

    return {
        resetModel: resetModel,
        fetchModel: fetchModel,
        collectionDelta: collectionDelta,
        fetchCollection: fetchCollection
    };
};

// Extend an instance of Backbone.js.
BBDelta.extend = function(Backbone) {
    var methods = BBDelta.curry(Backbone);

    var ModelProto = Backbone.Model.prototype;
    ModelProto.reset = function(attrs, options) {
        return methods.resetModel(this, attrs, options);
    };
    ModelProto.fetch = function(options) {
        return methods.fetchModel(this, options);
    };

    var CollectionProto = Backbone.Collection.prototype;
    CollectionProto.delta = function(models, options) {
        return methods.collectionDelta(this, models, options);
    };
    CollectionProto.fetch = function(options) {
        return methods.fetchCollection(this, options);
    };
};

// In the browser, automatically extend Backbone.js.
if (typeof(window) !== 'undefined' && window.Backbone) {
    BBDelta.extend(window.Backbone);
}

})();
