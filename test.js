var test = require('tap').test;

var _ = require('underscore');
var Backbone = require('backbone');
require('./').extend(Backbone);

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
    t.plan(7);

    var model = new Backbone.Model();

    expectEvent(t, model, 'change:foo', function() {
        t.ok(model.reset({ foo: 5 }), "add first attribute");
    });

    expectEvent(t, model, 'change:bar', function() {
        t.ok(model.reset({ foo: 5, bar: 8 }), "add second attribute");
    });

    expectEvent(t, model, 'change:foo', function() {
        t.ok(model.reset({ bar: 8 }), "remove first attribute");
    });

    t.notOk(_.has(model.attributes, 'foo'), 'attribute should be deleted');
});

test('collectionDelta', function(t) {
    t.plan(10);

    var collection = new Backbone.Collection();

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
});
