var test = require('tap').test;

var _ = require('underscore');
var Backbone = require('backbone');
var BBDelta = require('./').inherit(Backbone);

function expectEvent(t, obj, name, block) {
    var seen = false;
    var handler = function() {
        seen = true;
    };

    obj.on(name, handler);
    block();
    obj.off(name, handler);

    t.ok(seen, 'expect event ' + name);
}

test('resetModel', function(t) {
    t.plan(10);

    var model = new BBDelta.Model();

    expectEvent(t, model, 'change:foo', function() {
        t.ok(model.reset({ foo: 5 }), "add first attribute");
    });

    expectEvent(t, model, 'change:bar', function() {
        t.ok(model.reset({ foo: 5, bar: 8 }), "add second attribute");
    });

    expectEvent(t, model, 'change:foo', function() {
        t.ok(model.reset({ bar: 8 }), "remove first attribute");
        t.notOk(_.has(model.attributes, 'foo'), "attr should be deleted");
    });

    expectEvent(t, model, 'change:bar', function() {
        model.sync = function(method, model, options) {
            options.success({});
        };

        model.fetch({ reset: false });
        t.ok(_.has(model.attributes, 'bar'), "fetch & set keeps attr");

        model.fetch({ reset: true });
        t.notOk(_.has(model.attributes, 'bar'), "fetch & reset deletes attr");
    });

});

test('collectionDelta', function(t) {
    t.plan(11);

    var collection = new BBDelta.Collection();

    expectEvent(t, collection, 'reset', function() {
        t.ok(collection.delta([
            { id: 5 }
        ]), "add first model");
    });

    expectEvent(t, collection, 'add', function() {
        t.ok(collection.delta([
            { id: 5 },
            { id: 8 }
        ]), "add second model");
    });

    expectEvent(t, collection, 'change', function() {
        t.ok(collection.delta([
            { id: 5, foo: 'bar' },
            { id: 8 }
        ]), "change first model");
    });

    expectEvent(t, collection, 'remove', function() {
        t.ok(collection.delta([
            { id: 8 }
        ]), "remove first model");
    });

    expectEvent(t, collection, 'reset', function() {
        t.ok(collection.delta([
            { id: 3 }
        ]), "replace contents");
    });

    expectEvent(t, collection, 'add', function() {
        collection.sync = function(method, collection, options) {
            options.success([
                { id: 3 },
                { id: 7 }
            ]);
        };

        collection.fetch({ delta: true });
    });
});
