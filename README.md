domino.css
==========

DominoCSS is a lightweight JavaScript library that gives CSS the power to mutate the DOM by extending it with new rules. DominoCSS makes it possible for developers to write more semantic HTML by moving element nesting/ordering instructions (which *do* affect presentation) out of HTML and into CSS.

It's really easy to get started with DominoCSS:

**styles.css**:

```css
.container {
    width: 800px;
    margin: 0 auto;
}

.title {
    color: red;
    -domino-order: 0;
    -domino-container: .container;
}

article {
    font-size: 11pt;
    -domino-order: 100;
    -domino-container: .container;
}
```

**page.html**:

```html
<!DOCTYPE html>
<html>
    <head>
        <title>Using DominoCSS is Easy!</title>

        <!-- Reference the stylesheet like normal. -->
        <link rel="stylesheet" href="./styles.css">

        <script src="./node_modules/domino.css/dist/domino-css.min.js"></script>
    </head>
    <body>
        <!-- ==============CONTENT============== -->
        <article>
            <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vitae justo quis mi
                efficitur viverra. Aenean nisi nisl, blandit quis nisi a, convallis consectetur tortor.
                Donec tincidunt mauris sit amet risus ultrices lobortis. Pellentesque ut massa porttitor,
                pharetra nunc bibendum, euismod tortor. Fusce eget ornare metus. Nullam sodales, turpis
                eu imperdiet condimentum, turpis lectus gravida massa, ac facilisis dui nulla at dui.
                Donec aliquam ex non nibh scelerisque, in viverra diam sollicitudin.
            </p>
        </article>

        <h1 class="title">Lorem Ipsum RULES.</h1>

        <!-- =============CONTAINERS============= -->
        <div class="contianer"></div>
        
        <!-- bootstrap domino -->
        <script>window.dominoCSS.bootstrap(document.documentElement);</script>
    </body>
</html>
```

Install
-------
```bash
$> npm install domino.css --save
```

### With a `<script>` Tag
```html
<script src="./node_modules/domino.css/dist/domino-css.min.js"></script>
<script>window.dominoCSS.bootstrap(document.documentElement);</script>
```

### With [RequireJS](http://requirejs.org/) (AMD)
```javascript
define(['node_modules/domino.css/dist/domino-css.min.js'], function(dominoCSS) {
    dominoCSS.bootstrap(document.documentElement);
});
```

### With [Browserify](http://browserify.org/) (CommonJS)
```javascript
var dominoCSS = require('domino.css');

dominoCSS.bootstrap(document.documentElement);
```

CSS Rules
---------
Currently, DominoCSS extends CSS with two new rules.

1. `-domino-container`: This rule specifies an element's (or multiple elements') container. The value should
    be a valid CSS selector. At runtime, DominoCSS will move all elements matching the main selector into the
    *first* element matching the valueof `-domino-container`.

    ```css
    .content {
        /* Move all elements matching ".content" into the first element matching "div.main-container" */
        -domino-container: div.main-container;
    }
    ```
2. `-domino-order`: This rule specifies an element's (or multiple elements') position(s) realitive to
    its/their siblings. The value can be any integer (positive or negative.) At runtime, DominoCSS will
    reorder sibling elements according to their `-domino-order` (with lower values at the top of the
    list.)

    ```css
    .first {
        -domino-order: 0;
        -domino-container: main;
    }
    .second {
        -domino-order: 100;
        -domino-container: main;
    }
    .third {
        -domino-order: 200;
        -domino-order: main;
    }
    .irrelevant {
        -domino-order: 150;
        -domino-container: .some-other-element;
    }

    /*
    Because they are all siblings (as specified by -domino-contianer,) .first, .second and .third
    will be moved in the DOM to be in that order. Because .irrelevant has a different parent (and
    is therefore in a different ordering context,) it does not factor into the ordering of the
    other three elements.
    */
    ```

### Media Queries
One of DominoCSS' most powerful features is its support for media queries. Using normal CSS media
queries combined with `-domino-` rules it is easy to change element ordering/nesting based on
screen/device dimensions/orientation/etc.

Use in Production
-----------------
To improve performance in production, it makes sense to pre-compile CSS files into DominoCSS
instructions.

1. Install `domino.css` globally:

    ```bash
    $> npm install -g domino.css
    ```
