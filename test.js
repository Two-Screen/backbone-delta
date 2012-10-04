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
    t.plan(4);

    var model = new Backbone.Model();

    expectEvent(t, model, 'change:foo', function() {
        model.reset({ foo: 5 });
    });

    expectEvent(t, model, 'change:bar', function() {
        model.reset({ foo: 5, bar: 8 });
    });

    expectEvent(t, model, 'change:foo', function() {
        model.reset({ bar: 8 });
    });

    t.notOk(_.has(model.attributes, 'foo'), 'attribute should be deleted');
});

test('collectionDelta', function(t) {
    t.plan(5);

    var collection = new Backbone.Collection();

    expectEvent(t, collection, 'reset', function() {
        collection.delta([
            { id: 5 }
        ]);
    });

    expectEvent(t, collection, 'add', function() {
        collection.delta([
            { id: 5 },
            { id: 8 }
        ]);
    });

    expectEvent(t, collection, 'change', function() {
        collection.delta([
            { id: 5, foo: 'bar' },
            { id: 8 }
        ]);
    });

    expectEvent(t, collection, 'remove', function() {
        collection.delta([
            { id: 8 }
        ]);
    });

    expectEvent(t, collection, 'reset', function() {
        collection.delta([
            { id: 3 }
        ]);
    });
});
