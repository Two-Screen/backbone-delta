## Backbone-delta [![Build Status](https://secure.travis-ci.org/Two-Screen/backbone-delta.png)](http://travis-ci.org/Two-Screen/backbone-delta)

A couple of extra methods for [Backbone.js], related to changing models
and collections.

 * `Backbone.Model#reset` resets attributes of the model, also unsetting
    attributes that no longer exist, and triggers a single `set` event.

 * `Backbone.Collection#delta` resets a collection, and triggers several
   `add`, `remove`, and `change` events, but falls back to a normal
   `reset` when the contents has changed completely.

MIT licensed.

 [Backbone.js]: http://documentcloud.github.com/backbone/

### From the browser

Include [`backbone-delta.js`] or the minified version [`backbone-delta.min.js`]
in your page. If Backbone.js is loaded, it will automatically be extended.

 [`backbone-delta.js`]: https://raw.github.com/Two-Screen/backbone-delta/master/backbone-delta.js
 [`backbone-delta.min.js`]: https://raw.github.com/Two-Screen/backbone-delta/master/backbone-delta.min.js

### From Node.js

Install using NPM:

    npm install backbone-delta

In your code:

    var Backbone = require('backbone');
    require('backbone-delta').extend(Backbone);

### Hacking the code

    git clone https://github.com/Two-Screen/backbone-delta.git
    cd backbone-delta
    npm install
    npm test