2. Use the `domino-css` CLI tool to pre-compile CSS:

    ```bash
    $> domino-css < ./path/to/styles.css > ./styles.css.domino.js
    ```
3. Add the compiled JavaScript file after the CSS in your page:

    ```html
    <link rel="stylesheet" href="./path/to/styles.css">
    <script src="./styles.css.domino.js"></script>
    ```
4. Bootstrap DominoCSS with the runtime library:
    * With a `<script>` tag:

        ```html
        <script src="./node_modules/domino.css/dist/domino-css--runtime.min.js"></script>
        <script>window.dominoCSS.bootstrap(document.documentElement);
        ```
    * With [RequireJS](http://requirejs.org/) (AMD)

        ```javascript
        define(['./node_modules/domino.css/dist/domino-css--runtime.min.js'], function(dominoCSS) {
            dominoCSS.bootstrap(document.documentElement);
        });
        ```
    * With [Browserify](http://browserify.org/) (CommonJS)

        ```javascript
        var dominoCSS = require('domino.css/runtime');

        dominoCSS.bootstrap(document.documentElement);
        ```

API
----
The `dominoCSS` `Object` exposes the following `Function`s:

* **parse(`String`:*stylesheet*): `Object`**: Accepts a `String` of CSS and returns an `Object` in
    DominoCSS rules format. That format looks like this:

    ```json
    {
        "rules": {
            "container": [
                { "selector": ".content", "value": ".div.container" }
            ],
            "order": [
                { "selector": ".first", "value": 200 }
            ]
        },
        "mediaQueries": [
            {
                "directive": "only screen and (min-width: 768px)",
                "rules": {
                    "container": [
                        { "selector": ".content", "value": ".mobile-container" }
                    ],
                    "order": [
                        { "selector": ".first", "value": -1000 }
                    ]
                }
            }
        ]
    }
    ```

    **NOTE:** Parsing is not available in the DominoCSS runtime library. Attempting to call
    `dominoCSS.parse()` will throw an `Error`.
* **applyRules(`Object`:*rules*, `Element`:*element*)**: Accepts an `Object` in the DominoCSS
    rules format and applies those rules to the provided `element`.
* **bootstrap(`Element`:*element*): `Function`**: Finds DominoCSS rules and applies them to the
    provided `element`. Returns a `Function` that, when called, will re-apply the found rules
    to the `element`. This `Function` also sets up a resize handler on the `element`'s `Window`
    that re-applies styles so that media queries work as expected.

    This `Function` has different methods for getting the DominoCSS rules depending if the full
    or runtime library is being used.

    **In the full library**:

    1. The text of any `<style>` element and the text of any external `<link>`ed stylesheets
        (fetched via XHR) is retrieved.
    2. The text of each element is parsed into DominoCSS rules.
    3. The rules are combined (respecting the order of the `<link>`s/`<style>`s in the DOM.)
    4. The rules are applied to the `element`.

    **In the runtime library**:

    1. Rules are retrieved from a global `__dominoCSSRules__` `Array` (created and added to
        by the compiled CSS rules scripts.)
    2. The rules are combined (respecting the order of the `__dominoCSSRules__` `Array`,
        which will reflect the order of `<script>`s in the DOM.)
    3. The rules are applied to the `element`.

Developing
----------
First, clone the repository:

```bash
$> git clone git@github.com:cinema6/domino.css.git
```

Then, install dependencies:

```bash
$> npm install
```

### Run Unit Tests:
This runs unit tests a single time (using [Karma](https://karma-runner.github.io/0.13/index.html)
and [PhantomJS](http://phantomjs.org/).)

```bash
$> npm test
```

### Start an Example Server:
This starts a webserver on port `8000` that serves out of the "examples" directory. It uses
[livereload](https://www.npmjs.com/package/livereload) to automatically refresh the page
whenever a file changes.

```bash
$> npm run examples
```

### Start a Test-Driven-Development Runner
This starts a process that will automatically run unit tests whenever a file changes.

```bash
$> npm run tdd
```

### Build The Library
This uses [Browserify](http://browserify.org/) and [UglifyJS2](https://github.com/mishoo/UglifyJS2)
to build a [UMD](https://github.com/umdjs/umd) of DominoCSS (both full and runtime, with
minified counterparts) into the "dist" directory.