//! backbone-delta.js 0.1.0, https://github.com/Two-Screen/backbone-delta
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

// We need an instance of Backbone.js to do instanceof checks.
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

    return {
        resetModel: resetModel,
        collectionDelta: collectionDelta
    };
};

// Extend an instance of Backbone.js.
BBDelta.extend = function(Backbone) {
    var methods = BBDelta.curry(Backbone);

    Backbone.Model.prototype.reset = function(attrs, options) {
        methods.resetModel(this, attrs, options);
    };

    Backbone.Collection.prototype.delta = function(models, options) {
        methods.collectionDelta(this, models, options);
    };
};

// In the browser, automatically extend Backbone.js.
if (typeof(window) !== 'undefined' && window.Backbone) {
    BBDelta.extend(window.Backbone);
}

})();
